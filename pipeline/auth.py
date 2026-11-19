"""One-time local OAuth to obtain a YouTube refresh token.   (UNTESTED: needs real credentials)

Usage (on YOUR computer, not CI):
    pip install google-auth-oauthlib
    python pipeline/auth.py            # expects client_secret.json in the repo root,
                                       # OR set env vars YT_CLIENT_ID and YT_CLIENT_SECRET
Then add the printed values as GitHub Actions secrets.
Never commit client_secret.json or the token.
"""
import json
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
]

import os
secret = Path(__file__).resolve().parent.parent / "client_secret.json"
if os.environ.get("YT_CLIENT_ID") and os.environ.get("YT_CLIENT_SECRET"):
    # no JSON file needed: set these two env vars in your terminal first
    c = {"client_id": os.environ["YT_CLIENT_ID"], "client_secret": os.environ["YT_CLIENT_SECRET"]}
    flow = InstalledAppFlow.from_client_config(
        {"installed": {**c, "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                       "token_uri": "https://oauth2.googleapis.com/token",
                       "redirect_uris": ["http://localhost"]}}, SCOPES)
else:
    flow = InstalledAppFlow.from_client_secrets_file(str(secret), SCOPES)
    info = json.loads(secret.read_text())
    c = info.get("installed") or info.get("web")
creds = flow.run_local_server(port=0, access_type="offline", prompt="consent")
print("\nAdd these as GitHub Actions secrets:\n")
print("YT_CLIENT_ID     =", c["client_id"])
print("YT_CLIENT_SECRET =", c["client_secret"])
print("YT_REFRESH_TOKEN =", creds.refresh_token)
