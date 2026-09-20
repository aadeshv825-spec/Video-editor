import React from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Film,
  Video,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { useRenderQueue } from '../../../context/RenderQueueContext';
import { RenderQueueJob } from '../../../types/videoEditor';

interface RenderQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RenderQueueModal: React.FC<RenderQueueModalProps> = ({ isOpen, onClose }) => {
  const { jobs, cancelJob, retryJob, removeJob, clearCompletedJobs, activeJobCount } = useRenderQueue();

  if (!isOpen) return null;

  const getJobIcon = (type: RenderQueueJob['type']) => {
    switch (type) {
      case 'export':
        return Film;
      case 'stabilization':
        return Video;
      case 'upscale':
        return Sparkles;
      case 'optical_flow':
        return Clock;
      case 'audio_master':
        return Layers;
      default:
        return Film;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#13161c] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Background Render Queue</span>
                {activeJobCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-400 font-mono">
                    {activeJobCount} active
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-neutral-500">
                Non-blocking batch queue for exports, AI stabilization, upscaling, and neural workflows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {jobs.some(j => j.status === 'completed') && (
              <button
                onClick={clearCompletedJobs}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors px-2 py-1"
              >
                Clear Completed
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {jobs.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Cpu className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs">The render queue is currently empty.</p>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                Trigger an export, stabilization, or AI process from the editor to queue background processing.
              </p>
            </div>
          ) : (
            jobs.map(job => {
              const Icon = getJobIcon(job.type);

              return (
                <div
                  key={job.id}
                  className="p-3.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-900/40 flex flex-col gap-2 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {job.title}
                        </h4>
                        <p className="text-[10px] text-neutral-500 truncate">
                          {job.projectTitle} • {job.type.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {job.status === 'running' && (
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="p-1 rounded text-neutral-400 hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                          title="Pause / Cancel Job"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {(job.status === 'paused' || job.status === 'failed') && (
                        <button
                          onClick={() => retryJob(job.id)}
                          className="p-1 rounded text-neutral-400 hover:text-purple-600 hover:bg-purple-500/10 transition-colors"
                          title="Retry Job"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => removeJob(job.id)}
                        className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span
                        className={
                          job.status === 'completed'
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : job.status === 'running'
                            ? 'text-purple-600 dark:text-purple-400 font-semibold'
                            : job.status === 'failed'
                            ? 'text-red-600 dark:text-red-400 font-semibold'
                            : 'text-neutral-500'
                        }
                      >
                        {job.status.toUpperCase()} ({job.progress}%)
                      </span>
                      <span className="text-neutral-400">
                        {job.status === 'running' && job.estimatedSecRemaining !== undefined
                          ? `~${job.estimatedSecRemaining}s remaining`
                          : job.status === 'completed'
                          ? `Elapsed: ${job.elapsedSec}s`
                          : ''}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          job.status === 'completed'
                            ? 'bg-emerald-500'
                            : job.status === 'failed'
                            ? 'bg-red-500'
                            : job.status === 'paused'
                            ? 'bg-amber-500'
                            : 'bg-purple-600'
                        }`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>

                  {job.outputUrl && job.status === 'completed' && (
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60 text-[10px]">
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready for preview / download</span>
                      </span>
                      <a
                        href={job.outputUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 hover:underline flex items-center gap-1"
                      >
                        <span>View Asset</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between text-xs">
          <span className="text-neutral-400 font-mono text-[11px]">
            Workers: Multi-threaded Web Worker Pool
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
