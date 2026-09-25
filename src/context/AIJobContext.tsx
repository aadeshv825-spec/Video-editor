import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AIJob, AIJobStatus, StructuredEditPlan } from '../types/aiDirector';
import { ErrorMonitoringService } from '../services/recovery/errorMonitoringService';
import { CreditLedgerService } from '../services/credits/creditLedgerService';

interface AIJobContextType {
  jobs: AIJob[];
  activeJob: AIJob | null;
  createJob: (params: {
    projectId: string;
    projectTitle: string;
    command: string;
    modelId: string;
    modelName: string;
    provider: string;
    estimatedCredits?: number;
  }) => AIJob;
  updateJobStatus: (
    jobId: string,
    status: AIJobStatus,
    patch?: Partial<AIJob>
  ) => void;
  retryJobWithFallback: (jobId: string, fallbackModelId?: string) => Promise<boolean>;
  attachPlanToJob: (jobId: string, plan: StructuredEditPlan) => void;
  cancelJob: (jobId: string) => void;
  getJobsForProject: (projectId: string) => AIJob[];
  clearJobHistory: () => void;
}

const AIJobContext = createContext<AIJobContextType | undefined>(undefined);
const JOBS_STORAGE_KEY = 'ai_creative_studio_jobs_v1';

export const AIJobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<AIJob[]>(() => {
    try {
      const saved = localStorage.getItem(JOBS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    } catch (e) {
      ErrorMonitoringService.handleStorageQuotaError('AIJobContext');
    }
  }, [jobs]);

  // Timeout Watchdog: detect stuck AI operations (> 60s) safely
  useEffect(() => {
    const watchdogInterval = setInterval(() => {
      const now = Date.now();
      setJobs(prev =>
        prev.map(job => {
          if (
            (job.status === 'ANALYZING' || job.status === 'EXECUTING') &&
            job.startedTime &&
            now - new Date(job.startedTime).getTime() > 65000
          ) {
            ErrorMonitoringService.reportError({
              category: 'ai',
              message: `AI operation timeout for job "${job.command}". Provider response exceeded 65s.`,
              affectedModule: 'AIJobWorker',
              recoveryResult: 'action_required',
              recoveryActionTaken: 'Flagged timeout safely. Preserved original media and timeline.',
            });

            CreditLedgerService.releaseReservation({
              jobId: job.id,
              reason: 'Operation timed out after 65s (safeguard)',
            });

            return {
              ...job,
              status: 'FAILED',
              completedTime: new Date().toISOString(),
              errorInformation: 'Operation timed out. Original project remains untouched. You can retry with a fallback model.',
              actualCreditsUsed: 0, // ensure credits are refunded
            };
          }
          return job;
        })
      );
    }, 10000);

    return () => clearInterval(watchdogInterval);
  }, []);

  const activeJob =
    jobs.find(
      j =>
        j.status === 'ANALYZING' ||
        j.status === 'WAITING_FOR_APPROVAL' ||
        j.status === 'EXECUTING'
    ) || null;

  const createJob = ({
    projectId,
    projectTitle,
    command,
    modelId,
    modelName,
    provider,
    estimatedCredits = 1,
  }: {
    projectId: string;
    projectTitle: string;
    command: string;
    modelId: string;
    modelName: string;
    provider: string;
    estimatedCredits?: number;
  }): AIJob => {
    const newJob: AIJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      projectTitle,
      taskType: 'video_edit',
      command,
      modelId,
      modelName,
      provider,
      status: 'ANALYZING',
      progressPercent: 25,
      createdTime: new Date().toISOString(),
      startedTime: new Date().toISOString(),
      estimatedCredits,
    };

    setJobs(prev => [newJob, ...prev]);
    return newJob;
  };

  const updateJobStatus = useCallback(
    (jobId: string, status: AIJobStatus, patch?: Partial<AIJob>) => {
      setJobs(prev =>
        prev.map(j => {
          if (j.id === jobId) {
            const isFinished = status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED';

            // Diagnostic reporting on failure
            if (status === 'FAILED') {
              ErrorMonitoringService.reportError({
                category: 'ai',
                message: patch?.errorInformation || `AI Provider execution failed on ${j.modelName}`,
                affectedModule: 'AIJobContext',
                recoveryResult: 'action_required',
                recoveryActionTaken: 'Preserved user project state; refunded allocated credits.',
                details: {
                  modelId: j.modelId,
                  provider: j.provider,
                },
              });
            }

            if (status === 'FAILED' || status === 'CANCELLED') {
              CreditLedgerService.releaseReservation({
                jobId,
                reason: patch?.errorInformation || `Job marked as ${status}`,
              });
            }

            return {
              ...j,
              status,
              progressPercent: status === 'COMPLETED' ? 100 : j.progressPercent,
              completedTime: isFinished ? new Date().toISOString() : j.completedTime,
              ...patch,
              // If failed or cancelled, refund credits by ensuring actualCreditsUsed is 0
              ...(status === 'FAILED' || status === 'CANCELLED' ? { actualCreditsUsed: 0 } : {}),
            };
          }
          return j;
        })
      );
    },
    []
  );

  const retryJobWithFallback = async (jobId: string, fallbackModelId?: string): Promise<boolean> => {
    const targetJob = jobs.find(j => j.id === jobId);
    if (!targetJob) return false;

    // Release any lingering reservation from previous attempt to prevent duplicate reservation
    CreditLedgerService.releaseReservation({
      jobId,
      reason: 'Released for retry with compatible fallback engine',
    });

    const chosenModelId = fallbackModelId || (targetJob.modelId === 'gemini-3.1-pro-preview' ? 'gemini-3.8-flash' : 'gemini-3.8-flash');
    const chosenModelName = chosenModelId.includes('flash') ? 'Gemini 3.8 Flash' : 'Gemini 3.1 Pro';

    updateJobStatus(jobId, 'ANALYZING', {
      modelId: chosenModelId,
      modelName: chosenModelName,
      errorInformation: undefined,
      progressPercent: 30,
      startedTime: new Date().toISOString(),
    });

    ErrorMonitoringService.reportError({
      category: 'ai',
      message: `Retrying AI job with compatible fallback engine (${chosenModelName}).`,
      affectedModule: 'AIJobContext',
      recoveryResult: 'retrying',
      recoveryActionTaken: `Switched model from ${targetJob.modelName} to ${chosenModelName}.`,
    });

    return true;
  };

  const attachPlanToJob = (jobId: string, plan: StructuredEditPlan) => {
    setJobs(prev =>
      prev.map(j =>
        j.id === jobId
          ? {
              ...j,
              plan,
              taskType: plan.intent,
              estimatedCredits: plan.estimated_cost_credits,
            }
          : j
      )
    );
  };

  const cancelJob = (jobId: string) => {
    updateJobStatus(jobId, 'CANCELLED', { errorInformation: 'Cancelled by user.' });
  };

  const getJobsForProject = (projectId: string) => {
    return jobs.filter(j => j.projectId === projectId);
  };

  const clearJobHistory = () => {
    setJobs([]);
  };

  return (
    <AIJobContext.Provider
      value={{
        jobs,
        activeJob,
        createJob,
        updateJobStatus,
        retryJobWithFallback,
        attachPlanToJob,
        cancelJob,
        getJobsForProject,
        clearJobHistory,
      }}
    >
      {children}
    </AIJobContext.Provider>
  );
};

export const useAIJobs = () => {
  const context = useContext(AIJobContext);
  if (!context) throw new Error('useAIJobs must be used within an AIJobProvider');
  return context;
};
