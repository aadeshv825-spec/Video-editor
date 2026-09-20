import React from 'react';
import {
  Scissors,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  Magnet,
  Plus,
  ZoomIn,
  ZoomOut,
  Type,
  Maximize,
  ArrowLeftRight,
  MoveLeft,
  MoveRight,
  Sparkles,
  Layers,
  Bookmark,
  MousePointer,
  Split,
  Move,
  Rows,
} from 'lucide-react';

interface TimelineToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  snappingEnabled: boolean;
  rippleDeleteEnabled: boolean;
  hasSelectedClip: boolean;
  zoomPxPerSec: number;
  trackHeight?: 'compact' | 'standard' | 'expanded';
  activeEditTool?: 'select' | 'split' | 'slip' | 'slide' | 'ripple';
  onUndo: () => void;
  onRedo: () => void;
  onSplitAtPlayhead: () => void;
  onTrimInToPlayhead: () => void;
  onTrimOutToPlayhead: () => void;
  onDeleteSelected: () => void;
  onRippleDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onToggleSnapping: () => void;
  onToggleRippleDelete: () => void;
  onAddTextClip: () => void;
  onAddVideoTrack: () => void;
  onAddAudioTrack: () => void;
  onAddAdjustmentLayer?: () => void;
  onCreateCompoundClip?: () => void;
  onAddMarker?: () => void;
  onChangeZoom: (newZoom: number) => void;
  onFitZoomToScreen: () => void;
  onChangeTrackHeight?: (height: 'compact' | 'standard' | 'expanded') => void;
  onChangeEditTool?: (tool: 'select' | 'split' | 'slip' | 'slide' | 'ripple') => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  canUndo,
  canRedo,
  snappingEnabled,
  rippleDeleteEnabled,
  hasSelectedClip,
  zoomPxPerSec,
  trackHeight = 'standard',
  activeEditTool = 'select',
  onUndo,
  onRedo,
  onSplitAtPlayhead,
  onTrimInToPlayhead,
  onTrimOutToPlayhead,
  onDeleteSelected,
  onRippleDeleteSelected,
  onDuplicateSelected,
  onToggleSnapping,
  onToggleRippleDelete,
  onAddTextClip,
  onAddVideoTrack,
  onAddAudioTrack,
  onAddAdjustmentLayer,
  onCreateCompoundClip,
  onAddMarker,
  onChangeZoom,
  onFitZoomToScreen,
  onChangeTrackHeight,
  onChangeEditTool,
}) => {
  return (
    <div
      id="timeline-toolbar"
      className="h-10 px-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#13161c] flex items-center justify-between text-xs shrink-0 select-none overflow-x-auto scrollbar-none gap-2"
    >
      {/* Left: Edit Mode Selection & Razor/Trim Tools */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Tool Modes: Select (V), Split (C), Slip (Y), Slide (U) */}
        {onChangeEditTool && (
          <div className="flex items-center p-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800/70 border border-neutral-300 dark:border-neutral-700">
            <button
              onClick={() => onChangeEditTool('select')}
              className={`p-1 rounded text-[11px] flex items-center gap-1 ${
                activeEditTool === 'select'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Selection Tool (V)"
            >
              <MousePointer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeEditTool('split')}
              className={`p-1 rounded text-[11px] flex items-center gap-1 ${
                activeEditTool === 'split'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Razor Cut Tool (C)"
            >
              <Scissors className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeEditTool('slip')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                activeEditTool === 'slip'
                  ? 'bg-white dark:bg-neutral-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Slip Edit Tool (Shift In/Out contents without moving clip)"
            >
              SLIP
            </button>
            <button
              onClick={() => onChangeEditTool('slide')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                activeEditTool === 'slide'
                  ? 'bg-white dark:bg-neutral-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Slide Edit Tool (Slide clip while trimming adjacent neighbors)"
            >
              SLIDE
            </button>
          </div>
        )}

        {/* Split at playhead */}
        <button
          onClick={onSplitAtPlayhead}
          disabled={!hasSelectedClip}
          className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-750 disabled:opacity-40 flex items-center gap-1 shadow-2xs font-medium"
          title="Split clip at playhead (S or C)"
        >
          <Scissors className="w-3 h-3 text-neutral-700 dark:text-neutral-300" />
          <span>Split</span>
        </button>

        {/* Trim In/Out at playhead */}
        <button
          onClick={onTrimInToPlayhead}
          disabled={!hasSelectedClip}
          className="p-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
          title="Trim Start to Playhead ([)"
        >
          <MoveRight className="w-3 h-3" />
        </button>

        <button
          onClick={onTrimOutToPlayhead}
          disabled={!hasSelectedClip}
          className="p-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
          title="Trim End to Playhead (])"
        >
          <MoveLeft className="w-3 h-3" />
        </button>

        {/* Duplicate */}
        <button
          onClick={onDuplicateSelected}
          disabled={!hasSelectedClip}
          className="p-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
          title="Duplicate selected clip (D)"
        >
          <Copy className="w-3 h-3" />
        </button>

        {/* Delete */}
        <button
          onClick={onDeleteSelected}
          disabled={!hasSelectedClip}
          className="p-1 rounded border border-neutral-200 dark:border-neutral-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30"
          title="Delete selected clip (Delete)"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        {/* Ripple Delete */}
        <button
          onClick={onRippleDeleteSelected}
          disabled={!hasSelectedClip}
          className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
            rippleDeleteEnabled
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent font-medium'
              : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          } disabled:opacity-30`}
          title="Ripple Delete: remove clip and shift subsequent clips left"
        >
          <ArrowLeftRight className="w-3 h-3" />
          <span>Ripple</span>
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

        {/* Add Marker */}
        {onAddMarker && (
          <button
            onClick={onAddMarker}
            className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 text-[11px]"
            title="Add timeline marker at playhead (M)"
          >
            <Bookmark className="w-3 h-3 text-cyan-500" />
            <span>Marker</span>
          </button>
        )}

        {/* Add Adjustment Layer */}
        {onAddAdjustmentLayer && (
          <button
            onClick={onAddAdjustmentLayer}
            className="px-2 py-1 rounded border border-purple-200 dark:border-purple-800/60 bg-purple-500/10 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 flex items-center gap-1 text-[11px] font-medium transition-colors"
            title="Add Adjustment Layer (affects all underlying clips)"
          >
            <Sparkles className="w-3 h-3" />
            <span>+ Adj Layer</span>
          </button>
        )}

        {/* Create Compound Clip */}
        {onCreateCompoundClip && (
          <button
            onClick={onCreateCompoundClip}
            disabled={!hasSelectedClip}
            className="px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800/60 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20 flex items-center gap-1 text-[11px] font-medium transition-colors disabled:opacity-40"
            title="Nest selected clip(s) into a Compound Clip"
          >
            <Layers className="w-3 h-3" />
            <span>Compound</span>
          </button>
        )}

        {/* Add Text overlay */}
        <button
          onClick={onAddTextClip}
          className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 text-[11px]"
          title="Add Text overlay at playhead"
        >
          <Type className="w-3 h-3 text-amber-500" />
          <span>+ Text</span>
        </button>

        {/* Track addition */}
        <button
          onClick={onAddVideoTrack}
          className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 text-[11px]"
          title="Add new Video Track"
        >
          <Plus className="w-3 h-3" />
          <span>+ Video</span>
        </button>

        <button
          onClick={onAddAudioTrack}
          className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 text-[11px]"
          title="Add new Audio Track"
        >
          <Plus className="w-3 h-3" />
          <span>+ Audio</span>
        </button>
      </div>

      {/* Right: Snapping, Track Height & Zoom Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Track Height Toggle */}
        {onChangeTrackHeight && (
          <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded p-0.5">
            {(['compact', 'standard', 'expanded'] as const).map(h => (
              <button
                key={h}
                onClick={() => onChangeTrackHeight(h)}
                className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${
                  trackHeight === h
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium'
                    : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title={`Track Height: ${h}`}
              >
                {h[0].toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Snapping Magnet */}
        <button
          onClick={onToggleSnapping}
          className={`p-1.5 rounded border transition-colors ${
            snappingEnabled
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
              : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title={snappingEnabled ? 'Snapping ON (N)' : 'Snapping OFF (N)'}
        >
          <Magnet className="w-3 h-3" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="w-3 h-3" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="w-3 h-3" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeZoom(Math.max(15, zoomPxPerSec - 15))}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            title="Zoom out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>

          <span className="font-mono text-[10px] text-neutral-400 w-8 text-center">
            {Math.round(zoomPxPerSec)}%
          </span>

          <button
            onClick={() => onChangeZoom(Math.min(150, zoomPxPerSec + 15))}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            title="Zoom in"
          >
            <ZoomIn className="w-3 h-3" />
          </button>

          <button
            onClick={onFitZoomToScreen}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 ml-0.5"
            title="Fit timeline to window"
          >
            <Maximize className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
