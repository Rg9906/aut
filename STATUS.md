# STATUS (start here)

Last updated: 2026-11-19

## Done
- [x] Master plan (PLAN.md) and owner setup guide (SETUP.md)
- [x] Voice engine: Kokoro, two speakers, lip-sync timings, voice polish
- [x] Procedural sound effects (pop, buzz, ding, boom, boing, scratch, sparkle, whoosh)
- [x] Characters: Byte + Compy, 8 expressions each, lip-sync
- [x] Scene types: titleCard, agenda, terminal, code, compare, bigText, recap, endCard
- [x] Episode structure: hook -> title card -> agenda -> sketch -> recap rule -> follow card + next-episode teaser
- [x] Camera shake/zoom, stickers, speaker-colored captions, episode badge
- [x] QC gate (specs, loudness, sources cited, intro/agenda/recap/end-card present)
- [x] Episode 1 rendered: "Why 0.1 + 0.2 isn't 0.3"
- [x] Upload + OAuth code written (UNTESTED: needs real credentials)

## Blocked on you (see SETUP.md)
- [ ] YouTube channel
- [ ] GitHub repo + connect GitHub to Claude
- [ ] Google Cloud project, YouTube APIs, OAuth client, secrets
- [ ] Optional: 30s voice recording, music loops

## Next for Claude (after unblock)
- [ ] Push repo, enable daily Action
- [ ] First real private upload test
- [ ] Weekly manager scheduled task (research -> scripts -> stats digest)
- [ ] Analytics pull (YouTube Analytics API) into state/analytics.json
- [ ] Episodes 2-5 (arrays start at 0, recursion, Big-O, git)
- [ ] Thumbnails
- [ ] Voice clone of owner (free GPU notebook)

## Known limits
- Voices are synthetic (Kokoro); own-voice clone is the planned fix.
- Humor quality is subjective; tune from owner feedback.
- No background music yet (needs owner-picked royalty-free track).
- API project may force PRIVATE uploads until Google audit; verified at first upload test.
