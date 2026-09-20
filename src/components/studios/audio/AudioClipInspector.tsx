import React from 'react';
import {
  Volume2,
  VolumeX,
  Gauge,
  Music,
  RotateCcw,
  Sparkles,
  Sliders,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AudioClip } from '../../../types/audioEditor';

interface AudioClipInspectorProps {
  clip: AudioClip | null;
  onUpdateClip: (clipId: string, updates: Partial<AudioClip>) => void;
  onRevertToOriginalAudio?: (clipId: string) => void;
}

export const AudioClipInspector: React.FC<AudioClipInspectorProps> = ({
  clip,
  onUpdateClip,
  onRevertToOriginalAudio,
}) => {
  if (!clip) {
    return (
      <div className="w-full sm:w-80 h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111318] flex flex-col items-center justify-center p-6 text-center text-xs text-neutral-400 select-none">
        <Volume2 className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mb-2" />
        <span className="font-semibold text-neutral-700 dark:text-neutral-300">No Audio Clip Selected</span>
        <p className="text-[11px] text-neutral-500 mt-1 max-w-[200px]">
          Click any audio clip on the timeline tracks to inspect and tune its volume, fades, pitch, and speed.
        </p>
      </div>
    );
  }

  const handleNormalize = () => {
    // Peak normalize: sets volume to optimal standard level (e.g. 0 dB or -0.5 dB)
    onUpdateClip(clip.id, { volumeDb: 0 });
  };

  return (
    <div className="w-full sm:w-80 h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111318] flex flex-col text-xs overflow-y-auto shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100 truncate">
          <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="truncate">{clip.title}</span>
        </div>
        <button
          onClick={() => onUpdateClip(clip.id, { muted: !clip.muted })}
          className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
            clip.muted
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {clip.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          <span>{clip.muted ? 'Muted' : 'Audible'}</span>
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Preserve Original Audio Protection Banner */}
        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Non-Destructive Stem</span>
            </div>
            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
              Original audio source remains pristine on disk. Gain, fades, pitch, and speed are applied via non-destructive real-time DSP.
            </p>
          </div>
          {onRevertToOriginalAudio && (
            <button
              onClick={() => onRevertToOriginalAudio(clip.id)}
              className="px-2 py-1 bg-white dark:bg-neutral-900 text-[10px] font-medium rounded border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 shrink-0 flex items-center gap-1"
              title="Reset clip back to pristine original audio"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Revert</span>
            </button>
          )}
        </div>

        {/* Volume & Gain Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Volume & Gain</span>
            </span>
            <span className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
              {clip.volumeDb > 0 ? `+${clip.volumeDb}` : clip.volumeDb} dB
            </span>
          </div>

          <input
            type="range"
            min={-40}
            max={12}
            value={clip.volumeDb}
            onChange={e => onUpdateClip(clip.id, { volumeDb: Number(e.target.value) })}
            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />

          <button
            onClick={handleNormalize}
            className="w-full py-1.5 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 font-medium flex items-center justify-center gap-1.5 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Peak Normalize (0.0 dBFS)</span>
          </button>
        </div>

        {/* Fades & Crossfade section */}
        <div className="space-y-3.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            Fades & Transitions
          </span>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-[11px]">
              <span>Fade In Duration</span>
              <span className="font-mono">{clip.fadeInSec.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.min(5, clip.durationSec / 2)}
              step={0.05}
              value={clip.fadeInSec}
              onChange={e => onUpdateClip(clip.id, { fadeInSec: Number(e.target.value) })}
              className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-[11px]">
              <span>Fade Out Duration</span>
              <span className="font-mono">{clip.fadeOutSec.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.min(5, clip.durationSec / 2)}
              step={0.05}
              value={clip.fadeOutSec}
              onChange={e => onUpdateClip(clip.id, { fadeOutSec: Number(e.target.value) })}
              className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-[11px]">
              <span>Crossfade Curve</span>
              <span className="font-mono">{clip.crossfadeSec.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={clip.crossfadeSec}
              onChange={e => onUpdateClip(clip.id, { crossfadeSec: Number(e.target.value) })}
              className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Pitch & Speed / Time-Stretch Foundation */}
        <div className="space-y-3.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-purple-500" />
            <span>Pitch & Time-Stretch Foundation</span>
          </span>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-[11px]">
              <span>Pitch Shift (Semitones)</span>
              <span className="font-mono text-purple-500 font-semibold">
                {clip.pitchSemitones > 0 ? `+${clip.pitchSemitones}` : clip.pitchSemitones} st
              </span>
            </div>
            <input
              type="range"
              min={-12}
              max={12}
              value={clip.pitchSemitones}
              onChange={e => onUpdateClip(clip.id, { pitchSemitones: Number(e.target.value) })}
              className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>-1 Octave</span>
              <span>Neutral</span>
              <span>+1 Octave</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-[11px]">
              <span>Playback Speed / Stretch</span>
              <span className="font-mono text-cyan-500 font-semibold">{clip.speed}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={clip.speed}
              onChange={e => onUpdateClip(clip.id, { speed: Number(e.target.value) })}
              className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>0.5x (Slow)</span>
              <span>1.0x</span>
              <span>2.0x (Fast)</span>
            </div>
          </div>
        </div>

        {/* Clip Pan */}
        <div className="space-y-1 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-[11px]">
            <span>Stereo Pan</span>
            <span className="font-mono">
              {clip.pan === 0 ? 'Center' : clip.pan < 0 ? `L ${Math.abs(clip.pan)}%` : `R ${clip.pan}%`}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={clip.pan}
            onChange={e => onUpdateClip(clip.id, { pan: Number(e.target.value) })}
            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
