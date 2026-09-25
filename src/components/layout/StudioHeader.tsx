import React from 'react';
import { 
  Clapperboard, 
  Sparkles, 
  Settings as SettingsIcon, 
  User as UserIcon, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Laptop, 
  ArrowLeft,
  Save,
  Check,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Bell,
  HelpCircle,
  Zap,
  Database,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectContext';
import { useSettings } from '../../context/SettingsContext';
import { useNotifications } from '../../context/NotificationContext';
import { StudioType } from '../../types';

interface StudioHeaderProps {
  currentView: 'dashboard' | 'projects' | 'settings' | 'owner' | StudioType;
  onNavigate: (view: 'dashboard' | 'projects' | 'settings' | 'owner' | StudioType) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenModelRouter: () => void;
  onOpenPro: () => void;
  onOpenCloudStorage: () => void;
  onOpenNotifications: () => void;
  onOpenHelp?: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenProfile,
  onOpenModelRouter,
  onOpenPro,
  onOpenCloudStorage,
  onOpenNotifications,
  onOpenHelp,
}) => {
  const { currentUser, isOwner, isPro } = useAuth();
  const { 
    activeProject, 
    closeProject, 
    isAutosaving, 
    lastAutosavedTime, 
    triggerManualAutosave,
    syncStatus,
    syncProjectNow,
    isOnline
  } = useProjects();
  const { theme, setTheme, resolvedTheme } = useSettings();
  const { unreadCount } = useNotifications();

  const handleLogoClick = () => {
    if (activeProject) {
      closeProject();
    }
    onNavigate('dashboard');
  };

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const renderSyncIndicator = () => {
    if (!isOnline || syncStatus === 'offline') {
      return (
        <button
          onClick={onOpenCloudStorage}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-mono hover:bg-neutral-300 transition-colors"
          title="Offline mode: changes staged locally until connection is restored"
        >
          <CloudOff className="w-3 h-3 text-neutral-400" />
          <span className="hidden sm:inline">Offline (Cached)</span>
        </button>
      );
    }

    if (syncStatus === 'syncing') {
      return (
        <div 
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono"
          title="Synchronizing project state with studio server"
        >
          <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
          <span className="hidden sm:inline">Syncing...</span>
        </div>
      );
    }

    if (syncStatus === 'conflict') {
      return (
        <button
          onClick={onOpenCloudStorage}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold hover:bg-amber-500/30 transition-colors"
          title="Cloud sync conflict detected between devices! Click to resolve non-destructively."
        >
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>Conflict Detected</span>
        </button>
      );
    }

    if (syncStatus === 'local_only') {
      return (
        <button
          onClick={onOpenCloudStorage}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 text-[10px] font-mono hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          title="Local Workspace Active. Centralized multi-device cloud database is SETUP_REQUIRED."
        >
          <HardDrive className="w-3 h-3 text-neutral-500" />
          <span className="hidden sm:inline">Local Only</span>
        </button>
      );
    }

    if (syncStatus === 'pending') {
      return (
        <button
          onClick={() => syncProjectNow()}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-[10px] font-mono hover:bg-yellow-500/20 transition-colors"
          title="Pending synchronization. Click to trigger immediate sync."
        >
          <RefreshCw className="w-3 h-3 text-yellow-500" />
          <span className="hidden sm:inline">Sync Pending</span>
        </button>
      );
    }

    if (syncStatus === 'cloud_unavailable' || syncStatus === 'failed') {
      return (
        <button
          onClick={() => syncProjectNow()}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[10px] font-mono hover:bg-rose-500/20 transition-colors"
          title="Cloud endpoint unreachable. Local workspace preserved safely."
        >
          <CloudOff className="w-3 h-3 text-rose-500" />
          <span className="hidden sm:inline">Cloud Unavailable</span>
        </button>
      );
    }

    // Only shown when server explicitly verified and confirmed persistence
    return (
      <button
        onClick={() => syncProjectNow()}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono hover:bg-emerald-500/20 transition-colors"
        title="Authoritative server synchronization confirmed. Click to check for updates."
      >
        <Cloud className="w-3 h-3 text-emerald-500" />
        <span className="hidden sm:inline">Synced</span>
      </button>
    );
  };

  return (
    <header
      id="studio-main-header"
      className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800/80 bg-white/95 dark:bg-studio-surface/95 backdrop-blur-md transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left branding & context */}
        <div className="flex items-center gap-3">
          {currentView !== 'dashboard' && (
            <button
              id="header-back-button"
              onClick={handleLogoClick}
              className="p-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <button
            id="header-logo-brand"
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-7 h-7 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-xs tracking-tighter shadow-sm">
              AI
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
                Creative Studio
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono leading-none">
                Foundation v1.0
              </span>
            </div>
          </button>

          {/* Active project pill */}
          {activeProject && (
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-neutral-200 dark:border-neutral-800 text-xs">
              <span className="text-neutral-400">Project:</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[160px]">
                {activeProject.title}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                {activeProject.type}
              </span>
              
              {/* Autosave badge */}
              <button
                id="header-autosave-trigger"
                onClick={triggerManualAutosave}
                disabled={isAutosaving}
                className="flex items-center gap-1 ml-2 text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                title="Click to trigger manual autosave"
              >
                {isAutosaving ? (
                  <>
                    <Save className="w-3 h-3 animate-spin text-amber-500" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Autosaved {lastAutosavedTime || 'now'}</span>
                  </>
                )}
              </button>

              {/* Cloud Sync Status Indicator */}
              <div className="ml-1">
                {renderSyncIndicator()}
              </div>
            </div>
          )}
        </div>

        {/* Right action items */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Cloud Storage Vault Pill */}
          <button
            id="header-cloud-storage-btn"
            onClick={onOpenCloudStorage}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 transition-colors"
            title="Manage Cloud Storage, Automatic Backup & Local Cache"
          >
            <Cloud className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span className="hidden lg:inline">Cloud Vault</span>
          </button>

          {/* Model Router shortcut */}
          <button
            id="header-model-router-btn"
            onClick={onOpenModelRouter}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 transition-colors"
            title="Configure AI Model Registry & Router"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span>AI Router</span>
          </button>

          {/* Real AI Credits Pill */}
          <button
            id="header-credits-pill"
            onClick={onOpenPro}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700/80 transition-colors"
            title="Real AI Credit Ledger & Entitlements"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
            <span className="font-mono font-medium">
              {currentUser && typeof currentUser.aiCredits === 'number' && !isNaN(currentUser.aiCredits)
                ? currentUser.aiCredits.toLocaleString()
                : '0'}
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {currentUser && typeof currentUser.aiCredits === 'number' && !isNaN(currentUser.aiCredits)
                ? (currentUser.aiCredits === 1 ? 'Credit' : 'Credits')
                : 'Credits unavailable'}
            </span>
            {isOwner ? (
              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold uppercase tracking-wider">
                Owner
              </span>
            ) : isPro ? (
              <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold uppercase tracking-wider">
                Pro
              </span>
            ) : (
              <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-semibold uppercase tracking-wider">
                Free
              </span>
            )}
          </button>

          {/* Notification Bell */}
          <button
            id="header-notifications-btn"
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-studio-surface" />
            )}
          </button>

          {/* Theme switcher */}
          <button
            id="header-theme-toggle"
            onClick={cycleTheme}
            className="p-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={`Theme: ${theme} (click to cycle)`}
          >
            {theme === 'system' ? (
              <Laptop className="w-4 h-4" />
            ) : resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          {/* Owner Control Center (Strictly Owner-Only) */}
          {isOwner && (
            <button
              id="header-owner-control-link"
              onClick={() => onNavigate('owner')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${
                currentView === 'owner'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-medium'
                  : 'text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
              }`}
              title="Owner Control Center (Security Tier 0)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Owner Center</span>
            </button>
          )}

          {/* Help & Shortcuts button */}
          {onOpenHelp && (
            <button
              id="header-help-btn"
              onClick={onOpenHelp}
              className="p-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Help, Guides & Shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* Settings button */}
          <button
            id="header-settings-btn"
            onClick={() => onNavigate('settings')}
            className={`p-1.5 rounded-md transition-colors ${
              currentView === 'settings'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Account Profile button */}
          <button
            id="header-account-btn"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs"
            title="Account Profile & Authentication"
          >
            <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-700 dark:text-neutral-200 uppercase">
              {currentUser.name.charAt(0)}
            </div>
            <span className="hidden sm:inline font-medium truncate max-w-[80px]">
              {currentUser.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
