import { ColorPrediction } from '../types';

export interface AiModelReport {
  id: string;
  name: string;
  icon: string;
  predictedTrend: ColorPrediction;
  confidence: number;
  reasoning: string;
  pickedNumbers: [number, number];
}

export interface MultiAiConsensus {
  finalTrend: ColorPrediction;
  mainNumber: number;
  oppNumber: number;
  overallConfidence: number;
  activePattern: string;
  recoveryLevel: number;
  engineReports: AiModelReport[];
}

export function getBigSmall(n: number): ColorPrediction {
  return n >= 5 ? 'BIG' : 'SMALL';
}

// 1. ENGINE: NEURAL PATTERN CORE
function runPatternCore(history: Array<{ number?: number | string; result?: number | string }>): {
  trend: ColorPrediction;
  pattern: string;
  confidence: number;
} {
  if (!history || history.length < 5) {
    return { trend: 'BIG', pattern: 'INITIAL NEURAL SEED', confidence: 75 };
  }

  const last10 = history.slice(0, 10).map(h => {
    const raw = h.number !== undefined ? h.number : h.result;
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    return getBigSmall(isNaN(n) ? 0 : n) === 'BIG' ? 'B' : 'S';
  });

  const last4 = last10.slice(0, 4);
  const last3 = last10.slice(0, 3);
  const last6 = last10.slice(0, 6);

  // Dragon
  if (last4.length === 4 && last4.every(x => x === 'B')) {
    return { trend: 'SMALL', pattern: 'DRAGON BIG BREAK', confidence: 94 };
  }
  if (last4.length === 4 && last4.every(x => x === 'S')) {
    return { trend: 'BIG', pattern: 'DRAGON SMALL BREAK', confidence: 94 };
  }
  if (last3.length === 3 && last3.every(x => x === 'B')) {
    return { trend: 'SMALL', pattern: 'DRAGON BIG STREAK', confidence: 88 };
  }
  if (last3.length === 3 && last3.every(x => x === 'S')) {
    return { trend: 'BIG', pattern: 'DRAGON SMALL STREAK', confidence: 88 };
  }

  // Zigzag
  let zigzag = true;
  if (last6.length >= 4) {
    for (let i = 0; i < last6.length - 1; i++) {
      if (last6[i] === last6[i + 1]) { zigzag = false; break; }
    }
    if (zigzag) {
      return { trend: last6[0] === 'B' ? 'SMALL' : 'BIG', pattern: 'ZIGZAG OSCILLATOR', confidence: 91 };
    }
  }

  // Pair switch
  if (last4.length === 4 && last4[0] === last4[1] && last4[2] === last4[3] && last4[0] !== last4[2]) {
    return { trend: last4[0] === 'B' ? 'SMALL' : 'BIG', pattern: 'PAIR SWITCH PROTOCOL', confidence: 89 };
  }

  // Momentum
  const bCount = last10.filter(x => x === 'B').length;
  const sCount = last10.filter(x => x === 'S').length;
  if (bCount >= 7) return { trend: 'BIG', pattern: 'MOMENTUM DOMINANCE (BIG)', confidence: 82 };
  if (sCount >= 7) return { trend: 'SMALL', pattern: 'MOMENTUM DOMINANCE (SMALL)', confidence: 82 };

  return { trend: last10[0] === 'B' ? 'SMALL' : 'BIG', pattern: 'DYNAMIC NEURAL REVERSAL', confidence: 78 };
}

// 2. ENGINE: QUANTUM FREQUENCY ANALYZER
function runFrequencyAnalyzer(history: Array<{ number?: number | string; result?: number | string }>): {
  trend: ColorPrediction;
  hotBig: number;
  hotSmall: number;
  confidence: number;
} {
  const nums = history.slice(0, 30).map(i => {
    const raw = i.number !== undefined ? i.number : i.result;
    return typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  }).filter(n => !isNaN(n) && n >= 0 && n <= 9);

  const freq = Array(10).fill(0);
  nums.forEach(n => freq[n]++);

  const bigs = [5, 6, 7, 8, 9];
  const smalls = [0, 1, 2, 3, 4];

  bigs.sort((a, b) => freq[b] - freq[a]); // highest freq first
  smalls.sort((a, b) => freq[b] - freq[a]);

  const bigTotalWeight = bigs.reduce((acc, curr) => acc + freq[curr], 0);
  const smallTotalWeight = smalls.reduce((acc, curr) => acc + freq[curr], 0);

  const trend: ColorPrediction = bigTotalWeight <= smallTotalWeight ? 'BIG' : 'SMALL';
  const confidence = 82 + Math.min(12, Math.abs(bigTotalWeight - smallTotalWeight) * 2);

  return {
    trend,
    hotBig: bigs[0] ?? 7,
    hotSmall: smalls[0] ?? 2,
    confidence: Math.min(96, confidence)
  };
}

// 3. ENGINE: TREND MATRIX & PARITY EQUILIBRIUM
function runEquilibriumMatrix(history: Array<{ number?: number | string; result?: number | string }>): {
  trend: ColorPrediction;
  confidence: number;
  shiftProb: number;
} {
  if (!history || history.length < 3) {
    return { trend: 'BIG', confidence: 75, shiftProb: 50 };
  }

  const last5 = history.slice(0, 5).map(h => {
    const raw = h.number !== undefined ? h.number : h.result;
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    return getBigSmall(isNaN(n) ? 0 : n);
  });

  let currentRun = 1;
  for (let i = 1; i < last5.length; i++) {
    if (last5[i] === last5[0]) currentRun++;
    else break;
  }

  // Poisson streak decay
  const decayThreshold = 3;
  if (currentRun >= decayThreshold) {
    const nextTrend: ColorPrediction = last5[0] === 'BIG' ? 'SMALL' : 'BIG';
    return { trend: nextTrend, confidence: 86 + currentRun * 2, shiftProb: 88 };
  }

  return { trend: last5[0] === 'BIG' ? 'BIG' : 'SMALL', confidence: 74, shiftProb: 40 };
}

// 4. ENGINE: ADAPTIVE RECOVERY CORE (MARTINGALE ADVISOR)
function runRecoveryCore(lossStreak: number, currentTrend: ColorPrediction): {
  overrideTrend: ColorPrediction;
  recoveryLevel: number;
  confidenceBonus: number;
} {
  let recoveryLevel = 1;
  let confidenceBonus = 0;
  let overrideTrend = currentTrend;

  if (lossStreak >= 2) {
    recoveryLevel = 3;
    confidenceBonus = 18;
    overrideTrend = currentTrend === 'BIG' ? 'SMALL' : 'BIG';
  } else if (lossStreak === 1) {
    recoveryLevel = 2;
    confidenceBonus = 10;
    overrideTrend = currentTrend === 'BIG' ? 'SMALL' : 'BIG';
  }

  return { overrideTrend, recoveryLevel, confidenceBonus };
}

// MULTI-AI CONSENSUS CALCULATOR
export function calculateMultiAiConsensus(
  history: Array<{ number?: number | string; result?: number | string }>,
  lossStreak: number = 0
): MultiAiConsensus {
  const engine1 = runPatternCore(history);
  const engine2 = runFrequencyAnalyzer(history);
  const engine3 = runEquilibriumMatrix(history);
  const engine4 = runRecoveryCore(lossStreak, engine1.trend);

  const reports: AiModelReport[] = [
    {
      id: 'AI-1',
      name: 'Neural Pattern Engine',
      icon: '🧠',
      predictedTrend: engine1.trend,
      confidence: engine1.confidence,
      reasoning: `Detected active: ${engine1.pattern}`,
      pickedNumbers: engine1.trend === 'BIG' ? [engine2.hotBig, engine2.hotSmall] : [engine2.hotSmall, engine2.hotBig]
    },
    {
      id: 'AI-2',
      name: 'Quantum Frequency Core',
      icon: '⚛️',
      predictedTrend: engine2.trend,
      confidence: engine2.confidence,
      reasoning: `Transition target ${engine2.trend === 'BIG' ? engine2.hotBig : engine2.hotSmall}`,
      pickedNumbers: [engine2.hotBig, engine2.hotSmall]
    },
    {
      id: 'AI-3',
      name: 'Parity Equilibrium Matrix',
      icon: '📐',
      predictedTrend: engine3.trend,
      confidence: engine3.confidence,
      reasoning: `Volatility decay probability ${engine3.shiftProb}%`,
      pickedNumbers: engine3.trend === 'BIG' ? [engine2.hotBig, 3] : [engine2.hotSmall, 8]
    },
    {
      id: 'AI-4',
      name: 'Adaptive Recovery Core',
      icon: '🛡️',
      predictedTrend: engine4.overrideTrend,
      confidence: Math.min(99, 78 + engine4.confidenceBonus),
      reasoning: `Streak protection status: Level ${engine4.recoveryLevel} defense`,
      pickedNumbers: engine4.overrideTrend === 'BIG' ? [engine2.hotBig, engine2.hotSmall] : [engine2.hotSmall, engine2.hotBig]
    }
  ];

  let bigScore = 0;
  let smallScore = 0;

  const weights = [0.35, 0.25, 0.20, 0.20];
  reports.forEach((rep, idx) => {
    const w = weights[idx] * (rep.confidence / 100);
    if (rep.predictedTrend === 'BIG') bigScore += w;
    else smallScore += w;
  });

  let finalTrend: ColorPrediction;
  if (lossStreak >= 2) {
    finalTrend = engine4.overrideTrend;
  } else {
    finalTrend = bigScore >= smallScore ? 'BIG' : 'SMALL';
  }

  let mainNumber: number;
  let oppNumber: number;

  if (finalTrend === 'BIG') {
    mainNumber = engine2.hotBig;
    oppNumber = engine2.hotSmall;
  } else {
    mainNumber = engine2.hotSmall;
    oppNumber = engine2.hotBig;
  }

  const overallConfidence = Math.min(
    99,
    Math.max(76, Math.round((Math.max(bigScore, smallScore) / (bigScore + smallScore)) * 100 + (lossStreak > 0 ? 8 : 0)))
  );

  return {
    finalTrend,
    mainNumber,
    oppNumber,
    overallConfidence,
    activePattern: engine1.pattern,
    recoveryLevel: engine4.recoveryLevel,
    engineReports: reports
  };
}
