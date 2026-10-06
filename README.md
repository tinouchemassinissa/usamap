<div align="center">
  <img src="public/pwa-192x192.png" alt="USA State Explorer Icon" width="120" />

  # 🦅 USA State Explorer

  **An interactive PWA for learning U.S. states, capitals, flags, regions, and geography through play and adaptive practice.**

  [![Live Demo](https://img.shields.io/badge/Play_Now-Live_Demo-success?style=for-the-badge&logo=vercel)](https://findthestate.vercel.app/)
  [![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue?style=for-the-badge)](https://findthestate.vercel.app/)
</div>

---

## Features

- **Classic** — find the named state on the map.
- **Time Attack** — score as much as possible in 60 seconds.
- **Adaptive Practice** — state selection is weighted toward weaker mastery.
- **Reverse** — identify a highlighted state.
- **Capitals** — find the state from its capital.
- **Trivia** — answer population, area, and capital questions.
- **Flags** — identify a state from its flag.
- **Study Guide** — inspect state facts and reference information.
- **Region Explorer** — learn the four major U.S. regions.
- **Persistent mastery tracking** stored locally on the device.
- **Achievement badges** and high-score tracking.
- **Classical-style focus music** generated locally with the Web Audio API; no copyrighted commercial recording is bundled.
- **Victory ceremony** — mastering all 50 states fills the map with the U.S. flag and plays a public-domain U.S. Navy Band performance of *The Star-Spangled Banner*. A Continue button lets students move on immediately.
- **Global leaderboard** for competitive modes.
- **Installable PWA** with runtime caching for state flags, map topology, and fonts.
- **Keyboard-accessible map controls**, screen-reader status feedback, browser zoom support, and reduced-motion handling.

> Offline note: after the required assets have been loaded and cached at least once, the core game remains usable without a network connection. The online leaderboard and external research links naturally require connectivity.

## Tech stack

- React 19
- Vite 8
- react-simple-maps / d3-geo
- Firebase Firestore
- vite-plugin-pwa / Workbox
- Node built-in test runner

## Local development

```bash
git clone https://github.com/tinouchemassinissa/usamap.git
cd usamap
npm ci
cp .env.example .env
npm run dev
```

Populate the Firebase client configuration in `.env` before using the leaderboard.

### Verification

```bash
npm run lint
npm test
npm run build
```

The same checks run in GitHub Actions for pull requests and pushes to `master`.

## Firebase leaderboard security

The repository includes `firestore.rules` and `firebase.json`. The rules:

- allow public reads of leaderboard entries;
- validate the allowed fields and player-name length;
- reject unsupported game modes and implausibly large scores;
- prevent client-side update/delete operations;
- deny access to undeclared Firestore collections.

Deploy the rules with the Firebase CLI for the target Firebase project:

```bash
firebase deploy --only firestore:rules
```

Firebase client configuration is intentionally provided through environment variables. The real `.env` file is ignored by Git and `.env.example` contains variable names only.

> These rules reduce abuse but do not cryptographically prove that a score was earned through normal gameplay. A fully trusted competitive leaderboard would require server-side score verification or another trusted attestation path.

## Project structure

```text
src/
├── App.jsx
├── audio.js
├── data.js
├── firebase.js
├── game/
│   ├── gameLogic.js
│   └── gameLogic.test.mjs
└── index.css

.github/workflows/ci.yml
firestore.rules
firebase.json
```

## Author

Created by **Massinissa TINOUCHE**.

---

Contributions and bug reports are welcome through GitHub.


## Audio attribution

The victory anthem uses the public-domain recording **“The Star-Spangled Banner” performed by the United States Navy Band**, hosted by Wikimedia Commons:

https://commons.wikimedia.org/wiki/File:%22The_Star-Spangled_Banner%22_performed_by_the_United_States_Navy_Band.mp3

The performance is identified by Wikimedia Commons as a work of the U.S. federal government and public domain in the United States. The in-game focus soundtrack and feedback tones are generated locally by the application with the Web Audio API.
