import React from 'react';
import { ShieldAlert, RefreshCcw, Trash2 } from 'lucide-react';
import { Project } from '../../types';

interface ProjectRecoveryBannerProps {
  project: Project | null;
  onRestoreRecovery: (project: Project) => void;
  onDiscardRecovery: (project: Project) => void;
}

export const ProjectRecoveryBanner: React.FC<ProjectRecoveryBannerProps> = ({
  project,
  onRestoreRecovery,
  onDiscardRecovery,
}) => {
  if (!project || !project.hasRecoverySnapshot) return null;

  return (
    <div 
      id="project-recovery-banner"
      className="p-3 mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold flex items-center gap-1.5">
            <span>Unsaved Edits Detected (Crash Recovery)</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-normal">
              {project.title}
            </span>
          </div>
          <div className="text-[11px] opacity-90">
            An unsaved recovery snapshot from {project.recoverySnapshotTimestamp ? new Date(project.recoverySnapshotTimestamp).toLocaleTimeString() : 'previous session'} is available.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onRestoreRecovery(project)}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Restore Snapshot</span>
        </button>

        <button
          onClick={() => onDiscardRecovery(project)}
          className="px-2.5 py-1.5 border border-amber-400/40 hover:bg-amber-500/10 text-amber-900 dark:text-amber-300 font-medium rounded-lg text-xs flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Discard</span>
        </button>
      </div>
    </div>
  );
};
