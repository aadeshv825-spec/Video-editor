import { Project, ProjectConflict, SyncStatus } from '../../types';

const DEVICE_ID_KEY = 'vyro_studio_device_id_v1';

export class SyncEngine {
  private static status: SyncStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'local_only';
  private static listeners: Set<(status: SyncStatus) => void> = new Set();
  private static activeConflict: ProjectConflict | null = null;
  private static initialized = false;
  private static cachedDeviceId: string | null = null;

  public static getDeviceId(): string {
    if (this.cachedDeviceId) return this.cachedDeviceId;
    if (typeof window === 'undefined') return 'server-node';

    try {
      let id = localStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = `dev-${navigator.platform?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'web'}-${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem(DEVICE_ID_KEY, id);
      }
      this.cachedDeviceId = id;
      return id;
    } catch {
      return 'web-client';
    }
  }

  public static init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    window.addEventListener('online', () => {
      this.setStatus('syncing');
      // Check system status to set accurate baseline
      this.checkCloudStatus();
    });

    window.addEventListener('offline', () => {
      this.setStatus('offline');
    });

    this.checkCloudStatus();
  }

  public static async checkCloudStatus(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    try {
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        if (data.persistence?.centralizedDatabase === 'READY') {
          // Central database live
          this.setStatus('synced');
        } else {
          // Central database is SETUP_REQUIRED - accurately display local_only
          this.setStatus('local_only');
        }
      } else {
        this.setStatus('cloud_unavailable');
      }
    } catch {
      this.setStatus('cloud_unavailable');
    }
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

  /**
   * Authoritative sync against the server API.
   * Never fabricates "synced" status if cloud DB is not configured or server failed.
   */
  public static async syncProject(
    project: Project,
    userId?: string
  ): Promise<{ status: SyncStatus; conflict?: ProjectConflict; projectVersion?: number; revisionId?: string }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return { status: 'offline' };
    }

    this.setStatus('syncing');
    const deviceId = this.getDeviceId();
    const effectiveUserId = userId || project.ownerId || 'usr-creator-02';

    try {
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': effectiveUserId,
        },
        body: JSON.stringify({
          projectId: project.id,
          baseVersion: project.cloudVersion || 1,
          updatedAt: project.updatedAt,
          deviceId,
          revisionId: `rev-${Date.now().toString(36)}`,
          projectData: {
            ...project,
            ownerId: effectiveUserId,
          },
        }),
      });

      if (res.status === 409) {
        // Safe concurrency conflict detected by server!
        const data = await res.json();
        const conflict: ProjectConflict = data.conflict || {
          projectId: project.id,
          projectTitle: project.title,
          localVersion: project.cloudVersion || 1,
          localUpdatedAt: project.updatedAt,
          cloudVersion: (project.cloudVersion || 1) + 1,
          cloudUpdatedAt: new Date().toISOString(),
          deviceOrigin: 'Remote Studio Node',
          suggestedAction: 'create_copy',
        };
        this.activeConflict = conflict;
        this.setStatus('conflict');
        return { status: 'conflict', conflict };
      }

      if (!res.ok) {
        this.setStatus('failed');
        return { status: 'failed' };
      }

      const result = await res.json();

      // Only display 'synced' if server explicitly confirmed database is configured!
      // Otherwise, accurately mark 'local_only' (cloud DB SETUP_REQUIRED).
      const finalStatus: SyncStatus = result.status === 'synced' ? 'synced' : 'local_only';
      this.setStatus(finalStatus);

      return {
        status: finalStatus,
        projectVersion: result.projectVersion,
        revisionId: result.revisionId,
      };
    } catch (err) {
      console.warn('Network sync encountered transient interruption; local storage maintained.', err);
      this.setStatus('cloud_unavailable');
      return { status: 'cloud_unavailable' };
    }
  }

  /**
   * Pulls remote changes committed from other devices.
   */
  public static async pullProjects(
    lastSyncedAt?: string,
    userId?: string
  ): Promise<{ projects: Project[]; cloudDatabaseStatus: 'READY' | 'SETUP_REQUIRED' } | null> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return null;
    }

    try {
      const res = await fetch('/api/sync/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || 'usr-creator-02',
        },
        body: JSON.stringify({
          lastSyncedAt,
          clientDeviceId: this.getDeviceId(),
        }),
      });

      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Safe conflict resolution communicating with server endpoint.
   */
  public static async resolveConflictOnServer(
    projectId: string,
    action: 'keep_local' | 'keep_remote' | 'create_copy',
    localProject: Project,
    userId?: string
  ): Promise<{ success: boolean; project?: Project }> {
    try {
      const res = await fetch('/api/sync/resolve-conflict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || localProject.ownerId || 'usr-creator-02',
        },
        body: JSON.stringify({
          projectId,
          action,
          localProjectData: localProject,
        }),
      });

      if (!res.ok) return { success: false };
      const data = await res.json();
      this.clearConflict();
      return { success: true, project: data.project };
    } catch {
      this.clearConflict();
      return { success: false };
    }
  }

  public static getActiveConflict(): ProjectConflict | null {
    return this.activeConflict;
  }

  public static clearConflict(): void {
    this.activeConflict = null;
    this.setStatus('local_only');
  }
}
