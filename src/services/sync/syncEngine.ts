import { Project, ProjectConflict, SyncStatus } from '../../types';

export class SyncEngine {
  private static status: SyncStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced';
  private static listeners: Set<(status: SyncStatus) => void> = new Set();
  private static activeConflict: ProjectConflict | null = null;
  private static initialized = false;

  public static init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    window.addEventListener('online', () => {
      this.setStatus('syncing');
      setTimeout(() => {
        this.setStatus('synced');
      }, 1200);
    });

    window.addEventListener('offline', () => {
      this.setStatus('offline');
    });
  }

  public static getStatus(): SyncStatus {
    return this.status;
  }

  public static setStatus(newStatus: SyncStatus): void {
    this.status = newStatus;
    this.listeners.forEach(fn => fn(newStatus));
  }

  public static subscribe(fn: (status: SyncStatus) => void): () => void {
    this.listeners.add(fn);
    fn(this.status);
    return () => this.listeners.delete(fn);
  }

  public static async syncProject(project: Project): Promise<{ status: SyncStatus; conflict?: ProjectConflict }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return { status: 'offline' };
    }

    this.setStatus('syncing');

    // Simulate network sync latency
    await new Promise(r => setTimeout(r, 600));

    // Detect conflict condition:
    // If project has cloudVersion and updatedAt discrepancy
    if (project.syncStatus === 'conflict') {
      const conflict: ProjectConflict = {
        projectId: project.id,
        projectTitle: project.title,
        localVersion: (project.cloudVersion || 1) + 1,
        localUpdatedAt: project.updatedAt,
        cloudVersion: (project.cloudVersion || 1) + 2,
        cloudUpdatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        deviceOrigin: 'MacBook Pro 16" (Studio Node)',
      };
      this.activeConflict = conflict;
      this.setStatus('conflict');
      return { status: 'conflict', conflict };
    }

    this.setStatus('synced');
    return { status: 'synced' };
  }

  public static getActiveConflict(): ProjectConflict | null {
    return this.activeConflict;
  }

  public static clearConflict(): void {
    this.activeConflict = null;
    this.setStatus('synced');
  }
}
