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
- **State dossiers** with Census Region, Census Division, FIPS code, Vintage 2025 population, Census total area, official-source links, neighbors, statehood, and personal learning history.
- **Region Explorer** uses the official U.S. Census Bureau model and can switch between **4 Regions** and **9 Divisions**.
- Study Guide.
- **Per-mode records** for best score, accuracy, streak, wins, and plays.

### Classroom and privacy
- **Classroom Mode** keeps classroom gameplay local and suppresses public leaderboard writes.
- Teachers can define **Class**, **Teacher**, and **Session** names.
- Each class session records only the games and answer attempts that occur during that lesson.
- Session status shows games and recorded attempts and can be ended explicitly.
- **Excel (.xlsx) export** contains three sheets: Session Summary, Games, and Attempts.
- Excel export is intentionally session-scoped: lifetime mastery, achievements, old sessions, and unrelated local data are not included.

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
├── censusGeography.js
├── officialStateData.js
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

The authoritative data layer is intentionally separated from the learning engine:

- Census Region, Census Division, and FIPS code: U.S. Census Bureau reference geography.
- Population: July 1, 2025 Vintage 2025 Census estimates.
- Total area: Census 2010 MAF/TIGER state area measurements.
- Student-friendly enrichment: U.S. Census Bureau State Facts for Students.
- Federal parks/places: National Park Service state directories.
- Statehood research: National Archives / congressional historical records.

Older unsourced fun facts are retained only as quarantined legacy content and are not shown as verified learning facts. See `docs/data-audit.md` for audit status and provenance policy.


## Official Census geography

Region Explorer follows the U.S. Census Bureau's canonical hierarchy:

- **Northeast** — New England, Middle Atlantic
- **Midwest** — East North Central, West North Central
- **South** — South Atlantic, East South Central, West South Central
- **West** — Mountain, Pacific

The app includes only the 50 states; the District of Columbia is therefore not included in the South Atlantic game group.


## Classroom session reports

Classroom Mode uses a separate local session record rather than exporting the learner's full local profile. Starting a class session creates a new session ID and timestamp. Every game played during that active session records the student name, mode, difficulty, result, accuracy, streak, and missed states. Every answer attempt records the target, response, correctness, score/streak after the attempt, and Census Region/Division/FIPS when applicable.

The built-in XLSX writer is dependency-free so classroom reports remain available without loading a spreadsheet library from the network.
