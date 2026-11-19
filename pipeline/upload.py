"""Upload a QC-passed video to YouTube.   (UNTESTED: needs real credentials)

Usage: python pipeline/upload.py queue/<id>.json
Env:   YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
       PRIVACY = private | unlisted | public   (default private = autonomy level L0)
Refuses to run if state/PAUSE exists or QC did not pass.
"""
import json
import os
import sys
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

ROOT = Path(__file__).resolve().parent.parent
TOKEN_URI = "https://oauth2.googleapis.com/token"


def main(script_path):
    if (ROOT / "state" / "PAUSE").exists():
        print("PAUSE file present, not publishing")
        return 0
    script = json.loads(Path(script_path).read_text())
    out = ROOT / "out" / script["id"]
    qc = json.loads((out / "qc.json").read_text())
    if not qc["pass"]:
        print("QC failed, not publishing:", qc["failed"])
        return 1

    creds = Credentials(
        None,
        refresh_token=os.environ["YT_REFRESH_TOKEN"],
        token_uri=TOKEN_URI,
        client_id=os.environ["YT_CLIENT_ID"],
        client_secret=os.environ["YT_CLIENT_SECRET"],
    )
    yt = build("youtube", "v3", credentials=creds)

    body = {
        "snippet": {
            "title": script["title"][:100],
            "description": script["description"],
            "tags": script.get("tags", []),
            "categoryId": "27",  # Education
        },
        "status": {
            "privacyStatus": os.environ.get("PRIVACY", "private"),
            "selfDeclaredMadeForKids": False,
            "containsSyntheticMedia": bool(script.get("contains_synthetic_media", True)),
        },
    }
    media = MediaFileUpload(str(out / "final.mp4"), mimetype="video/mp4", chunksize=8 * 1024 * 1024, resumable=True)
    req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    resp = None
    while resp is None:
        status, resp = req.next_chunk()
        if status:
            print(f"uploaded {int(status.progress() * 100)}%")

    vid = resp["id"]
    print("video id:", vid, "privacy:", body["status"]["privacyStatus"])

    pub_file = ROOT / "state" / "published.json"
    pub = json.loads(pub_file.read_text()) if pub_file.exists() else []
    pub.append(script["id"])
    pub_file.parent.mkdir(exist_ok=True)
    pub_file.write_text(json.dumps(pub, indent=2))
    (ROOT / "state" / f"video_{script['id']}.json").write_text(json.dumps({"youtube_id": vid}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
