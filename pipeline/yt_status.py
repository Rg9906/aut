"""Print privacy/upload/processing status for video ids: python pipeline/yt_status.py id1 id2 ..."""
import os, sys, json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                    client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
yt = build("youtube", "v3", credentials=creds)
r = yt.videos().list(part="status,snippet,statistics,processingDetails", id=",".join(sys.argv[1:])).execute()
for it in r.get("items", []):
    print(json.dumps({"id": it["id"], "title": it["snippet"]["title"], "status": it["status"], "stats": it.get("statistics"), "processing": it.get("processingDetails")}, indent=1))
