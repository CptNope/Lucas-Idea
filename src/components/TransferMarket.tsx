import React, { useState } from 'react';
import { Send, ArrowDownLeft, ArrowUpRight, Award, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { Player, CasinoConfig, Transaction } from '../types/casino.ts';
import { api } from '../services/api.ts';
import { sound } from '../services/sound.ts';

interface TransferMarketProps {
  currentPlayer: Player;
  allPlayers: Player[];
  config: CasinoConfig;
  onBalanceUpdate: (newBalance: number) => void;
  onRefreshPlayers: () => void;
}

export const TransferMarket: React.FC<TransferMarketProps> = ({
  currentPlayer,
  allPlayers,
  config,
  onBalanceUpdate,
  onRefreshPlayers,
}) => {
  const [recipientId, setRecipientId] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [memo, setMemo] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableRecipients = allPlayers.filter((p) => p.id !== currentPlayer.id);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;

    if (!recipientId) {
      setErrorMsg('Please select a recipient player');
      return;
    }
    if (amount <= 0 || isNaN(amount)) {
      setErrorMsg('Please enter a valid transfer amount');
      return;
    }
    if (amount > config.maxTransferAmount) {
      setErrorMsg(`Transfer exceeds the limit of ${config.maxTransferAmount} chips`);
      return;
    }
    if (currentPlayer.balance < amount) {
      setErrorMsg('Insufficient play-chips balance');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    sound.playChip();

    try {
      const resp = await api.transferChips(recipientId, amount, memo);
      setIsSending(false);
      onBalanceUpdate(resp.senderBalance);
      onRefreshPlayers();
      sound.playWin();

      setSuccessMsg(
        `Successfully transferred ${amount.toLocaleString()} chips to ${resp.recipientUsername}!`
      );
      setAmount(100);
      setMemo('');
    } catch (err: unknown) {
      setIsSending(false);
      setErrorMsg(err instanceof Error ? err.message : 'Transfer failed');
    }
  };

  if (!config.peerTransfersEnabled) {
    return (
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-8 text-center max-w-md mx-auto my-12 space-y-4">
        <Lock className="w-12 h-12 text-amber-500/60 mx-auto" />
        <h3 className="font-display text-lg font-bold text-slate-100">Transfers Currently Disabled</h3>
        <p className="text-xs text-slate-400">
          The casino administrator has temporarily locked peer-to-peer virtual currency transfers in system settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <span>Peer-to-Peer Transfer Hub</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Zero Real-World Value · Play Currency
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transfer virtual chips and inspect collectible achievement badges with full server ledger auditing.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Send Chips Form (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
            <Send className="w-4 h-4 text-amber-400" />
            <span>Send Virtual Chips</span>
          </h3>

          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select Recipient Player:</label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                required
              >
                <option value="">-- Choose recipient account --</option>
                {availableRecipients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.username} (Balance: {p.balance.toLocaleString()} chips)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Amount (Chips):</label>
                <span className="text-[11px] text-slate-400">
                  Limit: {config.maxTransferAmount.toLocaleString()} chips
                </span>
              </div>
              <input
                type="number"
                min="10"
                max={config.maxTransferAmount}
                step="10"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Transfer Memo / Note:</label>
              <input
                type="text"
                placeholder="e.g. Good luck in the blackjack room!"
                maxLength={60}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            {config.transferFeePercent > 0 && (
              <div className="text-xs text-amber-400/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                Administrative Transfer Fee: {config.transferFeePercent}% ({Math.floor((amount * config.transferFeePercent) / 100)} chips)
              </div>
            )}

            <button
              type="submit"
              disabled={isSending || currentPlayer.balance < amount || !recipientId}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display font-bold text-xs tracking-wide uppercase rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSending ? 'Processing Transfer...' : `TRANSFER ${amount.toLocaleString()} CHIPS`}
            </button>
          </form>
        </div>

        {/* Collectible Badges & Profiles Showcase (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Your Collectible Achievement Badges</span>
            </h3>

            {currentPlayer.badges && currentPlayer.badges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentPlayer.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg shrink-0">
                      ★
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{badge.name}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                Play games and hit big milestones to unlock collectible badges.
              </div>
            )}
          </div>

          {/* Active Network Players Directory */}
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-4 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">Active Network Players</span>
            <div className="divide-y divide-slate-800/60 text-xs">
              {allPlayers.map((p) => (
                <div key={p.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                      {p.username[0].toUpperCase()}
                    </div>
                    <span className="text-slate-300 font-medium">{p.username}</span>
                    {p.id === currentPlayer.id && (
                      <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {p.balance.toLocaleString()} chips
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
