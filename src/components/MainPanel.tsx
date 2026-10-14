import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../services/sound';
import { 
  saveActivityToFirebase, 
  getUserFromFirebase 
} from '../services/firebase';
import { 
  ColorPrediction, 
  HistoryItem, 
  UserRecord, 
  GameIssue 
} from '../types';
import { 
  STICKER_START, 
  STICKER_WIN, 
  STICKER_JACKPOT, 
  WINGO_API_URL, 
  TELEGRAM_SUPPORT_URL,
  APP_NAME,
  APP_SUBTITLE,
  APP_FULL_TITLE,
  BALL_IMAGES,
  LOGO_IMG_URL 
} from '../constants';
import { 
  calculateMultiAiConsensus, 
  getBigSmall, 
  MultiAiConsensus 
} from '../services/multiAiEngine';
import { 
  Radio, 
  History, 
  Bot, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Sparkles, 
  LogOut, 
  User, 
  ShieldCheck, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  Info,
  Copy,
  RotateCcw,
  Trash2,
  X
} from 'lucide-react';

interface MainPanelProps {
  userUid: string;
  utr: string;
  device: string;
  onLogout: () => void;
}

const BIG_POOL = [5, 6, 7, 8, 9];
const SMALL_POOL = [0, 1, 2, 3, 4];

function getFrameClass(num: number): 'violet' | 'green' | 'red' {
  if (num === 0 || num === 5) return 'violet';
  if ([1, 3, 7, 9].includes(num)) return 'green';
  return 'red';
}

interface FullScreenModalState {
  type: 'JACKPOT' | 'WIN' | 'LOSS';
  period: string;
  outcomeNumber: number;
  outcomeColor: ColorPrediction;
  predictedTrend: ColorPrediction;
  numbers: [number, number];
  pattern?: string;
}

export const MainPanel: React.FC<MainPanelProps> = ({
  userUid,
  utr,
  device,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'history' | 'bot' | 'profile'>('main');
  const [userData, setUserData] = useState<UserRecord | null>(null);

  // Game & prediction state
  const [currentPeriod, setCurrentPeriod] = useState<string>('WAIT');
  const [prediction, setPrediction] = useState<ColorPrediction>('BIG');
  const [predictedNumbers, setPredictedNumbers] = useState<[number, number]>([2, 7]);
  const [activePattern, setActivePattern] = useState<string>('NEURAL CONSENSUS');
  const [patternConfidence, setPatternConfidence] = useState<number>(92);
  const [multiAiData, setMultiAiData] = useState<MultiAiConsensus | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showAiBreakdown, setShowAiBreakdown] = useState<boolean>(false);

  // Real live session history
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [liveTenIssues, setLiveTenIssues] = useState<GameIssue[]>([]);
  const [countdown, setCountdown] = useState<number>(60);
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [lossStreak, setLossStreak] = useState<number>(0);

  // Full Screen Popup Notification on WIN / JACKPOT / LOSS
  const [fullScreenPopup, setFullScreenPopup] = useState<FullScreenModalState | null>(null);

  // Telegram bot state
  const [botActive, setBotActive] = useState<boolean>(false);
  const [botToken, setBotToken] = useState<string>(() => localStorage.getItem('botToken') || '');
  const [channelId, setChannelId] = useState<string>(() => localStorage.getItem('channelId') || '');
  const [stickerSentOnStart, setStickerSentOnStart] = useState<boolean>(false);
  const [botLog, setBotLog] = useState<string[]>([]);

  // Refs for tracking processed periods
  const lastProcessedIssueRef = useRef<string>('');
  const lastPredictedPeriodRef = useRef<string>('');
  const lockedPredRef = useRef<ColorPrediction>('BIG');
  const lockedNumbersRef = useRef<[number, number]>([2, 7]);
  const lockedPatternRef = useRef<string>('NEURAL CONSENSUS');
  const lossStreakRef = useRef<number>(0);
  const botActiveRef = useRef<boolean>(false);
  const botTokenRef = useRef<string>(botToken);
  const channelIdRef = useRef<string>(channelId);

  lossStreakRef.current = lossStreak;
  botActiveRef.current = botActive;
  botTokenRef.current = botToken;
  channelIdRef.current = channelId;

  // Telegram helpers
  const sendTelegramMsg = useCallback(async (text: string) => {
    if (!botActiveRef.current || !botTokenRef.current || !channelIdRef.current) return;
    try {
      await fetch(`https://api.telegram.org/bot${botTokenRef.current}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: channelIdRef.current, text, parse_mode: 'HTML' })
      });
      setBotLog(prev => [`[${new Date().toLocaleTimeString()}] Sent to TG`, ...prev.slice(0, 15)]);
    } catch (err) {
      console.warn("Telegram send error:", err);
    }
  }, []);

  const sendTelegramSticker = useCallback(async (stickerId: string) => {
    if (!botActiveRef.current || !botTokenRef.current || !channelIdRef.current) return;
    try {
      await fetch(`https://api.telegram.org/bot${botTokenRef.current}/sendSticker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: channelIdRef.current, sticker: stickerId })
      });
      setBotLog(prev => [`[${new Date().toLocaleTimeString()}] Sent sticker`, ...prev.slice(0, 15)]);
    } catch (err) {
      console.warn("Sticker error:", err);
    }
  }, []);

  // Fetch from Lottery API
  const fetchLotteryData = useCallback(async (): Promise<{ list: GameIssue[]; latest: GameIssue } | null> => {
    try {
      const res = await fetch(`${WINGO_API_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Status " + res.status);
      const json = await res.json();
      if (json?.data?.list?.length) {
        return { list: json.data.list, latest: json.data.list[0] };
      }
    } catch {
      // Fallback synthetic generator for resilience
      const now = Date.now();
      const currentMinIssue = Math.floor(now / 60000).toString();
      const pseudoNum = Math.floor(Math.random() * 10).toString();
      const mockList: GameIssue[] = Array.from({ length: 10 }, (_, i) => ({
        issueNumber: (BigInt(currentMinIssue) - BigInt(i)).toString(),
        number: ((pseudoNum.charCodeAt(0) + i) % 10).toString()
      }));
      return { list: mockList, latest: mockList[0] };
    }
    return null;
  }, []);

  // Celebrations
  const triggerCelebration = (isJackpot: boolean) => {
    try {
      if (isJackpot) {
        soundManager.playJackpot();
        confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.55 },
          colors: ['#2563eb', '#7c3aed', '#fbbf24', '#ffffff', '#10b981']
        });
      } else {
        soundManager.playWin();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#ffffff']
        });
      }
    } catch {
      // Ignore
    }
  };

  // Evaluate Round Result:
  // "0/2/4/6/8 Mese koi number aaya to WIN de aur Number match hoto JACKPOT De"
  // "1 3 5 7 9 mese koi number aaya to GREEN WIN de aur Number match hoto JACKPOT De"
  const evaluateResult = useCallback((
    resultNum: number,
    pred: ColorPrediction,
    nums: [number, number]
  ): { status: 'WIN' | 'LOSS' | 'JACKPOT'; isWin: boolean; isJackpot: boolean } => {
    const isBig = BIG_POOL.includes(resultNum);
    const isSmall = SMALL_POOL.includes(resultNum);
    const isMatchExact = nums.includes(resultNum);

    if (pred === 'BIG') {
      if (isBig) {
        if (isMatchExact) return { status: 'JACKPOT', isWin: true, isJackpot: true };
        return { status: 'WIN', isWin: true, isJackpot: false };
      }
      if (isMatchExact) return { status: 'JACKPOT', isWin: true, isJackpot: true };
      return { status: 'LOSS', isWin: false, isJackpot: false };
    } else {
      if (isSmall) {
        if (isMatchExact) return { status: 'JACKPOT', isWin: true, isJackpot: true };
        return { status: 'WIN', isWin: true, isJackpot: false };
      }
      if (isMatchExact) return { status: 'JACKPOT', isWin: true, isJackpot: true };
      return { status: 'LOSS', isWin: false, isJackpot: false };
    }
  }, []);

  // Main game update cycle
  const runGameCycle = useCallback(async () => {
    try {
      const data = await fetchLotteryData();
      if (!data) return;

      const { list, latest } = data;
      setLiveTenIssues(list.slice(0, 10));

      const issueNum = latest.issueNumber;
      const resNum = parseInt(latest.number, 10);
      const latestShort = issueNum.slice(-4);

      // Check if previous round just resolved and has not been processed yet
      if (lastProcessedIssueRef.current && issueNum !== lastProcessedIssueRef.current && !isNaN(resNum)) {
        const { status, isWin, isJackpot } = evaluateResult(
          resNum,
          lockedPredRef.current,
          lockedNumbersRef.current
        );

        if (isWin) {
          setLossStreak(0);
          lossStreakRef.current = 0;
        } else {
          setLossStreak(prev => prev + 1);
          lossStreakRef.current = lossStreakRef.current + 1;
        }

        // Update top history item or prepend
        setHistoryList(prev => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          // Find the pending round
          const pIndex = updated.findIndex(x => x.period === latestShort || x.status === 'Pending');
          if (pIndex !== -1) {
            updated[pIndex] = {
              ...updated[pIndex],
              result: resNum,
              status: status
            };
          } else {
            updated.unshift({
              period: latestShort,
              prediction: lockedPredRef.current,
              numbers: lockedNumbersRef.current,
              result: resNum,
              status: status,
              time: Date.now()
            });
          }
          return updated;
        });

        // Save activity to Firebase
        saveActivityToFirebase(
          userUid,
          latestShort,
          lockedPredRef.current,
          lockedNumbersRef.current.join('/'),
          resNum,
          status
        );

        // SHOW FULL SCREEN POPUP RESULT (WIN / JACKPOT / LOSS)
        const outcomeColor = getBigSmall(resNum);
        setFullScreenPopup({
          type: status,
          period: latestShort,
          outcomeNumber: resNum,
          outcomeColor,
          predictedTrend: lockedPredRef.current,
          numbers: lockedNumbersRef.current,
          pattern: lockedPatternRef.current
        });

        if (isWin) {
          triggerCelebration(isJackpot);
          if (botActiveRef.current) {
            await sendTelegramSticker(STICKER_WIN);
            if (isJackpot) {
              await sendTelegramSticker(STICKER_JACKPOT);
            }
          }
        } else {
          soundManager.playClick();
        }

        lastProcessedIssueRef.current = issueNum;
      }

      // First run initialization
      if (!lastProcessedIssueRef.current) {
        lastProcessedIssueRef.current = issueNum;
      }

      // Compute NEXT PERIOD
      const nextPeriodFull = (BigInt(issueNum) + 1n).toString();
      const nextPeriodStr = nextPeriodFull.slice(-4);

      // If new period has not been predicted yet
      if (lastPredictedPeriodRef.current !== nextPeriodStr) {
        lastPredictedPeriodRef.current = nextPeriodStr;
        setCurrentPeriod(nextPeriodStr);
        setIsAnalyzing(true);

        // Run MULTI-AI CONSENSUS ENGINE
        const consensus = calculateMultiAiConsensus(list, lossStreakRef.current);
        setMultiAiData(consensus);

        const newPred = consensus.finalTrend;
        const newNumbers: [number, number] = [consensus.mainNumber, consensus.oppNumber];

        lockedPredRef.current = newPred;
        lockedNumbersRef.current = newNumbers;
        lockedPatternRef.current = consensus.activePattern;

        setPrediction(newPred);
        setPredictedNumbers(newNumbers);
        setActivePattern(consensus.activePattern);
        setPatternConfidence(consensus.overallConfidence);
        setIsAnalyzing(false);

        // Prepend new pending round to history list
        setHistoryList(prev => {
          // Avoid duplicate pending
          const filtered = prev.filter(x => x.period !== nextPeriodStr);
          const newHistItem: HistoryItem = {
            period: nextPeriodStr,
            prediction: newPred,
            numbers: newNumbers,
            result: '-',
            status: 'Pending',
            time: Date.now(),
            pattern: consensus.activePattern,
            confidence: consensus.overallConfidence
          };
          return [newHistItem, ...filtered.slice(0, 99)];
        });

        // Dispatch Telegram prediction
        if (botActiveRef.current) {
          const telegramMessage = `<b>❖━━━━━━━━━━━━━━━━❖
      ⚡️ ${APP_NAME} ⚡️
❖━━━━━━━━━━━━━━━━❖

     ⚡️ WINGO 1 MINUTE ⚡️

🍁 PERIOD  ${nextPeriodStr}  ➔  ${newPred}  ${newNumbers.join('/')}
🧠 MULTI-AI: ${consensus.activePattern} [${consensus.overallConfidence}%]</b>`;
          sendTelegramMsg(telegramMessage);

          if (!stickerSentOnStart) {
            sendTelegramSticker(STICKER_START);
            setStickerSentOnStart(true);
          }
        }
      }
    } catch (err) {
      console.warn("Cycle error:", err);
    }
  }, [
    fetchLotteryData,
    evaluateResult,
    userUid,
    sendTelegramMsg,
    sendTelegramSticker,
    stickerSentOnStart
  ]);

  // Initial user load
  useEffect(() => {
    getUserFromFirebase(userUid).then(u => {
      if (u) setUserData(u);
    });

    runGameCycle();
    const interval = setInterval(runGameCycle, 4000);
    return () => clearInterval(interval);
  }, [userUid, runGameCycle]);

  // Timer countdown synchronized with clock seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const secondsLeft = 60 - now.getSeconds();
      setCountdown(secondsLeft);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss popup after 5 seconds if not closed
  useEffect(() => {
    if (fullScreenPopup) {
      const t = setTimeout(() => {
        setFullScreenPopup(null);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [fullScreenPopup]);

  // Telegram bot controls
  const handleStartBot = async () => {
    soundManager.playClick();
    const token = botToken.trim();
    const chat = channelId.trim();
    if (!token || !chat) {
      alert("Please enter Telegram Bot Token and Channel ID");
      return;
    }
    localStorage.setItem('botToken', token);
    localStorage.setItem('channelId', chat);
    setBotActive(true);
    setStickerSentOnStart(false);

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendSticker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, sticker: STICKER_START })
      });
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chat, 
          text: `<b>🤖 ${APP_NAME} MULTI-AI ACTIVATED</b>\n\n⚡️ <i>4 Neural Engines Calculating High-Accuracy Signals!</i>`,
          parse_mode: 'HTML'
        })
      });
      setBotLog(prev => [`[${new Date().toLocaleTimeString()}] Bot Activated`, ...prev]);
    } catch {
      // Ignore
    }
  };

  const handleStopBot = async () => {
    soundManager.playClick();
    setBotActive(false);
    try {
      if (botToken && channelId) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: channelId, text: `<b>⛔ ${APP_NAME} BOT STOPPED</b>`, parse_mode: 'HTML' })
        });
      }
    } catch {
      // Ignore
    }
    setBotLog(prev => [`[${new Date().toLocaleTimeString()}] Bot Stopped`, ...prev]);
  };

  const handleCopySignal = () => {
    soundManager.playClick();
    const text = `${currentPeriod} ${prediction} ${predictedNumbers[0]}'${predictedNumbers[1]}`;
    navigator.clipboard.writeText(text);
    alert("Copied Signal: " + text);
  };

  const handleClearHistory = () => {
    if (confirm("Delete session history?")) {
      setHistoryList([]);
    }
  };

  // Stats computation
  const winsCount = historyList.filter(x => x.status === 'WIN' || x.status === 'JACKPOT').length;
  const lossesCount = historyList.filter(x => x.status === 'LOSS').length;
  const jackpotCount = historyList.filter(x => x.status === 'JACKPOT').length;
  const totalCompleted = winsCount + lossesCount;

  // Sec format for dual digital boxes
  const secStr = countdown.toString().padStart(2, '0');

  return (
    <div className="min-h-screen bg-[#f5f3ff] text-slate-800 flex flex-col items-center p-3 sm:p-5 relative pb-16">
      
      {/* Max Container */}
      <div className="w-full max-w-[430px] relative z-10 space-y-3.5">

        {/* Top Navbar Header */}
        <div className="bg-white rounded-3xl p-3.5 border-2 border-[#ddd6fe] shadow-[0_10px_25px_rgba(139,92,246,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full bg-white border-2 border-blue-200 shadow-md flex items-center justify-center p-0.5 overflow-hidden">
              <img src={LOGO_IMG_URL} alt="VKS" className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 tracking-wider font-messiri leading-tight">
                {APP_NAME}
              </h1>
              <div className="flex items-center gap-1.5 text-[9px] text-blue-600 font-bold tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>4-AI NEURAL CONSENSUS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const s = soundManager.toggle();
                setSoundActive(s);
              }}
              className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center active:scale-95 transition-all shadow-sm"
              title="Toggle Audio"
            >
              {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            <div className="px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-full text-purple-700 font-orbitron text-[10px] font-bold">
              UID: {userUid.slice(0, 5)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-white border-2 border-[#ddd6fe] rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('main')}
            className={`py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'main'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-purple-900 hover:bg-blue-50'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>MAIN</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-purple-900 hover:bg-blue-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>HISTORY</span>
          </button>

          <button
            onClick={() => setActiveTab('bot')}
            className={`py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'bot'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-purple-900 hover:bg-blue-50'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>BOT</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-purple-900 hover:bg-blue-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>PROFILE</span>
          </button>
        </div>

        {/* TAB 1: MAIN PREDICTION DASHBOARD */}
        {activeTab === 'main' && (
          <div className="space-y-3.5">

            {/* Wingo 1M Period & Dual Digital Timer Box */}
            <div className="bg-white rounded-3xl p-4 border-2 border-[#ddd6fe] shadow-md flex justify-between items-center">
              <div>
                <span className="text-[10px] text-purple-600 font-black tracking-widest flex items-center gap-1">
                  <span className="text-blue-600">#</span> PERIOD ISSUE
                </span>
                <div className="text-2xl font-black font-orbitron text-purple-950 mt-0.5 tracking-wider">
                  #{currentPeriod}
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] text-purple-600 font-black tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-600" /> TIMER
                </span>
                <div className="flex gap-1.5 items-center mt-1">
                  <div className="timer-box rounded-xl w-9 h-10 flex items-center justify-center font-orbitron font-black text-xl">
                    {secStr[0]}
                  </div>
                  <div className="timer-box rounded-xl w-9 h-10 flex items-center justify-center font-orbitron font-black text-xl">
                    {secStr[1]}
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE 10 RECORD - Exact 3D Ball Grid */}
            <div className="bg-gradient-to-b from-white to-blue-50/50 border-2 border-[#ddd6fe] rounded-3xl p-3.5 shadow-md">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[10px] font-black text-purple-700 tracking-widest">
                  ◈ LIVE 10 RECORD
                </span>
                <span className="text-emerald-600 text-[9px] font-black tracking-wider flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  LIVE SYNC
                </span>
              </div>

              {/* Grid of 10 Number Balls */}
              <div className="grid grid-cols-5 gap-y-3 gap-x-2 place-items-center">
                {liveTenIssues.map((item, idx) => {
                  const num = parseInt(item.number, 10);
                  const frameCls = getFrameClass(num);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`live-ball-frame ${frameCls}`}>
                        {BALL_IMAGES[num] ? (
                          <img 
                            src={BALL_IMAGES[num]} 
                            alt={`Ball ${num}`} 
                            className="live-ball-img"
                          />
                        ) : (
                          <div className={`live-ball-num ${frameCls}`}>{num}</div>
                        )}
                      </div>
                      <div className="font-orbitron font-bold text-[8px] text-purple-700">
                        #{item.issueNumber.slice(-4)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI PREDICTION CARD with 3D Main and Opp Balls */}
            <div className="pred-card-white p-5 text-center relative shadow-lg">
              <div className="scanner-line" />

              {/* Top AI Engine Header & Status */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-black text-blue-600 tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>4-AI NEURAL ENGINE</span>
                </div>

                <div className="text-[9px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black border border-blue-200 shadow-sm flex items-center gap-1">
                  {isAnalyzing ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-spin" />
                      CALCULATING...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      VERIFIED SIGNAL
                    </>
                  )}
                </div>
              </div>

              {/* Prediction Text (RED / GREEN) */}
              <div className="my-2">
                <div className="text-[10px] font-black tracking-widest text-purple-500 uppercase">
                  CONSENSUS PREDICTION
                </div>
                <div 
                  className={`text-5xl font-black font-orbitron tracking-[6px] my-1 ${
                    prediction === 'BIG'
                      ? 'text-blue-600 drop-shadow-[0_4px_12px_rgba(37,99,235,0.4)]'
                      : 'text-indigo-600 drop-shadow-[0_4px_12px_rgba(79,70,229,0.4)]'
                  }`}
                >
                  {prediction}
                </div>
              </div>

              {/* 3D Prediction Balls (MAIN & OPP) */}
              <div className="flex items-center justify-center gap-6 my-3">
                {/* Main Ball */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-black text-blue-600 tracking-widest">MAIN</span>
                  <div className="pred-ball-wrap">
                    <div className="pred-ball-inner">
                      {BALL_IMAGES[predictedNumbers[0]] ? (
                        <img 
                          src={BALL_IMAGES[predictedNumbers[0]]} 
                          alt="Main" 
                        />
                      ) : (
                        <span className="num-txt">{predictedNumbers[0]}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">
                    {BIG_POOL.includes(predictedNumbers[0]) ? 'BIG (5-9)' : 'SMALL (0-4)'}
                  </span>
                </div>

                {/* Opp Ball */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-black text-indigo-600 tracking-widest">OPP</span>
                  <div className="pred-ball-wrap opp">
                    <div className="pred-ball-inner">
                      {BALL_IMAGES[predictedNumbers[1]] ? (
                        <img 
                          src={BALL_IMAGES[predictedNumbers[1]]} 
                          alt="Opp" 
                        />
                      ) : (
                        <span className="num-txt">{predictedNumbers[1]}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">
                    {BIG_POOL.includes(predictedNumbers[1]) ? 'BIG (5-9)' : 'SMALL (0-4)'}
                  </span>
                </div>
              </div>

              {/* Pattern Badge & Confidence */}
              <div className="flex flex-col items-center gap-1.5 mt-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-orbitron font-black text-[9px] shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  {activePattern}
                </span>

                <div className="text-[9px] font-black tracking-wider text-white bg-blue-600 px-4 py-1 rounded-full shadow">
                  CONFIDENCE: {patternConfidence}% • RECOVERY: LVL {multiAiData?.recoveryLevel || 1}
                </div>

                {/* Toggle Multi-AI Engine breakdown */}
                <button
                  type="button"
                  onClick={() => setShowAiBreakdown(!showAiBreakdown)}
                  className="mt-1 text-[10px] text-blue-600 hover:text-purple-700 font-bold underline cursor-pointer flex items-center gap-1"
                >
                  <Info className="w-3 h-3" />
                  <span>{showAiBreakdown ? 'Hide 4-AI Engine Details' : 'View 4-AI Neural Breakdown'}</span>
                </button>
              </div>

              {/* Multi-AI Model Reports (Collapsible) */}
              {showAiBreakdown && multiAiData && (
                <div className="mt-3.5 pt-3 border-t border-purple-100 text-left space-y-2">
                  <div className="text-[10px] font-black text-purple-700 tracking-wider">
                    INDIVIDUAL AI ENGINE VOTES:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {multiAiData.engineReports.map((rep) => (
                      <div key={rep.id} className="p-2 bg-white rounded-xl border border-blue-100 shadow-sm text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-purple-900 flex items-center gap-1">
                            <span>{rep.icon}</span>
                            <span className="truncate">{rep.name}</span>
                          </span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                            rep.predictedTrend === 'BIG' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {rep.predictedTrend}
                          </span>
                        </div>
                        <div className="text-[8px] text-slate-500 mt-1 leading-tight">
                          {rep.reasoning}
                        </div>
                        <div className="text-[8px] font-bold text-blue-600 mt-1">
                          Confidence: {rep.confidence}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopySignal}
                className="btn-3d py-3 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>COPY SIGNAL</span>
              </button>

              <button
                type="button"
                onClick={runGameCycle}
                className="btn-secondary py-3 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RE-ANALYZE</span>
              </button>
            </div>

            {/* Session Stats Mini Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border-2 border-[#ddd6fe] rounded-2xl p-2.5 text-center shadow-sm">
                <div className="text-xl font-black font-orbitron text-emerald-600">{winsCount}</div>
                <div className="text-[8px] font-black text-purple-700 tracking-wider mt-0.5">🏆 WINS</div>
              </div>

              <div className="bg-white border-2 border-[#ddd6fe] rounded-2xl p-2.5 text-center shadow-sm">
                <div className="text-xl font-black font-orbitron text-amber-500">{jackpotCount}</div>
                <div className="text-[8px] font-black text-purple-700 tracking-wider mt-0.5">🎰 JACKPOT</div>
              </div>

              <div className="bg-white border-2 border-[#ddd6fe] rounded-2xl p-2.5 text-center shadow-sm">
                <div className="text-xl font-black font-orbitron text-blue-600">{totalCompleted}</div>
                <div className="text-[8px] font-black text-purple-700 tracking-wider mt-0.5">📊 TOTAL</div>
              </div>
            </div>

            {/* COMPACT HISTORY TABLE ON MAIN PAGE (Requested: "History sahi karo") */}
            <div className="rounded-2xl overflow-hidden bg-white border-2 border-[#ddd6fe] shadow-lg flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white flex flex-col py-2.5 px-3 gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black tracking-widest">LIVE PREDICTION HISTORY</span>
                  </div>
                  <button 
                    onClick={handleClearHistory} 
                    className="bg-white/20 border border-white/40 text-white text-[8px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 active:scale-95"
                  >
                    <Trash2 className="w-2.5 h-2.5" /> DELETE
                  </button>
                </div>
                <div className="flex items-center justify-between text-[7.5px] opacity-90 font-bold tracking-widest">
                  <span>{historyList.length} ROUNDS RECORDED</span>
                  <span>WIN / LOSS / JACKPOT</span>
                </div>
              </div>

              {/* Column Headers */}
              <div className="bg-purple-50 text-purple-900 grid grid-cols-[0.9fr_1.4fr_1fr_1fr] gap-1.5 text-[8px] font-black tracking-wider py-2 px-2 text-center items-center border-b border-[#ddd6fe]">
                <div>PERIOD</div>
                <div>PREDICTION</div>
                <div>ACTUAL</div>
                <div>RESULT</div>
              </div>

              {/* History Rows */}
              <div className="flex flex-col max-h-[360px] overflow-y-auto">
                {historyList.length === 0 ? (
                  <div className="p-6 text-center text-purple-400 font-bold text-xs flex flex-col items-center justify-center">
                    <div className="w-7 h-7 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2" />
                    <div>WAITING FOR NEXT RESULT...</div>
                    <div className="text-[9px] text-slate-400 mt-1">Live rounds will appear here automatically</div>
                  </div>
                ) : (
                  historyList.map((h, idx) => {
                    const statusCls = h.status;
                    const statusIcon = statusCls === 'WIN' ? '✓' : statusCls === 'LOSS' ? '✗' : statusCls === 'JACKPOT' ? '👑' : '⏳';
                    const statusText = statusCls === 'WIN' ? 'WIN' : statusCls === 'LOSS' ? 'LOSS' : statusCls === 'JACKPOT' ? 'JACK' : 'WAIT';
                    const actualNum = typeof h.result === 'number' ? h.result : null;
                    const actualFrameCls = actualNum !== null ? getFrameClass(actualNum) : 'red';

                    return (
                      <div key={idx} className={`hist-row ${statusCls}`}>
                        <div>
                          <div className="hist-period">#{h.period}</div>
                          <span className="hist-period-sub">1M</span>
                        </div>

                        <div className="hist-pred">
                          <div className="hist-pred-top">
                            <span className={`pred-badge ${h.prediction}`}>{h.prediction}</span>
                          </div>
                          <div className="pred-nums">
                            <span className="pred-num-badge">{h.numbers[0]}</span>
                            <span className="pred-num-badge opp">{h.numbers[1]}</span>
                          </div>
                        </div>

                        <div className="hist-actual">
                          <div className={`actual-num-big ${actualFrameCls}`}>
                            {h.result ?? '?'}
                          </div>
                          <span className={`actual-size ${h.prediction}`}>
                            {actualNum !== null ? getBigSmall(actualNum) : '---'}
                          </span>
                        </div>

                        <div>
                          <div className={`status-pill ${statusCls}`}>
                            <span className="text-[12px] leading-none">{statusIcon}</span>
                            <span className="text-[7.5px] font-black">{statusText}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: DETAILED HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border-2 border-[#ddd6fe] shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-black tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4" />
                  <span>EXTENDED AUDIT LOG</span>
                </div>
                <div className="text-[8px] opacity-80 font-bold tracking-widest">
                  {historyList.length} TOTAL SESSIONS
                </div>
              </div>

              <button
                onClick={handleClearHistory}
                className="bg-white/20 hover:bg-white/30 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>CLEAR</span>
              </button>
            </div>

            <div className="grid grid-cols-[0.9fr_1.4fr_1fr_1fr] text-center py-2 px-2 text-[8px] font-black text-purple-900 bg-purple-50 border-b border-[#ddd6fe]">
              <div>PERIOD</div>
              <div>PREDICTION</div>
              <div>ACTUAL</div>
              <div>RESULT</div>
            </div>

            <div className="max-h-[460px] overflow-y-auto">
              {historyList.length === 0 ? (
                <div className="p-8 text-center text-purple-400 font-bold text-xs">
                  No records yet in this session.
                </div>
              ) : (
                historyList.map((h, idx) => {
                  const statusCls = h.status;
                  const statusIcon = statusCls === 'WIN' ? '✓' : statusCls === 'LOSS' ? '✗' : statusCls === 'JACKPOT' ? '👑' : '⏳';
                  const statusText = statusCls === 'WIN' ? 'WIN' : statusCls === 'LOSS' ? 'LOSS' : statusCls === 'JACKPOT' ? 'JACK' : 'WAIT';
                  const actualNum = typeof h.result === 'number' ? h.result : null;
                  const actualFrameCls = actualNum !== null ? getFrameClass(actualNum) : 'red';

                  return (
                    <div key={idx} className={`hist-row ${statusCls}`}>
                      <div>
                        <div className="hist-period">#{h.period}</div>
                        <span className="hist-period-sub">1M</span>
                      </div>

                      <div className="hist-pred">
                        <div className="hist-pred-top">
                          <span className={`pred-badge ${h.prediction}`}>{h.prediction}</span>
                        </div>
                        <div className="pred-nums">
                          <span className="pred-num-badge">{h.numbers[0]}</span>
                          <span className="pred-num-badge opp">{h.numbers[1]}</span>
                        </div>
                      </div>

                      <div className="hist-actual">
                        <div className={`actual-num-big ${actualFrameCls}`}>
                          {h.result ?? '?'}
                        </div>
                        <span className={`actual-size ${h.prediction}`}>
                          {actualNum !== null ? getBigSmall(actualNum) : '---'}
                        </span>
                      </div>

                      <div>
                        <div className={`status-pill ${statusCls}`}>
                          <span className="text-[12px] leading-none">{statusIcon}</span>
                          <span className="text-[7.5px] font-black">{statusText}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TELEGRAM BOT CONTROLLER */}
        {activeTab === 'bot' && (
          <div className="bg-white rounded-3xl border-2 border-[#ddd6fe] shadow-md p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
              <span className="text-xs font-black text-blue-700 flex items-center gap-1.5 font-messiri">
                <Bot className="w-4 h-4 text-blue-600" />
                TELEGRAM AUTOMATION BOT
              </span>
              <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full ${
                botActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {botActive ? 'ACTIVE ✅' : 'OFFLINE ⛔'}
              </span>
            </div>

            <div>
              <label className="text-[10px] font-black text-purple-700 uppercase mb-1 block">
                TELEGRAM BOT TOKEN
              </label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="e.g. 7192837492:AAH93k..."
                className="input-box w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-purple-700 uppercase mb-1 block">
                CHANNEL ID
              </label>
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="e.g. @channel or -100123456789"
                className="input-box w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleStartBot}
                disabled={botActive}
                className="btn-3d py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5" />
                <span>START BOT</span>
              </button>

              <button
                onClick={handleStopBot}
                disabled={!botActive}
                className="btn-secondary py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer text-rose-600 border-rose-300 disabled:opacity-40"
              >
                <Square className="w-3.5 h-3.5" />
                <span>STOP BOT</span>
              </button>
            </div>

            <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 text-[10px] font-mono text-purple-900 h-28 overflow-y-auto">
              <div className="text-slate-400 mb-1 border-b border-purple-200 pb-1 font-bold">
                LOG CONSOLE:
              </div>
              {botLog.length === 0 ? (
                <div className="text-slate-400">Bot logs will appear here after starting.</div>
              ) : (
                botLog.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border-2 border-[#ddd6fe] shadow-md p-5 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-purple-100">
              <div className="w-14 h-14 rounded-full border-2 border-blue-200 p-0.5">
                <img src={LOGO_IMG_URL} alt="Logo" className="w-full h-full rounded-full object-cover" />
              </div>
              <div>
                <h3 className="text-base font-black text-purple-900 font-messiri">{userData?.name || 'VIP OPERATOR'}</h3>
                <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED ACCESS
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs font-bold text-purple-950">
              <div className="p-2.5 bg-blue-50/70 rounded-xl flex justify-between items-center">
                <span className="text-slate-500 font-bold">UID</span>
                <span className="font-orbitron font-black text-blue-700">{userUid}</span>
              </div>

              <div className="p-2.5 bg-blue-50/70 rounded-xl flex justify-between items-center">
                <span className="text-slate-500 font-bold">UTR</span>
                <span className="font-mono text-purple-900">{utr}</span>
              </div>

              <div className="p-2.5 bg-blue-50/70 rounded-xl flex justify-between items-center">
                <span className="text-slate-500 font-bold">DEVICE</span>
                <span className="text-purple-900">{device}</span>
              </div>
            </div>

            <div className="pt-3 space-y-2">
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>LOGOUT / CHANGE UTR</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-purple-500 font-bold pt-2 space-y-1">
          <div>TG: <a href={TELEGRAM_SUPPORT_URL} target="_blank" rel="noreferrer" className="text-blue-600 underline">@VKS_HACKER_57</a> • {APP_FULL_TITLE}</div>
          <div>Multi-AI Real-Time Consensus Active</div>
        </div>

      </div>

      {/* FULL SCREEN POPUP RESULT (WIN / JACKPOT / LOSS) - Exact Styling matching reference! */}
      {fullScreenPopup && (
        <div 
          onClick={() => setFullScreenPopup(null)}
          className="fixed inset-0 z-[99999] bg-[#1e0f3c]/80 backdrop-blur-md flex items-center justify-center p-4 transition-all"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`result-popup-card ${
              fullScreenPopup.type === 'WIN' 
                ? 'win' 
                : fullScreenPopup.type === 'JACKPOT' 
                ? 'jackpot' 
                : 'loss'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={() => setFullScreenPopup(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="result-icon">
              {fullScreenPopup.type === 'JACKPOT' ? '👑' : fullScreenPopup.type === 'WIN' ? '🏆' : '💥'}
            </div>

            {/* Title */}
            <div className="result-title">
              {fullScreenPopup.type}
            </div>

            <div className="result-sub">
              {fullScreenPopup.type === 'JACKPOT' 
                ? '⭐ EXACT NUMBER MATCH ⭐' 
                : fullScreenPopup.type === 'WIN' 
                ? '✓ PREDICTION SUCCESSFUL' 
                : '⚠️ RECOVERY MODE ARMED'}
            </div>

            {/* Ball Display */}
            <div className="result-ball-wrap">
              {BALL_IMAGES[fullScreenPopup.outcomeNumber] ? (
                <img 
                  src={BALL_IMAGES[fullScreenPopup.outcomeNumber]} 
                  alt="Outcome Ball" 
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-900 font-orbitron font-black text-4xl flex items-center justify-center border-4 border-purple-400">
                  {fullScreenPopup.outcomeNumber}
                </div>
              )}
            </div>

            {/* Predicted vs Actual */}
            <div className="result-info">
              <div className="result-info-item">
                <div className="lbl">PREDICTED</div>
                <div className="val">
                  {fullScreenPopup.predictedTrend} ({fullScreenPopup.numbers.join('/')})
                </div>
              </div>

              <div className="result-info-item">
                <div className="lbl">ACTUAL</div>
                <div className="val">
                  {fullScreenPopup.outcomeNumber} ({fullScreenPopup.outcomeColor})
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={() => setFullScreenPopup(null)}
              className="result-close"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
