# AutoChannel

Autonomous, anti-slop YouTube Shorts pipeline. See `PLAN.md` for the full design.

## Format
Each video is a short sketch: **Byte** (excitable teal blob) interrogates **Compy** (smug CRT monitor). Script v2 fields (speaker, emotions, sfx, fx, stickers, visual) are documented at the top of `pipeline/tts.py`.

## Quick start
```bash
bash scripts/setup.sh                      # models + deps
bash scripts/make.sh queue/2026-11-20-float-sketch.json
# -> out/<id>/final.mp4 (+ qc.json)
```
Needs: Python 3.10+, Node 20+, ffmpeg, Chrome/Chromium (set CHROME_BIN if not at /usr/bin/google-chrome).

## Layout
- `queue/*.json`   scripts written by the weekly "manager" (Claude). One file = one video.
- `pipeline/tts.py` Kokoro voice + scene/word timings -> `out/<id>/props.json`
- `remotion/`      scene library, captions, brand kit (`src/theme.ts`), render entrypoint
- `pipeline/qc.py` QC gate + loudness normalize (-14 LUFS)
- `pipeline/next.py` picks next unpublished script
- `.github/workflows/daily.yml` free daily cron (upload step is Phase 2)
- `state/` published list, analytics, PAUSE kill switch

## Add a new scene type
Add a component in `remotion/src/scenes.tsx`, extend the `Visual` union, handle it in `SceneVisual`.
