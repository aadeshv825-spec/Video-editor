import { CreditTransaction, CreditTransactionType } from '../../types';

const LEDGER_STORAGE_KEY = 'ai_creative_studio_credit_ledger_v1';
const RESERVATIONS_STORAGE_KEY = 'ai_creative_studio_credit_reservations_v1';

export interface CreditReservation {
  id: string;
  jobId: string;
  userId: string;
  amount: number;
  reason: string;
  modelOrProvider?: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'settled' | 'released';
  settledTxId?: string;
  releaseReason?: string;
}

export interface ReserveCreditsParams {
  jobId: string;
  userId: string;
  amount: number;
  reason: string;
  modelOrProvider?: string;
  userTotalBalance: number;
  ttlMs?: number;
}

export interface ReserveCreditsResult {
  success: boolean;
  reservation?: CreditReservation;
  error?: string;
  availableCredits: number;
  reservedCredits: number;
  idempotent?: boolean;
}

export interface SettleReservationParams {
  jobId: string;
  userId: string;
  actualAmount?: number;
  reason?: string;
  modelOrProvider?: string;
  currentBalance: number;
}

export interface ReleaseReservationParams {
  jobId: string;
  reason: string;
}

const INITIAL_TRANSACTIONS: CreditTransaction[] = [
  {
    id: 'tx-init-01',
    userId: 'usr-owner-01',
    type: 'owner_grant',
    reason: 'Initial platform master allocation',
    creditsAdded: 5000,
    creditsConsumed: 0,
    timestamp: '2026-01-01T00:00:00.000Z',
    balanceAfter: 5000,
  },
  {
    id: 'tx-init-02',
    userId: 'usr-creator-02',
    type: 'pro_inclusion',
    reason: 'Monthly Pro subscription credit allocation',
    creditsAdded: 5000,
    creditsConsumed: 0,
    timestamp: '2026-09-01T00:00:00.000Z',
    balanceAfter: 5000,
  },
  {
    id: 'tx-init-03',
    userId: 'usr-creator-02',
    type: 'ai_usage',
    reason: 'AI Video Upscaling (4K Neural Enhancement)',
    creditsAdded: 0,
    creditsConsumed: 1200,
    timestamp: '2026-09-10T11:20:00.000Z',
    relatedJobId: 'job-upscale-884',
    modelOrProvider: 'Google Imagen 3 Video Upscaler',
    balanceAfter: 3800,
  },
  {
    id: 'tx-init-04',
    userId: 'usr-creator-02',
    type: 'ai_usage',
    reason: 'Spatial Audio Multi-Stem Voice Generation',
    creditsAdded: 0,
    creditsConsumed: 1350,
    timestamp: '2026-09-14T15:45:00.000Z',
    relatedJobId: 'job-audio-512',
    modelOrProvider: 'ElevenLabs Neural Synth v2.5',
    balanceAfter: 2450,
  },
  {
    id: 'tx-init-05',
    userId: 'usr-member-03',
    type: 'trial_grant',
    reason: 'Welcome bonus on Starter account activation',
    creditsAdded: 300,
    creditsConsumed: 0,
    timestamp: '2026-09-15T08:00:00.000Z',
    balanceAfter: 300,
  },
  {
    id: 'tx-init-06',
    userId: 'usr-member-03',
    type: 'ai_usage',
    reason: 'Photo Studio Object Inpainting',
    creditsAdded: 0,
    creditsConsumed: 150,
    timestamp: '2026-09-16T10:15:00.000Z',
    relatedJobId: 'job-photo-221',
    modelOrProvider: 'Flux 1.1 Pro Schnell',
    balanceAfter: 150,
  },
];

export class CreditLedgerService {
  public static getAllTransactions(): CreditTransaction[] {
    try {
      const saved = localStorage.getItem(LEDGER_STORAGE_KEY);
      if (saved) {
        const parsed: CreditTransaction[] = JSON.parse(saved);
        // Sanitize any legacy 100,000 demo transactions
        return parsed.map(tx => {
          if (tx.creditsAdded === 100000 || tx.balanceAfter === 100000) {
            return {
              ...tx,
              creditsAdded: tx.creditsAdded === 100000 ? 5000 : tx.creditsAdded,
              balanceAfter: tx.balanceAfter === 100000 ? 5000 : tx.balanceAfter,
            };
          }
          return tx;
        });
      }
    } catch (e) {
      console.warn('Failed to parse credit ledger', e);
    }
    return INITIAL_TRANSACTIONS;
  }

  public static getTransactionsForUser(userId: string): CreditTransaction[] {
    return this.getAllTransactions().filter(tx => tx.userId === userId);
  }

  public static getRealBalanceForUser(userId: string, defaultCredits?: number): number {
    const userTxs = this.getTransactionsForUser(userId);
    if (userTxs.length > 0) {
      return userTxs[0].balanceAfter;
    }
    return defaultCredits ?? 0;
  }

  public static recordTransaction(params: {
    userId: string;
    type: CreditTransactionType;
    reason: string;
    creditsAdded: number;
    creditsConsumed: number;
    relatedJobId?: string;
    modelOrProvider?: string;
    currentBalance: number;
  }): CreditTransaction {
    const newBalance = Math.max(0, params.currentBalance + params.creditsAdded - params.creditsConsumed);

    const tx: CreditTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      type: params.type,
      reason: params.reason,
      creditsAdded: params.creditsAdded,
      creditsConsumed: params.creditsConsumed,
      timestamp: new Date().toISOString(),
      relatedJobId: params.relatedJobId,
      modelOrProvider: params.modelOrProvider,
      balanceAfter: newBalance,
    };

    try {
      const all = this.getAllTransactions();
      const updated = [tx, ...all];
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('credit-ledger-updated', { detail: tx }));
      }
    } catch (e) {
      console.warn('Failed to persist transaction', e);
    }

    return tx;
  }

  public static refundFailedJob(params: {
    userId: string;
    amount: number;
    reason: string;
    relatedJobId?: string;
    currentBalance: number;
  }): CreditTransaction {
    return this.recordTransaction({
      userId: params.userId,
      type: 'refund_failed_job',
      reason: `Automated Refund: ${params.reason}`,
      creditsAdded: params.amount,
      creditsConsumed: 0,
      relatedJobId: params.relatedJobId,
      currentBalance: params.currentBalance,
    });
  }

  // ==========================================
  // ATOMIC CREDIT RESERVATION & CONCURRENCY
  // ==========================================

  public static getAllReservations(): CreditReservation[] {
    try {
      const saved = localStorage.getItem(RESERVATIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse credit reservations', e);
    }
    return [];
  }

  private static saveReservations(reservations: CreditReservation[]): void {
    try {
      // Keep most recent 500 reservations
      localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(reservations.slice(0, 500)));
    } catch (e) {
      console.warn('Failed to persist credit reservations', e);
    }
  }

  /**
   * Sweeps and auto-releases any reservation that has passed its expiresAt TTL.
   * Guarantees that stalled, crashed, or disconnected jobs NEVER leave user credits locked.
   */
  public static cleanupExpiredReservations(): number {
    const all = this.getAllReservations();
    const now = Date.now();
    let cleanedCount = 0;

    const updated = all.map(r => {
      if (r.status === 'active' && new Date(r.expiresAt).getTime() <= now) {
        cleanedCount++;
        return {
          ...r,
          status: 'released' as const,
          releaseReason: 'Auto-released: reservation expired / watchdog timeout (safeguard)',
        };
      }
      return r;
    });

    if (cleanedCount > 0) {
      this.saveReservations(updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('credit-reservation-updated', { detail: { cleanedCount } }));
      }
    }
    return cleanedCount;
  }

  /**
   * Returns active non-expired reservations for a user.
   */
  public static getActiveReservationsForUser(userId: string): CreditReservation[] {
    this.cleanupExpiredReservations();
    return this.getAllReservations().filter(
      r => r.userId === userId && r.status === 'active'
    );
  }

  /**
   * Sums all credits currently reserved and in-flight for a user.
   */
  public static getTotalReservedCreditsForUser(userId: string): number {
    return this.getActiveReservationsForUser(userId).reduce((sum, r) => sum + r.amount, 0);
  }

  /**
   * True available credits = Total Balance - Active In-Flight Reservations.
   */
  public static getAvailableBalanceForUser(userId: string, totalBalance: number): number {
    const reserved = this.getTotalReservedCreditsForUser(userId);
    return Math.max(0, totalBalance - reserved);
  }

  /**
   * Atomically reserves VYRO credits BEFORE external AI dispatch.
   * Enforces:
   * 1. Idempotency by jobId (same job cannot reserve twice).
   * 2. Multiple concurrent requests cannot spend the same credits.
   * 3. Cannot start if available balance (total - reserved) is insufficient.
   */
  public static reserveCredits(params: ReserveCreditsParams): ReserveCreditsResult {
    this.cleanupExpiredReservations();

    const all = this.getAllReservations();
    const existing = all.find(r => r.jobId === params.jobId);

    const currentReserved = this.getTotalReservedCreditsForUser(params.userId);
    const available = Math.max(0, params.userTotalBalance - currentReserved);

    // Idempotency: check if already registered
    if (existing) {
      if (existing.status === 'active') {
        return {
          success: true,
          reservation: existing,
          availableCredits: available,
          reservedCredits: currentReserved,
          idempotent: true,
        };
      }
      if (existing.status === 'settled') {
        return {
          success: false,
          error: `Job '${params.jobId}' has already completed and settled. Duplicate reservation prevented.`,
          availableCredits: available,
          reservedCredits: currentReserved,
        };
      }
    }

    // Availability preflight check
    if (available < params.amount) {
      return {
        success: false,
        error: `Insufficient available credits. (Required: ${params.amount}, Available: ${available}, In-flight reserved: ${currentReserved})`,
        availableCredits: available,
        reservedCredits: currentReserved,
      };
    }

    const ttl = params.ttlMs || 180000; // 3-minute default TTL
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + ttl).toISOString();

    const reservation: CreditReservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      jobId: params.jobId,
      userId: params.userId,
      amount: params.amount,
      reason: params.reason,
      modelOrProvider: params.modelOrProvider,
      createdAt: nowIso,
      expiresAt,
      status: 'active',
    };

    const updated = [reservation, ...all];
    this.saveReservations(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('credit-reservation-updated', { detail: reservation }));
    }

    return {
      success: true,
      reservation,
      availableCredits: available - params.amount,
      reservedCredits: currentReserved + params.amount,
    };
  }

  /**
   * Settles a reserved job on confirmed execution success.
   * Converts the temporary reservation into a permanent settled transaction.
   * Guarantees EXACTLY-ONCE charging.
   */
  public static settleReservation(params: SettleReservationParams): {
    success: boolean;
    transaction?: CreditTransaction;
    error?: string;
    idempotent?: boolean;
  } {
    const all = this.getAllReservations();
    const idx = all.findIndex(r => r.jobId === params.jobId);

    if (idx >= 0 && all[idx].status === 'settled') {
      return { success: true, idempotent: true };
    }

    if (idx < 0 || all[idx].status !== 'active') {
      return {
        success: false,
        error: `Cannot settle reservation for job '${params.jobId}'. No active reservation found.`,
      };
    }

    const targetReservation = all[idx];
    const amount = params.actualAmount ?? targetReservation.amount;

    // Record authoritative ledger transaction
    const tx = this.recordTransaction({
      userId: params.userId,
      type: 'ai_usage',
      reason: params.reason || targetReservation.reason,
      creditsAdded: 0,
      creditsConsumed: amount,
      relatedJobId: params.jobId,
      modelOrProvider: params.modelOrProvider || targetReservation.modelOrProvider,
      currentBalance: params.currentBalance,
    });

    all[idx] = {
      ...targetReservation,
      status: 'settled',
      settledTxId: tx.id,
    };

    this.saveReservations(all);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('credit-reservation-updated', { detail: all[idx] }));
    }

    return { success: true, transaction: tx };
  }

  /**
   * Releases a reservation on confirmed job failure or cancellation.
   * Unlocks the user's credits immediately.
   * Guarantees EXACTLY-ONCE release.
   */
  public static releaseReservation(params: ReleaseReservationParams): {
    success: boolean;
    releasedAmount: number;
    error?: string;
  } {
    const all = this.getAllReservations();
    const idx = all.findIndex(r => r.jobId === params.jobId);

    if (idx < 0 || all[idx].status !== 'active') {
      // Idempotent: already released or doesn't exist
      return { success: false, releasedAmount: 0 };
    }

    const releasedAmount = all[idx].amount;
    all[idx] = {
      ...all[idx],
      status: 'released',
      releaseReason: params.reason,
    };

    this.saveReservations(all);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('credit-reservation-updated', { detail: all[idx] }));
    }

    return { success: true, releasedAmount };
  }
}

// Background auto-cleanup watchdog (runs every 10 seconds in browser environment)
if (typeof window !== 'undefined') {
  setInterval(() => {
    try {
      CreditLedgerService.cleanupExpiredReservations();
    } catch {
      // safe fallback
    }
  }, 10000);
}
