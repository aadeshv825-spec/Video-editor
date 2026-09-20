import React, { useRef, useState } from 'react';
import {
  Plus,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { AudioClip, AudioTrack } from '../../../types/audioEditor';

interface AudioTimelineProps {
  tracks: AudioTrack[];
  clips: AudioClip[];
  selectedClipId: string | null;
  selectedTrackId: string | null;
  currentTimeSec: number;
  totalDurationSec: number;
  zoomPixelsPerSec: number;
  onSelectClip: (clipId: string) => void;
  onSelectTrack: (trackId: string) => void;
  onSeek: (timeSec: number) => void;
  onUpdateClip: (clipId: string, updates: Partial<AudioClip>) => void;
  onUpdateTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  onAddTrack: () => void;
  onDeleteTrack: (trackId: string) => void;
}

export const AudioTimeline: React.FC<AudioTimelineProps> = ({
  tracks,
  clips,
  selectedClipId,
  selectedTrackId,
  currentTimeSec,
  totalDurationSec,
  zoomPixelsPerSec,
  onSelectClip,
  onSelectTrack,
  onSeek,
  onUpdateClip,
  onUpdateTrack,
  onAddTrack,
}) => {
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const [dragAction, setDragAction] = useState<{
    clipId: string;
    type: 'move' | 'trim-head' | 'trim-tail';
    initialX: number;
    initialStart: number;
    initialDuration: number;
  } | null>(null);

  const timelineWidth = Math.max(800, totalDurationSec * zoomPixelsPerSec);

  // Time Ruler clicks to seek
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = Math.max(0, Math.min(totalDurationSec, clickX / zoomPixelsPerSec));
    onSeek(seekTime);
  };

  // Clip drag interactions (Move / Trim Head / Trim Tail)
  const handleClipPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    clip: AudioClip,
    type: 'move' | 'trim-head' | 'trim-tail'
  ) => {
    e.stopPropagation();
    onSelectClip(clip.id);
    onSelectTrack(clip.trackId);
    setDragAction({
      clipId: clip.id,
      type,
      initialX: e.clientX,
      initialStart: clip.startSec,
      initialDuration: clip.durationSec,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragAction) return;
    const deltaX = e.clientX - dragAction.initialX;
    const deltaSec = deltaX / zoomPixelsPerSec;

    if (dragAction.type === 'move') {
      const newStart = Math.max(0, dragAction.initialStart + deltaSec);
      onUpdateClip(dragAction.clipId, { startSec: newStart });
    } else if (dragAction.type === 'trim-head') {
      const newStart = Math.max(0, dragAction.initialStart + deltaSec);
      const newDuration = Math.max(0.5, dragAction.initialDuration - deltaSec);
      onUpdateClip(dragAction.clipId, {
        startSec: newStart,
        durationSec: newDuration,
      });
    } else if (dragAction.type === 'trim-tail') {
      const newDuration = Math.max(0.5, dragAction.initialDuration + deltaSec);
      onUpdateClip(dragAction.clipId, { durationSec: newDuration });
    }
  };

  const handlePointerUp = () => {
    setDragAction(null);
  };

  // Generate seconds marks on the ruler
  const rulerStepSec = zoomPixelsPerSec > 60 ? 1 : zoomPixelsPerSec > 30 ? 2 : 5;
  const numRulerSteps = Math.ceil(totalDurationSec / rulerStepSec);

  return (
    <div
      id="audio-multitrack-timeline"
      className="flex-1 flex flex-col bg-neutral-100 dark:bg-[#0c0e12] text-neutral-800 dark:text-neutral-200 overflow-hidden select-none relative"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Top Ruler & Track Headers Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Track Control Headers Sidebar */}
        <div className="w-56 sm:w-64 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#101318] flex flex-col shrink-0 z-20">
          {/* Header Top corner spacer */}
          <div className="h-9 px-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900/50">
            <span className="font-mono">TRACKS ({tracks.length})</span>
            <button
              onClick={onAddTrack}
              className="flex items-center gap-1 text-[10px] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              title="Add Audio Track"
            >
              <Plus className="w-3 h-3" />
              <span>Track</span>
            </button>
          </div>

          {/* Track Headers Stack */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800/60">
            {tracks.map(track => {
              const isSelected = track.id === selectedTrackId;

              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track.id)}
                  style={{ height: '96px' }}
                  className={`p-2.5 flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-neutral-200/80 dark:bg-neutral-800/70' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: track.color }}
                      />
                      <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-200 truncate">
                        {track.name}
                      </span>
                    </div>

                    {/* Mute & Solo Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onUpdateTrack(track.id, { muted: !track.muted });
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          track.muted
                            ? 'bg-amber-500 text-black'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Mute Track"
                      >
                        M
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onUpdateTrack(track.id, { solo: !track.solo });
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          track.solo
                            ? 'bg-emerald-500 text-black'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title="Solo Track"
                      >
                        S
                      </button>
                    </div>
                  </div>

                  {/* Volume Slider & Pan */}
                  <div className="space-y-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        <span>Vol</span>
                      </div>
                      <span className="font-mono">
                        {track.volumeDb > 0 ? `+${track.volumeDb}` : track.volumeDb} dB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={6}
                      value={track.volumeDb}
                      onChange={e => onUpdateTrack(track.id, { volumeDb: Number(e.target.value) })}
                      className="w-full h-1 bg-neutral-300 dark:bg-neutral-700 accent-emerald-500 rounded appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Scrollable Timeline Tracks Area */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative bg-neutral-200/50 dark:bg-[#090b0e]">
          {/* Time Ruler */}
          <div
            onClick={handleRulerClick}
            style={{ width: `${timelineWidth}px` }}
            className="h-9 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#0d1015] relative cursor-pointer shrink-0"
          >
            {Array.from({ length: numRulerSteps }).map((_, i) => {
              const sec = i * rulerStepSec;
              const leftPx = sec * zoomPixelsPerSec;
              const min = Math.floor(sec / 60);
              const remainderSec = sec % 60;
              const label = `${min.toString().padStart(2, '0')}:${remainderSec.toString().padStart(2, '0')}`;

              return (
                <div
                  key={sec}
                  style={{ left: `${leftPx}px` }}
                  className="absolute top-0 bottom-0 border-l border-neutral-700/60 pl-1 text-[10px] font-mono text-neutral-500 pointer-events-none"
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* Track Lanes */}
          <div
            ref={timelineContentRef}
            style={{ width: `${timelineWidth}px` }}
            className="relative flex-1 divide-y divide-neutral-200 dark:divide-neutral-800/40"
          >
            {/* Playhead Red Needle */}
            <div
              style={{
                left: `${currentTimeSec * zoomPixelsPerSec}px`,
              }}
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 pointer-events-none z-30"
            >
              <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-rose-500 rotate-45 rounded-xs shadow-md" />
            </div>

            {tracks.map(track => {
              const trackClips = clips.filter(c => c.trackId === track.id);

              return (
                <div
                  key={track.id}
                  style={{ height: '96px' }}
                  className="relative w-full bg-white/40 dark:bg-neutral-900/20 hover:bg-white/60 dark:hover:bg-neutral-900/30"
                >
                  {/* Clips on this lane */}
                  {trackClips.map(clip => {
                    const isSelected = clip.id === selectedClipId;
                    const leftPx = clip.startSec * zoomPixelsPerSec;
                    const widthPx = clip.durationSec * zoomPixelsPerSec;

                    return (
                      <div
                        key={clip.id}
                        onClick={e => {
                          e.stopPropagation();
                          onSelectClip(clip.id);
                          onSelectTrack(clip.trackId);
                        }}
                        onPointerDown={e => handleClipPointerDown(e, clip, 'move')}
                        style={{
                          left: `${leftPx}px`,
                          width: `${Math.max(20, widthPx)}px`,
                          backgroundColor: `${clip.color}22`,
                          borderColor: clip.color,
                        }}
                        className={`absolute top-2 bottom-2 rounded-lg border-2 overflow-hidden flex flex-col justify-between cursor-move z-10 transition-shadow ${
                          isSelected
                            ? 'ring-2 ring-white shadow-lg'
                            : 'hover:brightness-110'
                        } ${clip.muted ? 'opacity-40' : ''}`}
                      >
                        {/* Fade In visual curve */}
                        {clip.fadeInSec > 0 && (
                          <div
                            style={{
                              width: `${(clip.fadeInSec / clip.durationSec) * 100}%`,
                            }}
                            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-black/80 to-transparent pointer-events-none"
                          />
                        )}

                        {/* Fade Out visual curve */}
                        {clip.fadeOutSec > 0 && (
                          <div
                            style={{
                              width: `${(clip.fadeOutSec / clip.durationSec) * 100}%`,
                            }}
                            className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-black/80 to-transparent pointer-events-none"
                          />
                        )}

                        {/* Left Trim Handle */}
                        <div
                          onPointerDown={e => handleClipPointerDown(e, clip, 'trim-head')}
                          className="absolute top-0 bottom-0 left-0 w-2.5 hover:bg-white/40 cursor-ew-resize z-20 rounded-l"
                        />

                        {/* Right Trim Handle */}
                        <div
                          onPointerDown={e => handleClipPointerDown(e, clip, 'trim-tail')}
                          className="absolute top-0 bottom-0 right-0 w-2.5 hover:bg-white/40 cursor-ew-resize z-20 rounded-r"
                        />

                        {/* Clip Header Label */}
                        <div className="px-2 py-0.5 flex items-center justify-between text-[10px] font-semibold text-neutral-100 z-10 bg-black/40 truncate">
                          <span className="truncate">{clip.title}</span>
                          <span className="font-mono text-[9px] opacity-70 ml-1">
                            {clip.durationSec.toFixed(1)}s
                          </span>
                        </div>

                        {/* Audio Waveform Graphic */}
                        <div className="flex-1 flex items-center justify-between gap-0.5 px-2 py-1 opacity-70 pointer-events-none">
                          {(clip.waveformSamples || []).map((sample, idx) => (
                            <div
                              key={idx}
                              style={{
                                height: `${Math.max(10, sample * 100)}%`,
                                backgroundColor: clip.color,
                              }}
                              className="w-1 rounded-full shrink-0"
                            />
                          ))}
                        </div>

                        {/* Clip Footer (Gain / Pitch / Speed badge) */}
                        <div className="px-1.5 py-0.5 flex items-center justify-between text-[9px] font-mono text-neutral-400 bg-black/50 z-10">
                          <span>
                            {clip.volumeDb > 0 ? `+${clip.volumeDb}` : clip.volumeDb}dB
                          </span>
                          {clip.pitchSemitones !== 0 && (
                            <span className="text-amber-400">
                              {clip.pitchSemitones > 0 ? `+${clip.pitchSemitones}` : clip.pitchSemitones}st
                            </span>
                          )}
                          {clip.speed !== 1 && (
                            <span className="text-cyan-400">{clip.speed}x</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
