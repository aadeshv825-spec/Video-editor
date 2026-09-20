import React from 'react';
import { Coins, AlertCircle, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface AIToolCreditConfirmationModalProps {
  toolName: string;
  modelName: string;
  costCredits: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AIToolCreditConfirmationModal: React.FC<AIToolCreditConfirmationModalProps> = ({
  toolName,
  modelName,
  costCredits,
  onConfirm,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const hasEnough = currentUser.aiCredits >= costCredits;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold text-sm">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Confirm AI Credit Usage</span>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Target Operation:</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{toolName}</span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Inference Router:</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300">{modelName}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-neutral-200 dark:border-neutral-800 font-medium">
              <span className="text-neutral-900 dark:text-white">Estimated AI usage:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">{costCredits} Credits</span>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-neutral-500 px-1 font-mono">
            <span>Current Balance:</span>
            <span className={hasEnough ? 'text-neutral-900 dark:text-neutral-200 font-semibold' : 'text-rose-500 font-bold'}>
              {currentUser.aiCredits} Credits
            </span>
          </div>

          {!hasEnough && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Insufficient credit balance. Upgrade or request credits from the Owner center.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!hasEnough}
            className="flex-1 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
