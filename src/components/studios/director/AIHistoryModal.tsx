import React from 'react';
import { History, CheckCircle2, Clock, AlertTriangle, X, Trash2, ArrowUpRight } from 'lucide-react';
import { useAIJobs } from '../../../context/AIJobContext';
import { Project } from '../../../types';

interface AIHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onReplayCommand?: (cmd: string) => void;
}

export const AIHistoryModal: React.FC<AIHistoryModalProps> = ({
  isOpen,
  onClose,
  project,
  onReplayCommand,
}) => {
  const { getJobsForProject, clearJobHistory } = useAIJobs();
  const projectJobs = getJobsForProject(project.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                AI Director Activity Log
              </h3>
              <p className="text-xs text-neutral-500">
                Non-destructive history of automated plans and executed edits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
          {projectJobs.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">No AI operations recorded yet for this project.</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Commands sent to AI Director will appear here with execution plans.
              </p>
            </div>
          ) : (
            projectJobs.map(job => (
              <div
                key={job.id}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        job.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : job.status === 'CANCELLED'
                          ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600'
                          : 'bg-blue-500/10 text-blue-600'
                      }`}>
                        {job.status}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {new Date(job.createdTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {job.modelName}
                      </span>
                    </div>

                    <p className="font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
                      "{job.command}"
                    </p>

                    {job.plan && (
                      <p className="text-[11px] text-neutral-500">
                        Target: {job.plan.target.title} • {job.plan.operations.length} operation(s) • Cost: {job.estimatedCredits} credit(s)
                      </p>
                    )}
                  </div>

                  {onReplayCommand && (
                    <button
                      onClick={() => {
                        onReplayCommand(job.command);
                        onClose();
                      }}
                      className="p-1.5 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      title="Load command"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
          {projectJobs.length > 0 && (
            <button
              onClick={clearJobHistory}
              className="text-xs text-neutral-400 hover:text-red-500 flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
