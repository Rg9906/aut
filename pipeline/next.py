"""Print the next unpublished queue script path (empty string if none)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
published_file = ROOT / "state" / "published.json"
published = set(json.loads(published_file.read_text())) if published_file.exists() else set()

import sys
sys.path.insert(0, str(ROOT / "pipeline"))
from lint import lint

for p in sorted((ROOT / "queue").glob("*.json")):
    if json.loads(p.read_text())["id"] in published:
        continue
    errs = lint(p)
    if errs:  # never let one bad script block the daily post
        print(f"SKIP {p.name}: {'; '.join(errs)}", file=sys.stderr)
        continue
    print(p.relative_to(ROOT))
    break
