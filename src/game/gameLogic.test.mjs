import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePoints,
  generateMultipleChoice,
  isAnswerCorrect,
  sanitizePlayerName,
  selectWeightedState,
  updateMasteryScore,
} from './gameLogic.js';

const data = {
  Texas: { capital: 'Austin', population: '29 Million', area: '268,596 sq mi' },
  California: { capital: 'Sacramento', population: '39 Million', area: '163,695 sq mi' },
  Nevada: { capital: 'Carson City', population: '3.1 Million', area: '110,572 sq mi' },
  Oregon: { capital: 'Salem', population: '4.2 Million', area: '98,379 sq mi' },
  Utah: { capital: 'Salt Lake City', population: '3.2 Million', area: '84,897 sq mi' },
};

test('trivia checks the generated answer rather than the state name', () => {
  assert.equal(isAnswerCorrect({
    mode: 'TRIVIA',
    guess: 'Austin',
    targetState: 'Texas',
    correctAnswer: 'Austin',
  }), true);
});

test('flags/reverse/classic check the target state', () => {
  assert.equal(isAnswerCorrect({
    mode: 'FLAGS',
    guess: 'Texas',
    targetState: 'Texas',
    correctAnswer: 'Texas',
  }), true);
});

test('multiple choice contains four unique choices including the answer', () => {
  let n = 0;
  const deterministicRandom = () => ([0.0, 0.26, 0.51, 0.76, 0.99][n++ % 5]);
  const choices = generateMultipleChoice('Austin', 'capital', data, deterministicRandom);
  assert.equal(choices.length, 4);
  assert.equal(new Set(choices).size, 4);
  assert.equal(choices.includes('Austin'), true);
});

test('public player names are bounded and sanitized', () => {
  assert.equal(sanitizePlayerName('  <Massinissa>  '), 'Massinissa');
  assert.equal(sanitizePlayerName(''), 'Explorer');
  assert.equal(sanitizePlayerName('123456789012345678901234567').length, 24);
});

test('streak scoring remains deterministic', () => {
  assert.equal(calculatePoints(1), 10);
  assert.equal(calculatePoints(4), 40);
});

test('mastery moves toward observed performance', () => {
  assert.equal(updateMasteryScore(0.5, true), 0.625);
  assert.equal(updateMasteryScore(0.5, false), 0.375);
});

test('adaptive selection can prioritize weak states', () => {
  const state = selectWeightedState(
    ['Texas', 'California'],
    { Texas: 0.95, California: 0.1 },
    () => 0.5,
  );
  assert.equal(state, 'California');
});
