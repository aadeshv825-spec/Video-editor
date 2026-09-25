import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Save,
  CheckCircle2,
  DollarSign,
  Clock,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { ProviderCostSafetyService, CostSafetyLimits } from '../../services/ai/providerCostSafetyService';
import { AI_MODEL_REGISTRY } from '../../services/ai/modelRegistry';
import { OwnerSecurityService } from '../../services/owner/ownerSecurityService';

export const OwnerCostSafetyControls: React.FC = () => {
  const [limits, setLimits] = useState<CostSafetyLimits>(() => ProviderCostSafetyService.getLimits());
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    // Also sync from server if available
    fetch('/api/ai/safety/limits', {
      headers: { ...OwnerSecurityService.getAuthHeaders() },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.limits) {
          setLimits(prev => ({ ...prev, ...data.limits }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    ProviderCostSafetyService.updateLimits(limits);

    // Sync to server
    try {
      await fetch('/api/ai/safety/limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...OwnerSecurityService.getAuthHeaders(),
        },
        body: JSON.stringify(limits),
      });
    } catch (e) {
      console.warn('Failed to sync safety limits to server', e);
    }

    setIsSaving(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleProviderDailyLimitChange = (provider: string, val: number) => {
    setLimits(prev => ({
      ...prev,
      perProviderDailyLimitUsd: {
        ...prev.perProviderDailyLimitUsd,
        [provider]: val,
      },
    }));
  };

  const handleProviderMonthlyLimitChange = (provider: string, val: number) => {
    setLimits(prev => ({
      ...prev,
      perProviderMonthlyLimitUsd: {
        ...prev.perProviderMonthlyLimitUsd,
        [provider]: val,
      },
    }));
  };

  const handleMaintenanceToggle = (provider: string) => {
    setLimits(prev => ({
      ...prev,
      providerMaintenance: {
        ...prev.providerMaintenance,
        [provider]: !prev.providerMaintenance[provider],
      },
    }));
  };

  const handleModelToggle = (modelId: string) => {
    setLimits(prev => ({
      ...prev,
      disabledModels: {
        ...prev.disabledModels,
        [modelId]: !prev.disabledModels[modelId],
      },
    }));
  };

  const providersList = [
    { id: 'google', name: 'Google (Gemini / Veo / Lyria)' },
    { id: 'runway', name: 'Runway ML (Gen-3)' },
    { id: 'openai', name: 'OpenAI (Sora / DALL-E)' },
    { id: 'flux', name: 'Black Forest Labs (Flux)' },
    { id: 'elevenlabs', name: 'ElevenLabs (Voice / Audio)' },
    { id: 'anthropic', name: 'Anthropic (Claude)' },
    { id: 'stability', name: 'Stability AI (SD3.5)' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Emergency Kill Switch Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
          limits.emergencyKillSwitch
            ? 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200'
            : 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg mt-0.5 ${
              limits.emergencyKillSwitch
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span>Emergency AI Kill Switch</span>
              {limits.emergencyKillSwitch && (
                <span className="text-[10px] font-mono uppercase bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                  ACTIVE — ALL JOBS HALTED
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              Instantly blocks all external and high-cost AI provider calls across the entire platform. Protects from runaway billing spikes.
            </p>
          </div>
        </div>

        <button
          onClick={() => setLimits(prev => ({ ...prev, emergencyKillSwitch: !prev.emergencyKillSwitch }))}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            limits.emergencyKillSwitch
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
              : 'bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
          }`}
        >
          {limits.emergencyKillSwitch ? 'Deactivate Kill Switch' : 'Activate Kill Switch'}
        </button>
      </div>

      {/* Global Spending Limits */}
      <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Global Platform Spending Protection</h3>
          </div>
          <span className="text-xs text-neutral-500 font-mono">USD ($) Hard Ceilings</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Global Daily Limit ($)
            </label>
            <input
              type="number"
              min={1}
              step={5}
              value={limits.globalDailySpendLimitUsd}
              onChange={e => setLimits(prev => ({ ...prev, globalDailySpendLimitUsd: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
            <p className="text-[10px] text-neutral-400">Total daily provider expenditure cap.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Global Monthly Limit ($)
            </label>
            <input
              type="number"
              min={10}
              step={25}
              value={limits.globalMonthlySpendLimitUsd}
              onChange={e => setLimits(prev => ({ ...prev, globalMonthlySpendLimitUsd: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
            <p className="text-[10px] text-neutral-400">Monthly billing ceiling before auto-cutoff.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Max Single Job Cost ($)
            </label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={limits.maxSingleGenerationCostUsd}
              onChange={e => setLimits(prev => ({ ...prev, maxSingleGenerationCostUsd: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
            <p className="text-[10px] text-neutral-400">Rejects any job exceeding this single cost.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Max Video Duration (sec)
            </label>
            <input
              type="number"
              min={3}
              max={30}
              value={limits.maxVideoDurationSec}
              onChange={e => setLimits(prev => ({ ...prev, maxVideoDurationSec: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
            <p className="text-[10px] text-neutral-400">Caps expensive long-form generations.</p>
          </div>
        </div>
      </div>

      {/* Per-User Spending & Credit Ceilings */}
      <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Per-User Safeguards & Quotas</h3>
          </div>
          <span className="text-xs text-neutral-500">Prevents individual account abuse</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              User Daily Spend Limit ($)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={limits.perUserDailySpendLimitUsd}
              onChange={e => setLimits(prev => ({ ...prev, perUserDailySpendLimitUsd: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              User Monthly Spend Limit ($)
            </label>
            <input
              type="number"
              min={5}
              step={5}
              value={limits.perUserMonthlySpendLimitUsd}
              onChange={e => setLimits(prev => ({ ...prev, perUserMonthlySpendLimitUsd: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              User Daily Credits Cap
            </label>
            <input
              type="number"
              min={50}
              step={50}
              value={limits.perUserDailyCreditLimit}
              onChange={e => setLimits(prev => ({ ...prev, perUserDailyCreditLimit: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Max Resolution for Expensive Models
            </label>
            <select
              value={limits.maxResolutionForExpensiveModels}
              onChange={e => setLimits(prev => ({ ...prev, maxResolutionForExpensiveModels: e.target.value as any }))}
              className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
            >
              <option value="1080p">1080p (Protected - Saves Compute)</option>
              <option value="4K">4K (Allow Ultra-HD Expensive Models)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Per-Provider Daily / Monthly Spend Limits */}
      <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Per-Provider Spend Limits & Maintenance</h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={limits.autoFallbackEnabled}
                onChange={e => setLimits(prev => ({ ...prev, autoFallbackEnabled: e.target.checked }))}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span>Enable Automatic Fallback</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Daily Limit ($)</th>
                <th className="py-2.5 px-3">Monthly Limit ($)</th>
                <th className="py-2.5 px-3 text-right">Maintenance Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {providersList.map(p => {
                const dailyVal = limits.perProviderDailyLimitUsd[p.id] ?? 25;
                const monthlyVal = limits.perProviderMonthlyLimitUsd[p.id] ?? 250;
                const isMaint = Boolean(limits.providerMaintenance[p.id]);

                return (
                  <tr key={p.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20">
                    <td className="py-3 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {p.name}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 w-28">
                        <span className="text-neutral-400">$</span>
                        <input
                          type="number"
                          min={1}
                          step={5}
                          value={dailyVal}
                          onChange={e => handleProviderDailyLimitChange(p.id, Number(e.target.value))}
                          className="w-full px-2 py-1 font-mono rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 w-28">
                        <span className="text-neutral-400">$</span>
                        <input
                          type="number"
                          min={10}
                          step={25}
                          value={monthlyVal}
                          onChange={e => handleProviderMonthlyLimitChange(p.id, Number(e.target.value))}
                          className="w-full px-2 py-1 font-mono rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleMaintenanceToggle(p.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          isMaint
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                        }`}
                      >
                        {isMaint ? 'Under Maintenance' : 'Operational'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model-Level Master Switches */}
      <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Individual Model Master Switches</h3>
          </div>
          <span className="text-xs text-neutral-500">Toggle individual neural engines on/off</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {AI_MODEL_REGISTRY.map(model => {
            const isDisabled = Boolean(limits.disabledModels[model.id]);
            return (
              <div
                key={model.id}
                className={`p-3 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                  isDisabled
                    ? 'border-neutral-200 dark:border-neutral-800/60 bg-neutral-100/50 dark:bg-neutral-900/30 opacity-60'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate text-neutral-900 dark:text-neutral-100">
                    {model.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate">{model.provider}</div>
                </div>

                <button
                  onClick={() => handleModelToggle(model.id)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold shrink-0 cursor-pointer transition-colors ${
                    isDisabled
                      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {isDisabled ? 'Disabled' : 'Active'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 sticky bottom-4 p-4 rounded-xl bg-white/90 dark:bg-[#12161f]/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-xl">
        {savedFeedback && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Safety controls & limits updated successfully.</span>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Limits...' : 'Save Safety Limits'}</span>
        </button>
      </div>
    </div>
  );
};
