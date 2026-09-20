import { CreditTransaction, CreditTransactionType } from '../../types';

const LEDGER_STORAGE_KEY = 'ai_creative_studio_credit_ledger_v1';

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
      window.dispatchEvent(new CustomEvent('credit-ledger-updated', { detail: tx }));
    } catch (e) {
      console.warn('Failed to persist transaction', e);
    }

    return tx;
  }
}
