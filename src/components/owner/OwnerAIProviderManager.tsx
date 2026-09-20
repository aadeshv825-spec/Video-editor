import React, { useState, useEffect } from 'react';
import {
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Key,
  Lock,
  ExternalLink,
  Cpu,
  Coins,
  CreditCard,
  Sliders,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ProviderStatusService, ProviderConnectionInfo } from '../../services/ai/providerStatusService';
import { useAuth } from '../../context/AuthContext';

export const OwnerAIProviderManager: React.FC = () => {
  const { isOwner } = useAuth();
  const [providers, setProviders] = useState<ProviderConnectionInfo[]>(() => ProviderStatusService.getProviders());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latencyMs: number }>>({});
  
  // Configuration modal/drawer state
  const [configuringProvider, setConfiguringProvider] = useState<ProviderConnectionInfo | null>(null);
  const [inputKey, setInputKey] = useState<string>('');
  const [isSubmittingKey, setIsSubmittingKey] = useState<boolean>(false);
  const [configFeedback, setConfigFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const data = await ProviderStatusService.refreshProviders();
      setProviders(data);
    } catch (err) {
      console.error('Failed to fetch providers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    const unsub = ProviderStatusService.subscribe(() => {
      setProviders(ProviderStatusService.getProviders());
    });
    return unsub;
  }, []);

  const handleTestConnection = async (providerId: string) => {
    setTestingId(providerId);
    try {
      const res = await ProviderStatusService.testProvider(providerId);
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          success: res.success,
          message: res.message,
          latencyMs: res.latencyMs,
        },
      }));
      await fetchProviders();
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          success: false,
          message: err.message || 'Connection test encountered an error.',
          latencyMs: 0,
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleProvider = async (providerId: string, currentlyEnabled: boolean) => {
    try {
      await ProviderStatusService.toggleProvider(providerId, !currentlyEnabled);
      await fetchProviders();
    } catch (err) {
      console.error('Failed to toggle provider', err);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringProvider || !inputKey.trim()) return;

    setIsSubmittingKey(true);
    setConfigFeedback(null);

    try {
      const res = await ProviderStatusService.configureProvider(configuringProvider.id, inputKey.trim());
      if (res.success) {
        setConfigFeedback({ success: true, message: 'Provider credentials saved and validated securely on backend.' });
        setInputKey('');
        await fetchProviders();
        setTimeout(() => {
          setConfiguringProvider(null);
          setConfigFeedback(null);
        }, 1500);
      } else {
        setConfigFeedback({ success: false, message: res.message || 'Failed to save credentials.' });
      }
    } catch (err: any) {
      setConfigFeedback({ success: false, message: err.message || 'Error communicating with server vault.' });
    } finally {
      setIsSubmittingKey(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface text-center space-y-3">
        <Lock className="w-8 h-8 text-neutral-400 mx-auto" />
        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Owner Authorization Required</h3>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          AI Provider connection secrets and backend engine configurations are strictly restricted to Studio Owners.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Title and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              AI Providers & Infrastructure Connections
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage server-side neural inference provider credentials, live health probes, and model routing readiness.
          </p>
        </div>

        <button
          onClick={fetchProviders}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Two-Tier Credit Architecture Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>VYRO User Credits Layer</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
            In-app studio entitlement quota for end users. Credits are deducted per generation task according to user tier (Free vs Pro). Normal users never interact with external provider billing.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <CreditCard className="w-4 h-4 text-purple-500" />
            <span>Owner / Provider API Billing Layer</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
            Direct API usage billed directly by Google, Runway, OpenAI, ElevenLabs, etc. Stored exclusively inside server-side environment variables or server vault. Secrets are never exposed to clients.
          </p>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map(provider => {
          const isTesting = testingId === provider.id;
          const testRes = testResults[provider.id];

          return (
            <div
              key={provider.id}
              className={`p-4.5 rounded-xl border flex flex-col justify-between space-y-3.5 transition-all ${
                !provider.isEnabled
                  ? 'border-neutral-200 dark:border-neutral-800/80 bg-neutral-100/40 dark:bg-neutral-900/20 opacity-70'
                  : provider.isConfigured
                  ? 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface shadow-xs'
                  : 'border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10'
              }`}
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-tight">
                      {provider.name}
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                      ID: {provider.id}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {provider.connectionStatus === 'connected' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      CONNECTED
                    </span>
                  ) : provider.connectionStatus === 'decommissioned' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      OFFLINE
                    </span>
                  ) : provider.connectionStatus === 'error' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      ERROR
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      NOT CONFIGURED
                    </span>
                  )}
                </div>

                {/* Masked Secret Display */}
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-neutral-400">Credential:</span>
                  {provider.isConfigured ? (
                    <span className="text-neutral-700 dark:text-neutral-300 font-semibold tracking-wider">
                      {provider.maskedKey || '••••••••••••••••'}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 italic font-sans text-[10px]">
                      No key in server vault
                    </span>
                  )}
                </div>

                {/* Available Models */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                    Integrated Models ({provider.availableModels.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {provider.availableModels.map((m: string) => (
                      <span
                        key={m}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Test Result Message */}
                {testRes && (
                  <div
                    className={`p-2 rounded-lg text-[11px] font-mono border ${
                      testRes.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{testRes.success ? 'Probe Passed' : 'Probe Failed'}</span>
                      {testRes.latencyMs > 0 && <span>{testRes.latencyMs}ms</span>}
                    </div>
                    <p className="mt-0.5 text-[10px] break-words">{testRes.message}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    disabled={!provider.isConfigured || isTesting}
                    onClick={() => handleTestConnection(provider.id)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      provider.isConfigured
                        ? 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                        : 'border-neutral-200 dark:border-neutral-800/60 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing Probe...' : 'Test Connection'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setConfiguringProvider(provider);
                      setInputKey('');
                      setConfigFeedback(null);
                    }}
                    className="py-1.5 px-3 rounded-lg text-xs font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 flex items-center gap-1.5 transition-opacity shrink-0"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{provider.isConfigured ? 'Update Key' : 'Configure'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <button
                    onClick={() => handleToggleProvider(provider.id, provider.isEnabled)}
                    className={`text-[11px] font-medium hover:underline ${
                      provider.isEnabled ? 'text-red-500' : 'text-emerald-600'
                    }`}
                  >
                    {provider.isEnabled ? 'Decommission Provider' : 'Enable Provider'}
                  </button>

                  {provider.lastTestedAt && (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Checked {new Date(provider.lastTestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Owner Configure Key Drawer/Modal */}
      {configuringProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Configure {configuringProvider.name} Secret
                </h3>
              </div>
              <button
                onClick={() => setConfiguringProvider(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Provider secrets are stored exclusively in the server memory vault and are never sent to client web browsers.
            </p>

            <form onSubmit={handleSaveCredentials} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  Enter API Key / Token
                </label>
                <input
                  type="password"
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  placeholder="Paste API Secret (e.g. sk-... or rw-...)"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  autoFocus
                />
              </div>

              {configFeedback && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-mono border ${
                    configFeedback.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 text-red-700 dark:text-red-300'
                  }`}
                >
                  {configFeedback.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfiguringProvider(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingKey || !inputKey.trim()}
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                >
                  {isSubmittingKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <span>Save to Server Vault</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
