import React, { useState, useEffect } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FeatureFlagProvider, useFeatureFlags } from './context/FeatureFlagContext';
import { ModelRouterProvider } from './context/ModelRouterContext';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import { AIJobProvider } from './context/AIJobContext';
import { RenderQueueProvider } from './context/RenderQueueContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';

import { ErrorBoundary } from './components/common/ErrorBoundary';
import { StudioHeader } from './components/layout/StudioHeader';
import { MobileNavBar } from './components/layout/MobileNavBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { AIDirectorStudio } from './components/studios/AIDirectorStudio';
import { VideoEditorStudio } from './components/studios/VideoEditorStudio';
import { PhotoStudioStudio } from './components/studios/PhotoStudioStudio';
import { AudioStudioStudio } from './components/studios/AudioStudioStudio';
import { AIToolsStudio } from './components/studios/AIToolsStudio';
import { AIGenerationStudio } from './components/studios/generation/AIGenerationStudio';
import { TemplateStudio } from './components/studios/templates/TemplateStudio';
import { ProjectsView } from './components/projects/ProjectsView';
import { SettingsView } from './components/settings/SettingsView';
import { OwnerControlCenterView } from './components/owner/OwnerControlCenterView';

import { NewProjectModal } from './components/projects/NewProjectModal';
import { ProjectVersionsModal } from './components/projects/ProjectVersionsModal';
import { MediaLibraryModal } from './components/projects/MediaLibraryModal';
import { ExportModal } from './components/export/ExportModal';
import { ModelRouterModal } from './components/model-router/ModelRouterModal';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { SubscriptionModal } from './components/pro/SubscriptionModal';
import { CloudStorageModal } from './components/cloud/CloudStorageModal';
import { SyncConflictModal } from './components/sync/SyncConflictModal';
import { NotificationCenter, NotificationToast } from './components/notifications/NotificationCenter';
import { OnboardingModal, ONBOARDING_STORAGE_KEY } from './components/onboarding/OnboardingModal';
import { HelpAndShortcutsModal } from './components/help/HelpAndShortcutsModal';
import { ProjectRecoveryBanner } from './components/projects/ProjectRecoveryBanner';
import { ErrorMonitoringService } from './services/recovery/errorMonitoringService';
import { StudioType } from './types';
import { WifiOff } from 'lucide-react';

function MainApp() {
  const { 
    activeProject, 
    projects, 
    openProject, 
    createProject, 
    closeProject,
    syncConflict,
    resolveConflict,
    isOnline,
    triggerManualAutosave,
    undoEdit,
    redoEdit,
    canUndo,
    canRedo,
    restoreRecoverySnapshot,
    discardRecoverySnapshot,
  } = useProjects();
  const { isOwner } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags();
  const { addNotification } = useNotifications();

  // Navigation state
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'settings' | 'owner' | StudioType>('dashboard');

  // Modals state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isModelRouterOpen, setIsModelRouterOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProOpen, setIsProOpen] = useState(false);
  const [isCloudStorageOpen, setIsCloudStorageOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    try {
      return !localStorage.getItem(ONBOARDING_STORAGE_KEY);
    } catch {
      return false;
    }
  });

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      // Open Help on '?'
      if (!isInput && e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsHelpOpen(prev => !prev);
        return;
      }

      // Save on Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeProject) {
          triggerManualAutosave();
          addNotification({
            category: 'sync',
            title: 'Project Saved',
            message: `Snapshot saved for "${activeProject.title}".`,
          });
        }
        return;
      }

      // Export on Ctrl+E / Cmd+E
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (activeProject) {
          setIsExportOpen(true);
        }
        return;
      }

      // Undo / Redo
      if (!isInput && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          if (canRedo) redoEdit();
        } else {
          e.preventDefault();
          if (canUndo) undoEdit();
        }
        return;
      }

      if (!isInput && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redoEdit();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProject, canUndo, canRedo, triggerManualAutosave, undoEdit, redoEdit, addNotification]);

  // Self-healing recovery notification listener
  useEffect(() => {
    const unsub = ErrorMonitoringService.subscribeNotifications(notif => {
      addNotification({
        category:
          notif.category === 'sync'
            ? 'sync'
            : notif.category === 'ai'
            ? 'ai'
            : notif.category === 'render'
            ? 'render'
            : 'system',
        title: notif.title,
        message: notif.message,
      });
    });
    return unsub;
  }, [addNotification]);

  // Sync active project type with view
  useEffect(() => {
    if (activeProject) {
      setCurrentView(activeProject.type);
    }
  }, [activeProject?.id]);

  const handleOpenStudio = (type: StudioType) => {
    if (type === 'tools') {
      setCurrentView('tools');
      return;
    }

    if (type === 'generate') {
      setCurrentView('generate');
      return;
    }

    // Check if there's already an active project of this type
    if (activeProject && activeProject.type === type) {
      setCurrentView(type);
      return;
    }

    // Otherwise find existing project of this type or create one
    const existing = projects.find(p => p.type === type);
    if (existing) {
      openProject(existing.id);
      setCurrentView(type);
    } else {
      createProject({
        title: `New ${type.toUpperCase()} Project`,
        type,
        aspectRatio: type === 'director' ? '21:9' : type === 'photo' ? '4:5' : '16:9',
        resolution: '1080p',
        fps: 30,
      });
      setCurrentView(type);
    }
  };

  const handleBackToDashboard = () => {
    closeProject();
    setCurrentView('dashboard');
  };

  const isEditorView = ['video', 'photo', 'audio', 'director'].includes(currentView);

  return (
    <div className={`min-h-screen flex flex-col bg-neutral-100 dark:bg-[var(--bg-base)] text-neutral-900 dark:text-neutral-100 transition-colors duration-200 ${isEditorView ? 'pb-0' : 'pb-[max(4.5rem,env(safe-area-inset-bottom))] md:pb-0'}`}>
      {/* Universal Top Header - hidden on mobile when inside an editor studio so editor toolbar has full viewport */}
      <div className={isEditorView ? "hidden md:block" : "block"}>
        <StudioHeader
          currentView={currentView}
          onNavigate={view => {
            if (view === 'dashboard') {
              handleBackToDashboard();
            } else {
              setCurrentView(view);
            }
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenModelRouter={() => setIsModelRouterOpen(true)}
          onOpenPro={() => setIsProOpen(true)}
          onOpenCloudStorage={() => setIsCloudStorageOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
      </div>

      {/* Network Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-xs flex items-center justify-center gap-2 select-none">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode — Editing locally. Cloud vault sync will resume automatically once connected.</span>
        </div>
      )}

      {/* Main View Area */}
      <main className={isEditorView ? "flex-1 overflow-hidden w-full flex flex-col" : "flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full"}>
        {/* Crash Recovery Banner if unsaved recovery snapshot exists */}
        {activeProject && (
          <ProjectRecoveryBanner
            project={activeProject}
            onRestoreRecovery={proj => restoreRecoverySnapshot(proj.id)}
            onDiscardRecovery={proj => discardRecoverySnapshot(proj.id)}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            onOpenStudio={handleOpenStudio}
            onOpenNewProjectModal={() => setIsNewProjectOpen(true)}
            onOpenProjects={() => setCurrentView('projects')}
            onOpenAccount={() => setIsProfileOpen(true)}
            onOpenSettings={() => setCurrentView('settings')}
          />
        )}

        {currentView === 'projects' && (
          <ProjectsView
            onBack={() => setCurrentView('dashboard')}
            onOpenNewProject={() => setIsNewProjectOpen(true)}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            onBack={() => setCurrentView('dashboard')}
            onOpenPro={() => setIsProOpen(true)}
          />
        )}

        {currentView === 'owner' && (
          <OwnerControlCenterView
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {/* Creative Studios wrapped with module isolation boundaries */}
        {currentView === 'director' && (
          <ErrorBoundary moduleName="AI Director" fallbackView="panel" onReset={handleBackToDashboard}>
            <AIDirectorStudio
              onBack={handleBackToDashboard}
              onOpenVersions={() => setIsVersionsOpen(true)}
              onOpenMedia={() => setIsMediaOpen(true)}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenModelRouter={() => setIsModelRouterOpen(true)}
            />
          </ErrorBoundary>
        )}

        {currentView === 'video' && (
          <ErrorBoundary moduleName="Video Editor" fallbackView="panel" onReset={handleBackToDashboard}>
            <VideoEditorStudio
              onBack={handleBackToDashboard}
              onOpenVersions={() => setIsVersionsOpen(true)}
              onOpenMedia={() => setIsMediaOpen(true)}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenModelRouter={() => setIsModelRouterOpen(true)}
            />
          </ErrorBoundary>
        )}

        {currentView === 'photo' && (
          <ErrorBoundary moduleName="Photo Studio" fallbackView="panel" onReset={handleBackToDashboard}>
            <PhotoStudioStudio
              onBack={handleBackToDashboard}
              onOpenVersions={() => setIsVersionsOpen(true)}
              onOpenMedia={() => setIsMediaOpen(true)}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenModelRouter={() => setIsModelRouterOpen(true)}
            />
          </ErrorBoundary>
        )}

        {currentView === 'audio' && (
          <ErrorBoundary moduleName="Audio Studio" fallbackView="panel" onReset={handleBackToDashboard}>
            <AudioStudioStudio
              onBack={handleBackToDashboard}
              onOpenVersions={() => setIsVersionsOpen(true)}
              onOpenMedia={() => setIsMediaOpen(true)}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenModelRouter={() => setIsModelRouterOpen(true)}
            />
          </ErrorBoundary>
        )}

        {currentView === 'tools' && (
          <ErrorBoundary moduleName="AI Tools" fallbackView="panel" onReset={handleBackToDashboard}>
            <AIToolsStudio
              onBack={handleBackToDashboard}
              onOpenModelRouter={() => setIsModelRouterOpen(true)}
              onOpenPro={() => setIsProOpen(true)}
              onNavigateToStudio={studio => setCurrentView(studio)}
            />
          </ErrorBoundary>
        )}

        {currentView === 'generate' && (
          <ErrorBoundary moduleName="AI Generator" fallbackView="panel" onReset={handleBackToDashboard}>
            <AIGenerationStudio
              onBack={handleBackToDashboard}
              onOpenSettings={() => setCurrentView('settings')}
              onNavigateToStudio={studio => setCurrentView(studio)}
            />
          </ErrorBoundary>
        )}

        {currentView === 'templates' && (
          <ErrorBoundary moduleName="Template Studio" fallbackView="panel" onReset={handleBackToDashboard}>
            <TemplateStudio
              onBack={handleBackToDashboard}
              onOpenVideoEditor={(projectId) => {
                openProject(projectId);
                setCurrentView('video');
              }}
              onOpenPro={() => setIsProOpen(true)}
            />
          </ErrorBoundary>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar - only on non-editor views so editor toolbars have complete bottom access */}
      {!isEditorView && (
        <MobileNavBar
          currentView={currentView}
          onNavigate={view => {
            if (view === 'dashboard') {
              handleBackToDashboard();
            } else {
              setCurrentView(view);
            }
          }}
          onOpenNewProject={() => setIsNewProjectOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      )}

      {/* Global Modals */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreated={type => setCurrentView(type)}
      />

      <ProjectVersionsModal
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
      />

      <MediaLibraryModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onOpenPro={() => setIsProOpen(true)}
      />

      <ModelRouterModal
        isOpen={isModelRouterOpen}
        onClose={() => setIsModelRouterOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenSubscription={() => setIsProOpen(true)}
        onOpenCloudStorage={() => setIsCloudStorageOpen(true)}
      />

      <SubscriptionModal
        isOpen={isProOpen}
        onClose={() => setIsProOpen(false)}
      />

      <CloudStorageModal
        isOpen={isCloudStorageOpen}
        onClose={() => setIsCloudStorageOpen(false)}
        onOpenPro={() => setIsProOpen(true)}
      />

      <SyncConflictModal
        isOpen={!!syncConflict}
        conflict={syncConflict}
        onResolve={resolveConflict}
        onClose={() => resolveConflict('keep_local')}
      />

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToPro={() => setIsProOpen(true)}
        onNavigateToCloud={() => setIsCloudStorageOpen(true)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onOpenPro={() => setIsProOpen(true)}
      />

      <HelpAndShortcutsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <NotificationToast />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <FeatureFlagProvider>
            <ModelRouterProvider>
              <ProjectProvider>
                <AIJobProvider>
                  <RenderQueueProvider>
                    <NotificationProvider>
                      <MainApp />
                    </NotificationProvider>
                  </RenderQueueProvider>
                </AIJobProvider>
              </ProjectProvider>
            </ModelRouterProvider>
          </FeatureFlagProvider>
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
