/**
 * Provider Cost Ledger Service
 *
 * INTERNAL OWNER-ONLY LEDGER.
 * Completely separate from the user-facing CreditLedger.
 * Tracks estimated and actual third-party API provider costs (USD),
 * request reconciliation, job IDs, and refund statuses.
 * NEVER exposed to normal users.
 */

export interface ProviderCostRecord {
  id: string;
  requestId: string;
  providerJobId?: string;
  provider: 'google' | 'runway' | 'openai' | 'flux' | 'elevenlabs' | 'anthropic' | 'stability' | 'local' | string;
  model: string;
  operation: string;
  userId: string;
  userEmail?: string;
  projectId?: string;
  estimatedProviderCostUsd: number;
  actualProviderCostUsd?: number;
  vyroCreditsCharged: number;
  timestamp: string;
  status: 'reserved' | 'completed' | 'failed' | 'refunded' | 'blocked_by_limit';
  failureReason?: string;
  refunded: boolean;
  durationSec?: number;
  resolution?: string;
}

export interface ProviderAggregates {
  provider: string;
  jobsCount: number;
  successfulJobs: number;
  failedJobs: number;
  refundedJobs: number;
  creditsConsumed: number;
  estimatedCostUsd: number;
  actualCostUsd: number;
  dailySpendUsd: number;
  monthlySpendUsd: number;
}

const STORAGE_KEY = 'vyro_internal_provider_cost_ledger_v1';

export class ProviderCostLedgerService {
  private static getRecords(): ProviderCostRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse provider cost ledger', e);
    }
    return [];
  }

  private static saveRecords(records: ProviderCostRecord[]): void {
    try {
      // Keep last 1000 records
      const trimmed = records.slice(0, 1000);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save provider cost ledger', e);
    }
  }

  public static getAllRecords(): ProviderCostRecord[] {
    return this.getRecords();
  }

  /**
   * Pre-execution reservation
   */
  public static recordReservation(params: {
    requestId: string;
    provider: string;
    model: string;
    operation: string;
    userId: string;
    userEmail?: string;
    projectId?: string;
    estimatedCostUsd: number;
    vyroCredits: number;
    durationSec?: number;
    resolution?: string;
  }): ProviderCostRecord {
    const record: ProviderCostRecord = {
      id: `pcl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      requestId: params.requestId,
      provider: params.provider,
      model: params.model,
      operation: params.operation,
      userId: params.userId,
      userEmail: params.userEmail,
      projectId: params.projectId,
      estimatedProviderCostUsd: Number(params.estimatedCostUsd.toFixed(4)),
      vyroCreditsCharged: params.vyroCredits,
      timestamp: new Date().toISOString(),
      status: 'reserved',
      refunded: false,
      durationSec: params.durationSec,
      resolution: params.resolution,
    };

    const records = [record, ...this.getRecords()];
    this.saveRecords(records);
    return record;
  }

  /**
   * Post-execution completion
   */
  public static recordCompletion(params: {
    requestId: string;
    providerJobId?: string;
    actualCostUsd?: number;
  }): void {
    const records = this.getRecords();
    const idx = records.findIndex(r => r.requestId === params.requestId);
    if (idx >= 0) {
      records[idx].status = 'completed';
      records[idx].providerJobId = params.providerJobId || records[idx].providerJobId;
      if (typeof params.actualCostUsd === 'number') {
        records[idx].actualProviderCostUsd = Number(params.actualCostUsd.toFixed(4));
      } else {
        records[idx].actualProviderCostUsd = records[idx].estimatedProviderCostUsd;
      }
      this.saveRecords(records);
    }
  }

  /**
   * Execution failure and automated refund
   */
  public static recordFailure(params: {
    requestId: string;
    reason: string;
    refundCredits: boolean;
  }): void {
    const records = this.getRecords();
    const idx = records.findIndex(r => r.requestId === params.requestId);
    if (idx >= 0) {
      records[idx].status = params.refundCredits ? 'refunded' : 'failed';
      records[idx].failureReason = params.reason;
      records[idx].refunded = params.refundCredits;
      this.saveRecords(records);
    }
  }

  /**
   * Blocked by Owner Safety Limits
   */
  public static recordLimitBlocked(params: {
    requestId: string;
    provider: string;
    model: string;
    operation: string;
    userId: string;
    estimatedCostUsd: number;
    reason: string;
  }): void {
    const record: ProviderCostRecord = {
      id: `pcl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      requestId: params.requestId,
      provider: params.provider,
      model: params.model,
      operation: params.operation,
      userId: params.userId,
      estimatedProviderCostUsd: Number(params.estimatedCostUsd.toFixed(4)),
      vyroCreditsCharged: 0,
      timestamp: new Date().toISOString(),
      status: 'blocked_by_limit',
      failureReason: params.reason,
      refunded: false,
    };

    const records = [record, ...this.getRecords()];
    this.saveRecords(records);
  }

  // ==================== SPEND CALCULATION ====================

  public static getGlobalSpendTodayUsd(): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.getRecords()
      .filter(r => (r.status === 'completed' || r.status === 'reserved') && r.timestamp.startsWith(today))
      .reduce((sum, r) => sum + (r.actualProviderCostUsd ?? r.estimatedProviderCostUsd), 0);
  }

  public static getGlobalSpendThisMonthUsd(): number {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return this.getRecords()
      .filter(r => (r.status === 'completed' || r.status === 'reserved') && r.timestamp.startsWith(thisMonth))
      .reduce((sum, r) => sum + (r.actualProviderCostUsd ?? r.estimatedProviderCostUsd), 0);
  }

  public static getProviderSpendTodayUsd(provider: string): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.getRecords()
      .filter(r => r.provider === provider && (r.status === 'completed' || r.status === 'reserved') && r.timestamp.startsWith(today))
      .reduce((sum, r) => sum + (r.actualProviderCostUsd ?? r.estimatedProviderCostUsd), 0);
  }

  public static getProviderSpendThisMonthUsd(provider: string): number {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return this.getRecords()
      .filter(r => r.provider === provider && (r.status === 'completed' || r.status === 'reserved') && r.timestamp.startsWith(thisMonth))
      .reduce((sum, r) => sum + (r.actualProviderCostUsd ?? r.estimatedProviderCostUsd), 0);
  }

  public static getUserSpendTodayUsd(userId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.getRecords()
      .filter(r => r.userId === userId && (r.status === 'completed' || r.status === 'reserved') && r.timestamp.startsWith(today))
      .reduce((sum, r) => sum + (r.actualProviderCostUsd ?? r.estimatedProviderCostUsd), 0);
  }

  public static getUserSpendThisMonthUsd(userId: string): number {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return this.getRecords()
      .filter(r => r.userId === userId && (r.status === 'completed' || r.status === 'reserved') && r.timestamp.startsWith(thisMonth))
      .reduce((sum, r) => sum + (r.actualProviderCostUsd ?? r.estimatedProviderCostUsd), 0);
  }

  public static getUserCreditsConsumedToday(userId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.getRecords()
      .filter(r => r.userId === userId && r.status === 'completed' && r.timestamp.startsWith(today))
      .reduce((sum, r) => sum + r.vyroCreditsCharged, 0);
  }

  public static getUserCreditsConsumedThisMonth(userId: string): number {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return this.getRecords()
      .filter(r => r.userId === userId && r.status === 'completed' && r.timestamp.startsWith(thisMonth))
      .reduce((sum, r) => sum + r.vyroCreditsCharged, 0);
  }

  public static getActiveJobsCount(): number {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    return this.getRecords().filter(
      r => r.status === 'reserved' && new Date(r.timestamp).getTime() > fiveMinAgo
    ).length;
  }

  public static getUserActiveJobsCount(userId: string): number {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    return this.getRecords().filter(
      r => r.userId === userId && r.status === 'reserved' && new Date(r.timestamp).getTime() > fiveMinAgo
    ).length;
  }

  public static getAggregatesByProvider(): Record<string, ProviderAggregates> {
    const records = this.getRecords();
    const result: Record<string, ProviderAggregates> = {};

    for (const r of records) {
      if (!result[r.provider]) {
        result[r.provider] = {
          provider: r.provider,
          jobsCount: 0,
          successfulJobs: 0,
          failedJobs: 0,
          refundedJobs: 0,
          creditsConsumed: 0,
          estimatedCostUsd: 0,
          actualCostUsd: 0,
          dailySpendUsd: 0,
          monthlySpendUsd: 0,
        };
      }

      const agg = result[r.provider];
      agg.jobsCount++;

      if (r.status === 'completed') {
        agg.successfulJobs++;
        agg.creditsConsumed += r.vyroCreditsCharged;
        agg.actualCostUsd += r.actualProviderCostUsd ?? r.estimatedProviderCostUsd;
      } else if (r.status === 'failed') {
        agg.failedJobs++;
      } else if (r.status === 'refunded') {
        agg.refundedJobs++;
      }

      agg.estimatedCostUsd += r.estimatedProviderCostUsd;
    }

    // Attach daily & monthly spend
    for (const p of Object.keys(result)) {
      result[p].dailySpendUsd = this.getProviderSpendTodayUsd(p);
      result[p].monthlySpendUsd = this.getProviderSpendThisMonthUsd(p);
    }

    return result;
  }
}
