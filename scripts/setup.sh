#!/usr/bin/env bash
# One-shot setup for local dev or a fresh CI runner.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p assets/models
REL=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f assets/models/kokoro-v1.0.int8.onnx ] || curl -L -o assets/models/kokoro-v1.0.int8.onnx "$REL/kokoro-v1.0.int8.onnx"
[ -f assets/models/voices-v1.0.bin ]       || curl -L -o assets/models/voices-v1.0.bin       "$REL/voices-v1.0.bin"

pip install -q kokoro-onnx soundfile numpy
(cd remotion && npm install --silent)
echo "setup ok"
