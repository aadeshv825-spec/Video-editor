import React, { useState } from 'react';
import {
  Palette,
  Sun,
  Sliders,
  RotateCcw,
  Copy,
  Check,
  Eye,
  Layers,
  Sparkles,
  Upload,
  Bookmark,
} from 'lucide-react';
import {
  ColorProperties,
  TimelineClip,
  ColorWheelOffset,
  CurvePoint,
} from '../../../../types/videoEditor';

interface ColorGradingPanelProps {
  clip: TimelineClip;
  onUpdateColor: (updates: Partial<ColorProperties>) => void;
  onCopyColorGrade?: () => void;
  onPasteColorGrade?: () => void;
  hasCopiedGrade?: boolean;
}

type ColorSubTab = 'basic' | 'curves' | 'hsl' | 'wheels' | 'vignette' | 'lut';

const BUILT_IN_LUTS = [
  { id: 'lut_teal_orange', name: 'Cinematic Teal & Orange', desc: 'Classic Hollywood blockbuster contrast' },
  { id: 'lut_kodachrome', name: 'Vintage Kodachrome 64', desc: 'Warm nostalgic 1970s film emulsion' },
  { id: 'lut_bleach_bypass', name: 'Bleach Bypass', desc: 'High-contrast desaturated metallic look' },
  { id: 'lut_golden_hour', name: 'Golden Hour Glow', desc: 'Lush sunset amber warmth & softened highlights' },
  { id: 'lut_moody_noir', name: 'Monochromatic Noir', desc: 'Deep crushed blacks with silver midtones' },
  { id: 'lut_rec709', name: 'Rec.709 Natural Clean', desc: 'Neutral, accurate broadcast color space' },
];

export const ColorGradingPanel: React.FC<ColorGradingPanelProps> = ({
  clip,
  onUpdateColor,
  onCopyColorGrade,
  onPasteColorGrade,
  hasCopiedGrade,
}) => {
  const [subTab, setSubTab] = useState<ColorSubTab>('basic');
  const [activeCurveChannel, setActiveCurveChannel] = useState<'master' | 'red' | 'green' | 'blue'>('master');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const colors = clip.colorAdjustments || {};

  // Basic update
  const setVal = (key: keyof ColorProperties, val: number) => {
    onUpdateColor({ [key]: val });
  };

  // Reset basic
  const handleResetBasic = () => {
    onUpdateColor({
      exposure: 0,
      brightness: 0,
      contrast: 0,
      saturation: 100,
      temperature: 0,
      tint: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      sharpen: 0,
      blur: 0,
      vibrance: 0,
      midtoneDetail: 0,
    });
  };

  // Copy handler
  const handleCopy = () => {
    if (onCopyColorGrade) {
      onCopyColorGrade();
      setCopiedNotification('Grade Copied!');
      setTimeout(() => setCopiedNotification(null), 2000);
    }
  };

  // Wheel update
  const updateWheel = (wheel: 'lift' | 'gamma' | 'gain', updates: Partial<ColorWheelOffset>) => {
    const currentWheels = colors.wheels || {
      lift: { hue: 0, saturation: 0, luminance: 0 },
      gamma: { hue: 0, saturation: 0, luminance: 0 },
      gain: { hue: 0, saturation: 0, luminance: 0 },
    };
    onUpdateColor({
      wheels: {
        ...currentWheels,
        [wheel]: { ...currentWheels[wheel], ...updates },
      },
    });
  };

  // HSL update
  const updateHSL = (
    channel: 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'magenta',
    prop: 'hue' | 'saturation' | 'luminance',
    val: number
  ) => {
    const defaultChannel = { hue: 0, saturation: 0, luminance: 0 };
    const currentHSL = colors.hsl || {
      red: { ...defaultChannel },
      orange: { ...defaultChannel },
      yellow: { ...defaultChannel },
      green: { ...defaultChannel },
      cyan: { ...defaultChannel },
      blue: { ...defaultChannel },
      purple: { ...defaultChannel },
      magenta: { ...defaultChannel },
    };

    onUpdateColor({
      hsl: {
        ...currentHSL,
        [channel]: { ...currentHSL[channel], [prop]: val },
      },
    });
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* Header & Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
          <Palette className="w-4 h-4 text-amber-500" />
          <span>Professional Lumetri Color</span>
        </div>

        <div className="flex items-center gap-1">
          {onCopyColorGrade && (
            <button
              onClick={handleCopy}
              className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              title="Copy Color Grade"
            >
              {copiedNotification ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copiedNotification || 'Copy'}</span>
            </button>
          )}

          {onPasteColorGrade && hasCopiedGrade && (
            <button
              onClick={onPasteColorGrade}
              className="px-2 py-1 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20 text-[10px] font-medium hover:bg-purple-500/20 flex items-center gap-1 transition-colors"
              title="Paste Color Grade"
            >
              <span>Paste Grade</span>
            </button>
          )}

          <button
            onClick={handleResetBasic}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            title="Reset All Color Adjustments"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        {(
          [
            { id: 'basic', label: 'Basic' },
            { id: 'curves', label: 'Curves' },
            { id: 'hsl', label: 'HSL' },
            { id: 'wheels', label: '3-Way Wheels' },
            { id: 'vignette', label: 'Vignette' },
            { id: 'lut', label: 'LUT Profile' },
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

      {/* Tab: BASIC COLOR */}
      {subTab === 'basic' && (
        <div className="space-y-3">
          {/* Tone */}
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
            <span className="font-semibold text-[11px] text-neutral-800 dark:text-neutral-200 uppercase tracking-wider block">
              Tone & Dynamic Range
            </span>

            {/* Exposure */}
            <div>
              <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400 mb-1">
                <span>Exposure</span>
                <span className="font-mono">{colors.exposure || 0}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={colors.exposure || 0}
                onChange={e => setVal('exposure', Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400 mb-1">
                <span>Contrast</span>
                <span className="font-mono">{colors.contrast || 0}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={colors.contrast || 0}
                onChange={e => setVal('contrast', Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Highlights & Shadows */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                  <span>Highlights</span>
                  <span className="font-mono">{colors.highlights || 0}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={colors.highlights || 0}
                  onChange={e => setVal('highlights', Number(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                  <span>Shadows</span>
                  <span className="font-mono">{colors.shadows || 0}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={colors.shadows || 0}
                  onChange={e => setVal('shadows', Number(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Whites & Blacks */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                  <span>Whites</span>
                  <span className="font-mono">{colors.whites || 0}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={colors.whites || 0}
                  onChange={e => setVal('whites', Number(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                  <span>Blacks</span>
                  <span className="font-mono">{colors.blacks || 0}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={colors.blacks || 0}
                  onChange={e => setVal('blacks', Number(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* White Balance & Saturation */}
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
            <span className="font-semibold text-[11px] text-neutral-800 dark:text-neutral-200 uppercase tracking-wider block">
              White Balance & Vibrance
            </span>

            {/* Temperature */}
            <div>
              <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400 mb-1">
                <span>Temperature (Cool / Warm)</span>
                <span className="font-mono">{colors.temperature || 0}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={colors.temperature || 0}
                onChange={e => setVal('temperature', Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-gradient-to-r from-blue-500 via-neutral-300 to-amber-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Tint */}
            <div>
              <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400 mb-1">
                <span>Tint (Green / Magenta)</span>
                <span className="font-mono">{colors.tint || 0}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={colors.tint || 0}
                onChange={e => setVal('tint', Number(e.target.value))}
                className="w-full accent-fuchsia-500 h-1.5 bg-gradient-to-r from-emerald-500 via-neutral-300 to-fuchsia-500 rounded-lg cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400 mb-1">
                <span>Saturation</span>
                <span className="font-mono">{colors.saturation !== undefined ? colors.saturation : 100}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={colors.saturation !== undefined ? colors.saturation : 100}
                onChange={e => setVal('saturation', Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Vibrance & Sharpen */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                  <span>Vibrance</span>
                  <span className="font-mono">{colors.vibrance || 0}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={colors.vibrance || 0}
                  onChange={e => setVal('vibrance', Number(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                  <span>Sharpen</span>
                  <span className="font-mono">{colors.sharpen || 0}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={colors.sharpen || 0}
                  onChange={e => setVal('sharpen', Number(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: CURVES */}
      {subTab === 'curves' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              Tone & RGB Curves
            </span>
            <div className="flex items-center gap-1">
              {(['master', 'red', 'green', 'blue'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => setActiveCurveChannel(ch)}
                  className={`w-5 h-5 rounded text-[10px] font-bold uppercase transition-colors ${
                    activeCurveChannel === ch
                      ? ch === 'red'
                        ? 'bg-red-500 text-white'
                        : ch === 'green'
                        ? 'bg-emerald-500 text-white'
                        : ch === 'blue'
                        ? 'bg-blue-500 text-white'
                        : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'border border-neutral-200 dark:border-neutral-800 text-neutral-400'
                  }`}
                >
                  {ch[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Curve Graph Visualizer */}
          <div className="relative aspect-square w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-900 flex items-center justify-center overflow-hidden">
            {/* Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-20 border-neutral-700">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="border-r border-b border-neutral-600" />
              ))}
            </div>

            {/* SVG S-Curve */}
            <svg className="w-full h-full p-3 pointer-events-none" viewBox="0 0 100 100">
              <path
                d="M 5,95 Q 35,80 50,50 T 95,5"
                fill="none"
                stroke={
                  activeCurveChannel === 'red'
                    ? '#ef4444'
                    : activeCurveChannel === 'green'
                    ? '#10b981'
                    : activeCurveChannel === 'blue'
                    ? '#3b82f6'
                    : '#f59e0b'
                }
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Control points */}
              <circle cx="5" cy="95" r="3.5" fill="#ffffff" />
              <circle cx="35" cy="70" r="3.5" fill="#f59e0b" />
              <circle cx="65" cy="30" r="3.5" fill="#f59e0b" />
              <circle cx="95" cy="5" r="3.5" fill="#ffffff" />
            </svg>

            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-neutral-400 bg-black/60 px-1.5 py-0.5 rounded">
              S-Curve Contrast Active
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>Input / Output Mapping</span>
            <button
              onClick={() => {
                onUpdateColor({
                  contrast: Math.min(100, (colors.contrast || 0) + 15),
                });
              }}
              className="text-amber-600 dark:text-amber-400 hover:underline text-[10px]"
            >
              Apply Cinematic S-Curve
            </button>
          </div>
        </div>
      )}

      {/* Tab: HSL */}
      {subTab === 'hsl' && (
        <div className="space-y-3">
          <p className="text-[11px] text-neutral-500">
            Fine-tune specific color hues, saturation, and luminance independently.
          </p>

          <div className="space-y-2.5">
            {(
              [
                { id: 'red', name: 'Reds', color: 'bg-red-500' },
                { id: 'orange', name: 'Oranges (Skin Tones)', color: 'bg-orange-500' },
                { id: 'yellow', name: 'Yellows', color: 'bg-amber-400' },
                { id: 'green', name: 'Greens', color: 'bg-emerald-500' },
                { id: 'cyan', name: 'Cyan (Sky/Water)', color: 'bg-cyan-400' },
                { id: 'blue', name: 'Blues', color: 'bg-blue-600' },
              ] as const
            ).map(ch => {
              const current = colors.hsl?.[ch.id] || { hue: 0, saturation: 0, luminance: 0 };

              return (
                <div
                  key={ch.id}
                  className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${ch.color}`} />
                      <span className="font-semibold text-[11px] text-neutral-800 dark:text-neutral-200">
                        {ch.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-neutral-400">
                      H: {current.hue} | S: {current.saturation}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-neutral-500 block mb-0.5">Hue Shift</span>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={current.hue}
                        onChange={e => updateHSL(ch.id, 'hue', Number(e.target.value))}
                        className="w-full accent-purple-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-500 block mb-0.5">Saturation</span>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={current.saturation}
                        onChange={e => updateHSL(ch.id, 'saturation', Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: 3-WAY COLOR WHEELS */}
      {subTab === 'wheels' && (
        <div className="space-y-3">
          <p className="text-[11px] text-neutral-500">
            Professional 3-Way color balance for Shadows (Lift), Midtones (Gamma), and Highlights (Gain).
          </p>

          <div className="grid grid-cols-3 gap-2 text-center">
            {(
              [
                { id: 'lift', name: 'Lift (Shadows)' },
                { id: 'gamma', name: 'Gamma (Mids)' },
                { id: 'gain', name: 'Gain (Highs)' },
              ] as const
            ).map(w => {
              const wheelData = colors.wheels?.[w.id] || { hue: 0, saturation: 0, luminance: 0 };

              return (
                <div
                  key={w.id}
                  className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex flex-col items-center gap-1.5"
                >
                  <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">
                    {w.name}
                  </span>

                  {/* Circular Color Disc */}
                  <div className="relative w-18 h-18 rounded-full border border-neutral-400 dark:border-neutral-700 bg-radial from-white via-amber-200 to-blue-300 shadow-inner flex items-center justify-center cursor-crosshair">
                    {/* Reticle point */}
                    <div
                      className="w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-white border border-neutral-600 shadow-xs absolute"
                      style={{
                        transform: `translate(${wheelData.saturation * 0.2}px, ${wheelData.luminance * -0.2}px)`,
                      }}
                    />
                  </div>

                  {/* Luminance Slider */}
                  <div className="w-full">
                    <span className="text-[9px] text-neutral-400 block mb-0.5">Offset</span>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={wheelData.luminance}
                      onChange={e => updateWheel(w.id, { luminance: Number(e.target.value) })}
                      className="w-full accent-amber-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: VIGNETTE & GRAIN */}
      {subTab === 'vignette' && (
        <div className="space-y-3">
          {/* Vignette */}
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
            <span className="font-semibold text-[11px] text-neutral-800 dark:text-neutral-200 uppercase tracking-wider block">
              Lens Vignette
            </span>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                <span>Amount</span>
                <span className="font-mono">{colors.vignette?.amount || 0}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={colors.vignette?.amount || 0}
                onChange={e =>
                  onUpdateColor({
                    vignette: {
                      amount: Number(e.target.value),
                      midpoint: colors.vignette?.midpoint ?? 50,
                      roundness: colors.vignette?.roundness ?? 0,
                      feather: colors.vignette?.feather ?? 50,
                    },
                  })
                }
                className="w-full accent-amber-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-neutral-500 block mb-0.5">Feather</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={colors.vignette?.feather ?? 50}
                  onChange={e =>
                    onUpdateColor({
                      vignette: {
                        amount: colors.vignette?.amount ?? 0,
                        midpoint: colors.vignette?.midpoint ?? 50,
                        roundness: colors.vignette?.roundness ?? 0,
                        feather: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-amber-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block mb-0.5">Roundness</span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={colors.vignette?.roundness ?? 0}
                  onChange={e =>
                    onUpdateColor({
                      vignette: {
                        amount: colors.vignette?.amount ?? 0,
                        midpoint: colors.vignette?.midpoint ?? 50,
                        roundness: Number(e.target.value),
                        feather: colors.vignette?.feather ?? 50,
                      },
                    })
                  }
                  className="w-full accent-amber-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Film Grain */}
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
            <span className="font-semibold text-[11px] text-neutral-800 dark:text-neutral-200 uppercase tracking-wider block">
              Analog 35mm Film Grain
            </span>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                <span>Grain Amount</span>
                <span className="font-mono">{colors.grain?.amount || 0}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={colors.grain?.amount || 0}
                onChange={e =>
                  onUpdateColor({
                    grain: {
                      amount: Number(e.target.value),
                      roughness: colors.grain?.roughness ?? 50,
                      size: colors.grain?.size ?? 2,
                    },
                  })
                }
                className="w-full accent-amber-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: LUT PROFILE */}
      {subTab === 'lut' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              3D Look-Up Table (LUT)
            </span>
            <label className="flex items-center gap-1 text-[11px] cursor-pointer">
              <input
                type="checkbox"
                checked={colors.lut?.enabled ?? false}
                onChange={e =>
                  onUpdateColor({
                    lut: {
                      id: colors.lut?.id || 'lut_teal_orange',
                      name: colors.lut?.name || 'Cinematic Teal & Orange',
                      intensity: colors.lut?.intensity ?? 80,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="rounded text-amber-500 focus:ring-0"
              />
              <span>Enable LUT</span>
            </label>
          </div>

          {/* LUT list */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {BUILT_IN_LUTS.map(lutItem => {
              const isSelected = colors.lut?.id === lutItem.id;

              return (
                <div
                  key={lutItem.id}
                  onClick={() => {
                    onUpdateColor({
                      lut: {
                        id: lutItem.id,
                        name: lutItem.name,
                        intensity: colors.lut?.intensity ?? 85,
                        enabled: true,
                      },
                    });
                  }}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-neutral-900 dark:text-white'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{lutItem.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{lutItem.desc}</p>
                </div>
              );
            })}
          </div>

          {/* LUT Intensity Slider */}
          {colors.lut?.enabled && (
            <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
              <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                <span>LUT Intensity</span>
                <span className="font-mono">{colors.lut.intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={colors.lut.intensity}
                onChange={e =>
                  onUpdateColor({
                    lut: {
                      ...colors.lut!,
                      intensity: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-amber-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>
          )}

          {/* Custom LUT file import notice */}
          <div className="p-2.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-1">
            <Upload className="w-4 h-4 mx-auto text-neutral-400" />
            <p className="text-[10px] text-neutral-500">
              Import custom <code className="font-mono">.cube</code> or <code className="font-mono">.look</code> 3D LUT profiles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
