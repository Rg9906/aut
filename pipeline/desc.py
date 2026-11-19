"""Build a YouTube description from the script: hook, takeaway, agenda, rule, sources, series CTA, disclosure."""
import json
import re


def _visual(script, kind):
    for s in script.get("scenes", []):
        v = s.get("visual")
        if v and v.get("type") == kind:
            return v.get("props", {})
    return {}


def build_description(script):
    series = script.get("series", "")
    ep = script.get("episode")
    agenda = _visual(script, "agenda")
    recap = _visual(script, "recap")
    end = _visual(script, "endCard")

    parts = []
    if script.get("hook"):
        parts.append(f"{script['hook']} 🤔")
    if script.get("angle"):
        parts.append(script["angle"])

    if agenda.get("items"):
        lines = [f"{i}. {t}" for i, t in enumerate(agenda["items"], 1)]
        parts.append("⏱ In this video\n" + "\n".join(lines))

    if recap.get("rule"):
        rule = f"💡 Rule of the day: {recap['rule']}"
        if recap.get("code"):
            rule += f"\n   {recap['code']}"
        parts.append(rule)

    claims = [c for c in script.get("claims", []) if c.get("source")]
    if claims:
        parts.append("🔗 Sources\n" + "\n".join(f"• {c['text']}\n  {c['source']}" for c in claims))

    if series:
        from channel import channel_dir
        _cf = channel_dir() / "channel.json"
        tagline = json.loads(_cf.read_text()).get("tagline") if _cf.exists() else None
        tagline = tagline or "tiny comedy sketches that explain code."
        cta = f"🎬 {series}" + (f" · Episode {ep}" if ep else "") + " — " + tagline
        if end.get("next"):
            cta += f"\n👉 Follow so you don't miss the next one: {end['next']}"
        parts.append(cta)

    if script.get("contains_synthetic_media", True):
        from channel import voice_source
        parts.append("🎙 Voiced by a real human. Animation and visuals are AI-generated." if voice_source() == "human" else "🤖 Voices and animation are AI-generated.")

    tags = re.findall(r"#\w+", script.get("description", ""))
    if tags:
        parts.append(" ".join(dict.fromkeys(tags)))

    return "\n\n".join(parts)[:4900]


if __name__ == "__main__":
    import json, sys
    print(build_description(json.load(open(sys.argv[1]))))
