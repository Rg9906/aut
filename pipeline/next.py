"""Print the next unpublished queue script path (empty string if none)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
published_file = ROOT / "state" / "published.json"
published = set(json.loads(published_file.read_text())) if published_file.exists() else set()

for p in sorted((ROOT / "queue").glob("*.json")):
    if json.loads(p.read_text())["id"] not in published:
        print(p.relative_to(ROOT))
        break
