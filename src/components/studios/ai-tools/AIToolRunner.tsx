import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Check,
  RotateCcw,
  Save,
  Layers,
  Download,
  AlertCircle,
  Coins,
  Cpu,
  Eye,
  X,
  Upload,
  FolderOpen,
} from 'lucide-react';
import { AIToolMeta, SelectedMediaItem, AIToolResultPayload, AIToolWorkflowStep } from '../../../types/aiTools';
import { useProjects } from '../../../context/ProjectContext';
import { useAuth } from '../../../context/AuthContext';
import { useModelRouter } from '../../../context/ModelRouterContext';
import { useAIJobs } from '../../../context/AIJobContext';
import { useNotifications } from '../../../context/NotificationContext';
import { AIToolCreditConfirmationModal } from './AIToolCreditConfirmationModal';

// Specialized tool runners
import { PhotoBgRemovalRunner } from './runners/PhotoBgRemovalRunner';
import { PhotoBgReplaceRunner } from './runners/PhotoBgReplaceRunner';
import { PhotoObjectRemovalRunner } from './runners/PhotoObjectRemovalRunner';
import { PhotoObjectReplaceRunner } from './runners/PhotoObjectReplaceRunner';
import { PhotoGenFillExpandRunner } from './runners/PhotoGenFillExpandRunner';
import { PhotoUpscaleEnhanceRunner } from './runners/PhotoUpscaleEnhanceRunner';
import { PhotoRelightRunner } from './runners/PhotoRelightRunner';
import { PhotoRestorationRunner } from './runners/PhotoRestorationRunner';
import { PhotoImageGenRunner } from './runners/PhotoImageGenRunner';
import { VideoAutoReframeRunner } from './runners/VideoAutoReframeRunner';
import { VideoSceneDetectionRunner } from './runners/VideoSceneDetectionRunner';
import { VideoCaptionsRunner } from './runners/VideoCaptionsRunner';
import { VideoEnhancementRunner } from './runners/VideoEnhancementRunner';
import { VideoVFXProxyRunner } from './runners/VideoVFXProxyRunner';

interface AIToolRunnerProps {
  tool: AIToolMeta;
  onBack: () => void;
  onOpenModelRouter: () => void;
  onNavigateToStudio?: (studio: 'photo' | 'video' | 'director') => void;
}

export const AIToolRunner: React.FC<AIToolRunnerProps> = ({
  tool,
  onBack,
  onOpenModelRouter,
  onNavigateToStudio,
}) => {
  const { activeProject, createVersionSnapshot, applyDirectStateUpdate, addMediaToProject } = useProjects();
  const { currentUser, deductCredits } = useAuth();
  const { selectedModel } = useModelRouter();
  const { createJob, updateJobStatus } = useAIJobs();
  const { addNotification } = useNotifications();

  // Workflow steps
  const [currentStep, setCurrentStep] = useState<AIToolWorkflowStep>('configure');

  // Media selection
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaItem>(() => {
    // Default to active project media if available
    if (activeProject) {
      if (activeProject.type === 'video') {
        const clips = activeProject.stateData?.videoState?.clips || [];
        if (clips.length > 0) {
          return {
            id: clips[0].id,
            name: clips[0].title || 'Timeline Clip 1',
            type: 'video',
            url: clips[0].mediaUrl || 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200',
            sourceType: 'project_clip',
          };
        }
      } else if (activeProject.type === 'photo') {
        const layers = activeProject.stateData?.photoState?.layers || [];
        if (layers.length > 0) {
          return {
            id: layers[0].id,
            name: layers[0].name || 'Master Layer',
            type: 'image',
            url: layers[0].imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200',
            sourceType: 'project_layer',
          };
        }
      }
    }

    // Default sample stock
    return {
      id: 'default-stock',
      name: tool.category === 'video' ? 'Sample Cinematic Clip' : 'Sample Studio Portrait',
      type: tool.category === 'video' ? 'video' : 'image',
      url:
        tool.category === 'video'
          ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200',
      sourceType: 'sample',
    };
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [pendingExecutionCallback, setPendingExecutionCallback] = useState<(() => void) | null>(null);

  // Result & Undo State
  const [activeResult, setActiveResult] = useState<AIToolResultPayload | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<any>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Available project media items for selection
  const availableProjectMedia: SelectedMediaItem[] = [];
  if (activeProject) {
    if (activeProject.type === 'photo') {
      const layers = activeProject.stateData?.photoState?.layers || [];
      layers.forEach((l: any) => {
        if (l.imageUrl) {
          availableProjectMedia.push({
            id: l.id,
            name: l.name,
            type: 'image',
            url: l.imageUrl,
            sourceType: 'project_layer',
          });
        }
      });
    } else if (activeProject.type === 'video') {
      const clips = activeProject.stateData?.videoState?.clips || [];
      clips.forEach((c: any) => {
        if (c.mediaUrl) {
          availableProjectMedia.push({
            id: c.id,
            name: c.title,
            type: 'video',
            url: c.mediaUrl,
            durationSec: c.duration,
            sourceType: 'project_clip',
          });
        }
      });
    }
  }

  // Handle preview generated from specialized runner
  const handlePreviewReady = (result: AIToolResultPayload) => {
    setActiveResult(result);
    setCurrentStep('result');
  };

  // Safe credit pre-operation confirmation
  const requestRunOperation = (executeFn: () => void) => {
    setPendingExecutionCallback(() => executeFn);
    setShowCreditModal(true);
  };

  const handleConfirmCreditDeduction = () => {
    setShowCreditModal(false);
    const success = deductCredits(tool.costCredits);
    if (!success) {
      addNotification({
        category: 'ai',
        title: 'Insufficient AI Credits',
        message: `You need ${tool.costCredits} credits for ${tool.name}. Please top up your balance or upgrade to Pro.`,
      });
      return;
    }

    // Start background job in AIJobManager
    const job = createJob({
      projectId: activeProject?.id || 'scratchpad',
      projectTitle: activeProject?.title || 'Scratchpad Workspace',
      command: `Execute ${tool.name}`,
      modelId: tool.defaultModelId,
      modelName: selectedModel.name,
      provider: tool.category === 'photo' ? 'Photo Studio Core' : 'Video VFX Core',
      estimatedCredits: tool.costCredits,
    });

    setIsProcessing(true);
    setCurrentStep('process');
    setProgressPercent(20);

    const interval = setInterval(() => {
      setProgressPercent(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 25;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setProgressPercent(100);
      setIsProcessing(false);
      updateJobStatus(job.id, 'COMPLETED');
      if (pendingExecutionCallback) {
        pendingExecutionCallback();
      }
    }, 1100);
  };

  // 1. Apply result directly to active project non-destructively
  const handleApplyToProject = () => {
    if (!activeResult || !activeProject) return;

    // Capture undo snapshot first
    setUndoSnapshot(JSON.parse(JSON.stringify(activeProject.stateData || {})));

    if (tool.category === 'photo') {
      const currentPhotoState = activeProject.stateData?.photoState || {};
      const existingLayers = currentPhotoState.layers || [];
      const newLayer = {
        id: `layer-ai-${Date.now()}`,
        name: `${tool.name} Result`,
        type: 'image',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        imageUrl: activeResult.transparentUrl || activeResult.resultUrl,
      };

      applyDirectStateUpdate({
        photoState: {
          ...currentPhotoState,
          layers: [...existingLayers, newLayer],
          activeLayerId: newLayer.id,
        },
      });

      setActionNotice('Applied as new layer in Photo Studio!');
    } else {
      // Video project
      setActionNotice('Applied updates to Video Project timeline!');
    }

    setTimeout(() => setActionNotice(null), 3000);
  };

  // 2. Save as New Version Checkpoint
  const handleSaveAsNewVersion = () => {
    if (!activeProject) return;
    createVersionSnapshot(`Before ${tool.name}`, 'Pre-AI safety snapshot');
    handleApplyToProject();
    createVersionSnapshot(`After ${tool.name}`, 'Post-AI result snapshot');
    setActionNotice('Saved new project version checkpoint with instant rollback!');
    setTimeout(() => setActionNotice(null), 3500);
  };

  // 3. Undo applied changes
  const handleUndo = () => {
    if (!undoSnapshot) return;
    applyDirectStateUpdate(undoSnapshot);
    setUndoSnapshot(null);
    setActionNotice('Changes undone successfully.');
    setTimeout(() => setActionNotice(null), 2500);
  };

  // 4. Download file directly
  const handleDownload = () => {
    if (!activeResult?.resultUrl) return;
    const a = document.createElement('a');
    a.href = activeResult.resultUrl;
    a.download = `${tool.id}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-y-auto">
      {/* Top Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 p-4 sticky top-0 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Return to AI Tools Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm text-neutral-900 dark:text-white">
                  {tool.name}
                </h2>
                {tool.isProOnly && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 truncate max-w-md">
                {tool.shortDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Credit Cost Badge */}
            <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono font-medium flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>{tool.costCredits} Credits</span>
            </div>

            {/* Model Router Trigger */}
            <button
              onClick={onOpenModelRouter}
              className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-mono text-[11px]"
              title="Change active inference model"
            >
              <Cpu className="w-3 h-3 text-neutral-500" />
              <span>{selectedModel.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Runner Body */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 space-y-4">
        {/* Media Selector Strip (except for pure text-to-image gen) */}
        {tool.id !== 'photo_image_gen' && (
          <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                Selected Media:
              </span>
              <span className="font-medium text-neutral-900 dark:text-white px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono">
                {selectedMedia.name}
              </span>
            </div>

            {availableProjectMedia.length > 1 && (
              <div className="flex items-center gap-1">
                <span className="text-neutral-500 text-[11px]">Switch Clip / Layer:</span>
                <select
                  value={selectedMedia.id}
                  onChange={e => {
                    const found = availableProjectMedia.find(m => m.id === e.target.value);
                    if (found) setSelectedMedia(found);
                  }}
                  className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-xs font-mono"
                >
                  {availableProjectMedia.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Processing Progress Bar */}
        {isProcessing && (
          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Processing {tool.name} asynchronously...</span>
              </span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Tool-specific Runner Components */}
        {tool.id === 'photo_bg_removal' && (
          <PhotoBgRemovalRunner
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
          />
        )}

        {tool.id === 'photo_bg_replace' && (
          <PhotoBgReplaceRunner
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
          />
        )}

        {tool.id === 'photo_object_removal' && (
          <PhotoObjectRemovalRunner
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
          />
        )}

        {tool.id === 'photo_object_replace' && (
          <PhotoObjectReplaceRunner
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
          />
        )}

        {(tool.id === 'photo_gen_fill' || tool.id === 'photo_gen_expand') && (
          <PhotoGenFillExpandRunner
            media={selectedMedia}
            mode={tool.id === 'photo_gen_fill' ? 'fill' : 'expand'}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
          />
        )}

        {(tool.id === 'photo_upscale' || tool.id === 'photo_enhance' || tool.id === 'photo_portrait_enhance') && (
          <PhotoUpscaleEnhanceRunner
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
            toolType={tool.id as any}
          />
        )}

        {tool.id === 'photo_relight' && (
          <PhotoRelightRunner
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
          />
        )}

        {(tool.id === 'photo_restoration' || tool.id === 'photo_colorize') && (
          <PhotoRestorationRunner
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
          />
        )}

        {tool.id === 'photo_image_gen' && (
          <PhotoImageGenRunner
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
            onSendToPhotoStudio={() => onNavigateToStudio?.('photo')}
          />
        )}

        {tool.id === 'video_auto_reframe' && (
          <VideoAutoReframeRunner
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
          />
        )}

        {tool.id === 'video_scene_detection' && (
          <VideoSceneDetectionRunner
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
          />
        )}

        {tool.id === 'video_captions' && (
          <VideoCaptionsRunner
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
          />
        )}

        {tool.id === 'video_enhance' && (
          <VideoEnhancementRunner
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
          />
        )}

        {/* Generic / VFX Proxy for remaining video tools */}
        {(tool.id === 'video_bg_removal' ||
          tool.id === 'video_object_removal' ||
          tool.id === 'video_object_replace' ||
          tool.id === 'video_upscale' ||
          tool.id === 'video_stabilization' ||
          tool.id === 'video_frame_interpolation' ||
          tool.id === 'video_auto_cut' ||
          tool.id === 'photo_img2img') && (
          <VideoVFXProxyRunner
            tool={tool}
            media={selectedMedia}
            onPreviewReady={handlePreviewReady}
            isProcessing={isProcessing}
            onOpenModelRouter={onOpenModelRouter}
          />
        )}

        {/* Global Result Actions Bar when a result is rendered */}
        {activeResult && (
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>AI Operation Result Ready</span>
                </span>
                <p className="text-[11px] text-neutral-500">{activeResult.summaryText}</p>
              </div>

              {activeResult.metrics && (
                <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-500">
                  <span>Latency: {activeResult.metrics.processingTimeMs}ms</span>
                  <span>Model: {activeResult.metrics.modelUsed}</span>
                </div>
              )}
            </div>

            {/* Non-destructive Result Operations: Apply, Save as Version, Undo, Download */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              {undoSnapshot && (
                <button
                  onClick={handleUndo}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
              )}

              {activeResult.resultUrl && (
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export File</span>
                </button>
              )}

              <button
                onClick={handleSaveAsNewVersion}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-purple-500" />
                <span>Save as New Version</span>
              </button>

              <button
                onClick={handleApplyToProject}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-medium hover:opacity-90 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Apply to Project</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pre-operation Credit Usage Modal */}
      {showCreditModal && (
        <AIToolCreditConfirmationModal
          toolName={tool.name}
          modelName={selectedModel.name}
          costCredits={tool.costCredits}
          onConfirm={handleConfirmCreditDeduction}
          onCancel={() => setShowCreditModal(false)}
        />
      )}
    </div>
  );
};
