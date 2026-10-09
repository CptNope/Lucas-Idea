import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sliders, HelpCircle, ShieldCheck, Dices, ArrowRightLeft } from 'lucide-react';
import type { MultiplierDiceResult, CrapsDiceResult, GameSettings } from '../../types/casino.ts';
import { api } from '../../services/api.ts';
import { sound } from '../../services/sound.ts';
import { ChipSelector } from '../ChipSelector.tsx';

interface DiceGameProps {
  playerBalance: number;
  gameSettings: GameSettings;
  onBalanceUpdate: (newBalance: number) => void;
  isReducedMotion: boolean;
}

export const DiceGame: React.FC<DiceGameProps> = ({
  playerBalance,
  gameSettings,
  onBalanceUpdate,
  isReducedMotion,
}) => {
  const [mode, setMode] = useState<'multiplier' | 'craps'>('multiplier');
  const [bet, setBet] = useState(50);
  const [selectedChip, setSelectedChip] = useState(50);

  // Multiplier Mode State
  const [target, setTarget] = useState(50);
  const [condition, setCondition] = useState<'over' | 'under'>('over');
  const [multResult, setMultResult] = useState<MultiplierDiceResult | null>(null);

  // Craps Mode State
  const [crapsBetType, setCrapsBetType] = useState<'pass' | 'dont_pass' | 'field' | 'craps_seven'>('pass');
  const [crapsResult, setCrapsResult] = useState<CrapsDiceResult | null>(null);

  const [isRolling, setIsRolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showFairness, setShowFairness] = useState(false);

  // Multiplier calculations
  const winChance = condition === 'over' ? 100 - target : target;
  const houseEdge = (gameSettings.houseEdgePercent || 1.0) / 100;
  const rawMultiplier = (100 * (1 - houseEdge)) / winChance;
  const calculatedMultiplier = Math.round(rawMultiplier * 100) / 100;
  const potentialProfit = Math.floor(bet * calculatedMultiplier) - bet;

  const handleRoll = async () => {
    if (isRolling) return;
    if (bet > playerBalance) {
      setErrorMsg('Insufficient play-chips balance');
      return;
    }

    setErrorMsg(null);
    setIsRolling(true);
    sound.playChip();
    sound.playDice();

    try {
      const duration = isReducedMotion ? 150 : 800;

      if (mode === 'multiplier') {
        const resp = await api.rollMultiplierDice(bet, target, condition);
        setTimeout(() => {
          setIsRolling(false);
          setMultResult(resp.result);
          onBalanceUpdate(resp.balance);

          if (resp.result.won) {
            if (resp.result.multiplier >= 5) {
              sound.playJackpot();
              if (!isReducedMotion) {
                confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
              }
            } else {
              sound.playWin();
            }
          } else {
            sound.playReelStop(0.9);
          }
        }, duration);
      } else {
        const resp = await api.rollCrapsDice(bet, crapsBetType);
        setTimeout(() => {
          setIsRolling(false);
          setCrapsResult(resp.result);
          onBalanceUpdate(resp.balance);

          if (resp.result.won) {
            sound.playWin();
            if (resp.result.multiplier >= 4 && !isReducedMotion) {
              confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
            }
          } else if (!resp.result.push) {
            sound.playReelStop(0.9);
          }
        }, duration);
      }
    } catch (err: unknown) {
      setIsRolling(false);
      setErrorMsg(err instanceof Error ? err.message : 'Roll error');
    }
  };

  const renderDiceFace = (value: number) => {
    const dotPositions: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    const active = dotPositions[value] || [];

    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-2xl border-2 border-red-400 p-2 sm:p-2.5 shadow-xl grid grid-cols-3 grid-rows-3 gap-1 select-none transform transition-transform hover:rotate-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {active.includes(i) && (
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white shadow-sm" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <span>Imperial Dice Arena</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {mode === 'multiplier' ? 'Multiplier Hi-Lo' : 'Casino Craps'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent House Edge: {gameSettings.houseEdgePercent.toFixed(1)}% · Provably Fair Cryptographic Seed
          </p>
        </div>

        {/* Mode Switcher Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              setMode('multiplier');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'multiplier'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multiplier Slider
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              setMode('craps');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'craps'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Craps Table
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

      {mode === 'multiplier' ? (
        /* Multiplier Slider UI */
        <div className="space-y-6">
          {/* Main Display Box */}
          <div className="bg-[#090d14] rounded-2xl border-2 border-amber-700/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
            <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase font-semibold block">
              Random Roll Generator (0.00 - 99.99)
            </span>

            <div className="my-6">
              <span
                className={`font-display text-5xl sm:text-7xl font-black tracking-tight tabular-nums transition-all ${
                  isRolling
                    ? 'text-slate-500 animate-pulse'
                    : multResult
                    ? multResult.won
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {isRolling ? '??.??' : multResult ? multResult.rolledNumber.toFixed(2) : '50.00'}
              </span>

              {multResult && !isRolling && (
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                      multResult.won
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {multResult.won
                      ? `Target Hit! Won +${multResult.payout.toLocaleString()} chips`
                      : `Missed Target (Rolled ${multResult.rolledNumber})`}
                  </span>
                </div>
              )}
            </div>

            {/* Slider Control */}
            <div className="max-w-xl mx-auto space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>0.00</span>
                <span className="text-amber-400 font-bold text-sm">Target: {target}</span>
                <span>100.00</span>
              </div>

              <input
                type="range"
                min="2"
                max="98"
                value={target}
                disabled={isRolling}
                onChange={(e) => {
                  sound.playChip();
                  setTarget(parseInt(e.target.value, 10));
                }}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              {/* Over / Under Condition Toggle */}
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isRolling}
                  onClick={() => {
                    sound.playChip();
                    setCondition('over');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    condition === 'over'
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/80'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  ROLL OVER {target}
                </button>
                <button
                  type="button"
                  disabled={isRolling}
                  onClick={() => {
                    sound.playChip();
                    setCondition('under');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    condition === 'under'
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/80'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  ROLL UNDER {target}
                </button>
              </div>

              {/* Real-time Math Breakdown Bar */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-center">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Win Chance</span>
                  <span className="font-mono font-bold text-slate-200">{winChance.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Multiplier</span>
                  <span className="font-mono font-bold text-amber-400">{calculatedMultiplier}x</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Profit On Win</span>
                  <span className="font-mono font-bold text-emerald-400">+{potentialProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Craps Table UI */
        <div className="space-y-6">
          <div className="bg-casino-felt rounded-2xl border-4 border-[#3a2210] p-6 sm:p-8 shadow-2xl relative">
            <div className="text-center space-y-4">
              <span className="text-[11px] font-mono tracking-widest text-amber-300/80 uppercase font-semibold block">
                Two-Dice Felt Table
              </span>

              {/* 2 Animated Dice */}
              <div className="flex justify-center items-center gap-6 my-4">
                {renderDiceFace(crapsResult ? crapsResult.die1 : 4)}
                {renderDiceFace(crapsResult ? crapsResult.die2 : 3)}
              </div>

              {crapsResult && !isRolling && (
                <div className="inline-block px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700">
                  <span className="text-sm font-bold text-amber-300">
                    Rolled {crapsResult.die1} + {crapsResult.die2} = {crapsResult.sum}{' '}
                    {crapsResult.won
                      ? `(Won +${crapsResult.payout} chips)`
                      : crapsResult.push
                      ? '(Push - Bet Returned)'
                      : '(Loss)'}
                  </span>
                </div>
              )}
            </div>

            {/* Craps Betting Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
              {[
                { type: 'pass' as const, label: 'Pass Line (1:1)', desc: 'Win on 7, 11' },
                { type: 'dont_pass' as const, label: "Don't Pass (1:1)", desc: 'Win on 2, 3 (12 push)' },
                { type: 'field' as const, label: 'Field Bet (2:1 / 3:1)', desc: 'Win on 2,3,4,9,10,11,12' },
                { type: 'craps_seven' as const, label: 'Any Seven (4:1)', desc: 'Win on 7 only' },
              ].map((c) => {
                const isSelected = crapsBetType === c.type;
                return (
                  <button
                    key={c.type}
                    type="button"
                    disabled={isRolling}
                    onClick={() => {
                      sound.playChip();
                      setCrapsBetType(c.type);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 shadow-md ring-2 ring-amber-400'
                        : 'bg-black/50 hover:bg-black/70 text-slate-200 border-amber-500/30'
                    }`}
                  >
                    <span className="text-xs font-bold block">{c.label}</span>
                    <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-slate-800' : 'text-slate-400'}`}>
                      {c.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Betting Controls & Action Button */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4">
        <ChipSelector
          selectedChip={selectedChip}
          onSelectChip={(val) => {
            setSelectedChip(val);
            setBet(val);
          }}
          currentBet={bet}
          onDoubleBet={() => setBet(Math.min(gameSettings.maxBet, bet * 2))}
          onClearBet={() => setBet(gameSettings.minBet)}
          disabled={isRolling}
        />

        <button
          type="button"
          disabled={isRolling || bet > playerBalance}
          onClick={handleRoll}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-display font-extrabold text-base tracking-wider uppercase rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRolling ? (
            <span>Rolling Dice...</span>
          ) : (
            <span>ROLL DICE ({bet.toLocaleString()} CHIPS)</span>
          )}
        </button>
      </div>
    </div>
  );
};
