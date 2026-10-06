import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addSessionAttempt,
  addSessionGame,
  buildClassWorkbookSheets,
  createClassSession,
  endClassSession,
  finishSessionGame,
} from '../classroomSession.js';

test('class session records only session-scoped games and attempts', () => {
  const now = Date.UTC(2026, 9, 6, 12, 0, 0);
  let session = createClassSession({
    className: 'Grade 5',
    teacherName: 'Ms. Rivera',
    sessionName: 'Census Regions',
  }, now);

  const started = addSessionGame(session, {
    student: 'Alex',
    mode: 'REGIONS',
    difficulty: 'BEGINNER',
  }, now + 1000);
  session = started.session;

  session = addSessionAttempt(session, {
    gameId: started.gameId,
    student: 'Alex',
    mode: 'REGIONS',
    difficulty: 'BEGINNER',
    variant: 'REGION',
    target: 'California',
    response: 'California',
    correct: true,
    scoreAfter: 100,
    streakAfter: 1,
    targetData: { region: 'West', division: 'Pacific', fips: '06' },
  }, now + 2000);

  session = finishSessionGame(session, started.gameId, {
    score: 100,
    attempts: 1,
    correct: 1,
    accuracy: 100,
    bestStreak: 1,
    completed: true,
    statesMissed: [],
  }, now + 3000);

  assert.equal(session.games.length, 1);
  assert.equal(session.attempts.length, 1);
  assert.equal(session.attempts[0].division, 'Pacific');
  assert.equal(session.games[0].accuracy, 100);

  const sheets = buildClassWorkbookSheets(session);
  assert.deepEqual(sheets.map((sheet) => sheet.name), ['Session Summary', 'Games', 'Attempts']);
  assert.equal(sheets[2].rows.length, 2);
});

test('ending a class session stops new scoped data', () => {
  const now = Date.UTC(2026, 9, 6);
  let session = createClassSession({ sessionName: 'Period 2' }, now);
  session = endClassSession(session, now + 5000);
  const started = addSessionGame(session, { student: 'Sam', mode: 'CLASSIC', difficulty: 'INTERMEDIATE' }, now + 6000);
  assert.equal(started.gameId, null);
  assert.equal(started.session.games.length, 0);
});
