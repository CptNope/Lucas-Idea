import React from 'react';
import { sound } from '../services/sound.ts';

interface ChipSelectorProps {
  selectedChip: number;
  onSelectChip: (value: number) => void;
  currentBet?: number;
  onDoubleBet?: () => void;
  onClearBet?: () => void;
  disabled?: boolean;
}

const CHIP_DENOMINATIONS = [
  { value: 10, label: '10', color: 'from-slate-200 to-slate-400 text-slate-900 border-slate-300' },
  { value: 50, label: '50', color: 'from-blue-600 to-blue-800 text-white border-blue-400' },
  { value: 100, label: '100', color: 'from-rose-600 to-rose-800 text-white border-rose-400' },
  { value: 500, label: '500', color: 'from-emerald-600 to-emerald-800 text-white border-emerald-400' },
  { value: 1000, label: '1K', color: 'from-amber-500 to-amber-700 text-slate-950 border-amber-300 font-bold' },
  { value: 5000, label: '5K', color: 'from-purple-800 to-slate-950 text-amber-300 border-amber-500 font-bold' },
];

export const ChipSelector: React.FC<ChipSelectorProps> = ({
  selectedChip,
  onSelectChip,
  currentBet,
  onDoubleBet,
  onClearBet,
  disabled = false,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 whitespace-nowrap">
          Chips:
        </span>
        {CHIP_DENOMINATIONS.map((chip) => {
          const isSelected = selectedChip === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              disabled={disabled}
              onClick={() => {
                sound.playChip();
                onSelectChip(chip.value);
              }}
              className={`relative flex items-center justify-center w-11 h-11 rounded-full font-mono font-bold text-xs tracking-tight shadow-md border-2 transition-all duration-150 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                chip.color
              } ${
                isSelected
                  ? 'scale-110 ring-4 ring-amber-400/80 shadow-amber-500/30 -translate-y-1'
                  : 'hover:scale-105 active:scale-95 hover:-translate-y-0.5'
              }`}
              style={{
                background: isSelected ? undefined : undefined,
                boxShadow: isSelected ? '0 0 15px rgba(245, 158, 11, 0.4)' : undefined,
              }}
              title={`Select ${chip.value} chip`}
            >
              {/* Inner dashed ring styling casino poker chip */}
              <span className="absolute inset-1 rounded-full border border-dashed border-current opacity-40 pointer-events-none" />
              <span className="relative z-10">{chip.label}</span>
            </button>
          );
        })}
      </div>

      {(onDoubleBet || onClearBet || currentBet !== undefined) && (
        <div className="flex items-center gap-2 ml-auto">
          {currentBet !== undefined && (
            <div className="text-right px-3 py-1 bg-slate-950/70 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block font-medium">Active Bet</span>
              <span className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                {currentBet.toLocaleString()} <span className="text-[10px] text-amber-500/80">CHIPS</span>
              </span>
            </div>
          )}

          {onDoubleBet && (
            <button
              type="button"
              disabled={disabled || !currentBet}
              onClick={() => {
                sound.playChip();
                onDoubleBet();
              }}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              2x Double
            </button>
          )}

          {onClearBet && (
            <button
              type="button"
              disabled={disabled || !currentBet}
              onClick={() => {
                sound.playChip();
                onClearBet();
              }}
              className="px-2.5 py-1.5 text-xs font-semibold bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 rounded-lg border border-rose-900/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};
