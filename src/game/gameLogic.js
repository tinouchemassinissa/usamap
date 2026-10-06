export function shuffle(values, random = Math.random) {
  const items = [...values];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function generateMultipleChoice(correctAnswer, type, stateData, random = Math.random) {
  const stateNames = Object.keys(stateData);
  const options = new Set([correctAnswer]);

  while (options.size < 4) {
    const randomState = stateNames[Math.floor(random() * stateNames.length)];
    if (type === 'name') options.add(randomState);
    else if (type === 'population') options.add(stateData[randomState].population);
    else if (type === 'area') options.add(stateData[randomState].area);
    else if (type === 'capital') options.add(stateData[randomState].capital);
    else throw new Error(`Unsupported question type: ${type}`);
  }

  return shuffle([...options], random);
}

export function isAnswerCorrect({ mode, guess, targetState, correctAnswer }) {
  if (mode === 'TRIVIA') return guess === correctAnswer;
  return guess === targetState;
}

export function sanitizePlayerName(value) {
  const cleaned = (value || '').trim().replace(/[<>]/g, '').slice(0, 24);
  return cleaned || 'Explorer';
}

export function calculatePoints(streak) {
  return 10 * Math.max(1, streak);
}

export function updateMasteryScore(current = 0.5, isCorrect, alpha = 0.75) {
  const observation = isCorrect ? 1 : 0;
  return Math.max(0, Math.min(1, (alpha * current) + ((1 - alpha) * observation)));
}

export function selectWeightedState(states, mastery = {}, random = Math.random) {
  if (!states.length) return null;

  const weights = states.map((state) => Math.max(0.05, 1 - (mastery[state] ?? 0.5)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let pick = random() * total;

  for (let i = 0; i < states.length; i += 1) {
    pick -= weights[i];
    if (pick <= 0) return states[i];
  }

  return states[states.length - 1];
}
