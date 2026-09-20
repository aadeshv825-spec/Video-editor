import React from 'react';
import {
  ArrowLeft,
  Music,
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Upload,
  FolderPlus,
  History,
  Share2,
  Sliders,
  Sparkles,
  ListMusic,
  Volume2,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { AudioEditorTab } from '../../../types/audioEditor';

interface AudioToolbarProps {
  projectTitle: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  currentTimeSec: number;
  totalDurationSec: number;
  activeTab: AudioEditorTab;
  onSelectTab: (tab: AudioEditorTab) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  hasSelectedClip: boolean;
  onSplitClip: () => void;
  onDuplicateClip: () => void;
  onDeleteClip: () => void;
  onBack: () => void;
  onOpenVersions: () => void;
  onOpenMedia: () => void;
  onOpenExport: () => void;
  onImportAudio: () => void;
  onOpenQualityChecker?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

// Format seconds into MM:SS.mmm
const formatTimecode = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 1000);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

export const AudioToolbar: React.FC<AudioToolbarProps> = ({
  projectTitle,
  isPlaying,
  onTogglePlay,
  onStop,
  currentTimeSec,
  totalDurationSec,
  activeTab,
  onSelectTab,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  hasSelectedClip,
  onSplitClip,
  onDuplicateClip,
  onDeleteClip,
  onBack,
  onOpenVersions,
  onOpenMedia,
  onOpenExport,
  onImportAudio,
  onOpenQualityChecker,
  isFocusMode,
  onToggleFocusMode,
}) => {
  const tabs: { id: AudioEditorTab; label: string; icon: any }[] = [
    { id: 'timeline', label: 'Timeline Tracks', icon: ListMusic },
    { id: 'inspector', label: 'Clip Inspector', icon: Volume2 },
    { id: 'mixer', label: 'Mixer & 3-Band EQ', icon: Sliders },
    { id: 'ai_prep', label: 'AI Audio Lab', icon: Sparkles },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="flex md:hidden h-12 px-3 border-b border-neutral-200 dark:border-neutral-800 items-center justify-between bg-white dark:bg-[#111318] text-xs shrink-0 select-none z-30">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg active:scale-95"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 min-w-0 font-bold text-neutral-900 dark:text-neutral-100">
            <Music className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="truncate max-w-[120px] font-semibold text-xs">{projectTitle || 'Audio Studio'}</span>
          </div>
        </div>

        {/* Play/Pause & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded-lg font-bold flex items-center gap-1 active:scale-95 transition-all ${
              isPlaying
                ? 'bg-amber-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded-lg active:scale-95"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded-lg active:scale-95"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenVersions}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg active:scale-95"
            title="Snapshots"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenExport}
            className="ml-1 px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* Desktop Professional Top Toolbar */}
      <header className="hidden md:flex h-13 px-4 border-b border-neutral-200 dark:border-neutral-800 items-center justify-between bg-white dark:bg-[#111318] text-xs shrink-0 select-none z-30">
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <div className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100">
            <Music className="w-4 h-4 text-emerald-500" />
            <span className="truncate max-w-[200px] font-semibold">{projectTitle || 'Audio Studio'}</span>
          </div>

          {/* Transport & SMPTE Timecode */}
          <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 font-mono text-[11px]">
            <button
              onClick={onTogglePlay}
              className={`p-1 rounded transition-colors ${
                isPlaying
                  ? 'bg-amber-500 text-white'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={onStop}
              className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded"
              title="Rewind to start"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <span className="text-neutral-900 dark:text-neutral-100 font-semibold ml-1">
              {formatTimecode(currentTimeSec)}
            </span>
            <span className="text-neutral-400 dark:text-neutral-500">
              / {formatTimecode(totalDurationSec)}
            </span>
          </div>
        </div>

        {/* Center: Clean Workspace Mode Switcher */}
        <nav className="flex items-center bg-neutral-100 dark:bg-neutral-900/80 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 overflow-x-auto max-w-full">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${t.id === 'ai_prep' && isActive ? 'text-amber-500' : ''}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Clip operations, Undo/Redo & Export */}
        <div className="flex items-center gap-2">
          {/* Quick Edit Actions (Split, Duplicate, Delete) */}
          <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-md p-0.5 bg-neutral-50 dark:bg-neutral-900/50">
            <button
              onClick={onSplitClip}
              disabled={!hasSelectedClip}
              className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded"
              title="Split Clip at Playhead (S)"
            >
              <Scissors className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDuplicateClip}
              disabled={!hasSelectedClip}
              className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded"
              title="Duplicate Clip (D)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDeleteClip}
              disabled={!hasSelectedClip}
              className="p-1 text-red-500 hover:text-red-700 disabled:opacity-30 rounded"
              title="Delete Clip (Backspace)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-md p-0.5 bg-neutral-50 dark:bg-neutral-900/50">
            <button
              disabled={!canUndo}
              onClick={onUndo}
              className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded transition-colors"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!canRedo}
              onClick={onRedo}
              className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded transition-colors"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom */}
          <div className="hidden lg:flex items-center border border-neutral-200 dark:border-neutral-800 rounded-md p-0.5 bg-neutral-50 dark:bg-neutral-900/50">
            <button
              onClick={() => onZoomChange(Math.max(20, zoom - 10))}
              className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onZoomChange(Math.min(150, zoom + 10))}
              className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Import Audio */}
          <button
            onClick={onImportAudio}
            className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
            title="Import audio track or stem"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          {/* Media / Stems */}
          <button
            onClick={onOpenMedia}
            className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
            title="Media Bin"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Stems</span>
          </button>

          {/* Snapshots */}
          <button
            onClick={onOpenVersions}
            className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
            title="Project Snapshots"
          >
            <History className="w-3.5 h-3.5" />
            <span>Snapshots</span>
          </button>

          {/* Quality Check */}
          {onOpenQualityChecker && (
            <button
              onClick={onOpenQualityChecker}
              className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
              title="Inspect audio for clipping, phase issues, and silence"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Quality Check</span>
            </button>
          )}

          {/* Focus Mode Button */}
          {onToggleFocusMode && (
            <button
              id="audio-focus-mode-btn"
              onClick={onToggleFocusMode}
              className={`px-2.5 py-1 rounded border text-[11px] flex items-center gap-1.5 transition-colors ${
                isFocusMode
                  ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title="Focus Mode: Hide side panels for immersive multi-track audio editing (Press F)"
            >
              {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFocusMode ? 'Exit Focus' : 'Focus Mode'}</span>
              <kbd className={`font-mono text-[9px] px-1 rounded ${isFocusMode ? 'bg-blue-700 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                F
              </kbd>
            </button>
          )}

          {/* Export Master */}
          <button
            onClick={onOpenExport}
            className="px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-md hover:opacity-90 flex items-center gap-1.5 transition-opacity shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Export Bus</span>
          </button>
        </div>
      </header>
    </>
  );
};
