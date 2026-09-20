import { BackupSettings, CloudStorageUsage } from '../../types';

const BACKUP_SETTINGS_KEY = 'ai_creative_studio_backup_settings_v1';
const STORAGE_STATS_KEY = 'ai_creative_studio_storage_stats_v1';

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  autoBackupEnabled: true,
  wifiOnly: true,
  mobileDataAllowed: false,
  backupProjects: true,
  backupSettings: true,
  backupPresets: true,
  backupDrafts: true,
  backupOriginalMedia: false, // Distinguish Project Metadata vs Original Heavy Media
  lastBackupTimestamp: new Date().toISOString(),
};

export const DEFAULT_STORAGE_USAGE: CloudStorageUsage = {
  totalQuotaBytes: 15 * 1024 * 1024 * 1024, // 15 GB Free Starter Tier (100 GB Pro)
  usedProjectsBytes: 1.2 * 1024 * 1024 * 1024, // 1.2 GB
  usedBackupsBytes: 850 * 1024 * 1024, // 850 MB
  usedGeneratedAssetsBytes: 2.1 * 1024 * 1024 * 1024, // 2.1 GB
  usedTrashBytes: 420 * 1024 * 1024, // 420 MB
};

export class BackupService {
  public static getSettings(): BackupSettings {
    try {
      const saved = localStorage.getItem(BACKUP_SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse backup settings', e);
    }
    return DEFAULT_BACKUP_SETTINGS;
  }

  public static saveSettings(settings: Partial<BackupSettings>): BackupSettings {
    try {
      const current = this.getSettings();
      const updated: BackupSettings = {
        ...current,
        ...settings,
        lastBackupTimestamp: settings.lastBackupTimestamp || current.lastBackupTimestamp || new Date().toISOString(),
      };
      localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('backup-settings-updated', { detail: updated }));
      return updated;
    } catch (e) {
      console.warn('Failed to persist backup settings', e);
      return this.getSettings();
    }
  }

  public static getStorageUsage(isPro: boolean = false): CloudStorageUsage {
    try {
      const saved = localStorage.getItem(STORAGE_STATS_KEY);
      const quota = isPro ? 100 * 1024 * 1024 * 1024 : 15 * 1024 * 1024 * 1024;
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          totalQuotaBytes: quota,
        };
      }
      return {
        ...DEFAULT_STORAGE_USAGE,
        totalQuotaBytes: quota,
      };
    } catch (e) {
      console.warn('Failed to parse storage usage', e);
    }
    return DEFAULT_STORAGE_USAGE;
  }

  public static emptyTrash(isPro: boolean = false): CloudStorageUsage {
    const usage = this.getStorageUsage(isPro);
    usage.usedTrashBytes = 0;
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(usage));
    window.dispatchEvent(new CustomEvent('storage-stats-updated', { detail: usage }));
    return usage;
  }

  public static clearDraftsCache(isPro: boolean = false): CloudStorageUsage {
    const usage = this.getStorageUsage(isPro);
    usage.usedBackupsBytes = Math.max(100 * 1024 * 1024, usage.usedBackupsBytes - 400 * 1024 * 1024);
    usage.usedGeneratedAssetsBytes = Math.max(500 * 1024 * 1024, usage.usedGeneratedAssetsBytes - 800 * 1024 * 1024);
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(usage));
    window.dispatchEvent(new CustomEvent('storage-stats-updated', { detail: usage }));
    return usage;
  }

  public static clearOrphanedCache(isPro: boolean = false): CloudStorageUsage {
    return this.clearDraftsCache(isPro);
  }
}
