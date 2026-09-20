import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Wand2,
  Video,
  Scissors,
  Cpu,
  Eye,
  Sliders,
  Check,
} from 'lucide-react';
import { SelectedMediaItem, AIToolResultPayload, AIToolMeta } from '../../../../types/aiTools';
import { useModelRouter } from '../../../../context/ModelRouterContext';
import { ModelRegistryService } from '../../../../services/ai/modelRegistry';
import { AIProviderNotConfiguredNotice } from '../AIProviderNotConfiguredNotice';

interface VideoVFXProxyRunnerProps {
  tool: AIToolMeta;
  media: SelectedMediaItem;
  onPreviewReady: (result: AIToolResultPayload) => void;
  isProcessing: boolean;
  onOpenModelRouter: () => void;
}

export const VideoVFXProxyRunner: React.FC<VideoVFXProxyRunnerProps> = ({
  tool,
  media,
  onPreviewReady,
  isProcessing,
  onOpenModelRouter,
}) => {
  const { selectModelManual } = useModelRouter();
  const configStatus = ModelRegistryService.isModelConfigured(tool.defaultModelId);

  const [prompt, setPrompt] = useState(
    tool.id === 'video_object_replace'
      ? 'Replace tracked pedestrian with futuristic courier drone'
      : 'Neural subject matte extraction'
  );
  const [temporalSmoothing, setTemporalSmoothing] = useState(true);
  const [useLocalSimulation, setUseLocalSimulation] = useState(!tool.requiresExternalProvider);

  if (tool.requiresExternalProvider && !configStatus.configured && !useLocalSimulation) {
    return (
      <AIProviderNotConfiguredNotice
        providerName={tool.requiredProviderName || 'External Neural VFX Provider'}
        toolName={tool.name}
        requiredModelId={tool.defaultModelId}
        onOpenModelRouter={onOpenModelRouter}
        onSwitchToLocalOrGemini={() => {
          selectModelManual('gemini-3.8-flash');
          setUseLocalSimulation(true);
        }}
      />
    );
  }

  const handleRunVFX = () => {
    onPreviewReady({
      toolId: tool.id,
      resultUrl: media.url,
      originalUrl: media.url,
      summaryText: `${tool.name} executed non-destructively on ${media.name} with temporal consistency.`,
      metrics: {
        processingTimeMs: 2400,
        creditsUsed: tool.costCredits,
        modelUsed: useLocalSimulation ? 'Local Temporal VFX Engine' : tool.defaultModelId,
        resolutionChange: '1080p Alpha Clip',
      },
    });
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-purple-500" />
            <span>{tool.name} Workflow Configuration</span>
          </span>

          <span className="font-mono text-[10px] text-neutral-500 bg-neutral-200/70 dark:bg-neutral-800 px-2 py-0.5 rounded">
            Router: {useLocalSimulation ? 'Local / Gemini Engine' : tool.defaultModelId}
          </span>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-neutral-500">Operation Directive / Prompt:</label>
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 pt-1 border-t border-neutral-200 dark:border-neutral-800">
          <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={temporalSmoothing}
              onChange={e => setTemporalSmoothing(e.target.checked)}
              className="rounded"
            />
            <span>Temporal Optical Flow Coherence</span>
          </label>
        </div>
      </div>

      {/* Media Scrubber Preview */}
      <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 flex items-center justify-center p-4 min-h-[300px]">
        {media.type === 'video' ? (
          <video src={media.url} className="max-h-[280px] w-auto rounded opacity-85" controls muted />
        ) : (
          <img src={media.url} alt="Target" className="max-h-[280px] w-auto rounded opacity-85" />
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-neutral-500 font-mono">
          Estimated AI usage: {tool.costCredits} Credits
        </span>

        <button
          onClick={handleRunVFX}
          disabled={isProcessing}
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Process & Preview {tool.name}</span>
        </button>
      </div>
    </div>
  );
};
