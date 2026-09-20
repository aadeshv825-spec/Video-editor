import React from 'react';
import {
  ArrowLeft,
  Image as ImageIcon,
  Sliders,
  Crop,
  Layers,
  PenTool,
  Sparkles,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Share2,
  History,
  FolderPlus,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { PhotoToolType } from '../../../types/photoEditor';

interface PhotoToolbarProps {
  projectTitle: string;
  canvasSize: { width: number; height: number };
  activeTool: PhotoToolType;
  onSelectTool: (tool: PhotoToolType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onBack: () => void;
  onOpenVersions: () => void;
  onOpenMedia: () => void;
  onOpenExport: () => void;
  onImportImage: () => void;
  onOpenQualityChecker?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const PhotoToolbar: React.FC<PhotoToolbarProps> = ({
  projectTitle,
  canvasSize,
  activeTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onBack,
  onOpenVersions,
  onOpenMedia,
  onOpenExport,
  onImportImage,
  onOpenQualityChecker,
  isFocusMode,
  onToggleFocusMode,
}) => {
  const toolModes = [
    { id: 'adjust' as PhotoToolType, label: 'Adjust', icon: Sliders },
    { id: 'crop' as PhotoToolType, label: 'Crop & Transform', icon: Crop },
    { id: 'select' as PhotoToolType, label: 'Layers', icon: Layers },
    { id: 'brush' as PhotoToolType, label: 'Draw & Text', icon: PenTool },
    { id: 'ai_prep' as PhotoToolType, label: 'AI Tools', icon: Sparkles },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="flex md:hidden h-12 px-3 border-b border-neutral-200 dark:border-neutral-800 items-center justify-between bg-white dark:bg-[#111318] text-xs shrink-0 select-none z-30">
        <div className="flex items-center gap-2 min-w-0">
          <button
            id="photo-back-btn-mobile"
            onClick={onBack}
            className="p-1.5 -ml-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg active:scale-95"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 min-w-0 font-bold text-neutral-900 dark:text-neutral-100">
            <ImageIcon className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate max-w-[130px] font-semibold text-xs">{projectTitle || 'Photo Studio'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            id="photo-undo-btn-mobile"
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded-lg active:scale-95"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            id="photo-redo-btn-mobile"
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded-lg active:scale-95"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            id="photo-snapshots-btn-mobile"
            onClick={onOpenVersions}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg active:scale-95"
            title="Snapshots"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            id="photo-export-btn-mobile"
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
        {/* Left: Navigation & Project Badge */}
        <div className="flex items-center gap-3">
          <button
            id="photo-back-btn"
            onClick={onBack}
            className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <div className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100">
            <ImageIcon className="w-4 h-4 text-rose-500" />
            <span className="truncate max-w-[200px] font-semibold">{projectTitle || 'Photo Studio'}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            {canvasSize.width}×{canvasSize.height}
          </span>
        </div>

        {/* Center: Clean Tool Mode Switcher */}
        <nav className="flex items-center bg-neutral-100 dark:bg-neutral-900/80 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 overflow-x-auto max-w-full">
          {toolModes.map(m => {
            const Icon = m.icon;
            const isActive =
              m.id === activeTool ||
              (m.id === 'select' && activeTool === 'select') ||
              (m.id === 'brush' && (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'shape' || activeTool === 'text')) ||
              (m.id === 'crop' && (activeTool === 'crop' || activeTool === 'transform'));

            return (
              <button
                key={m.id}
                id={`photo-tool-tab-${m.id}`}
                onClick={() => onSelectTool(m.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${m.id === 'ai_prep' && isActive ? 'text-amber-500' : ''}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions, Zoom, Undo/Redo & Export */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-md p-0.5 bg-neutral-50 dark:bg-neutral-900/50">
            <button
              id="photo-undo-btn"
              disabled={!canUndo}
              onClick={onUndo}
              className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="photo-redo-btn"
              disabled={!canRedo}
              onClick={onRedo}
              className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-md p-0.5 bg-neutral-50 dark:bg-neutral-900/50">
            <button
              onClick={() => onZoomChange(Math.max(25, zoom - 15))}
              className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-neutral-600 dark:text-neutral-300 w-10 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => onZoomChange(Math.min(300, zoom + 15))}
              className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onZoomChange(100)}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 border-l border-neutral-200 dark:border-neutral-800 pl-1"
              title="Reset Zoom to 100%"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Import Image */}
          <button
            id="photo-import-btn"
            onClick={onImportImage}
            className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
            title="Import or replace photo"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          {/* Media Bin */}
          <button
            id="photo-assets-btn"
            onClick={onOpenMedia}
            className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
            title="Project Media Bin"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Assets</span>
          </button>

          {/* Snapshots / Versions */}
          <button
            id="photo-snapshots-btn"
            onClick={onOpenVersions}
            className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
            title="Version History"
          >
            <History className="w-3.5 h-3.5" />
            <span>Snapshots</span>
          </button>

          {/* Quality Check */}
          {onOpenQualityChecker && (
            <button
              id="photo-quality-check-btn"
              onClick={onOpenQualityChecker}
              className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
              title="Inspect photo for clipping, sharpness, and metadata"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Quality Check</span>
            </button>
          )}

          {/* Focus Mode Button */}
          {onToggleFocusMode && (
            <button
              id="photo-focus-mode-btn"
              onClick={onToggleFocusMode}
              className={`px-2.5 py-1 rounded border text-[11px] flex items-center gap-1.5 transition-colors ${
                isFocusMode
                  ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title="Focus Mode: Hide side panels for immersive photo editing (Press F)"
            >
              {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFocusMode ? 'Exit Focus' : 'Focus Mode'}</span>
              <kbd className={`font-mono text-[9px] px-1 rounded ${isFocusMode ? 'bg-blue-700 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                F
              </kbd>
            </button>
          )}

          {/* Export Button */}
          <button
            id="photo-export-btn"
            onClick={onOpenExport}
            className="px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-md hover:opacity-90 flex items-center gap-1.5 transition-opacity shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>
    </>
  );
};
