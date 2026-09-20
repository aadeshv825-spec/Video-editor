import React from 'react';
import {
  Sliders,
  Volume2,
  VolumeX,
  Radio,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AudioTrack, AudioTrackEq } from '../../../types/audioEditor';

interface AudioMixerPanelProps {
  tracks: AudioTrack[];
  masterVolumeDb: number;
  masterPan: number;
  masterMute: boolean;
  masterEq: AudioTrackEq;
  isPlaying: boolean;
  onUpdateTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  onUpdateMasterVolume: (db: number) => void;
  onUpdateMasterPan: (pan: number) => void;
  onToggleMasterMute: () => void;
  onUpdateMasterEq: (eq: AudioTrackEq) => void;
}

export const AudioMixerPanel: React.FC<AudioMixerPanelProps> = ({
  tracks,
  masterVolumeDb,
  masterPan,
  masterMute,
  masterEq,
  isPlaying,
  onUpdateTrack,
  onUpdateMasterVolume,
  onUpdateMasterPan,
  onToggleMasterMute,
  onUpdateMasterEq,
}) => {
  return (
    <div className="flex-1 bg-neutral-100 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 p-4 sm:p-6 overflow-y-auto select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-500" />
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              Multi-Track Mixer Console & 3-Band Parametric EQ
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-400 animate-pulse' : 'text-neutral-400 dark:text-neutral-600'}`} />
            <span>48 kHz / 24-bit Floating Bus</span>
          </div>
        </div>

        {/* Channel Strips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tracks.map((track, trackIdx) => {
            const eq = track.eq;

            return (
              <div
                key={track.id}
                className="bg-white dark:bg-[#101318] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm dark:shadow-lg relative"
              >
                {/* Channel Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: track.color }}
                    />
                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                      {track.name}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">CH 0{trackIdx + 1}</span>
                </div>

                {/* 3-Band Parametric EQ Section */}
                <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800/80">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-800 dark:text-neutral-300">
                    <span>3-Band EQ</span>
                    <button
                      onClick={() =>
                        onUpdateTrack(track.id, {
                          eq: { ...eq, bassDb: 0, midDb: 0, trebleDb: 0 },
                        })
                      }
                      className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      title="Reset EQ"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Treble Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>High / Treble (8kHz)</span>
                      <span className="font-mono">{eq.trebleDb > 0 ? `+${eq.trebleDb}` : eq.trebleDb}dB</span>
                    </div>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      value={eq.trebleDb}
                      onChange={e =>
                        onUpdateTrack(track.id, {
                          eq: { ...eq, trebleDb: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Mid Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Mid (1kHz)</span>
                      <span className="font-mono">{eq.midDb > 0 ? `+${eq.midDb}` : eq.midDb}dB</span>
                    </div>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      value={eq.midDb}
                      onChange={e =>
                        onUpdateTrack(track.id, {
                          eq: { ...eq, midDb: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Bass Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Low / Bass (100Hz)</span>
                      <span className="font-mono">{eq.bassDb > 0 ? `+${eq.bassDb}` : eq.bassDb}dB</span>
                    </div>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      value={eq.bassDb}
                      onChange={e =>
                        onUpdateTrack(track.id, {
                          eq: { ...eq, bassDb: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Pan / Balance Pot */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span>Stereo Pan / Balance</span>
                    <span className="font-mono">
                      {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(track.pan)}` : `R${track.pan}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={track.pan}
                    onChange={e => onUpdateTrack(track.id, { pan: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer"
                  />
                </div>

                {/* Fader & LED Meter */}
                <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Fader Gain</span>
                      <span className="font-mono text-neutral-200">
                        {track.volumeDb > 0 ? `+${track.volumeDb}` : track.volumeDb} dB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={6}
                      value={track.volumeDb}
                      onChange={e => onUpdateTrack(track.id, { volumeDb: Number(e.target.value) })}
                      className="w-full h-2 bg-neutral-700 rounded appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Visual Peak LED Bar */}
                  <div className="w-3 h-16 bg-neutral-900 rounded flex flex-col justify-end p-0.5 border border-neutral-800 shrink-0">
                    <div
                      style={{
                        height: isPlaying ? `${Math.min(100, Math.max(15, (track.volumeDb + 40) * 2))}%` : '4%',
                      }}
                      className={`w-full rounded-xs transition-all duration-75 ${
                        track.volumeDb > 0 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Channel Mute / Solo */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onUpdateTrack(track.id, { muted: !track.muted })}
                    className={`py-1.5 rounded text-xs font-bold transition-colors ${
                      track.muted
                        ? 'bg-amber-500 text-black'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    MUTE
                  </button>
                  <button
                    onClick={() => onUpdateTrack(track.id, { solo: !track.solo })}
                    className={`py-1.5 rounded text-xs font-bold transition-colors ${
                      track.solo
                        ? 'bg-emerald-500 text-black'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    SOLO
                  </button>
                </div>
              </div>
            );
          })}

          {/* Master Bus Channel Strip */}
          <div className="bg-white dark:bg-[#13161c] border-2 border-emerald-500/50 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-md dark:shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 font-mono">MASTER BUS</span>
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">STEREO OUT</span>
            </div>

            {/* Master 3-Band EQ */}
            <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800/80">
              <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-800 dark:text-neutral-300">
                <span>Master Bus EQ</span>
                <button
                  onClick={() =>
                    onUpdateMasterEq({ ...masterEq, bassDb: 0, midDb: 0, trebleDb: 0 })
                  }
                  className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span>High (8kHz)</span>
                  <span className="font-mono">{masterEq.trebleDb}dB</span>
                </div>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  value={masterEq.trebleDb}
                  onChange={e =>
                    onUpdateMasterEq({ ...masterEq, trebleDb: Number(e.target.value) })
                  }
                  className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span>Bass (100Hz)</span>
                  <span className="font-mono">{masterEq.bassDb}dB</span>
                </div>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  value={masterEq.bassDb}
                  onChange={e =>
                    onUpdateMasterEq({ ...masterEq, bassDb: Number(e.target.value) })
                  }
                  className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Master Pan */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span>Master Balance</span>
                <span className="font-mono">{masterPan === 0 ? 'C' : masterPan}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={masterPan}
                onChange={e => onUpdateMasterPan(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 rounded appearance-none cursor-pointer"
              />
            </div>

            {/* Master Volume */}
            <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                <span>Master Output Fader</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {masterVolumeDb > 0 ? `+${masterVolumeDb}` : masterVolumeDb} dB
                </span>
              </div>
              <input
                type="range"
                min={-40}
                max={6}
                value={masterVolumeDb}
                onChange={e => onUpdateMasterVolume(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <button
              onClick={onToggleMasterMute}
              className={`w-full py-2 rounded text-xs font-bold transition-colors ${
                masterMute
                  ? 'bg-amber-500 text-black'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              {masterMute ? 'MUTED' : 'MUTE MASTER'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
