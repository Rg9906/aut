# SETUP: what only YOU can do (about 40 minutes, once)

Everything else is automated or done by Claude. Do these in order. Tick them off.
Never paste passwords, client secrets or tokens into chat. They go only into GitHub Secrets.

## A. Accounts

- [ ] **A1. YouTube channel**
  1. Sign in at youtube.com with the Google account you want to own the channel.
  2. Profile icon -> *Create a channel* (choose a **Brand Account** so it is separate from your personal identity; suggested name: *Byte & Compy*, or your own).
  3. Set handle, profile pic (screenshot of Byte), banner later.
  4. Verify your phone at youtube.com/verify (needed for custom thumbnails and longer uploads).
- [ ] **A2. GitHub account + repo**
  1. Sign in / sign up at github.com.
  2. New repository named `autochannel`, **Private**, empty (no README). Private repos get 2,000 free Actions minutes per month, enough for about 1 render/day.

## B. Connect GitHub to Claude (lets Claude push the code for you)

- [ ] **B1.** claude.ai -> Settings -> Connectors -> connect **GitHub**, and give the Claude GitHub App access to the `autochannel` repo.
- [ ] **B2.** Tell Claude "GitHub connected". It will push everything and set up the repo. *(Claude's cloud sandbox cannot reach github.com directly; this link is the only way.)*

## C. Google Cloud (YouTube API keys)

Claude can click through most of this in your logged-in Chrome if you say "do the Google Cloud part". You only approve the consent screen.

- [ ] **C1.** console.cloud.google.com -> new project `autochannel` (no billing needed).
- [ ] **C2.** APIs & Services -> Library -> enable **YouTube Data API v3** and **YouTube Analytics API**.
- [ ] **C3.** OAuth consent screen -> *External* -> app name, your email -> add your own Google account as a **Test user** -> **then click "Publish app" (In production)**.
  *Important:* if left in "Testing", Google expires the login token after 7 days and uploads silently stop. An unverified app in production is fine for your own account (you'll see an "unverified app" warning once; that is expected).
- [ ] **C4.** Credentials -> Create credentials -> **OAuth client ID** -> type **Desktop app** -> download `client_secret.json`. Keep it private.
- [ ] **C5.** On your own computer: `pip install google-auth-oauthlib` then `python pipeline/auth.py`. A browser opens, you approve, and it prints three values.
- [ ] **C6.** GitHub repo -> Settings -> Secrets and variables -> Actions -> add: `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`.

## D. Content assets

- [ ] **D1. Your voice (optional, biggest realism upgrade).** Record 30 seconds of yourself in a quiet room (phone voice recorder is fine), speaking naturally in English. Upload it in chat. By sending it you confirm it is your own voice.
- [ ] **D2. Music (optional).** Download one or two royalty-free loops from the YouTube Audio Library (studio.youtube.com -> Audio library) and send them. Claude wires them in at low volume.

## E. Decisions to tell Claude

- [ ] Channel name and handle (so the on-screen branding matches).
- [ ] Posting time (default 10:00 IST).
- [ ] Autonomy level. Recommended: **L0** for week 1 (uploads are PRIVATE; you open YouTube Studio on your phone, skim, tap Public), then **L1**, then **L2**. See PLAN.md section 3.

## What Claude does after you finish

| You finish | Claude then... |
|---|---|
| A + B | pushes the repo, enables the daily GitHub Action |
| C | tests one real upload (private), checks the API accepts it |
| D1 | sets up your voice clone on a free GPU notebook, swaps it in |
| all | creates the weekly "manager" scheduled task: reads stats, writes next week's sketches, sends you a digest |

## Kill switch
Create an empty file `state/PAUSE` in the repo to stop all publishing immediately.
