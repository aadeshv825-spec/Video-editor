import React, { useState, useMemo } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Copy, 
  Trash2, 
  ArrowLeft,
  Clapperboard,
  Film,
  Image as ImageIcon,
  Music,
  AlertCircle,
  Calendar,
  X,
  ArrowUpDown,
  Wand2,
  Sparkles,
  Edit2,
  Play,
  Share2,
  Check,
  HardDrive
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { StudioType } from '../../types';

interface ProjectsViewProps {
  onBack: () => void;
  onOpenNewProject: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onBack,
  onOpenNewProject,
}) => {
  const { projects, openProject, duplicateProject, deleteProject, renameProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | StudioType>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d' | 'this_year'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'updated'>('newest');
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState<string>('');

  // Filter projects by title, creation date, or studio type
  const filtered = useMemo(() => {
    return projects.filter(p => {
      // 1. Studio type match
      const matchesType = filterType === 'all' || p.type === filterType;
      if (!matchesType) return false;

      // 2. Date filter match
      if (dateFilter !== 'all') {
        const createdMs = new Date(p.createdAt).getTime();
        const nowMs = Date.now();
        const diffDays = (nowMs - createdMs) / (1000 * 60 * 60 * 24);

        if (dateFilter === '7d' && diffDays > 7) return false;
        if (dateFilter === '30d' && diffDays > 30) return false;
        if (dateFilter === '90d' && diffDays > 90) return false;
        if (dateFilter === 'this_year') {
          const projectYear = new Date(p.createdAt).getFullYear();
          const currentYear = new Date().getFullYear();
          if (projectYear !== currentYear) return false;
        }
      }

      // 3. Search query match: title, studio type, or creation date
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const titleMatch = p.title.toLowerCase().includes(q);
      const typeMatch = p.type.toLowerCase().includes(q);

      const createdDate = new Date(p.createdAt);
      const dateFormatted = createdDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).toLowerCase();

      const fullMonth = createdDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
      const yearStr = createdDate.getFullYear().toString();
      const isoStr = p.createdAt.toLowerCase();

      const dateMatch = 
        dateFormatted.includes(q) ||
        fullMonth.includes(q) ||
        yearStr.includes(q) ||
        isoStr.includes(q);

      return titleMatch || typeMatch || dateMatch;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'updated') {
        return new Date(b.updatedAt || b.autosavedAt).getTime() - new Date(a.updatedAt || a.autosavedAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [projects, searchQuery, filterType, dateFilter, sortBy]);

  const getStudioIcon = (type: StudioType) => {
    switch (type) {
      case 'director': return Clapperboard;
      case 'video': return Film;
      case 'photo': return ImageIcon;
      case 'audio': return Music;
      case 'tools': return Wand2;
      case 'generate': return Sparkles;
      default: return FolderKanban;
    }
  };

  const getStudioGradient = (type: StudioType) => {
    switch (type) {
      case 'video': return 'from-blue-600/30 to-indigo-900/40';
      case 'photo': return 'from-emerald-600/30 to-teal-900/40';
      case 'audio': return 'from-amber-600/30 to-orange-900/40';
      case 'director': return 'from-purple-600/30 to-pink-900/40';
      default: return 'from-neutral-700/30 to-neutral-900/40';
    }
  };

  const handleStartRename = (id: string, currentTitle: string) => {
    setRenamingProjectId(id);
    setRenamingTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (renamingTitle.trim()) {
      renameProject(id, renamingTitle.trim());
    }
    setRenamingProjectId(null);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setDateFilter('all');
    setSortBy('newest');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div id="projects-view-root" className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            id="projects-back-btn"
            onClick={onBack}
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            title="Return to Studio Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              My Projects
            </h1>
            <p className="text-xs text-neutral-500">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} saved with non-destructive versioning
            </p>
          </div>
        </div>

        <button
          id="projects-create-new-btn"
          onClick={onOpenNewProject}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity self-stretch sm:self-auto shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Project</span>
        </button>
      </div>

      {/* Interactive Search & Filter Toolbar */}
      <div className="space-y-3 bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 text-xs">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              id="projects-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search projects by name, studio or date..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition-all text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter & Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="flex-1 sm:flex-initial flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <select
                id="projects-date-filter"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as any)}
                aria-label="Filter by creation date"
                className="bg-transparent text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer w-full"
              >
                <option value="all" className="dark:bg-neutral-900">All Dates</option>
                <option value="7d" className="dark:bg-neutral-900">Last 7 Days</option>
                <option value="30d" className="dark:bg-neutral-900">Last 30 Days</option>
                <option value="90d" className="dark:bg-neutral-900">Last 90 Days</option>
                <option value="this_year" className="dark:bg-neutral-900">This Year</option>
              </select>
            </div>

            <div className="flex-1 sm:flex-initial flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <select
                id="projects-sort-by"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                aria-label="Sort projects"
                className="bg-transparent text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer w-full"
              >
                <option value="newest" className="dark:bg-neutral-900">Newest First</option>
                <option value="oldest" className="dark:bg-neutral-900">Oldest First</option>
                <option value="updated" className="dark:bg-neutral-900">Recently Edited</option>
                <option value="title" className="dark:bg-neutral-900">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Studio Type Filter Pills */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/60 overflow-x-auto scrollbar-none pb-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            {(['all', 'video', 'photo', 'audio', 'director', 'tools'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize whitespace-nowrap transition-colors min-h-[32px] ${
                  filterType === t
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {t === 'all' ? 'All Studios' : t}
              </button>
            ))}
          </div>

          {(searchQuery || filterType !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 whitespace-nowrap underline shrink-0 pl-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid: 1 col (mobile) -> 2 cols (tablet) -> 3-4 cols (desktop) */}
      {filtered.length === 0 ? (
        <div className="p-10 sm:p-14 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-4 bg-white dark:bg-studio-surface">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
              No projects found
            </p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Start creating your first video, photo, or audio project now with one tap.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenNewProject}
              className="px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold rounded-xl text-xs hover:opacity-90 transition-opacity shadow-xs"
            >
              Create New Project
            </button>
            {(searchQuery || filterType !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={handleClearFilters}
                className="px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filtered.map(proj => {
            const Icon = getStudioIcon(proj.type);
            const gradient = getStudioGradient(proj.type);
            const isEditingTitle = renamingProjectId === proj.id;
            const mediaCount = proj.mediaAssets?.length || 0;
            const updatedDate = new Date(proj.updatedAt || proj.autosavedAt);
            const timeAgo = updatedDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

            return (
              <div
                key={proj.id}
                id={`project-card-${proj.id}`}
                className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-studio-surface hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between overflow-hidden group shadow-xs hover:shadow-md"
              >
                {/* Visual Card Thumbnail Preview */}
                <div 
                  onClick={() => openProject(proj.id)}
                  className={`relative h-36 bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between cursor-pointer group-hover:brightness-105 transition-all overflow-hidden`}
                >
                  {/* Aspect Ratio & Format Tag */}
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-white border border-white/10">
                      {proj.aspectRatio || '16:9'}
                    </span>
                    <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-white/90 border border-white/10 flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      {proj.type}
                    </span>
                  </div>

                  {/* Center Play / Open Trigger */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all shadow-md">
                      <Play className="w-5 h-5 fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Bottom Thumbnail Metadata */}
                  <div className="flex items-center justify-between z-10 text-[11px] text-white/90">
                    <span className="px-1.5 py-0.5 rounded bg-black/30 backdrop-blur-xs font-medium">
                      {proj.resolution || '1080p'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-black/30 backdrop-blur-xs">
                      {mediaCount} {mediaCount === 1 ? 'clip' : 'clips'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Project Title or Inline Rename */}
                    {isEditingTitle ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="text"
                          value={renamingTitle}
                          onChange={e => setRenamingTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveRename(proj.id);
                            if (e.key === 'Escape') setRenamingProjectId(null);
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 text-sm font-semibold rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveRename(proj.id)}
                          className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRenamingProjectId(null)}
                          className="p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-1">
                        <h3 
                          onClick={() => openProject(proj.id)}
                          className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 hover:underline cursor-pointer truncate"
                          title={proj.title}
                        >
                          {proj.title}
                        </h3>
                        <button
                          onClick={() => handleStartRename(proj.id, proj.title)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Rename project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Metadata line: Modified date & size */}
                    <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1.5">
                      <span>Edited {timeAgo}</span>
                      <span>•</span>
                      <span>{formatFileSize(proj.mediaAssets?.reduce((acc, m) => acc + (m.sizeBytes || 0), 0))}</span>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => duplicateProject(proj.id)}
                        className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Duplicate project"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {projectToDeleteId === proj.id ? (
                        <div className="flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 text-xs animate-in fade-in">
                          <span className="text-red-600 dark:text-red-400 font-medium">Delete?</span>
                          <button
                            onClick={() => {
                              deleteProject(proj.id);
                              setProjectToDeleteId(null);
                            }}
                            className="px-1.5 py-0.5 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setProjectToDeleteId(null)}
                            className="px-1 py-0.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setProjectToDeleteId(proj.id)}
                          className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => openProject(proj.id)}
                      className="px-3.5 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold rounded-xl text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs"
                    >
                      Open Editor
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ProjectsView;

