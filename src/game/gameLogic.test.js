import { describe, expect, it } from 'vitest';
import {
  calculatePoints,
  generateMultipleChoice,
  isAnswerCorrect,
  sanitizePlayerName,
} from './gameLogic';

const data = {
  Texas: { capital: 'Austin', population: '29 Million', area: '268,596 sq mi' },
  California: { capital: 'Sacramento', population: '39 Million', area: '163,695 sq mi' },
  Nevada: { capital: 'Carson City', population: '3.1 Million', area: '110,572 sq mi' },
  Oregon: { capital: 'Salem', population: '4.2 Million', area: '98,379 sq mi' },
  Utah: { capital: 'Salt Lake City', population: '3.2 Million', area: '84,897 sq mi' },
};

describe('isAnswerCorrect', () => {
  it('uses the generated answer in trivia mode', () => {
    expect(isAnswerCorrect({
      mode: 'TRIVIA',
      guess: 'Austin',
      targetState: 'Texas',
      correctAnswer: 'Austin',
    })).toBe(true);
  });

  it('uses the state name in flags/reverse/classic modes', () => {
    expect(isAnswerCorrect({
      mode: 'FLAGS',
      guess: 'Texas',
      targetState: 'Texas',
      correctAnswer: 'Texas',
    })).toBe(true);
  });
});

describe('generateMultipleChoice', () => {
  it('always includes the correct answer and returns four unique choices', () => {
    const choices = generateMultipleChoice('Austin', 'capital', data, () => 0.51);
    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
    expect(choices).toContain('Austin');
  });
});

describe('player input and scoring', () => {
  it('sanitizes and bounds public leaderboard names', () => {
    expect(sanitizePlayerName('  <Massinissa>  ')).toBe('Massinissa');
    expect(sanitizePlayerName('')).toBe('Explorer');
    expect(sanitizePlayerName('123456789012345678901234567')).toHaveLength(24);
  });

  it('keeps the existing streak scoring rule', () => {
    expect(calculatePoints(1)).toBe(10);
    expect(calculatePoints(4)).toBe(40);
  });
});
