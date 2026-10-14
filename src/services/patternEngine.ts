import { PatternAnalysisResult, PredictionEngineResult, ColorPrediction } from '../types';

export function getBigSmall(n: number): 'BIG' | 'SMALL' {
  // 0-4 are SMALL, 5-9 are BIG
  return n >= 5 ? 'BIG' : 'SMALL';
}

/* ============================================================
   ADVANCED PATTERN DETECTION ENGINE (BIG / SMALL)
   Analyzes last 10 results to detect the active pattern
   ============================================================ */
export function analyzePatterns(history: Array<{ number?: number | string; result?: number | string }>): PatternAnalysisResult {
  if (!history || history.length < 6) {
    return { pattern: 'INSUFFICIENT DATA', confidence: 0, nextTrend: null };
  }

  // Get last 10 (B/S) - most recent first
  const last10 = history.slice(0, 10).map(h => {
    const raw = h.number !== undefined ? h.number : h.result;
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    const valid = isNaN(n) ? 0 : n;
    return getBigSmall(valid) === 'BIG' ? 'B' : 'S';
  });

  const last8 = last10.slice(0, 8);
  const last6 = last10.slice(0, 6);
  const last5 = last10.slice(0, 5);
  const last4 = last10.slice(0, 4);
  const last3 = last10.slice(0, 3);

  // Count B and S
  const bCount = last10.filter(x => x === 'B').length;
  const sCount = last10.filter(x => x === 'S').length;

  // Calculate changes (transitions)
  let changes = 0;
  for (let i = 0; i < last10.length - 1; i++) {
    if (last10[i] !== last10[i + 1]) changes++;
  }

  // ===== PATTERN 1: DRAGON (3+ same in a row) =====
  if (last4.length === 4 && last4.every(x => x === 'B')) {
    return { pattern: 'DRAGON BIG', confidence: 92, nextTrend: 'SMALL' };
  }
  if (last4.length === 4 && last4.every(x => x === 'S')) {
    return { pattern: 'DRAGON SMALL', confidence: 92, nextTrend: 'BIG' };
  }
  if (last3.length === 3 && last3.every(x => x === 'B')) {
    return { pattern: 'DRAGON BIG', confidence: 85, nextTrend: 'SMALL' };
  }
  if (last3.length === 3 && last3.every(x => x === 'S')) {
    return { pattern: 'DRAGON SMALL', confidence: 85, nextTrend: 'BIG' };
  }

  // ===== PATTERN 2: ZIGZAG (alternating) =====
  let zigzag = true;
  for (let i = 0; i < last6.length - 1; i++) {
    if (last6[i] === last6[i + 1]) { zigzag = false; break; }
  }
  if (zigzag && last6.length >= 4) {
    return { pattern: 'ZIGZAG', confidence: 90, nextTrend: last6[0] === 'B' ? 'SMALL' : 'BIG' };
  }

  // ===== PATTERN 3: PAIR (2 same) =====
  if (last4.length >= 4 && last4[0] === last4[1] && last4[2] === last4[3] && last4[0] !== last4[2]) {
    return { pattern: 'PAIR SWITCH', confidence: 88, nextTrend: last4[0] === 'B' ? 'SMALL' : 'BIG' };
  }
  if (last3.length >= 3 && last3[0] === last3[1]) {
    return { pattern: 'PAIR', confidence: 78, nextTrend: last3[0] === 'B' ? 'SMALL' : 'BIG' };
  }

  // ===== PATTERN 4: BREAKOUT (reversal after streak) =====
  if (last5.filter(x => x === 'B').length >= 4) {
    return { pattern: 'BREAKOUT', confidence: 87, nextTrend: 'SMALL' };
  }
  if (last5.filter(x => x === 'S').length >= 4) {
    return { pattern: 'BREAKOUT', confidence: 87, nextTrend: 'BIG' };
  }

  // ===== PATTERN 5: ENTROPY (high randomness) =====
  if (changes >= 7) {
    return { pattern: 'HIGH ENTROPY', confidence: 70, nextTrend: last10[0] === 'B' ? 'SMALL' : 'BIG' };
  }

  // ===== PATTERN 6: MOMENTUM (majority direction) =====
  if (bCount > sCount + 2) {
    return { pattern: 'MOMENTUM BIG', confidence: 75, nextTrend: 'BIG' };
  }
  if (sCount > bCount + 2) {
    return { pattern: 'MOMENTUM SMALL', confidence: 75, nextTrend: 'SMALL' };
  }

  // ===== DEFAULT: Reversal of last =====
  return { 
    pattern: 'NEUTRAL REVERSAL', 
    confidence: 68, 
    nextTrend: last10[0] === 'B' ? 'SMALL' : 'BIG' 
  };
}

let lossStreak = 0;
let recoveryLevel = 1;

export function recordPredictionOutcome(won: boolean) {
  if (won) {
    lossStreak = 0;
    recoveryLevel = 1;
  } else {
    lossStreak++;
    if (lossStreak >= 2) {
      recoveryLevel = Math.min(recoveryLevel + 1, 3);
    }
  }
}

export function getFinalPrediction(history: Array<{ number?: number | string; result?: number | string }>): PredictionEngineResult {
  const analysis = analyzePatterns(history);
  let finalTrend: ColorPrediction = (analysis.nextTrend as ColorPrediction) || 'BIG';
  let confidence = analysis.confidence || 70;

  // Recovery override
  if (lossStreak >= 2) {
    finalTrend = finalTrend === 'BIG' ? 'SMALL' : 'BIG';
    recoveryLevel = 3;
    confidence = 99;
  } else if (lossStreak === 1) {
    recoveryLevel = 2;
    confidence = 88;
  }

  // Generate two numbers:
  // If BIG, generate one from [5,6,7,8,9] and one from [0,1,2,3,4]
  // If SMALL, generate one from [0,1,2,3,4] and one from [5,6,7,8,9]
  let num1: number, num2: number;
  if (finalTrend === 'BIG') {
    const bigs = [5, 6, 7, 8, 9];
    const smalls = [0, 1, 2, 3, 4];
    num1 = bigs[Math.floor(Math.random() * bigs.length)];
    num2 = smalls[Math.floor(Math.random() * smalls.length)];
  } else {
    const smalls = [0, 1, 2, 3, 4];
    const bigs = [5, 6, 7, 8, 9];
    num1 = smalls[Math.floor(Math.random() * smalls.length)];
    num2 = bigs[Math.floor(Math.random() * bigs.length)];
  }

  return {
    trend: finalTrend,
    numbers: [num1, num2],
    confidence,
    pattern: analysis.pattern,
    recoveryLevel
  };
}
