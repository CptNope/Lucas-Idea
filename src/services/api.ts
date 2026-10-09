import type {
  CasinoConfig,
  Player,
  Transaction,
  AuditLogEntry,
  SlotSpinResult,
  BlackjackState,
  RouletteBetItem,
  RouletteSpinResult,
  MultiplierDiceResult,
  CrapsDiceResult,
  SimulationResult,
  BettingStrategy,
  GameType
} from '../types/casino.ts';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data as T;
  }

  // State & Config
  public async getState(): Promise<{
    config: CasinoConfig;
    activePlayer: Player;
    playersList: Player[];
    serverSeedHash: string;
    nonce: number;
  }> {
    return this.request('/api/state');
  }

  public async updateConfig(newConfig: Partial<CasinoConfig>): Promise<{ success: boolean; config: CasinoConfig }> {
    return this.request('/api/admin/config', {
      method: 'POST',
      body: JSON.stringify(newConfig),
    });
  }

  // Players & Wallet
  public async getPlayers(): Promise<{ players: Player[]; activePlayerId: string }> {
    return this.request('/api/players');
  }

  public async switchPlayer(playerId: string): Promise<{ success: boolean; activePlayer: Player }> {
    return this.request('/api/players/switch', {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
  }

  public async createPlayer(username: string, avatar?: string): Promise<{ success: boolean; player: Player }> {
    return this.request('/api/players/create', {
      method: 'POST',
      body: JSON.stringify({ username, avatar }),
    });
  }

  public async claimDailyBonus(): Promise<{
    success: boolean;
    bonusAmount: number;
    balance: number;
    nextAvailable: number;
  }> {
    return this.request('/api/wallet/claim-daily', {
      method: 'POST',
    });
  }

  public async resetPracticeBalance(): Promise<{ success: boolean; balance: number }> {
    return this.request('/api/wallet/reset-practice', {
      method: 'POST',
    });
  }

  public async transferChips(
    recipientId: string,
    amount: number,
    memo?: string
  ): Promise<{
    success: boolean;
    senderBalance: number;
    transferred: number;
    fee: number;
    recipientUsername: string;
  }> {
    return this.request('/api/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify({ recipientId, amount, memo }),
    });
  }

  public async getTransactions(playerId: string): Promise<{ transactions: Transaction[] }> {
    return this.request(`/api/wallet/transactions/${playerId}`);
  }

  // Admin controls
  public async adjustPlayer(
    playerId: string,
    payload: { balanceAdjustment?: number; setBalance?: number; toggleFreeze?: boolean }
  ): Promise<{ success: boolean; player: Player }> {
    return this.request(`/api/admin/players/${playerId}/adjust`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getAuditLogs(): Promise<{ logs: AuditLogEntry[] }> {
    return this.request('/api/admin/audit-logs');
  }

  public async resetSystem(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/admin/reset-system', {
      method: 'POST',
    });
  }

  // Games
  public async spinSlots(
    betPerLine: number,
    activeLines: number
  ): Promise<{ success: boolean; result: SlotSpinResult; balance: number }> {
    return this.request('/api/games/slots/spin', {
      method: 'POST',
      body: JSON.stringify({ betPerLine, activeLines }),
    });
  }

  public async dealBlackjack(bet: number): Promise<{ success: boolean; hand: BlackjackState; balance: number }> {
    return this.request('/api/games/blackjack/deal', {
      method: 'POST',
      body: JSON.stringify({ bet }),
    });
  }

  public async actionBlackjack(
    handId: string,
    action: 'hit' | 'stand' | 'double'
  ): Promise<{ success: boolean; hand: BlackjackState; balance: number }> {
    return this.request('/api/games/blackjack/action', {
      method: 'POST',
      body: JSON.stringify({ handId, action }),
    });
  }

  public async spinRoulette(
    bets: RouletteBetItem[]
  ): Promise<{ success: boolean; result: RouletteSpinResult; balance: number }> {
    return this.request('/api/games/roulette/spin', {
      method: 'POST',
      body: JSON.stringify({ bets }),
    });
  }

  public async rollMultiplierDice(
    bet: number,
    target: number,
    condition: 'over' | 'under'
  ): Promise<{ success: boolean; mode: 'multiplier'; result: MultiplierDiceResult; balance: number }> {
    return this.request('/api/games/dice/roll', {
      method: 'POST',
      body: JSON.stringify({ mode: 'multiplier', bet, target, condition }),
    });
  }

  public async rollCrapsDice(
    bet: number,
    crapsBetType: 'pass' | 'dont_pass' | 'field' | 'craps_seven'
  ): Promise<{ success: boolean; mode: 'craps'; result: CrapsDiceResult; balance: number }> {
    return this.request('/api/games/dice/roll', {
      method: 'POST',
      body: JSON.stringify({ mode: 'craps', bet, crapsBetType }),
    });
  }

  // Experiment Simulation
  public async runExperiment(params: {
    game: GameType;
    strategy: BettingStrategy;
    initialBankroll: number;
    baseBet: number;
    roundsCount: number;
    maxBet: number;
  }): Promise<{ success: boolean; result: SimulationResult }> {
    return this.request('/api/experiment/simulate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export const api = new ApiService();
