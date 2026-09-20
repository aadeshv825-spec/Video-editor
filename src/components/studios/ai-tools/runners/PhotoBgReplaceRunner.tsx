import React, { useState } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Wand2,
  Sparkles,
  Move,
  Maximize2,
  Sliders,
  Check,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { SelectedMediaItem, AIToolResultPayload } from '../../../../types/aiTools';
import { AIToolsProcessor } from '../../../../services/ai/aiToolsProcessor';

interface PhotoBgReplaceRunnerProps {
  media: SelectedMediaItem;
  onPreviewReady: (result: AIToolResultPayload) => void;
  isProcessing: boolean;
}

export const PhotoBgReplaceRunner: React.FC<PhotoBgReplaceRunnerProps> = ({
  media,
  onPreviewReady,
  isProcessing,
}) => {
  const [replaceMode, setReplaceMode] = useState<'color' | 'image' | 'prompt'>('color');
  const [selectedColor, setSelectedColor] = useState('#1e293b');
  const [promptText, setPromptText] = useState('Luxury modern studio with warm soft bokeh rim lights');
  const [scale, setScale] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Architecture hooks for future advanced pipelines
  const [lightingMatch, setLightingMatch] = useState(true);
  const [shadowGeneration, setShadowGeneration] = useState(true);
  const [reflectionMatching, setReflectionMatching] = useState(false);
  const [depthPlacement, setDepthPlacement] = useState(false);

  const colors = [
    '#0f172a',
    '#1e293b',
    '#334155',
    '#052e16',
    '#172554',
    '#4c0519',
    '#f8fafc',
    '#e2e8f0',
    '#ffedd5',
    '#fae8ff',
  ];

  const handleRunReplace = async () => {
    const result = await AIToolsProcessor.processPhotoBgReplace(media.url, {
      mode: replaceMode,
      color: selectedColor,
      prompt: promptText,
      scale,
      offsetX,
      offsetY,
    });
    onPreviewReady(result);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Mode selection */}
      <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            Replacement Backdrop
          </span>
          <div className="flex items-center gap-1 bg-neutral-200/80 dark:bg-neutral-800 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setReplaceMode('color')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                replaceMode === 'color'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Palette className="w-3 h-3" />
              <span>Solid Color</span>
            </button>
            <button
              onClick={() => setReplaceMode('prompt')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                replaceMode === 'prompt'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Wand2 className="w-3 h-3" />
              <span>AI Backdrop</span>
            </button>
          </div>
        </div>

        {replaceMode === 'color' ? (
          <div className="space-y-2">
            <span className="text-[11px] text-neutral-500">Choose studio backdrop tone:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    selectedColor === c
                      ? 'border-neutral-900 dark:border-white scale-110 shadow-sm'
                      : 'border-transparent hover:scale-105'
                  }`}
                />
              ))}
              <input
                type="color"
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
                className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
                title="Custom color picker"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[11px] text-neutral-500">Backdrop prompt description:</label>
            <textarea
              rows={2}
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder="Describe background scene (e.g. minimalist architectural concrete wall with morning light)..."
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
            />
          </div>
        )}

        {/* Subject Placement & Scaling Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Subject Scale</span>
              <span className="font-mono">{Math.round(scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={scale}
              onChange={e => setScale(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Horizontal Offset</span>
              <span className="font-mono">{offsetX}px</span>
            </div>
            <input
              type="range"
              min="-150"
              max="150"
              value={offsetX}
              onChange={e => setOffsetX(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Vertical Offset</span>
              <span className="font-mono">{offsetY}px</span>
            </div>
            <input
              type="range"
              min="-150"
              max="150"
              value={offsetY}
              onChange={e => setOffsetY(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>
        </div>
      </div>

      {/* Advanced Compositing Architecture Controls */}
      <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-semibold text-[11px]">
          <Sliders className="w-3.5 h-3.5 text-purple-500" />
          <span>Compositing Pipeline & Environmental Hooks</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <label className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={shadowGeneration}
              onChange={e => setShadowGeneration(e.target.checked)}
              className="rounded"
            />
            <span>Contact Shadow Generation</span>
          </label>

          <label className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={lightingMatch}
              onChange={e => setLightingMatch(e.target.checked)}
              className="rounded"
            />
            <span>Color Harmonization</span>
          </label>

          <label className="flex items-center gap-2 text-neutral-400 cursor-not-allowed" title="Prepared architecture hook for future neural depth map pipeline">
            <input
              type="checkbox"
              disabled
              checked={reflectionMatching}
              onChange={e => setReflectionMatching(e.target.checked)}
              className="rounded opacity-50"
            />
            <span>Reflection Matching (Upcoming)</span>
          </label>

          <label className="flex items-center gap-2 text-neutral-400 cursor-not-allowed" title="Prepared architecture hook for future 3D scene depth compositing">
            <input
              type="checkbox"
              disabled
              checked={depthPlacement}
              onChange={e => setDepthPlacement(e.target.checked)}
              className="rounded opacity-50"
            />
            <span>Depth-Aware Occlusion (Upcoming)</span>
          </label>
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-neutral-500">
          Foreground is non-destructively preserved throughout replacement.
        </span>

        <button
          onClick={handleRunReplace}
          disabled={isProcessing}
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Composite & Preview</span>
        </button>
      </div>
    </div>
  );
};
