import React from 'react';
import {
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Compass,
  Maximize,
  Rotate3d,
  Check,
  RotateCcw as ResetIcon,
} from 'lucide-react';
import { PhotoTransform, AspectRatioPreset, DEFAULT_PHOTO_TRANSFORM } from '../../../types/photoEditor';

interface PhotoTransformPanelProps {
  transform: PhotoTransform;
  onChangeTransform: (newTransform: PhotoTransform) => void;
  onResetTransform: () => void;
}

export const PhotoTransformPanel: React.FC<PhotoTransformPanelProps> = ({
  transform,
  onChangeTransform,
  onResetTransform,
}) => {
  const aspectPresets: { id: AspectRatioPreset; label: string; desc: string }[] = [
    { id: 'free', label: 'Free', desc: 'Custom boundary' },
    { id: '1:1', label: '1:1', desc: 'Square / Profile' },
    { id: '4:5', label: '4:5', desc: 'Social Portrait' },
    { id: '16:9', label: '16:9', desc: 'Landscape / HD' },
    { id: '9:16', label: '9:16', desc: 'Story / Reel' },
    { id: '3:2', label: '3:2', desc: 'Classic 35mm' },
    { id: '2:3', label: '2:3', desc: 'Vertical 35mm' },
  ];

  const handleRotate90 = (direction: 'cw' | 'ccw') => {
    const delta = direction === 'cw' ? 90 : -90;
    const newRot = (transform.rotation + delta) % 360;
    onChangeTransform({
      ...transform,
      rotation: newRot,
    });
  };

  const handleFlip = (axis: 'h' | 'v') => {
    if (axis === 'h') {
      onChangeTransform({
        ...transform,
        flipHorizontal: !transform.flipHorizontal,
      });
    } else {
      onChangeTransform({
        ...transform,
        flipVertical: !transform.flipVertical,
      });
    }
  };

  const handleSetPreset = (preset: AspectRatioPreset) => {
    let cropWidth = 100;
    let cropHeight = 100;
    let cropX = 0;
    let cropY = 0;

    if (preset === '1:1') {
      cropWidth = 80;
      cropHeight = 80;
      cropX = 10;
      cropY = 10;
    } else if (preset === '4:5') {
      cropWidth = 80;
      cropHeight = 100;
      cropX = 10;
      cropY = 0;
    } else if (preset === '16:9') {
      cropWidth = 100;
      cropHeight = 56.25;
      cropX = 0;
      cropY = 21.875;
    } else if (preset === '9:16') {
      cropWidth = 56.25;
      cropHeight = 100;
      cropX = 21.875;
      cropY = 0;
    }

    onChangeTransform({
      ...transform,
      cropPreset: preset,
      crop: { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
    });
  };

  return (
    <div className="w-full sm:w-80 h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111318] flex flex-col text-xs overflow-y-auto shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
          <Crop className="w-4 h-4 text-emerald-500" />
          <span>Crop, Orientation & Perspective</span>
        </div>
        <button
          onClick={onResetTransform}
          className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white px-2 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Reset orientation"
        >
          <ResetIcon className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Aspect Ratio Crop Presets */}
        <div className="space-y-2">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <Crop className="w-3.5 h-3.5" />
            <span>Crop Aspect Ratio</span>
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {aspectPresets.map(preset => {
              const isSelected = transform.cropPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSetPreset(preset.id)}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{preset.label}</div>
                    <div className="text-[10px] opacity-70">{preset.desc}</div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rotate & Flip section */}
        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            Rotate & Flip
          </span>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleRotate90('ccw')}
              className="flex flex-col items-center justify-center p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              title="Rotate Left 90°"
            >
              <RotateCcw className="w-4 h-4 mb-1" />
              <span className="text-[10px]">-90°</span>
            </button>
            <button
              onClick={() => handleRotate90('cw')}
              className="flex flex-col items-center justify-center p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              title="Rotate Right 90°"
            >
              <RotateCw className="w-4 h-4 mb-1" />
              <span className="text-[10px]">+90°</span>
            </button>
            <button
              onClick={() => handleFlip('h')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                transform.flipHorizontal
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                  : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-4 h-4 mb-1" />
              <span className="text-[10px]">Flip H</span>
            </button>
            <button
              onClick={() => handleFlip('v')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                transform.flipVertical
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                  : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
              title="Flip Vertical"
            >
              <FlipVertical className="w-4 h-4 mb-1" />
              <span className="text-[10px]">Flip V</span>
            </button>
          </div>
        </div>

        {/* Straighten Angle Slider */}
        <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-500" />
              <span>Straighten Horizon</span>
            </span>
            <span className="font-mono text-[11px] text-neutral-500">
              {transform.straighten > 0 ? `+${transform.straighten}°` : `${transform.straighten}°`}
            </span>
          </div>
          <input
            type="range"
            min={-45}
            max={45}
            value={transform.straighten}
            onChange={e =>
              onChangeTransform({
                ...transform,
                straighten: Number(e.target.value),
              })
            }
            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Perspective Correction */}
        <div className="space-y-3.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <Rotate3d className="w-3.5 h-3.5 text-purple-500" />
            <span>Perspective Correction</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
              <span>Horizontal Tilt (X)</span>
              <span className="font-mono text-[11px]">{transform.perspectiveX}°</span>
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              value={transform.perspectiveX}
              onChange={e =>
                onChangeTransform({
                  ...transform,
                  perspectiveX: Number(e.target.value),
                })
              }
              className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
              <span>Vertical Keystoning (Y)</span>
              <span className="font-mono text-[11px]">{transform.perspectiveY}°</span>
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              value={transform.perspectiveY}
              onChange={e =>
                onChangeTransform({
                  ...transform,
                  perspectiveY: Number(e.target.value),
                })
              }
              className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Canvas Dimension / Resize */}
        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <Maximize className="w-3.5 h-3.5 text-amber-500" />
            <span>Canvas Target Dimensions</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-neutral-500 block mb-1">Width (px)</span>
              <input
                type="number"
                value={transform.canvasWidth}
                onChange={e =>
                  onChangeTransform({
                    ...transform,
                    canvasWidth: Math.max(200, Number(e.target.value)),
                  })
                }
                className="w-full px-2 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-900 font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block mb-1">Height (px)</span>
              <input
                type="number"
                value={transform.canvasHeight}
                onChange={e =>
                  onChangeTransform({
                    ...transform,
                    canvasHeight: Math.max(200, Number(e.target.value)),
                  })
                }
                className="w-full px-2 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-900 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
