import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  DollarSign,
  Coins,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Cpu,
  Clock,
  Filter,
} from 'lucide-react';
import {
  ProviderCostLedgerService,
  ProviderCostRecord,
  ProviderAggregates,
} from '../../services/ai/providerCostLedgerService';
import {
  ProviderCostSafetyService,
  CostSafetyLimits,
} from '../../services/ai/providerCostSafetyService';
import { ProviderStatusService, ProviderConnectionInfo } from '../../services/ai/providerStatusService';
import { OwnerSecurityService } from '../../services/owner/ownerSecurityService';

export const OwnerProviderCostDashboard: React.FC = () => {
  const [records, setRecords] = useState<ProviderCostRecord[]>(() => ProviderCostLedgerService.getAllRecords());
  const [aggregates, setAggregates] = useState<Record<string, ProviderAggregates>>(() =>
    ProviderCostLedgerService.getAggregatesByProvider()
  );
  const [limits, setLimits] = useState<CostSafetyLimits>(() => ProviderCostSafetyService.getLimits());
  const [providers, setProviders] = useState<ProviderConnectionInfo[]>(() => ProviderStatusService.getProviders());
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const localRecords = ProviderCostLedgerService.getAllRecords();
      setRecords(localRecords);
      setAggregates(ProviderCostLedgerService.getAggregatesByProvider());
      setLimits(ProviderCostSafetyService.getLimits());
      const pList = await ProviderStatusService.refreshProviders();
      setProviders(pList);

      // Best effort sync from server
      const res = await fetch('/api/ai/safety/ledger', {
        headers: { ...OwnerSecurityService.getAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.records && data.records.length > 0) {
          // Merge any server records if needed
        }
      }
    } catch (e) {
      console.warn('Dashboard refresh', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const globalDailySpend = ProviderCostLedgerService.getGlobalSpendTodayUsd();
  const globalMonthlySpend = ProviderCostLedgerService.getGlobalSpendThisMonthUsd();
  const remainingDailyAllowance = Math.max(0, limits.globalDailySpendLimitUsd - globalDailySpend);
  const remainingMonthlyAllowance = Math.max(0, limits.globalMonthlySpendLimitUsd - globalMonthlySpend);

  const totalJobs = records.length;
  const totalCompleted = records.filter(r => r.status === 'completed').length;
  const totalFailed = records.filter(r => r.status === 'failed').length;
  const totalRefunded = records.filter(r => r.status === 'refunded').length;
  const totalCredits = records.reduce((s, r) => s + (r.vyroCreditsCharged || 0), 0);

  const filteredRecords = filterProvider === 'all' ? records : records.filter(r => r.provider === filterProvider);

  const providerNames: Record<string, string> = {
    google: 'Google DeepMind',
    runway: 'Runway ML',
    openai: 'OpenAI',
    flux: 'Black Forest Labs (Flux)',
    elevenlabs: 'ElevenLabs',
    anthropic: 'Anthropic',
    stability: 'Stability AI',
    local: 'Local Creative Engine',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Controls & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span>AI Provider Economics & Usage Analytics</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time tracking of API provider expenditures, unit economics, job success rates, and budget allocations.
          </p>
        </div>

        <button
          onClick={refreshData}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Spend */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Today's Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              ${globalDailySpend.toFixed(2)}
            </div>
            <div className="text-xs text-neutral-400 font-mono">/ ${limits.globalDailySpendLimitUsd.toFixed(2)}</div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <span>Remaining Allowance:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              ${remainingDailyAllowance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Monthly Spend */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Month's Spend</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              ${globalMonthlySpend.toFixed(2)}
            </div>
            <div className="text-xs text-neutral-400 font-mono">/ ${limits.globalMonthlySpendLimitUsd.toFixed(2)}</div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <span>Remaining Allowance:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
              ${remainingMonthlyAllowance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Total Jobs */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Jobs Processed</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {totalJobs}
          </div>
          <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {totalCompleted} ok</span>
            <span className="text-red-500 font-medium">✕ {totalFailed} failed</span>
            <span className="text-amber-500 font-medium">↺ {totalRefunded} refunded</span>
          </div>
        </div>

        {/* VYRO Credits Consumed */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>User Credits Consumed</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {totalCredits.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            Server-Authoritative Ledger
          </div>
        </div>
      </div>

      {/* Provider Economics Breakdown Table */}
      <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Provider Cost & Allowance Breakdown
          </h4>
          <span className="text-xs text-neutral-400">Owner-Authoritative Metrics</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Total Jobs</th>
                <th className="py-2.5 px-3">Credits Consumed</th>
                <th className="py-2.5 px-3">Estimated Cost ($)</th>
                <th className="py-2.5 px-3">Actual Cost ($)</th>
                <th className="py-2.5 px-3">Daily Spend / Limit</th>
                <th className="py-2.5 px-3 text-right">Remaining Allowance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {['google', 'runway', 'openai', 'flux', 'elevenlabs', 'anthropic', 'stability', 'local'].map(pKey => {
                const agg = aggregates[pKey] || {
                  provider: pKey,
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

                const provInfo = providers.find(p => p.id === pKey);
                const dailyLimit = limits.perProviderDailyLimitUsd[pKey] ?? 25;
                const spendToday = ProviderCostLedgerService.getProviderSpendTodayUsd(pKey);
                const remainingAllowance = Math.max(0, dailyLimit - spendToday);

                let statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    Not Configured
                  </span>
                );

                if (pKey === 'local') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Active (Built-In)
                    </span>
                  );
                } else if (provInfo?.isConfigured && provInfo?.isEnabled && provInfo?.connectionStatus === 'connected') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Connected
                    </span>
                  );
                } else if (limits.providerMaintenance[pKey]) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Maintenance
                    </span>
                  );
                } else if (provInfo?.isEnabled === false) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-600">
                      Disabled
                    </span>
                  );
                }

                return (
                  <tr key={pKey} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20">
                    <td className="py-3 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                      {providerNames[pKey] || pKey}
                    </td>
                    <td className="py-3 px-3">{statusBadge}</td>
                    <td className="py-3 px-3 font-mono">
                      {agg.jobsCount} <span className="text-[10px] text-neutral-400">({agg.successfulJobs} ok)</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-amber-600 dark:text-amber-400">
                      {agg.creditsConsumed.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono">${agg.estimatedCostUsd.toFixed(3)}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                      ${agg.actualCostUsd.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      ${spendToday.toFixed(2)} / ${dailyLimit.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-mono text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      ${remainingAllowance.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Internal Provider Job Ledger */}
      <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Provider Job Ledger (Audit Trail)
            </h4>
            <p className="text-[11px] text-neutral-400">
              Isolated from client credit display. Records actual provider requests and financial settlements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={filterProvider}
              onChange={e => setFilterProvider(e.target.value)}
              className="text-xs px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
            >
              <option value="all">All Providers</option>
              <option value="google">Google</option>
              <option value="runway">Runway</option>
              <option value="openai">OpenAI</option>
              <option value="flux">Flux</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="anthropic">Anthropic</option>
              <option value="stability">Stability</option>
              <option value="local">Local Engine</option>
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 space-y-1">
            <Clock className="w-6 h-6 mx-auto text-neutral-300 dark:text-neutral-700" />
            <div>No provider transactions logged yet.</div>
            <div className="text-[11px] text-neutral-500">Transactions are recorded automatically upon generation preflight.</div>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 font-semibold border-b border-neutral-200 dark:border-neutral-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Provider / Model</th>
                  <th className="py-2.5 px-3">Operation</th>
                  <th className="py-2.5 px-3">Est. Cost</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                {filteredRecords.slice(0, 100).map(rec => (
                  <tr key={rec.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-[11px]">
                    <td className="py-2.5 px-3 text-neutral-500">
                      {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-400 truncate max-w-[120px]">{rec.requestId}</td>
                    <td className="py-2.5 px-3 font-medium text-neutral-800 dark:text-neutral-200">
                      {rec.provider} <span className="text-[10px] text-neutral-400">({rec.model})</span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400 uppercase text-[10px]">
                      {rec.operation.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                      ${rec.estimatedProviderCostUsd.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-semibold">
                      {rec.vyroCreditsCharged}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {rec.status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                          Completed
                        </span>
                      ) : rec.status === 'refunded' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                          Refunded
                        </span>
                      ) : rec.status === 'blocked_by_limit' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                          Limit Blocked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 font-semibold">
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
