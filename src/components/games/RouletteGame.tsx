import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCw, HelpCircle, ShieldCheck, History, BarChart2 } from 'lucide-react';
import type { RouletteBetItem, RouletteSpinResult, GameSettings } from '../../types/casino.ts';
import { api } from '../../services/api.ts';
import { sound } from '../../services/sound.ts';
import { ChipSelector } from '../ChipSelector.tsx';

interface RouletteGameProps {
  playerBalance: number;
  gameSettings: GameSettings;
  onBalanceUpdate: (newBalance: number) => void;
  isReducedMotion: boolean;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// European wheel order (standard pocket sequence)
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export const RouletteGame: React.FC<RouletteGameProps> = ({
  playerBalance,
  gameSettings,
  onBalanceUpdate,
  isReducedMotion,
}) => {
  const [selectedChip, setSelectedChip] = useState(25);
  const [activeBets, setActiveBets] = useState<Record<string, RouletteBetItem>>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<RouletteSpinResult | null>(null);
  const [history, setHistory] = useState<{ number: number; color: 'red' | 'black' | 'green' }[]>([
    { number: 17, color: 'black' },
    { number: 32, color: 'red' },
    { number: 0, color: 'green' },
    { number: 21, color: 'red' },
    { number: 8, color: 'black' },
  ]);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  const totalBet = Object.values(activeBets).reduce((sum, b) => sum + b.amount, 0);

  const addBet = (key: string, betItem: RouletteBetItem) => {
    if (isSpinning) return;
    sound.playChip();
    setErrorMsg(null);

    setActiveBets((prev) => {
      const existing = prev[key];
      const newAmount = (existing ? existing.amount : 0) + selectedChip;
      return {
        ...prev,
        [key]: {
          ...betItem,
          amount: newAmount,
        },
      };
    });
  };

  const handleClearBets = () => {
    if (isSpinning) return;
    sound.playChip();
    setActiveBets({});
  };

  const handleDoubleBets = () => {
    if (isSpinning) return;
    sound.playChip();
    setActiveBets((prev) => {
      const updated: Record<string, RouletteBetItem> = {};
      for (const [k, v] of Object.entries(prev)) {
        updated[k] = { ...v, amount: v.amount * 2 };
      }
      return updated;
    });
  };

  const handleSpin = async () => {
    const betsList = Object.values(activeBets);
    if (betsList.length === 0) {
      setErrorMsg('Please click on the betting felt to place your chips');
      return;
    }
    if (totalBet > playerBalance) {
      setErrorMsg('Insufficient play-chips balance');
      return;
    }

    setErrorMsg(null);
    setIsSpinning(true);
    sound.playChip();

    try {
      const resp = await api.spinRoulette(betsList);
      const winNum = resp.result.winningNumber;
      const targetPocketIndex = WHEEL_ORDER.indexOf(winNum);

      // Animation parameters
      const pocketAngle = 360 / 37;
      const extraSpins = 4 * 360;
      const targetAngle = extraSpins + (37 - targetPocketIndex) * pocketAngle;

      const duration = isReducedMotion ? 200 : 2500;

      // Ball sounds during spin
      const ballSoundInterval = setInterval(() => {
        sound.playRouletteBall();
      }, 180);

      setWheelRotation((prev) => prev + 720);
      setBallRotation((prev) => prev + targetAngle);

      setTimeout(() => {
        clearInterval(ballSoundInterval);
        setIsSpinning(false);
        setLastResult(resp.result);
        onBalanceUpdate(resp.balance);

        setHistory((prev) => [
          { number: resp.result.winningNumber, color: resp.result.winningColor },
          ...prev.slice(0, 9),
        ]);

        if (resp.result.totalPayout > 0) {
          if (resp.result.totalPayout >= totalBet * 5) {
            sound.playJackpot();
            if (!isReducedMotion) {
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            }
          } else {
            sound.playWin();
          }
        }
      }, duration);
    } catch (err: unknown) {
      setIsSpinning(false);
      setErrorMsg(err instanceof Error ? err.message : 'Spin error');
    }
  };

  // Helper to color numbers
  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-emerald-700 text-white border-emerald-500';
    return RED_NUMBERS.includes(num)
      ? 'bg-rose-700 hover:bg-rose-600 text-white border-rose-500'
      : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <span>Monte Carlo European Roulette</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Single Zero (2.70% House Edge)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Standard 37 Pockets (0-36) · Inside & Outside Bets with 35:1 Straight-Up Payouts
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRules(!showRules)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Payout Guide</span>
        </button>
      </div>

      {showRules && (
        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="font-bold text-amber-400 block">Straight Up</span>
            <span className="text-slate-400">Pays 35 to 1</span>
          </div>
          <div>
            <span className="font-bold text-amber-400 block">Red / Black</span>
            <span className="text-slate-400">Pays 1 to 1 (Even)</span>
          </div>
          <div>
            <span className="font-bold text-amber-400 block">Dozens / Columns</span>
            <span className="text-slate-400">Pays 2 to 1</span>
          </div>
          <div>
            <span className="font-bold text-amber-400 block">Even / Odd / Hi-Lo</span>
            <span className="text-slate-400">Pays 1 to 1</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Board Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Animated Roulette Wheel (4 Cols) */}
        <div className="lg:col-span-4 bg-[#090c10] rounded-2xl border-2 border-amber-700/30 p-5 shadow-2xl flex flex-col items-center">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-500/80 font-bold mb-3">
            European Wheel
          </div>

          {/* Visual SVG Wheel Representation */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border-8 border-[#3d2311] bg-[#1a110a] shadow-2xl flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 rounded-full transition-transform ease-out"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transitionDuration: isReducedMotion ? '200ms' : '2500ms',
                backgroundImage: 'conic-gradient(from 0deg, #166534 0deg 9.7deg, #991b1b 9.7deg 19.4deg, #0f172a 19.4deg 29.1deg, #991b1b 29.1deg 38.8deg, #0f172a 38.8deg 48.5deg, #991b1b 48.5deg 58.2deg, #0f172a 58.2deg 67.9deg, #991b1b 67.9deg 77.6deg, #0f172a 77.6deg 87.3deg, #991b1b 87.3deg 97deg, #0f172a 97deg 106.7deg, #991b1b 106.7deg 116.4deg, #0f172a 116.4deg 126.1deg, #991b1b 126.1deg 135.8deg, #0f172a 135.8deg 145.5deg, #991b1b 145.5deg 155.2deg, #0f172a 155.2deg 164.9deg, #991b1b 164.9deg 174.6deg, #0f172a 174.6deg 184.3deg, #991b1b 184.3deg 194deg, #0f172a 194deg 203.7deg, #991b1b 203.7deg 213.4deg, #0f172a 213.4deg 223.1deg, #991b1b 223.1deg 232.8deg, #0f172a 232.8deg 242.5deg, #991b1b 242.5deg 252.2deg, #0f172a 252.2deg 261.9deg, #991b1b 261.9deg 271.6deg, #0f172a 271.6deg 281.3deg, #991b1b 281.3deg 291deg, #0f172a 291deg 300.7deg, #991b1b 300.7deg 310.4deg, #0f172a 310.4deg 320.1deg, #991b1b 320.1deg 329.8deg, #0f172a 329.8deg 339.5deg, #991b1b 339.5deg 349.2deg, #0f172a 349.2deg 360deg)',
              }}
            />

            {/* Brass Center Turret */}
            <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-700 via-amber-400 to-amber-600 border-4 border-amber-900 shadow-xl flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#2a1708] border-2 border-amber-300/60 flex items-center justify-center font-display font-black text-amber-300 text-xs shadow-inner">
                {isSpinning ? '...' : lastResult ? lastResult.winningNumber : '★'}
              </div>
            </div>

            {/* Ball Track & Spinning Ball Indicator */}
            <div
              className="absolute inset-2 rounded-full pointer-events-none transition-transform ease-out"
              style={{
                transform: `rotate(${ballRotation}deg)`,
                transitionDuration: isReducedMotion ? '200ms' : '2500ms',
              }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 shadow-md absolute top-1 left-1/2 -translate-x-1/2" />
            </div>
          </div>

          {/* Winning Outcome Display */}
          <div className="mt-4 text-center w-full p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            {lastResult && !isSpinning ? (
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                  Landed On
                </span>
                <span
                  className={`font-display text-2xl font-black ${
                    lastResult.winningColor === 'red'
                      ? 'text-rose-400'
                      : lastResult.winningColor === 'green'
                      ? 'text-emerald-400'
                      : 'text-slate-100'
                  }`}
                >
                  {lastResult.winningNumber} ({lastResult.winningColor.toUpperCase()})
                </span>
                {lastResult.totalPayout > 0 ? (
                  <span className="text-xs font-mono font-bold text-amber-300 block mt-1">
                    WIN: +{lastResult.totalPayout.toLocaleString()} CHIPS
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 block mt-1">No winning bets</span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">Ready for next spin</span>
            )}
          </div>

          {/* History strip */}
          <div className="w-full mt-3 pt-3 border-t border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5 flex items-center gap-1">
              <History className="w-3 h-3" /> Recent Numbers:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {history.map((h, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-[11px] shrink-0 border ${
                    h.color === 'red'
                      ? 'bg-rose-900/60 text-rose-200 border-rose-700/60'
                      : h.color === 'green'
                      ? 'bg-emerald-900/60 text-emerald-200 border-emerald-700/60'
                      : 'bg-slate-900 text-slate-200 border-slate-700'
                  }`}
                >
                  {h.number}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Felt Betting Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-casino-felt rounded-2xl border-4 border-[#3a2210] p-4 sm:p-6 shadow-2xl relative select-none">
            {/* Roulette Board Felt Layout */}
            <div className="space-y-2">
              {/* Top Zero Row */}
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => addBet('num_0', { id: '0', type: 'straight', numbers: [0], amount: 0 })}
                className={`w-full py-2.5 rounded-lg border font-mono font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeBets['num_0']
                    ? 'ring-2 ring-amber-400 bg-emerald-600 text-white'
                    : 'bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border-emerald-600'
                }`}
              >
                <span>0 (Green Zero)</span>
                {activeBets['num_0'] && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                    {activeBets['num_0'].amount}
                  </span>
                )}
              </button>

              {/* 1-36 Grid (3 rows x 12 columns) */}
              <div className="grid grid-cols-12 gap-1 sm:gap-1.5">
                {Array.from({ length: 36 }).map((_, i) => {
                  const num = i + 1;
                  const key = `num_${num}`;
                  const bet = activeBets[key];

                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isSpinning}
                      onClick={() =>
                        addBet(key, { id: String(num), type: 'straight', numbers: [num], amount: 0 })
                      }
                      className={`h-11 sm:h-12 rounded border font-mono font-bold text-xs sm:text-sm flex flex-col items-center justify-center transition-all cursor-pointer relative ${getNumberColor(
                        num
                      )} ${bet ? 'ring-2 ring-amber-400' : ''}`}
                    >
                      <span>{num}</span>
                      {bet && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">
                          {bet.amount > 999 ? '1k+' : bet.amount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Dozens Row (1st 12, 2nd 12, 3rd 12) */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { label: '1st 12 (1-12)', type: 'dozen' as const, nums: Array.from({ length: 12 }, (_, i) => i + 1) },
                  { label: '2nd 12 (13-24)', type: 'dozen' as const, nums: Array.from({ length: 12 }, (_, i) => i + 13) },
                  { label: '3rd 12 (25-36)', type: 'dozen' as const, nums: Array.from({ length: 12 }, (_, i) => i + 25) },
                ].map((d, idx) => {
                  const key = `dozen_${idx}`;
                  const bet = activeBets[key];
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSpinning}
                      onClick={() => addBet(key, { id: key, type: d.type, numbers: d.nums, amount: 0 })}
                      className={`py-2 rounded border border-amber-500/40 font-mono text-xs font-bold transition-all ${
                        bet ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300' : 'bg-black/40 hover:bg-black/60 text-amber-200'
                      }`}
                    >
                      {d.label} {bet ? `(${bet.amount})` : '2:1'}
                    </button>
                  );
                })}
              </div>

              {/* Outside Bets Row (1-18, Even, Red, Black, Odd, 19-36) */}
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {[
                  { label: '1 to 18', key: 'low', type: 'low' as const, nums: Array.from({ length: 18 }, (_, i) => i + 1) },
                  { label: 'EVEN', key: 'even', type: 'even' as const, nums: Array.from({ length: 18 }, (_, i) => (i + 1) * 2) },
                  { label: 'RED', key: 'red', type: 'red' as const, nums: RED_NUMBERS },
                  { label: 'BLACK', key: 'black', type: 'black' as const, nums: Array.from({ length: 36 }, (_, i) => i + 1).filter(n => !RED_NUMBERS.includes(n)) },
                  { label: 'ODD', key: 'odd', type: 'odd' as const, nums: Array.from({ length: 18 }, (_, i) => i * 2 + 1) },
                  { label: '19 to 36', key: 'high', type: 'high' as const, nums: Array.from({ length: 18 }, (_, i) => i + 19) },
                ].map((o) => {
                  const bet = activeBets[o.key];
                  return (
                    <button
                      key={o.key}
                      type="button"
                      disabled={isSpinning}
                      onClick={() => addBet(o.key, { id: o.key, type: o.type, numbers: o.nums, amount: 0 })}
                      className={`py-2 px-1 rounded border font-mono font-bold text-[11px] truncate transition-all ${
                        o.key === 'red'
                          ? bet ? 'bg-rose-600 text-white ring-2 ring-amber-400' : 'bg-rose-900/60 hover:bg-rose-800 text-rose-100 border-rose-600'
                          : o.key === 'black'
                          ? bet ? 'bg-slate-900 text-amber-300 ring-2 ring-amber-400' : 'bg-slate-950/80 hover:bg-slate-900 text-slate-200 border-slate-700'
                          : bet ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300' : 'bg-black/40 hover:bg-black/60 text-slate-200 border-slate-700'
                      }`}
                    >
                      {o.label} {bet ? `(${bet.amount})` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chips & Spin Action */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4">
            <ChipSelector
              selectedChip={selectedChip}
              onSelectChip={(val) => setSelectedChip(val)}
              currentBet={totalBet}
              onDoubleBet={handleDoubleBets}
              onClearBet={handleClearBets}
              disabled={isSpinning}
            />

            <button
              type="button"
              disabled={isSpinning || totalBet <= 0 || totalBet > playerBalance}
              onClick={handleSpin}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-display font-extrabold text-base tracking-wider uppercase rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSpinning ? (
                <>
                  <RotateCw className="w-5 h-5 animate-spin" />
                  <span>Spinning Roulette Wheel...</span>
                </>
              ) : (
                <span>SPIN WHEEL ({totalBet.toLocaleString()} CHIPS)</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
