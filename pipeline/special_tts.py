"""Special (GTA-style) voice builder. Usage: python pipeline/special_tts.py specials/<slug>/script.json
Writes out/<id>/props.json + remotion/public/<id>.wav. Reuses helpers from tts.py."""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf
sys.path.insert(0, str(Path(__file__).resolve().parent))
import tts
from tts import *  # noqa

DEFAULT_SPEAKERS['byte'] = {**DEFAULT_SPEAKERS['byte'], 'speed': 1.22, 'pitch': 1.5}  # faster, more energetic

def main(p):
    sc = json.loads(Path(p).read_text())
    out = ROOT / "out" / sc["id"]; out.mkdir(parents=True, exist_ok=True)
    k = Kokoro(str(ROOT / "assets/models/kokoro-v1.0.int8.onnx"), str(ROOT / "assets/models/voices-v1.0.bin"))
    gap = np.zeros(int(0.10 * SR), dtype=np.float32)
    chunks, lines, words, t = [], [], [], 0.0
    spans = []
    for ln in sc["lines"]:
        sp = DEFAULT_SPEAKERS[ln["who"]]
        s, sr = k.create(ln["text"], voice=sp["voice"], speed=min(1.6, sp["speed"] * PACE * ln.get("slow", 1.0)), lang="en-us")
        s = trim_silence(pitch_shift(s.astype(np.float32), sp.get("pitch", 0)))
        d = len(s) / SR
        lines.append({"who": ln["who"], "text": ln["text"], "beat": ln["beat"], "start": round(t, 3), "end": round(t + d, 3)})
        words += [{**w, "who": ln["who"]} for w in word_timing(ln["text"], t, d)]
        spans.append((t, s, ln["who"]))
        pz = np.zeros(int(ln.get('pause', 0.10) * SR), dtype=np.float32)
        chunks += [s, pz]; t += d + ln.get('pause', 0.10)
    voice = np.concatenate(chunks); voice = voice / (float(np.max(np.abs(voice))) or 1) * 0.9
    raw, fx = out / "voice_raw.wav", out / "voice_fx.wav"
    sf.write(raw, voice, SR)
    r = subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(raw),"-af",VOICE_FX,str(fx)], capture_output=True, text=True)
    if r.returncode == 0:
        voice, _ = sf.read(fx, dtype="float32"); voice = voice / (float(np.max(np.abs(voice))) or 1) * 0.9
    total = len(voice) / SR
    nf = int(np.ceil((total + 0.6) * FPS))
    mb, mc = np.zeros(nf), np.zeros(nf)
    for t0, s, who in spans:
        env = np.array(mouth_envelope(s)); f0 = int(round(t0 * FPS))
        tgt = mb if who == "byte" else mc
        n = min(len(env), nf - f0); tgt[f0:f0 + n] = env[:n]
    bed = np.zeros(len(voice) + SR, dtype=np.float32)
    beats = []
    for b in range(len(sc["beats"])):
        st = min(l["start"] for l in lines if l["beat"] == b); beats.append(st)
        if b: add_at(bed, sfx.get("whoosh"), st - 0.05, SWISH_GAIN)
    mix = np.zeros(len(bed), dtype=np.float32); mix[:len(voice)] += voice; mix += bed
    mix = mix / max(1.0, float(np.max(np.abs(mix))) / 0.92)
    sf.write(out / "audio.wav", mix[:int((total + 0.6) * SR)], SR)
    (ROOT / "remotion/public").mkdir(parents=True, exist_ok=True)
    shutil.copy(out / "audio.wav", ROOT / f"remotion/public/{sc['id']}.wav")
    props = {"audio": f"{sc['id']}.wav", "totalSec": round(total + 0.6, 3), "words": words, "lines": lines,
             "mouth": [round(float(v), 3) for v in mb], "compyMouth": [round(float(v), 3) for v in mc], "beats": beats}
    (out / "props.json").write_text(json.dumps(props))
    print(f"ok {total:.1f}s beats={beats}")
    for l in lines: print(l["beat"], l["who"], l["start"], l["end"])
main(sys.argv[1])
