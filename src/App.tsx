/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  Dices,
  Layers,
  CircleDot,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import type { Player, CasinoConfig, GameType } from './types/casino.ts';
import { api } from './services/api.ts';
import { sound } from './services/sound.ts';

import { Header } from './components/Header.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { SlotsGame } from './components/games/SlotsGame.tsx';
import { BlackjackGame } from './components/games/BlackjackGame.tsx';
import { RouletteGame } from './components/games/RouletteGame.tsx';
import { DiceGame } from './components/games/DiceGame.tsx';
import { ExperimentLab } from './components/ExperimentLab.tsx';
import { TransferMarket } from './components/TransferMarket.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { RulesSection } from './components/RulesSection.tsx';

// Image assets generated via generate_image
import slotsBannerImg from './assets/images/casino_slots_banner_1791581285484.jpg';
import blackjackBannerImg from './assets/images/casino_blackjack_table_1791581294136.jpg';
import rouletteBannerImg from './assets/images/casino_roulette_wheel_1791581303342.jpg';
import diceBannerImg from './assets/images/casino_dice_table_1791581313170.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('games');
  const [selectedGame, setSelectedGame] = useState<GameType>('slots');
  const [config, setConfig] = useState<CasinoConfig | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & UI States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Fetch initial casino state from server
  const loadCasinoState = async () => {
    try {
      const data = await api.getState();
      setConfig(data.config);
      setPlayer(data.activePlayer);
      setAllPlayers(data.playersList);
      setIsLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not connect to casino server');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCasinoState();
  }, []);

  const handleClaimDailyBonus = async () => {
    sound.playChip();
    try {
      const resp = await api.claimDailyBonus();
      setPlayer((prev) => (prev ? { ...prev, balance: resp.balance } : null));
      sound.playWin();
      if (!isReducedMotion) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.2 },
        });
      }
      setBannerNotice({
        text: `Daily bonus claimed! +${resp.bonusAmount.toLocaleString()} chips credited to your wallet.`,
        type: 'success',
      });
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err: unknown) {
      setBannerNotice({
        text: err instanceof Error ? err.message : 'Failed to claim daily bonus',
        type: 'error',
      });
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  const handleResetBalance = async () => {
    if (!confirm('Reset your practice balance back to initial starting chips?')) return;
    sound.playChip();
    try {
      const resp = await api.resetPracticeBalance();
      setPlayer((prev) => (prev ? { ...prev, balance: resp.balance } : null));
      sound.playWin();
      setBannerNotice({
        text: `Practice balance reset to ${resp.balance.toLocaleString()} chips.`,
        type: 'info',
      });
      setTimeout(() => setBannerNotice(null), 3000);
    } catch (err: unknown) {
      setBannerNotice({
        text: err instanceof Error ? err.message : 'Reset failed',
        type: 'error',
      });
      setTimeout(() => setBannerNotice(null), 3000);
    }
  };

  const handleBalanceUpdate = (newBalance: number) => {
    setPlayer((prev) => (prev ? { ...prev, balance: newBalance } : null));
  };

  const gameNavCards: { id: GameType; name: string; subtitle: string; img: string; icon: typeof Sparkles }[] = [
    {
      id: 'slots',
      name: 'Golden Fortune Slots',
      subtitle: '3-Reel Classic Mechanical Reels',
      img: slotsBannerImg,
      icon: Sparkles,
    },
    {
      id: 'blackjack',
      name: 'Royal Velvet Blackjack',
      subtitle: 'Vegas Rules · Dealer Stands 17',
      img: blackjackBannerImg,
      icon: Layers,
    },
    {
      id: 'roulette',
      name: 'European Roulette',
      subtitle: 'Single 0 · Full Inside/Outside Felt',
      img: rouletteBannerImg,
      icon: CircleDot,
    },
    {
      id: 'dice',
      name: 'Imperial Dice Arena',
      subtitle: 'Multiplier Hi-Lo & Table Craps',
      img: diceBannerImg,
      icon: Dices,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <RotateCw className="w-8 h-8 text-amber-400 animate-spin" />
        <span className="font-display text-lg tracking-widest gold-gradient-text uppercase">
          Initializing Grand Royale Simulator...
        </span>
      </div>
    );
  }

  if (error || !config || !player) {
    return (
      <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold">Failed to load casino state</h2>
        <p className="text-xs text-slate-400 max-w-md">{error || 'Server unavailable'}</p>
        <button
          type="button"
          onClick={loadCasinoState}
          className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs uppercase rounded-lg hover:bg-amber-400"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          sound.playChip();
          setActiveTab(tab);
        }}
        player={player}
        config={config}
        onClaimDaily={handleClaimDailyBonus}
        onResetBalance={handleResetBalance}
        onOpenProfile={() => setIsProfileOpen(true)}
        isReducedMotion={isReducedMotion}
        onToggleReducedMotion={() => setIsReducedMotion(!isReducedMotion)}
      />

      {/* Persistent Notification Toast */}
      {bannerNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 w-full">
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              bannerNotice.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                : bannerNotice.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : 'bg-amber-950/90 border-amber-800 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <span>{bannerNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-xs underline font-semibold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {/* VIEW 1: ACTIVE GAMES */}
        {activeTab === 'games' && (
          <div className="space-y-8">
            {/* Game Selection Cards Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {gameNavCards.map((g) => {
                const isSelected = selectedGame === g.id;
                const isEnabled = config.games[g.id].enabled;

                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      sound.playChip();
                      setSelectedGame(g.id);
                    }}
                    className={`group relative rounded-2xl overflow-hidden border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 -translate-y-1'
                        : 'border-slate-800/80 hover:border-slate-700 bg-slate-900/60 hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Background Visual Image Card */}
                    <div className="h-24 sm:h-28 w-full relative overflow-hidden bg-slate-950">
                      <img
                        src={g.img}
                        alt={g.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-75"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1218] via-[#0e1218]/40 to-transparent" />
                      {!isEnabled && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-1.5 text-xs text-rose-300 font-mono font-bold">
                          <Lock className="w-3.5 h-3.5" />
                          <span>DISABLED</span>
                        </div>
                      )}
                    </div>

                    {/* Card Title & Subtitle */}
                    <div className="p-3 bg-[#0e1218]">
                      <span className="font-semibold text-xs sm:text-sm text-slate-100 block truncate group-hover:text-amber-300 transition-colors">
                        {g.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                        {g.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Game Stage Component */}
            {!config.games[selectedGame].enabled ? (
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-12 text-center max-w-lg mx-auto space-y-4">
                <Lock className="w-12 h-12 text-rose-500/60 mx-auto" />
                <h3 className="font-display text-lg font-bold text-slate-200">Game Temporarily Disabled</h3>
                <p className="text-xs text-slate-400">
                  This game is currently turned off by the casino administrator in the management console.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
                >
                  Configure in Admin Dashboard
                </button>
              </div>
            ) : (
              <div>
                {selectedGame === 'slots' && (
                  <SlotsGame
                    playerBalance={player.balance}
                    gameSettings={config.games.slots}
                    onBalanceUpdate={handleBalanceUpdate}
                    isReducedMotion={isReducedMotion}
                  />
                )}
                {selectedGame === 'blackjack' && (
                  <BlackjackGame
                    playerBalance={player.balance}
                    gameSettings={config.games.blackjack}
                    blackjackPayoutMultiplier={config.blackjackNaturalPayout}
                    onBalanceUpdate={handleBalanceUpdate}
                    isReducedMotion={isReducedMotion}
                  />
                )}
                {selectedGame === 'roulette' && (
                  <RouletteGame
                    playerBalance={player.balance}
                    gameSettings={config.games.roulette}
                    onBalanceUpdate={handleBalanceUpdate}
                    isReducedMotion={isReducedMotion}
                  />
                )}
                {selectedGame === 'dice' && (
                  <DiceGame
                    playerBalance={player.balance}
                    gameSettings={config.games.dice}
                    onBalanceUpdate={handleBalanceUpdate}
                    isReducedMotion={isReducedMotion}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: EXPERIMENT LAB */}
        {activeTab === 'experiment' && <ExperimentLab />}

        {/* VIEW 3: PEER TRANSFERS */}
        {activeTab === 'transfers' && (
          <TransferMarket
            currentPlayer={player}
            allPlayers={allPlayers}
            config={config}
            onBalanceUpdate={handleBalanceUpdate}
            onRefreshPlayers={loadCasinoState}
          />
        )}

        {/* VIEW 4: RULES & FAIRNESS */}
        {activeTab === 'rules' && <RulesSection />}

        {/* VIEW 5: ADMIN DASHBOARD */}
        {activeTab === 'admin' && (
          <AdminDashboard
            config={config}
            players={allPlayers}
            onConfigUpdated={(newCfg) => setConfig(newCfg)}
            onRefreshState={loadCasinoState}
          />
        )}
      </main>

      {/* Player Profile & Ledger Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentPlayer={player}
        allPlayers={allPlayers}
        onPlayerSwitched={(switchedPlayer) => setPlayer(switchedPlayer)}
        onRefreshState={loadCasinoState}
      />

      {/* Global Clean Editorial Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090c10] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-400">Grand Royale Casino Simulator</span>
            <span>·</span>
            <span>Virtual Play-Money Sandbox</span>
            <span>·</span>
            <span>No Real Deposits or Cashouts</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className="hover:text-slate-300 transition-colors"
            >
              Rules & Odds
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className="hover:text-slate-300 transition-colors"
            >
              Admin Controls
            </button>
            <button
              type="button"
              onClick={handleResetBalance}
              className="hover:text-slate-300 transition-colors"
            >
              Reset Practice Wallet
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
