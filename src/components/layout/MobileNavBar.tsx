import React from 'react';
import { 
  LayoutGrid, 
  FolderKanban, 
  Plus, 
  Wand2, 
  User as UserIcon,
} from 'lucide-react';

interface MobileNavBarProps {
  currentView: string;
  onNavigate: (view: any) => void;
  onOpenNewProject: () => void;
  onOpenProfile: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  currentView,
  onNavigate,
  onOpenNewProject,
  onOpenProfile,
}) => {
  return (
    <nav 
      id="mobile-bottom-nav" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-studio-surface/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800/80 px-2 pt-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none shadow-lg"
    >
      {/* Home Tab */}
      <button
        type="button"
        id="mobile-nav-home"
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl active:scale-95 transition-all ${
          currentView === 'dashboard'
            ? 'text-neutral-950 dark:text-white font-semibold'
            : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
        }`}
      >
        <LayoutGrid className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 font-medium">Home</span>
      </button>

      {/* Projects Tab */}
      <button
        type="button"
        id="mobile-nav-projects"
        onClick={() => onNavigate('projects')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl active:scale-95 transition-all ${
          currentView === 'projects'
            ? 'text-neutral-950 dark:text-white font-semibold'
            : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
        }`}
      >
        <FolderKanban className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 font-medium">Projects</span>
      </button>

      {/* Center Action (+) Button */}
      <button
        type="button"
        id="mobile-nav-create-btn"
        onClick={onOpenNewProject}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-md hover:scale-105 active:scale-95 transition-all -mt-4 ring-4 ring-white dark:ring-studio-surface"
        title="Create new project"
        aria-label="Create new project"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* AI Tools Tab */}
      <button
        type="button"
        id="mobile-nav-tools"
        onClick={() => onNavigate('tools')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl active:scale-95 transition-all ${
          currentView === 'tools' || currentView === 'generate'
            ? 'text-neutral-950 dark:text-white font-semibold'
            : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
        }`}
      >
        <Wand2 className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 font-medium">AI Tools</span>
      </button>

      {/* Profile Tab */}
      <button
        type="button"
        id="mobile-nav-profile"
        onClick={onOpenProfile}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl active:scale-95 transition-all ${
          currentView === 'settings'
            ? 'text-neutral-950 dark:text-white font-semibold'
            : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
        }`}
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 font-medium">Profile</span>
      </button>
    </nav>
  );
};

