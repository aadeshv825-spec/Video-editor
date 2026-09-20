import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  Check, 
  Wifi, 
  Smartphone, 
  ShieldCheck, 
  Sliders, 
  FolderArchive,
  Database,
  Sparkles,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BackupService } from '../../services/backup/backupService';
import { BackupSettings, CloudStorageUsage } from '../../types';

interface CloudStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPro?: () => void;
}

export const CloudStorageModal: React.FC<CloudStorageModalProps> = ({
  isOpen,
  onClose,
  onOpenPro,
}) => {
  const { isPro } = useAuth();

  const [usage, setUsage] = useState<CloudStorageUsage>(() =>
    BackupService.getStorageUsage(isPro)
  );

  const [settings, setSettings] = useState<BackupSettings>(() =>
    BackupService.getSettings()
  );

  const [notice, setNotice] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [confirmClearCache, setConfirmClearCache] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsage(BackupService.getStorageUsage(isPro));
      setSettings(BackupService.getSettings());
      setConfirmEmptyTrash(false);
      setConfirmClearCache(false);
    }
  }, [isOpen, isPro]);

  if (!isOpen) return null;

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleUpdateSetting = <K extends keyof BackupSettings>(
    key: K,
    value: BackupSettings[K]
  ) => {
    const updated = BackupService.saveSettings({ [key]: value });
    setSettings(updated);
    notify('Backup preferences saved.');
  };

  const handleEmptyTrash = () => {
    setIsCleaning(true);
    setTimeout(() => {
      const updated = BackupService.emptyTrash(isPro);
      setUsage(updated);
      setIsCleaning(false);
      setConfirmEmptyTrash(false);
      notify('Vault trash purged successfully.');
    }, 600);
  };

  const handleClearCache = () => {
    setIsCleaning(true);
    setTimeout(() => {
      const updated = BackupService.clearDraftsCache(isPro);
      setUsage(updated);
      setIsCleaning(false);
      setConfirmClearCache(false);
      notify('Local caches, render scratch files and temp media cleared.');
    }, 600);
  };

  const totalUsedBytes =
    usage.usedProjectsBytes +
    usage.usedBackupsBytes +
    usage.usedGeneratedAssetsBytes +
    usage.usedTrashBytes;

  const usedGb = (totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const totalGb = (usage.totalQuotaBytes / (1024 * 1024 * 1024)).toFixed(0);
  const percentUsed = Math.min(100, Math.round((totalUsedBytes / usage.totalQuotaBytes) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div 
        id="cloud-storage-modal-card"
        className="w-full max-w-2xl bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto text-xs"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                Cloud Vault & Automated Backup Manager
              </h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Encrypted multi-node storage, automatic snapshot retention, and storage cleanup.
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

        {/* Feedback Alert */}
        {notice && (
          <div className="p-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-mono text-[11px] flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Quota Meter */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
              <span>Encrypted Cloud Quota</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                {isPro ? '100 GB Pro Tier' : '15 GB Starter Tier'}
              </span>
            </div>
            <span className="font-mono text-[11px] text-neutral-500">
              {usedGb} GB used of {totalGb} GB ({percentUsed}%)
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex">
            <div 
              style={{ width: `${Math.min(100, Math.round((usage.usedProjectsBytes / usage.totalQuotaBytes) * 100))}%` }} 
              className="bg-blue-500 h-full transition-all" 
              title="Projects"
            />
            <div 
              style={{ width: `${Math.min(100, Math.round((usage.usedBackupsBytes / usage.totalQuotaBytes) * 100))}%` }} 
              className="bg-emerald-500 h-full transition-all" 
              title="Backups"
            />
            <div 
              style={{ width: `${Math.min(100, Math.round((usage.usedGeneratedAssetsBytes / usage.totalQuotaBytes) * 100))}%` }} 
              className="bg-purple-500 h-full transition-all" 
              title="AI Assets"
            />
            <div 
              style={{ width: `${Math.min(100, Math.round((usage.usedTrashBytes / usage.totalQuotaBytes) * 100))}%` }} 
              className="bg-amber-500 h-full transition-all" 
              title="Trash"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px] text-neutral-600 dark:text-neutral-400">
            <div className="p-2 rounded-lg bg-white dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Projects</span>
              <div className="font-bold text-xs mt-1 text-neutral-900 dark:text-neutral-100">
                {(usage.usedProjectsBytes / (1024 * 1024 * 1024)).toFixed(2)} GB
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Backups</span>
              <div className="font-bold text-xs mt-1 text-neutral-900 dark:text-neutral-100">
                {(usage.usedBackupsBytes / (1024 * 1024)).toFixed(0)} MB
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> AI Assets</span>
              <div className="font-bold text-xs mt-1 text-neutral-900 dark:text-neutral-100">
                {(usage.usedGeneratedAssetsBytes / (1024 * 1024 * 1024)).toFixed(2)} GB
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Trash Vault</span>
              <div className="font-bold text-xs mt-1 text-neutral-900 dark:text-neutral-100">
                {(usage.usedTrashBytes / (1024 * 1024)).toFixed(0)} MB
              </div>
            </div>
          </div>
        </div>

        {/* Cleanup Tools */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3">
          <div className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-[10px] uppercase">
            Storage Hygiene & Cleanup Utilities
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Purge Trash */}
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820] flex flex-col justify-between">
              <div>
                <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Purge Vault Trash</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Permanently erase deleted projects, drafts and media in trash ({(usage.usedTrashBytes / (1024 * 1024)).toFixed(0)} MB).
                </p>
              </div>

              <div className="pt-3">
                {!confirmEmptyTrash ? (
                  <button
                    onClick={() => setConfirmEmptyTrash(true)}
                    disabled={usage.usedTrashBytes === 0 || isCleaning}
                    className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-lg text-[11px] disabled:opacity-40"
                  >
                    Empty Trash
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleEmptyTrash}
                      disabled={isCleaning}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px]"
                    >
                      Confirm Empty
                    </button>
                    <button
                      onClick={() => setConfirmEmptyTrash(false)}
                      className="px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Clear Render Cache */}
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820] flex flex-col justify-between">
              <div>
                <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-purple-500" />
                  <span>Clear Cache & Drafts</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Purge cached proxy files, waveform audio scratch buffers, and temporary draft revisions.
                </p>
              </div>

              <div className="pt-3">
                {!confirmClearCache ? (
                  <button
                    onClick={() => setConfirmClearCache(true)}
                    disabled={isCleaning}
                    className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg text-[11px]"
                  >
                    Clear Caches
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearCache}
                      disabled={isCleaning}
                      className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold rounded-lg text-[11px]"
                    >
                      Confirm Clear
                    </button>
                    <button
                      onClick={() => setConfirmClearCache(false)}
                      className="px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Auto Backup Controls */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-[10px] uppercase">
              Automated Cloud Backup Policies
            </span>
            <span className="font-mono text-[10px] text-neutral-400">
              Last Backup: {new Date(settings.lastBackupTimestamp || Date.now()).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-3">
            {/* Auto Backup Switch */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Continuous Project Auto-Backup
                </div>
                <div className="text-[11px] text-neutral-500">
                  Automatically write project state snapshots to cloud vault during editing sessions.
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateSetting('autoBackupEnabled', !settings.autoBackupEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.autoBackupEnabled ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full transition-transform absolute top-1 bg-white dark:bg-neutral-900 ${
                    settings.autoBackupEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Network Constraints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820]">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-neutral-500" />
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-[11px]">
                      Wi-Fi Only Sync
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Pause uploads on cellular metered connections
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.wifiOnly}
                  onChange={e => handleUpdateSetting('wifiOnly', e.target.checked)}
                  className="rounded border-neutral-300 dark:border-neutral-700"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820]">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-neutral-500" />
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-[11px]">
                      Include Original Media
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Sync full 4K source footage (heavy storage)
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.backupOriginalMedia}
                  onChange={e => handleUpdateSetting('backupOriginalMedia', e.target.checked)}
                  className="rounded border-neutral-300 dark:border-neutral-700"
                />
              </div>
            </div>

            {/* Granular What to Backup */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <span className="font-mono text-[10px] uppercase text-neutral-400 block mb-2">
                What to Backup in Snapshots:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#151820] border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.backupProjects}
                    onChange={e => handleUpdateSetting('backupProjects', e.target.checked)}
                    className="rounded"
                  />
                  <span>Projects</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#151820] border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.backupDrafts}
                    onChange={e => handleUpdateSetting('backupDrafts', e.target.checked)}
                    className="rounded"
                  />
                  <span>Drafts</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#151820] border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.backupPresets}
                    onChange={e => handleUpdateSetting('backupPresets', e.target.checked)}
                    className="rounded"
                  />
                  <span>Presets</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#151820] border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.backupSettings}
                    onChange={e => handleUpdateSetting('backupSettings', e.target.checked)}
                    className="rounded"
                  />
                  <span>Settings</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {!isPro && onOpenPro && (
            <button
              onClick={() => {
                onClose();
                onOpenPro();
              }}
              className="text-neutral-900 dark:text-white font-medium hover:underline text-xs"
            >
              Need 100 GB vault storage? Upgrade to Pro →
            </button>
          )}
          <div className="ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold rounded-lg text-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
