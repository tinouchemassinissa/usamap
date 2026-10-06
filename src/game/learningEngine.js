export const DIFFICULTY_PROFILES = {
  BEGINNER: {
    id: 'BEGINNER',
    label: 'Beginner',
    description: 'More time, 5 lives, and learning hints.',
    lives: 5,
    time: 90,
    scoreMultiplier: 0.75,
    showHints: true,
  },
  INTERMEDIATE: {
    id: 'INTERMEDIATE',
    label: 'Intermediate',
    description: 'Balanced practice with standard scoring.',
    lives: 3,
    time: 60,
    scoreMultiplier: 1,
    showHints: false,
  },
  EXPERT: {
    id: 'EXPERT',
    label: 'Expert',
    description: 'Less time, 2 lives, and higher scoring.',
    lives: 2,
    time: 45,
    scoreMultiplier: 1.25,
    showHints: false,
  },
  MASTER: {
    id: 'MASTER',
    label: 'Master',
    description: 'One life, 35 seconds, maximum score multiplier.',
    lives: 1,
    time: 35,
    scoreMultiplier: 1.5,
    showHints: false,
  },
};

const EMPTY_STATE = {
  attempts: 0,
  correct: 0,
  mistakes: 0,
  correctStreak: 0,
  mastery: 0,
  lastSeen: null,
  nextReview: null,
  intervalDays: 0,
  lastResult: null,
};

export function normalizeLearnerProfile(raw = {}, stateNames = [], legacyMastery = {}) {
  const states = { ...(raw.states || {}) };
  stateNames.forEach((state) => {
    const existing = states[state] || {};
    states[state] = {
      ...EMPTY_STATE,
      ...existing,
      mastery: Number.isFinite(existing.mastery)
        ? existing.mastery
        : Number(legacyMastery[state] || 0),
    };
  });

  return {
    version: 2,
    states,
    totalAttempts: Number(raw.totalAttempts || 0),
    totalCorrect: Number(raw.totalCorrect || 0),
    currentLearningStreak: Number(raw.currentLearningStreak || 0),
    bestLearningStreak: Number(raw.bestLearningStreak || 0),
    updatedAt: raw.updatedAt || null,
  };
}

export function recordLearningAttempt(profile, state, isCorrect, now = Date.now()) {
  const current = profile.states[state] || EMPTY_STATE;
  const nextCorrectStreak = isCorrect ? current.correctStreak + 1 : 0;
  const intervalDays = isCorrect
    ? [1, 3, 7, 14, 30, 60][Math.min(nextCorrectStreak - 1, 5)]
    : 0;
  const mastery = isCorrect
    ? Math.min(1, current.mastery + (1 - current.mastery) * 0.22)
    : Math.max(0, current.mastery * 0.72);
  const reviewDelay = isCorrect
    ? intervalDays * 24 * 60 * 60 * 1000
    : 10 * 60 * 1000;
  const currentLearningStreak = isCorrect ? profile.currentLearningStreak + 1 : 0;

  return {
    ...profile,
    states: {
      ...profile.states,
      [state]: {
        ...current,
        attempts: current.attempts + 1,
        correct: current.correct + (isCorrect ? 1 : 0),
        mistakes: current.mistakes + (isCorrect ? 0 : 1),
        correctStreak: nextCorrectStreak,
        mastery,
        lastSeen: new Date(now).toISOString(),
        nextReview: new Date(now + reviewDelay).toISOString(),
        intervalDays,
        lastResult: isCorrect ? 'correct' : 'incorrect',
      },
    },
    totalAttempts: profile.totalAttempts + 1,
    totalCorrect: profile.totalCorrect + (isCorrect ? 1 : 0),
    currentLearningStreak,
    bestLearningStreak: Math.max(profile.bestLearningStreak, currentLearningStreak),
    updatedAt: new Date(now).toISOString(),
  };
}

export function getDueStates(profile, stateNames, now = Date.now()) {
  return stateNames.filter((state) => {
    const stats = profile.states[state] || EMPTY_STATE;
    if (!stats.attempts) return true;
    if (!stats.nextReview) return true;
    return Date.parse(stats.nextReview) <= now;
  });
}

export function getMistakeReviewStates(profile, minimumMistakes = 1) {
  return Object.entries(profile.states)
    .filter(([, stats]) => stats.mistakes >= minimumMistakes)
    .sort((a, b) => {
      const aAccuracy = a[1].attempts ? a[1].correct / a[1].attempts : 0;
      const bAccuracy = b[1].attempts ? b[1].correct / b[1].attempts : 0;
      return (b[1].mistakes - a[1].mistakes) || (aAccuracy - bAccuracy);
    })
    .map(([state]) => state);
}

export function selectLearningState(states, profile, random = Math.random, now = Date.now()) {
  if (!states.length) return null;
  const due = new Set(getDueStates(profile, states, now));
  const weights = states.map((state) => {
    const stats = profile.states[state] || EMPTY_STATE;
    const weakness = 1 - stats.mastery;
    const mistakeBoost = Math.min(1.5, stats.mistakes * 0.12);
    const dueBoost = due.has(state) ? 1.4 : 0;
    const unseenBoost = stats.attempts === 0 ? 1.2 : 0;
    return Math.max(0.08, weakness + mistakeBoost + dueBoost + unseenBoost);
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  let pick = random() * total;

  for (let index = 0; index < states.length; index += 1) {
    pick -= weights[index];
    if (pick <= 0) return states[index];
  }
  return states[states.length - 1];
}

export function recordModeResult(records = {}, mode, result, now = Date.now()) {
  const current = records[mode] || {
    plays: 0,
    wins: 0,
    bestScore: 0,
    bestAccuracy: 0,
    bestStreak: 0,
    lastPlayed: null,
  };
  return {
    ...records,
    [mode]: {
      ...current,
      plays: current.plays + 1,
      wins: current.wins + (result.completed ? 1 : 0),
      bestScore: Math.max(current.bestScore, result.score || 0),
      bestAccuracy: Math.max(current.bestAccuracy, result.accuracy || 0),
      bestStreak: Math.max(current.bestStreak, result.bestStreak || 0),
      lastPlayed: new Date(now).toISOString(),
    },
  };
}

export function getProgressSummary(profile) {
  const values = Object.values(profile.states);
  const mastered = values.filter((stats) => stats.mastery >= 0.8).length;
  const learning = values.filter((stats) => stats.attempts > 0 && stats.mastery < 0.8).length;
  const unseen = values.filter((stats) => stats.attempts === 0).length;
  const mastery = values.length
    ? Math.round(values.reduce((sum, stats) => sum + stats.mastery, 0) / values.length * 100)
    : 0;
  const accuracy = profile.totalAttempts
    ? Math.round(profile.totalCorrect / profile.totalAttempts * 100)
    : 0;
  return { mastered, learning, unseen, mastery, accuracy, attempts: profile.totalAttempts };
}

export function computeAchievements(profile, records = {}) {
  const summary = getProgressSummary(profile);
  const stateStats = Object.values(profile.states);
  const definitions = [
    { id: 'first-step', title: 'First Step', description: 'Complete your first learning attempt.', unlocked: summary.attempts >= 1 },
    { id: 'ten-mastered', title: 'Ten Strong', description: 'Master 10 states.', unlocked: summary.mastered >= 10 },
    { id: 'half-union', title: 'Half the Union', description: 'Master 25 states.', unlocked: summary.mastered >= 25 },
    { id: 'union-master', title: 'Union Master', description: 'Master all 50 states.', unlocked: summary.mastered >= 50 },
    { id: 'comeback', title: 'Comeback Learner', description: 'Master a state after at least 3 mistakes.', unlocked: stateStats.some((stats) => stats.mistakes >= 3 && stats.mastery >= 0.8) },
    { id: 'perfect-run', title: 'Perfect Run', description: 'Finish any recorded mode at 100% accuracy.', unlocked: Object.values(records).some((record) => record.bestAccuracy >= 100) },
    { id: 'capital-commander', title: 'Capital Commander', description: 'Win Capitals mode.', unlocked: (records.CAPITALS?.wins || 0) > 0 },
    { id: 'flag-scholar', title: 'Flag Scholar', description: 'Win Flags mode.', unlocked: (records.FLAGS?.wins || 0) > 0 },
    { id: 'border-expert', title: 'Border Expert', description: 'Win Neighbor Challenge.', unlocked: (records.NEIGHBORS?.wins || 0) > 0 },
    { id: 'road-scholar', title: 'Road Scholar', description: 'Complete a USA Journey.', unlocked: (records.JOURNEY?.wins || 0) > 0 },
  ];
  return definitions;
}

export function getMasteryBand(mastery) {
  if (mastery >= 0.8) return 'mastered';
  if (mastery >= 0.45) return 'learning';
  if (mastery > 0) return 'weak';
  return 'unseen';
}
