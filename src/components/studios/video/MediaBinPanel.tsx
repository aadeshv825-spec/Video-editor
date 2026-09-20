import React, { useRef, useState, useMemo } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Film,
  Music,
  Image as ImageIcon,
  Search,
  Grid,
  List,
  Sparkles,
  Play,
  Clock,
  Layers,
  Filter,
  Tag,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Award,
  Video,
} from 'lucide-react';
import { MediaAsset } from '../../../types';
import { SemanticMediaService } from '../../../services/ai/semanticMediaService';
import { MediaSemanticMetadata, TranscriptSegment } from '../../../types/aiQualityAndAutoEdit';

interface MediaBinPanelProps {
  mediaAssets: MediaAsset[];
  onImportAsset: (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => void;
  onRemoveAsset: (id: string) => void;
  onAddToTimeline: (asset: MediaAsset) => void;
  onQualityCheckAsset?: (asset: MediaAsset) => void;
  onSeekTimeline?: (seconds: number) => void;
}

export const MediaBinPanel: React.FC<MediaBinPanelProps> = ({
  mediaAssets,
  onImportAsset,
  onRemoveAsset,
  onAddToTimeline,
  onQualityCheckAsset,
  onSeekTimeline,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced Filters
  const [selectedOrientation, setSelectedOrientation] = useState<'all' | 'horizontal' | 'vertical' | 'square'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');

  // Tag editing popover
  const [editingTagAssetId, setEditingTagAssetId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  // File upload processing (100% offline using URL.createObjectURL and client file reading)
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');

      const localBlobUrl = URL.createObjectURL(file);

      if (isVideo) {
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.src = localBlobUrl;
        tempVideo.onloadedmetadata = () => {
          onImportAsset({
            name: file.name,
            type: 'video',
            sizeBytes: file.size,
            durationSec: Math.round(tempVideo.duration * 10) / 10 || 5.0,
            dimensions: `${tempVideo.videoWidth || 1920}x${tempVideo.videoHeight || 1080}`,
            url: localBlobUrl,
          });
        };
        tempVideo.onerror = () => {
          onImportAsset({
            name: file.name,
            type: 'video',
            sizeBytes: file.size,
            durationSec: 5.0,
            dimensions: '1920x1080',
            url: localBlobUrl,
          });
        };
      } else if (isAudio) {
        const tempAudio = document.createElement('audio');
        tempAudio.preload = 'metadata';
        tempAudio.src = localBlobUrl;
        tempAudio.onloadedmetadata = () => {
          onImportAsset({
            name: file.name,
            type: 'audio',
            sizeBytes: file.size,
            durationSec: Math.round(tempAudio.duration * 10) / 10 || 10.0,
            url: localBlobUrl,
          });
        };
        tempAudio.onerror = () => {
          onImportAsset({
            name: file.name,
            type: 'audio',
            sizeBytes: file.size,
            durationSec: 10.0,
            url: localBlobUrl,
          });
        };
      } else {
        const tempImg = new Image();
        tempImg.src = localBlobUrl;
        tempImg.onload = () => {
          onImportAsset({
            name: file.name,
            type: 'image',
            sizeBytes: file.size,
            durationSec: 4.0,
            dimensions: `${tempImg.naturalWidth}x${tempImg.naturalHeight}`,
            url: localBlobUrl,
          });
        };
        tempImg.onerror = () => {
          onImportAsset({
            name: file.name,
            type: 'image',
            sizeBytes: file.size,
            durationSec: 4.0,
            dimensions: '1920x1080',
            url: localBlobUrl,
          });
        };
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Add stock demo assets for offline instant testing
  const handleLoadDemoStock = () => {
    const samples: Omit<MediaAsset, 'id' | 'createdAt'>[] = [
      {
        name: 'Neon_Tokyo_Rain_4K.mp4',
        type: 'video',
        sizeBytes: 48000000,
        durationSec: 8.5,
        dimensions: '3840x2160',
        url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      },
      {
        name: 'Studio_Fashion_Movement.mp4',
        type: 'video',
        sizeBytes: 32000000,
        durationSec: 6.0,
        dimensions: '1080x1920',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Cyberpunk_Synthwave_Beat.wav',
        type: 'audio',
        sizeBytes: 12000000,
        durationSec: 15.0,
        url: '',
      },
      {
        name: 'City_Bicycle_Commute.mp4',
        type: 'video',
        sizeBytes: 25000000,
        durationSec: 7.0,
        dimensions: '1920x1080',
        url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Lens_Flare_Golden_Hour.png',
        type: 'image',
        sizeBytes: 4200000,
        durationSec: 4.0,
        dimensions: '1920x1080',
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      },
    ];

    samples.forEach(s => onImportAsset(s));
  };

  // Semantic Search & Multi-Filter Resolution
  const { filteredAssets, transcriptMatches } = useMemo(() => {
    let result = mediaAssets;
    let tMatches: { asset: MediaAsset; segment: TranscriptSegment }[] = [];

    // Natural Language Search
    if (searchQuery.trim()) {
      const searchRes = SemanticMediaService.searchMedia(searchQuery, mediaAssets);
      result = searchRes.matchedAssets;
      tMatches = searchRes.matchedTranscripts;
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(a => a.type === filterType);
    }

    // Orientation filter
    if (selectedOrientation !== 'all') {
      result = result.filter(a => {
        const dim = a.dimensions || '';
        const [w, h] = dim.split('x').map(Number);
        if (selectedOrientation === 'vertical') return h > w;
        if (selectedOrientation === 'horizontal') return w > h;
        if (selectedOrientation === 'square') return w === h;
        return true;
      });
    }

    // Duration filter
    if (selectedDuration !== 'all') {
      result = result.filter(a => {
        const d = a.durationSec || 0;
        if (selectedDuration === 'short') return d < 5;
        if (selectedDuration === 'medium') return d >= 5 && d <= 15;
        if (selectedDuration === 'long') return d > 15;
        return true;
      });
    }

    // Tag filter
    if (selectedTag !== 'all') {
      result = result.filter(a => {
        const meta = SemanticMediaService.getOrAnalyzeMedia(a);
        return meta.tags.includes(selectedTag);
      });
    }

    return { filteredAssets: result, transcriptMatches: tMatches };
  }, [mediaAssets, searchQuery, filterType, selectedOrientation, selectedDuration, selectedTag]);

  // Handle adding tag
  const handleAddTag = (assetId: string) => {
    if (!newTagInput.trim()) return;
    SemanticMediaService.addManualTag(assetId, newTagInput.trim());
    setNewTagInput('');
    setEditingTagAssetId(null);
  };

  const handleRemoveTag = (assetId: string, tag: string) => {
    SemanticMediaService.removeTag(assetId, tag);
  };

  const popularTags = ['People', 'Vehicle', 'Nature', 'City', 'Dialogue', 'Music', 'B-roll', 'Generated'];

  return (
    <div
      id="media-bin-panel"
      className="h-full flex flex-col bg-white dark:bg-[#13161c] border-r border-neutral-200 dark:border-neutral-800 text-xs select-none"
    >
      {/* Top Header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            Smart Media Bin
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            {mediaAssets.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 rounded transition-colors ${
              showFilters
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Toggle Smart Filters"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode(v => (v === 'grid' ? 'list' : 'grid'))}
            className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          >
            {viewMode === 'grid' ? <List className="w-3.5 h-3.5" /> : <Grid className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Semantic Search Bar */}
      <div className="p-2 space-y-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder='Natural search (e.g., "sunset", "bike", "vertical", "4K")...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 text-[11px] placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-[10px]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter type quick tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {(['all', 'video', 'audio', 'image'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize transition-colors ${
                filterType === type
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Collapsible Smart Filter Drawer */}
        {showFilters && (
          <div className="p-2 bg-neutral-50 dark:bg-neutral-900/60 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-2 text-[10px]">
            {/* Orientation */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium">Orientation:</span>
              <div className="flex items-center gap-1">
                {(['all', 'horizontal', 'vertical', 'square'] as const).map(o => (
                  <button
                    key={o}
                    onClick={() => setSelectedOrientation(o)}
                    className={`px-1.5 py-0.5 rounded capitalize ${
                      selectedOrientation === o
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {o === 'horizontal' ? '16:9' : o === 'vertical' ? '9:16' : o}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium">Duration:</span>
              <div className="flex items-center gap-1">
                {(['all', 'short', 'medium', 'long'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={`px-1.5 py-0.5 rounded capitalize ${
                      selectedDuration === d
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {d === 'short' ? '<5s' : d === 'medium' ? '5-15s' : d === 'long' ? '>15s' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <span className="text-neutral-500 font-medium">Tag Filter:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-1.5 py-0.5 rounded ${
                    selectedTag === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'
                  }`}
                >
                  All
                </button>
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                    className={`px-1.5 py-0.5 rounded ${
                      selectedTag === tag
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spoken Transcript Search Results */}
      {transcriptMatches.length > 0 && (
        <div className="p-2 border-b border-neutral-200 dark:border-neutral-800 bg-emerald-950/20 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <MessageSquare className="w-3.5 h-3.5" />
            Spoken Transcript Matches ({transcriptMatches.length}):
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {transcriptMatches.map((match, mIdx) => (
              <button
                key={mIdx}
                onClick={() => onSeekTimeline?.(match.segment.startSec)}
                className="w-full text-left p-1.5 rounded bg-black/40 hover:bg-black/60 border border-emerald-500/20 text-neutral-300 flex items-center justify-between group"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-white mr-1.5">{match.asset.name}:</span>
                  "{match.segment.text}"
                </div>
                <span className="shrink-0 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {match.segment.startSec.toFixed(1)}s
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drag & Drop Import Dropzone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mx-3 my-2 p-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
          isDraggingOver
            ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800'
            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/40'
        }`}
      >
        <Upload className="w-4 h-4 text-neutral-500 dark:text-neutral-400 mb-1" />
        <span className="font-medium text-[11px] text-neutral-800 dark:text-neutral-200">
          Drop media here or click
        </span>
        <span className="text-[9px] text-neutral-400 mt-0.5">
          MP4, MOV, MP3, WAV, PNG, JPG (Offline)
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Assets List/Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredAssets.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-neutral-400">
            <Film className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-[11px] text-neutral-500">No media assets match query</p>
            <button
              onClick={handleLoadDemoStock}
              className="mt-2 text-[10px] text-neutral-700 dark:text-neutral-300 underline hover:text-neutral-900 dark:hover:text-white"
            >
              Load Demo Stock Assets
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map(asset => {
              const meta = SemanticMediaService.getOrAnalyzeMedia(asset);

              return (
                <div
                  key={asset.id}
                  className="group relative rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex flex-col"
                >
                  {/* Thumbnail Preview */}
                  <div className="aspect-video bg-neutral-900 relative overflow-hidden flex items-center justify-center">
                    {asset.url && (asset.type === 'image' || asset.type === 'video') ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-400">
                        {asset.type === 'video' && <Film className="w-6 h-6" />}
                        {asset.type === 'audio' && <Music className="w-6 h-6" />}
                        {asset.type === 'image' && <ImageIcon className="w-6 h-6" />}
                      </div>
                    )}

                    {/* Type Badge */}
                    <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-mono uppercase bg-black/70 text-white backdrop-blur-xs">
                      {asset.type}
                    </span>

                    {/* Best Take Indicator */}
                    {meta.isBestTakeCandidate && (
                      <span className="absolute top-1 right-1 px-1 py-0.2 rounded text-[8px] font-medium bg-emerald-500/90 text-white flex items-center gap-0.5">
                        <Award className="w-2.5 h-2.5" />
                        Top Take
                      </span>
                    )}

                    {/* Duration Badge */}
                    {asset.durationSec && (
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[8px] font-mono bg-black/70 text-white backdrop-blur-xs flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {asset.durationSec}s
                      </span>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onAddToTimeline(asset)}
                        className="p-1.5 rounded-full bg-white text-neutral-900 hover:scale-110 transition-transform shadow-md"
                        title="Add to timeline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {onQualityCheckAsset && (
                        <button
                          onClick={() => onQualityCheckAsset(asset)}
                          className="p-1.5 rounded-full bg-emerald-600 text-white hover:scale-110 transition-transform shadow-md"
                          title="Quality Check Asset"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveAsset(asset.id)}
                        className="p-1.5 rounded-full bg-red-600 text-white hover:scale-110 transition-transform shadow-md"
                        title="Remove asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Meta details */}
                  <div className="p-1.5 space-y-1">
                    <div className="font-mono text-[10px] text-neutral-800 dark:text-neutral-200 truncate" title={asset.name}>
                      {asset.name}
                    </div>

                    {/* Tags Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      {meta.tags.slice(0, 3).map((t, tidx) => (
                        <span
                          key={tidx}
                          className="px-1 py-0.2 rounded text-[8px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0"
                        >
                          {t}
                        </span>
                      ))}
                      <button
                        onClick={() => setEditingTagAssetId(editingTagAssetId === asset.id ? null : asset.id)}
                        className="text-[8px] text-neutral-400 hover:text-white px-1"
                        title="Edit tags"
                      >
                        +tag
                      </button>
                    </div>

                    {/* Tag Editor popover */}
                    {editingTagAssetId === asset.id && (
                      <div className="p-1.5 bg-neutral-900 border border-neutral-800 rounded mt-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="New tag..."
                            value={newTagInput}
                            onChange={e => setNewTagInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTag(asset.id)}
                            className="w-full px-1.5 py-0.5 rounded bg-neutral-800 text-white text-[9px] border border-neutral-700"
                          />
                          <button
                            onClick={() => handleAddTag(asset.id)}
                            className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px]"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {meta.manualTags.map(mTag => (
                            <span
                              key={mTag}
                              onClick={() => handleRemoveTag(asset.id, mTag)}
                              className="px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 text-[8px] cursor-pointer hover:line-through"
                              title="Click to remove"
                            >
                              {mTag} ✕
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9px] text-neutral-400 pt-0.5">
                      <span>{asset.dimensions || (asset.sizeBytes ? `${Math.round(asset.sizeBytes / 1024 / 1024)}MB` : 'Local')}</span>
                      <button
                        onClick={() => onAddToTimeline(asset)}
                        className="text-neutral-900 dark:text-white font-medium hover:underline text-[9px]"
                      >
                        + Insert
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredAssets.map(asset => {
              const meta = SemanticMediaService.getOrAnalyzeMedia(asset);

              return (
                <div
                  key={asset.id}
                  className="group flex items-center justify-between p-1.5 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                      {asset.type === 'video' && <Film className="w-3.5 h-3.5" />}
                      {asset.type === 'audio' && <Music className="w-3.5 h-3.5" />}
                      {asset.type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono text-neutral-800 dark:text-neutral-200 truncate" title={asset.name}>
                        {asset.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] text-neutral-400">
                        <span>{asset.durationSec ? `${asset.durationSec}s` : asset.type}</span>
                        {meta.tags.length > 0 && (
                          <span className="text-neutral-500">• {meta.tags.slice(0, 2).join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onAddToTimeline(asset)}
                      className="p-1 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      title="Insert to timeline"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {onQualityCheckAsset && (
                      <button
                        onClick={() => onQualityCheckAsset(asset)}
                        className="p-1 rounded text-emerald-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        title="Check quality"
                      >
                        <ShieldCheck className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveAsset(asset.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-950"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Quick Action */}
      <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[10px]">
        <button
          onClick={handleLoadDemoStock}
          className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Load Stock Pack</span>
        </button>
        <span className="text-neutral-400 font-mono">100% Local & Indexed</span>
      </div>
    </div>
  );
};
