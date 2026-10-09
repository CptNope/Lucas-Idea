import React from 'react';
import { ShieldCheck, Info, HelpCircle, Lock, Cpu, Sparkles } from 'lucide-react';

export const RulesSection: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Play Money Legal Disclosure Banner */}
      <div className="p-5 bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 border border-amber-600/40 rounded-2xl flex items-start gap-4">
        <Info className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
        <div className="space-y-1 text-xs">
          <h3 className="font-display text-sm font-bold text-amber-300 uppercase tracking-wider">
            Educational Play-Money Simulation Notice
          </h3>
          <p className="text-slate-300 leading-relaxed">
            Grand Royale is strictly an entertainment and mathematical strategy simulation. All chips, balances, and bonuses consist exclusively of <strong>virtual play currency with zero real-world monetary value</strong>.
            This application provides NO deposit mechanisms, NO real-money withdrawals, and NO cash redemptions under any circumstances.
          </p>
        </div>
      </div>

      {/* Rules Breakdown by Game */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slots */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
          <h4 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Golden Fortune Slots</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
              RTP ~96.5%
            </span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            A traditional 3-reel, 5-payline mechanical slot machine. Players choose an active bet per line and activate 1 to 5 paylines (Top, Center, Bottom, Diagonal Down, Diagonal Up).
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li><strong>Wild Crown:</strong> Substitutes for any symbol on payline; 3x pays 150x line bet.</li>
            <li><strong>Lucky 7s:</strong> 3x pays 60x line bet.</li>
            <li><strong>Diamonds:</strong> 3x pays 30x line bet.</li>
            <li><strong>Bells & Bars:</strong> Pay 18x and 10x line bet respectively.</li>
            <li><strong>Cherries:</strong> 3x pays 6x; 2x left-to-right pays 2x line bet.</li>
          </ul>
        </div>

        {/* Blackjack */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
          <h4 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Royal Velvet Blackjack</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              RTP ~99.5%
            </span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Follows standard Vegas / European casino card regulations:
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>Dealer must draw cards to 16 and stand on all 17s (both soft and hard).</li>
            <li><strong>Natural Blackjack:</strong> An initial two-card 21 (Ace + 10/Face card) pays 3 to 2 (1.5x wager profit).</li>
            <li><strong>Double Down:</strong> Available on the first two dealt cards. Doubles your wager and delivers exactly one additional card before standing.</li>
            <li><strong>Ties (Push):</strong> Player and dealer tying scores result in a full wager refund.</li>
          </ul>
        </div>

        {/* European Roulette */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
          <h4 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
            <span>European Roulette</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              House Edge 2.70%
            </span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            A 37-pocket wheel featuring a single green zero (0) and numbers 1 through 36:
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li><strong>Straight Up (Single Number):</strong> Pays 35 to 1.</li>
            <li><strong>Dozens & Columns:</strong> Cover 12 numbers; pay 2 to 1.</li>
            <li><strong>Even-Money Bets:</strong> Red/Black, Even/Odd, 1-18/19-36 pay 1 to 1.</li>
            <li><strong>Zero Rule:</strong> When zero hits, all outside even-money and column bets lose.</li>
          </ul>
        </div>

        {/* Imperial Dice */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
          <h4 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Imperial Dice Arena</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
              Transparent Multiplier Math
            </span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Offers two distinct simulation formats:
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>
              <strong>Multiplier Slider:</strong> Player sets a target (2-98) and condition (Over/Under). Multiplier is calculated dynamically as <code>(100 - House Edge) / Win Chance</code>.
            </li>
            <li>
              <strong>Casino Craps:</strong> Standard two-dice tabletop offering Pass Line (1:1), Don&apos;t Pass (1:1), Field Bet (2:1 on 2, 3:1 on 12), and Any Seven (4:1).
            </li>
          </ul>
        </div>
      </div>

      {/* Fairness & Anti-Manipulation Pledge */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-3">
        <h4 className="font-display text-base font-bold text-amber-400 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Provably Fair & Anti-Manipulation Architecture</span>
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          The Grand Royale Casino simulator operates on strict integrity principles:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-slate-200 block mb-1">Zero Secret Odds Manipulation</strong>
            <p className="text-slate-400">
              Odds and payout formulas are universal across all players. The system never adjusts RNG algorithms based on winning streaks, losing streaks, or player balances.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-slate-200 block mb-1">Server-Authoritative State</strong>
            <p className="text-slate-400">
              All bets, deals, and payouts are calculated exclusively by the Node/Express backend. Client code cannot inject artificial wins or tamper with game states.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-slate-200 block mb-1">Immutable Audit Journal</strong>
            <p className="text-slate-400">
              Every bet, win, administrative adjustment, and peer transfer is permanently logged with timestamps and verification nonces in the server ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
