import React, { useState, useRef, useEffect } from 'react';
import {
  Eraser,
  Brush,
  RotateCcw,
  Sparkles,
  Undo2,
  Redo2,
  Eye,
  Info,
} from 'lucide-react';
import { SelectedMediaItem, AIToolResultPayload } from '../../../../types/aiTools';
import { AIToolsProcessor } from '../../../../services/ai/aiToolsProcessor';

interface PhotoObjectRemovalRunnerProps {
  media: SelectedMediaItem;
  onPreviewReady: (result: AIToolResultPayload) => void;
  isProcessing: boolean;
}

export const PhotoObjectRemovalRunner: React.FC<PhotoObjectRemovalRunnerProps> = ({
  media,
  onPreviewReady,
  isProcessing,
}) => {
  const [brushSize, setBrushSize] = useState(28);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [redoHistory, setRedoHistory] = useState<ImageData[]>([]);
  const [hasMask, setHasMask] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width || 640;
      canvas.height = img.height || 480;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Mask canvas setup
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      maskCanvasRef.current = maskCanvas;

      // Save base image snapshot
      setStrokeHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    };
    img.src = media.url;
  }, [media.url]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    drawStroke(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    drawStroke(e);
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setStrokeHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        setRedoHistory([]);
        setHasMask(true);
      }
    }
  };

  const drawStroke = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext('2d');
    const mCtx = maskCanvas.getContext('2d');
    if (!ctx || !mCtx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Visual overlay on user canvas (translucent red)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.fill();
    ctx.restore();

    // Actual binary mask
    mCtx.save();
    mCtx.beginPath();
    mCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    mCtx.fillStyle = 'white';
    mCtx.fill();
    mCtx.restore();
  };

  const handleUndo = () => {
    if (strokeHistory.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const current = strokeHistory[strokeHistory.length - 1];
    const previous = strokeHistory[strokeHistory.length - 2];

    setRedoHistory(r => [current, ...r]);
    setStrokeHistory(s => s.slice(0, -1));
    ctx.putImageData(previous, 0, 0);

    if (strokeHistory.length - 1 <= 1) {
      setHasMask(false);
    }
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const next = redoHistory[0];
    setRedoHistory(r => r.slice(1));
    setStrokeHistory(s => [...s, next]);
    ctx.putImageData(next, 0, 0);
    setHasMask(true);
  };

  const handleRunRemoval = async () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskDataUrl = maskCanvas.toDataURL('image/png');

    const result = await AIToolsProcessor.processPhotoObjectRemoval(media.url, maskDataUrl);
    onPreviewReady(result);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Brush tools bar */}
      <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <Eraser className="w-4 h-4 text-rose-500" />
            <span>Object Inpaint Brush</span>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 rounded-md p-0.5 bg-white dark:bg-neutral-800">
            <button
              onClick={handleUndo}
              disabled={strokeHistory.length <= 1}
              className="p-1 rounded text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
              title="Undo stroke"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoHistory.length === 0}
              className="p-1 rounded text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
              title="Redo stroke"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span>Size:</span>
          <input
            type="range"
            min="10"
            max="80"
            value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            className="w-28 accent-neutral-900 dark:accent-white"
          />
          <span className="font-mono text-[11px] w-8">{brushSize}px</span>
        </div>
      </div>

      {/* Drawing Stage */}
      <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 flex items-center justify-center p-4 min-h-[300px]">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="max-h-[360px] w-auto max-w-full object-contain rounded-lg shadow-xl cursor-crosshair"
          title="Brush over the object you want to erase"
        />

        {!hasMask && (
          <div className="absolute top-6 left-6 px-3 py-1.5 rounded-lg bg-black/75 text-white/90 text-[11px] backdrop-blur-xs pointer-events-none flex items-center gap-1.5">
            <Brush className="w-3.5 h-3.5 text-rose-400" />
            <span>Brush red mask over unwanted object to remove</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-neutral-500">
          Content-aware neural synthesis replaces only the painted region.
        </span>

        <button
          onClick={handleRunRemoval}
          disabled={!hasMask || isProcessing}
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Erase Object & Preview</span>
        </button>
      </div>
    </div>
  );
};
