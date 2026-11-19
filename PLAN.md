# AutoChannel: autonomous, anti-slop YouTube channel (free stack)

## 1. Goal
A faceless-but-not-generic YouTube channel (Shorts first, long-form later) that runs itself:
research -> script -> voice -> animated visuals -> QC -> upload -> analytics -> next batch.
Owner checks stats occasionally. Total running cost: Rs 0 (free tiers + open source).

## 2. Design principles (the anti-slop contract)
1. **Original angle per video.** Every script must state a *take* (a comparison, a "why X breaks", a counter-intuitive fact), not a summary. Critic rejects generic scripts.
2. **Custom visuals per concept.** Code-driven animation (Remotion / Manim) of the actual idea. No stock-footage collage.
3. **Consistent human identity.** One recurring voice (own cloned voice later), fixed persona, fixed series names.
4. **Retention-first structure.** Hook in <=2s, a visual change every ~3s, payoff before 40s, loopable ending.
5. **Facts grounded.** Each script lists its claims + source URLs; QC rejects uncited numeric/factual claims.
6. **No sensitive-advice personas.** No finance/health/legal advice. Tech, CS, AI only.
7. **Variety inside a brand.** Shared brand kit, but scene layouts rotate so videos are not near-identical.
8. **Human gate that can be relaxed.** Autonomy levels below.

## 2b. Episode structure (every video follows this arc)
| Beat | Time | Scene type | Purpose |
|---|---|---|---|
| Hook + question | 0-3s | titleCard | "Ever wondered why...?" plus the topic as a big title; episode badge top-right |
| Promise | 3-8s | agenda | 3 things the viewer will get, plus a reason to stay to the end |
| Sketch | 8-44s | terminal / compare / code / bigText | Byte asks, Compy answers; jokes, shakes, stickers |
| Recap rule | 44-50s | recap | ONE rule to remember + code chip; this is the "save/screenshot" moment |
| Exit | 50-54s | endCard | Follow button + "Next episode" teaser (a reason to come back) |
Target length 45-55s. QC enforces: title card first, agenda in the first 3 scenes, recap in the last 3, end card last.

## 3. Autonomy levels
- **L0 (week 1):** render + upload as PRIVATE. Owner skims, flips public.
- **L1:** upload UNLISTED automatically; auto-public after owner approves 10 in a row.
- **L2:** auto-public, QC gate must pass; weekly manager report only.
Kill switch: `state/PAUSE` file stops all publishing.

## 4. Architecture

```
 WEEKLY (Claude scheduled task = "the manager")
   - reads state/analytics.json (YouTube Analytics API)
   - researches fresh topics (HN, arXiv, GitHub trending, YT outliers)
   - writes 7-14 scripts -> queue/*.json  (git commit)
   - rewrites strategy.md (what to double down on / kill)
   - posts stats digest to owner

 DAILY (GitHub Actions cron, free, no LLM needed)
   queue/next.json
     -> pipeline/tts.py       Kokoro-ONNX, per-sentence wav + exact timings
     -> pipeline/timing.py    word-level timings from sentence durations
     -> remotion/             React scenes + animated captions -> mp4
     -> pipeline/qc.py        loudness, duration, caption overflow, black frames, claims-cited check
     -> pipeline/upload.py    YouTube Data API (OAuth refresh token in secrets)
     -> state/published.json  + commit

 DAILY ANALYTICS (Actions)
   pipeline/analytics.py -> state/analytics.json (views, retention, CTR per video)
```
Why this split: the LLM-heavy, taste-heavy work happens once a week with me (Claude), where quality matters. The daily job is deterministic code, so it costs nothing and cannot hallucinate at 3 a.m.

## 5. Stack (all free)
| Layer | Tool | Notes |
|---|---|---|
| Scripts / strategy | Claude (scheduled task) | uses owner's plan; optional Gemini free tier fallback |
| Topic sources | HN API, arXiv, GitHub trending, HF daily papers, YT outlier search | blocked in dev sandbox, fine in Actions |
| Voice | Kokoro-82M ONNX (CPU) -> later Chatterbox clone of owner's voice | weights from GitHub releases |
| Visuals | Remotion (React) templates; Manim for math/algorithm scenes | Remotion free for individuals |
| Captions | Word timings from TTS sentence durations (Whisper optional) | Remotion animated captions |
| Render | Remotion + ffmpeg on GitHub Actions | |
| Upload | YouTube Data API v3 (videos.insert, thumbnails.set) | default quota ~100 uploads/day; project may need audit before public |
| Analytics | YouTube Analytics API | |
| Orchestration | GitHub Actions cron + repo as database | |

## 6. Script schema (queue/*.json)
```json
{
  "id": "2026-11-20-hash-collisions",
  "series": "60-Second CS",
  "title": "...", "description": "...", "tags": ["..."],
  "angle": "one-sentence take",
  "hook": "first spoken line",
  "scenes": [
    {"narration": "...", "visual": {"type": "bigText|code|diagram|bars|compare|terminal", "props": {}}}
  ],
  "claims": [{"text": "...", "source": "https://..."}],
  "contains_synthetic_media": true
}
```

## 7. Phases
- **Phase 0 (now):** repo, brand kit, scene library, TTS, render ONE proof-of-concept Short. Judge quality.
- **Phase 1 (done in v2):** two-character comedy-sketch format (Byte + Compy), lip-synced mascots with 8 expressions, two voices, procedural SFX, camera shake/zoom, stickers, speaker-colored captions, QC script. TODO: more scene types, 3 more test sketches.
- **Phase 2:** YouTube OAuth + upload (private), Actions cron, queue consumer.
- **Phase 3:** analytics pull + weekly manager task (scripts + report).
- **Phase 4:** voice clone of owner (Chatterbox on a free Kaggle/Colab GPU; needs a 20-30s clean recording), thumbnails, comment-reply drafts (approve-first), long-form format.
- **Phase 5:** relax autonomy level based on QC pass rate and retention.

## 8. What the owner must do (one-time, ~30 min)
1. Create a GitHub repo and push this project (or give access).
2. Google Cloud project -> enable YouTube Data API v3 + Analytics API -> OAuth client -> run `pipeline/auth.py` once locally to get a refresh token -> store as GitHub secret.
3. Create the YouTube channel (brand account recommended).
4. Allow `huggingface.co`, `hacker-news.firebaseio.com`, `export.arxiv.org` in Claude settings if topic research should run in the dev sandbox (not needed in Actions).

## 9. Risks and mitigations
- **Repetitive-content demonetization:** rotate layouts, require unique angle, keep human voice, cap daily volume (1-2/day to start).
- **Unverified API project forces private uploads:** test day one; apply for audit if needed, or flip public manually via owner approval.
- **Browser automation of Studio violates ToS:** use official API only.
- **Factual errors:** claims+sources required, critic pass, L0 review first.
- **Credentials:** OAuth token only in Actions secrets; never committed.
- **Quota/limits:** one upload costs 1,600 units on older quota model; 1-2/day is safe.
- **Slow growth:** expect weeks of low views; judge by retention, not subscribers.

## 10. Success metrics
Retention at 3s and at end, average view duration, % viewed vs swiped away, CTR (long-form), videos/week shipped, QC pass rate, owner interventions/week (target: <10 min).
