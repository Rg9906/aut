"""Upload a hand-made special: python pipeline/upload_special.py specials/<slug>
Folder holds final.mp4 + meta.json (title, description, tags, categoryId, containsSyntheticMedia).
Env: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN, PRIVACY. Respects state/PAUSE. Skips if already uploaded."""
import json, os, sys
from pathlib import Path
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

ROOT = Path(__file__).resolve().parent.parent


def main(folder):
    d = ROOT / folder
    slug = d.name
    if (ROOT / "state" / "PAUSE").exists():
        print("PAUSE file present, not publishing"); return 0
    rec = ROOT / "state" / f"video_special_{slug}.json"
    if rec.exists():
        print("already uploaded:", rec.read_text()); return 0
    meta = json.loads((d / "meta.json").read_text())
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
    yt = build("youtube", "v3", credentials=creds)
    old = os.environ.get("MAKE_PRIVATE", "").strip()
    if old:
        cur = yt.videos().list(part="status", id=old).execute()["items"]
        if cur:
            st = cur[0]["status"]
            st["privacyStatus"] = "private"
            yt.videos().update(part="status", body={"id": old, "status": st}).execute()
            print("set private:", old)
    body = {
        "snippet": {"title": meta["title"][:100], "description": meta["description"][:5000], "tags": meta.get("tags", []), "categoryId": meta.get("categoryId", "27")},
        "status": {"privacyStatus": meta.get("privacy") or os.environ.get("PRIVACY", "private"), "selfDeclaredMadeForKids": False,
                   "containsSyntheticMedia": bool(meta.get("containsSyntheticMedia", False))},
    }
    media = MediaFileUpload(str(d / "final.mp4"), mimetype="video/mp4", chunksize=8 * 1024 * 1024, resumable=True)
    req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    resp = None
    while resp is None:
        status, resp = req.next_chunk()
        if status: print(f"uploaded {int(status.progress() * 100)}%")
    vid = resp["id"]
    th = d / meta.get("thumbnail", "thumb.jpg")
    if th.exists():
        try:
            yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(str(th), mimetype="image/jpeg")).execute()
            print("thumbnail set")
        except Exception as e:  # e.g. channel not verified for custom thumbnails
            print("thumbnail FAILED:", e)
    print("video id:", vid, "privacy:", body["status"]["privacyStatus"], f"https://youtube.com/shorts/{vid}")
    rec.write_text(json.dumps({"youtube_id": vid}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
