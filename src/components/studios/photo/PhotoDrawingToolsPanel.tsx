import React, { useState } from 'react';
import {
  PenTool,
  Eraser,
  Type,
  Square,
  Circle,
  ArrowRight,
  Minus,
  BoxSelect,
  Palette,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  PhotoToolType,
  PhotoShapeType,
  ShapeElement,
  TextElement,
  SelectionRegion,
} from '../../../types/photoEditor';

interface PhotoDrawingToolsPanelProps {
  activeTool: PhotoToolType;
  onSelectTool: (tool: PhotoToolType) => void;
  brushConfig: {
    color: string;
    size: number;
    opacity: number;
  };
  onChangeBrushConfig: (config: { color: string; size: number; opacity: number }) => void;
  shapeConfig: {
    type: PhotoShapeType;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
  onChangeShapeConfig: (config: {
    type: PhotoShapeType;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  }) => void;
  textConfig: {
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: string;
  };
  onChangeTextConfig: (config: {
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: string;
  }) => void;
  selection: SelectionRegion;
  onChangeSelection: (selection: SelectionRegion) => void;
  onAddShapeToLayer: (shape: ShapeElement) => void;
  onAddTextToLayer: (text: TextElement) => void;
}

const PRESET_COLORS = [
  '#ffffff',
  '#000000',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
];

export const PhotoDrawingToolsPanel: React.FC<PhotoDrawingToolsPanelProps> = ({
  activeTool,
  onSelectTool,
  brushConfig,
  onChangeBrushConfig,
  shapeConfig,
  onChangeShapeConfig,
  textConfig,
  onChangeTextConfig,
  selection,
  onChangeSelection,
  onAddShapeToLayer,
  onAddTextToLayer,
}) => {
  const [newTextContent, setNewTextContent] = useState('Double click to edit');

  const handleCreateShape = (type: PhotoShapeType) => {
    const newShape: ShapeElement = {
      id: `shape-${Date.now()}`,
      type,
      x: 35,
      y: 35,
      width: type === 'line' || type === 'arrow' ? 30 : 25,
      height: type === 'line' || type === 'arrow' ? 0 : 25,
      fillColor: type === 'line' || type === 'arrow' ? 'transparent' : shapeConfig.fillColor,
      strokeColor: shapeConfig.strokeColor,
      strokeWidth: shapeConfig.strokeWidth,
      opacity: 1,
      cornerRadius: type === 'rectangle' ? 4 : 0,
      arrowEnd: type === 'arrow',
    };
    onAddShapeToLayer(newShape);
  };

  const handleCreateText = () => {
    const newText: TextElement = {
      id: `text-${Date.now()}`,
      text: newTextContent.trim() || 'Creative Studio',
      x: 50,
      y: 50,
      fontSize: textConfig.fontSize,
      fontFamily: textConfig.fontFamily,
      color: textConfig.color,
      fontWeight: textConfig.fontWeight,
      textAlign: 'center',
      opacity: 1,
    };
    onAddTextToLayer(newText);
  };

  return (
    <div className="w-full sm:w-80 h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111318] flex flex-col text-xs overflow-y-auto shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
          <PenTool className="w-4 h-4 text-rose-500" />
          <span>Draw, Text & Shape Design</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Tool Mode selector */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onSelectTool('brush')}
            className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
              activeTool === 'brush'
                ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400'
            }`}
            title="Brush Tool"
          >
            <PenTool className="w-4 h-4" />
            <span className="text-[10px]">Brush</span>
          </button>

          <button
            onClick={() => onSelectTool('eraser')}
            className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
              activeTool === 'eraser'
                ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400'
            }`}
            title="Eraser Tool"
          >
            <Eraser className="w-4 h-4" />
            <span className="text-[10px]">Eraser</span>
          </button>

          <button
            onClick={() => onSelectTool('text')}
            className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
              activeTool === 'text'
                ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400'
            }`}
            title="Text Tool"
          >
            <Type className="w-4 h-4" />
            <span className="text-[10px]">Text</span>
          </button>

          <button
            onClick={() => onSelectTool('shape')}
            className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
              activeTool === 'shape'
                ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400'
            }`}
            title="Shapes Tool"
          >
            <Square className="w-4 h-4" />
            <span className="text-[10px]">Shapes</span>
          </button>
        </div>

        {/* Brush & Eraser Properties */}
        {(activeTool === 'brush' || activeTool === 'eraser') && (
          <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {activeTool === 'brush' ? 'Brush Properties' : 'Eraser Properties'}
            </span>

            {/* Size */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Stroke Size</span>
                <span className="font-mono">{brushConfig.size}px</span>
              </div>
              <input
                type="range"
                min={2}
                max={64}
                value={brushConfig.size}
                onChange={e => onChangeBrushConfig({ ...brushConfig, size: Number(e.target.value) })}
                className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Opacity */}
            {activeTool === 'brush' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Opacity</span>
                  <span className="font-mono">{Math.round(brushConfig.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={brushConfig.opacity}
                  onChange={e => onChangeBrushConfig({ ...brushConfig, opacity: Number(e.target.value) })}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Color Palette */}
            {activeTool === 'brush' && (
              <div className="space-y-2">
                <span className="text-neutral-600 dark:text-neutral-400 block">Brush Color</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => onChangeBrushConfig({ ...brushConfig, color: c })}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center transition-transform ${
                        brushConfig.color === c ? 'scale-115 ring-2 ring-blue-500' : 'hover:scale-105'
                      }`}
                    >
                      {brushConfig.color === c && (
                        <Check
                          className={`w-3 h-3 ${c === '#ffffff' || c === '#eab308' ? 'text-black' : 'text-white'}`}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Tool Properties */}
        {activeTool === 'text' && (
          <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              Text Overlay Tool
            </span>

            <div className="space-y-2">
              <span className="text-neutral-600 dark:text-neutral-400 block">Text Content</span>
              <input
                type="text"
                value={newTextContent}
                onChange={e => setNewTextContent(e.target.value)}
                placeholder="Enter text..."
                className="w-full px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-neutral-500 block mb-1">Font Size</span>
                <input
                  type="number"
                  min={12}
                  max={120}
                  value={textConfig.fontSize}
                  onChange={e => onChangeTextConfig({ ...textConfig, fontSize: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-900"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 block mb-1">Font Family</span>
                <select
                  value={textConfig.fontFamily}
                  onChange={e => onChangeTextConfig({ ...textConfig, fontFamily: e.target.value })}
                  className="w-full px-2 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-900 text-xs"
                >
                  <option value="Inter, sans-serif">Modern Sans</option>
                  <option value="serif">Classic Serif</option>
                  <option value="monospace">Screenplay Mono</option>
                  <option value="cursive">Handwritten Script</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateText}
              className="w-full py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Text to Canvas</span>
            </button>
          </div>
        )}

        {/* Shapes Tool Properties */}
        {activeTool === 'shape' && (
          <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              Insert Vector Shape
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCreateShape('rectangle')}
                className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
              >
                <Square className="w-4 h-4 text-blue-500" />
                <span>Rectangle</span>
              </button>
              <button
                onClick={() => handleCreateShape('ellipse')}
                className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
              >
                <Circle className="w-4 h-4 text-purple-500" />
                <span>Circle / Oval</span>
              </button>
              <button
                onClick={() => handleCreateShape('line')}
                className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
              >
                <Minus className="w-4 h-4 text-emerald-500" />
                <span>Straight Line</span>
              </button>
              <button
                onClick={() => handleCreateShape('arrow')}
                className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 text-amber-500" />
                <span>Callout Arrow</span>
              </button>
            </div>
          </div>
        )}

        {/* Selection Tools section */}
        <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <BoxSelect className="w-3.5 h-3.5 text-cyan-500" />
            <span>Selection Tools</span>
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                onChangeSelection({
                  type: 'marquee',
                  x: 20,
                  y: 20,
                  width: 60,
                  height: 60,
                  active: true,
                })
              }
              className="px-2 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left font-medium"
            >
              Rect Marquee
            </button>
            <button
              onClick={() =>
                onChangeSelection({
                  type: 'none',
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0,
                  active: false,
                })
              }
              className="px-2 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left font-medium text-neutral-500"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
