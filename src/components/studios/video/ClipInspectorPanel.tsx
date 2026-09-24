import React, { useState } from 'react';
import {
  Sliders,
  Move,
  RotateCw,
  Gauge,
  Palette,
  Volume2,
  VolumeX,
  Type,
  Sparkles,
  Scissors,
  Copy,
  Trash2,
  FlipHorizontal,
  FlipVertical,
  Plus,
  RotateCcw,
  Sun,
  Layers,
  Flame,
  ArrowRightLeft,
  Wand2,
  Check,
  Zap,
  TrendingUp,
  Snowflake,
  Film,
  Subtitles,
  Maximize,
  Filter,
} from 'lucide-react';
import {
  TimelineClip,
  TransformProperties,
  SpeedProperties,
  ColorProperties,
  TextProperties,
  AudioProperties,
  TransitionType,
  BlendMode,
  TimelineTrack,
  KeyframeInterpolation,
  CanvasBackgroundSettings,
  CaptionStyle,
} from '../../../types/videoEditor';
import { ColorGradingPanel } from './panels/ColorGradingPanel';
import { VFXInspectorPanel } from './panels/VFXInspectorPanel';
import { AudioMixerPanel } from './panels/AudioMixerPanel';

interface ClipInspectorPanelProps {
  clip: TimelineClip | null;
  playheadSec: number;
  tracks?: TimelineTrack[];
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  onSplitClip: (clipId: string) => void;
  onDuplicateClip: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
  onSaveAsVersion?: (description: string) => void;
  onCopyAttributes?: (clip: TimelineClip) => void;
  onPasteAttributes?: (clipId: string) => void;
  hasClipboard?: boolean;
  onFreezeClip?: (clipId: string) => void;
  onExtractAudio?: (clipId: string) => void;
  canvasBackground?: CanvasBackgroundSettings;
  onUpdateCanvasBackground?: (bg: CanvasBackgroundSettings) => void;
  captions?: Array<{ id: string; startSec: number; endSec: number; text: string }>;
  onUpdateCaptions?: (captions: Array<{ id: string; startSec: number; endSec: number; text: string }>) => void;
  captionStyle?: CaptionStyle;
  onUpdateCaptionStyle?: (style: CaptionStyle) => void;
}

type InspectorTab = 'transform' | 'filters' | 'color' | 'vfx' | 'speed' | 'audio' | 'text' | 'transition' | 'canvas' | 'captions';

const BLEND_MODES: { id: BlendMode; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'multiply', label: 'Multiply' },
  { id: 'screen', label: 'Screen' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'soft-light', label: 'Soft Light' },
  { id: 'hard-light', label: 'Hard Light' },
  { id: 'darken', label: 'Darken' },
  { id: 'lighten', label: 'Lighten' },
  { id: 'difference', label: 'Difference' },
  { id: 'color-dodge', label: 'Color Dodge' },
  { id: 'luminosity', label: 'Luminosity' },
];

export const ClipInspectorPanel: React.FC<ClipInspectorPanelProps> = ({
  clip,
  playheadSec,
  tracks = [],
  onUpdateClip,
  onSplitClip,
  onDuplicateClip,
  onDeleteClip,
  onSaveAsVersion,
  onCopyAttributes,
  onPasteAttributes,
  hasClipboard,
  onFreezeClip,
  onExtractAudio,
  canvasBackground = { type: 'color', color: '#000000' },
  onUpdateCanvasBackground,
  captions = [],
  onUpdateCaptions,
  captionStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 20,
    textColor: '#FFFFFF',
    bgColor: 'rgba(0, 0, 0, 0.75)',
    position: 'bottom',
    animation: 'none',
  },
  onUpdateCaptionStyle,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('transform');
  const [showGraphEditor, setShowGraphEditor] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!clip) {
    return (
      <div
        id="clip-inspector-empty"
        className="w-84 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#13161c] flex flex-col items-center justify-center p-6 text-center select-none text-neutral-400"
      >
        <Sliders className="w-8 h-8 mb-2 opacity-30 text-neutral-500" />
        <p className="font-semibold text-xs text-neutral-700 dark:text-neutral-300">
          No Clip Selected
        </p>
        <p className="text-[11px] text-neutral-400 mt-1 max-w-[200px]">
          Select any clip on the multi-track timeline to inspect and edit its transform, color, VFX, speed, and audio.
        </p>
      </div>
    );
  }

  // Nested property helpers
  const updateTransform = (updates: Partial<TransformProperties>) => {
    onUpdateClip(clip.id, {
      transform: { ...clip.transform, ...updates },
    });
  };

  const updateSpeed = (updates: Partial<SpeedProperties>) => {
    onUpdateClip(clip.id, {
      speed: { ...clip.speed, ...updates },
    });
  };

  const updateText = (updates: Partial<TextProperties>) => {
    if (!clip.text) return;
    onUpdateClip(clip.id, {
      text: { ...clip.text, ...updates },
    });
  };

  // Keyframe helpers
  const handleAddKeyframe = (
    property: 'positionX' | 'positionY' | 'scale' | 'rotation' | 'opacity' | 'volume' | 'exposure' | 'saturation',
    interpolation: KeyframeInterpolation = 'ease-in-out'
  ) => {
    const relativeTime = Math.max(0, playheadSec - clip.startSec);
    let value = 0;
    if (property in clip.transform) {
      value = (clip.transform as any)[property] || 0;
    } else if (property === 'volume') {
      value = clip.audio.volume;
    } else if (property === 'exposure') {
      value = clip.colorAdjustments.exposure;
    } else if (property === 'saturation') {
      value = clip.colorAdjustments.saturation;
    }

    const newKeyframe = {
      id: `kf-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timeSec: Math.round(relativeTime * 100) / 100,
      property,
      value,
      interpolation,
    };

    onUpdateClip(clip.id, {
      keyframes: [...(clip.keyframes || []), newKeyframe],
    });
  };

  const handleDeleteKeyframe = (id: string) => {
    onUpdateClip(clip.id, {
      keyframes: (clip.keyframes || []).filter(k => k.id !== id),
    });
  };

  const handleUpdateKeyframeInterpolation = (id: string, interpolation: KeyframeInterpolation) => {
    onUpdateClip(clip.id, {
      keyframes: (clip.keyframes || []).map(k => (k.id === id ? { ...k, interpolation } : k)),
    });
  };

  const handleCopy = () => {
    if (onCopyAttributes) {
      onCopyAttributes(clip);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  const isTextClip = clip.type === 'text';
  const hasAudio = clip.type === 'audio' || clip.type === 'video';

  return (
    <div
      id="clip-inspector-panel"
      className="w-84 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#13161c] flex flex-col justify-between text-xs select-none shrink-0 overflow-hidden"
    >
      {/* Top Header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={clip.title}
            onChange={e => onUpdateClip(clip.id, { title: e.target.value })}
            className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-neutral-500 focus:outline-none w-full truncate"
          />
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <span
              className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold ${
                clip.type === 'adjustment'
                  ? 'bg-purple-500/10 text-purple-600'
                  : clip.type === 'compound'
                  ? 'bg-indigo-500/10 text-indigo-600'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
              }`}
            >
              {clip.type}
            </span>
            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
              {clip.trackId}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span>In: {clip.startSec.toFixed(2)}s</span>
          <span>Dur: {clip.durationSec.toFixed(2)}s</span>
          <span>Out: {(clip.startSec + clip.durationSec).toFixed(2)}s</span>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { id: 'transform', label: 'Transform', icon: Move },
            { id: 'filters', label: 'Filters', icon: Filter },
            { id: 'canvas', label: 'Canvas', icon: Maximize },
            { id: 'color', label: 'Color', icon: Palette },
            { id: 'vfx', label: 'VFX', icon: Wand2 },
            { id: 'speed', label: 'Speed', icon: Gauge },
            ...(hasAudio ? [{ id: 'audio', label: 'Audio', icon: Volume2 }] : []),
            ...(isTextClip ? [{ id: 'text', label: 'Text', icon: Type }] : []),
            { id: 'transition', label: 'Transitions', icon: ArrowRightLeft },
            { id: 'captions', label: 'Captions', icon: Subtitles },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as InspectorTab)}
                className={`px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 transition-colors shrink-0 ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* 1. TRANSFORM TAB */}
        {activeTab === 'transform' && (
          <div className="space-y-3.5">
            {/* Blend Mode */}
            <div>
              <div className="flex justify-between text-neutral-500 mb-1">
                <span>Compositing Blend Mode</span>
                <span className="font-mono capitalize text-[10px] text-purple-600">
                  {clip.transform.blendMode || 'normal'}
                </span>
              </div>
              <select
                value={clip.transform.blendMode || 'normal'}
                onChange={e => updateTransform({ blendMode: e.target.value as BlendMode })}
                className="w-full px-2 py-1 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs"
              >
                {BLEND_MODES.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fit Mode */}
            <div>
              <div className="flex justify-between text-neutral-500 mb-1">
                <span>Fit Mode (Scale & Framing)</span>
                <span className="font-mono capitalize text-[10px] text-purple-600">
                  {clip.transform.fitMode || 'fill'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {(['fill', 'fit', 'stretch'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => updateTransform({ fitMode: mode })}
                    className={`py-1 rounded border capitalize ${
                      (clip.transform.fitMode || 'fill') === mode
                        ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                    }`}
                  >
                    {mode === 'fill' ? 'Fill (Cover)' : mode === 'fit' ? 'Fit (Contain)' : 'Stretch'}
                  </button>
                ))}
              </div>
            </div>

            {/* Position X / Y */}
            <div>
              <div className="flex justify-between text-neutral-500 mb-1">
                <span>Position (X, Y)</span>
                <span className="font-mono text-[10px] text-neutral-400">
                  {clip.transform.positionX}px, {clip.transform.positionY}px
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-neutral-400 font-mono">X:</span>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    value={clip.transform.positionX}
                    onChange={e => updateTransform({ positionX: Number(e.target.value) })}
                    className="w-full accent-neutral-900 dark:accent-neutral-100 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 font-mono">Y:</span>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    value={clip.transform.positionY}
                    onChange={e => updateTransform({ positionY: Number(e.target.value) })}
                    className="w-full accent-neutral-900 dark:accent-neutral-100 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Scale */}
            <div>
              <div className="flex justify-between text-neutral-500 mb-1">
                <span>Scale</span>
                <span className="font-mono">{clip.transform.scale}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                value={clip.transform.scale}
                onChange={e => updateTransform({ scale: Number(e.target.value) })}
                className="w-full accent-neutral-900 dark:accent-neutral-100 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded"
              />
            </div>

            {/* Rotation */}
            <div>
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span>Rotation</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{clip.transform.rotation}°</span>
                  <button
                    onClick={() =>
                      updateTransform({ rotation: ((clip.transform.rotation + 90) % 360) - 180 })
                    }
                    className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    title="Rotate 90 degrees"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={clip.transform.rotation}
                onChange={e => updateTransform({ rotation: Number(e.target.value) })}
                className="w-full accent-neutral-900 dark:accent-neutral-100 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded"
              />
            </div>

            {/* Flip Controls */}
            <div>
              <label className="text-neutral-500 block mb-1">Orientation Flip</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateTransform({ flipHorizontal: !clip.transform.flipHorizontal })}
                  className={`py-1.5 px-2 rounded border flex items-center justify-center gap-1.5 text-[11px] ${
                    clip.transform.flipHorizontal
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent font-medium'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Horizontal</span>
                </button>

                <button
                  onClick={() => updateTransform({ flipVertical: !clip.transform.flipVertical })}
                  className={`py-1.5 px-2 rounded border flex items-center justify-center gap-1.5 text-[11px] ${
                    clip.transform.flipVertical
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent font-medium'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Vertical</span>
                </button>
              </div>
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between text-neutral-500 mb-1">
                <span>Opacity</span>
                <span className="font-mono">{clip.transform.opacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={clip.transform.opacity}
                onChange={e => updateTransform({ opacity: Number(e.target.value) })}
                className="w-full accent-neutral-900 dark:accent-neutral-100 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded"
              />
            </div>

            {/* Crop Settings */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <label className="text-neutral-500 font-medium block mb-1.5">Crop Margins (%)</label>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-neutral-400">Top: {clip.transform.cropTop}%</span>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={clip.transform.cropTop}
                    onChange={e => updateTransform({ cropTop: Number(e.target.value) })}
                    className="w-full accent-neutral-900 dark:accent-neutral-100 h-1 bg-neutral-200 dark:bg-neutral-800 rounded"
                  />
                </div>
                <div>
                  <span className="text-neutral-400">Bottom: {clip.transform.cropBottom}%</span>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={clip.transform.cropBottom}
                    onChange={e => updateTransform({ cropBottom: Number(e.target.value) })}
                    className="w-full accent-neutral-900 dark:accent-neutral-100 h-1 bg-neutral-200 dark:bg-neutral-800 rounded"
                  />
                </div>
                <div>
                  <span className="text-neutral-400">Left: {clip.transform.cropLeft}%</span>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={clip.transform.cropLeft}
                    onChange={e => updateTransform({ cropLeft: Number(e.target.value) })}
                    className="w-full accent-neutral-900 dark:accent-neutral-100 h-1 bg-neutral-200 dark:bg-neutral-800 rounded"
                  />
                </div>
                <div>
                  <span className="text-neutral-400">Right: {clip.transform.cropRight}%</span>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={clip.transform.cropRight}
                    onChange={e => updateTransform({ cropRight: Number(e.target.value) })}
                    className="w-full accent-neutral-900 dark:accent-neutral-100 h-1 bg-neutral-200 dark:bg-neutral-800 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Keyframes & Graph Editor Foundation */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Advanced Keyframes</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowGraphEditor(g => !g)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                      showGraphEditor
                        ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Graph Curve
                  </button>
                  <button
                    onClick={() => handleAddKeyframe('scale', 'ease-in-out')}
                    className="text-[10px] text-purple-600 font-medium flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Scale KF</span>
                  </button>
                  <button
                    onClick={() => handleAddKeyframe('positionX', 'ease-in-out')}
                    className="text-[10px] text-purple-600 font-medium flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Pos KF</span>
                  </button>
                </div>
              </div>

              {/* Mini Graph Curve Preview */}
              {showGraphEditor && (
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span>Bezier Interpolation Curve</span>
                    <span className="font-mono text-purple-400">Ease-In-Out (S-Spline)</span>
                  </div>
                  <div className="h-14 w-full relative flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <path
                        d="M 5,35 C 35,35 65,5 95,5"
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="5" cy="35" r="3" fill="#ffffff" />
                      <circle cx="95" cy="5" r="3" fill="#ffffff" />
                    </svg>
                  </div>
                </div>
              )}

              {(clip.keyframes || []).length === 0 ? (
                <p className="text-[10px] text-neutral-400 italic">No keyframes recorded on clip</p>
              ) : (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {clip.keyframes.map(kf => (
                    <div
                      key={kf.id}
                      className="flex items-center justify-between p-1.5 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px]"
                    >
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {kf.property}
                        </span>
                        <span className="text-neutral-400">@{kf.timeSec}s: {kf.value}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <select
                          value={kf.interpolation || 'ease-in-out'}
                          onChange={e =>
                            handleUpdateKeyframeInterpolation(kf.id, e.target.value as any)
                          }
                          className="px-1 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[9px]"
                        >
                          <option value="linear">Linear</option>
                          <option value="ease-in">Ease-In</option>
                          <option value="ease-out">Ease-Out</option>
                          <option value="ease-in-out">Ease-In/Out</option>
                        </select>
                        <button
                          onClick={() => handleDeleteKeyframe(kf.id)}
                          className="text-neutral-400 hover:text-red-500 p-0.5"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. COLOR TAB */}
        {activeTab === 'color' && (
          <ColorGradingPanel
            clip={clip}
            onUpdateColor={updates =>
              onUpdateClip(clip.id, {
                colorAdjustments: { ...clip.colorAdjustments, ...updates },
              })
            }
          />
        )}

        {/* 3. VFX TAB */}
        {activeTab === 'vfx' && (
          <VFXInspectorPanel
            clip={clip}
            onUpdateClip={updates => onUpdateClip(clip.id, updates)}
            onSaveAsVersion={onSaveAsVersion}
          />
        )}

        {/* 4. SPEED & TIME REMAPPING TAB */}
        {activeTab === 'speed' && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-neutral-500 mb-1">
                <span>Playback Speed Rate</span>
                <span className="font-mono font-medium text-purple-600">{clip.speed.speed}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="8.0"
                step="0.05"
                value={clip.speed.speed}
                onChange={e => updateSpeed({ speed: Number(e.target.value) })}
                className="w-full accent-purple-600 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded"
              />
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-1">
              {[0.25, 0.5, 1.0, 1.5, 2.0, 4.0, 8.0].map(s => (
                <button
                  key={s}
                  onClick={() => updateSpeed({ speed: s })}
                  className={`py-1 rounded font-mono text-[11px] border ${
                    clip.speed.speed === s
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent font-medium'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Reverse & Freeze Frame */}
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-neutral-700 dark:text-neutral-300">
                  Reverse Video Playback
                </span>
                <input
                  type="checkbox"
                  checked={clip.speed.reverse}
                  onChange={e => updateSpeed({ reverse: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-neutral-700 dark:text-neutral-300">
                  Freeze Frame at In-Point
                </span>
                <input
                  type="checkbox"
                  checked={clip.speed.freezeFrame}
                  onChange={e => updateSpeed({ freezeFrame: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-neutral-700 dark:text-neutral-300">
                  Preserve Audio Pitch
                </span>
                <input
                  type="checkbox"
                  checked={clip.speed.preservePitch ?? true}
                  onChange={e => updateSpeed({ preservePitch: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-0"
                />
              </label>
            </div>

            {/* Speed Ramp Foundation */}
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px] text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                  <span>Dynamic Speed Ramp</span>
                </span>
                <span className="text-[10px] text-neutral-400 capitalize">{clip.speed.ramp}</span>
              </div>

              <div className="grid grid-cols-4 gap-1 text-[10px]">
                {(['linear', 'ease-in', 'ease-out', 'smooth'] as const).map(ramp => (
                  <button
                    key={ramp}
                    onClick={() => updateSpeed({ ramp })}
                    className={`py-1 rounded border capitalize ${
                      clip.speed.ramp === ramp
                        ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                    }`}
                  >
                    {ramp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. AUDIO TAB */}
        {activeTab === 'audio' && (
          <AudioMixerPanel
            clip={clip}
            tracks={tracks}
            onUpdateAudio={updates =>
              onUpdateClip(clip.id, {
                audio: { ...clip.audio, ...updates },
              })
            }
          />
        )}

        {/* 6. TEXT / MOTION GRAPHICS TAB */}
        {activeTab === 'text' && clip.text && (
          <div className="space-y-3.5">
            <div>
              <label className="text-neutral-500 block mb-1">Text Content</label>
              <textarea
                value={clip.text.text}
                onChange={e => updateText({ text: e.target.value })}
                rows={2}
                className="w-full px-2.5 py-1.5 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs font-semibold focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-neutral-500 block mb-1">Font Family</span>
                <select
                  value={clip.text.fontFamily}
                  onChange={e => updateText({ fontFamily: e.target.value })}
                  className="w-full px-2 py-1 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs"
                >
                  <option value="system-ui, sans-serif">Sans-Serif Clean</option>
                  <option value="Georgia, serif">Editorial Serif</option>
                  <option value="'Courier New', monospace">Technical Mono</option>
                  <option value="'Impact', sans-serif">Bold Headline Impact</option>
                </select>
              </div>

              <div>
                <span className="text-neutral-500 block mb-1">Font Size ({clip.text.fontSize}px)</span>
                <input
                  type="range"
                  min="16"
                  max="120"
                  value={clip.text.fontSize}
                  onChange={e => updateText({ fontSize: Number(e.target.value) })}
                  className="w-full accent-neutral-900 dark:accent-neutral-100 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded"
                />
              </div>
            </div>

            <div>
              <span className="text-neutral-500 block mb-1">Motion Graphics Animation</span>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {(['none', 'fade', 'slide-up', 'slide-down', 'typewriter', 'zoom', 'pop', 'glow'] as const).map(
                  anim => (
                    <button
                      key={anim}
                      onClick={() => updateText({ animation: anim as any })}
                      className={`py-1 rounded border capitalize ${
                        clip.text?.animation === anim
                          ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                      }`}
                    >
                      {anim}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Text Fill Color</span>
              <input
                type="color"
                value={clip.text.color}
                onChange={e => updateText({ color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 p-0"
              />
            </div>
          </div>
        )}

        {/* 2. FILTERS TAB */}
        {activeTab === 'filters' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-neutral-500">
              <span>Cinematic Filter Presets</span>
              <span className="font-mono text-[10px] capitalize text-purple-600">
                {clip.filterPreset || 'none'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'Original', color: 'bg-neutral-800' },
                { id: 'vintage-70s', label: 'Vintage 70s', color: 'bg-amber-900/60' },
                { id: 'cyberpunk', label: 'Cyberpunk', color: 'bg-pink-900/60' },
                { id: 'noir', label: 'Noir (B&W)', color: 'bg-neutral-700' },
                { id: 'teal-orange', label: 'Teal & Orange', color: 'bg-cyan-900/60' },
                { id: 'warm-sunset', label: 'Warm Sunset', color: 'bg-orange-900/60' },
                { id: 'cold-fresh', label: 'Cold Fresh', color: 'bg-blue-900/60' },
                { id: 'vhs-glitch', label: 'VHS Glitch', color: 'bg-purple-900/60' },
                { id: 'film-grain', label: '35mm Film', color: 'bg-stone-800' },
              ].map(f => {
                const isSelected = (clip.filterPreset || 'none') === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onUpdateClip(clip.id, { filterPreset: f.id })}
                    className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                    }`}
                  >
                    <div className={`w-full h-7 rounded ${f.color} border border-white/10`} />
                    <span className="text-[10px] truncate w-full">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. CANVAS BACKGROUND TAB */}
        {activeTab === 'canvas' && onUpdateCanvasBackground && (
          <div className="space-y-4">
            <div>
              <span className="text-neutral-500 block mb-1.5">Canvas Backdrop Style</span>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {(['color', 'blur', 'gradient'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => onUpdateCanvasBackground({ ...canvasBackground, type })}
                    className={`py-1.5 rounded border capitalize font-medium ${
                      canvasBackground.type === type
                        ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                    }`}
                  >
                    {type === 'color' ? 'Solid Color' : type === 'blur' ? 'Blurred Video' : 'Gradient'}
                  </button>
                ))}
              </div>
            </div>

            {canvasBackground.type === 'color' && (
              <div className="space-y-2">
                <span className="text-neutral-500 text-[11px] block">Backdrop Color Swatches</span>
                <div className="flex items-center gap-2">
                  {['#000000', '#0f172a', '#18181b', '#1e293b', '#2e1065', '#ffffff'].map(c => (
                    <button
                      key={c}
                      onClick={() => onUpdateCanvasBackground({ ...canvasBackground, color: c })}
                      className="w-7 h-7 rounded-full border border-neutral-700 hover:scale-110 transition-transform shadow-xs"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={canvasBackground.color || '#000000'}
                    onChange={e => onUpdateCanvasBackground({ ...canvasBackground, color: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                    title="Custom color"
                  />
                </div>
              </div>
            )}

            {canvasBackground.type === 'blur' && (
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-1 text-xs">
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Full-Bleed Dynamic Blur
                </p>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Automatically mirrors and blurs the active video behind portrait or square media to eliminate black bars.
                </p>
              </div>
            )}

            {canvasBackground.type === 'gradient' && (
              <div className="space-y-2">
                <span className="text-neutral-500 text-[11px] block">Gradient Presets</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Cyber Dark', val: 'linear-gradient(135deg, #090a0f 0%, #1c1427 100%)' },
                    { label: 'Deep Ocean', val: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)' },
                    { label: 'Twilight Rose', val: 'linear-gradient(135deg, #180d19 0%, #291024 100%)' },
                    { label: 'Studio Neutral', val: 'linear-gradient(135deg, #1f1f23 0%, #121215 100%)' },
                  ].map(g => (
                    <button
                      key={g.label}
                      onClick={() => onUpdateCanvasBackground({ ...canvasBackground, gradient: g.val })}
                      className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-left hover:border-neutral-400 transition-colors"
                      style={{ backgroundImage: g.val }}
                    >
                      <span className="text-[10px] font-medium text-white shadow-xs block">
                        {g.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. TRANSITIONS TAB */}
        {activeTab === 'transition' && (
          <div className="space-y-3.5">
            {/* Transition In */}
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2">
              <span className="font-semibold text-[11px] text-neutral-800 dark:text-neutral-200 block">
                Transition In
              </span>
              <select
                value={clip.transitionIn?.type || 'none'}
                onChange={e =>
                  onUpdateClip(clip.id, {
                    transitionIn: {
                      type: e.target.value as TransitionType,
                      durationSec: clip.transitionIn?.durationSec || 0.5,
                    },
                  })
                }
                className="w-full px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
              >
                <option value="none">None (Hard Cut)</option>
                <option value="crossfade">Crossfade (Dissolve)</option>
                <option value="film-dissolve">Film Dissolve</option>
                <option value="dip-black">Dip to Black</option>
                <option value="dip-white">Dip to White</option>
                <option value="wipe-left">Wipe Left</option>
                <option value="wipe-right">Wipe Right</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
                <option value="slide-up">Slide Up</option>
                <option value="slide-down">Slide Down</option>
                <option value="zoom-in">Punch In Zoom</option>
                <option value="zoom-out">Zoom Out</option>
                <option value="motion-blur-dissolve">Motion Blur Dissolve</option>
                <option value="glitch">Glitch Pulse</option>
                <option value="flash">Flash Strobe</option>
                <option value="push-left">Push Left</option>
                <option value="push-right">Push Right</option>
                <option value="whip-pan">Whip Pan Action</option>
              </select>

              {clip.transitionIn?.type !== 'none' && (
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                    <span>In Duration</span>
                    <span className="font-mono">{clip.transitionIn?.durationSec || 0.5}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.5"
                    step="0.1"
                    value={clip.transitionIn?.durationSec || 0.5}
                    onChange={e =>
                      onUpdateClip(clip.id, {
                        transitionIn: {
                          type: clip.transitionIn?.type || 'crossfade',
                          durationSec: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-neutral-900 dark:accent-neutral-100 h-1 bg-neutral-200 dark:bg-neutral-800 rounded"
                  />
                </div>
              )}
            </div>

            {/* Transition Out */}
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2">
              <span className="font-semibold text-[11px] text-neutral-800 dark:text-neutral-200 block">
                Transition Out
              </span>
              <select
                value={clip.transitionOut?.type || 'none'}
                onChange={e =>
                  onUpdateClip(clip.id, {
                    transitionOut: {
                      type: e.target.value as TransitionType,
                      durationSec: clip.transitionOut?.durationSec || 0.5,
                    },
                  })
                }
                className="w-full px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
              >
                <option value="none">None (Hard Cut)</option>
                <option value="crossfade">Crossfade (Dissolve)</option>
                <option value="film-dissolve">Film Dissolve</option>
                <option value="dip-black">Dip to Black</option>
                <option value="dip-white">Dip to White</option>
                <option value="wipe-left">Wipe Left</option>
                <option value="wipe-right">Wipe Right</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
                <option value="slide-up">Slide Up</option>
                <option value="slide-down">Slide Down</option>
                <option value="zoom-in">Punch In Zoom</option>
                <option value="zoom-out">Whip Zoom Out</option>
                <option value="motion-blur-dissolve">Motion Blur Dissolve</option>
                <option value="glitch">Glitch Pulse</option>
                <option value="flash">Flash Strobe</option>
                <option value="push-left">Push Left</option>
                <option value="push-right">Push Right</option>
                <option value="whip-pan">Whip Pan Action</option>
              </select>
            </div>
          </div>
        )}

        {/* 8. CAPTIONS & SUBTITLES TAB */}
        {activeTab === 'captions' && onUpdateCaptions && onUpdateCaptionStyle && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                Auto-Captions & Subtitles
              </span>
              <button
                onClick={() => {
                  // Generate realistic captions from clip length
                  const capList = [
                    { id: 'c1', startSec: 0, endSec: Math.min(3, clip.durationSec), text: 'Welcome to this edit!' },
                    { id: 'c2', startSec: 3.5, endSec: Math.min(7, clip.durationSec), text: 'Crafted with VYRO Studio' },
                  ];
                  onUpdateCaptions(capList);
                }}
                className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-[10px] flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Generate</span>
              </button>
            </div>

            {/* Caption Style Options */}
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2.5">
              <span className="text-[10px] uppercase font-mono font-bold text-neutral-500 block">
                Caption Typography & Style
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-neutral-500 block text-[10px] mb-0.5">Position</span>
                  <select
                    value={captionStyle.position}
                    onChange={e => onUpdateCaptionStyle({ ...captionStyle, position: e.target.value as any })}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                  >
                    <option value="bottom">Bottom (Standard)</option>
                    <option value="middle">Middle (Punchy)</option>
                    <option value="top">Top (Headlines)</option>
                  </select>
                </div>

                <div>
                  <span className="text-neutral-500 block text-[10px] mb-0.5">Animation</span>
                  <select
                    value={captionStyle.animation}
                    onChange={e => onUpdateCaptionStyle({ ...captionStyle, animation: e.target.value as any })}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                  >
                    <option value="none">Static</option>
                    <option value="pop">Pop (TikTok style)</option>
                    <option value="fade">Smooth Fade</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                  <span>Font Size</span>
                  <span className="font-mono">{captionStyle.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="36"
                  value={captionStyle.fontSize}
                  onChange={e => onUpdateCaptionStyle({ ...captionStyle, fontSize: Number(e.target.value) })}
                  className="w-full accent-neutral-900 dark:accent-neutral-100 h-1 bg-neutral-200 dark:bg-neutral-800 rounded"
                />
              </div>
            </div>

            {/* Captions List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span>Captions ({captions.length})</span>
                <button
                  onClick={() => {
                    const newCap = {
                      id: `cap-${Date.now()}`,
                      startSec: playheadSec,
                      endSec: Math.min(clip.durationSec, playheadSec + 3),
                      text: 'New Subtitle line',
                    };
                    onUpdateCaptions([...captions, newCap]);
                  }}
                  className="text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-0.5 text-[10px]"
                >
                  <Plus className="w-3 h-3" /> Add Line
                </button>
              </div>

              {captions.map((cap, idx) => (
                <div
                  key={cap.id}
                  className="p-2 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-2"
                >
                  <input
                    type="text"
                    value={cap.text}
                    onChange={e => {
                      const updated = [...captions];
                      updated[idx].text = e.target.value;
                      onUpdateCaptions(updated);
                    }}
                    className="w-full text-xs bg-transparent border-0 focus:outline-none text-neutral-800 dark:text-neutral-200 font-medium"
                  />
                  <span className="text-[9px] font-mono text-neutral-400 shrink-0">
                    {cap.startSec.toFixed(1)}s
                  </span>
                  <button
                    onClick={() => {
                      onUpdateCaptions(captions.filter(c => c.id !== cap.id));
                    }}
                    className="text-neutral-400 hover:text-red-500 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2 shrink-0">
        {/* Extended Tools: Freeze Frame & Extract Audio */}
        <div className="grid grid-cols-2 gap-1.5">
          {onFreezeClip && (
            <button
              onClick={() => onFreezeClip(clip.id)}
              className="py-1.5 px-2 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[10px] font-medium flex items-center justify-center gap-1 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Freeze frame at playhead"
            >
              <Snowflake className="w-3 h-3 text-cyan-500" />
              <span>Freeze Frame</span>
            </button>
          )}

          {onExtractAudio && hasAudio && (
            <button
              onClick={() => onExtractAudio(clip.id)}
              className="py-1.5 px-2 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[10px] font-medium flex items-center justify-center gap-1 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Detach / Extract audio to music track"
            >
              <Volume2 className="w-3 h-3 text-emerald-500" />
              <span>Extract Audio</span>
            </button>
          )}
        </div>

        {/* Copy / Paste Attributes */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleCopy}
            className="py-1.5 px-2 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-medium flex items-center justify-center gap-1 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            {copiedNotification ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-neutral-500" />
            )}
            <span>{copiedNotification ? 'Copied!' : 'Copy Attributes'}</span>
          </button>

          <button
            onClick={() => onPasteAttributes && onPasteAttributes(clip.id)}
            disabled={!hasClipboard}
            className="py-1.5 px-2 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-medium flex items-center justify-center gap-1 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Paste Attributes</span>
          </button>
        </div>

        {/* Action Buttons: Split, Duplicate, Delete */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onSplitClip(clip.id)}
            className="py-1.5 px-2 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[10px] font-medium flex items-center justify-center gap-1 text-neutral-700 dark:text-neutral-300"
            title="Split clip at playhead"
          >
            <Scissors className="w-3 h-3 text-neutral-500" />
            <span>Split</span>
          </button>

          <button
            onClick={() => onDuplicateClip(clip.id)}
            className="py-1.5 px-2 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[10px] font-medium flex items-center justify-center gap-1 text-neutral-700 dark:text-neutral-300"
            title="Duplicate clip"
          >
            <Copy className="w-3 h-3 text-neutral-500" />
            <span>Duplicate</span>
          </button>

          <button
            onClick={() => onDeleteClip(clip.id)}
            className="py-1.5 px-2 rounded border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-[10px] font-medium flex items-center justify-center gap-1 text-red-600 dark:text-red-400"
            title="Delete clip"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
