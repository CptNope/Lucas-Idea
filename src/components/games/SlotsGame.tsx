import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, HelpCircle, ShieldCheck, Play, RotateCcw } from 'lucide-react';
import type { SlotSymbol, SlotSpinResult, GameSettings } from '../../types/casino.ts';
import { api } from '../../services/api.ts';
import { sound } from '../../services/sound.ts';
import { ChipSelector } from '../ChipSelector.tsx';

interface SlotsGameProps {
  playerBalance: number;
  gameSettings: GameSettings;
  onBalanceUpdate: (newBalance: number) => void;
  isReducedMotion: boolean;
}

const SYMBOL_CONFIG: Record<SlotSymbol, { label: string; icon: string; color: string; bg: string }> = {
  wild: { label: 'WILD', icon: '👑', color: 'text-amber-300', bg: 'from-amber-600/30 to-amber-900/40 border-amber-500/50' },
  seven: { label: 'SEVEN', icon: '7️⃣', color: 'text-red-400', bg: 'from-red-600/30 to-red-900/40 border-red-500/50' },
  diamond: { label: 'DIAMOND', icon: '💎', color: 'text-cyan-300', bg: 'from-cyan-600/30 to-cyan-900/40 border-cyan-500/50' },
  bell: { label: 'BELL', icon: '🔔', color: 'text-yellow-300', bg: 'from-yellow-600/30 to-yellow-900/40 border-yellow-500/50' },
  bar: { label: 'BAR', icon: '🍫', color: 'text-orange-300', bg: 'from-orange-600/30 to-orange-900/40 border-orange-500/50' },
  cherry: { label: 'CHERRY', icon: '🍒', color: 'text-rose-400', bg: 'from-rose-600/30 to-rose-900/40 border-rose-500/50' },
};

const PAYOUT_RULES = [
  { symbol: 'wild', name: 'Royal Crown Wild', combo: '3x WILD', mult: '150x Line' },
  { symbol: 'seven', name: 'Lucky Gold Seven', combo: '3x SEVEN', mult: '60x Line' },
  { symbol: 'diamond', name: 'Brilliant Diamond', combo: '3x DIAMOND', mult: '30x Line' },
  { symbol: 'bell', name: 'Liberty Bell', combo: '3x BELL', mult: '18x Line' },
  { symbol: 'bar', name: 'Gold Bullion Bar', combo: '3x BAR', mult: '10x Line' },
  { symbol: 'cherry', name: 'Twin Cherries', combo: '3x CHERRY', mult: '6x Line' },
  { symbol: 'cherry', name: 'Single Cherries', combo: '2x CHERRY (left)', mult: '2x Line' },
];

export const SlotsGame: React.FC<SlotsGameProps> = ({
  playerBalance,
  gameSettings,
  onBalanceUpdate,
  isReducedMotion,
}) => {
  const [betPerLine, setBetPerLine] = useState(10);
  const [activeLines, setActiveLines] = useState(5);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelDisplay, setReelDisplay] = useState<SlotSymbol[][]>([
    ['seven', 'wild', 'bell'],
    ['bell', 'diamond', 'bar'],
    ['seven', 'cherry', 'bell'],
  ]);
  const [lastResult, setLastResult] = useState<SlotSpinResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);
  const [showFairness, setShowFairness] = useState(false);

  const totalBet = betPerLine * activeLines;

  const handleSpin = async () => {
    if (isSpinning) return;
    if (totalBet > playerBalance) {
      setErrorMsg('Insufficient play-chips balance');
      return;
    }
    setErrorMsg(null);
    setIsSpinning(true);
    sound.playChip();

    try {
      const resp = await api.spinSlots(betPerLine, activeLines);
      const targetReels = resp.result.reels;

      // Animate reels with sequential stop timing
      const duration = isReducedMotion ? 200 : 1200;
      const spinInterval = setInterval(() => {
        setReelDisplay([
          [randomSymbol(), randomSymbol(), randomSymbol()],
          [randomSymbol(), randomSymbol(), randomSymbol()],
          [randomSymbol(), randomSymbol(), randomSymbol()],
        ]);
        sound.playReelStop(0.8 + Math.random() * 0.4);
      }, 90);

      setTimeout(() => {
        clearInterval(spinInterval);
        setReelDisplay(targetReels);
        setIsSpinning(false);
        setLastResult(resp.result);
        onBalanceUpdate(resp.balance);

        if (resp.result.totalPayout > 0) {
          if (resp.result.totalPayout >= totalBet * 10) {
            sound.playJackpot();
            if (!isReducedMotion) {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ffd700', '#ffae19', '#ffffff'],
              });
            }
          } else {
            sound.playWin();
          }
        } else {
          sound.playReelStop(1.2);
        }
      }, duration);
    } catch (err: unknown) {
      setIsSpinning(false);
      setErrorMsg(err instanceof Error ? err.message : 'Spin error');
    }
  };

  function randomSymbol(): SlotSymbol {
    const list: SlotSymbol[] = ['wild', 'seven', 'diamond', 'bell', 'bar', 'cherry'];
    return list[Math.floor(Math.random() * list.length)];
  }

  return (
    <div className="space-y-6">
      {/* Game Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <span>Golden Fortune Slots</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              3-Reel Classic 5-Line
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Theoretical RTP: {(100 - gameSettings.houseEdgePercent).toFixed(1)}% · High Volatility Classic Mechanical Reels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPaytable(!showPaytable)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Payout Table</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFairness(!showFairness)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fairness</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Machine Cabinet Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Slot Machine Frame (8 Cols) */}
        <div className="lg:col-span-8 bg-[#0a0d12] rounded-2xl border-2 border-amber-600/30 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Golden Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

          {/* Machine Header Marquee */}
          <div className="relative text-center pb-4 mb-4 border-b border-amber-900/40">
            <span className="text-[11px] font-mono tracking-widest text-amber-500/80 uppercase font-semibold block">
              ★ High Roller Deluxe Mechanical Reel ★
            </span>
            <div className="font-display text-2xl sm:text-3xl font-extrabold gold-gradient-text tracking-wider uppercase mt-1">
              Golden Fortune
            </div>
          </div>

          {/* Reel Window Display */}
          <div className="relative bg-[#05070a] rounded-xl border-4 border-amber-700/50 p-3 sm:p-5 shadow-inner">
            {/* Payline indicators left & right */}
            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-8 text-[10px] font-mono text-amber-400/60 font-bold pointer-events-none">
              <span>L1</span>
              <span>L0</span>
              <span>L2</span>
            </div>
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-8 text-[10px] font-mono text-amber-400/60 font-bold pointer-events-none">
              <span>L1</span>
              <span>L0</span>
              <span>L2</span>
            </div>

            {/* 3 Reels x 3 Visible Rows Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto">
              {[0, 1, 2].map((reelIndex) => (
                <div
                  key={reelIndex}
                  className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-lg border border-slate-800 p-2 sm:p-3 flex flex-col gap-3 shadow-inner overflow-hidden"
                >
                  {[0, 1, 2].map((rowIndex) => {
                    const sym = reelDisplay[reelIndex]?.[rowIndex] || 'cherry';
                    const config = SYMBOL_CONFIG[sym];

                    // Highlight winning symbols if last result had hits
                    const isWinningCell = lastResult?.hits.some((hit) => {
                      if (hit.lineIndex === 0 && rowIndex === 1) return true;
                      if (hit.lineIndex === 1 && rowIndex === 0) return true;
                      if (hit.lineIndex === 2 && rowIndex === 2) return true;
                      if (hit.lineIndex === 3 && ((reelIndex === 0 && rowIndex === 0) || (reelIndex === 1 && rowIndex === 1) || (reelIndex === 2 && rowIndex === 2))) return true;
                      if (hit.lineIndex === 4 && ((reelIndex === 0 && rowIndex === 2) || (reelIndex === 1 && rowIndex === 1) || (reelIndex === 2 && rowIndex === 0))) return true;
                      return false;
                    });

                    return (
                      <div
                        key={rowIndex}
                        className={`h-20 sm:h-24 rounded-lg flex flex-col items-center justify-center border transition-all duration-200 select-none ${
                          isWinningCell
                            ? 'bg-gradient-to-t from-amber-500/30 to-amber-900/40 border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/20 scale-105'
                            : `bg-gradient-to-b ${config.bg}`
                        } ${isSpinning ? 'blur-[1px]' : ''}`}
                      >
                        <span className="text-3xl sm:text-4xl filter drop-shadow">{config.icon}</span>
                        <span className={`text-[10px] font-mono font-bold tracking-tight uppercase mt-1 ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Active Payline Overlay Result Badge */}
            {lastResult && lastResult.totalPayout > 0 && !isSpinning && (
              <div className="mt-4 p-2.5 bg-gradient-to-r from-amber-950/80 via-amber-900/90 to-amber-950/80 border border-amber-500/60 rounded-lg text-center animate-pulse">
                <span className="text-xs uppercase tracking-wider text-amber-300 font-bold block">
                  WINNER! {lastResult.hits.length} Payline Hit{lastResult.hits.length > 1 ? 's' : ''}
                </span>
                <span className="font-display text-xl sm:text-2xl font-black text-amber-200 tabular-nums">
                  +{lastResult.totalPayout.toLocaleString()} CHIPS
                </span>
              </div>
            )}
          </div>

          {/* Machine Controls */}
          <div className="mt-5 space-y-4">
            {/* Payline Selector */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
              <span className="font-semibold text-slate-300 whitespace-nowrap">Active Paylines:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((lines) => (
                  <button
                    key={lines}
                    type="button"
                    disabled={isSpinning}
                    onClick={() => {
                      sound.playChip();
                      setActiveLines(lines);
                    }}
                    className={`w-8 h-8 rounded-lg font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 ${
                      activeLines === lines
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {lines}
                  </button>
                ))}
              </div>
            </div>

            {/* Chip Selector for Bet per line */}
            <ChipSelector
              selectedChip={betPerLine}
              onSelectChip={(val) => setBetPerLine(val)}
              currentBet={totalBet}
              onDoubleBet={() => setBetPerLine(Math.min(gameSettings.maxBet / activeLines, betPerLine * 2))}
              onClearBet={() => setBetPerLine(gameSettings.minBet)}
              disabled={isSpinning}
            />

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSpinning || totalBet > playerBalance}
                onClick={handleSpin}
                className="flex-1 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-display font-extrabold text-base tracking-wider uppercase rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSpinning ? (
                  <>
                    <RotateCcw className="w-5 h-5 animate-spin" />
                    <span>Spinning Reels...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>SPIN ({totalBet.toLocaleString()} CHIPS)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel: Payout Summary / Provably Fair (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Paytable Reference */}
          <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-4">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center justify-between pb-2 border-b border-slate-800">
              <span>Top Payout Multipliers</span>
              <span className="text-[11px] font-mono text-amber-400">Fixed Odds</span>
            </h3>
            <div className="divide-y divide-slate-800/60 text-xs mt-2">
              {PAYOUT_RULES.map((rule, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{SYMBOL_CONFIG[rule.symbol as SlotSymbol].icon}</span>
                    <span className="text-slate-300 font-medium">{rule.combo}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">{rule.mult}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Provably Fair Transparency */}
          {lastResult && (
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Provably Fair Hash</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Server-side outcome determined using verifiable cryptographic hash.
              </p>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[10px] text-slate-300 break-all">
                Hash: {lastResult.serverSeedHash.slice(0, 32)}...
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Verification Nonce:</span>
                <span className="font-mono font-bold text-slate-200">#{lastResult.nonce}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
