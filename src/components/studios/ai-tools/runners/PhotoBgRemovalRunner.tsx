import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  Brush,
  Eraser,
  Sliders,
  Sparkles,
  Eye,
  Check,
  RotateCcw,
  Layers,
  Download,
} from 'lucide-react';
import { SelectedMediaItem, AIToolResultPayload } from '../../../../types/aiTools';
import { AIToolsProcessor } from '../../../../services/ai/aiToolsProcessor';

interface PhotoBgRemovalRunnerProps {
  media: SelectedMediaItem;
  onPreviewReady: (result: AIToolResultPayload) => void;
  isProcessing: boolean;
}

export const PhotoBgRemovalRunner: React.FC<PhotoBgRemovalRunnerProps> = ({
  media,
  onPreviewReady,
  isProcessing,
}) => {
  const [brushMode, setBrushMode] = useState<'add' | 'remove'>('add');
  const [brushSize, setBrushSize] = useState(24);
  const [feather, setFeather] = useState(3);
  const [edgeRefinement, setEdgeRefinement] = useState(2);
  const [hasRefined, setHasRefined] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Initialize canvas with user image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width || 600;
      canvas.height = img.height || 450;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = media.url;
  }, [media.url]);

  // Handle interactive brush strokes for refining mask
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    drawMaskPoint(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    drawMaskPoint(e);
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      setHasRefined(true);
    }
  };

  const drawMaskPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fillStyle = brushMode === 'add' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    ctx.fill();
    ctx.restore();
  };

  const handleRunCutout = async () => {
    const canvas = canvasRef.current;
    const maskDataUrl = hasRefined && canvas ? canvas.toDataURL('image/png') : null;

    const result = await AIToolsProcessor.processPhotoBgRemoval(media.url, {
      feather,
      edgeRefinement,
      brushMaskDataUrl: maskDataUrl,
    });
    onPreviewReady(result);
  };

  const handleResetMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHasRefined(false);
    };
    img.src = media.url;
  };

  return (
    <div className="space-y-4">
      {/* Interactive refinement controls */}
      <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-rose-500" />
            <span>Subject Detection & Edge Refinement</span>
          </span>

          <div className="flex items-center gap-1 bg-neutral-200/80 dark:bg-neutral-800 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setBrushMode('add')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                brushMode === 'add'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Brush className="w-3 h-3 text-emerald-500" />
              <span>Keep Subject</span>
            </button>
            <button
              onClick={() => setBrushMode('remove')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                brushMode === 'remove'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Eraser className="w-3 h-3 text-rose-500" />
              <span>Erase Background</span>
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Brush Size</span>
              <span className="font-mono">{brushSize}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="72"
              value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Edge Feather</span>
              <span className="font-mono">{feather}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={feather}
              onChange={e => setFeather(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Edge Refinement</span>
              <span className="font-mono">{edgeRefinement}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={edgeRefinement}
              onChange={e => setEdgeRefinement(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>
        </div>
      </div>

      {/* Canvas workspace with transparent checkerboard styling */}
      <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#f3f4f6_0%_50%)] dark:bg-[repeating-conic-gradient(#1e2430_0%_25%,#151922_0%_50%)] bg-[length:16px_16px] min-h-[300px] flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="max-h-[340px] w-auto max-w-full object-contain rounded-lg shadow-lg cursor-crosshair"
          title="Click and drag to refine foreground/background mask"
        />

        {hasRefined && (
          <button
            onClick={handleResetMask}
            className="absolute top-6 right-6 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[11px] hover:bg-black/90 flex items-center gap-1 backdrop-blur-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Strokes</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-neutral-500 text-[11px]">
          Click and brush over canvas to refine subject edges, or run automatic extraction.
        </span>

        <button
          onClick={handleRunCutout}
          disabled={isProcessing}
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate Transparent Cutout</span>
        </button>
      </div>
    </div>
  );
};
