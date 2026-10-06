function iso(now = Date.now()) {
  return new Date(now).toISOString();
}

export function createClassSession(settings = {}, now = Date.now()) {
  const startedAt = iso(now);
  return {
    id: 'session-' + now,
    name: settings.sessionName?.trim() || 'Class Session ' + new Date(now).toLocaleDateString(),
    className: settings.className?.trim() || '',
    teacherName: settings.teacherName?.trim() || '',
    startedAt,
    endedAt: null,
    active: true,
    games: [],
    attempts: [],
  };
}

export function addSessionGame(session, details, now = Date.now()) {
  if (!session?.active) return { session, gameId: null };
  const gameId = 'game-' + now + '-' + (session.games.length + 1);
  const game = {
    id: gameId,
    student: details.student || 'Explorer',
    mode: details.mode || '',
    difficulty: details.difficulty || '',
    startedAt: iso(now),
    endedAt: null,
    score: 0,
    attempts: 0,
    correct: 0,
    accuracy: 0,
    bestStreak: 0,
    completed: false,
    status: 'in-progress',
    statesMissed: '',
  };
  return {
    session: { ...session, games: [...session.games, game] },
    gameId,
  };
}

export function addSessionAttempt(session, details, now = Date.now()) {
  if (!session?.active || !details.gameId) return session;
  const targetData = details.targetData || {};
  const attempt = {
    timestamp: iso(now),
    gameId: details.gameId,
    student: details.student || 'Explorer',
    mode: details.mode || '',
    difficulty: details.difficulty || '',
    variant: details.variant || '',
    target: details.target || '',
    response: details.response || '',
    correct: Boolean(details.correct),
    scoreAfter: Number(details.scoreAfter || 0),
    streakAfter: Number(details.streakAfter || 0),
    region: targetData.region || '',
    division: targetData.division || '',
    fips: targetData.fips || '',
  };
  return { ...session, attempts: [...session.attempts, attempt] };
}

export function finishSessionGame(session, gameId, result, now = Date.now()) {
  if (!session || !gameId) return session;
  return {
    ...session,
    games: session.games.map((game) => {
      if (game.id !== gameId) return game;
      return {
        ...game,
        endedAt: iso(now),
        score: Number(result.score || 0),
        attempts: Number(result.attempts || 0),
        correct: Number(result.correct || 0),
        accuracy: Number(result.accuracy || 0),
        bestStreak: Number(result.bestStreak || 0),
        completed: Boolean(result.completed),
        status: result.status || (result.completed ? 'completed' : 'ended'),
        statesMissed: Array.isArray(result.statesMissed)
          ? result.statesMissed.join(', ')
          : (result.statesMissed || ''),
      };
    }),
  };
}

export function endClassSession(session, now = Date.now()) {
  if (!session?.id) return session;
  return { ...session, active: false, endedAt: iso(now) };
}

export function buildClassWorkbookSheets(session) {
  const games = session?.games || [];
  const attempts = session?.attempts || [];
  const students = new Set(games.map((game) => game.student).filter(Boolean));
  const totalAttempts = games.reduce((sum, game) => sum + (game.attempts || 0), 0);
  const totalCorrect = games.reduce((sum, game) => sum + (game.correct || 0), 0);
  const accuracy = totalAttempts ? Math.round(totalCorrect / totalAttempts * 100) : 0;

  const summaryRows = [
    ['USA State Explorer — Class Session Report', ''],
    ['Session name', session?.name || ''],
    ['Class', session?.className || ''],
    ['Teacher', session?.teacherName || ''],
    ['Session ID', session?.id || ''],
    ['Started', session?.startedAt || ''],
    ['Ended', session?.endedAt || 'In progress'],
    ['Students', students.size],
    ['Games', games.length],
    ['Attempts', totalAttempts],
    ['Correct', totalCorrect],
    ['Accuracy (%)', accuracy],
  ];

  const gameRows = [
    ['Game ID', 'Student', 'Mode', 'Difficulty', 'Started', 'Ended', 'Status', 'Completed', 'Score', 'Attempts', 'Correct', 'Accuracy (%)', 'Best streak', 'States missed'],
    ...games.map((game) => [
      game.id, game.student, game.mode, game.difficulty, game.startedAt, game.endedAt || '',
      game.status, game.completed, game.score, game.attempts, game.correct, game.accuracy,
      game.bestStreak, game.statesMissed,
    ]),
  ];

  const attemptRows = [
    ['Timestamp', 'Game ID', 'Student', 'Mode', 'Difficulty', 'Variant', 'Target state', 'Response', 'Correct', 'Score after', 'Streak after', 'Census region', 'Census division', 'FIPS'],
    ...attempts.map((attempt) => [
      attempt.timestamp, attempt.gameId, attempt.student, attempt.mode, attempt.difficulty,
      attempt.variant, attempt.target, attempt.response, attempt.correct, attempt.scoreAfter,
      attempt.streakAfter, attempt.region, attempt.division, attempt.fips,
    ]),
  ];

  return [
    { name: 'Session Summary', rows: summaryRows },
    { name: 'Games', rows: gameRows },
    { name: 'Attempts', rows: attemptRows },
  ];
}
