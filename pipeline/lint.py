"""Fast pre-flight check for queue scripts (no rendering). Usage: python3 pipeline/lint.py [queue/*.json ...]
Catches what would make the daily build fail, so a bad script never blocks the queue."""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TYPES = {"titleCard", "agenda", "recap", "endCard", "bigText", "terminal", "code", "compare"}
KINDS = {"cmd", "out", "err", "hl"}
EMOS = {"neutral", "happy", "shocked", "angry", "confused", "thinking", "smug", "sad"}


def lint(p):
    errs = []
    try:
        d = json.loads(Path(p).read_text())
    except Exception as e:
        return [f"bad json: {e}"]
    for k in ("id", "series", "title", "description", "angle", "hook", "speakers", "scenes", "claims", "episode"):
        if k not in d:
            errs.append(f"missing {k}")
    if errs:
        return errs
    if d["id"] != Path(p).stem:
        errs.append("id must equal filename")
    sc = d["scenes"]
    words = sum(len(s["narration"].split()) for s in sc)
    est = words / 3.0
    if not 34 <= est <= 56:
        errs.append(f"estimated length {est:.0f}s (want 34-56)")
    types = [(s.get("visual") or {}).get("type") for s in sc]
    for t in types:
        if t not in TYPES:
            errs.append(f"unknown visual {t}")
    if types and types[0] != "titleCard": errs.append("first scene must be titleCard")
    if "agenda" not in types[:3]: errs.append("agenda must be in first 3 scenes")
    if "recap" not in types[-3:]: errs.append("recap must be in last 3 scenes")
    if types and types[-1] != "endCard": errs.append("last scene must be endCard")
    if any(types[i] == types[i+1] == types[i+2] for i in range(len(types) - 2)): errs.append("3 same visuals in a row")
    for i, s in enumerate(sc):
        if s["speaker"] not in d["speakers"]: errs.append(f"scene {i}: unknown speaker")
        for who, e in s.get("emotions", {}).items():
            if e not in EMOS: errs.append(f"scene {i}: unknown emotion {e}")
        v = s.get("visual") or {}
        if v.get("type") == "terminal":
            for ln in v["props"]["lines"]:
                if ln.get("kind") not in KINDS: errs.append(f"scene {i}: bad terminal kind")
        if len(s["narration"].split()) > 22: errs.append(f"scene {i}: narration too long (>22 words)")
    if len(d["title"]) > 100: errs.append("title too long")
    if len(d["angle"].split()) < 8: errs.append("angle too short")
    if not d["claims"] or any(not str(c.get("source", "")).startswith("http") for c in d["claims"]): errs.append("claims need http sources")
    return errs


if __name__ == "__main__":
    files = sys.argv[1:] or sorted(str(p) for p in (ROOT / "queue").glob("*.json"))
    bad = 0
    for f in files:
        e = lint(f)
        print(("OK   " if not e else "FAIL ") + f + ("" if not e else "  " + "; ".join(e)))
        bad += bool(e)
    sys.exit(1 if bad else 0)
