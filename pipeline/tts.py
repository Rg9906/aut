"""Script JSON -> audio.wav (dialogue + SFX) + props.json for Remotion.

Usage: python pipeline/tts.py queue/<id>.json

Script v2 fields per scene:
  speaker   : key into script["speakers"] (e.g. "byte" / "compy")
  narration : spoken line
  emotions  : {"byte": "...", "compy": "..."}   (facial expressions)
  sfx       : [{"t": seconds, "name": "pop|buzz|ding|boom|boing|scratch|sparkle|whoosh"}]
              t >= 0 is offset from scene start, t < 0 is offset from end of speech
  fx        : [{"t": seconds, "type": "shake|zoom"}]
  stickers  : [{"type": "burst|qmarks|sweat|exclaim", "text": "", "t": 0.2, "x": 540, "y": 700}]
  visual    : card to show (or null)
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sfx  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SR = 24000
FPS = 30
GAP_SEC = 0.16
PAUSE_BONUS = 3

DEFAULT_SPEAKERS = {
    "byte": {"voice": "af_heart", "speed": 1.08},
    "compy": {"voice": "bm_george", "speed": 0.98},
}

# gentle polish: rumble cut, compression, presence, a hint of room
VOICE_FX = (
    "highpass=f=85,"
    "acompressor=threshold=-20dB:ratio=3:attack=5:release=90:makeup=3,"
    "equalizer=f=3200:t=q:w=1.0:g=2.5,"
    "aecho=0.9:0.9:28:0.10"
)


def trim_silence(x, thresh=0.01, keep=0.04):
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    k = int(keep * SR)
    return x[max(idx[0] - k, 0): min(idx[-1] + k, len(x))]


def word_timing(text, t0, dur):
    toks = text.split()
    chars = [max(len(re.sub(r"\W", "", w)), 1) for w in toks]
    bonus = [PAUSE_BONUS if re.search(r"[,.:;?!…]$", w) else 0 for w in toks]
    total = sum(c + b for c, b in zip(chars, bonus))
    out, t = [], t0
    for w, c, b in zip(toks, chars, bonus):
        slot = dur * (c + b) / total
        spoken = slot * c / (c + b)
        out.append({"w": w, "start": round(t, 3), "end": round(t + spoken, 3)})
        t += slot
    return out


def mouth_envelope(samples):
    """0..1 openness per video frame from RMS energy (for lip-sync)."""
    hop = SR // FPS
    n = int(np.ceil(len(samples) / hop))
    env = np.zeros(n)
    for i in range(n):
        seg = samples[i * hop:(i + 1) * hop]
        env[i] = np.sqrt(np.mean(seg ** 2)) if len(seg) else 0.0
    peak = np.percentile(env, 95) or 1.0
    env = np.clip(env / peak, 0, 1) ** 0.8
    # light smoothing so the mouth doesn't flicker
    sm = np.convolve(env, [0.25, 0.5, 0.25], mode="same")
    return [round(float(v), 3) for v in sm]


def add_at(buf, clip, t_sec, gain=1.0):
    s = int(t_sec * SR)
    if s < 0 or s >= len(buf):
        return
    e = min(len(buf), s + len(clip))
    buf[s:e] += clip[: e - s] * gain


def main(script_path):
    script = json.loads(Path(script_path).read_text())
    out_dir = ROOT / "out" / script["id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    speakers = {**DEFAULT_SPEAKERS, **script.get("speakers", {})}

    kokoro = Kokoro(
        str(ROOT / "assets/models/kokoro-v1.0.int8.onnx"),
        str(ROOT / "assets/models/voices-v1.0.bin"),
    )

    chunks, scenes, t = [], [], 0.0
    gap = np.zeros(int(GAP_SEC * SR), dtype=np.float32)
    for sc in script["scenes"]:
        who = sc.get("speaker", "byte")
        sp = speakers[who]
        speed = sc.get("speed", sp["speed"])
        samples, sr = kokoro.create(sc["narration"], voice=sp["voice"], speed=speed, lang="en-us")
        assert sr == SR, f"unexpected sample rate {sr}"
        samples = trim_silence(samples.astype(np.float32))
        dur = len(samples) / SR
        scenes.append({
            "start": round(t, 3),
            "narrationEnd": round(t + dur, 3),
            "speaker": who,
            "emotions": {"byte": "neutral", "compy": "neutral", **sc.get("emotions", {})},
            "visual": sc.get("visual"),
            "words": word_timing(sc["narration"], t, dur),
            "mouth": mouth_envelope(samples),
            "fx": sc.get("fx", []),
            "stickers": sc.get("stickers", []),
            "sfx": sc.get("sfx", []),
        })
        chunks += [samples, gap]
        t += dur + GAP_SEC

    voice = np.concatenate(chunks)
    voice = voice / (float(np.max(np.abs(voice))) or 1.0) * 0.9
    total = len(voice) / SR

    raw, fxd = out_dir / "voice_raw.wav", out_dir / "voice_fx.wav"
    sf.write(raw, voice, SR)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw), "-af", VOICE_FX, str(fxd)],
                       capture_output=True, text=True)
    if r.returncode == 0:
        voice, _ = sf.read(fxd, dtype="float32")
        voice = voice / (float(np.max(np.abs(voice))) or 1.0) * 0.9
    else:
        print("voice fx failed, using raw:", r.stderr[-200:])

    # SFX bed: auto whoosh on scene changes + scripted cues
    bed = np.zeros(len(voice) + SR, dtype=np.float32)
    for i, s in enumerate(scenes):
        if i > 0:
            add_at(bed, sfx.get("whoosh"), s["start"] - 0.05, 0.9)
        for cue in s["sfx"]:
            tt = cue["t"]
            at = s["start"] + tt if tt >= 0 else s["narrationEnd"] + tt
            add_at(bed, sfx.get(cue["name"]), at, cue.get("gain", 1.0))
    mix = np.zeros(len(bed), dtype=np.float32)
    mix[: len(voice)] += voice
    mix += bed
    mix = mix / max(1.0, float(np.max(np.abs(mix))) / 0.92)

    audio_path = out_dir / "audio.wav"
    sf.write(audio_path, mix[: int((total + 0.6) * SR)], SR)

    for i, sc in enumerate(scenes):
        sc["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else round(total + 0.6, 3)
        sc.pop("sfx")

    public = ROOT / "remotion" / "public"
    public.mkdir(parents=True, exist_ok=True)
    shutil.copy(audio_path, public / f"{script['id']}.wav")

    props = {
        "id": script["id"],
        "series": script.get("series", ""),
        "episode": script.get("episode"),
        "audio": f"{script['id']}.wav",
        "totalSec": round(total + 0.6, 3),
        "scenes": scenes,
    }
    (out_dir / "props.json").write_text(json.dumps(props, ensure_ascii=False))
    print(f"ok {script['id']}: {total:.1f}s, {len(scenes)} scenes -> {out_dir}")


if __name__ == "__main__":
    main(sys.argv[1])
