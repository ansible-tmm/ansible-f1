const KEYS = {
  BEST_SCORE: "builtToAutomate_bestScore",
  TOTAL_CORRECT: "builtToAutomate_totalCorrect",
  TOTAL_RUNS: "builtToAutomate_totalRuns",
};

function readNumber(key, fallback = 0) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function writeNumber(key, n) {
  try {
    localStorage.setItem(key, String(Math.floor(n)));
  } catch {
    /* ignore */
  }
}

export function getBestScore() {
  return readNumber(KEYS.BEST_SCORE, 0);
}

export function setBestScoreIfHigher(score) {
  const best = getBestScore();
  if (score > best) {
    writeNumber(KEYS.BEST_SCORE, score);
    return true;
  }
  return false;
}

export function getTotalCorrectAnswers() {
  return readNumber(KEYS.TOTAL_CORRECT, 0);
}

export function addTotalCorrectAnswers(delta) {
  const n = getTotalCorrectAnswers() + delta;
  writeNumber(KEYS.TOTAL_CORRECT, n);
}

export function getTotalRuns() {
  return readNumber(KEYS.TOTAL_RUNS, 0);
}

export function incrementTotalRuns() {
  writeNumber(KEYS.TOTAL_RUNS, getTotalRuns() + 1);
}
