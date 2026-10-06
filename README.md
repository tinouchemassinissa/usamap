<div align="center">
  <img src="public/pwa-192x192.png" alt="USA State Explorer Icon" width="120" />

  # 🦅 USA State Explorer

  **An interactive PWA for learning U.S. states, capitals, flags, regions, and geography through play and adaptive practice.**

  [![Live Demo](https://img.shields.io/badge/Play_Now-Live_Demo-success?style=for-the-badge&logo=vercel)](https://findthestate.vercel.app/)
  [![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue?style=for-the-badge)](https://findthestate.vercel.app/)
</div>

---

## Features

### Learning system
- **Smart Review** with spaced repetition: each state tracks attempts, accuracy, mistakes, mastery, last seen, and next review.
- **Mistake Review** focuses on states the learner has previously missed.
- **Mastery map** uses color bands to distinguish unseen, weak, learning, and mastered states.
- **Meaningful achievements** reward mastery, recovery from mistakes, perfect runs, capitals, flags, borders, and journeys.

### Difficulty
- **Beginner** — 5 lives, extra time, learning hints.
- **Intermediate** — balanced default.
- **Expert** — 2 lives, less time, higher scoring.
- **Master** — 1 life, tight timing, maximum score multiplier.

### Challenge modes
- Classic
- Time Attack
- Reverse
- Capitals
- Trivia
- Flags
- **Mixed Challenge** — rotates states, capitals, flags, abbreviations, and regions.
- **Neighbor Challenge** — identify states that border one another.
- **USA Journey** — travel between states using valid neighboring-state routes.
- Smart Review
- Mistake Review

### Explore and study
- **State dossiers** with capital, population, area, statehood, geography, neighbors, fact, and personal learning history.
- Region Explorer.
- Study Guide.
- **Per-mode records** for best score, accuracy, streak, wins, and plays.

### Classroom and privacy
- **Classroom Mode** keeps a session local and suppresses public leaderboard writes.
- Optional class label.
- Exportable local student progress report.

### Experience
- Bach's *Air on the G String* focus recording with mute/unmute and a remembered volume setting.
- Completing a full 50-state challenge triggers the U.S.-flag map ceremony and public-domain U.S. Navy Band performance of *The Star-Spangled Banner*.
- Responsive grouped Learn / Challenge / Explore interface.
- Keyboard-accessible map interaction and reduced-motion support.

### Offline-first PWA
The application shell and bundled learning logic are precached. Map topology, flags, fonts, and classical audio use persistent runtime caches after they have been fetched successfully. Core learner progress, records, difficulty, classroom settings, and mastery data live locally, so they remain available without a network connection. Public leaderboard access and external research links still require connectivity.

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

The performance is identified by Wikimedia Commons as a work of the U.S. federal government and public domain in the United States. The focus soundtrack uses the public-domain U.S. Air Force Strings recording of Bach's *Air on the G String*. Correct/incorrect cues and the emergency focus fallback are generated locally with the Web Audio API.


### Focus music source

The focus track is **J.S. Bach — Air on the G String**, performed by the **United States Air Force Band, Air Force Strings** and hosted by Wikimedia Commons. Wikimedia identifies the composition, performance, and recording as public domain in the United States:

https://commons.wikimedia.org/wiki/File:Air_-_Air_Force_Strings_-_United_States_Air_Force_Band.mp3


## v2 learning data

The v2 learner profile is stored locally and migrates the previous scalar mastery values where available. Each state now has structured learning metadata used by Smart Review and Mistake Review. Per-mode records, difficulty, classroom settings, and audio preferences are also persisted locally.

The state facts and population labels currently come from the repository's bundled educational dataset. They should be treated as a maintained content layer separate from the learning engine; future data-refresh work can update sources/years without changing the spaced-repetition model.
