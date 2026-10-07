import React, { useEffect, useState } from 'react';
import { CENSUS_GEOGRAPHY_SOURCE } from '../censusGeography';

const MODE_HELP = {
  CLASSIC: {
    title: 'Classic',
    goal: 'Find the named state on the map.',
    steps: ['Read the state name above the map.', 'Click that state.', 'Correct answers build score and streak; mistakes cost a life.'],
  },
  TIME_ATTACK: {
    title: 'Time Attack',
    goal: 'Find as many states as you can before time expires.',
    steps: ['Work quickly from the state prompt.', 'Correct answers increase score and streak.', 'Difficulty changes the starting time and lives.'],
  },
  ADAPTIVE: {
    title: 'Smart Review',
    goal: 'Practice the states your learning profile says need attention.',
    steps: ['Due, weak, unseen, and previously difficult states appear more often.', 'Correct answers raise mastery and schedule later review.', 'Mistakes bring a state back sooner.'],
  },
  MISTAKES: {
    title: 'Mistake Review',
    goal: 'Revisit states you have previously missed.',
    steps: ['The session is built from your own mistake history.', 'Answer each review state correctly.', 'Use it after a normal game to strengthen weak areas.'],
  },
  NEIGHBORS: {
    title: 'Neighbor Challenge',
    goal: 'Find a state that shares a land border with the named state.',
    steps: ['Read the target state.', 'Click any state sharing a true land border.', 'Point-only Four Corners contacts are not counted as shared borders.'],
  },
  JOURNEY: {
    title: 'USA Journey',
    goal: 'Travel from one state to another through neighboring states.',
    steps: ['Start at the highlighted origin.', 'Move one land-border neighbor at a time.', 'Reach the destination using the route challenge.'],
  },
  MIXED: {
    title: 'Mixed Challenge',
    goal: 'Switch between several kinds of geography recall.',
    steps: ['Prompts can use state names, capitals, flags, abbreviations, or Census regions.', 'Read the prompt carefully before answering.', 'The challenge changes format as you play.'],
  },
  REVERSE: {
    title: 'Reverse',
    goal: 'Name the highlighted state.',
    steps: ['A state is highlighted on the map.', 'Choose its correct name from the answers.', 'Use shape and location clues rather than a text prompt.'],
  },
  CAPITALS: {
    title: 'Capitals',
    goal: 'Find the state that belongs to the shown capital.',
    steps: ['Read the capital name.', 'Click its state on the map.', 'Use Smart Review later if capitals expose weak states.'],
  },
  TRIVIA: {
    title: 'Trivia',
    goal: 'Answer a question about the highlighted state.',
    steps: ['Look at the highlighted state.', 'Read the fact/value question.', 'Choose the correct answer from the options.'],
  },
  FLAGS: {
    title: 'Flags Game',
    goal: 'Identify the state from its flag.',
    steps: ['Study the flag shown in the prompt.', 'Choose the matching state name.', 'The map does not reveal the answer for you.'],
  },
  STUDY: {
    title: 'Study Guide',
    goal: 'Explore states without competitive pressure.',
    steps: ['Click any state.', 'Open its dossier for Census geography, population, area, neighbors, and learning history.', 'Use official-source links when you want to learn more.'],
  },
  REGIONS: {
    title: 'Region Explorer',
    goal: 'Learn the official U.S. Census Bureau geography hierarchy.',
    steps: ['Switch between 4 Regions and 9 Divisions.', 'Click a state to highlight its entire Census group.', 'Use the legend and official Census reference to compare groups.'],
  },
};

function SectionCard({ title, children }) {
  return (
    <section className="help-section-card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function StudentHelp({ mode, gameStarted }) {
  const current = MODE_HELP[mode] || MODE_HELP.CLASSIC;

  return (
    <div className="help-section-stack">
      {gameStarted && (
        <SectionCard title={'Right now: ' + current.title}>
          <p className="help-lead">{current.goal}</p>
          <ol>
            {current.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="help-tip">Opening Help does not end or reset your game.</p>
        </SectionCard>
      )}

      <SectionCard title="Quick start">
        <ol>
          <li>Enter your name.</li>
          <li>Choose a mode.</li>
          <li>Choose Beginner, Intermediate, Expert, or Master difficulty.</li>
          <li>Select <strong>Let's Play</strong>.</li>
          <li>Read the prompt and answer using the map or answer buttons.</li>
        </ol>
      </SectionCard>

      <SectionCard title="What the learning system does">
        <div className="help-grid-two">
          <div><strong>Mastery</strong><span>Tracks how well you know each state.</span></div>
          <div><strong>Due now</strong><span>States ready for spaced-repetition review.</span></div>
          <div><strong>Review states</strong><span>States that need work because of prior mistakes.</span></div>
          <div><strong>Per-mode records</strong><span>Your best score, accuracy, streak, plays, and wins.</span></div>
        </div>
        <p>For learning rather than just scoring, use <strong>Smart Review</strong> regularly and follow it with <strong>Mistake Review</strong>.</p>
      </SectionCard>

      <SectionCard title="Game modes">
        <div className="help-mode-list">
          {Object.entries(MODE_HELP).map(([id, help]) => (
            <details key={id} open={gameStarted && id === mode}>
              <summary>{help.title}</summary>
              <p>{help.goal}</p>
              <ul>{help.steps.map((step) => <li key={step}>{step}</li>)}</ul>
            </details>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Lives, streaks, and difficulty">
        <p><strong>Lives</strong> are your allowed mistakes in competitive modes. <strong>Streak</strong> rewards consecutive correct answers.</p>
        <p>Beginner gives more lives and hints. Expert and Master are less forgiving and apply larger score multipliers.</p>
      </SectionCard>
    </div>
  );
}

function TeacherHelp() {
  return (
    <div className="help-section-stack">
      <SectionCard title="Recommended classroom workflow">
        <ol>
          <li>Turn on <strong>Classroom Mode</strong>.</li>
          <li>Enter the class name, teacher name, and a specific lesson/session name.</li>
          <li>Select <strong>Start class session</strong> before students begin.</li>
          <li>Have each student enter their name before starting a game.</li>
          <li>Run the lesson using the modes and difficulty appropriate for the class.</li>
          <li>Select <strong>End session</strong> when the lesson is complete.</li>
          <li>Select <strong>Export this session to Excel (.xlsx)</strong>.</li>
        </ol>
      </SectionCard>

      <SectionCard title="What the Excel report contains">
        <div className="help-grid-three">
          <div><strong>Session Summary</strong><span>Class, teacher, times, students, games, attempts, and accuracy.</span></div>
          <div><strong>Games</strong><span>Student, mode, difficulty, score, accuracy, streak, status, and missed states.</span></div>
          <div><strong>Attempts</strong><span>Each answer with target, response, correctness, score/streak, Region, Division, and FIPS.</span></div>
        </div>
        <p className="help-tip">The export is intentionally limited to the selected class session. It does not export the student's lifetime mastery database, achievements, unrelated sessions, or public leaderboard data.</p>
      </SectionCard>

      <SectionCard title="Classroom privacy and leaderboard behavior">
        <p>While Classroom Mode is enabled, classroom game scores are kept off the public leaderboard. Session records stay in that browser/device until exported or replaced by another local session.</p>
      </SectionCard>

      <SectionCard title="Using more than one Chromebook or tablet">
        <p>Class sessions are currently <strong>local to each device/browser</strong>. If students play on several devices, each device records its own session and can export its own Excel file. The app does not currently merge an entire classroom across devices into one cloud teacher dashboard.</p>
      </SectionCard>

      <SectionCard title="Suggested lesson patterns">
        <ul>
          <li><strong>Introduction:</strong> Study Guide → Region Explorer.</li>
          <li><strong>Recall practice:</strong> Classic → Capitals → Flags.</li>
          <li><strong>Geographic reasoning:</strong> Neighbor Challenge → USA Journey.</li>
          <li><strong>Targeted intervention:</strong> Smart Review → Mistake Review.</li>
          <li><strong>Assessment:</strong> choose one difficulty and mode for the class, then export the session Excel report.</li>
        </ul>
      </SectionCard>
    </div>
  );
}

function AppHelp() {
  return (
    <div className="help-section-stack">
      <SectionCard title="Controls">
        <div className="help-control-list">
          <div><span>🏠</span><div><strong>Home</strong><p>Leave the current game and return to the dashboard.</p></div></div>
          <div><span>?</span><div><strong>Help</strong><p>Open this guide without resetting the current game.</p></div></div>
          <div><span>☀️ / 🌙</span><div><strong>Theme</strong><p>Switch between Light and Dark themes. Your preference is remembered.</p></div></div>
          <div><span>🎼 / 🔇</span><div><strong>Music</strong><p>Mute or unmute focus music. Set the volume from the Home learning dashboard.</p></div></div>
        </div>
      </SectionCard>

      <SectionCard title="Install and offline use">
        <p>Use <strong>Install App</strong> to add USA State Explorer like an app on supported browsers. Core learning logic and saved progress are local. Assets such as the map, flags, fonts, and music become reusable offline after they have been fetched successfully at least once.</p>
        <p>Public leaderboard access and external official-source links still need an internet connection.</p>
      </SectionCard>

      <SectionCard title="Official Census geography">
        <p>Region Explorer follows the official U.S. Census Bureau hierarchy: <strong>4 Regions and 9 Divisions</strong>.</p>
        <a className="help-official-link" href={CENSUS_GEOGRAPHY_SOURCE.url} target="_blank" rel="noreferrer">
          Open the official U.S. Census Bureau reference
        </a>
      </SectionCard>

      <SectionCard title="If something looks out of date">
        <p>Because this is an installable PWA, a browser can temporarily keep older CSS or JavaScript. Fully close and reopen the installed app or refresh the browser tab to allow the latest service worker version to take control.</p>
      </SectionCard>

      <SectionCard title="Accessibility and devices">
        <p>The app supports keyboard state activation, browser zoom, reduced-motion preferences, touch scrolling, Chromebook touchpads, phone/tablet safe areas, and responsive layouts for portrait and landscape use.</p>
      </SectionCard>
    </div>
  );
}

export default function HelpGuide({ open, onClose, mode, gameStarted }) {
  const [tab, setTab] = useState(gameStarted ? 'student' : 'student');

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && gameStarted) setTab('student');
  }, [open, gameStarted]);

  if (!open) return null;

  return (
    <div className="overlay help-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <article className="glass-panel help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <header className="help-header">
          <div>
            <span className="hub-eyebrow">GUIDE & SUPPORT</span>
            <h2 id="help-title">How to use USA State Explorer</h2>
            <p>{gameStarted ? 'Your game is paused only by your attention—nothing is reset.' : 'Learn the app in a few minutes, then start exploring.'}</p>
          </div>
          <button className="help-close" type="button" onClick={onClose} aria-label="Close help">×</button>
        </header>

        <nav className="help-tabs" aria-label="Help topics">
          <button type="button" className={tab === 'student' ? 'active' : ''} onClick={() => setTab('student')}>
            🎓 Student
          </button>
          <button type="button" className={tab === 'teacher' ? 'active' : ''} onClick={() => setTab('teacher')}>
            🧑‍🏫 Teacher & Class
          </button>
          <button type="button" className={tab === 'app' ? 'active' : ''} onClick={() => setTab('app')}>
            ⚙️ App Help
          </button>
        </nav>

        <div className="help-content">
          {tab === 'student' && <StudentHelp mode={mode} gameStarted={gameStarted} />}
          {tab === 'teacher' && <TeacherHelp />}
          {tab === 'app' && <AppHelp />}
        </div>

        <footer className="help-footer">
          <span>Tip: press Esc to close Help on a keyboard.</span>
          <button type="button" className="btn-primary help-done" onClick={onClose}>Done</button>
        </footer>
      </article>
    </div>
  );
}
