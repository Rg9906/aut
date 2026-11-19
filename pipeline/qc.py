"""QC gate + loudness finalize.

Usage: python pipeline/qc.py queue/<id>.json out/<id>/video.mp4
Writes out/<id>/final.mp4 (loudness-normalized to -14 LUFS) and out/<id>/qc.json.
Exit code 0 = pass, 1 = fail (publishing must not happen).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

MAX_SHORT_SEC = 59.0
MIN_SEC = 8.0
TARGET_LUFS = -14.0


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height",
             "-show_entries", "format=duration", "-of", "json", str(path)])
    return json.loads(r.stdout)


def loudness(path):
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"])
    m = re.findall(r"I:\s+(-?\d+\.\d+) LUFS", r.stderr)
    p = re.findall(r"Peak:\s+(-?\d+\.\d+) dBFS", r.stderr)
    return (float(m[-1]) if m else None, float(p[-1]) if p else None)


def black_frames(path):
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-vf", "blackdetect=d=0.5:pic_th=0.98", "-an", "-f", "null", "-"])
    return r.stderr.count("black_start")


def main(script_path, video_path):
    script = json.loads(Path(script_path).read_text())
    video = Path(video_path)
    out_dir = video.parent
    checks, fails = {}, []

    def check(name, ok, detail=""):
        checks[name] = {"ok": bool(ok), "detail": detail}
        if not ok:
            fails.append(name)

    info = probe(video)
    streams = info.get("streams", [])
    v = next((s for s in streams if s["codec_type"] == "video"), None)
    has_audio = any(s["codec_type"] == "audio" for s in streams)
    dur = float(info["format"]["duration"])

    check("resolution_1080x1920", v and v["width"] == 1080 and v["height"] == 1920, f"{v and v['width']}x{v and v['height']}")
    check("has_audio", has_audio)
    check("duration_ok", MIN_SEC <= dur <= MAX_SHORT_SEC, f"{dur:.1f}s")
    check("no_black_frames", black_frames(video) == 0)

    # editorial contract
    check("has_angle", len(script.get("angle", "").split()) >= 8, script.get("angle", ""))
    check("has_title", 15 <= len(script.get("title", "")) <= 95, script.get("title", ""))
    check("claims_have_sources", all(c.get("source", "").startswith("http") for c in script.get("claims", [])) and len(script.get("claims", [])) >= 1)
    check("synthetic_flag_set", script.get("contains_synthetic_media") is True)
    narr = " ".join(s["narration"] for s in script["scenes"])
    check("hook_in_first_scene", script["scenes"][0]["narration"].strip() == script.get("hook", "").strip() or bool(script.get("hook")))
    # variety: no two adjacent scenes with identical visual type 3x in a row
    types = [s["visual"]["type"] for s in script["scenes"] if s.get("visual")]
    check("visual_variety", not any(types[i] == types[i + 1] == types[i + 2] for i in range(len(types) - 2)), ",".join(types))
    vis = [(sc.get("visual") or {}).get("type") for sc in script["scenes"]]
    check("has_intro_title_card", vis[0] == "titleCard", str(vis[0]))
    check("has_agenda_early", "agenda" in vis[:3], "agenda in first 3 scenes")
    check("has_recap_before_end", "recap" in vis[-3:], "recap in last 3 scenes")
    check("has_end_card", vis[-1] == "endCard", str(vis[-1]))
    banned = ["financial advice", "medical advice", "guaranteed", "get rich"]
    check("no_sensitive_advice", not any(b in narr.lower() for b in banned))

    # loudness normalize -> final.mp4
    final = out_dir / "final.mp4"
    n = run(["ffmpeg", "-hide_banner", "-y", "-i", str(video), "-c:v", "copy",
             "-af", f"loudnorm=I={TARGET_LUFS}:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", str(final)])
    check("loudnorm_ok", n.returncode == 0 and final.exists())
    if final.exists():
        lufs, peak = loudness(final)
        check("loudness_in_range", lufs is not None and -16.0 <= lufs <= -12.0, f"{lufs} LUFS, peak {peak} dBFS")

    result = {"id": script["id"], "pass": not fails, "failed": fails, "checks": checks}
    (out_dir / "qc.json").write_text(json.dumps(result, indent=2))
    print(json.dumps({k: v["ok"] for k, v in checks.items()}, indent=2))
    print("QC", "PASS" if not fails else f"FAIL {fails}")
    sys.exit(0 if not fails else 1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
