"""Make a recording sheet (what to read) for a script.   Usage: python pipeline/sheet.py <script.json> [--narrator]
Writes channels/<slug>/sheets/<id>.md (or sheets/<id>.md for the main channel) and prints it."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from channel import ROOT, channel_dir, config

TONE = {"neutral": "normal", "happy": "excited, smiling", "shocked": "surprised, big energy", "smug": "smug, a little slower",
        "thinking": "curious, thoughtful", "confused": "puzzled", "angry": "annoyed, louder", "sad": "deflated, quiet", "dead": "flat"}


def main(path, narrator=False):
    d = json.loads(Path(path).read_text())
    cfg = config()
    names = cfg.get("names") or {"byte": "Byte", "compy": "Compy"}
    mode = "narrator" if narrator else (d.get("voice_mode") or cfg.get("voice_mode") or "dual")
    words = sum(len(s["narration"].split()) for s in d["scenes"])
    L = [f"# Recording sheet: {d['title']}", "",
         f"File name: **{d['id']}.m4a** (or .wav / .mp3). Target length about {round(words / 2.6)} seconds. Mode: **{mode}**.", "",
         "## How to record", "- Phone voice memo, quiet room, phone about a hand-width from your mouth. No music or fan.",
         "- One take, start to finish. If you flub a line, pause, say it again, keep going (I keep the matching words).",
         "- Leave about one second of silence between numbered lines. Read the words exactly as written.",
         "- Say it with energy. It should feel like a chat with a friend, a bit more hyped than normal.", ""]
    if mode == "dual":
        L += [f"- Two characters, both you: **{names['byte'].upper()}** = the hyped one, **{names['compy'].upper()}** = the calm, smug one. Change your tone a little for each.", ""]
    L += ["## Read this", ""]
    for i, s in enumerate(d["scenes"], 1):
        who = s.get("speaker", "byte")
        tag = f"[{names[who].upper()}] " if mode == "dual" else ""
        tone = TONE.get(s.get("emotions", {}).get(who, "neutral"), "normal")
        L += [f"{i}. {tag}{s['narration']}", f"   _(tone: {tone})_", ""]
    rel = "voice" if channel_dir() == ROOT else f"channels/{channel_dir().name}/voice"
    L += ["## Send it", f"Upload **{d['id']}.m4a** to the chat, or commit it to `{rel}/` in the repo.", ""]
    out = channel_dir() / "sheets" / f"{d['id']}.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(L))
    print(out)


if __name__ == "__main__":
    main(sys.argv[1], "--narrator" in sys.argv)
