"""Set videos private and verify: python pipeline/set_private.py id1 [id2 ...]"""
import os, sys
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                    client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
yt = build("youtube", "v3", credentials=creds)
bad = 0
for vid in sys.argv[1:]:
    r = yt.videos().update(part="status", body={"id": vid, "status": {"privacyStatus": "private", "selfDeclaredMadeForKids": False}}).execute()
    print("update response:", vid, r.get("status"))
    now = yt.videos().list(part="status", id=vid).execute()["items"][0]["status"]["privacyStatus"]
    print("verified:", vid, now)
    bad += now != "private"
sys.exit(1 if bad else 0)
