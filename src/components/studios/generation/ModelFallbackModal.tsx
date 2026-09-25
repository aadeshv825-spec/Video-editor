import React from 'react';
import { AlertTriangle, ArrowRight, Check, Sparkles, X, ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';
import { ExtendedAIModel, ModelRegistryService } from '../../../services/ai/modelRegistry';
import { CapabilityFallbackService } from '../../../services/ai/capabilityFallbackService';
import { useAuth } from '../../../context/AuthContext';

interface ModelFallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: ExtendedAIModel;
  suggestedFallbackId?: string;
  reason: string;
  onAcceptFallback: (newModelId: string) => void;
  onOpenSettings?: () => void;
}

export const ModelFallbackModal: React.FC<ModelFallbackModalProps> = ({
  isOpen,
  onClose,
  currentModel,
  suggestedFallbackId,
  reason,
  onAcceptFallback,
  onOpenSettings,
}) => {
  const { isOwner } = useAuth();
  if (!isOpen) return null;

  const resolution = CapabilityFallbackService.resolveFallback(currentModel.id);
  const isNoEquivalent = resolution.accuracy === 'NO_EQUIVALENT' || !resolution.canFallback;
  const isPartial = resolution.accuracy === 'PARTIAL_ALTERNATIVE';
  const isTrueEquivalent = resolution.accuracy === 'TRUE_EQUIVALENT';

  const fallbackModel = !isNoEquivalent
    ? suggestedFallbackId
      ? ModelRegistryService.getModelById(suggestedFallbackId)
      : resolution.targetModelId
      ? ModelRegistryService.getModelById(resolution.targetModelId)
      : ModelRegistryService.getSuggestedFallbackModel(currentModel.id)
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#12161f] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isNoEquivalent
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : isPartial
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}>
              {isNoEquivalent ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold">Capability Verification</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {isNoEquivalent
                  ? 'Compatible Provider Required'
                  : isPartial
                  ? 'Partial Alternative Available'
                  : 'Equivalent Model Available'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Classification Banner */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              Capability Status:
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              isNoEquivalent
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : isPartial
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}>
              {resolution.accuracy}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <span className="font-semibold">{currentModel.name}:</span>{' '}
            {reason}
          </div>

          {/* Technical difference disclosure if partial */}
          {isPartial && resolution.technicalDetails && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Methodology & Style Differences:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                {resolution.technicalDetails}
              </p>
            </div>
          )}

          {fallbackModel ? (
            <div className="space-y-2">
              <div className="text-neutral-500 dark:text-neutral-400 font-medium">
                {isTrueEquivalent ? 'Equivalent engine available:' : 'Alternative option available:'}
              </div>

              <div className="p-3.5 rounded-lg border border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-purple-900 dark:text-purple-200">
                    {fallbackModel.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-700 dark:text-purple-300">
                    Ready
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                  {fallbackModel.description}
                </p>
                <div className="flex items-center gap-3 pt-1 border-t border-purple-500/20 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                  <span>Speed: {fallbackModel.speed}</span>
                  <span>•</span>
                  <span>Quality: {fallbackModel.quality}</span>
                  <span>•</span>
                  <span>{fallbackModel.costPerUnit} Credits</span>
                </div>
              </div>

              <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                {isPartial
                  ? 'VYRO never silently substitutes models. Please confirm below if you wish to use this alternative method.'
                  : 'You can switch to this equivalent model to execute your creative prompt immediately.'}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-800 dark:text-rose-300 space-y-1">
              <div className="font-semibold text-xs">Compatible provider setup required</div>
              <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                No direct or safe equivalent exists for this proprietary operation. An administrator must configure this provider before this specific operation can execute.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0f16]">
          {isOwner && onOpenSettings ? (
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium cursor-pointer"
            >
              Owner Provider Manager
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              {fallbackModel ? 'Cancel' : 'Dismiss'}
            </button>
            {fallbackModel && (
              <button
                onClick={() => {
                  onAcceptFallback(fallbackModel.id);
                  onClose();
                }}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-medium hover:opacity-90 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>{isPartial ? 'Confirm Alternative' : `Switch to ${fallbackModel.name.split(' ')[0]}`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

