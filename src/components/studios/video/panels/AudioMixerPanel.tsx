import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Activity,
  Layers,
  Radio,
  RotateCcw,
  Check,
  Disc,
} from 'lucide-react';
import {
  TimelineClip,
  AudioProperties,
  AudioEQSettings,
  AudioCompressorSettings,
  AudioLimiterSettings,
  AutoDuckingSettings,
  AudioNormalizationSettings,
  TimelineTrack,
} from '../../../../types/videoEditor';

interface AudioMixerPanelProps {
  clip: TimelineClip;
  tracks: TimelineTrack[];
  onUpdateAudio: (updates: Partial<AudioProperties>) => void;
}

type AudioSubTab = 'mixing' | 'effects' | 'ducking' | 'normalization' | 'sync';

const AUDIO_PRESETS = [
  { id: 'preset_dialogue', name: 'Vocal Clarity & De-Noise', desc: 'Clear dialogue with high-pass and warm compression' },
  { id: 'preset_podcast', name: 'Broadcast Podcast Voice', desc: '-16 LUFS loudness target with gentle limiter' },
  { id: 'preset_cinema', name: 'Cinematic Score Master', desc: 'Dynamic wide stereo space and soft warm saturation' },
  { id: 'preset_bass', name: 'Sub-Bass Boost', desc: 'Low-end presence for modern impactful audio' },
];

export const AudioMixerPanel: React.FC<AudioMixerPanelProps> = ({
  clip,
  tracks,
  onUpdateAudio,
}) => {
  const [subTab, setSubTab] = useState<AudioSubTab>('mixing');
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null);

  const audio = clip.audio || {
    volume: 100,
    muted: false,
    fadeInSec: 0,
    fadeOutSec: 0,
  };

  const update = (updates: Partial<AudioProperties>) => {
    onUpdateAudio(updates);
  };

  // EQ defaults
  const eq: AudioEQSettings = audio.eq || {
    enabled: true,
    bands: [
      { freqHz: 120, gainDb: 0, q: 0.7, type: 'lowshelf' },
      { freqHz: 2500, gainDb: 2, q: 1.2, type: 'peaking' },
      { freqHz: 10000, gainDb: 1.5, q: 0.7, type: 'highshelf' },
    ],
  };

  // Compressor defaults
  const compressor: AudioCompressorSettings = audio.compressor || {
    enabled: false,
    thresholdDb: -20,
    ratio: 3.5,
    attackMs: 25,
    releaseMs: 200,
    makeupGainDb: 3,
  };

  // Limiter defaults
  const limiter: AudioLimiterSettings = audio.limiter || {
    enabled: true,
    ceilingDb: -1.0,
    releaseMs: 100,
  };

  // Ducking defaults
  const ducking: AutoDuckingSettings = audio.ducking || {
    enabled: false,
    targetTrackId: 'a1',
    duckAmountDb: -12,
    attackMs: 150,
    releaseMs: 600,
    thresholdDb: -24,
  };

  // Normalization defaults
  const normalization: AudioNormalizationSettings = audio.normalization || {
    enabled: false,
    targetLufs: -14, // YouTube standard
    peakCeilingDb: -1.0,
    integratedLufsMeasured: -15.2,
  };

  // Apply preset helper
  const handleApplyPreset = (presetId: string) => {
    setAppliedPreset(presetId);
    setTimeout(() => setAppliedPreset(null), 2000);

    if (presetId === 'preset_dialogue') {
      update({
        volume: 105,
        eq: {
          enabled: true,
          bands: [
            { freqHz: 150, gainDb: -3, q: 0.7, type: 'lowshelf' },
            { freqHz: 3200, gainDb: 4, q: 1.4, type: 'peaking' },
            { freqHz: 12000, gainDb: 2, q: 0.7, type: 'highshelf' },
          ],
        },
        compressor: {
          enabled: true,
          thresholdDb: -18,
          ratio: 4,
          attackMs: 15,
          releaseMs: 150,
          makeupGainDb: 3,
        },
      });
    } else if (presetId === 'preset_podcast') {
      update({
        volume: 100,
        normalization: {
          enabled: true,
          targetLufs: -16,
          peakCeilingDb: -1.0,
        },
        limiter: {
          enabled: true,
          ceilingDb: -1.0,
          releaseMs: 80,
        },
      });
    }
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
          <Volume2 className="w-4 h-4 text-emerald-500" />
          <span>Professional Audio Engine</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
          32-Bit Float Processing
        </span>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        {(
          [
            { id: 'mixing', label: 'Track Mix' },
            { id: 'effects', label: 'EQ & Dynamics' },
            { id: 'ducking', label: 'Auto-Ducking' },
            { id: 'normalization', label: 'Loudness' },
            { id: 'sync', label: 'Audio Sync' },
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

      {/* Tab: TRACK MIX */}
      {subTab === 'mixing' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-3">
            {/* Volume & Mute */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[11px] text-neutral-800 dark:text-neutral-200">
                Clip Master Gain
              </span>
              <button
                onClick={() => update({ muted: !audio.muted })}
                className={`p-1 rounded flex items-center gap-1 text-[11px] ${
                  audio.muted
                    ? 'bg-red-500/10 text-red-500'
                    : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {audio.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{audio.muted ? 'Muted' : 'Audible'}</span>
              </button>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                <span>Output Volume</span>
                <span className="font-mono">{audio.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={audio.volume}
                onChange={e => update({ volume: Number(e.target.value) })}
                className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            {/* Pan Knob Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                <span>Stereo Pan</span>
                <span className="font-mono">
                  {audio.pan === 0 || audio.pan === undefined
                    ? 'Center'
                    : audio.pan < 0
                    ? `${Math.abs(audio.pan)}% L`
                    : `${audio.pan}% R`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={audio.pan || 0}
                onChange={e => update({ pan: Number(e.target.value) })}
                className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            {/* Fades */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                  <span>Fade In</span>
                  <span className="font-mono">{audio.fadeInSec}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={audio.fadeInSec}
                  onChange={e => update({ fadeInSec: Number(e.target.value) })}
                  className="w-full accent-emerald-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                  <span>Fade Out</span>
                  <span className="font-mono">{audio.fadeOutSec}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={audio.fadeOutSec}
                  onChange={e => update({ fadeOutSec: Number(e.target.value) })}
                  className="w-full accent-emerald-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              Audio Mastering Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {AUDIO_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p.id)}
                  className="p-2 rounded border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-left bg-neutral-50/50 dark:bg-neutral-900/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] text-neutral-900 dark:text-neutral-100">
                      {p.name}
                    </span>
                    {appliedPreset === p.id && <Check className="w-3 h-3 text-emerald-500" />}
                  </div>
                  <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: EQ & DYNAMICS */}
      {subTab === 'effects' && (
        <div className="space-y-3">
          {/* Parametric EQ */}
          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>3-Band Parametric EQ</span>
              </span>
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={eq.enabled}
                  onChange={e => update({ eq: { ...eq, enabled: e.target.checked } })}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {eq.bands.map((band, idx) => (
                <div key={idx} className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 block">
                    {band.freqHz >= 1000 ? `${band.freqHz / 1000} kHz` : `${band.freqHz} Hz`}
                  </span>
                  <span className="text-[9px] text-neutral-400 capitalize block mb-1">{band.type}</span>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    value={band.gainDb}
                    onChange={e => {
                      const newBands = [...eq.bands];
                      newBands[idx] = { ...band, gainDb: Number(e.target.value) };
                      update({ eq: { ...eq, bands: newBands } });
                    }}
                    className="w-full accent-emerald-500 h-1 bg-neutral-200 dark:bg-neutral-700 rounded cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    {band.gainDb > 0 ? `+${band.gainDb}` : band.gainDb} dB
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Compressor */}
          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                <span>Dynamics Compressor</span>
              </span>
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={compressor.enabled}
                  onChange={e => update({ compressor: { ...compressor, enabled: e.target.checked } })}
                  className="rounded text-blue-500 focus:ring-0"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                  <span>Threshold</span>
                  <span className="font-mono">{compressor.thresholdDb} dB</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="0"
                  value={compressor.thresholdDb}
                  onChange={e =>
                    update({
                      compressor: { ...compressor, thresholdDb: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                  <span>Ratio</span>
                  <span className="font-mono">{compressor.ratio}:1</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={compressor.ratio}
                  onChange={e =>
                    update({
                      compressor: { ...compressor, ratio: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-500 h-1 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: AUTO-DUCKING */}
      {subTab === 'ducking' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-500" />
                <span>Automatic Background Ducking</span>
              </span>
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={ducking.enabled}
                  onChange={e => update({ ducking: { ...ducking, enabled: e.target.checked } })}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <span>Enable Ducking</span>
              </label>
            </div>

            <p className="text-[11px] text-neutral-500 leading-relaxed">
              When dialogue plays on the target track, this track's volume automatically lowers smoothly and returns when dialogue stops.
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400">Trigger Track:</span>
              <select
                value={ducking.targetTrackId}
                onChange={e => update({ ducking: { ...ducking, targetTrackId: e.target.value } })}
                className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px]"
              >
                {tracks
                  .filter(t => t.type === 'audio')
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                <span>Duck Amount</span>
                <span className="font-mono text-purple-600 dark:text-purple-400">{ducking.duckAmountDb} dB</span>
              </div>
              <input
                type="range"
                min="-24"
                max="-6"
                value={ducking.duckAmountDb}
                onChange={e => update({ ducking: { ...ducking, duckAmountDb: Number(e.target.value) } })}
                className="w-full accent-purple-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: LOUDNESS NORMALIZATION */}
      {subTab === 'normalization' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-amber-500" />
                <span>Integrated Loudness Normalization</span>
              </span>
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={normalization.enabled}
                  onChange={e =>
                    update({ normalization: { ...normalization, enabled: e.target.checked } })
                  }
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { target: -14, label: 'YouTube (-14)' },
                  { target: -16, label: 'Podcast (-16)' },
                  { target: -23, label: 'EBU R128 (-23)' },
                ] as const
              ).map(preset => (
                <button
                  key={preset.target}
                  onClick={() =>
                    update({
                      normalization: { ...normalization, targetLufs: preset.target, enabled: true },
                    })
                  }
                  className={`py-1 rounded text-[10px] font-mono border transition-all ${
                    normalization.targetLufs === preset.target
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-neutral-500">True Peak Limiter Ceiling</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200">-1.0 dBFS</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: AUDIO SYNC */}
      {subTab === 'sync' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-2.5">
            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 block">
              Audio / Video Slip Sync
            </span>
            <p className="text-[11px] text-neutral-500">
              Nudge this audio clip forward or backward by milliseconds to achieve frame-accurate lip sync.
            </p>

            <div>
              <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                <span>Micro-Offset Offset</span>
                <span className="font-mono">{audio.syncOffsetMs || 0} ms</span>
              </div>
              <input
                type="range"
                min="-500"
                max="500"
                value={audio.syncOffsetMs || 0}
                onChange={e => update({ syncOffsetMs: Number(e.target.value) })}
                className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => update({ syncOffsetMs: (audio.syncOffsetMs || 0) - 33 })}
                className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-[10px] hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                -1 Frame (-33ms)
              </button>
              <button
                onClick={() => update({ syncOffsetMs: 0 })}
                className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-[10px] hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Reset Sync
              </button>
              <button
                onClick={() => update({ syncOffsetMs: (audio.syncOffsetMs || 0) + 33 })}
                className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-[10px] hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                +1 Frame (+33ms)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
