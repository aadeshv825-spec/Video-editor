import React from 'react';
import { AlertTriangle, Server, ExternalLink, Cpu, Sparkles, ShieldCheck } from 'lucide-react';
import { useModelRouter } from '../../../context/ModelRouterContext';
import { useAuth } from '../../../context/AuthContext';

interface AIProviderNotConfiguredNoticeProps {
  providerName: string;
  toolName: string;
  requiredModelId?: string;
  onOpenModelRouter: () => void;
  onSwitchToLocalOrGemini?: () => void;
  onOpenOwnerSettings?: () => void;
}

export const AIProviderNotConfiguredNotice: React.FC<AIProviderNotConfiguredNoticeProps> = ({
  providerName,
  toolName,
  requiredModelId,
  onOpenModelRouter,
  onSwitchToLocalOrGemini,
  onOpenOwnerSettings,
}) => {
  const { isOwner } = useAuth();
  const { getAvailableFallbackModel } = useModelRouter();
  const fallbackModel = requiredModelId ? getAvailableFallbackModel(requiredModelId) : undefined;

  return (
    <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface text-neutral-800 dark:text-neutral-200 space-y-4 max-w-lg mx-auto my-auto text-center shadow-sm">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
        <Server className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 mb-1">
          <span>Provider Setup Required</span>
        </div>
        <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
          Backend Provider Not Configured
        </h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{toolName}</span> is mapped to{' '}
          <span className="font-semibold">{providerName}</span>
          {requiredModelId ? ` (${requiredModelId})` : ''}. This provider has not been configured on the studio backend.
        </p>
      </div>

      <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-[11px] text-left space-y-1 text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Real Inference Guarantee:</span>
        </div>
        <p>
          VYRO never simulates fake AI outputs. Creative tasks are only executed when genuine neural pipelines are verified and ready.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
        <button
          onClick={onOpenModelRouter}
          className="w-full sm:w-auto px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Select Available Model</span>
        </button>

        {onSwitchToLocalOrGemini && (
          <button
            onClick={onSwitchToLocalOrGemini}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-medium hover:opacity-90 flex items-center justify-center gap-1.5 transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Switch to {fallbackModel?.name || 'Available Alternative'}</span>
          </button>
        )}

        {isOwner && onOpenOwnerSettings && (
          <button
            onClick={onOpenOwnerSettings}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-medium hover:bg-purple-500/5 transition-colors"
          >
            Owner Config
          </button>
        )}
      </div>
    </div>
  );
};
