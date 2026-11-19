"""Per-channel paths. The original channel lives at the repo root (slug "main"),
extra channels live in channels/<slug>/{channel.json,queue/,state/}.

Select with the CHANNEL env var (empty or "main" = the original channel).
"""
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def slug():
    s = os.environ.get("CHANNEL", "").strip()
    return "main" if s in ("", "main") else s


def channel_dir(s=None):
    s = s or slug()
    return ROOT if s == "main" else ROOT / "channels" / s


def queue_dir(s=None):
    return channel_dir(s) / "queue"


def state_dir(s=None):
    return channel_dir(s) / "state"


def secret_name(s=None):
    s = s or slug()
    return "YT_REFRESH_TOKEN" if s == "main" else "YT_REFRESH_TOKEN_" + re.sub(r"[^A-Za-z0-9]", "_", s).upper()


def paused(s=None):
    """Global kill switch (root state/PAUSE) or per-channel one."""
    return (ROOT / "state" / "PAUSE").exists() or (state_dir(s) / "PAUSE").exists()


def all_channels():
    out = [{"slug": "main", "secret": secret_name("main")}]
    for p in sorted((ROOT / "channels").glob("*/channel.json")) if (ROOT / "channels").exists() else []:
        s = p.parent.name
        if json.loads(p.read_text()).get("enabled", True):
            out.append({"slug": s, "secret": secret_name(s)})
    return out


if __name__ == "__main__":  # used by the workflow to build the matrix
    print(json.dumps({"include": all_channels()}))
