export type ColorPrediction = 'BIG' | 'SMALL';

export interface Plan {
  price: number;
  duration: string;
  hours: number;
  label?: 'Basic' | 'Premium';
}

export interface UserRecord {
  uid: string;
  name: string;
  mobile: string;
  utr: string;
  device: string;
  createdAt: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalJackpots?: number;
  balance?: number;
}

export interface HistoryItem {
  id?: string;
  period: string;
  prediction: ColorPrediction;
  numbers: [number, number]; // [mainNum, oppNum]
  result?: number | string;
  status: 'WIN' | 'LOSS' | 'JACKPOT' | 'Pending';
  time?: number;
  pattern?: string;
  confidence?: number;
}

export interface GameIssue {
  issueNumber: string;
  number: string;
  colour?: string;
}

export interface AdminRequest {
  id?: string;
  utr: string;
  device: string;
  plan: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PatternAnalysisResult {
  pattern: string;
  confidence: number;
  nextTrend: ColorPrediction | null;
}

export interface PredictionEngineResult {
  trend: ColorPrediction;
  numbers: [number, number];
  confidence: number;
  pattern: string;
  recoveryLevel?: number;
}
