import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Check,
  FileImage,
  Sparkles,
} from 'lucide-react';
import { PhotoLayer, PhotoAdjustments, PhotoTransform } from '../../../types/photoEditor';

interface PhotoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: PhotoLayer[];
  adjustments: PhotoAdjustments;
  transform: PhotoTransform;
  projectTitle: string;
}

export const PhotoExportModal: React.FC<PhotoExportModalProps> = ({
  isOpen,
  onClose,
  layers,
  adjustments,
  transform,
  projectTitle,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(95);
  const [scaleFactor, setScaleFactor] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const targetWidth = Math.round(transform.canvasWidth * scaleFactor);
  const targetHeight = Math.round(transform.canvasHeight * scaleFactor);

  const handleExecuteExport = () => {
    setIsExporting(true);

    // Render non-destructive layer composite onto an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // Fill background
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply global adjustments as canvas filter
    const exposureVal = 1 + adjustments.exposure / 100;
    const brightnessVal = 1 + adjustments.brightness / 100;
    const contrastVal = 1 + adjustments.contrast / 100;
    const saturationVal = 1 + adjustments.saturation / 100;
    const blurPx = (adjustments.blur / 50) * 10 * scaleFactor;

    ctx.filter = `brightness(${exposureVal * brightnessVal}) contrast(${contrastVal}) saturate(${saturationVal}) blur(${blurPx}px)`;

    // Draw visible image layers
    const visibleLayers = layers.filter(l => l.visible);
    let loadedCount = 0;
    const imageLayers = visibleLayers.filter(l => l.imageUrl);

    const finishExport = () => {
      // Vignette effect if present
      if (adjustments.vignette > 0) {
        ctx.save();
        ctx.filter = 'none';
        const grad = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.25,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.65
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${(adjustments.vignette / 100) * 0.85})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Convert to blob and download
      const mimeType = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
      canvas.toBlob(
        blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectTitle.toLowerCase().replace(/\s+/g, '_')}_master.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setIsExporting(false);
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 2500);
          }
        },
        mimeType,
        quality / 100
      );
    };

    if (imageLayers.length === 0) {
      finishExport();
    } else {
      imageLayers.forEach(l => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.globalAlpha = l.opacity / 100;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          loadedCount++;
          if (loadedCount >= imageLayers.length) {
            finishExport();
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount >= imageLayers.length) {
            finishExport();
          }
        };
        img.src = l.imageUrl!;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#13161c] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
            <Share2 className="w-4 h-4 text-rose-500" />
            <span>Export Master Photo</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Format Selection */}
          <div className="space-y-1.5">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Image Format</span>
            <div className="grid grid-cols-3 gap-2">
              {(['png', 'jpeg', 'webp'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 rounded-lg border font-mono uppercase font-semibold text-center transition-all ${
                    format === fmt
                      ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Scale / Resolution */}
          <div className="space-y-1.5">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Resolution Scale</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { factor: 1, label: '1x (Native)' },
                { factor: 1.5, label: '1.5x (QHD)' },
                { factor: 2, label: '2x (Ultra)' },
              ].map(res => (
                <button
                  key={res.factor}
                  onClick={() => setScaleFactor(res.factor)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                    scaleFactor === res.factor
                      ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>
            <div className="text-[11px] font-mono text-neutral-500 pt-1">
              Final Dimensions: {targetWidth} × {targetHeight} px
            </div>
          </div>

          {/* Quality Slider (for JPEG / WebP) */}
          {format !== 'png' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Compression Quality</span>
                <span className="font-mono">{quality}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={100}
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Export Status / Offline Info */}
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-neutral-600 dark:text-neutral-400 text-[11px]">
            <FileImage className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Renders locally in high fidelity directly on your browser GPU without server lag.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2 bg-neutral-50/50 dark:bg-neutral-900/30">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-lg hover:opacity-90 flex items-center gap-1.5 transition-opacity disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Downloaded!</span>
              </>
            ) : isExporting ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
