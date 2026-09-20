import React, { useState, useRef } from 'react';
import { 
  X, 
  Clapperboard, 
  Film, 
  Image as ImageIcon, 
  Music, 
  UploadCloud, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { StudioType } from '../../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (type: StudioType) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createProject, addMediaToProject } = useProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [studioType, setStudioType] = useState<StudioType>('video');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '21:9' | '4:5'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  // Quick 1-tap start handler
  const handleQuickCreate = (type: StudioType, ratio: '16:9' | '9:16' | '1:1' | '21:9' | '4:5' = '16:9') => {
    const defaultTitles: Record<StudioType, string> = {
      video: ratio === '9:16' ? 'Mobile Short' : 'New Video Project',
      photo: 'New Photo Edit',
      audio: 'New Audio Session',
      director: 'AI Director Project',
      tools: 'AI Tools Workspace',
      generate: 'AI Generation Workspace',
    };

    createProject({
      title: title.trim() || defaultTitles[type] || 'New Project',
      type,
      aspectRatio: ratio,
      resolution: '1080p',
      fps: 30,
    });
    onCreated(type);
    onClose();
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let detectedType: StudioType = 'video';
    let defaultRatio: '16:9' | '9:16' | '1:1' | '4:5' = '16:9';

    if (file.type.startsWith('image/')) {
      detectedType = 'photo';
      defaultRatio = '4:5';
    } else if (file.type.startsWith('audio/')) {
      detectedType = 'audio';
    }

    const objectUrl = URL.createObjectURL(file);
    createProject({
      title: file.name.replace(/\.[^/.]+$/, '') || 'Imported Project',
      type: detectedType,
      aspectRatio: defaultRatio,
      resolution: '1080p',
      fps: 30,
    });

    setTimeout(() => {
      addMediaToProject({
        name: file.name,
        type: detectedType === 'photo' ? 'image' : detectedType === 'audio' ? 'audio' : 'video',
        url: objectUrl,
        sizeBytes: file.size,
        durationSec: detectedType === 'photo' ? 5 : 15,
        dimensions: '1920x1080',
      });
    }, 100);

    onCreated(detectedType);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject({
      title: title.trim() || `Untitled ${studioType.toUpperCase()} Project`,
      type: studioType,
      aspectRatio,
      resolution,
      fps,
    });
    onCreated(studioType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        id="new-project-modal-card"
        className="w-full sm:max-w-lg bg-white dark:bg-studio-surface border-t sm:border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        {/* Header with swipe indicator on mobile */}
        <div>
          <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-100">
                Create New Project
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Choose a format to begin editing immediately
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hidden file input for native device media import */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*,audio/*"
          className="hidden"
          onChange={handleMediaUpload}
        />

        {/* 1-Tap Visual Creation Options (Section 5) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* New Video (Landscape) */}
          <button
            type="button"
            onClick={() => handleQuickCreate('video', '16:9')}
            className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                <Monitor className="w-3 h-3" /> 16:9
              </span>
            </div>
            <div>
              <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white block">
                Video (16:9)
              </span>
              <span className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                Landscape & YouTube
              </span>
            </div>
          </button>

          {/* New Video (Vertical / Short) */}
          <button
            type="button"
            onClick={() => handleQuickCreate('video', '9:16')}
            className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-neutral-400 font-medium">
                9:16 Reel
              </span>
            </div>
            <div>
              <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white block">
                Mobile Short
              </span>
              <span className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                TikTok, Reels & Shorts
              </span>
            </div>
          </button>

          {/* New Photo */}
          <button
            type="button"
            onClick={() => handleQuickCreate('photo', '4:5')}
            className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-neutral-400 font-medium">
                Canvas
              </span>
            </div>
            <div>
              <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white block">
                Photo Studio
              </span>
              <span className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                Layers, retouch & filters
              </span>
            </div>
          </button>

          {/* New Audio */}
          <button
            type="button"
            onClick={() => handleQuickCreate('audio', '16:9')}
            className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700 text-left transition-all active:scale-[0.98] group flex flex-col justify-between h-28"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Music className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-neutral-400 font-medium">
                Tracks
              </span>
            </div>
            <div>
              <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white block">
                Audio Studio
              </span>
              <span className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                Voice, stems & mixing
              </span>
            </div>
          </button>
        </div>

        {/* AI Project & Direct Import Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleQuickCreate('director', '21:9')}
            className="p-3 rounded-xl border border-purple-200 dark:border-purple-800/50 bg-purple-500/5 hover:bg-purple-500/10 text-left flex items-center gap-3 transition-colors active:scale-[0.99]"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-xs text-neutral-900 dark:text-white block truncate">
                AI Director Project
              </span>
              <span className="text-[10px] text-neutral-500 block truncate">
                Natural AI script & auto sequence
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-left flex items-center gap-3 transition-colors active:scale-[0.99]"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-xs text-neutral-900 dark:text-white block truncate">
                Import from Device
              </span>
              <span className="text-[10px] text-neutral-500 block truncate">
                Photos, videos, or audio files
              </span>
            </div>
          </button>
        </div>

        {/* Toggle Advanced / Custom Parameters */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 py-1 transition-colors"
          >
            <span>Custom settings (title, aspect ratio, resolution)</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <form onSubmit={handleSubmit} className="space-y-3 pt-3 text-xs animate-in fade-in">
              <div>
                <label className="block text-neutral-500 font-medium mb-1">Project Name</label>
                <input
                  id="new-project-title-input"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Summer Vacation Reel"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-neutral-500 mb-1">Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={e => setAspectRatio(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs"
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Mobile</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="4:5">4:5 Portrait</option>
                    <option value="21:9">21:9 Cinema</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Resolution</label>
                  <select
                    value={resolution}
                    onChange={e => setResolution(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs"
                  >
                    <option value="1080p">1080p FHD</option>
                    <option value="4K">4K UHD</option>
                    <option value="720p">720p HD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">FPS</label>
                  <select
                    value={fps}
                    onChange={e => setFps(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs"
                  >
                    <option value={30}>30 fps</option>
                    <option value={60}>60 fps</option>
                    <option value={24}>24 fps</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  Create Custom Project
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

