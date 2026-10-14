import { PatternAnalysisResult, PredictionEngineResult } from '../types';

export function getColor(n: number): 'RED' | 'GREEN' {
  // 0,2,4,6,8 are RED; 1,3,5,7,9 are GREEN
  return n % 2 === 0 ? 'RED' : 'GREEN';
}

/* ============================================================
   ADVANCED PATTERN DETECTION ENGINE
   Analyzes last 10 results to detect the active pattern
   NOW USING RED/GREEN
   ============================================================ */
export function analyzePatterns(history: Array<{ number?: number | string; result?: number | string }>): PatternAnalysisResult {
  if (!history || history.length < 6) {
    return { pattern: 'INSUFFICIENT DATA', confidence: 0, nextTrend: null };
  }

  // Get last 10 colors (R/G) - most recent first
  const last10 = history.slice(0, 10).map(h => {
    const raw = h.number !== undefined ? h.number : h.result;
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    const valid = isNaN(n) ? 0 : n;
    return getColor(valid) === 'RED' ? 'R' : 'G';
  });

  const last8 = last10.slice(0, 8);
  const last6 = last10.slice(0, 6);
  const last5 = last10.slice(0, 5);
  const last4 = last10.slice(0, 4);
  const last3 = last10.slice(0, 3);

  // Count R and G
  const rCount = last10.filter(x => x === 'R').length;
  const gCount = last10.filter(x => x === 'G').length;

  // Calculate changes (transitions)
  let changes = 0;
  for (let i = 0; i < last10.length - 1; i++) {
    if (last10[i] !== last10[i + 1]) changes++;
  }

  // ===== PATTERN 1: DRAGON (3+ same in a row) =====
  if (last4.length === 4 && last4.every(x => x === 'R')) {
    return { pattern: 'DRAGON RED', confidence: 92, nextTrend: 'GREEN' };
  }
  if (last4.length === 4 && last4.every(x => x === 'G')) {
    return { pattern: 'DRAGON GREEN', confidence: 92, nextTrend: 'RED' };
  }
  if (last3.length === 3 && last3.every(x => x === 'R')) {
    return { pattern: 'DRAGON RED', confidence: 85, nextTrend: 'GREEN' };
  }
  if (last3.length === 3 && last3.every(x => x === 'G')) {
    return { pattern: 'DRAGON GREEN', confidence: 85, nextTrend: 'RED' };
  }

  // ===== PATTERN 2: ZIGZAG (alternating) =====
  let zigzag = true;
  if (last6.length >= 4) {
    for (let i = 0; i < last6.length - 1; i++) {
      if (last6[i] === last6[i + 1]) { zigzag = false; break; }
    }
    if (zigzag) {
      return { pattern: 'ZIGZAG', confidence: 90, nextTrend: last6[0] === 'R' ? 'GREEN' : 'RED' };
    }
  }

  // ===== PATTERN 3: PAIR (2 same) =====
  if (last4.length === 4 && last4[0] === last4[1] && last4[2] === last4[3] && last4[0] !== last4[2]) {
    return { pattern: 'PAIR SWITCH', confidence: 88, nextTrend: last4[0] === 'R' ? 'GREEN' : 'RED' };
  }
  if (last3.length >= 2 && last3[0] === last3[1]) {
    return { pattern: 'PAIR', confidence: 78, nextTrend: last3[0] === 'R' ? 'GREEN' : 'RED' };
  }

  // ===== PATTERN 4: BREAKOUT (reversal after streak) =====
  if (last5.filter(x => x === 'R').length >= 4) {
    return { pattern: 'BREAKOUT', confidence: 87, nextTrend: 'GREEN' };
  }
  if (last5.filter(x => x === 'G').length >= 4) {
    return { pattern: 'BREAKOUT', confidence: 87, nextTrend: 'RED' };
  }

  // ===== PATTERN 5: ENTROPY (high randomness) =====
  if (changes >= 7) {
    return { pattern: 'HIGH ENTROPY', confidence: 70, nextTrend: last10[0] === 'R' ? 'GREEN' : 'RED' };
  }

  // ===== PATTERN 6: MOMENTUM (majority direction) =====
  if (rCount > gCount + 2) {
    return { pattern: 'MOMENTUM RED', confidence: 75, nextTrend: 'RED' };
  }
  if (gCount > rCount + 2) {
    return { pattern: 'MOMENTUM GREEN', confidence: 75, nextTrend: 'GREEN' };
  }

  // ===== DEFAULT: Reversal of last =====
  return { 
    pattern: 'NEUTRAL REVERSAL', 
    confidence: 68, 
    nextTrend: last10[0] === 'R' ? 'GREEN' : 'RED' 
  };
}

/* ============================================================
   PREDICTION ENGINE — Uses pattern detection + recovery
   NOW USING RED/GREEN
   ============================================================ */
export function getFinalPrediction(
  history: Array<{ number?: number | string; result?: number | string }>,
  lossStreak: number = 0,
  currentPrediction?: { trend: 'RED' | 'GREEN' } | null
): PredictionEngineResult {
  const analysis = analyzePatterns(history);
  let finalTrend: 'RED' | 'GREEN' = analysis.nextTrend || 'RED';
  let confidence = analysis.confidence || 70;
  let recoveryLevel = 1;

  // Recovery override
  if (lossStreak >= 2) {
    finalTrend = currentPrediction && currentPrediction.trend === 'RED' ? 'GREEN' : 'RED';
    recoveryLevel = 3;
    confidence = 99;
  } else if (lossStreak === 1) {
    finalTrend = currentPrediction && currentPrediction.trend === 'RED' ? 'GREEN' : 'RED';
    recoveryLevel = 2;
    confidence = 94;
  } else {
    recoveryLevel = 1;
  }

  // Ensure RED/GREEN only
  if (finalTrend !== 'RED' && finalTrend !== 'GREEN') {
    finalTrend = Math.random() < 0.5 ? 'RED' : 'GREEN';
  }

  // Pick main and opp numbers
  let mainPool: number[], oppPool: number[];
  if (finalTrend === 'RED') { 
    mainPool = [0, 2, 4, 6, 8]; 
    oppPool = [1, 3, 5, 7, 9]; 
  } else { 
    mainPool = [1, 3, 5, 7, 9]; 
    oppPool = [0, 2, 4, 6, 8]; 
  }

  // Frequency analysis from last 30
  const nums = history.slice(0, 30).map(i => {
    const raw = i.number !== undefined ? i.number : i.result;
    return typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  }).filter(n => !isNaN(n));

  const freq = Array(10).fill(0);
  nums.forEach(n => {
    if (n >= 0 && n <= 9) freq[n]++;
  });

  mainPool.sort((a, b) => freq[a] - freq[b]);
  oppPool.sort((a, b) => freq[b] - freq[a]);

  const mainNum = mainPool[Math.floor(Math.random() * mainPool.length)];
  let oppNum = oppPool[Math.floor(Math.random() * oppPool.length)];
  if (oppNum === mainNum) oppNum = (oppNum + 2) % 10;

  return {
    trend: finalTrend,
    main: mainNum,
    opp: oppNum,
    confidence: Math.min(99, Math.max(65, confidence)),
    pattern: analysis.pattern,
    recoveryLevel
  };
}
