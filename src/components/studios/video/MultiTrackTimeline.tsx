import React, { useRef, useState, useEffect } from 'react';
import {
  Film,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Music,
  Sliders,
  Sparkles,
  Layers,
  Bookmark,
  ChevronRight,
  Home,
  Trash2,
  Check,
  Disc,
} from 'lucide-react';
import { TimelineClip, TimelineTrack, TimelineMarker } from '../../../types/videoEditor';

interface MultiTrackTimelineProps {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  playheadSec: number;
  totalDurationSec: number;
  zoomPxPerSec: number;
  snappingEnabled: boolean;
  selectedClipId: string | null;
  markers?: TimelineMarker[];
  trackHeight?: 'compact' | 'standard' | 'expanded';
  activeSequenceTitle?: string;
  sequenceBreadcrumbs?: { id: string; title: string }[];
  editTool?: 'select' | 'split' | 'slip' | 'slide' | 'ripple';
  onSelectClip: (clipId: string | null) => void;
  onSeek: (timeSec: number) => void;
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  onToggleTrackMute: (trackId: string) => void;
  onToggleTrackLock: (trackId: string) => void;
  onToggleTrackHidden: (trackId: string) => void;
  onToggleTrackSolo?: (trackId: string) => void;
  onRenameTrack?: (trackId: string, label: string) => void;
  onDeleteTrack?: (trackId: string) => void;
  onChangeTrackVolume: (trackId: string, volume: number) => void;
  onAddMarker?: (timeSec: number) => void;
  onDeleteMarker?: (markerId: string) => void;
  onOpenCompoundClip?: (clipId: string) => void;
  onNavigateBreadcrumb?: (index: number) => void;
}

export const MultiTrackTimeline: React.FC<MultiTrackTimelineProps> = ({
  tracks,
  clips,
  playheadSec,
  totalDurationSec,
  zoomPxPerSec,
  snappingEnabled,
  selectedClipId,
  markers = [],
  trackHeight = 'standard',
  activeSequenceTitle,
  sequenceBreadcrumbs = [],
  editTool = 'select',
  onSelectClip,
  onSeek,
  onUpdateClip,
  onToggleTrackMute,
  onToggleTrackLock,
  onToggleTrackHidden,
  onToggleTrackSolo,
  onRenameTrack,
  onDeleteTrack,
  onChangeTrackVolume,
  onAddMarker,
  onDeleteMarker,
  onOpenCompoundClip,
  onNavigateBreadcrumb,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lanesScrollRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Inline editing track name state
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackLabel, setEditingTrackLabel] = useState('');

  // Drag states: 'scrub' | 'moveClip' | 'trimLeft' | 'trimRight' | 'slip' | 'slide' | null
  const [dragState, setDragState] = useState<{
    type: 'scrub' | 'moveClip' | 'trimLeft' | 'trimRight' | 'slip' | 'slide';
    clipId?: string;
    initialMouseX: number;
    initialClipStartSec?: number;
    initialClipDurationSec?: number;
    initialTrimInSec?: number;
    initialTrimOutSec?: number;
  } | null>(null);

  // Height map
  const heightClasses = {
    compact: 'h-10',
    standard: 'h-14',
    expanded: 'h-20',
  };

  const clipHeightClasses = {
    compact: 'h-8',
    standard: 'h-11',
    expanded: 'h-16',
  };

  // Calculate timeline canvas total pixel width
  const timelinePixelWidth = Math.max(1200, (totalDurationSec + 10) * zoomPxPerSec);

  // Time ruler tick intervals based on zoom
  const tickStepSec = zoomPxPerSec > 80 ? 0.5 : zoomPxPerSec > 40 ? 1 : 2;
  const majorTickCount = Math.ceil((totalDurationSec + 10) / tickStepSec);

  // Magnet snap helper
  const getSnappedTime = (candidateTime: number, excludeClipId?: string): number => {
    if (!snappingEnabled) return candidateTime;
    const snapThresholdSec = 0.25;

    // Snap to playhead
    if (Math.abs(candidateTime - playheadSec) < snapThresholdSec) {
      return playheadSec;
    }

    // Snap to markers
    for (const m of markers) {
      if (Math.abs(candidateTime - m.timeSec) < snapThresholdSec) {
        return m.timeSec;
      }
    }

    // Snap to edges of other clips
    for (const c of clips) {
      if (c.id === excludeClipId) continue;
      const cStart = c.startSec;
      const cEnd = c.startSec + c.durationSec;
      if (Math.abs(candidateTime - cStart) < snapThresholdSec) {
        return cStart;
      }
      if (Math.abs(candidateTime - cEnd) < snapThresholdSec) {
        return cEnd;
      }
    }

    return candidateTime;
  };

  // Ruler scrub mouse down
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    if (!lanesScrollRef.current) return;
    const rect = lanesScrollRef.current.getBoundingClientRect();
    const scrollLeft = lanesScrollRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const newTime = Math.max(0, clickX / zoomPxPerSec);
    onSeek(newTime);

    setDragState({
      type: 'scrub',
      initialMouseX: e.clientX,
    });
  };

  // Clip drag move mouse down
  const handleClipMouseDown = (e: React.MouseEvent, clip: TimelineClip) => {
    e.stopPropagation();
    onSelectClip(clip.id);

    // If edit tool is 'slip'
    if (editTool === 'slip') {
      setDragState({
        type: 'slip',
        clipId: clip.id,
        initialMouseX: e.clientX,
        initialClipStartSec: clip.startSec,
        initialClipDurationSec: clip.durationSec,
        initialTrimInSec: clip.trimInSec || 0,
        initialTrimOutSec: clip.trimOutSec || 0,
      });
      return;
    }

    // Check if clicked near left or right edge for trimming
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickOffset = e.clientX - rect.left;
    const edgeMarginPx = 10;

    if (clickOffset <= edgeMarginPx) {
      // Trim Left
      setDragState({
        type: 'trimLeft',
        clipId: clip.id,
        initialMouseX: e.clientX,
        initialClipStartSec: clip.startSec,
        initialClipDurationSec: clip.durationSec,
        initialTrimInSec: clip.trimInSec,
      });
    } else if (clickOffset >= rect.width - edgeMarginPx) {
      // Trim Right
      setDragState({
        type: 'trimRight',
        clipId: clip.id,
        initialMouseX: e.clientX,
        initialClipStartSec: clip.startSec,
        initialClipDurationSec: clip.durationSec,
        initialTrimOutSec: clip.trimOutSec,
      });
    } else {
      // Move Clip
      setDragState({
        type: 'moveClip',
        clipId: clip.id,
        initialMouseX: e.clientX,
        initialClipStartSec: clip.startSec,
        initialClipDurationSec: clip.durationSec,
      });
    }
  };

  // Global mouse move & up listeners for smooth timeline dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !lanesScrollRef.current) return;

      const deltaX = e.clientX - dragState.initialMouseX;
      const deltaSec = deltaX / zoomPxPerSec;

      if (dragState.type === 'scrub') {
        const rect = lanesScrollRef.current.getBoundingClientRect();
        const scrollLeft = lanesScrollRef.current.scrollLeft;
        const currentX = e.clientX - rect.left + scrollLeft;
        const newTime = Math.max(0, currentX / zoomPxPerSec);
        onSeek(newTime);
      } else if (dragState.type === 'moveClip' && dragState.clipId) {
        const rawNewStart = Math.max(0, (dragState.initialClipStartSec || 0) + deltaSec);
        const snappedStart = getSnappedTime(rawNewStart, dragState.clipId);
        onUpdateClip(dragState.clipId, { startSec: Math.max(0, snappedStart) });
      } else if (dragState.type === 'trimLeft' && dragState.clipId) {
        const rawNewStart = Math.max(0, (dragState.initialClipStartSec || 0) + deltaSec);
        const initialEnd = (dragState.initialClipStartSec || 0) + (dragState.initialClipDurationSec || 0);
        const maxStart = initialEnd - 0.2;
        const clampedStart = Math.min(maxStart, Math.max(0, rawNewStart));
        const newDuration = initialEnd - clampedStart;
        onUpdateClip(dragState.clipId, {
          startSec: clampedStart,
          durationSec: newDuration,
          trimInSec: Math.max(0, (dragState.initialTrimInSec || 0) + (clampedStart - (dragState.initialClipStartSec || 0))),
        });
      } else if (dragState.type === 'trimRight' && dragState.clipId) {
        const rawNewDuration = Math.max(0.2, (dragState.initialClipDurationSec || 0) + deltaSec);
        const rawEnd = (dragState.initialClipStartSec || 0) + rawNewDuration;
        const snappedEnd = getSnappedTime(rawEnd, dragState.clipId);
        const finalDuration = Math.max(0.2, snappedEnd - (dragState.initialClipStartSec || 0));
        onUpdateClip(dragState.clipId, {
          durationSec: finalDuration,
          trimOutSec: (dragState.initialTrimOutSec || 0) + deltaSec,
        });
      } else if (dragState.type === 'slip' && dragState.clipId) {
        // Slip edit shifts trimInSec without changing clip start or duration
        const newTrimIn = Math.max(0, (dragState.initialTrimInSec || 0) - deltaSec);
        onUpdateClip(dragState.clipId, { trimInSec: newTrimIn });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoomPxPerSec, playheadSec, snappingEnabled]);

  // Format time for ruler ticks: e.g. 0:00, 0:01, 0:02
  const formatRulerTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const f = Math.floor((sec % 1) * 30);
    if (zoomPxPerSec > 80) {
      return `${m}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleStartRename = (track: TimelineTrack) => {
    setEditingTrackId(track.id);
    setEditingTrackLabel(track.label);
  };

  const handleFinishRename = () => {
    if (editingTrackId && onRenameTrack && editingTrackLabel.trim()) {
      onRenameTrack(editingTrackId, editingTrackLabel.trim());
    }
    setEditingTrackId(null);
  };

  return (
    <div
      ref={containerRef}
      id="multi-track-timeline"
      className="flex-1 flex flex-col bg-white dark:bg-[#101217] select-none overflow-hidden relative"
    >
      {/* Sequence Breadcrumb Bar (For Nested Compound Clips) */}
      {sequenceBreadcrumbs.length > 0 && (
        <div className="h-7 px-3 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-300 shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <button
              onClick={() => onNavigateBreadcrumb && onNavigateBreadcrumb(-1)}
              className="flex items-center gap-1 hover:underline text-indigo-700 dark:text-indigo-200"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Main Timeline</span>
            </button>
            {sequenceBreadcrumbs.map((b, idx) => (
              <React.Fragment key={b.id}>
                <ChevronRight className="w-3 h-3 text-indigo-400" />
                <span className="font-semibold text-indigo-900 dark:text-indigo-100 truncate max-w-[200px]">
                  {b.title}
                </span>
              </React.Fragment>
            ))}
          </div>
          <span className="text-[10px] font-mono bg-indigo-500/20 px-2 py-0.5 rounded">
            Nested Compound Sequence Active
          </span>
        </div>
      )}

      {/* Top Ruler Bar & Playhead Header */}
      <div className="h-7 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-[#16181f] flex shrink-0">
        {/* Track Headers Spacer */}
        <div className="w-14 sm:w-28 md:w-48 px-2 sm:px-3 border-r border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400 shrink-0">
          <span className="hidden sm:inline">TRACKS ({tracks.length})</span>
          <span className="sm:hidden">{tracks.length}T</span>
          <span className="hidden md:inline text-neutral-500">M / S / L</span>
        </div>

        {/* Time Ruler (Draggable) */}
        <div
          ref={rulerRef}
          onMouseDown={handleRulerMouseDown}
          className="flex-1 relative overflow-hidden cursor-ew-resize bg-neutral-50 dark:bg-[#13151b]"
        >
          <div style={{ width: `${timelinePixelWidth}px` }} className="h-full relative">
            {/* Markers on Ruler */}
            {markers.map(marker => {
              const leftPx = marker.timeSec * zoomPxPerSec;
              return (
                <div
                  key={marker.id}
                  style={{ left: `${leftPx}px` }}
                  className="absolute top-0 bottom-0 z-30 group cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    onSeek(marker.timeSec);
                  }}
                  title={`Marker: ${marker.label} (${marker.timeSec.toFixed(2)}s)`}
                >
                  <div
                    style={{ backgroundColor: marker.color || '#06b6d4' }}
                    className="w-2.5 h-3 rounded-b-xs shadow-xs -translate-x-1/2 flex items-center justify-center text-[7px] text-black font-bold"
                  >
                    M
                  </div>
                  {/* Delete button on hover */}
                  {onDeleteMarker && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteMarker(marker.id);
                      }}
                      className="hidden group-hover:block absolute -top-1 left-2 bg-red-600 text-white p-0.5 rounded text-[8px]"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}

            {/* Ruler Major & Minor Ticks */}
            {Array.from({ length: majorTickCount }).map((_, i) => {
              const sec = i * tickStepSec;
              const leftPx = sec * zoomPxPerSec;
              return (
                <div
                  key={i}
                  style={{ left: `${leftPx}px` }}
                  className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
                >
                  <div className="flex items-center gap-1 pl-1">
                    <div className="w-[1px] h-3 bg-neutral-400 dark:bg-neutral-600" />
                    <span className="text-[9px] font-mono text-neutral-400">
                      {formatRulerTime(sec)}
                    </span>
                  </div>
                  <div className="w-[1px] h-1.5 bg-neutral-300 dark:bg-neutral-700" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tracks & Clips Body Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Track Headers Column */}
        <div className="w-14 sm:w-28 md:w-48 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#12141a] flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800 overflow-y-auto shrink-0 select-none">
          {tracks.map(track => {
            const isAudio = track.type === 'audio';
            const isEditing = editingTrackId === track.id;

            return (
              <div
                key={track.id}
                className={`${heightClasses[trackHeight]} px-1.5 sm:px-2.5 flex items-center justify-between transition-colors hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40`}
              >
                {/* Track Icon & Name */}
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1 mr-1">
                  <div className="text-neutral-400 shrink-0">
                    {isAudio ? (
                      <Music className="w-3.5 h-3.5 text-emerald-500" />
                    ) : track.type === 'text' ? (
                      <Type className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Film className="w-3.5 h-3.5 text-blue-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 hidden sm:block">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTrackLabel}
                        onChange={e => setEditingTrackLabel(e.target.value)}
                        onBlur={handleFinishRename}
                        onKeyDown={e => e.key === 'Enter' && handleFinishRename()}
                        autoFocus
                        className="w-full px-1 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[11px] font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      />
                    ) : (
                      <p
                        onDoubleClick={() => handleStartRename(track)}
                        className="font-mono text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate cursor-text"
                        title="Double-click to rename track"
                      >
                        {track.label}
                      </p>
                    )}
                    <p className="text-[9px] font-mono text-neutral-400 uppercase leading-none">
                      {track.type}
                    </p>
                  </div>
                </div>

                {/* Track Mute / Solo / Lock / Delete Controls */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {/* Mute Track */}
                  <button
                    onClick={() =>
                      isAudio ? onToggleTrackMute(track.id) : onToggleTrackHidden(track.id)
                    }
                    className={`p-1 rounded transition-colors ${
                      (isAudio && track.muted) || (!isAudio && track.hidden)
                        ? 'text-red-500 bg-red-100 dark:bg-red-950/40'
                        : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                    title={isAudio ? (track.muted ? 'Unmute Audio (M)' : 'Mute Audio (M)') : (track.hidden ? 'Show Track' : 'Hide Track')}
                  >
                    {isAudio ? (
                      track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />
                    ) : track.hidden ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </button>

                  {/* Solo Track (hidden on small mobile) */}
                  {onToggleTrackSolo && (
                    <button
                      onClick={() => onToggleTrackSolo(track.id)}
                      className={`hidden md:block px-1 py-0.5 rounded text-[9px] font-mono font-bold transition-colors ${
                        track.solo
                          ? 'bg-amber-500 text-black'
                          : 'text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                      title={track.solo ? 'Unsolo Track (S)' : 'Solo Track (S)'}
                    >
                      S
                    </button>
                  )}

                  {/* Lock Track (hidden on small mobile) */}
                  <button
                    onClick={() => onToggleTrackLock(track.id)}
                    className={`hidden md:block p-1 rounded transition-colors ${
                      track.locked
                        ? 'text-amber-500 bg-amber-500/10'
                        : 'text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                    title={track.locked ? 'Unlock Track' : 'Lock Track'}
                  >
                    {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Track Lanes Canvas Area (Horizontally & Vertically Scrollable) */}
        <div
          ref={lanesScrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#fdfdfd] dark:bg-[#0c0e14]"
        >
          <div
            style={{ width: `${timelinePixelWidth}px` }}
            className="h-full relative flex flex-col divide-y divide-neutral-200/60 dark:divide-neutral-800/60"
          >
            {/* Background vertical second guide lines */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: majorTickCount }).map((_, i) => {
                const sec = i * tickStepSec;
                const leftPx = sec * zoomPxPerSec;
                return (
                  <div
                    key={i}
                    style={{ left: `${leftPx}px` }}
                    className="absolute top-0 bottom-0 w-[1px] bg-neutral-200/40 dark:bg-neutral-800/40"
                  />
                );
              })}
            </div>

            {/* Individual Track Lanes */}
            {tracks.map(track => {
              const trackClips = clips.filter(c => c.trackId === track.id);
              const isAudio = track.type === 'audio';

              return (
                <div
                  key={track.id}
                  className={`${heightClasses[trackHeight]} relative flex items-center px-1 transition-opacity ${
                    track.hidden ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  {/* Track Clips */}
                  {trackClips.map(clip => {
                    const leftPx = clip.startSec * zoomPxPerSec;
                    const widthPx = Math.max(24, clip.durationSec * zoomPxPerSec);
                    const isSelected = clip.id === selectedClipId;
                    const isCompound = clip.type === 'compound';
                    const isAdjustment = clip.type === 'adjustment';
                    const isDisabled = clip.disabled;

                    return (
                      <div
                        key={clip.id}
                        onMouseDown={e => handleClipMouseDown(e, clip)}
                        onDoubleClick={e => {
                          e.stopPropagation();
                          if (isCompound && onOpenCompoundClip) {
                            onOpenCompoundClip(clip.id);
                          }
                        }}
                        style={{
                          left: `${leftPx}px`,
                          width: `${widthPx}px`,
                        }}
                        className={`absolute ${clipHeightClasses[trackHeight]} rounded-md border flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all shadow-xs ${
                          isAdjustment
                            ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/80 border-purple-500/80 text-purple-100'
                            : isCompound
                            ? 'bg-gradient-to-r from-indigo-900/90 to-indigo-800/90 border-indigo-500/90 text-indigo-100'
                            : clip.colorBadge
                        } ${
                          isSelected
                            ? 'ring-2 ring-neutral-900 dark:ring-white ring-offset-1 dark:ring-offset-neutral-900 z-20 shadow-md'
                            : 'z-10 hover:brightness-105'
                        } ${isDisabled ? 'opacity-40 line-through' : ''}`}
                      >
                        {/* Clip Top Header Label */}
                        <div className="h-4 px-1.5 bg-black/30 flex items-center justify-between text-[10px] font-mono leading-none truncate">
                          <div className="flex items-center gap-1 truncate">
                            {isAdjustment && <Sparkles className="w-2.5 h-2.5 text-purple-300 shrink-0" />}
                            {isCompound && <Layers className="w-2.5 h-2.5 text-indigo-300 shrink-0" />}
                            <span className="truncate font-semibold text-white/90">
                              {clip.title}
                            </span>
                          </div>
                          <span className="text-[9px] opacity-75 shrink-0 ml-1">
                            {clip.durationSec.toFixed(1)}s
                          </span>
                        </div>

                        {/* Clip Body: Thumbnails, Waveform or Adjustment Pattern */}
                        <div className="flex-1 flex items-center px-1 overflow-hidden relative">
                          {isAudio ? (
                            /* Waveform visualization */
                            <div className="w-full h-full flex items-center gap-0.5 opacity-80">
                              {(clip.waveformSamples || []).map((sample: number, idx: number) => (
                                <div
                                  key={idx}
                                  style={{ height: `${sample * 100}%` }}
                                  className="flex-1 bg-white/70 min-w-[2px] rounded-xs"
                                />
                              ))}
                            </div>
                          ) : isAdjustment ? (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-purple-200/60 uppercase tracking-widest pointer-events-none">
                              ADJUSTMENT FILTER
                            </div>
                          ) : isCompound ? (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-indigo-200/70 tracking-wider pointer-events-none">
                              NESTED SEQUENCE ({clip.compoundChildren?.length || 0} CLIPS)
                            </div>
                          ) : (
                            /* Video Filmstrip thumbnails pattern */
                            <div className="w-full h-full flex items-center gap-1 opacity-70">
                              {clip.url ? (
                                <div className="flex h-full gap-1 overflow-hidden pointer-events-none">
                                  {Array.from({ length: Math.ceil(widthPx / 50) }).map((_, idx) => (
                                    <img
                                      key={idx}
                                      src={clip.url}
                                      alt=""
                                      referrerPolicy="no-referrer"
                                      className="h-full aspect-video object-cover rounded-xs border border-black/20 shrink-0"
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] font-mono text-white/60 truncate">
                                  {clip.title}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Speed Badge if altered */}
                          {clip.speed.speed !== 1 && (
                            <div className="absolute top-0.5 right-1 px-1 py-0.2 bg-black/60 rounded text-[8px] font-mono text-amber-400">
                              {clip.speed.speed}x
                            </div>
                          )}

                          {/* VFX Badge if masks or chroma key active */}
                          {(clip.masks?.length || clip.chromaKey?.enabled) && (
                            <div className="absolute bottom-0.5 right-1 px-1 py-0.2 bg-purple-900/80 rounded text-[8px] font-mono text-purple-200">
                              VFX
                            </div>
                          )}
                        </div>

                        {/* Trimming handles (Left and Right edges) */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/30 hover:bg-white/70 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity" />
                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/30 hover:bg-white/70 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Playhead Marker Needle Line spanning across all lanes */}
            <div
              style={{ left: `${playheadSec * zoomPxPerSec}px` }}
              className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 pointer-events-none shadow-sm"
            >
              {/* Playhead Arrow Top Cap */}
              <div className="w-3.5 h-3.5 bg-red-500 -translate-x-[6px] -translate-y-1 rotate-45 rounded-xs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
