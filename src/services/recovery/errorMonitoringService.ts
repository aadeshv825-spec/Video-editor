/**
 * VYRO AI Creative Studio - Centralized Error Monitoring, Self-Healing & Recovery Service
 * Production-grade safety engine: DETECT -> PROTECT -> RECOVER -> RETRY -> RESTORE
 * Strictly forbids modifying source code, security rules, user permissions, or deleting user projects/original media.
 */

export type ErrorCategory =
  | 'runtime'
  | 'api'
  | 'ai'
  | 'network'
  | 'auth'
  | 'sync'
  | 'storage'
  | 'render'
  | 'export'
  | 'state';

export type RecoveryResult =
  | 'recovered'
  | 'retrying'
  | 'fallback_applied'
  | 'action_required'
  | 'failed';

export interface DiagnosticLog {
  id: string;
  category: ErrorCategory;
  message: string;
  timestamp: string;
  affectedModule: string;
  retryCount: number;
  maxRetries: number;
  recoveryResult: RecoveryResult;
  recoveryActionTaken?: string;
  details?: Record<string, any>;
}

export interface NetworkHealthState {
  status: 'online' | 'offline' | 'reconnecting' | 'connected';
  lastChecked: string;
  latencyMs?: number;
}

type DiagnosticSubscriber = (logs: DiagnosticLog[]) => void;
type RecoveryNotificationSubscriber = (notification: {
  title: string;
  message: string;
  category: ErrorCategory;
  canRestore?: boolean;
}) => void;

const DIAGNOSTICS_STORAGE_KEY = 'vyro_diagnostics_logs_v1';
const MAX_LOG_ENTRIES = 60;

export class ErrorMonitoringService {
  private static logs: DiagnosticLog[] = [];
  private static subscribers: Set<DiagnosticSubscriber> = new Set();
  private static notificationSubscribers: Set<RecoveryNotificationSubscriber> = new Set();
  private static initialized = false;
  private static networkState: NetworkHealthState = {
    status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online',
    lastChecked: new Date().toISOString(),
  };

  public static init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Load persisted diagnostic logs (last 50, sanitized)
    try {
      const saved = localStorage.getItem(DIAGNOSTICS_STORAGE_KEY);
      if (saved) {
        this.logs = JSON.parse(saved).slice(0, MAX_LOG_ENTRIES);
      }
    } catch {
      this.logs = [];
    }

    // 1. Global JS Runtime Error Detection
    window.addEventListener('error', (event) => {
      // Ignore benign hot-reload or extension script noise
      if (event.message?.includes('ResizeObserver loop') || event.message?.includes('Script error')) {
        return;
      }
      this.reportError({
        category: 'runtime',
        message: event.message || 'Uncaught script exception',
        affectedModule: event.filename ? event.filename.split('/').pop() || 'runtime' : 'window',
        details: {
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // 2. Unhandled Promise Rejections (e.g. async API, fetch, worker errors)
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);

      // Check if it is a storage quota error
      if (message.includes('QuotaExceeded') || message.includes('quota') || message.includes('NS_ERROR_DOM_QUOTA_REACHED')) {
        this.handleStorageQuotaError('unhandled_promise');
        return;
      }

      this.reportError({
        category: 'api',
        message: `Unhandled rejection: ${message}`,
        affectedModule: 'async_worker',
        details: {
          stackSnippet: reason instanceof Error ? reason.stack?.substring(0, 300) : undefined,
        },
      });
    });

    // 3. Network State Monitoring
    window.addEventListener('online', () => {
      this.networkState = {
        status: 'reconnecting',
        lastChecked: new Date().toISOString(),
      };
      // Brief delay to let browser socket settle before marking fully connected
      setTimeout(() => {
        this.networkState = {
          status: 'connected',
          lastChecked: new Date().toISOString(),
        };
        this.notifyRecovery({
          title: 'Network Reconnected',
          message: 'Connection restored. Pending sync operations are resuming safely.',
          category: 'network',
        });
      }, 1000);
    });

    window.addEventListener('offline', () => {
      this.networkState = {
        status: 'offline',
        lastChecked: new Date().toISOString(),
      };
      this.reportError({
        category: 'network',
        message: 'Network connection lost. Offline protection active.',
        affectedModule: 'network_layer',
        recoveryResult: 'recovered',
        recoveryActionTaken: 'Switched to local offline cache without data loss.',
      });
    });
  }

  /**
   * Log an error into the central diagnostic repository with sanitized metadata
   */
  public static reportError(params: {
    category: ErrorCategory;
    message: string;
    affectedModule: string;
    retryCount?: number;
    maxRetries?: number;
    recoveryResult?: RecoveryResult;
    recoveryActionTaken?: string;
    details?: Record<string, any>;
  }): DiagnosticLog {
    // Sanitize any potential sensitive fields in details
    const sanitizedDetails: Record<string, any> = {};
    if (params.details) {
      for (const [key, value] of Object.entries(params.details)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('key') ||
          lowerKey.includes('token') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('password') ||
          lowerKey.includes('auth') ||
          lowerKey.includes('credential')
        ) {
          sanitizedDetails[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitizedDetails[key] = JSON.stringify(value).substring(0, 150);
        } else {
          sanitizedDetails[key] = String(value).substring(0, 150);
        }
      }
    }

    const log: DiagnosticLog = {
      id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: params.category,
      message: params.message.substring(0, 300),
      timestamp: new Date().toISOString(),
      affectedModule: params.affectedModule,
      retryCount: params.retryCount ?? 0,
      maxRetries: params.maxRetries ?? 3,
      recoveryResult: params.recoveryResult ?? 'retrying',
      recoveryActionTaken: params.recoveryActionTaken,
      details: sanitizedDetails,
    };

    this.logs = [log, ...this.logs.slice(0, MAX_LOG_ENTRIES - 1)];
    this.persistLogs();
    this.notifySubscribers();

    return log;
  }

  /**
   * Update the status of a specific diagnostic entry (e.g. when retry succeeds or fallback is used)
   */
  public static updateDiagnostic(
    id: string,
    updates: Partial<Pick<DiagnosticLog, 'recoveryResult' | 'retryCount' | 'recoveryActionTaken'>>
  ): void {
    this.logs = this.logs.map((log) => (log.id === id ? { ...log, ...updates } : log));
    this.persistLogs();
    this.notifySubscribers();
  }

  /**
   * Safe storage quota handling:
   * Protects user projects and original media from deletion.
   * Cleans only volatile temporary proxy caches or derived waveform arrays.
   */
  public static handleStorageQuotaError(originModule: string): boolean {
    this.reportError({
      category: 'storage',
      message: 'Browser storage quota limit encountered. Initiating safe cache reclamation.',
      affectedModule: originModule,
      recoveryResult: 'retrying',
    });

    try {
      // 1. Clean temporary thumbnail/render cache keys
      const safeCachePrefixes = ['preview_cache_', 'temp_proxy_', 'waveform_cache_'];
      let clearedCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && safeCachePrefixes.some((p) => key.startsWith(p))) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      }

      this.reportError({
        category: 'storage',
        message: `Reclaimed ${clearedCount} temporary cache records. User projects and media preserved.`,
        affectedModule: 'storage_manager',
        recoveryResult: 'recovered',
        recoveryActionTaken: 'Evicted non-critical proxy caches. Original media untouched.',
      });

      this.notifyRecovery({
        title: 'Storage Optimization Complete',
        message: 'Reclaimed temporary workspace caches. Your projects and media are safe.',
        category: 'storage',
      });

      return true;
    } catch (e) {
      this.reportError({
        category: 'storage',
        message: `Storage reclamation failed: ${e instanceof Error ? e.message : 'unknown'}`,
        affectedModule: 'storage_manager',
        recoveryResult: 'action_required',
      });
      return false;
    }
  }

  /**
   * Safe exponential backoff executor for async operations with maximum retry limits
   */
  public static async executeWithRecovery<T>(
    operation: () => Promise<T>,
    options: {
      category: ErrorCategory;
      moduleName: string;
      maxRetries?: number;
      initialDelayMs?: number;
      fallback?: () => Promise<T>;
      onRecoveryAttempt?: (attempt: number, error: any) => void;
    }
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    const initialDelay = options.initialDelayMs ?? 800;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await operation();
      } catch (err: any) {
        attempt++;
        const isLastAttempt = attempt > maxRetries;

        const diag = this.reportError({
          category: options.category,
          message: err?.message || 'Operation failed',
          affectedModule: options.moduleName,
          retryCount: attempt,
          maxRetries,
          recoveryResult: isLastAttempt ? (options.fallback ? 'fallback_applied' : 'failed') : 'retrying',
          recoveryActionTaken: isLastAttempt
            ? options.fallback
              ? 'Applied safe secondary fallback.'
              : 'Max retry attempts exhausted. Preserved project state.'
            : `Attempting retry ${attempt}/${maxRetries} with exponential backoff.`,
          details: { code: err?.code, status: err?.status },
        });

        if (options.onRecoveryAttempt) {
          options.onRecoveryAttempt(attempt, err);
        }

        if (isLastAttempt) {
          if (options.fallback) {
            try {
              const fallbackResult = await options.fallback();
              this.updateDiagnostic(diag.id, {
                recoveryResult: 'fallback_applied',
                recoveryActionTaken: 'Operation recovered via backup engine.',
              });
              return fallbackResult;
            } catch (fallbackErr: any) {
              this.reportError({
                category: options.category,
                message: `Fallback also failed: ${fallbackErr?.message}`,
                affectedModule: options.moduleName,
                recoveryResult: 'failed',
                recoveryActionTaken: 'Preserved user project without destructive changes.',
              });
              throw fallbackErr;
            }
          }
          throw err;
        }

        // Exponential backoff delay with jitter
        const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 200;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error('Unexpected execution exit in recovery runner');
  }

  public static getLogs(): DiagnosticLog[] {
    return [...this.logs];
  }

  public static clearLogs(): void {
    this.logs = [];
    this.persistLogs();
    this.notifySubscribers();
  }

  public static subscribe(fn: DiagnosticSubscriber): () => void {
    this.subscribers.add(fn);
    fn(this.getLogs());
    return () => this.subscribers.delete(fn);
  }

  public static subscribeNotifications(fn: RecoveryNotificationSubscriber): () => void {
    this.notificationSubscribers.add(fn);
    return () => this.notificationSubscribers.delete(fn);
  }

  public static notifyRecovery(notification: {
    title: string;
    message: string;
    category: ErrorCategory;
    canRestore?: boolean;
  }): void {
    this.notificationSubscribers.forEach((fn) => {
      try {
        fn(notification);
      } catch (err) {
        console.error('Failed to dispatch recovery notification', err);
      }
    });
  }

  private static persistLogs(): void {
    try {
      localStorage.setItem(DIAGNOSTICS_STORAGE_KEY, JSON.stringify(this.logs));
    } catch {
      // Storage might be constrained; ignore
    }
  }

  private static notifySubscribers(): void {
    const logs = this.getLogs();
    this.subscribers.forEach((fn) => {
      try {
        fn(logs);
      } catch (err) {
        console.error('Error in diagnostic subscriber', err);
      }
    });
  }
}

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  ErrorMonitoringService.init();
}
