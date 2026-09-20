import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { RenderQueueJob } from '../types/videoEditor';
import { ErrorMonitoringService } from '../services/recovery/errorMonitoringService';

interface RenderQueueContextType {
  jobs: RenderQueueJob[];
  addJob: (params: {
    title: string;
    projectTitle: string;
    type: RenderQueueJob['type'];
    metadata?: Record<string, any>;
  }) => string;
  cancelJob: (jobId: string) => void;
  retryJob: (jobId: string) => void;
  removeJob: (jobId: string) => void;
  clearCompletedJobs: () => void;
  isQueueActive: boolean;
  activeJobCount: number;
}

const RenderQueueContext = createContext<RenderQueueContextType | undefined>(undefined);

const INITIAL_RENDER_JOBS: RenderQueueJob[] = [
  {
    id: 'job-init-1',
    title: 'ProRes 422 High Quality Master Render',
    projectTitle: 'Cinematic Dawn Commercial',
    type: 'export',
    status: 'completed',
    progress: 100,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    elapsedSec: 42,
    outputUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    metadata: { resolution: '4K UHD', codec: 'H.264', bitrate: '45 Mbps' },
  },
];

const STORAGE_RENDER_QUEUE_KEY = 'ai_creative_studio_render_queue_v1';

export const RenderQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<RenderQueueJob[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RENDER_QUEUE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_RENDER_JOBS;
    } catch {
      return INITIAL_RENDER_JOBS;
    }
  });

  const intervalRef = useRef<number | null>(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RENDER_QUEUE_KEY, JSON.stringify(jobs));
    } catch {
      ErrorMonitoringService.handleStorageQuotaError('RenderQueueContext');
    }
  }, [jobs]);

  // Non-blocking background worker ticker that advances running/queued jobs smoothly
  useEffect(() => {
    const runningJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued');
    if (runningJobs.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!intervalRef.current) {
      intervalRef.current = window.setInterval(() => {
        setJobs(prev => {
          return prev.map(job => {
            if (job.status === 'queued') {
              // Transition to running
              return {
                ...job,
                status: 'running',
                progress: 5,
                estimatedSecRemaining: 30,
              };
            }

            if (job.status === 'running') {
              const delta = Math.floor(Math.random() * 8) + 4;
              const nextProgress = Math.min(100, job.progress + delta);
              const elapsedSec = job.elapsedSec + 1;
              const estRemaining =
                nextProgress >= 100
                  ? 0
                  : Math.max(1, Math.round(((100 - nextProgress) / nextProgress) * elapsedSec));

              if (nextProgress >= 100) {
                return {
                  ...job,
                  status: 'completed',
                  progress: 100,
                  elapsedSec,
                  estimatedSecRemaining: 0,
                  outputUrl:
                    job.outputUrl ||
                    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
                };
              }

              return {
                ...job,
                progress: nextProgress,
                elapsedSec,
                estimatedSecRemaining: estRemaining,
              };
            }

            return job;
          });
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobs]);

  const addJob = useCallback(
    (params: {
      title: string;
      projectTitle: string;
      type: RenderQueueJob['type'];
      metadata?: Record<string, any>;
    }): string => {
      const newId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newJob: RenderQueueJob = {
        id: newId,
        title: params.title,
        projectTitle: params.projectTitle,
        type: params.type,
        status: 'queued',
        progress: 0,
        createdAt: new Date().toISOString(),
        elapsedSec: 0,
        estimatedSecRemaining: 25,
        metadata: params.metadata,
      };

      setJobs(prev => [newJob, ...prev]);
      return newId;
    },
    []
  );

  const cancelJob = useCallback((jobId: string) => {
    setJobs(prev =>
      prev.map(j => (j.id === jobId ? { ...j, status: 'paused', errorMessage: 'Cancelled by user' } : j))
    );
  }, []);

  const retryJob = useCallback((jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      ErrorMonitoringService.reportError({
        category: 'render',
        message: `Retrying export/render job "${job.title}" for project "${job.projectTitle}".`,
        affectedModule: 'RenderQueueContext',
        recoveryResult: 'retrying',
        recoveryActionTaken: 'Re-enqueued render task from safe starting state.',
      });
    }

    setJobs(prev =>
      prev.map(j =>
        j.id === jobId
          ? {
              ...j,
              status: 'queued',
              progress: 0,
              errorMessage: undefined,
              elapsedSec: 0,
            }
          : j
      )
    );
  }, [jobs]);

  const removeJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
  }, []);

  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => prev.filter(j => j.status !== 'completed'));
  }, []);

  const activeJobCount = jobs.filter(j => j.status === 'running' || j.status === 'queued').length;
  const isQueueActive = activeJobCount > 0;

  return (
    <RenderQueueContext.Provider
      value={{
        jobs,
        addJob,
        cancelJob,
        retryJob,
        removeJob,
        clearCompletedJobs,
        isQueueActive,
        activeJobCount,
      }}
    >
      {children}
    </RenderQueueContext.Provider>
  );
};

export const useRenderQueue = () => {
  const context = useContext(RenderQueueContext);
  if (!context) throw new Error('useRenderQueue must be used within a RenderQueueProvider');
  return context;
};
