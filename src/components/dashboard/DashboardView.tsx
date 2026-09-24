import React from 'react';
import { 
  Clapperboard, 
  Film, 
  Image as ImageIcon, 
  Music, 
  Wand2, 
  Sparkles,
  FolderKanban, 
  Plus, 
  Clock, 
  User as UserIcon, 
  Settings as SettingsIcon,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
  LayoutTemplate,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useFeatureFlags } from '../../context/FeatureFlagContext';
import { StudioType } from '../../types';

interface DashboardViewProps {
  onOpenStudio: (type: StudioType) => void;
  onOpenNewProjectModal: () => void;
  onOpenProjects: () => void;
  onOpenAccount: () => void;
  onOpenSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenStudio,
  onOpenNewProjectModal,
  onOpenProjects,
  onOpenAccount,
  onOpenSettings,
}) => {
  const { recentProjects, openProject, recoverLastAutosave, dismissRecoverySnapshot } = useProjects();
  const { currentUser } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags();

  // Find any project with unrecovered crash/autosave snapshot
  const projectNeedingRecovery = recentProjects.find(p => p.hasRecoverySnapshot);

  const studios = [
    {
      id: 'director' as StudioType,
      title: 'AI Director',
      description: 'Natural command center, automated edit plans & safe studio execution',
      icon: Clapperboard,
      enabled: isFeatureEnabled('directorModule'),
      badge: 'Core',
    },
    {
      id: 'video' as StudioType,
      title: 'Video Editor',
      description: 'Non-destructive multi-track sequencing, transitions & color grading',
      icon: Film,
      enabled: isFeatureEnabled('videoEditorModule'),
      badge: 'Timeline',
    },
    {
      id: 'photo' as StudioType,
      title: 'Photo Studio',
      description: 'Layered high-res canvas, retouching & neural image generation',
      icon: ImageIcon,
      enabled: isFeatureEnabled('photoStudioModule'),
      badge: 'Canvas',
    },
    {
      id: 'audio' as StudioType,
      title: 'Audio Studio',
      description: 'Stem separation, speech synthesis, sound effects & spatial mixing',
      icon: Music,
      enabled: isFeatureEnabled('audioStudioModule'),
      badge: 'Mixer',
    },
    {
      id: 'tools' as StudioType,
      title: 'AI Tools',
      description: 'Prompt optimizers, neural upscalers, voice cloning & model routing',
      icon: Wand2,
      enabled: isFeatureEnabled('aiToolsModule'),
      badge: 'Registry',
    },
    {
      id: 'generate' as StudioType,
      title: 'AI Generation',
      description: 'Multimodal Video, Image, Audio synthesis, Reference Sets & Model Hub',
      icon: Sparkles,
      enabled: true,
      badge: 'Gen AI',
    },
    {
      id: 'templates' as StudioType,
      title: 'Templates',
      description: 'Trending presets, beat-sync cuts, reels & shorts creation',
      icon: LayoutTemplate,
      enabled: true,
      badge: 'Templates',
    },
  ];

  return (
    <div id="main-dashboard-container" className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 md:py-10 space-y-6 sm:space-y-10 pb-20 md:pb-10">
      {/* Recovery Notice if an autosave snapshot exists */}
      {projectNeedingRecovery && (
        <div 
          id="dashboard-recovery-banner"
          className="p-3.5 sm:p-4 rounded-xl border border-amber-300/40 dark:border-amber-600/30 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold">Unsaved session found:</span>{' '}
              <span className="opacity-90">
                "{projectNeedingRecovery.title}" has a recovery snapshot from{' '}
                {projectNeedingRecovery.recoverySnapshotTimestamp
                  ? new Date(projectNeedingRecovery.recoverySnapshotTimestamp).toLocaleTimeString()
                  : 'earlier'}
                .
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              id="dashboard-dismiss-recovery"
              onClick={() => dismissRecoverySnapshot(projectNeedingRecovery.id)}
              className="px-2.5 py-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors"
            >
              Discard
            </button>
            <button
              id="dashboard-accept-recovery"
              onClick={() => recoverLastAutosave(projectNeedingRecovery.id)}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-neutral-950 font-medium rounded-lg transition-colors"
            >
              Restore
            </button>
          </div>
        </div>
      )}

      {/* Top Mobile & Desktop Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
              VYRO Studio
            </span>
            <span className="text-xs text-neutral-400">
              Hello, {currentUser.name ? currentUser.name.split(' ')[0] : 'Creator'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            What would you like to create?
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Simple mobile editing on the surface, professional AI power underneath.
          </p>
        </div>

        {/* Primary Project Creation & Access Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            id="dashboard-my-projects-btn"
            onClick={onOpenProjects}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <FolderKanban className="w-4 h-4 text-neutral-500" />
            <span>My Projects ({recentProjects.length})</span>
          </button>

          <button
            id="dashboard-new-project-btn"
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Mobile-Friendly Quick Start Action Grid */}
      <section id="dashboard-quick-actions" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Quick Start Studio
          </h2>
          <span className="text-[11px] text-neutral-400 hidden sm:inline">Tap to jump straight in</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {studios.map(studio => {
            const Icon = studio.icon;
            return (
              <button
                key={studio.id}
                id={`dashboard-studio-card-${studio.id}`}
                disabled={!studio.enabled}
                onClick={() => onOpenStudio(studio.id)}
                className={`group text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[110px] sm:min-h-[130px] active:scale-[0.98] ${
                  studio.enabled
                    ? 'border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-studio-surface hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800/90 flex items-center justify-center text-neutral-800 dark:text-neutral-200 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700 dark:text-neutral-200" />
                  </div>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                    {studio.badge}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate">
                    {studio.title}
                  </h3>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                    {studio.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Projects Section */}
      <section id="dashboard-recent-projects-section" className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Recent Projects
            </h2>
          </div>
          <button
            id="dashboard-view-all-projects-link"
            onClick={onOpenProjects}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 flex items-center gap-1 transition-colors"
          >
            <span>See All ({recentProjects.length})</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white/50 dark:bg-studio-surface/50">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">No projects created yet.</p>
            <p className="text-xs text-neutral-400 mt-1">Start by tapping New Project above.</p>
            <button
              onClick={onOpenNewProjectModal}
              className="mt-3.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold shadow-xs"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentProjects.slice(0, 4).map(project => (
              <button
                key={project.id}
                id={`dashboard-recent-proj-${project.id}`}
                onClick={() => openProject(project.id)}
                className="group text-left p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-studio-surface hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between h-28 shadow-xs active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium capitalize px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {project.type}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(project.updatedAt || project.autosavedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-neutral-950 dark:group-hover:text-white">
                    {project.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800/60 pt-2 mt-2">
                  <span>{project.aspectRatio} • {project.resolution}</span>
                  <span className="text-neutral-700 dark:text-neutral-200 font-medium group-hover:underline">Open</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Quick Footer Links: Account and Settings */}
      <footer
        id="dashboard-bottom-nav"
        className="pt-6 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500"
      >
        <div className="flex items-center gap-6">
          <button
            id="dashboard-nav-account-btn"
            onClick={onOpenAccount}
            className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Account ({currentUser.name})</span>
          </button>

          <button
            id="dashboard-nav-settings-btn"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-400">
          VYRO AI Studio • Mobile-First Creative Suite
        </div>
      </footer>
    </div>
  );
};
