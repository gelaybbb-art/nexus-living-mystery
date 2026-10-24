# NEXUS: The Living Mystery — Browser MVP

A single-player, cinematic detective game built with plain HTML, CSS, and JavaScript. No build tools, package manager, server, or installation required.

## Files
- `index.html` — app structure and screens
- `style.css` — responsive dark sci-fi interface
- `game.js` — game state, choices, evidence, interviews, scoring, endings, local save

## Play locally
Open `index.html` in a modern browser. Internet is only used for optional Google Fonts; the game itself does not require a backend.

## Publish free with GitHub Pages (browser only)
1. Sign in at https://github.com/
2. Create a new **public** repository named `nexus-living-mystery` (or another name).
3. On the repository page, choose **Add file → Upload files**.
4. Upload `index.html`, `style.css`, and `game.js` individually (not the ZIP itself).
5. Commit the files to the `main` branch.
6. Open **Settings → Pages**.
7. Under **Build and deployment**, choose **Deploy from a branch**.
8. Select branch `main`, folder `/(root)`, then **Save**.
9. Wait a few minutes. GitHub will show the published URL in Settings → Pages.

If your repository is named `username.github.io`, the site is usually published at the root URL. Otherwise, it is usually `https://username.github.io/repository-name/`.

## Game features in this MVP
- Opening cinematic interface and case briefing
- Three opening investigative approaches
- Evidence vault with six possible clues
- Three suspects with interview interactions
- Field journal and live investigation feed
- Score, chapter progression, and multiple endings
- Autosave using browser `localStorage`
- Replay/reset and sound toggle
- Responsive desktop and mobile layout

## Important MVP limits
- Progress is saved only in the current browser/device. Clearing site data can erase it.
- No online accounts, cross-device sync, leaderboard, multiplayer, or AI generation yet.
- The narrative is authored content; it does not call an AI API.
- The Google Fonts import is cosmetic; browser fallback fonts are included.
- This is a prototype for validating gameplay, not yet a commercial release.

## Recommended next roadmap
### Phase 1 — Validate the core loop
Ask 10–20 people to play on mobile and desktop. Track where they stop, whether they replay, and which ending they choose. Improve clarity, clue logic, and pacing before adding features.

### Phase 2 — Improve the mystery
Add 2–3 cases, a case-selection screen, hint system, more evidence combinations, accessibility options, and automated gameplay tests.

### Phase 3 — Online features
Use Supabase for optional accounts, cloud saves, and leaderboard records. Keep private credentials out of browser code; only a public anon key belongs in a frontend and it must be protected by Row Level Security policies. Validate all score submissions server-side or through a trusted function before trusting a leaderboard.

### Phase 4 — Monetization experiments
First test retention and organic sharing. Potential models include paid case packs, a one-time premium edition, or cosmetic profile themes. Avoid ads or payments until players demonstrate repeat use. Never sell advantages that undermine mystery-solving fairness.

## Success criteria to validate (not promises)
- Most testers finish the first case without help.
- A meaningful share replay the case or try a second case within 7 days.
- Players can explain the core premise and identify what made the game fun.
- At least a few players voluntarily recommend it to someone else.
