import React from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { PhotoLayer, PhotoBlendMode, PhotoLayerType } from '../../../types/photoEditor';

interface PhotoLayersPanelProps {
  layers: PhotoLayer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: (type: PhotoLayerType) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onReorderLayer: (id: string, direction: 'up' | 'down') => void;
  onUpdateLayer: (id: string, updates: Partial<PhotoLayer>) => void;
  onRevertToOriginalImage?: () => void;
}

const BLEND_MODES: { id: PhotoBlendMode; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'multiply', label: 'Multiply' },
  { id: 'screen', label: 'Screen' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'darken', label: 'Darken' },
  { id: 'lighten', label: 'Lighten' },
  { id: 'color-dodge', label: 'Color Dodge' },
  { id: 'color-burn', label: 'Color Burn' },
  { id: 'hard-light', label: 'Hard Light' },
  { id: 'soft-light', label: 'Soft Light' },
  { id: 'difference', label: 'Difference' },
  { id: 'exclusion', label: 'Exclusion' },
];

export const PhotoLayersPanel: React.FC<PhotoLayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onReorderLayer,
  onUpdateLayer,
  onRevertToOriginalImage,
}) => {
  const activeLayer = layers.find(l => l.id === activeLayerId);
  const activeIndex = layers.findIndex(l => l.id === activeLayerId);

  return (
    <div className="w-full sm:w-80 h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111318] flex flex-col text-xs overflow-y-auto shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
          <Layers className="w-4 h-4 text-purple-500" />
          <span>Layer Stack ({layers.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddLayer('draw')}
            className="flex items-center gap-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-1 rounded transition-colors"
            title="Add Paint/Drawing Layer"
          >
            <Plus className="w-3 h-3" />
            <span>Draw Layer</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Original Base Image Protection Banner */}
        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Non-Destructive Storage</span>
            </div>
            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
              Original master photo remains untouched. All edits, crops, and drawing strokes are stored as reversible metadata.
            </p>
          </div>
          {onRevertToOriginalImage && (
            <button
              onClick={onRevertToOriginalImage}
              className="px-2 py-1 bg-white dark:bg-neutral-900 text-[10px] font-medium rounded border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 shrink-0 flex items-center gap-1"
              title="Revert all edits back to pristine original image"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Revert</span>
            </button>
          )}
        </div>

        {/* Layer Controls for Active Layer */}
        {activeLayer && (
          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[160px]">
                {activeLayer.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDuplicateLayer(activeLayer.id)}
                  className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded"
                  title="Duplicate Layer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onReorderLayer(activeLayer.id, 'up')}
                  disabled={activeIndex === 0}
                  className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded"
                  title="Move Layer Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onReorderLayer(activeLayer.id, 'down')}
                  disabled={activeIndex === layers.length - 1}
                  className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded"
                  title="Move Layer Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {layers.length > 1 && (
                  <button
                    onClick={() => onDeleteLayer(activeLayer.id)}
                    className="p-1 text-red-500 hover:text-red-700 rounded"
                    title="Delete Layer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-[11px]">
                <span>Layer Opacity</span>
                <span className="font-mono">{activeLayer.opacity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={activeLayer.opacity}
                onChange={e => onUpdateLayer(activeLayer.id, { opacity: Number(e.target.value) })}
                className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Blend Mode Dropdown */}
            <div className="space-y-1">
              <span className="text-neutral-600 dark:text-neutral-400 text-[11px] block">Blend Mode</span>
              <select
                value={activeLayer.blendMode}
                onChange={e => onUpdateLayer(activeLayer.id, { blendMode: e.target.value as PhotoBlendMode })}
                className="w-full px-2 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs"
              >
                {BLEND_MODES.map(bm => (
                  <option key={bm.id} value={bm.id}>
                    {bm.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Basic Masking Controls */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px]">
              <span className="text-neutral-600 dark:text-neutral-400">Clip Masking</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateLayer(activeLayer.id, { isMasked: !activeLayer.isMasked })}
                  className={`px-2 py-0.5 rounded border ${
                    activeLayer.isMasked
                      ? 'bg-purple-500 text-white border-purple-600'
                      : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {activeLayer.isMasked ? 'Mask Active' : 'No Mask'}
                </button>
                {activeLayer.isMasked && (
                  <button
                    onClick={() => onUpdateLayer(activeLayer.id, { maskInverted: !activeLayer.maskInverted })}
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  >
                    {activeLayer.maskInverted ? 'Inverted' : 'Normal'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Layers Stack List */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-mono">
            Stack Order (Top to Bottom)
          </span>

          {layers.map(layer => {
            const isSelected = layer.id === activeLayerId;
            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-neutral-900 dark:border-white bg-neutral-100/80 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onUpdateLayer(layer.id, { visible: !layer.visible });
                    }}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <div className="truncate">
                    <div className="font-semibold truncate flex items-center gap-1.5">
                      <span>{layer.name}</span>
                      {layer.originalImageUrl && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-mono">
                          MASTER
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <span>{layer.type}</span>
                      <span>•</span>
                      <span>{layer.blendMode}</span>
                      <span>•</span>
                      <span>{layer.opacity}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onUpdateLayer(layer.id, { isLocked: !layer.isLocked });
                    }}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    {layer.isLocked ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3 opacity-30" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
