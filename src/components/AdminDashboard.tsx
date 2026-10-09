import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  SlidersHorizontal,
  FileText,
  RotateCcw,
  CheckCircle2,
  Lock,
  Unlock,
  PlusCircle,
  HelpCircle,
  ShieldAlert,
  Save,
} from 'lucide-react';
import type { Player, CasinoConfig, AuditLogEntry, GameType } from '../types/casino.ts';
import { api } from '../services/api.ts';
import { sound } from '../services/sound.ts';

interface AdminDashboardProps {
  config: CasinoConfig;
  players: Player[];
  onConfigUpdated: (newConfig: CasinoConfig) => void;
  onRefreshState: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  config,
  players,
  onConfigUpdated,
  onRefreshState,
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'economy' | 'players' | 'audit' | 'guide'>('games');
  const [editableConfig, setEditableConfig] = useState<CasinoConfig>(JSON.parse(JSON.stringify(config)));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Player balance adjustment modal/state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [grantAmount, setGrantAmount] = useState<number>(1000);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setEditableConfig(JSON.parse(JSON.stringify(config)));
  }, [config]);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const resp = await api.getAuditLogs();
      setAuditLogs(resp.logs);
    } catch {
      // Ignored
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchLogs();
    }
  }, [activeTab]);

  const handleSaveConfig = async () => {
    sound.playChip();
    try {
      const resp = await api.updateConfig(editableConfig);
      onConfigUpdated(resp.config);
      setSaveSuccess(true);
      sound.playWin();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save config');
    }
  };

  const handleAdjustPlayer = async (playerId: string, delta: number) => {
    sound.playChip();
    try {
      await api.adjustPlayer(playerId, { balanceAdjustment: delta });
      setStatusMessage(`Granted ${delta > 0 ? '+' : ''}${delta} chips`);
      onRefreshState();
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Adjustment failed');
    }
  };

  const handleToggleFreeze = async (player: Player) => {
    sound.playChip();
    try {
      await api.adjustPlayer(player.id, { toggleFreeze: !player.isFrozen });
      onRefreshState();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const handleResetSystem = async () => {
    if (!confirm('Are you sure you want to reset all players, bankrolls, and audit logs to factory defaults?')) {
      return;
    }
    sound.playChip();
    try {
      await api.resetSystem();
      onRefreshState();
      alert('Casino simulator system restored to default state.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <span>Casino Administration Console</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Live Real-Time Tuning
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure game enablement, payouts, house edge, starting wallets, and inspect tamper-evident audit logs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetSystem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-900/60 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Factory Reset System</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Casino configuration saved and active immediately!</span>
        </div>
      )}

      {statusMessage && (
        <div className="p-3 bg-amber-950/80 border border-amber-800 rounded-xl text-xs text-amber-300">
          {statusMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
        {[
          { id: 'games', label: 'Game Tuning & Limits', icon: SlidersHorizontal },
          { id: 'economy', label: 'Economy & Bonuses', icon: Settings },
          { id: 'players', label: 'Player Management', icon: Users },
          { id: 'audit', label: 'Security Audit Logs', icon: FileText },
          { id: 'guide', label: 'Admin Documentation', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-amber-400 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Game Tuning & Limits */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['slots', 'blackjack', 'roulette', 'dice'] as GameType[]).map((gameKey) => {
              const game = editableConfig.games[gameKey];
              const gameName =
                gameKey === 'slots'
                  ? 'Slots (Golden Fortune)'
                  : gameKey === 'blackjack'
                  ? 'Blackjack (Royal Velvet)'
                  : gameKey === 'roulette'
                  ? 'Roulette (Monte Carlo)'
                  : 'Imperial Dice';

              return (
                <div key={gameKey} className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-200 text-sm">{gameName}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-slate-400">{game.enabled ? 'Enabled' : 'Disabled'}</span>
                      <input
                        type="checkbox"
                        checked={game.enabled}
                        onChange={(e) => {
                          setEditableConfig({
                            ...editableConfig,
                            games: {
                              ...editableConfig.games,
                              [gameKey]: { ...game, enabled: e.target.checked },
                            },
                          });
                        }}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Min Bet (Chips):</label>
                      <input
                        type="number"
                        min="1"
                        value={game.minBet}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setEditableConfig({
                            ...editableConfig,
                            games: {
                              ...editableConfig.games,
                              [gameKey]: { ...game, minBet: val },
                            },
                          });
                        }}
                        className="w-full p-2 bg-slate-950 rounded border border-slate-800 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Max Bet (Chips):</label>
                      <input
                        type="number"
                        min="10"
                        value={game.maxBet}
                        onChange={(e) => {
                          const val = Math.max(10, parseInt(e.target.value, 10) || 10);
                          setEditableConfig({
                            ...editableConfig,
                            games: {
                              ...editableConfig.games,
                              [gameKey]: { ...game, maxBet: val },
                            },
                          });
                        }}
                        className="w-full p-2 bg-slate-950 rounded border border-slate-800 text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs block mb-1">
                      Theoretical House Edge (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="15"
                      value={game.houseEdgePercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1.0;
                        setEditableConfig({
                          ...editableConfig,
                          games: {
                            ...editableConfig.games,
                            [gameKey]: { ...game, houseEdgePercent: val },
                          },
                        });
                      }}
                      className="w-full p-2 bg-slate-950 rounded border border-slate-800 text-slate-200 font-mono text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Special Payout Rules */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-3">
            <h4 className="font-semibold text-slate-200 text-sm">Special Payout Multipliers</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Blackjack Natural Payout:</label>
                <select
                  value={editableConfig.blackjackNaturalPayout}
                  onChange={(e) =>
                    setEditableConfig({
                      ...editableConfig,
                      blackjackNaturalPayout: parseFloat(e.target.value),
                    })
                  }
                  className="w-full p-2 bg-slate-950 rounded border border-slate-800 text-slate-200 text-xs"
                >
                  <option value={1.5}>3 to 2 (1.5x) - Traditional Vegas Rules</option>
                  <option value={1.2}>6 to 5 (1.2x) - Tight Strip Rules</option>
                  <option value={2.0}>2 to 1 (2.0x) - Promotional High Payout</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Slots Volatility Profile:</label>
                <select
                  value={editableConfig.slotRtpProfile}
                  onChange={(e) =>
                    setEditableConfig({
                      ...editableConfig,
                      slotRtpProfile: e.target.value as 'standard' | 'generous' | 'tight',
                    })
                  }
                  className="w-full p-2 bg-slate-950 rounded border border-slate-800 text-slate-200 text-xs"
                >
                  <option value="standard">Standard (96.5% Expected RTP)</option>
                  <option value="generous">Generous (98.0% Expected RTP)</option>
                  <option value="tight">Tight Casino (93.5% Expected RTP)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveConfig}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase rounded-xl tracking-wider cursor-pointer shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Apply Game Rules & Limits</span>
          </button>
        </div>
      )}

      {/* Tab 2: Economy & Bonuses */}
      {activeTab === 'economy' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h4 className="font-semibold text-slate-200 text-sm pb-2 border-b border-slate-800">
              Virtual Wallet & Faucet Settings
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">New Player Starting Balance (Chips):</label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={editableConfig.startingBalance}
                  onChange={(e) =>
                    setEditableConfig({
                      ...editableConfig,
                      startingBalance: parseInt(e.target.value, 10) || 5000,
                    })
                  }
                  className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Daily Bonus Faucet Amount (Chips):</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={editableConfig.dailyBonusAmount}
                  onChange={(e) =>
                    setEditableConfig({
                      ...editableConfig,
                      dailyBonusAmount: parseInt(e.target.value, 10) || 1000,
                    })
                  }
                  className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Daily Bonus Cooldown (Hours):</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={editableConfig.dailyBonusCooldownHours}
                  onChange={(e) =>
                    setEditableConfig({
                      ...editableConfig,
                      dailyBonusCooldownHours: parseInt(e.target.value, 10) || 24,
                    })
                  }
                  className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Max Peer Transfer Per Transaction:</label>
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={editableConfig.maxTransferAmount}
                  onChange={(e) =>
                    setEditableConfig({
                      ...editableConfig,
                      maxTransferAmount: parseInt(e.target.value, 10) || 10000,
                    })
                  }
                  className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={editableConfig.allowBalanceReset}
                  onChange={(e) =>
                    setEditableConfig({ ...editableConfig, allowBalanceReset: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-amber-500"
                />
                <span className="text-slate-300">
                  Allow players to self-reset their practice balance back to starting chips
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={editableConfig.peerTransfersEnabled}
                  onChange={(e) =>
                    setEditableConfig({ ...editableConfig, peerTransfersEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-amber-500"
                />
                <span className="text-slate-300">
                  Enable Peer-to-Peer virtual currency transfers between registered players
                </span>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveConfig}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase rounded-xl tracking-wider cursor-pointer shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Save Economy Settings</span>
          </button>
        </div>
      )}

      {/* Tab 3: Player Management */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Player</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Games</th>
                  <th className="p-3">Wagered</th>
                  <th className="p-3 text-right">Quick Grant / Freeze</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {players.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-100 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                        {p.username[0].toUpperCase()}
                      </div>
                      <span>{p.username}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400 tabular-nums">
                      {p.balance.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          p.isFrozen
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {p.isFrozen ? 'Frozen' : 'Active'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{p.stats?.gamesPlayed || 0}</td>
                    <td className="p-3 font-mono text-slate-400">
                      {(p.stats?.totalWagered || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleAdjustPlayer(p.id, 2500)}
                        className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/30 text-[11px] font-mono cursor-pointer"
                        title="Grant +2,500 chips"
                      >
                        +2.5K
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustPlayer(p.id, 10000)}
                        className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/30 text-[11px] font-mono cursor-pointer"
                        title="Grant +10,000 chips"
                      >
                        +10K
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFreeze(p)}
                        className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                          p.isFrozen
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}
                      >
                        {p.isFrozen ? 'Unfreeze' : 'Freeze'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Chronological Server Event & Audit Journal:</span>
            <button
              type="button"
              onClick={fetchLogs}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              Refresh Logs
            </button>
          </div>

          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 max-h-[480px] overflow-y-auto space-y-2">
            {isLoadingLogs ? (
              <div className="text-center py-8 text-slate-500 text-xs">Loading audit journal...</div>
            ) : auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                          log.actor === 'admin'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : log.actor === 'player'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {log.actor}
                      </span>
                      <span className="font-mono font-bold text-amber-400">{log.action}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{log.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">No audit logs recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Admin Documentation Guide */}
      {activeTab === 'guide' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-display text-base font-bold text-amber-400">
            Grand Royale Administrator Controls & Architecture
          </h4>
          <div className="space-y-3 divide-y divide-slate-800/60">
            <div className="pt-2">
              <strong className="text-slate-100 block mb-0.5">1. Dynamic Game Enablement & Limits</strong>
              <p className="text-slate-400">
                You can toggle any of the four games (Slots, Blackjack, Roulette, Dice) ON or OFF in real-time. If a game is disabled, the server will reject any bets and inform players. Min and max bets are enforced server-side before any round execution.
              </p>
            </div>
            <div className="pt-2">
              <strong className="text-slate-100 block mb-0.5">2. Virtual Currency Economy</strong>
              <p className="text-slate-400">
                All currency is 100% play money with zero real-world monetary value. Starting balances, daily bonus cooldowns, and peer transfer caps are customizable without writing code.
              </p>
            </div>
            <div className="pt-2">
              <strong className="text-slate-100 block mb-0.5">3. Server-Side Provably Fair Validation</strong>
              <p className="text-slate-400">
                Every game event is validated against player balances on the server. Nonces and SHA-256 seed hashes prevent duplicate payouts and replay vulnerabilities.
              </p>
            </div>
            <div className="pt-2">
              <strong className="text-slate-100 block mb-0.5">4. Tamper-Evident Security Journal</strong>
              <p className="text-slate-400">
                All administrative grants, rule alterations, and high-value player transfers are appended to the immutable chronological audit journal in the Security Audit Logs tab.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
