import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Laptop, 
  Cloud, 
  Copy, 
  Check, 
  ArrowRight,
  GitBranch,
  SplitSquareVertical,
  Clock
} from 'lucide-react';
import { ProjectConflict } from '../../types';

interface SyncConflictModalProps {
  isOpen: boolean;
  conflict: ProjectConflict | null;
  onResolve: (action: 'keep_local' | 'keep_remote' | 'create_copy') => void;
  onClose: () => void;
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
  isOpen,
  conflict,
  onResolve,
  onClose,
}) => {
  const [showComparison, setShowComparison] = useState(false);

  if (!isOpen || !conflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div 
        id="sync-conflict-modal-card"
        className="w-full max-w-xl bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-xs"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                Multi-Device Cloud Revision Conflict
              </h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Project &quot;{conflict.projectTitle}&quot; was modified concurrently on another device.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conflict Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Local Device Version */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-2">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold">
              <Laptop className="w-4 h-4 text-blue-500" />
              <span>This Device (Local)</span>
            </div>

            <div className="space-y-1 font-mono text-[11px] text-neutral-500">
              <div>Revision: v{conflict.localVersion}</div>
              <div>Device: Current Workstation</div>
              <div>Modified: {new Date(conflict.localUpdatedAt).toLocaleTimeString()}</div>
            </div>

            <div className="pt-2">
              <button
                id="resolve-keep-local-btn"
                onClick={() => onResolve('keep_local')}
                className="w-full py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold rounded-lg text-xs hover:opacity-90 transition-opacity"
              >
                Keep This Device
              </button>
            </div>
          </div>

          {/* Cloud Version */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-2">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold">
              <Cloud className="w-4 h-4 text-purple-500" />
              <span>Cloud Server Version</span>
            </div>

            <div className="space-y-1 font-mono text-[11px] text-neutral-500">
              <div>Revision: v{conflict.cloudVersion}</div>
              <div>Device: {conflict.deviceOrigin}</div>
              <div>Modified: {new Date(conflict.cloudUpdatedAt).toLocaleTimeString()}</div>
            </div>

            <div className="pt-2">
              <button
                id="resolve-keep-cloud-btn"
                onClick={() => onResolve('keep_remote')}
                className="w-full py-2 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold rounded-lg text-xs"
              >
                Keep Cloud Version
              </button>
            </div>
          </div>
        </div>

        {/* Granular Comparison Details Drawer */}
        {showComparison && (
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820] space-y-2">
            <span className="font-mono text-[10px] uppercase text-neutral-400 font-semibold">
              Differences Summary:
            </span>
            <div className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
              <div>• Local revision timestamp: {new Date(conflict.localUpdatedAt).toLocaleString()}</div>
              <div>• Cloud revision timestamp: {new Date(conflict.cloudUpdatedAt).toLocaleString()}</div>
              <div>• Remote origin device: {conflict.deviceOrigin}</div>
            </div>
          </div>
        )}

        {/* Secondary Safe Actions */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>{showComparison ? 'Hide Comparison' : 'Compare Revisions'}</span>
          </button>

          <button
            id="resolve-create-copy-btn"
            type="button"
            onClick={() => onResolve('create_copy')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Keep Both (Create Forked Copy)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
