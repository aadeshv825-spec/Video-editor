import React, { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Film,
  Play,
  Check,
  Upload,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  Clock,
  Layers,
  Music,
  ArrowRight,
  ShieldCheck,
  Zap,
  Maximize2,
  RotateCcw,
  X,
  Smartphone,
  Monitor,
  Square,
  Heart,
  History,
  FolderHeart,
  Bookmark,
} from 'lucide-react';
import { VyroTemplate, TemplateCategory, TemplatePlaceholder } from '../../../types/templates';
import { TemplateService } from '../../../services/templates/templateService';
import { useAuth } from '../../../context/AuthContext';
import { useProjects } from '../../../context/ProjectContext';
import { StudioType } from '../../../types';

interface TemplateStudioProps {
  onBack: () => void;
  onSelectTemplate?: (template: VyroTemplate) => void;
  onOpenVideoEditor?: (projectId: string) => void;
  onOpenPro?: () => void;
}

const CATEGORIES: { id: 'all' | TemplateCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Templates', icon: '✨' },
  { id: 'reels', label: 'Reels', icon: '📱' },
  { id: 'shorts', label: 'Shorts', icon: '🚀' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'bike', label: 'Bike', icon: '🏍️' },
  { id: 'cinematic', label: 'Cinematic', icon: '🎬' },
  { id: 'vlog', label: 'Vlog', icon: '📹' },
  { id: 'birthday', label: 'Birthday', icon: '🎂' },
  { id: 'festival', label: 'Festival', icon: '🎉' },
  { id: 'product', label: 'Product', icon: '🛍️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'photo_montage', label: 'Photo Montage', icon: '📸' },
  { id: 'beat_sync', label: 'Beat Sync', icon: '⚡' },
  { id: 'social_media', label: 'Social Media', icon: '💬' },
];

export const TemplateStudio: React.FC<TemplateStudioProps> = ({
  onBack,
  onOpenVideoEditor,
  onOpenPro,
}) => {
  const { isOwner, isPro } = useAuth();
  const { createProject, openProject } = useProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [templates, setTemplates] = useState<VyroTemplate[]>(() => TemplateService.getAllTemplates());
  const [viewTab, setViewTab] = useState<'catalog' | 'favorites' | 'recent' | 'my_templates'>('catalog');
  const [favorites, setFavorites] = useState<string[]>(() => TemplateService.getFavorites());
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(() => TemplateService.getRecentlyUsed());
  const [myTemplates, setMyTemplates] = useState<VyroTemplate[]>(() => TemplateService.getMyTemplates());
  const [selectedCategory, setSelectedCategory] = useState<'all' | TemplateCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [aspectFilter, setAspectFilter] = useState<'all' | '9:16' | '16:9' | '1:1'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro'>('all');

  // Active template preview and customization modal state
  const [activeTemplate, setActiveTemplate] = useState<VyroTemplate | null>(null);
  const [userMediaMapping, setUserMediaMapping] = useState<Record<string, { url: string; name: string; type: 'video' | 'image' | 'audio' }>>({});
  const [currentPlaceholderIdForUpload, setCurrentPlaceholderIdForUpload] = useState<string | null>(null);

  const handleToggleFav = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    TemplateService.toggleFavorite(id);
    setFavorites(TemplateService.getFavorites());
  };

  // Filtered list
  const filteredTemplates = useMemo(() => {
    let source = templates;
    if (viewTab === 'favorites') {
      source = templates.filter(t => favorites.includes(t.id));
    } else if (viewTab === 'recent') {
      source = recentlyUsed
        .map(id => templates.find(t => t.id === id))
        .filter((t): t is VyroTemplate => Boolean(t));
    } else if (viewTab === 'my_templates') {
      source = myTemplates.length > 0 ? myTemplates : templates.filter(t => t.createdByOwner);
    }

    return source.filter(tpl => {
      if (selectedCategory !== 'all' && tpl.category !== selectedCategory) return false;
      if (aspectFilter !== 'all' && tpl.aspectRatio !== aspectFilter) return false;
      if (tierFilter === 'free' && tpl.isPro) return false;
      if (tierFilter === 'pro' && !tpl.isPro) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = tpl.title.toLowerCase().includes(q);
        const matchesDesc = tpl.description.toLowerCase().includes(q);
        const matchesTags = tpl.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }
      return true;
    });
  }, [templates, viewTab, favorites, recentlyUsed, myTemplates, selectedCategory, aspectFilter, tierFilter, searchQuery]);

  const handleOpenTemplateModal = (tpl: VyroTemplate) => {
    TemplateService.recordRecentlyUsed(tpl.id);
    setRecentlyUsed(TemplateService.getRecentlyUsed());
    setActiveTemplate(tpl);
    setUserMediaMapping({});
  };

  const handleTriggerUpload = (placeholderId: string) => {
    setCurrentPlaceholderIdForUpload(placeholderId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPlaceholderIdForUpload) return;

    const objectUrl = URL.createObjectURL(file);
    const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image';

    setUserMediaMapping(prev => ({
      ...prev,
      [currentPlaceholderIdForUpload]: {
        url: objectUrl,
        name: file.name,
        type,
      },
    }));
    setCurrentPlaceholderIdForUpload(null);
  };

  const handleApplyTemplate = () => {
    if (!activeTemplate) return;

    if (activeTemplate.isPro && !isPro && !isOwner) {
      if (onOpenPro) {
        onOpenPro();
      }
      return;
    }

    // Instantiate template into project
    const instance = TemplateService.instantiateTemplate(activeTemplate, userMediaMapping);

    const newProj = createProject({
      title: instance.title,
      type: 'video' as StudioType,
      aspectRatio: instance.aspectRatio,
      resolution: '1080p',
      fps: 30,
    });

    // Save initial state data to project
    newProj.stateData = {
      tracks: instance.tracks,
      clips: instance.clips,
      playheadSec: 0,
      timelineZoom: 60,
      snappingEnabled: true,
      rippleDeleteEnabled: false,
      selectedClipId: instance.clips[0]?.id || null,
      selectedTrackId: 'v1',
    };

    openProject(newProj.id);
    setActiveTemplate(null);

    if (onOpenVideoEditor) {
      onOpenVideoEditor(newProj.id);
    }
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this template from VYRO Template Studio?')) return;
    TemplateService.deleteTemplate(id);
    setTemplates(TemplateService.getAllTemplates());
  };

  return (
    <div id="template-studio-container" className="flex-1 flex flex-col bg-neutral-900 text-neutral-100 min-h-screen">
      {/* Hidden file input for uploading into placeholders */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="video/*,image/*,audio/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="border-b border-neutral-800 bg-neutral-950/80 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-700/50 text-purple-300 font-mono text-[10px] uppercase font-bold tracking-wider">
              Template Studio
            </span>
            <span className="text-neutral-400 text-xs font-mono">Original VYRO Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Video & Social Templates
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Select a template, drop in your photos & videos, and get instant professional edits.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition-colors"
          >
            Exit to Studio
          </button>
        </div>
      </div>

      {/* Main Tabs: Catalog / Favorites / Recently Used / My Templates */}
      <div className="px-4 sm:px-6 pt-2 border-b border-neutral-800 bg-neutral-950/60 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setViewTab('catalog')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            viewTab === 'catalog'
              ? 'border-purple-500 text-white font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Catalog ({templates.length})</span>
        </button>
        <button
          onClick={() => setViewTab('favorites')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            viewTab === 'favorites'
              ? 'border-pink-500 text-white font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
          <span>Favorites ({favorites.length})</span>
        </button>
        <button
          onClick={() => setViewTab('recent')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            viewTab === 'recent'
              ? 'border-blue-500 text-white font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <History className="w-3.5 h-3.5 text-blue-400" />
          <span>Recently Used ({recentlyUsed.length})</span>
        </button>
        <button
          onClick={() => setViewTab('my_templates')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            viewTab === 'my_templates'
              ? 'border-emerald-500 text-white font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FolderHeart className="w-3.5 h-3.5 text-emerald-400" />
          <span>My Templates ({myTemplates.length})</span>
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="px-4 sm:px-6 py-3 border-b border-neutral-800/80 bg-neutral-950/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Search bar */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search templates, tags, music..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Aspect Ratio & Tier Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900/90 p-0.5">
            <button
              onClick={() => setAspectFilter('all')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                aspectFilter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Ratios
            </button>
            <button
              onClick={() => setAspectFilter('9:16')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                aspectFilter === '9:16' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>9:16</span>
            </button>
            <button
              onClick={() => setAspectFilter('16:9')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                aspectFilter === '16:9' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>16:9</span>
            </button>
            <button
              onClick={() => setAspectFilter('1:1')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                aspectFilter === '1:1' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Square className="w-3 h-3" />
              <span>1:1</span>
            </button>
          </div>

          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900/90 p-0.5">
            <button
              onClick={() => setTierFilter('all')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                tierFilter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setTierFilter('free')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                tierFilter === 'free' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setTierFilter('pro')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                tierFilter === 'pro' ? 'bg-purple-900/80 text-purple-300' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-purple-400" />
              <span>Pro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-neutral-800/60 bg-neutral-950/20 overflow-x-auto scrollbar-none flex items-center gap-2 select-none">
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                isSelected
                  ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-950/50'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid View */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-neutral-500 font-mono text-xs">
            <Film className="w-8 h-8 mb-2 opacity-30 text-neutral-400" />
            <p>No templates found matching your search or filters.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setAspectFilter('all');
                setTierFilter('all');
              }}
              className="mt-3 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredTemplates.map(tpl => {
              const videoPlaceholders = tpl.placeholders.filter(p => p.type === 'video' || p.type === 'image');
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleOpenTemplateModal(tpl)}
                  className="group relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:shadow-xl hover:shadow-purple-950/20 transition-all cursor-pointer flex flex-col"
                >
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                    <img
                      src={tpl.previewThumbnail}
                      alt={tpl.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs font-mono text-[10px] text-neutral-300 font-medium">
                        {tpl.aspectRatio}
                      </span>
                      {tpl.bpm && (
                        <span className="px-2 py-0.5 rounded-md bg-pink-950/80 border border-pink-700/40 text-pink-300 font-mono text-[10px] flex items-center gap-1">
                          <Music className="w-2.5 h-2.5" />
                          {tpl.bpm} BPM
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                      <button
                        onClick={e => handleToggleFav(tpl.id, e)}
                        className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                          favorites.includes(tpl.id)
                            ? 'bg-pink-600/90 text-white shadow-md shadow-pink-900/40'
                            : 'bg-black/60 text-neutral-400 hover:text-white hover:bg-black/80'
                        }`}
                        title={favorites.includes(tpl.id) ? 'Remove from favorites' : 'Save as favorite'}
                      >
                        <Heart className={`w-3 h-3 ${favorites.includes(tpl.id) ? 'fill-white' : ''}`} />
                      </button>
                      {tpl.isPro ? (
                        <span className="px-2 py-0.5 rounded-md bg-purple-950/90 border border-purple-600/50 text-purple-300 font-mono text-[10px] font-semibold flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-purple-400" />
                          PRO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700/40 text-emerald-300 font-mono text-[10px] font-semibold">
                          FREE
                        </span>
                      )}
                      {isOwner && (
                        <button
                          onClick={e => handleDeleteTemplate(tpl.id, e)}
                          className="p-1 rounded bg-red-950/80 text-red-400 hover:bg-red-900 transition-colors"
                          title="Delete template (Owner only)"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Hover Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-11 h-11 rounded-full bg-white/90 text-neutral-950 flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
                      </div>
                    </div>

                    {/* Duration Readout */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 text-neutral-300 text-[10px] font-mono">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>{tpl.durationSec}s</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-100 group-hover:text-purple-300 transition-colors">
                        {tpl.title}
                      </h3>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                      <span>{videoPlaceholders.length} clips required</span>
                      <span className="text-purple-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-sans font-medium">
                        Use <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Use / Customize Template */}
      {activeTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#111318] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-bold">
                    {activeTemplate.category.toUpperCase()}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {activeTemplate.aspectRatio} • {activeTemplate.durationSec}s
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                  {activeTemplate.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveTemplate(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content: Placeholders Mapping */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              <p className="text-neutral-400 text-xs">
                Replace placeholders with your own footage or photos, or click "Launch in Video Editor" to use template sample media.
              </p>

              <div className="space-y-2.5">
                {activeTemplate.placeholders.map((ph, idx) => {
                  const mapped = userMediaMapping[ph.id];
                  return (
                    <div
                      key={ph.id}
                      className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-purple-400 shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-neutral-200 truncate">
                            {ph.label}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            Starts at {ph.startSec}s • Duration: {ph.durationSec}s • Type: {ph.type.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Right upload / status */}
                      <div className="shrink-0 flex items-center gap-2">
                        {mapped ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="truncate max-w-[120px] font-mono text-[11px]">
                              {mapped.name || 'Selected'}
                            </span>
                            <button
                              onClick={() => handleTriggerUpload(ph.id)}
                              className="text-neutral-400 hover:text-white underline text-[10px] ml-1"
                            >
                              Change
                            </button>
                          </div>
                        ) : ph.type === 'text' ? (
                          <input
                            type="text"
                            defaultValue={ph.defaultText}
                            onChange={e => {
                              ph.defaultText = e.target.value;
                            }}
                            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white max-w-[140px] focus:outline-none focus:border-purple-500"
                          />
                        ) : (
                          <button
                            onClick={() => handleTriggerUpload(ph.id)}
                            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                          >
                            <Upload className="w-3 h-3 text-purple-400" />
                            <span>Select Media</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserMediaMapping({})}
                  className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white text-xs transition-colors"
                >
                  Clear Selections
                </button>
                <button
                  onClick={() => {
                    if (!activeTemplate) return;
                    TemplateService.saveToMyTemplates({
                      ...activeTemplate,
                      id: `tpl-user-${Date.now()}`,
                      title: `${activeTemplate.title} (Custom)`,
                      createdByOwner: false,
                    });
                    setMyTemplates(TemplateService.getMyTemplates());
                    alert('Saved to My Templates!');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <FolderHeart className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save to My Templates</span>
                </button>
              </div>

              <button
                onClick={handleApplyTemplate}
                className={`px-5 py-2 rounded-xl text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                  activeTemplate?.isPro && !isPro && !isOwner
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-900/30'
                    : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40'
                }`}
              >
                {activeTemplate?.isPro && !isPro && !isOwner ? (
                  <>
                    <Zap className="w-4 h-4 text-amber-200 fill-amber-200/20" />
                    <span>Upgrade to PRO to Use</span>
                  </>
                ) : (
                  <>
                    <span>Launch in Video Editor</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
