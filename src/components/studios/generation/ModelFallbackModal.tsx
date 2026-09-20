import React from 'react';
import { AlertTriangle, ArrowRight, Check, Sparkles, X, ShieldCheck } from 'lucide-react';
import { ExtendedAIModel, ModelRegistryService } from '../../../services/ai/modelRegistry';
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

  const fallbackModel = suggestedFallbackId
    ? ModelRegistryService.getModelById(suggestedFallbackId)
    : ModelRegistryService.getSuggestedFallbackModel(currentModel.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#12161f] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Model Status Notification</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Model Availability & Fallback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 leading-relaxed">
            <span className="font-semibold">{currentModel.name} is currently unavailable for direct execution:</span>{' '}
            {reason}
          </div>

          {fallbackModel ? (
            <div className="space-y-2">
              <div className="text-neutral-500 dark:text-neutral-400 font-medium">
                Compatible alternative available:
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
                The app never silently switches models. You can switch to this recommended alternative to proceed immediately.
              </p>
            </div>
          ) : (
            <p className="text-neutral-500 dark:text-neutral-400">
              No direct alternative model found for this capability. The studio administrator must configure the backend provider.
            </p>
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
              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            >
              Owner Provider Manager
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            {fallbackModel && (
              <button
                onClick={() => {
                  onAcceptFallback(fallbackModel.id);
                  onClose();
                }}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-medium hover:opacity-90 flex items-center gap-1.5 shadow-sm"
              >
                <span>Switch to {fallbackModel.name.split(' ')[0]}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
