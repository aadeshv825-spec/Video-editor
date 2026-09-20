import React, { useState } from 'react';
import {
  SunMedium,
  Compass,
  Sparkles,
  Sliders,
  Flame,
  Snowflake,
  Lightbulb,
  Moon,
  Camera,
} from 'lucide-react';
import { SelectedMediaItem, AIToolResultPayload } from '../../../../types/aiTools';
import { AIToolsProcessor } from '../../../../services/ai/aiToolsProcessor';

interface PhotoRelightRunnerProps {
  media: SelectedMediaItem;
  onPreviewReady: (result: AIToolResultPayload) => void;
  isProcessing: boolean;
}

export const PhotoRelightRunner: React.FC<PhotoRelightRunnerProps> = ({
  media,
  onPreviewReady,
  isProcessing,
}) => {
  const [preset, setPreset] = useState<'warm' | 'cool' | 'soft' | 'studio' | 'brighter' | 'darker'>('warm');
  const [intensity, setIntensity] = useState(65);
  const [azimuthDeg, setAzimuthDeg] = useState(45); // 0 to 360 degrees
  const [elevationDeg, setElevationDeg] = useState(45); // 0 to 90 degrees

  const presets = [
    { id: 'warm' as const, label: 'Golden Warm', icon: Flame, color: 'text-amber-500' },
    { id: 'cool' as const, label: 'Nordic Cool', icon: Snowflake, color: 'text-sky-500' },
    { id: 'studio' as const, label: 'High-Key Studio', icon: Camera, color: 'text-purple-500' },
    { id: 'soft' as const, label: 'Diffused Soft', icon: Lightbulb, color: 'text-emerald-500' },
    { id: 'brighter' as const, label: 'Key Illumination', icon: SunMedium, color: 'text-yellow-500' },
    { id: 'darker' as const, label: 'Moody Noir', icon: Moon, color: 'text-indigo-400' },
  ];

  const handleRunRelight = async () => {
    const result = await AIToolsProcessor.processPhotoRelight(media.url, {
      preset,
      intensity,
      azimuthDeg,
      elevationDeg,
    });
    onPreviewReady(result);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Lighting Presets */}
      <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <SunMedium className="w-4 h-4 text-amber-500" />
            <span>Atmospheric Lighting Preset</span>
          </span>
          <span className="font-mono text-[11px] text-neutral-500 capitalize">
            Active: {preset} Mode
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {presets.map(p => {
            const Icon = p.icon;
            const isSel = preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1.5 transition-all ${
                  isSel
                    ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-800 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 hover:border-neutral-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${p.color}`} />
                <span className="font-medium text-[11px] truncate w-full">{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Directional 3D Angle Puck & Intensity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3" />
                <span>Light Azimuth (Angle)</span>
              </span>
              <span className="font-mono">{azimuthDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={azimuthDeg}
              onChange={e => setAzimuthDeg(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Light Elevation</span>
              <span className="font-mono">{elevationDeg}°</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={elevationDeg}
              onChange={e => setElevationDeg(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Illumination Power</span>
              <span className="font-mono">{intensity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>
        </div>
      </div>

      {/* Target Preview stage with directional light vector */}
      <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 flex items-center justify-center p-4 min-h-[300px]">
        <img
          src={media.url}
          alt="Relight target"
          className="max-h-[320px] w-auto max-w-full object-contain rounded-lg shadow-xl"
        />

        {/* Dynamic Light Source Indicator */}
        <div
          className="absolute w-8 h-8 rounded-full bg-amber-400/80 shadow-[0_0_25px_#f59e0b] border-2 border-white pointer-events-none flex items-center justify-center text-neutral-950 font-bold text-[10px]"
          style={{
            left: `calc(50% + ${Math.cos((azimuthDeg * Math.PI) / 180) * 120}px - 16px)`,
            top: `calc(50% + ${Math.sin((azimuthDeg * Math.PI) / 180) * 120}px - 16px)`,
          }}
          title="Simulated Key Light Position"
        >
          ☀
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-neutral-500">
          Surface normal estimation synthesizes natural shadows and highlight reflections.
        </span>

        <button
          onClick={handleRunRelight}
          disabled={isProcessing}
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Render 2.5D Relight</span>
        </button>
      </div>
    </div>
  );
};
