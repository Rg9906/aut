"""Print the next unpublished queue script path (empty string if none)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
import sys
sys.path.insert(0, str(ROOT / "pipeline"))
from channel import queue_dir, state_dir, voice_file, voice_source

published_file = state_dir() / "published.json"
published = set(json.loads(published_file.read_text())) if published_file.exists() else set()

from lint import lint

for p in sorted(queue_dir().glob("*.json")):
    if json.loads(p.read_text())["id"] in published:
        continue
    sid = json.loads(p.read_text())["id"]
    if voice_source() == "human" and not voice_file(sid):
        print(f"SKIP {p.name}: waiting for your voice recording", file=sys.stderr)
        continue
    errs = lint(p)
    if errs:  # never let one bad script block the daily post
        print(f"SKIP {p.name}: {'; '.join(errs)}", file=sys.stderr)
        continue
    print(p.relative_to(ROOT))
    break
