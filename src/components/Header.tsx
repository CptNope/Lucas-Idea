import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, User, RefreshCw, EyeOff, Eye } from 'lucide-react';
import type { Player, CasinoConfig } from '../types/casino.ts';
import { sound } from '../services/sound.ts';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  player: Player | null;
  config: CasinoConfig | null;
  onClaimDaily: () => void;
  onResetBalance: () => void;
  onOpenProfile: () => void;
  isReducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  player,
  config,
  onClaimDaily,
  onResetBalance,
  onOpenProfile,
  isReducedMotion,
  onToggleReducedMotion,
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  const handleToggleMute = () => {
    const next = !isMuted;
    sound.setMuted(next);
    setIsMuted(next);
  };

  const navItems = [
    { id: 'games', label: 'Games' },
    { id: 'experiment', label: 'Experiment Lab' },
    { id: 'transfers', label: 'Peer Transfers' },
    { id: 'rules', label: 'Rules & Fairness' },
    { id: 'admin', label: 'Admin Dashboard' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0c0f14]/95 backdrop-blur-md border-b border-slate-800">
      {/* Universal 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark in Display Font */}
        <button
          type="button"
          onClick={() => onTabChange('games')}
          className="text-left group cursor-pointer shrink-0"
        >
          <span className="font-display text-xl sm:text-2xl font-bold tracking-wider gold-gradient-text uppercase block whitespace-nowrap">
            Grand Royale
          </span>
          <span className="text-[10px] tracking-widest text-slate-400 font-mono uppercase block -mt-1">
            Casino Simulator
          </span>
        </button>

        {/* Zone 2: 4-5 single-line clean navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                  isActive
                    ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                    : 'text-slate-400 hover:text-slate-100 hover:border-b-2 hover:border-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary action & Player Wallet HUD */}
        <div className="flex items-center gap-3 shrink-0">
          {player && (
            <div className="flex items-center gap-2 bg-slate-900/90 rounded-lg p-1.5 border border-slate-800">
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 transition-colors text-left"
                title="Switch player or view profile"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-xs shadow-inner">
                  {player.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <span className="text-xs font-medium text-slate-200 block leading-tight truncate max-w-[100px]">
                    {player.username}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 tabular-nums block leading-tight">
                    {player.balance.toLocaleString()} chips
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={onClaimDaily}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-md transition-all shadow-sm shadow-amber-500/20 whitespace-nowrap cursor-pointer active:scale-95"
                title="Claim daily bonus chips"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+Bonus</span>
              </button>

              {config?.allowBalanceReset && (
                <button
                  type="button"
                  onClick={onResetBalance}
                  className="hidden xl:flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors whitespace-nowrap"
                  title="Reset practice balance"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          )}

          {/* Sound & Accessibility Toggles */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isMuted
                  ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  : 'text-amber-400 hover:bg-slate-800'
              }`}
              title={isMuted ? 'Unmute Casino Audio' : 'Mute Casino Audio'}
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onToggleReducedMotion}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isReducedMotion
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title={isReducedMotion ? 'Motion Reduced (Click for full animations)' : 'Reduce Motion'}
              aria-label="Toggle Reduced Motion"
            >
              {isReducedMotion ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Secondary Navigation Row */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 bg-slate-950/80 border-t border-slate-800/60 gap-4 scrollbar-none text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`whitespace-nowrap shrink-0 py-1 font-medium ${
              activeTab === item.id ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
