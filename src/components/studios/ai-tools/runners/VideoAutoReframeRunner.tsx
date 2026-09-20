import React, { useState } from 'react';
import {
  Smartphone,
  Tv,
  Square,
  Sparkles,
  Move,
  Check,
  RotateCcw,
  Sliders,
  Crop,
} from 'lucide-react';
import { SelectedMediaItem, AIToolResultPayload } from '../../../../types/aiTools';
import { AIToolsProcessor } from '../../../../services/ai/aiToolsProcessor';

interface VideoAutoReframeRunnerProps {
  media: SelectedMediaItem;
  onPreviewReady: (result: AIToolResultPayload) => void;
  isProcessing: boolean;
}

export const VideoAutoReframeRunner: React.FC<VideoAutoReframeRunnerProps> = ({
  media,
  onPreviewReady,
  isProcessing,
}) => {
  const [targetRatio, setTargetRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('9:16');
  const [trackSubject, setTrackSubject] = useState(true);
  const [manualOffsetX, setManualOffsetX] = useState(0); // -100 to 100
  const [manualOffsetY, setManualOffsetY] = useState(0);

  const ratios = [
    { id: '9:16' as const, label: '9:16 Vertical', desc: 'TikTok, Reels, Shorts', icon: Smartphone },
    { id: '1:1' as const, label: '1:1 Square', desc: 'Instagram Feed, LinkedIn', icon: Square },
    { id: '4:5' as const, label: '4:5 Social', desc: 'Feed Portrait', icon: Smartphone },
    { id: '16:9' as const, label: '16:9 Cinema', desc: 'YouTube, Desktop', icon: Tv },
  ];

  const handleRunReframe = () => {
    const result = AIToolsProcessor.processVideoAutoReframe(media.url, {
      targetRatio,
      manualOffsetX,
      manualOffsetY,
    });
    onPreviewReady(result);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Target Ratio Selection */}
      <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <Crop className="w-4 h-4 text-emerald-500" />
            <span>Target Platform Aspect Ratio</span>
          </span>
          <span className="font-mono text-[11px] text-neutral-500">
            Focal Tracking: {trackSubject ? 'Active' : 'Fixed Center'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ratios.map(r => {
            const Icon = r.icon;
            const isSel = targetRatio === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setTargetRatio(r.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSel
                    ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-800 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-4 h-4 text-emerald-500" />
                  <span className="font-mono font-bold text-xs">{r.id}</span>
                </div>
                <div className="font-medium text-[11px] mt-1 text-neutral-900 dark:text-neutral-100">{r.label}</div>
                <div className="text-[10px] text-neutral-500 truncate">{r.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Manual Fine-Tuning Offsets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Manual Horizontal Panning Offset</span>
              <span className="font-mono">{manualOffsetX}px</span>
            </div>
            <input
              type="range"
              min="-120"
              max="120"
              value={manualOffsetX}
              onChange={e => setManualOffsetX(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Manual Vertical Offset</span>
              <span className="font-mono">{manualOffsetY}px</span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              value={manualOffsetY}
              onChange={e => setManualOffsetY(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>
        </div>
      </div>

      {/* Visual Reframe Viewport with dynamic bounding box */}
      <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 flex items-center justify-center p-6 min-h-[320px]">
        <div className="relative max-w-full overflow-hidden flex items-center justify-center">
          {media.type === 'video' ? (
            <video
              src={media.url}
              className="max-h-[300px] w-auto rounded opacity-80"
              controls
              muted
            />
          ) : (
            <img
              src={media.url}
              alt="Preview"
              className="max-h-[300px] w-auto rounded opacity-80"
            />
          )}

          {/* Dynamic Crop Overlay Box */}
          <div
            className="absolute border-2 border-emerald-400 bg-emerald-400/10 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all pointer-events-none flex flex-col justify-between p-1.5"
            style={{
              width: targetRatio === '9:16' ? '38%' : targetRatio === '1:1' ? '60%' : targetRatio === '4:5' ? '48%' : '90%',
              height: '90%',
              transform: `translate(${manualOffsetX}px, ${manualOffsetY}px)`,
            }}
          >
            <div className="flex justify-between items-center text-[9px] font-mono text-emerald-300 bg-black/60 px-1 py-0.5 rounded w-max">
              <span>{targetRatio} ACTIVE CROP</span>
            </div>
            <div className="self-center w-3 h-3 rounded-full bg-emerald-400 border border-black" title="Subject Tracking Anchor" />
            <div className="text-[9px] font-mono text-neutral-300 self-end">
              CENTERED
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-neutral-500">
          Neural saliency tracks face and fast motion vectors across entire timeline.
        </span>

        <button
          onClick={handleRunReframe}
          disabled={isProcessing}
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply Auto Reframe ({targetRatio})</span>
        </button>
      </div>
    </div>
  );
};
