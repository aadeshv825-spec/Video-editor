import React from 'react';
import {
  Sun,
  Contrast as ContrastIcon,
  Palette,
  Thermometer,
  RotateCcw,
  Sparkles,
  Sliders,
  Eye,
} from 'lucide-react';
import { PhotoAdjustments, DEFAULT_PHOTO_ADJUSTMENTS } from '../../../types/photoEditor';

interface PhotoAdjustmentsPanelProps {
  adjustments: PhotoAdjustments;
  onChangeAdjustments: (newAdjustments: PhotoAdjustments) => void;
  onResetAll: () => void;
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (val: number) => void;
  onReset: () => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  unit = '',
  onChange,
  onReset,
}) => (
  <div className="space-y-1 text-xs">
    <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      <div className="flex items-center gap-1.5 font-mono text-[11px]">
        <span className={value !== 0 ? 'text-blue-500 dark:text-blue-400 font-semibold' : ''}>
          {value > 0 ? `+${value}` : value}
          {unit}
        </span>
        {value !== 0 && (
          <button
            onClick={onReset}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-[10px]"
            title="Reset to 0"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-neutral-100"
    />
  </div>
);

export const PhotoAdjustmentsPanel: React.FC<PhotoAdjustmentsPanelProps> = ({
  adjustments,
  onChangeAdjustments,
  onResetAll,
}) => {
  const updateProp = <K extends keyof PhotoAdjustments>(key: K, val: PhotoAdjustments[K]) => {
    onChangeAdjustments({
      ...adjustments,
      [key]: val,
    });
  };

  // Presets
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'vibrant':
        onChangeAdjustments({
          ...DEFAULT_PHOTO_ADJUSTMENTS,
          exposure: 5,
          contrast: 15,
          saturation: 28,
          highlights: -10,
          shadows: 15,
          vignette: 15,
        });
        break;
      case 'warm_film':
        onChangeAdjustments({
          ...DEFAULT_PHOTO_ADJUSTMENTS,
          temperature: 30,
          tint: 5,
          contrast: 10,
          exposure: -4,
          grain: 35,
          vignette: 25,
        });
        break;
      case 'monochrome':
        onChangeAdjustments({
          ...DEFAULT_PHOTO_ADJUSTMENTS,
          saturation: -100,
          contrast: 35,
          exposure: 8,
          whites: 20,
          blacks: -15,
          grain: 20,
        });
        break;
      case 'clean_portrait':
        onChangeAdjustments({
          ...DEFAULT_PHOTO_ADJUSTMENTS,
          exposure: 8,
          contrast: -5,
          highlights: -15,
          shadows: 20,
          sharpen: 25,
          temperature: 8,
        });
        break;
    }
  };

  return (
    <div className="w-full sm:w-80 h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111318] flex flex-col text-xs overflow-y-auto shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
          <Sliders className="w-4 h-4 text-blue-500" />
          <span>Non-Destructive Light & Color</span>
        </div>
        <button
          onClick={onResetAll}
          className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white px-2 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Reset all adjustments"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Creative Presets */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-neutral-500 font-medium text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Grade Presets</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => applyPreset('vibrant')}
              className="px-2 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left font-medium"
            >
              Vibrant Color
            </button>
            <button
              onClick={() => applyPreset('warm_film')}
              className="px-2 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left font-medium"
            >
              Warm Analog
            </button>
            <button
              onClick={() => applyPreset('monochrome')}
              className="px-2 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left font-medium"
            >
              High Contrast B&W
            </button>
            <button
              onClick={() => applyPreset('clean_portrait')}
              className="px-2 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left font-medium"
            >
              Clean Portrait
            </button>
          </div>
        </div>

        {/* Tone & Light section */}
        <div className="space-y-3.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100 font-semibold">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Tone & Exposure</span>
          </div>

          <SliderRow
            label="Exposure"
            value={adjustments.exposure}
            min={-100}
            max={100}
            onChange={v => updateProp('exposure', v)}
            onReset={() => updateProp('exposure', 0)}
          />

          <SliderRow
            label="Brightness"
            value={adjustments.brightness}
            min={-100}
            max={100}
            onChange={v => updateProp('brightness', v)}
            onReset={() => updateProp('brightness', 0)}
          />

          <SliderRow
            label="Contrast"
            value={adjustments.contrast}
            min={-100}
            max={100}
            onChange={v => updateProp('contrast', v)}
            onReset={() => updateProp('contrast', 0)}
          />

          <SliderRow
            label="Highlights"
            value={adjustments.highlights}
            min={-100}
            max={100}
            onChange={v => updateProp('highlights', v)}
            onReset={() => updateProp('highlights', 0)}
          />

          <SliderRow
            label="Shadows"
            value={adjustments.shadows}
            min={-100}
            max={100}
            onChange={v => updateProp('shadows', v)}
            onReset={() => updateProp('shadows', 0)}
          />

          <SliderRow
            label="Whites"
            value={adjustments.whites}
            min={-100}
            max={100}
            onChange={v => updateProp('whites', v)}
            onReset={() => updateProp('whites', 0)}
          />

          <SliderRow
            label="Blacks"
            value={adjustments.blacks}
            min={-100}
            max={100}
            onChange={v => updateProp('blacks', v)}
            onReset={() => updateProp('blacks', 0)}
          />
        </div>

        {/* Color Balance section */}
        <div className="space-y-3.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100 font-semibold">
            <Palette className="w-3.5 h-3.5 text-purple-500" />
            <span>Color & Temperature</span>
          </div>

          <SliderRow
            label="Saturation"
            value={adjustments.saturation}
            min={-100}
            max={100}
            onChange={v => updateProp('saturation', v)}
            onReset={() => updateProp('saturation', 0)}
          />

          <SliderRow
            label="Temperature (Cool / Warm)"
            value={adjustments.temperature}
            min={-100}
            max={100}
            onChange={v => updateProp('temperature', v)}
            onReset={() => updateProp('temperature', 0)}
          />

          <SliderRow
            label="Tint (Green / Magenta)"
            value={adjustments.tint}
            min={-100}
            max={100}
            onChange={v => updateProp('tint', v)}
            onReset={() => updateProp('tint', 0)}
          />
        </div>

        {/* Detail & Optical Effects section */}
        <div className="space-y-3.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100 font-semibold">
            <ContrastIcon className="w-3.5 h-3.5 text-emerald-500" />
            <span>Detail, Focus & Vignette</span>
          </div>

          <SliderRow
            label="Sharpen"
            value={adjustments.sharpen}
            min={0}
            max={100}
            onChange={v => updateProp('sharpen', v)}
            onReset={() => updateProp('sharpen', 0)}
          />

          <SliderRow
            label="Blur"
            value={adjustments.blur}
            min={0}
            max={50}
            unit="px"
            onChange={v => updateProp('blur', v)}
            onReset={() => updateProp('blur', 0)}
          />

          <SliderRow
            label="Vignette"
            value={adjustments.vignette}
            min={0}
            max={100}
            onChange={v => updateProp('vignette', v)}
            onReset={() => updateProp('vignette', 0)}
          />

          <SliderRow
            label="Film Grain"
            value={adjustments.grain}
            min={0}
            max={100}
            onChange={v => updateProp('grain', v)}
            onReset={() => updateProp('grain', 0)}
          />
        </div>
      </div>
    </div>
  );
};
