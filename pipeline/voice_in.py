"""Your recorded voice + script JSON -> out/<id>/audio.wav + props.json for Remotion.

Usage: python pipeline/voice_in.py <script.json> <your-recording> [--words words.json]
Env:   CHANNEL (see channel.py), WHISPER_MODEL (default base.en)

Same output as tts.py, but the voice is yours. How it works:
  1. Whisper (faster-whisper, free, CPU) transcribes the recording with word timestamps.
  2. The heard words are aligned to the words you were supposed to read (the script),
     so every scripted word gets a time even if Whisper mishears or you stumble a bit.
  3. Scene boundaries, captions and lip-sync come from those times; SFX are mixed in as usual.

Modes (script["voice_mode"] or channel.json "voice_mode"):
  dual      you read both characters; each scene's lines lip-sync its own character (default)
  narrator  you read everything; one character talks, the other only reacts
Optional channel.json "voice_pitch": {"compy": -2} shifts that character's lines by N semitones
(dual mode) so two characters sound different even though both are you.

--words skips Whisper and reads a [{"w","start","end"}, ...] list (used for tests and offline runs).
"""
import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sfx  # noqa: E402
from channel import channel_dir, config  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SR = 24000
FPS = 30
PAD_BEFORE = 0.12  # a scene's visual appears slightly before its first word

# real voice: cut rumble, mild denoise, even out volume, add a little presence. No room echo.
VOICE_FX = (
    "highpass=f=80,"
    "afftdn=nf=-28,"
    "acompressor=threshold=-22dB:ratio=3:attack=5:release=120:makeup=4,"
    "equalizer=f=3000:t=q:w=1.0:g=2.0"
)


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def decode(path, out):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(path), "-ac", "1", "-ar", str(SR), str(out)],
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"could not read audio: {r.stderr[-300:]}")


def transcribe(path):
    from faster_whisper import WhisperModel

    model = WhisperModel(os.environ.get("WHISPER_MODEL", "base.en"), device="cpu", compute_type="int8")
    segs, _ = model.transcribe(str(path), language="en", word_timestamps=True, vad_filter=True, beam_size=5)
    words = []
    for s in segs:
        for w in s.words or []:
            words.append({"w": w.word.strip(), "start": float(w.start), "end": float(w.end)})
    return words


def align(script_words, heard):
    """Give every script word a (start, end). Matched words use Whisper's times; gaps are interpolated."""
    a = [norm(w) for w in script_words]
    b = [norm(h["w"]) for h in heard]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    t = [None] * len(a)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            h = heard[blk.b + k]
            t[blk.a + k] = (h["start"], h["end"])
    matched = sum(x is not None for x in t)
    if matched < max(3, int(0.5 * len(a))):
        raise SystemExit(f"only {matched}/{len(a)} script words were found in the recording. "
                         "Did you read the right script? Re-record or fix the script text.")
    # fill gaps by spreading the unmatched words evenly between their matched neighbours
    i = 0
    n = len(t)
    while i < n:
        if t[i] is not None:
            i += 1
            continue
        j = i
        while j < n and t[j] is None:
            j += 1
        lo = t[i - 1][1] if i > 0 else (t[j][0] - 0.3 * (j - i) if j < n else 0.0)
        hi = t[j][0] if j < n else lo + 0.3 * (j - i)
        lo = max(lo, 0.0)
        step = (hi - lo) / (j - i)
        for k in range(i, j):
            t[k] = (lo + (k - i) * step, lo + (k - i) * step + step * 0.85)
        i = j
    # enforce monotonic, non-overlapping times
    prev_end = 0.0
    out = []
    for s, e in t:
        s = max(s, prev_end)
        e = max(e, s + 0.04)
        out.append((s, e))
        prev_end = e
    return out, matched


def mouth_slice(x):
    from tts import mouth_envelope  # lazy: tts pulls in kokoro

    if len(x) < SR // FPS:
        return [0.0]
    env = mouth_envelope(x)
    return [v if v > 0.14 else 0.0 for v in env]  # gate room noise so the mouth rests in pauses


def pitch_shift(x, semitones):
    f = 2 ** (semitones / 12)
    with tempfile.TemporaryDirectory() as d:
        a, b = Path(d, "a.wav"), Path(d, "b.wav")
        sf.write(a, x, SR)
        r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(a), "-af",
                            f"asetrate={int(SR * f)},aresample={SR},atempo={1 / f:.5f}", str(b)], capture_output=True, text=True)
        if r.returncode != 0:
            return x
        y, _ = sf.read(b, dtype="float32")
    y = y[: len(x)] if len(y) >= len(x) else np.pad(y, (0, len(x) - len(y)))
    return y


def add_at(buf, clip, t_sec, gain=1.0):
    s = int(t_sec * SR)
    if s < 0 or s >= len(buf):
        return
    e = min(len(buf), s + len(clip))
    buf[s:e] += clip[: e - s] * gain


def main(script_path, audio_path, words_path=None):
    script = json.loads(Path(script_path).read_text())
    cfg = config()
    mode = script.get("voice_mode") or cfg.get("voice_mode") or "dual"
    pitch = cfg.get("voice_pitch", {}) if mode == "dual" else {}
    out_dir = ROOT / "out" / script["id"]
    out_dir.mkdir(parents=True, exist_ok=True)

    wav = out_dir / "voice_in.wav"
    decode(audio_path, wav)
    voice, _ = sf.read(wav, dtype="float32")
    if voice.ndim > 1:
        voice = voice.mean(axis=1)
    total = len(voice) / SR

    heard = json.loads(Path(words_path).read_text()) if words_path else transcribe(wav)
    if not heard:
        raise SystemExit("no speech found in the recording")

    # script words in order, remembering which scene each belongs to
    flat, owner = [], []
    for i, sc in enumerate(script["scenes"]):
        for w in sc["narration"].split():
            flat.append(w)
            owner.append(i)
    times, matched = align(flat, heard)
    print(f"aligned {matched}/{len(flat)} script words to the recording")

    n = len(script["scenes"])
    narr = []  # (first word start, last word end) per scene
    for i in range(n):
        ts = [times[k] for k in range(len(flat)) if owner[k] == i]
        narr.append((ts[0][0], ts[-1][1]))
    starts = [0.0] + [max(narr[i - 1][1], narr[i][0] - PAD_BEFORE) for i in range(1, n)]
    video_total = round(max(total, narr[-1][1]) + 0.6, 3)
    ends = starts[1:] + [video_total]

    scenes = []
    for i, sc in enumerate(script["scenes"]):
        who = "byte" if mode == "narrator" else sc.get("speaker", "byte")
        s0, s1 = starts[i], ends[i]
        seg = voice[int(s0 * SR): int(s1 * SR)]
        scenes.append({
            "start": round(s0, 3),
            "end": round(s1, 3),
            "narrationEnd": round(narr[i][1], 3),
            "speaker": who,
            "emotions": {"byte": "neutral", "compy": "neutral", **sc.get("emotions", {})},
            "visual": sc.get("visual"),
            "words": [{"w": flat[k], "start": round(times[k][0], 3), "end": round(times[k][1], 3)} for k in range(len(flat)) if owner[k] == i],
            "mouth": mouth_slice(seg),
            "fx": sc.get("fx", []),
            "stickers": sc.get("stickers", []),
            "_sfx": sc.get("sfx", []),
        })
        st = pitch.get(sc.get("speaker", "byte"))
        if st:
            voice[int(s0 * SR): int(s1 * SR)] = pitch_shift(seg, float(st))

    # polish the voice
    raw, fxd = out_dir / "voice_raw.wav", out_dir / "voice_fx.wav"
    sf.write(raw, voice, SR)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw), "-af", VOICE_FX, str(fxd)],
                       capture_output=True, text=True)
    if r.returncode == 0:
        voice, _ = sf.read(fxd, dtype="float32")
    else:
        print("voice fx failed, using raw:", r.stderr[-200:])
    voice = voice / (float(np.max(np.abs(voice))) or 1.0) * 0.9

    # SFX bed (same as tts.py): whoosh on scene changes + scripted cues
    bed = np.zeros(int(video_total * SR) + SR, dtype=np.float32)
    for i, s in enumerate(scenes):
        if i > 0:
            add_at(bed, sfx.get("whoosh"), s["start"] - 0.05, 0.9)
        for cue in s["_sfx"]:
            tt = cue["t"]
            at = s["start"] + tt if tt >= 0 else s["narrationEnd"] + tt
            add_at(bed, sfx.get(cue["name"]), at, cue.get("gain", 1.0))
        s.pop("_sfx")
    mix = np.zeros(len(bed), dtype=np.float32)
    mix[: len(voice)] += voice[: len(mix)]
    mix += bed
    mix = mix / max(1.0, float(np.max(np.abs(mix))) / 0.92)

    audio_out = out_dir / "audio.wav"
    sf.write(audio_out, mix[: int(video_total * SR)], SR)

    public = ROOT / "remotion" / "public"
    public.mkdir(parents=True, exist_ok=True)
    shutil.copy(audio_out, public / f"{script['id']}.wav")

    props = {
        "id": script["id"],
        "series": script.get("series", ""),
        "theme": cfg.get("theme"),
        "names": cfg.get("names"),
        "episode": script.get("episode"),
        "audio": f"{script['id']}.wav",
        "totalSec": video_total,
        "scenes": scenes,
    }
    (out_dir / "props.json").write_text(json.dumps(props, ensure_ascii=False))
    print(f"ok {script['id']} (your voice, {mode} mode): {total:.1f}s of speech, {len(scenes)} scenes -> {out_dir}")


if __name__ == "__main__":
    args = sys.argv[1:]
    words = None
    if "--words" in args:
        k = args.index("--words")
        words = args[k + 1]
        del args[k: k + 2]
    main(args[0], args[1], words)
