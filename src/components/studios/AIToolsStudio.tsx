import React, { useState, useMemo } from 'react';
import {
  Wand2,
  Sparkles,
  Video,
  Image as ImageIcon,
  Mic,
  Maximize2,
  Layers,
  ArrowLeft,
  Lock,
  Search,
  Cpu,
  Coins,
  Sliders,
  Scissors,
  Sun,
  Expand,
  Subtitles,
  Film,
  Camera,
  History,
  X,
} from 'lucide-react';
import { useModelRouter } from '../../context/ModelRouterContext';
import { useAuth } from '../../context/AuthContext';
import { AI_TOOLS_CATALOG, PHOTO_AI_TOOLS, VIDEO_AI_TOOLS, getAIToolById } from '../../services/ai/aiToolsCatalog';
import { AIToolMeta } from '../../types/aiTools';
import { AIToolRunner } from './ai-tools/AIToolRunner';

interface AIToolsStudioProps {
  onBack: () => void;
  onOpenModelRouter: () => void;
  onOpenPro: () => void;
  onNavigateToStudio?: (studio: 'photo' | 'video' | 'director' | 'generate') => void;
}

// Map icon based on tool metadata or id
const getIconComponent = (tool: AIToolMeta) => {
  const name = tool.iconName || '';
  if (name === 'Scissors' || tool.id.includes('bg_removal') || tool.id.includes('cut')) return Scissors;
  if (name === 'Layers' || tool.id.includes('bg_replace')) return Layers;
  if (name === 'Wand2' || tool.id.includes('object_removal')) return Wand2;
  if (name === 'Expand' || tool.id.includes('reframe') || tool.id.includes('expand')) return Expand;
  if (name === 'Maximize2' || tool.id.includes('upscale')) return Maximize2;
  if (name === 'Sun' || tool.id.includes('relight')) return Sun;
  if (name === 'Camera' || tool.id.includes('portrait')) return Camera;
  if (name === 'History' || tool.id.includes('restoration') || tool.id.includes('colorize')) return History;
  if (name === 'Subtitles' || tool.id.includes('caption')) return Subtitles;
  if (name === 'Film' || tool.id.includes('scene')) return Film;
  if (tool.category === 'video') return Video;
  if (name === 'Sparkles' || tool.id.includes('gen_fill') || tool.id.includes('image_gen')) return Sparkles;
  return ImageIcon;
};

export const AIToolsStudio: React.FC<AIToolsStudioProps> = ({
  onBack,
  onOpenModelRouter,
  onOpenPro,
  onNavigateToStudio,
}) => {
  const { selectedModel, selectModelManual } = useModelRouter();
  const { currentUser, isPro, canAccessTool } = useAuth();

  const [activeCategory, setActiveCategory] = useState<'all' | 'photo' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'pro'>('all');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  const activeTool = useMemo(() => {
    if (!selectedToolId) return null;
    return getAIToolById(selectedToolId) || null;
  }, [selectedToolId]);

  // Filtered tools list
  const filteredTools = useMemo(() => {
    return AI_TOOLS_CATALOG.filter((tool: AIToolMeta) => {
      // Category filter
      if (activeCategory === 'photo' && tool.category !== 'photo') return false;
      if (activeCategory === 'video' && tool.category !== 'video') return false;

      // Tier filter
      if (filterTier === 'free' && tool.isProOnly) return false;
      if (filterTier === 'pro' && !tool.isProOnly) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = tool.name.toLowerCase().includes(q);
        const matchDesc = tool.shortDescription.toLowerCase().includes(q);
        const matchCategory = tool.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCategory) return false;
      }

      return true;
    });
  }, [activeCategory, filterTier, searchQuery]);

  const handleSelectTool = (tool: AIToolMeta) => {
    if (tool.isProOnly && !canAccessTool(tool.id)) {
      onOpenPro();
      return;
    }
    setSelectedToolId(tool.id);
    selectModelManual(tool.defaultModelId);
  };

  // If a tool runner is active, render full-screen specialized runner
  if (activeTool) {
    return (
      <AIToolRunner
        tool={activeTool}
        onBack={() => setSelectedToolId(null)}
        onOpenModelRouter={onOpenModelRouter}
        onNavigateToStudio={onNavigateToStudio}
      />
    );
  }

  return (
    <div id="ai-tools-studio-root" className="h-[calc(100vh-3.5rem)] flex flex-col bg-neutral-50 dark:bg-studio-base overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-12 px-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-studio-surface text-xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            id="tools-back-btn"
            onClick={onBack}
            className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <Wand2 className="w-4 h-4 text-purple-500" />
            <span>AI Tools Hub</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Coins className="w-3.5 h-3.5" />
            <span>{currentUser.aiCredits.toLocaleString()} Credits</span>
          </div>

          <button
            id="tools-open-router-btn"
            onClick={onOpenModelRouter}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-mono text-[11px] transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-neutral-500" />
            <span>{selectedModel.name.split(' ')[0]}</span>
          </button>

          {onNavigateToStudio && (
            <button
              onClick={() => onNavigateToStudio('generate')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Generation</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Hub Body */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Hub Header & Navigation Categories */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span>Photo & Video AI Suite</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select a specialized tool to configure non-destructive AI edits, previews, and timeline layers.
            </p>
          </div>

          {/* Category Tabs: All, Photo AI (14), Video AI (11) */}
          <div className="flex items-center p-1 bg-neutral-200/60 dark:bg-neutral-800/80 rounded-xl text-xs shrink-0 max-w-full overflow-x-auto scrollbar-none self-start md:self-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              All Tools ({AI_TOOLS_CATALOG.length})
            </button>
            <button
              onClick={() => setActiveCategory('photo')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'photo'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
              <span>Photo AI ({PHOTO_AI_TOOLS.length})</span>
            </button>
            <button
              onClick={() => setActiveCategory('video')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'video'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-emerald-500" />
              <span>Video AI ({VIDEO_AI_TOOLS.length})</span>
            </button>
          </div>
        </div>

        {/* Search & Tier Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tools (e.g. background removal, reframe, captions, sharpen)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tier Filters */}
          <div className="flex items-center gap-1 text-xs max-w-full overflow-x-auto scrollbar-none self-start sm:self-auto shrink-0">
            <button
              onClick={() => setFilterTier('all')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors ${
                filterTier === 'all'
                  ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setFilterTier('free')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors ${
                filterTier === 'free'
                  ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Standard Free
            </button>
            <button
              onClick={() => setFilterTier('pro')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors flex items-center gap-1 ${
                filterTier === 'pro'
                  ? 'border-purple-600 bg-purple-500/10 text-purple-600 font-medium'
                  : 'border-transparent text-neutral-500 hover:text-purple-600'
              }`}
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Pro Only</span>
            </button>
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-2">
            {filteredTools.map((tool: AIToolMeta) => {
              const Icon = getIconComponent(tool);
              const hasAccess = !tool.isProOnly || canAccessTool(tool.id);

              return (
                <div
                  key={tool.id}
                  onClick={() => handleSelectTool(tool)}
                  className="group relative p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-studio-surface hover:border-neutral-400 dark:hover:border-neutral-700 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer min-h-[160px]"
                >
                  {/* Top row: icon + badges */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                          tool.category === 'photo'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        {tool.badge && (
                          <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-sans">
                            {tool.badge}
                          </span>
                        )}

                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
                          <Coins className="w-2.5 h-2.5" />
                          {tool.costCredits}
                        </span>

                        {tool.isProOnly && !hasAccess && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            <Lock className="w-2.5 h-2.5" />
                            Pro
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                      {tool.name}
                    </h3>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {tool.shortDescription}
                    </p>
                  </div>

                  {/* Bottom row: model routing */}
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800/60 pt-2.5 mt-3 font-mono">
                    <span className="truncate max-w-[130px]">
                      {tool.defaultModelId.replace(/-/g, ' ')}
                    </span>
                    <span className="text-neutral-600 dark:text-neutral-300 font-sans font-medium group-hover:translate-x-0.5 transition-transform">
                      Configure →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center space-y-2 text-neutral-400 flex flex-col items-center justify-center">
            <Search className="w-8 h-8 opacity-40" />
            <p className="text-xs">No AI tools matching "{searchQuery}".</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
                setFilterTier('all');
              }}
              className="text-xs text-purple-600 dark:text-purple-400 font-medium underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
