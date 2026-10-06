import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTY_PROFILES,
  computeAchievements,
  getDueStates,
  getMistakeReviewStates,
  getProgressSummary,
  normalizeLearnerProfile,
  recordLearningAttempt,
  recordModeResult,
  selectLearningState,
} from './learningEngine.js';
import { areNeighbors, getNeighbors, shortestJourney } from './geography.js';

test('difficulty profiles become progressively stricter', () => {
  assert.equal(DIFFICULTY_PROFILES.BEGINNER.lives, 5);
  assert.equal(DIFFICULTY_PROFILES.MASTER.lives, 1);
  assert.ok(DIFFICULTY_PROFILES.MASTER.scoreMultiplier > DIFFICULTY_PROFILES.INTERMEDIATE.scoreMultiplier);
});

test('legacy mastery migrates into learner profile', () => {
  const profile = normalizeLearnerProfile({}, ['Texas'], { Texas: 0.6 });
  assert.equal(profile.states.Texas.mastery, 0.6);
  assert.equal(profile.states.Texas.attempts, 0);
});

test('correct attempts increase mastery and schedule future review', () => {
  const now = Date.UTC(2026, 9, 6);
  const profile = normalizeLearnerProfile({}, ['Texas']);
  const updated = recordLearningAttempt(profile, 'Texas', true, now);
  assert.ok(updated.states.Texas.mastery > 0);
  assert.equal(updated.states.Texas.correctStreak, 1);
  assert.equal(Date.parse(updated.states.Texas.nextReview), now + 86400000);
});

test('mistakes lower mastery and become review candidates', () => {
  const now = Date.UTC(2026, 9, 6);
  let profile = normalizeLearnerProfile({}, ['Texas']);
  profile = recordLearningAttempt(profile, 'Texas', true, now);
  profile = recordLearningAttempt(profile, 'Texas', false, now + 1000);
  assert.equal(profile.states.Texas.mistakes, 1);
  assert.deepEqual(getMistakeReviewStates(profile), ['Texas']);
});

test('due states include unseen states and scheduled reviews', () => {
  const now = Date.UTC(2026, 9, 6);
  let profile = normalizeLearnerProfile({}, ['Texas', 'California']);
  profile = recordLearningAttempt(profile, 'Texas', true, now);
  assert.deepEqual(getDueStates(profile, ['Texas', 'California'], now), ['California']);
});

test('learning selection can favor weak due states', () => {
  const now = Date.UTC(2026, 9, 6);
  const profile = normalizeLearnerProfile({
    states: {
      Texas: { attempts: 8, correct: 8, mastery: 0.95, nextReview: new Date(now + 86400000).toISOString() },
      California: { attempts: 3, correct: 1, mistakes: 2, mastery: 0.2, nextReview: new Date(now - 1000).toISOString() },
    },
  }, ['Texas', 'California']);
  assert.equal(selectLearningState(['Texas', 'California'], profile, () => 0.5, now), 'California');
});

test('mode records retain best score and accuracy', () => {
  let records = recordModeResult({}, 'CLASSIC', { score: 100, accuracy: 80, bestStreak: 4, completed: false }, 0);
  records = recordModeResult(records, 'CLASSIC', { score: 90, accuracy: 100, bestStreak: 3, completed: true }, 1);
  assert.equal(records.CLASSIC.bestScore, 100);
  assert.equal(records.CLASSIC.bestAccuracy, 100);
  assert.equal(records.CLASSIC.wins, 1);
});

test('progress summary and achievements reflect mastery', () => {
  const profile = normalizeLearnerProfile({
    totalAttempts: 10,
    totalCorrect: 8,
    states: { Texas: { attempts: 5, correct: 5, mastery: 0.9 } },
  }, ['Texas', 'California']);
  const summary = getProgressSummary(profile);
  assert.equal(summary.mastered, 1);
  assert.equal(summary.accuracy, 80);
  assert.ok(computeAchievements(profile, {}).some((item) => item.id === 'first-step' && item.unlocked));
});

test('neighbor graph is symmetric for tested states', () => {
  assert.equal(areNeighbors('California', 'Nevada'), true);
  assert.equal(areNeighbors('Nevada', 'California'), true);
  assert.ok(getNeighbors('Tennessee').includes('Georgia'));
});

test('journey engine finds a valid shortest path', () => {
  const path = shortestJourney('California', 'New York');
  assert.equal(path[0], 'California');
  assert.equal(path[path.length - 1], 'New York');
  for (let index = 1; index < path.length; index += 1) {
    assert.equal(areNeighbors(path[index - 1], path[index]), true);
  }
});
