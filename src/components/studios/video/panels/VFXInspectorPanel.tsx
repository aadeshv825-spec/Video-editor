import React, { useState } from 'react';
import {
  Wand2,
  Crop,
  Layers,
  Sparkles,
  Compass,
  Video,
  Activity,
  Maximize,
  Eye,
  Check,
  RotateCcw,
  Sliders,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  TimelineClip,
  ClipMask,
  ChromaKeySettings,
  CornerPinSettings,
  MotionBlurSettings,
  StabilizationSettings,
  OpticalFlowSettings,
  TrackData,
} from '../../../../types/videoEditor';
import { useRenderQueue } from '../../../../context/RenderQueueContext';

interface VFXInspectorPanelProps {
  clip: TimelineClip;
  onUpdateClip: (updates: Partial<TimelineClip>) => void;
  onSaveAsVersion?: (description: string) => void;
}

type VFXSubTab = 'masking' | 'chroma' | 'tracking' | 'cornerPin' | 'stabilize' | 'motionBlur';

export const VFXInspectorPanel: React.FC<VFXInspectorPanelProps> = ({
  clip,
  onUpdateClip,
  onSaveAsVersion,
}) => {
  const [subTab, setSubTab] = useState<VFXSubTab>('masking');
  const { addJob } = useRenderQueue();

  // Masking helpers
  const masks = clip.masks || [];
  const handleAddMask = (type: 'rectangle' | 'ellipse' | 'path') => {
    const newMask: ClipMask = {
      id: `mask-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Mask ${masks.length + 1}`,
      type,
      feather: 15,
      opacity: 100,
      expansion: 0,
      inverted: false,
      enabled: true,
      rectX: 20,
      rectY: 20,
      rectWidth: 60,
      rectHeight: 60,
    };
    onUpdateClip({ masks: [...masks, newMask] });
  };

  const handleUpdateMask = (maskId: string, updates: Partial<ClipMask>) => {
    onUpdateClip({
      masks: masks.map(m => (m.id === maskId ? { ...m, ...updates } : m)),
    });
  };

  const handleRemoveMask = (maskId: string) => {
    onUpdateClip({ masks: masks.filter(m => m.id !== maskId) });
  };

  // Chroma Key helpers
  const chroma = clip.chromaKey || {
    enabled: false,
    keyColor: '#00FF00',
    tolerance: 45,
    softness: 20,
    spillSuppression: 60,
    edgeRefinement: 10,
    feather: 5,
    mattePreview: 'composite',
  };

  const updateChroma = (updates: Partial<ChromaKeySettings>) => {
    onUpdateClip({ chromaKey: { ...chroma, ...updates } });
  };

  // Corner Pin helpers
  const cornerPin = clip.cornerPin || {
    enabled: false,
    topLeft: { x: 10, y: 10 },
    topRight: { x: 90, y: 10 },
    bottomRight: { x: 90, y: 90 },
    bottomLeft: { x: 10, y: 90 },
  };

  const updateCornerPin = (updates: Partial<CornerPinSettings>) => {
    onUpdateClip({ cornerPin: { ...cornerPin, ...updates } });
  };

  // Motion Blur helpers
  const motionBlur = clip.motionBlur || {
    enabled: false,
    amount: 50,
    shutterAngle: 180,
  };

  // Stabilization helpers
  const defaultStabilization: StabilizationSettings = {
    enabled: false,
    mode: 'smooth',
    cropAmount: 10,
    smoothing: 60,
    framing: 'crop',
    status: 'none',
  };
  const stabilization: StabilizationSettings =
    typeof clip.stabilization === 'object' && clip.stabilization !== null
      ? clip.stabilization
      : defaultStabilization;

  const handleQueueStabilization = () => {
    onUpdateClip({
      stabilization: { ...stabilization, enabled: true, status: 'processing' },
    });

    addJob({
      title: `Optical Stabilization (${stabilization.mode.toUpperCase()})`,
      projectTitle: clip.title,
      type: 'stabilization',
      metadata: { clipId: clip.id, smoothing: stabilization.smoothing },
    });

    if (onSaveAsVersion) {
      onSaveAsVersion(`Pre-Stabilization Checkpoint for "${clip.title}"`);
    }

    setTimeout(() => {
      onUpdateClip({
        stabilization: { ...stabilization, enabled: true, status: 'applied' },
      });
    }, 4000);
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
          <Wand2 className="w-4 h-4 text-purple-500" />
          <span>VFX & Compositing Suite</span>
        </div>
        <span className="text-[10px] font-mono text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded">
          Non-Destructive Layers
        </span>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        {(
          [
            { id: 'masking', label: 'Masking' },
            { id: 'chroma', label: 'Chroma Key' },
            { id: 'tracking', label: 'Motion Track' },
            { id: 'cornerPin', label: 'Corner Pin' },
            { id: 'stabilize', label: 'Stabilize' },
            { id: 'motionBlur', label: 'Motion Blur' },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              subTab === tab.id
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: MASKING */}
      {subTab === 'masking' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              Alpha Cutout & Effect Masks
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAddMask('rectangle')}
                className="px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-[10px] hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Rect</span>
              </button>
              <button
                onClick={() => handleAddMask('ellipse')}
                className="px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-[10px] hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Ellipse</span>
              </button>
            </div>
          </div>

          {masks.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-800 text-center text-neutral-400 space-y-1">
              <Crop className="w-6 h-6 mx-auto opacity-30" />
              <p className="text-[11px]">No active masks on this clip.</p>
              <p className="text-[10px] text-neutral-500">
                Add a Rectangle or Ellipse mask to isolate subject, create focus vignettes, or target color grades.
              </p>
            </div>
          ) : (
            masks.map(mask => (
              <div
                key={mask.id}
                className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mask.enabled}
                      onChange={e => handleUpdateMask(mask.id, { enabled: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      {mask.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveMask(mask.id)}
                    className="text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                      <span>Feather</span>
                      <span className="font-mono">{mask.feather}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mask.feather}
                      onChange={e => handleUpdateMask(mask.id, { feather: Number(e.target.value) })}
                      className="w-full accent-purple-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                      <span>Opacity</span>
                      <span className="font-mono">{mask.opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mask.opacity}
                      onChange={e => handleUpdateMask(mask.id, { opacity: Number(e.target.value) })}
                      className="w-full accent-purple-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-200 dark:border-neutral-800 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mask.inverted}
                      onChange={e => handleUpdateMask(mask.id, { inverted: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                    <span>Invert Mask Alpha</span>
                  </label>
                  <span className="text-[10px] text-purple-600 font-mono">Live Matte Active</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: CHROMA KEY */}
      {subTab === 'chroma' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              Green / Blue Screen Keyer
            </span>
            <label className="flex items-center gap-1 text-[11px] cursor-pointer">
              <input
                type="checkbox"
                checked={chroma.enabled}
                onChange={e => updateChroma({ enabled: e.target.checked })}
                className="rounded text-emerald-500 focus:ring-0"
              />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">Enable Chroma Key</span>
            </label>
          </div>

          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-3">
            {/* Key color preset */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400">Target Screen Color</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateChroma({ keyColor: '#00FF00' })}
                  className={`w-5 h-5 rounded-full bg-[#00FF00] border ${
                    chroma.keyColor === '#00FF00' ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                  }`}
                  title="Green Screen Preset"
                />
                <button
                  onClick={() => updateChroma({ keyColor: '#0044FF' })}
                  className={`w-5 h-5 rounded-full bg-[#0044FF] border ${
                    chroma.keyColor === '#0044FF' ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                  }`}
                  title="Blue Screen Preset"
                />
                <input
                  type="color"
                  value={chroma.keyColor}
                  onChange={e => updateChroma({ keyColor: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                  title="Custom Eyedropper Color"
                />
              </div>
            </div>

            {/* Sliders */}
            <div>
              <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                <span>Color Tolerance</span>
                <span className="font-mono">{chroma.tolerance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={chroma.tolerance}
                onChange={e => updateChroma({ tolerance: Number(e.target.value) })}
                className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                <span>Edge Softness</span>
                <span className="font-mono">{chroma.softness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={chroma.softness}
                onChange={e => updateChroma({ softness: Number(e.target.value) })}
                className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                <span>Spill Suppression (Anti-Green Halo)</span>
                <span className="font-mono">{chroma.spillSuppression}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={chroma.spillSuppression}
                onChange={e => updateChroma({ spillSuppression: Number(e.target.value) })}
                className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            {/* Matte preview modes */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] text-neutral-500">Monitor Mode</span>
              <div className="flex items-center gap-1">
                {(['composite', 'matte', 'color'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => updateChroma({ mattePreview: mode })}
                    className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                      chroma.mattePreview === mode
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'border border-neutral-200 dark:border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: MOTION TRACKING */}
      {subTab === 'tracking' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>Unified Track Data Architecture</span>
            </span>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Generate 2D point tracks or bounding box object tracks to drive text callouts, masks, or overlays.
            </p>

            <div className="p-2.5 rounded bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Track 01 (Forward Optical Flow)</span>
                <span className="text-emerald-500 font-mono text-[10px]">98.4% Confidence</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded">Position X/Y</span>
                <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded">Scale</span>
                <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded">Rotation</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400">Attach Element to Track:</span>
              <select
                value={clip.trackingAttachment?.attachType || 'position'}
                onChange={e =>
                  onUpdateClip({
                    trackingAttachment: {
                      trackId: 'track-01',
                      attachType: e.target.value as any,
                    },
                  })
                }
                className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px]"
              >
                <option value="position">Position Follow</option>
                <option value="scale">Scale & Position</option>
                <option value="rotation">Full Rigid (Pos/Scale/Rot)</option>
                <option value="corner-pin">Planar Surface Pin</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab: CORNER PIN */}
      {subTab === 'cornerPin' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              4-Corner Perspective Mapping
            </span>
            <label className="flex items-center gap-1 text-[11px] cursor-pointer">
              <input
                type="checkbox"
                checked={cornerPin.enabled}
                onChange={e => updateCornerPin({ enabled: e.target.checked })}
                className="rounded text-purple-600 focus:ring-0"
              />
              <span>Enable Corner Pin</span>
            </label>
          </div>

          <p className="text-[11px] text-neutral-500">
            Map footage or graphics onto phone screens, billboards, or angled surfaces with 3D perspective projection.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
              <span className="font-semibold text-[10px] text-neutral-600 dark:text-neutral-300 block">Top-Left</span>
              <div className="flex items-center gap-1 text-[10px]">
                <span>X:</span>
                <input
                  type="number"
                  value={cornerPin.topLeft.x}
                  onChange={e =>
                    updateCornerPin({
                      topLeft: { ...cornerPin.topLeft, x: Number(e.target.value) },
                    })
                  }
                  className="w-12 px-1 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
                <span>Y:</span>
                <input
                  type="number"
                  value={cornerPin.topLeft.y}
                  onChange={e =>
                    updateCornerPin({
                      topLeft: { ...cornerPin.topLeft, y: Number(e.target.value) },
                    })
                  }
                  className="w-12 px-1 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
              </div>
            </div>

            <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
              <span className="font-semibold text-[10px] text-neutral-600 dark:text-neutral-300 block">Top-Right</span>
              <div className="flex items-center gap-1 text-[10px]">
                <span>X:</span>
                <input
                  type="number"
                  value={cornerPin.topRight.x}
                  onChange={e =>
                    updateCornerPin({
                      topRight: { ...cornerPin.topRight, x: Number(e.target.value) },
                    })
                  }
                  className="w-12 px-1 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
                <span>Y:</span>
                <input
                  type="number"
                  value={cornerPin.topRight.y}
                  onChange={e =>
                    updateCornerPin({
                      topRight: { ...cornerPin.topRight, y: Number(e.target.value) },
                    })
                  }
                  className="w-12 px-1 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
              </div>
            </div>

            <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
              <span className="font-semibold text-[10px] text-neutral-600 dark:text-neutral-300 block">Bottom-Left</span>
              <div className="flex items-center gap-1 text-[10px]">
                <span>X:</span>
                <input
                  type="number"
                  value={cornerPin.bottomLeft.x}
                  onChange={e =>
                    updateCornerPin({
                      bottomLeft: { ...cornerPin.bottomLeft, x: Number(e.target.value) },
                    })
                  }
                  className="w-12 px-1 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
                <span>Y:</span>
                <input
                  type="number"
                  value={cornerPin.bottomLeft.y}
                  onChange={e =>
                    updateCornerPin({
                      bottomLeft: { ...cornerPin.bottomLeft, y: Number(e.target.value) },
                    })
                  }
                  className="w-12 px-1 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
              </div>
            </div>

            <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
              <span className="font-semibold text-[10px] text-neutral-600 dark:text-neutral-300 block">Bottom-Right</span>
              <div className="flex items-center gap-1 text-[10px]">
                <span>X:</span>
                <input
                  type="number"
                  value={cornerPin.bottomRight.x}
                  onChange={e =>
                    updateCornerPin({
                      bottomRight: { ...cornerPin.bottomRight, x: Number(e.target.value) },
                    })
                  }
                  className="w-12 px-1 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
                <span>Y:</span>
                <input
                  type="number"
                  value={cornerPin.bottomRight.y}
                  onChange={e =>
                    updateCornerPin({
                      bottomRight: { ...cornerPin.bottomRight, y: Number(e.target.value) },
                    })
                  }
                  className="w-12 px-1 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: STABILIZATION */}
      {subTab === 'stabilize' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-emerald-500" />
                <span>Warp & Gyro Video Stabilization</span>
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  stabilization.status === 'applied'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : stabilization.status === 'processing'
                    ? 'bg-purple-500/10 text-purple-600 animate-pulse'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                {stabilization.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(['automatic', 'smooth', 'strong'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() =>
                    onUpdateClip({
                      stabilization: { ...stabilization, mode },
                    })
                  }
                  className={`py-1.5 rounded text-[11px] font-medium capitalize border transition-all ${
                    stabilization.mode === mode
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                <span>Motion Smoothing</span>
                <span className="font-mono">{stabilization.smoothing}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={stabilization.smoothing}
                onChange={e =>
                  onUpdateClip({
                    stabilization: { ...stabilization, smoothing: Number(e.target.value) },
                  })
                }
                className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                <span>Crop Margin Limit</span>
                <span className="font-mono">{stabilization.cropAmount}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={stabilization.cropAmount}
                onChange={e =>
                  onUpdateClip({
                    stabilization: { ...stabilization, cropAmount: Number(e.target.value) },
                  })
                }
                className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <button
              onClick={handleQueueStabilization}
              disabled={stabilization.status === 'processing'}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{stabilization.status === 'applied' ? 'Re-Analyze & Stabilize' : 'Analyze & Stabilize Clip'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: MOTION BLUR */}
      {subTab === 'motionBlur' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                Transform Motion Blur
              </span>
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={motionBlur.enabled}
                  onChange={e =>
                    onUpdateClip({
                      motionBlur: { ...motionBlur, enabled: e.target.checked },
                    })
                  }
                  className="rounded text-purple-600 focus:ring-0"
                />
                <span>Enable Blur</span>
              </label>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                <span>Shutter Angle</span>
                <span className="font-mono">{motionBlur.shutterAngle}° (Cinematic standard: 180°)</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={motionBlur.shutterAngle}
                onChange={e =>
                  onUpdateClip({
                    motionBlur: { ...motionBlur, shutterAngle: Number(e.target.value) },
                  })
                }
                className="w-full accent-purple-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <p className="text-[10px] text-neutral-500">
              Only applies natural velocity-driven blur during active keyframe position, rotation, or scale transforms. Static footage is never degraded.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
