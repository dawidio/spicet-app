// ── Successive-relearning scheduler ──
// Implements the Rawson & Dunlosky protocol: an entry is first LEARNED to a
// criterion of 3 correct retrievals, then RELEARNED in spaced passes at
// growing gaps (7d → 14d → 28d, then every 28d). Self-marks are
// "knew" / "lucky" / "wrong" — lucky counts as not-yet-known on purpose:
// calibration honesty is part of the protocol.

const DAY_MS = 24 * 60 * 60 * 1000;

export const MASTERY_CRITERION = 3; // correct retrievals to finish learning
export const RELEARN_GAPS_DAYS = [7, 14, 28]; // stage 1, 2, 3+; repeats at 28

export function createReviewState(now = Date.now()) {
  return {
    successes: 0, // correct retrievals during the learning phase
    stage: 0, // 0 = learning; 1+ = spaced relearning passes completed
    nextDue: now, // new entries are due immediately
    history: [], // [{ ts, mark }]
  };
}

export function isMastered(state) {
  return state.stage > 0 || state.successes >= MASTERY_CRITERION;
}

function gapForStage(stage) {
  const idx = Math.min(stage - 1, RELEARN_GAPS_DAYS.length - 1);
  return RELEARN_GAPS_DAYS[idx] * DAY_MS;
}

// Pure transition: returns a NEW state. mark ∈ 'knew' | 'lucky' | 'wrong'
export function applyMark(state, mark, now = Date.now()) {
  const s = {
    ...state,
    history: [...(state.history || []), { ts: now, mark }],
  };

  if (s.stage === 0) {
    // Learning phase — build to the mastery criterion
    if (mark === 'knew') s.successes += 1;
    else if (mark === 'wrong') s.successes = Math.max(0, s.successes - 1);
    // lucky: no credit, no penalty

    if (s.successes >= MASTERY_CRITERION) {
      s.stage = 1;
      s.nextDue = now + gapForStage(1);
    } else {
      s.nextDue = now + DAY_MS; // keep it in tomorrow's queue if the session ends
    }
    return s;
  }

  // Relearning phase
  if (mark === 'knew') {
    s.stage += 1;
    s.nextDue = now + gapForStage(s.stage);
  } else if (mark === 'lucky') {
    s.nextDue = now + 3 * DAY_MS; // same stage, short gap
  } else {
    s.stage = Math.max(1, s.stage - 1);
    s.nextDue = now + DAY_MS; // resurface tomorrow
  }
  return s;
}

// Session-level tally helpers (calibration summary)
export function tallyMarks(marks) {
  const t = { knew: 0, lucky: 0, wrong: 0 };
  for (const m of marks) if (t[m.mark] !== undefined) t[m.mark] += 1;
  return t;
}
