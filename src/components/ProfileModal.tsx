import React, { useState, useEffect } from 'react';
import { X, User, Trophy, History, RefreshCw, PlusCircle, CheckCircle, ArrowRight } from 'lucide-react';
import type { Player, Transaction } from '../types/casino.ts';
import { api } from '../services/api.ts';
import { sound } from '../services/sound.ts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player;
  allPlayers: Player[];
  onPlayerSwitched: (player: Player) => void;
  onRefreshState: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  allPlayers,
  onPlayerSwitched,
  onRefreshState,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'switch' | 'create' | 'ledger'>('stats');
  const [newUsername, setNewUsername] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'ledger') {
      setIsLoadingTx(true);
      api
        .getTransactions(currentPlayer.id)
        .then((resp) => setTransactions(resp.transactions))
        .catch(() => {})
        .finally(() => setIsLoadingTx(false));
    }
  }, [isOpen, activeTab, currentPlayer.id]);

  if (!isOpen) return null;

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    sound.playChip();
    try {
      const resp = await api.createPlayer(newUsername.trim());
      onPlayerSwitched(resp.player);
      onRefreshState();
      setNewUsername('');
      setActiveTab('stats');
      setMsg(`Welcome, ${resp.player.username}!`);
      setTimeout(() => setMsg(null), 2500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Create profile failed');
    }
  };

  const handleSwitch = async (playerId: string) => {
    sound.playChip();
    try {
      const resp = await api.switchPlayer(playerId);
      onPlayerSwitched(resp.activePlayer);
      onRefreshState();
      setActiveTab('stats');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Switch profile failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e1218] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-base shadow">
              {currentPlayer.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-100 text-base flex items-center gap-2">
                <span>{currentPlayer.username}</span>
                {currentPlayer.isFrozen && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    FROZEN
                  </span>
                )}
              </h3>
              <span className="font-mono text-xs font-bold text-amber-400">
                {currentPlayer.balance.toLocaleString()} Chips
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 px-4 pt-2 border-b border-slate-800 text-xs">
          {[
            { id: 'stats', label: 'Lifetime Stats', icon: Trophy },
            { id: 'ledger', label: 'Transaction Ledger', icon: History },
            { id: 'switch', label: 'Switch Account', icon: User },
            { id: 'create', label: 'New Account', icon: PlusCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'text-amber-400 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {msg && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-lg">
              {msg}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Games Played</span>
                  <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
                    {currentPlayer.stats?.gamesPlayed || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Total Wagered</span>
                  <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
                    {(currentPlayer.stats?.totalWagered || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Total Won</span>
                  <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                    {(currentPlayer.stats?.totalWon || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Net Profit</span>
                  <span
                    className={`font-mono text-base font-bold tabular-nums ${
                      (currentPlayer.stats?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(currentPlayer.stats?.netProfit || 0) >= 0 ? '+' : ''}
                    {(currentPlayer.stats?.netProfit || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Biggest Win</span>
                  <span className="font-mono text-base font-bold text-amber-400 tabular-nums">
                    {(currentPlayer.stats?.biggestWin || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Win Streak</span>
                  <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
                    {currentPlayer.stats?.streak || 0}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-300 block">Earned Achievement Badges</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPlayer.badges?.map((b) => (
                    <div key={b.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                        ★
                      </div>
                      <div>
                        <span className="font-bold text-slate-200 block leading-tight">{b.name}</span>
                        <span className="text-[10px] text-slate-400 block leading-tight">{b.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ledger Tab */}
          {activeTab === 'ledger' && (
            <div className="space-y-2">
              <span className="text-xs text-slate-400 block">Recent Wagers, Payouts, and Bonus Credits:</span>
              <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1">
                {isLoadingTx ? (
                  <div className="text-center py-6 text-slate-500 text-xs">Loading ledger...</div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                              tx.type === 'win'
                                ? 'bg-emerald-950 text-emerald-300'
                                : tx.type === 'loss'
                                ? 'bg-rose-950 text-rose-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {tx.type}
                          </span>
                          <span className="font-semibold text-slate-200">{tx.note}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-bold block tabular-nums ${
                            tx.amount > 0
                              ? 'text-emerald-400'
                              : tx.amount < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {tx.amount > 0 ? '+' : ''}
                          {tx.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          Bal: {tx.balanceAfter.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">No transactions recorded yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Switch Tab */}
          {activeTab === 'switch' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 block">Select a registered profile to load its wallet:</span>
              <div className="space-y-2">
                {allPlayers.map((p) => {
                  const isCurrent = p.id === currentPlayer.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => handleSwitch(p.id)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                          : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs">
                          {p.username[0].toUpperCase()}
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-xs block">{p.username}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {p.balance.toLocaleString()} chips
                          </span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="text-[11px] font-mono font-bold text-amber-400">ACTIVE</span>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <span>Switch</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Create Tab */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreatePlayer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Enter New Player Alias:
                </label>
                <input
                  type="text"
                  placeholder="e.g. VegasViper, LuckySpin99"
                  maxLength={20}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-400">
                New accounts automatically receive initial starting play-money chips to experiment with casino games and strategies.
              </p>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wide rounded-xl shadow-md cursor-pointer"
              >
                CREATE PROFILE
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
