#!/usr/bin/env bash
# Full local build of one queued script: voice -> render -> QC/finalize.
# Usage: scripts/make.sh queue/<id>.json
set -euo pipefail
cd "$(dirname "$0")/.."
SCRIPT="$1"
ID=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['id'])" "$SCRIPT")

python3 pipeline/tts.py "$SCRIPT"
(cd remotion && node render.mjs "../out/$ID/props.json" "../out/$ID/video.mp4")
python3 pipeline/qc.py "$SCRIPT" "out/$ID/video.mp4"
echo "final: out/$ID/final.mp4"
