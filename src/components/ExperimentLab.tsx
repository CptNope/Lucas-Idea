import React, { useState } from 'react';
import { Play, RotateCcw, TrendingUp, TrendingDown, Info, AlertTriangle, ShieldCheck, BarChart3 } from 'lucide-react';
import type { GameType, BettingStrategy, SimulationResult } from '../types/casino.ts';
import { api } from '../services/api.ts';
import { sound } from '../services/sound.ts';

const STRATEGY_DETAILS: Record<BettingStrategy, { name: string; tag: string; description: string; risk: string }> = {
  flat: {
    name: 'Flat Betting (Control)',
    tag: 'Low Variance',
    description: 'Wagers the exact same base amount on every single round regardless of outcome.',
    risk: 'Steadiest bankroll trajectory; observed RTP matches theoretical math closely without blow-up risk.',
  },
  martingale: {
    name: 'Martingale System',
    tag: 'Extreme Tail Risk',
    description: 'Doubles the wager after each loss to recover previous losses with a single win.',
    risk: 'High win rate in short sessions, but hits table bet limits or sudden total bankroll liquidation during losing streaks.',
  },
  paroli: {
    name: 'Paroli (Reverse Martingale)',
    tag: 'Positive Progression',
    description: 'Doubles the bet after each win to capitalize on winning runs while resetting to base on any loss.',
    risk: 'Protects downside by risking primarily house profit during hot streaks, with limited maximum loss.',
  },
  dalembert: {
    name: "D'Alembert System",
    tag: 'Moderate Progression',
    description: 'Increases wager by 1 base unit after a loss and decreases by 1 unit after a win.',
    risk: 'Assumes equilibrium where wins and losses balance out, slower bankroll swing than Martingale.',
  },
  fibonacci: {
    name: 'Fibonacci Progression',
    tag: 'Sequence Based',
    description: 'Follows 1, 1, 2, 3, 5, 8, 13... Move 1 step forward on loss, 2 steps back on win.',
    risk: 'Less aggressive than Martingale doubling, but protracted losing sequences still escalate stakes.',
  },
};

export const ExperimentLab: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>('roulette');
  const [selectedStrategy, setSelectedStrategy] = useState<BettingStrategy>('martingale');
  const [initialBankroll, setInitialBankroll] = useState(5000);
  const [baseBet, setBaseBet] = useState(50);
  const [maxBet, setMaxBet] = useState(5000);
  const [roundsCount, setRoundsCount] = useState(100);

  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setErrorMsg(null);
    sound.playChip();

    try {
      const resp = await api.runExperiment({
        game: selectedGame,
        strategy: selectedStrategy,
        initialBankroll,
        baseBet,
        roundsCount,
        maxBet,
      });

      setSimulationResult(resp.result);
      setIsRunning(false);
      sound.playWin();
    } catch (err: unknown) {
      setIsRunning(false);
      setErrorMsg(err instanceof Error ? err.message : 'Simulation failed');
    }
  };

  // Trajectory Chart rendering helper
  const renderTrajectorySVG = (result: SimulationResult) => {
    const history = result.history;
    if (history.length < 2) return null;

    const width = 800;
    const height = 260;
    const padding = 35;

    const balances = history.map((h) => h.balance);
    const minVal = Math.min(0, ...balances);
    const maxVal = Math.max(result.initialBankroll * 1.5, ...balances);

    const getX = (idx: number) => padding + (idx / (history.length - 1)) * (width - 2 * padding);
    const getY = (val: number) =>
      height - padding - ((val - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);

    const points = history.map((h, i) => `${getX(i)},${getY(h.balance)}`).join(' ');
    const zeroY = getY(0);
    const initialY = getY(result.initialBankroll);

    return (
      <div className="relative w-full overflow-hidden bg-slate-950 rounded-xl p-2 border border-slate-800">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 sm:h-64">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={initialY} x2={width - padding} y2={initialY} stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
          <text x={width - padding + 5} y={initialY + 4} fill="#94a3b8" fontSize="10" fontFamily="monospace">
            Start ({result.initialBankroll})
          </text>

          {minVal <= 0 && (
            <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#ef4444" strokeWidth="1.5" />
          )}

          {/* Trajectory Area and Line */}
          <polygon
            points={`${getX(0)},${getY(minVal)} ${points} ${getX(history.length - 1)},${getY(minVal)}`}
            fill="url(#chartGradient)"
          />
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Start and End nodes */}
          <circle cx={getX(0)} cy={getY(result.initialBankroll)} r="4" fill="#38bdf8" />
          <circle
            cx={getX(history.length - 1)}
            cy={getY(result.finalBankroll)}
            r="5"
            fill={result.finalBankroll >= result.initialBankroll ? '#10b981' : '#f43f5e'}
          />
        </svg>

        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 px-3 pt-1">
          <span>Round 0</span>
          <span>Round {Math.floor(history.length / 2)}</span>
          <span>Round {history.length - 1}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <span>Casino Experiment Lab</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Monte Carlo Strategy Analytics
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test mathematical betting systems across thousands of simulated rounds with transparent statistical auditing.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Simulator Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Setup Parameters (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Simulation Configuration</span>
          </h3>

          {/* Strategy Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Betting Strategy:</label>
            <div className="space-y-1.5">
              {(Object.keys(STRATEGY_DETAILS) as BettingStrategy[]).map((strat) => {
                const info = STRATEGY_DETAILS[strat];
                const isSelected = selectedStrategy === strat;
                return (
                  <button
                    key={strat}
                    type="button"
                    onClick={() => setSelectedStrategy(strat)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-slate-100 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{info.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                        {info.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{info.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Game Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Target Game Engine:</label>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value as GameType)}
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="roulette">Roulette (European Even-Money, 48.65% Win)</option>
              <option value="blackjack">Blackjack (Optimal Basic Strategy, 49.50% Win)</option>
              <option value="dice">Dice Arena (Over/Under 50/50, 49.50% Win)</option>
              <option value="slots">Slots Machine (Volatile Payouts, 32.00% Hit Rate)</option>
            </select>
          </div>

          {/* Numeric Parameters */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Starting Bankroll:</label>
              <input
                type="number"
                min="500"
                max="50000"
                step="500"
                value={initialBankroll}
                onChange={(e) => setInitialBankroll(parseInt(e.target.value, 10) || 1000)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-400 font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Base Bet Size:</label>
              <input
                type="number"
                min="10"
                max="1000"
                step="10"
                value={baseBet}
                onChange={(e) => setBaseBet(parseInt(e.target.value, 10) || 50)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Rounds Count:</label>
              <select
                value={roundsCount}
                onChange={(e) => setRoundsCount(parseInt(e.target.value, 10))}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
              >
                <option value={50}>50 Rounds (Fast)</option>
                <option value={100}>100 Rounds (Standard)</option>
                <option value={250}>250 Rounds (Stress Test)</option>
                <option value={500}>500 Rounds (Deep)</option>
                <option value={1000}>1,000 Rounds (Extensive)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Table Bet Limit:</label>
              <input
                type="number"
                min="500"
                max="50000"
                step="500"
                value={maxBet}
                onChange={(e) => setMaxBet(parseInt(e.target.value, 10) || 5000)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono font-bold"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isRunning}
            onClick={handleRunSimulation}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display font-bold text-sm tracking-wide uppercase rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Simulating Rounds...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>RUN SIMULATION ({roundsCount} ROUNDS)</span>
              </>
            )}
          </button>
        </div>

        {/* Results Analytics Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {simulationResult ? (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h4 className="font-semibold text-slate-100 text-base">
                    {STRATEGY_DETAILS[simulationResult.strategy].name} Outcomes
                  </h4>
                  <span className="text-xs text-slate-400">
                    Tested on {simulationResult.game.toUpperCase()} across {simulationResult.roundsCount} rounds
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Final Bankroll</span>
                  <span
                    className={`font-mono text-xl font-bold tabular-nums ${
                      simulationResult.finalBankroll >= simulationResult.initialBankroll
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {simulationResult.finalBankroll.toLocaleString()} chips
                  </span>
                </div>
              </div>

              {/* Trajectory Curve Chart */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  Bankroll Trajectory Over Time
                </span>
                {renderTrajectorySVG(simulationResult)}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Win Rate</span>
                  <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
                    {simulationResult.winRatePercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {simulationResult.wins}W / {simulationResult.losses}L
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Observed RTP</span>
                  <span
                    className={`font-mono text-base font-bold tabular-nums ${
                      simulationResult.observedRtpPercent >= 100 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {simulationResult.observedRtpPercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Return to player</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Max Drawdown</span>
                  <span className="font-mono text-base font-bold text-rose-400 tabular-nums">
                    -{simulationResult.maxDrawdownPercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Peak-to-trough decline</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Streaks (W / L)</span>
                  <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
                    {simulationResult.longestWinStreak} / {simulationResult.longestLossStreak}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Max consecutive</span>
                </div>
              </div>

              {/* Busted Notice or Conclusion */}
              {simulationResult.bustedAtRound !== null ? (
                <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Account Liquidated at Round {simulationResult.bustedAtRound}</span>
                    <span className="text-slate-300">
                      Progression escalating bet sizes exceeded total bankroll, resulting in complete depletion.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200 block">Statistical Analysis</span>
                    <span className="text-slate-400">
                      Total Wagered: {simulationResult.totalWagered.toLocaleString()} chips · Total Paid:{' '}
                      {simulationResult.totalWon.toLocaleString()} chips.
                      Net Result:{' '}
                      <strong className={simulationResult.finalBankroll >= simulationResult.initialBankroll ? 'text-emerald-400' : 'text-rose-400'}>
                        {simulationResult.finalBankroll - simulationResult.initialBankroll > 0 ? '+' : ''}
                        {simulationResult.finalBankroll - simulationResult.initialBankroll} chips
                      </strong>.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 text-center text-slate-400 space-y-3">
              <BarChart3 className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="font-semibold text-slate-300 text-sm">Ready to Simulate</h4>
              <p className="text-xs max-w-sm mx-auto">
                Configure your strategy and bankroll on the left, then click <strong>Run Simulation</strong> to compute hundreds of rounds with complete trajectory charts.
              </p>
            </div>
          )}

          {/* Educational Mathematical Truth Box */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800/70 p-4 text-xs text-slate-400 space-y-2">
            <h5 className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mathematical Invariance: The Law of House Edge</span>
            </h5>
            <p className="leading-relaxed">
              No betting progression (Martingale, Fibonacci, Paroli) changes the underlying mathematical expectation of a casino game. Betting systems only change the <em>distribution of risk</em>—trading higher frequency of small wins for rare, catastrophic liquidation events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
