import React, { useState } from 'react';
import {
  Maximize2,
  Sparkles,
  Sliders,
  Check,
  Split,
  Eye,
  Info,
} from 'lucide-react';
import { SelectedMediaItem, AIToolResultPayload } from '../../../../types/aiTools';
import { AIToolsProcessor } from '../../../../services/ai/aiToolsProcessor';

interface PhotoUpscaleEnhanceRunnerProps {
  media: SelectedMediaItem;
  onPreviewReady: (result: AIToolResultPayload) => void;
  isProcessing: boolean;
  toolType?: 'photo_upscale' | 'photo_enhance' | 'photo_portrait_enhance';
}

export const PhotoUpscaleEnhanceRunner: React.FC<PhotoUpscaleEnhanceRunnerProps> = ({
  media,
  onPreviewReady,
  isProcessing,
  toolType = 'photo_upscale',
}) => {
  const [scaleFactor, setScaleFactor] = useState<2 | 4>(2);
  const [sharpenAmount, setSharpenAmount] = useState(35);
  const [noiseReduction, setNoiseReduction] = useState(40);
  const [detailRecovery, setDetailRecovery] = useState(50);
  const [compressionCleanup, setCompressionCleanup] = useState(true);

  // Before/After comparison state
  const [previewResult, setPreviewResult] = useState<AIToolResultPayload | null>(null);
  const [splitPosition, setSplitPosition] = useState(50);

  const handleRunUpscale = async () => {
    const result = await AIToolsProcessor.processPhotoUpscale(
      media.url,
      scaleFactor,
      sharpenAmount
    );
    setPreviewResult(result);
    onPreviewReady(result);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Parameter controls */}
      <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
            <Maximize2 className="w-4 h-4 text-sky-500" />
            <span>Neural Super-Resolution & Clarity Controls</span>
          </div>

          <div className="flex items-center gap-1 bg-neutral-200/80 dark:bg-neutral-800 p-0.5 rounded-lg text-[11px] font-mono">
            <button
              onClick={() => setScaleFactor(2)}
              className={`px-2.5 py-1 rounded transition-colors ${
                scaleFactor === 2
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              2× Upscale
            </button>
            <button
              onClick={() => setScaleFactor(4)}
              className={`px-2.5 py-1 rounded transition-colors ${
                scaleFactor === 4
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              4× Ultra-Res
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Unsharp Sharpening</span>
              <span className="font-mono">{sharpenAmount}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sharpenAmount}
              onChange={e => setSharpenAmount(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Noise Reduction</span>
              <span className="font-mono">{noiseReduction}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={noiseReduction}
              onChange={e => setNoiseReduction(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Micro-Texture Detail</span>
              <span className="font-mono">{detailRecovery}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={detailRecovery}
              onChange={e => setDetailRecovery(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <label className="flex items-center gap-2 text-[11px] text-neutral-700 dark:text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={compressionCleanup}
              onChange={e => setCompressionCleanup(e.target.checked)}
              className="rounded"
            />
            <span>Remove JPEG / Streaming Compression Blocking Artifacts</span>
          </label>

          <span className="font-mono text-[10px] text-neutral-500">
            Output: {scaleFactor === 2 ? 'Double Native PPI' : 'Quad Native PPI (Print Grade)'}
          </span>
        </div>
      </div>

      {/* Interactive Before/After Split Comparison View */}
      <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 min-h-[320px] flex items-center justify-center select-none">
        {previewResult ? (
          <div className="relative w-full h-[340px] overflow-hidden flex items-center justify-center">
            {/* After (Enhanced) Image */}
            <img
              src={previewResult.resultUrl}
              alt="Enhanced Preview"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {/* Before (Original) Image clipped by split percentage */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${splitPosition}%` }}
            >
              <img
                src={media.url}
                alt="Original Source"
                className="absolute inset-0 w-full h-full object-contain filter contrast-90 brightness-95"
                style={{ width: '100%', maxWidth: 'none' }}
              />
            </div>

            {/* Split Divider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] cursor-ew-resize flex items-center justify-center z-10"
              style={{ left: `${splitPosition}%` }}
            >
              <div className="w-6 h-6 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-md">
                <Split className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Interactive scrub range input over entire frame */}
            <input
              type="range"
              min="0"
              max="100"
              value={splitPosition}
              onChange={e => setSplitPosition(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize z-20 w-full h-full"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 px-2 py-0.5 rounded bg-black/75 text-white font-mono text-[10px] pointer-events-none">
              BEFORE
            </div>
            <div className="absolute top-4 right-4 px-2 py-0.5 rounded bg-sky-500 text-white font-mono text-[10px] pointer-events-none">
              AFTER ({scaleFactor}× ENHANCED)
            </div>
          </div>
        ) : (
          <div className="relative w-full h-[320px] flex items-center justify-center p-4">
            <img
              src={media.url}
              alt="Original Source"
              className="max-h-[300px] w-auto max-w-full object-contain rounded-lg shadow-lg opacity-90"
            />
            <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded bg-black/70 text-white font-mono text-[10px]">
              Original Resolution: 100% Native
            </div>
          </div>
        )}
      </div>

      {/* Action triggers */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-neutral-500">
          Drag slider left/right to inspect pixel-level unsharp detail enhancement.
        </span>

        <button
          onClick={handleRunUpscale}
          disabled={isProcessing}
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{previewResult ? 'Re-Compute Enhancements' : `Render ${scaleFactor}× Upscale Preview`}</span>
        </button>
      </div>
    </div>
  );
};
