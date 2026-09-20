import React, { useRef } from 'react';
import { 
  X, 
  Check, 
  Move, 
  RotateCw, 
  Gauge, 
  Palette, 
  Volume2, 
  VolumeX, 
  Type, 
  Sparkles, 
  Sliders, 
  Wand2, 
  ShieldCheck, 
  UploadCloud, 
  Plus, 
  Trash2, 
  Copy, 
  Scissors,
  FlipHorizontal,
  FlipVertical
} from 'lucide-react';
import { TimelineClip } from '../../../types/videoEditor';
import { MediaAsset } from '../../../types';

export type MobileToolSheetType = 
  | 'transform' 
  | 'speed' 
  | 'color' 
  | 'audio' 
  | 'vfx' 
  | 'text' 
  | 'ai' 
  | 'media';

interface MobileVideoToolSheetProps {
  sheetType: MobileToolSheetType | null;
  onClose: () => void;
  clip: TimelineClip | null;
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  onSplitClip: () => void;
  onDuplicateClip: () => void;
  onDeleteClip: () => void;
  onOpenAutoEdit: () => void;
  onOpenQualityCheck: () => void;
  mediaAssets: MediaAsset[];
  onImportMedia: (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => void;
  onInsertMedia: (asset: MediaAsset) => void;
}

export const MobileVideoToolSheet: React.FC<MobileVideoToolSheetProps> = ({
  sheetType,
  onClose,
  clip,
  onUpdateClip,
  onOpenAutoEdit,
  onOpenQualityCheck,
  mediaAssets,
  onImportMedia,
  onInsertMedia,
}) => {
  if (!sheetType) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: 'video' | 'image' | 'audio' = 'video';
    if (file.type.startsWith('image/')) type = 'image';
    if (file.type.startsWith('audio/')) type = 'audio';

    const url = URL.createObjectURL(file);
    onImportMedia({
      name: file.name,
      type,
      sizeBytes: file.size,
      durationSec: type === 'image' ? 5 : 15,
      url,
      dimensions: '1920x1080',
    });
  };

  const getSheetTitle = () => {
    switch (sheetType) {
      case 'transform': return 'Transform & Crop';
      case 'speed': return 'Speed & Timing';
      case 'color': return 'Color & Filters';
      case 'audio': return 'Audio & Volume';
      case 'vfx': return 'Visual Effects';
      case 'text': return 'Titles & Text';
      case 'ai': return 'AI Magic Tools';
      case 'media': return 'Add Media to Timeline';
      default: return 'Edit Tool';
    }
  };

  return (
    <div 
      id="mobile-video-tool-sheet"
      className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#12151c] border-t border-neutral-200 dark:border-neutral-800 rounded-t-3xl shadow-2xl flex flex-col max-h-[75vh] animate-in slide-in-from-bottom duration-200"
    >
      {/* Top Handle & Header */}
      <div className="pt-2.5 pb-2 px-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 sm:hidden mr-1" />
          <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
            {getSheetTitle()}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Scrollable Tool Content */}
      <div className="p-4 overflow-y-auto space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs">
        {/* If no clip is selected and tool requires a clip */}
        {!clip && sheetType !== 'ai' && sheetType !== 'media' && (
          <div className="p-6 text-center text-neutral-500">
            <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">No Clip Selected</p>
            <p className="text-xs">Tap a clip on the timeline above to adjust its {getSheetTitle().toLowerCase()}.</p>
          </div>
        )}

        {/* 1. TRANSFORM & CROP */}
        {clip && sheetType === 'transform' && (
          <div className="space-y-4">
            {/* Quick Actions (Flip, Reset) */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onUpdateClip(clip.id, {
                  transform: { ...clip.transform, flipHorizontal: !clip.transform?.flipHorizontal }
                })}
                className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-medium ${
                  clip.transform?.flipHorizontal 
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-transparent' 
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <FlipHorizontal className="w-4 h-4" />
                <span>Flip H</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateClip(clip.id, {
                  transform: { ...clip.transform, flipVertical: !clip.transform?.flipVertical }
                })}
                className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-medium ${
                  clip.transform?.flipVertical 
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-transparent' 
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <FlipVertical className="w-4 h-4" />
                <span>Flip V</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateClip(clip.id, {
                  transform: { 
                    ...clip.transform,
                    scale: 100, 
                    rotation: 0, 
                    positionX: 0, 
                    positionY: 0, 
                    flipHorizontal: false, 
                    flipVertical: false 
                  }
                })}
                className="py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium"
              >
                Reset
              </button>
            </div>

            {/* Scale Slider */}
            <div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400 mb-1.5 font-medium">
                <span>Scale / Zoom</span>
                <span>{clip.transform?.scale || 100}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                value={clip.transform?.scale || 100}
                onChange={e => onUpdateClip(clip.id, {
                  transform: { ...clip.transform, scale: Number(e.target.value) }
                })}
                className="w-full accent-neutral-900 dark:accent-white h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Rotation Slider */}
            <div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400 mb-1.5 font-medium">
                <span>Rotation</span>
                <span>{clip.transform?.rotation || 0}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={clip.transform?.rotation || 0}
                onChange={e => onUpdateClip(clip.id, {
                  transform: { ...clip.transform, rotation: Number(e.target.value) }
                })}
                className="w-full accent-neutral-900 dark:accent-white h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 2. SPEED & TIMING */}
        {clip && sheetType === 'speed' && (
          <div className="space-y-4">
            <label className="block text-neutral-600 dark:text-neutral-400 font-medium">Quick Speed Presets</label>
            <div className="grid grid-cols-5 gap-2">
              {[0.5, 0.75, 1.0, 1.5, 2.0].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdateClip(clip.id, {
                    speed: { ...clip.speed, speed: s }
                  })}
                  className={`py-2 rounded-xl border text-center font-semibold ${
                    (clip.speed?.speed || 1) === s
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-transparent shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400 mb-1.5 font-medium">
                <span>Speed Multiplier</span>
                <span>{(clip.speed?.speed || 1.0).toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="4.0"
                step="0.1"
                value={clip.speed?.speed || 1.0}
                onChange={e => onUpdateClip(clip.id, {
                  speed: { ...clip.speed, speed: Number(e.target.value) }
                })}
                className="w-full accent-neutral-900 dark:accent-white h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onUpdateClip(clip.id, {
                  speed: { ...clip.speed, reverse: !clip.speed?.reverse }
                })}
                className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold ${
                  clip.speed?.reverse
                    ? 'bg-purple-600 text-white border-transparent'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <span>{clip.speed?.reverse ? 'Reverse Video (Enabled)' : 'Reverse Video Playback'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. COLOR & FILTERS */}
        {clip && sheetType === 'color' && (
          <div className="space-y-4">
            <label className="block text-neutral-600 dark:text-neutral-400 font-medium">Color Presets</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'Normal', sat: 100, con: 0, exp: 0, temp: 0 },
                { name: 'Vibrant', sat: 140, con: 15, exp: 5, temp: 5 },
                { name: 'Warm', sat: 110, con: 10, exp: 0, temp: 25 },
                { name: 'B&W', sat: 0, con: 20, exp: 0, temp: 0 },
              ].map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onUpdateClip(clip.id, {
                    colorAdjustments: {
                      ...clip.colorAdjustments,
                      saturation: preset.sat,
                      contrast: preset.con,
                      exposure: preset.exp,
                      temperature: preset.temp,
                    }
                  })}
                  className="py-2 px-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center hover:border-neutral-400 transition-colors"
                >
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">{preset.name}</span>
                </button>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                <span>Exposure</span>
                <span>{clip.colorAdjustments?.exposure || 0}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={clip.colorAdjustments?.exposure || 0}
                onChange={e => onUpdateClip(clip.id, {
                  colorAdjustments: { ...clip.colorAdjustments, exposure: Number(e.target.value) }
                })}
                className="w-full accent-neutral-900 dark:accent-white h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                <span>Contrast</span>
                <span>{clip.colorAdjustments?.contrast || 0}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={clip.colorAdjustments?.contrast || 0}
                onChange={e => onUpdateClip(clip.id, {
                  colorAdjustments: { ...clip.colorAdjustments, contrast: Number(e.target.value) }
                })}
                className="w-full accent-neutral-900 dark:accent-white h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                <span>Saturation</span>
                <span>{clip.colorAdjustments?.saturation || 100}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={clip.colorAdjustments?.saturation || 100}
                onChange={e => onUpdateClip(clip.id, {
                  colorAdjustments: { ...clip.colorAdjustments, saturation: Number(e.target.value) }
                })}
                className="w-full accent-neutral-900 dark:accent-white h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 4. AUDIO & VOLUME */}
        {clip && sheetType === 'audio' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Clip Volume</span>
              <button
                type="button"
                onClick={() => onUpdateClip(clip.id, {
                  audio: { ...clip.audio, muted: !clip.audio?.muted }
                })}
                className={`p-2 rounded-xl border flex items-center gap-1.5 font-medium ${
                  clip.audio?.muted
                    ? 'bg-red-500 text-white border-transparent'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {clip.audio?.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{clip.audio?.muted ? 'Muted' : 'Mute'}</span>
              </button>
            </div>

            <div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400 mb-1.5 font-medium">
                <span>Volume Level</span>
                <span>{clip.audio?.volume || 100}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={clip.audio?.volume || 100}
                disabled={clip.audio?.muted}
                onChange={e => onUpdateClip(clip.id, {
                  audio: { ...clip.audio, volume: Number(e.target.value) }
                })}
                className="w-full accent-neutral-900 dark:accent-white h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer disabled:opacity-30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-neutral-500 font-medium mb-1">Fade In (sec)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="5"
                  value={clip.audio?.fadeInSec || 0}
                  onChange={e => onUpdateClip(clip.id, {
                    audio: { ...clip.audio, fadeInSec: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-neutral-500 font-medium mb-1">Fade Out (sec)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="5"
                  value={clip.audio?.fadeOutSec || 0}
                  onChange={e => onUpdateClip(clip.id, {
                    audio: { ...clip.audio, fadeOutSec: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. VISUAL EFFECTS (VFX) */}
        {clip && sheetType === 'vfx' && (
          <div className="space-y-4">
            <label className="block text-neutral-600 dark:text-neutral-400 font-medium">Quick Visual Effects</label>
            <div className="space-y-3">
              {/* Motion Blur toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">Motion Blur</span>
                  <span className="text-[11px] text-neutral-500">Smooth high-speed motion transitions</span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateClip(clip.id, {
                    motionBlur: {
                      enabled: !clip.motionBlur?.enabled,
                      amount: 60,
                      shutterAngle: 180,
                    }
                  })}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                    clip.motionBlur?.enabled
                      ? 'bg-purple-600 text-white'
                      : 'border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {clip.motionBlur?.enabled ? 'Active' : 'Off'}
                </button>
              </div>

              {/* Sharpen Slider */}
              <div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                  <span>Sharpen Detail</span>
                  <span>{clip.colorAdjustments?.sharpen || 0}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={clip.colorAdjustments?.sharpen || 0}
                  onChange={e => onUpdateClip(clip.id, {
                    colorAdjustments: { ...clip.colorAdjustments, sharpen: Number(e.target.value) }
                  })}
                  className="w-full accent-neutral-900 dark:accent-white h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Soft Blur Slider */}
              <div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                  <span>Cinematic Soft Blur</span>
                  <span>{clip.colorAdjustments?.blur || 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={clip.colorAdjustments?.blur || 0}
                  onChange={e => onUpdateClip(clip.id, {
                    colorAdjustments: { ...clip.colorAdjustments, blur: Number(e.target.value) }
                  })}
                  className="w-full accent-neutral-900 dark:accent-white h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. TITLES & TEXT */}
        {clip && sheetType === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1.5">Text Content</label>
              <input
                type="text"
                value={clip.text?.text || ''}
                onChange={e => onUpdateClip(clip.id, {
                  text: {
                    text: e.target.value,
                    fontFamily: clip.text?.fontFamily || 'Inter',
                    fontSize: clip.text?.fontSize || 36,
                    color: clip.text?.color || '#ffffff',
                    alignment: clip.text?.alignment || 'center',
                    opacity: clip.text?.opacity || 100,
                    animation: clip.text?.animation || 'none',
                  }
                })}
                placeholder="Enter title text..."
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-neutral-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 font-medium mb-1">Font Size (px)</label>
                <input
                  type="number"
                  value={clip.text?.fontSize || 36}
                  onChange={e => onUpdateClip(clip.id, {
                    text: {
                      text: clip.text?.text || 'Title',
                      fontFamily: clip.text?.fontFamily || 'Inter',
                      fontSize: Number(e.target.value),
                      color: clip.text?.color || '#ffffff',
                      alignment: clip.text?.alignment || 'center',
                      opacity: clip.text?.opacity || 100,
                      animation: clip.text?.animation || 'none',
                    }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-500 font-medium mb-1">Text Color</label>
                <input
                  type="color"
                  value={clip.text?.color || '#ffffff'}
                  onChange={e => onUpdateClip(clip.id, {
                    text: {
                      text: clip.text?.text || 'Title',
                      fontFamily: clip.text?.fontFamily || 'Inter',
                      fontSize: clip.text?.fontSize || 36,
                      color: e.target.value,
                      alignment: clip.text?.alignment || 'center',
                      opacity: clip.text?.opacity || 100,
                      animation: clip.text?.animation || 'none',
                    }
                  })}
                  className="w-full h-9 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 cursor-pointer p-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. AI MAGIC TOOLS */}
        {sheetType === 'ai' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAutoEdit();
              }}
              className="w-full p-3 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-500/5 hover:bg-purple-500/10 text-left flex items-center gap-3 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-neutral-900 dark:text-white block">
                  Smart Auto-Cut & Beat Sync
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Auto-detect beats, silence removal, and multi-clip montage
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenQualityCheck();
              }}
              className="w-full p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-500/5 hover:bg-emerald-500/10 text-left flex items-center gap-3 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-neutral-900 dark:text-white block">
                  AI Technical Quality Check
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Scan timeline for black frames, clipping audio & sync drift
                </span>
              </div>
            </button>
          </div>
        )}

        {/* 8. MEDIA BIN (ADD MEDIA) */}
        {sheetType === 'media' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*,audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 flex items-center justify-center gap-2 font-semibold text-neutral-700 dark:text-neutral-300 active:scale-[0.99] transition-all"
            >
              <UploadCloud className="w-5 h-5" />
              <span>Import New File from Device</span>
            </button>

            <div>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
                Project Media Assets ({mediaAssets.length})
              </span>

              {mediaAssets.length === 0 ? (
                <p className="text-center text-neutral-400 py-6">
                  No assets yet. Tap the button above to import photos or videos.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                  {mediaAssets.map(asset => (
                    <div
                      key={asset.id}
                      onClick={() => {
                        onInsertMedia(asset);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-neutral-400 cursor-pointer flex items-center gap-2 transition-all active:scale-95"
                    >
                      <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-xs text-neutral-900 dark:text-neutral-100 block truncate">
                          {asset.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 capitalize">
                          {asset.type} • {asset.durationSec || 5}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default MobileVideoToolSheet;
