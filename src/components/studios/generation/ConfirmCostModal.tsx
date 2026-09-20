import React from 'react';
import { AlertCircle, Coins, Cpu, ShieldCheck, X } from 'lucide-react';
import { ExtendedAIModel } from '../../../services/ai/modelRegistry';

interface ConfirmCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  model: ExtendedAIModel;
  estimatedCredits: number;
  userCredits: number;
  taskTitle: string;
  isProUser: boolean;
}

export const ConfirmCostModal: React.FC<ConfirmCostModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  model,
  estimatedCredits,
  userCredits,
  taskTitle,
  isProUser,
}) => {
  if (!isOpen) return null;

  const hasEnoughCredits = userCredits >= estimatedCredits;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#12161f] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Confirm AI Generation</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Credit & Cost Protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Operation Summary
            </div>
            <div className="text-sm font-semibold truncate">{taskTitle}</div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60">
              <span className="text-neutral-500 dark:text-neutral-400">Selected Engine:</span>
              <span className="font-medium">{model.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">Processing Class:</span>
              <span className="font-mono uppercase text-purple-600 dark:text-purple-400 font-semibold">{model.quality} tier ({model.speed})</span>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Estimated Usage</div>
              <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                {estimatedCredits} <span className="text-xs font-normal">Credits</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">{model.costUnitLabel}</div>
            </div>

            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Your Balance</div>
              <div className={`text-lg font-bold font-mono mt-0.5 ${hasEnoughCredits ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {userCredits.toLocaleString()} <span className="text-xs font-normal">Credits</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                {isProUser ? 'Pro Plan Active' : 'Free Tier'}
              </div>
            </div>
          </div>

          {/* Protection Guarantee Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold">Credit Protection Policy:</span> Credits are never deducted until generation succeeds. If generation fails or is cancelled, zero credits are charged.
            </div>
          </div>

          {!hasEnoughCredits && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Insufficient AI credits balance to run this generation.</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0f16]">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!hasEnoughCredits}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Confirm & Generate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
