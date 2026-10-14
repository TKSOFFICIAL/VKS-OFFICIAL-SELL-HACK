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

export function getColor(n: number): ColorPrediction {
  return [0, 2, 4, 6, 8].includes(n) ? 'RED' : 'GREEN';
}

// 1. ENGINE: NEURAL PATTERN CORE
function runPatternCore(history: Array<{ number?: number | string; result?: number | string }>): {
  trend: ColorPrediction;
  pattern: string;
  confidence: number;
} {
  if (!history || history.length < 5) {
    return { trend: 'RED', pattern: 'INITIAL NEURAL SEED', confidence: 75 };
  }

  const last10 = history.slice(0, 10).map(h => {
    const raw = h.number !== undefined ? h.number : h.result;
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    return getColor(isNaN(n) ? 0 : n) === 'RED' ? 'R' : 'G';
  });

  const last4 = last10.slice(0, 4);
  const last3 = last10.slice(0, 3);
  const last6 = last10.slice(0, 6);

  // Dragon
  if (last4.length === 4 && last4.every(x => x === 'R')) {
    return { trend: 'GREEN', pattern: 'DRAGON RED BREAK', confidence: 94 };
  }
  if (last4.length === 4 && last4.every(x => x === 'G')) {
    return { trend: 'RED', pattern: 'DRAGON GREEN BREAK', confidence: 94 };
  }
  if (last3.length === 3 && last3.every(x => x === 'R')) {
    return { trend: 'GREEN', pattern: 'DRAGON RED STREAK', confidence: 88 };
  }
  if (last3.length === 3 && last3.every(x => x === 'G')) {
    return { trend: 'RED', pattern: 'DRAGON GREEN STREAK', confidence: 88 };
  }

  // Zigzag
  let zigzag = true;
  if (last6.length >= 4) {
    for (let i = 0; i < last6.length - 1; i++) {
      if (last6[i] === last6[i + 1]) { zigzag = false; break; }
    }
    if (zigzag) {
      return { trend: last6[0] === 'R' ? 'GREEN' : 'RED', pattern: 'ZIGZAG OSCILLATOR', confidence: 91 };
    }
  }

  // Pair switch
  if (last4.length === 4 && last4[0] === last4[1] && last4[2] === last4[3] && last4[0] !== last4[2]) {
    return { trend: last4[0] === 'R' ? 'GREEN' : 'RED', pattern: 'PAIR SWITCH PROTOCOL', confidence: 89 };
  }

  // Momentum
  const rCount = last10.filter(x => x === 'R').length;
  const gCount = last10.filter(x => x === 'G').length;
  if (rCount >= 7) return { trend: 'RED', pattern: 'MOMENTUM DOMINANCE (RED)', confidence: 82 };
  if (gCount >= 7) return { trend: 'GREEN', pattern: 'MOMENTUM DOMINANCE (GREEN)', confidence: 82 };

  return { trend: last10[0] === 'R' ? 'GREEN' : 'RED', pattern: 'DYNAMIC NEURAL REVERSAL', confidence: 78 };
}

// 2. ENGINE: QUANTUM FREQUENCY ANALYZER
function runFrequencyAnalyzer(history: Array<{ number?: number | string; result?: number | string }>): {
  trend: ColorPrediction;
  hotEven: number;
  hotOdd: number;
  confidence: number;
} {
  const nums = history.slice(0, 30).map(i => {
    const raw = i.number !== undefined ? i.number : i.result;
    return typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  }).filter(n => !isNaN(n) && n >= 0 && n <= 9);

  const freq = Array(10).fill(0);
  nums.forEach(n => freq[n]++);

  const evens = [0, 2, 4, 6, 8];
  const odds = [1, 3, 5, 7, 9];

  evens.sort((a, b) => freq[b] - freq[a]); // highest freq first
  odds.sort((a, b) => freq[b] - freq[a]);

  const evenTotalWeight = evens.reduce((acc, curr) => acc + freq[curr], 0);
  const oddTotalWeight = odds.reduce((acc, curr) => acc + freq[curr], 0);

  // Mean reversion bias: if evens are cold, evens will catch up
  const trend: ColorPrediction = evenTotalWeight <= oddTotalWeight ? 'RED' : 'GREEN';
  const confidence = 82 + Math.min(12, Math.abs(evenTotalWeight - oddTotalWeight) * 2);

  return {
    trend,
    hotEven: evens[0] ?? 2,
    hotOdd: odds[0] ?? 7,
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
    return { trend: 'RED', confidence: 75, shiftProb: 50 };
  }

  const last5 = history.slice(0, 5).map(h => {
    const raw = h.number !== undefined ? h.number : h.result;
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    return getColor(isNaN(n) ? 0 : n);
  });

  let currentRun = 1;
  for (let i = 1; i < last5.length; i++) {
    if (last5[i] === last5[0]) currentRun++;
    else break;
  }

  // Poisson streak decay
  const decayThreshold = 3;
  if (currentRun >= decayThreshold) {
    const nextTrend: ColorPrediction = last5[0] === 'RED' ? 'GREEN' : 'RED';
    return { trend: nextTrend, confidence: 86 + currentRun * 2, shiftProb: 88 };
  }

  return { trend: last5[0] === 'RED' ? 'RED' : 'GREEN', confidence: 74, shiftProb: 40 };
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
    overrideTrend = currentTrend === 'RED' ? 'GREEN' : 'RED';
  } else if (lossStreak === 1) {
    recoveryLevel = 2;
    confidenceBonus = 10;
    overrideTrend = currentTrend === 'RED' ? 'GREEN' : 'RED';
  }

  return { overrideTrend, recoveryLevel, confidenceBonus };
}

// MULTI-AI CONSENSUS CALCULATOR
export function calculateMultiAiConsensus(
  history: Array<{ number?: number | string; result?: number | string }>,
  lossStreak: number = 0
): MultiAiConsensus {
  // Run all 4 AI engines
  const engine1 = runPatternCore(history);
  const engine2 = runFrequencyAnalyzer(history);
  const engine3 = runEquilibriumMatrix(history);
  const engine4 = runRecoveryCore(lossStreak, engine1.trend);

  // Compile individual reports
  const reports: AiModelReport[] = [
    {
      id: 'AI-1',
      name: 'Neural Pattern Engine',
      icon: '🧠',
      predictedTrend: engine1.trend,
      confidence: engine1.confidence,
      reasoning: `Detected active: ${engine1.pattern}`,
      pickedNumbers: engine1.trend === 'RED' ? [engine2.hotEven, engine2.hotOdd] : [engine2.hotOdd, engine2.hotEven]
    },
    {
      id: 'AI-2',
      name: 'Quantum Frequency Core',
      icon: '⚛️',
      predictedTrend: engine2.trend,
      confidence: engine2.confidence,
      reasoning: `Cold-to-hot transition target ${engine2.trend === 'RED' ? engine2.hotEven : engine2.hotOdd}`,
      pickedNumbers: [engine2.hotEven, engine2.hotOdd]
    },
    {
      id: 'AI-3',
      name: 'Parity Equilibrium Matrix',
      icon: '📐',
      predictedTrend: engine3.trend,
      confidence: engine3.confidence,
      reasoning: `Volatility decay probability ${engine3.shiftProb}%`,
      pickedNumbers: engine3.trend === 'RED' ? [engine2.hotEven, 7] : [engine2.hotOdd, 2]
    },
    {
      id: 'AI-4',
      name: 'Adaptive Recovery Core',
      icon: '🛡️',
      predictedTrend: engine4.overrideTrend,
      confidence: Math.min(99, 78 + engine4.confidenceBonus),
      reasoning: `Streak protection status: Level ${engine4.recoveryLevel} defense`,
      pickedNumbers: engine4.overrideTrend === 'RED' ? [engine2.hotEven, engine2.hotOdd] : [engine2.hotOdd, engine2.hotEven]
    }
  ];

  // Weighted Voting
  let redScore = 0;
  let greenScore = 0;

  // Weightings
  const weights = [0.35, 0.25, 0.20, 0.20];
  reports.forEach((rep, idx) => {
    const w = weights[idx] * (rep.confidence / 100);
    if (rep.predictedTrend === 'RED') redScore += w;
    else greenScore += w;
  });

  // If lossStreak >= 2, Recovery Core holds veto power
  let finalTrend: ColorPrediction;
  if (lossStreak >= 2) {
    finalTrend = engine4.overrideTrend;
  } else {
    finalTrend = redScore >= greenScore ? 'RED' : 'GREEN';
  }

  // Calculate Lucky Hedge Numbers according to user rules:
  // RED gives: 1 even [0,2,4,6,8] + 1 odd [1,3,5,7,9] (e.g. 2 / 7)
  // GREEN gives: 1 odd [1,3,5,7,9] + 1 even [0,2,4,6,8] (e.g. 7 / 4)
  let mainNumber: number;
  let oppNumber: number;

  if (finalTrend === 'RED') {
    mainNumber = engine2.hotEven;
    oppNumber = engine2.hotOdd;
  } else {
    mainNumber = engine2.hotOdd;
    oppNumber = engine2.hotEven;
  }

  const overallConfidence = Math.min(
    99,
    Math.max(76, Math.round((Math.max(redScore, greenScore) / (redScore + greenScore)) * 100 + (lossStreak > 0 ? 8 : 0)))
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
