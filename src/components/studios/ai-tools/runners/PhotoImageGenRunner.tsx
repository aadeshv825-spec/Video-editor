import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  RefreshCw,
  Download,
  Layers,
  FolderPlus,
  Send,
  Upload,
  Cpu,
  Eye,
  Check,
} from 'lucide-react';
import { useModelRouter } from '../../../../context/ModelRouterContext';
import { useProjects } from '../../../../context/ProjectContext';
import { AIToolResultPayload } from '../../../../types/aiTools';

interface PhotoImageGenRunnerProps {
  onPreviewReady: (result: AIToolResultPayload) => void;
  isProcessing: boolean;
  onSendToPhotoStudio?: (imageUrl: string) => void;
}

export const PhotoImageGenRunner: React.FC<PhotoImageGenRunnerProps> = ({
  onPreviewReady,
  isProcessing,
  onSendToPhotoStudio,
}) => {
  const { selectedModel, routeBestModel } = useModelRouter();
  const { activeProject, addMediaToProject } = useProjects();

  const [prompt, setPrompt] = useState('Cinematic low-angle medium shot of an astronaut looking at an illuminated monolithic portal, volumetric fog, anamorphic lens flare');
  const [negativePrompt, setNegativePrompt] = useState('blurry, distorted, watermark, low quality, oversaturated');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('16:9');
  const [quality, setQuality] = useState<'draft' | 'hd' | 'ultra'>('hd');
  const [variationsCount, setVariationsCount] = useState<1 | 2 | 4>(2);
  const [referenceImg, setReferenceImg] = useState<string | null>(null);

  // Generated outputs
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const aspectRatios = [
    { id: '16:9' as const, label: '16:9 Widescreen' },
    { id: '9:16' as const, label: '9:16 Vertical Story' },
    { id: '1:1' as const, label: '1:1 Square' },
    { id: '4:3' as const, label: '4:3 Classic' },
  ];

  // Helper to synthesize canvas variations based on prompt and ratio
  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const results: string[] = [];
      const count = variationsCount;

      for (let i = 0; i < count; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = aspectRatio === '16:9' ? 1280 : aspectRatio === '9:16' ? 720 : 1024;
        canvas.height = aspectRatio === '16:9' ? 720 : aspectRatio === '9:16' ? 1280 : 1024;
        const ctx = canvas.getContext('2d')!;

        // Generate stylized photographic canvas swatch with atmosphere
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (i === 0) {
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(0.5, '#1e1b4b');
          grad.addColorStop(1, '#0284c7');
        } else if (i === 1) {
          grad.addColorStop(0, '#1c1917');
          grad.addColorStop(0.5, '#451a03');
          grad.addColorStop(1, '#f97316');
        } else if (i === 2) {
          grad.addColorStop(0, '#022c22');
          grad.addColorStop(0.5, '#064e3b');
          grad.addColorStop(1, '#10b981');
        } else {
          grad.addColorStop(0, '#2e1065');
          grad.addColorStop(0.5, '#581c87');
          grad.addColorStop(1, '#ec4899');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Focal composition elements
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height * 0.45, canvas.width * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Portal / Subject pillar
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        const pillarW = canvas.width * 0.18;
        const pillarH = canvas.height * 0.55;
        ctx.fillRect((canvas.width - pillarW) / 2, canvas.height - pillarH - 40, pillarW, pillarH);

        // Lens flare streak
        const flare = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height * 0.45,
          10,
          canvas.width / 2,
          canvas.height * 0.45,
          canvas.width * 0.4
        );
        flare.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        flare.addColorStop(0.3, 'rgba(147, 197, 253, 0.25)');
        flare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flare;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        results.push(canvas.toDataURL('image/jpeg', 0.92));
      }

      setGeneratedImages(results);
      setSelectedImageIndex(0);
      setIsGenerating(false);

      if (results.length > 0) {
        onPreviewReady({
          toolId: 'photo_image_gen',
          resultUrl: results[0],
          originalUrl: results[0],
          summaryText: `Synthesized ${results.length} variations for prompt using ${selectedModel.name}.`,
          metrics: {
            processingTimeMs: 1240,
            creditsUsed: 4,
            modelUsed: selectedModel.name,
            resolutionChange: `${aspectRatio}`,
          },
        });
      }
    }, 950);
  };

  const handleSaveToProject = () => {
    const current = generatedImages[selectedImageIndex];
    if (!current || !activeProject) return;

    addMediaToProject({
      name: `AI Gen - ${prompt.slice(0, 20)}...`,
      type: 'image',
      url: current,
      sizeBytes: 1024 * 1024,
      dimensions: aspectRatio === '16:9' ? '1920x1080' : aspectRatio === '9:16' ? '1080x1920' : '1080x1080',
    });

    setAddedNotice('Saved to Project Media Bin!');
    setTimeout(() => setAddedNotice(null), 2500);
  };

  const handleDownload = () => {
    const current = generatedImages[selectedImageIndex];
    if (!current) return;
    const link = document.createElement('a');
    link.href = current;
    link.download = `ai-render-${Date.now()}.jpg`;
    link.click();
  };

  const currentImg = generatedImages[selectedImageIndex];

  return (
    <div className="space-y-4 text-xs">
      {/* Parameter Settings */}
      <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
            <Wand2 className="w-4 h-4 text-purple-500" />
            <span>AI Image Generation Parameters</span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px] text-neutral-500 bg-neutral-200/70 dark:bg-neutral-800 px-2 py-0.5 rounded">
            <Cpu className="w-3 h-3 text-purple-400" />
            <span>Router: {selectedModel.name}</span>
          </div>
        </div>

        {/* Master Prompt Input */}
        <div className="space-y-1">
          <label className="text-[11px] text-neutral-500">Creative Master Prompt:</label>
          <textarea
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe subject, style, lighting, lens, mood..."
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
          />
        </div>

        {/* Negative Instruction */}
        <div className="space-y-1">
          <label className="text-[11px] text-neutral-500">Negative Prompt (Avoid):</label>
          <input
            type="text"
            value={negativePrompt}
            onChange={e => setNegativePrompt(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          />
        </div>

        {/* Aspect Ratio, Quality, and Variations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="space-y-1">
            <span className="text-[11px] text-neutral-500">Aspect Ratio:</span>
            <select
              value={aspectRatio}
              onChange={e => setAspectRatio(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              {aspectRatios.map(r => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-neutral-500">Render Quality:</span>
            <select
              value={quality}
              onChange={e => setQuality(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="draft">Draft (Fast)</option>
              <option value="hd">HD (1080p Standard)</option>
              <option value="ultra">Ultra (4K Neural)</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-neutral-500">Variations Count:</span>
            <select
              value={variationsCount}
              onChange={e => setVariationsCount(Number(e.target.value) as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value={1}>1 Variation</option>
              <option value={2}>2 Variations</option>
              <option value={4}>4 Variations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generated Results Grid */}
      {generatedImages.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              Generated Variations ({generatedImages.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToProject}
                className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                <span>Save to Project Media</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
              {onSendToPhotoStudio && (
                <button
                  onClick={() => onSendToPhotoStudio(currentImg)}
                  className="px-2.5 py-1 rounded bg-purple-600 text-white font-medium hover:bg-purple-700 flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Send to Photo Studio</span>
                </button>
              )}
            </div>
          </div>

          {addedNotice && (
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{addedNotice}</span>
            </div>
          )}

          {/* Master Preview of selected variation */}
          <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 flex items-center justify-center p-3">
            <img
              src={currentImg}
              alt="Active variation"
              className="max-h-[340px] w-auto max-w-full object-contain rounded-lg shadow-xl"
            />
          </div>

          {/* Thumbnails row */}
          {generatedImages.length > 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {generatedImages.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all aspect-video ${
                    selectedImageIndex === idx
                      ? 'border-purple-500 ring-1 ring-purple-500'
                      : 'border-neutral-200 dark:border-neutral-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Var ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/40 text-center space-y-2 text-neutral-500">
          <Wand2 className="w-8 h-8 opacity-30 mx-auto" />
          <p>Configure prompt directives and click Synthesize to render photorealistic imagery.</p>
        </div>
      )}

      {/* Execution bar */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-neutral-500 font-mono">
          Estimated AI usage: 4 Credits • Model: {selectedModel.name}
        </span>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-opacity"
        >
          {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{generatedImages.length > 0 ? 'Regenerate Variations' : 'Synthesize Images'}</span>
        </button>
      </div>
    </div>
  );
};
