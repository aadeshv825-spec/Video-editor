import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Coins,
  Cpu,
  Film,
  Image as ImageIcon,
  Layers,
  Mic,
  Music,
  Plus,
  RotateCw,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Sliders,
  Volume2,
  Wand2,
  AlertCircle,
  WifiOff,
  CheckCircle2,
  ChevronRight,
  Upload,
  Play,
  Share2,
  FolderKanban,
  History,
  Grid,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useProjects } from '../../../context/ProjectContext';
import { useAIJobs } from '../../../context/AIJobContext';
import { useNotifications } from '../../../context/NotificationContext';
import {
  AudioGenerationParams,
  GenerationRecord,
  GenerationTaskType,
  ImageGenerationParams,
  ReferenceSet,
  VideoGenerationParams,
} from '../../../types/aiGeneration';
import { AI_MODEL_REGISTRY, ExtendedAIModel, ModelRegistryService } from '../../../services/ai/modelRegistry';
import { GenerationEngine } from '../../../services/ai/generationEngine';
import { CreditLedgerService } from '../../../services/credits/creditLedgerService';
import { ConfirmCostModal } from './ConfirmCostModal';
import { GenerationPreviewModal } from './GenerationPreviewModal';
import { ModelFallbackModal } from './ModelFallbackModal';
import { ModelHubView } from './ModelHubView';
import { ReferenceSetsManager } from './ReferenceSetsManager';
import { GenerationHistoryView } from './GenerationHistoryView';

interface AIGenerationStudioProps {
  onBack: () => void;
  onOpenModelHub?: () => void;
  onOpenSettings?: () => void;
  onNavigateToStudio?: (studio: 'video' | 'photo' | 'audio' | 'director') => void;
}

type MainTab = 'video' | 'image' | 'audio' | 'references' | 'hub' | 'history';
type VideoSubTab = 'text_to_video' | 'image_to_video' | 'ref_video' | 'v2v' | 'first_last' | 'extend' | 'b_roll' | 'transition';
type ImageSubTab = 'text_to_image' | 'variations' | 'ref_controls';
type AudioSubTab = 'tts' | 'sfx' | 'music';
type RouterMode = 'AUTO' | 'FAST' | 'BALANCED' | 'QUALITY' | 'MANUAL';

export const AIGenerationStudio: React.FC<AIGenerationStudioProps> = ({
  onBack,
  onOpenSettings,
  onNavigateToStudio,
}) => {
  const { currentUser, isPro, isOwner, canAccessTool, deductCredits } = useAuth();
  const { activeProject, addMediaToProject } = useProjects();
  const { createJob, updateJobStatus } = useAIJobs();
  const { addNotification } = useNotifications();

  // Navigation state
  const [activeTab, setActiveTab] = useState<MainTab>('video');
  const [videoSubTab, setVideoSubTab] = useState<VideoSubTab>('text_to_video');
  const [imageSubTab, setImageSubTab] = useState<ImageSubTab>('text_to_image');
  const [audioSubTab, setAudioSubTab] = useState<AudioSubTab>('tts');
  const [routerMode, setRouterMode] = useState<RouterMode>('AUTO');

  // Network offline state detection
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Form parameters state
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
  const [durationSec, setDurationSec] = useState<number>(5);
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [quality, setQuality] = useState<'draft' | 'standard' | 'high' | 'ultra'>('high');
  const [motionStrength, setMotionStrength] = useState<number>(5);
  const [cameraMotion, setCameraMotion] = useState('Slow cinematic push-in dolly');

  // Image inputs & references
  const [sourceImageUrl, setSourceImageUrl] = useState('');
  const [sourceVideoUrl, setSourceVideoUrl] = useState('');
  const [v2vMode, setV2vMode] = useState<'inspired_by_reference' | 'edit_preserve_scene'>('edit_preserve_scene');
  const [firstFrameUrl, setFirstFrameUrl] = useState('');
  const [lastFrameUrl, setLastFrameUrl] = useState('');
  const [extendMode, setExtendMode] = useState<'continue_scene' | 'continue_camera' | 'continue_environment' | 'additional_b_roll'>('continue_scene');
  const [bRollContext, setBRollContext] = useState('Create a close-up product shot');
  const [transitionStyle, setTransitionStyle] = useState('Smooth cinematic whip pan with motion blur');
  const [imageVariationType, setImageVariationType] = useState<'composition' | 'lighting' | 'background' | 'color' | 'similar'>('lighting');
  const [referenceStrength, setReferenceStrength] = useState<number>(0.75);
  const [styleInfluence, setStyleInfluence] = useState<number>(0.6);
  const [selectedRefSet, setSelectedRefSet] = useState<ReferenceSet | null>(null);

  // Audio state
  const [ttsLanguage, setTtsLanguage] = useState<'Hindi' | 'English' | 'Hinglish' | 'Spanish'>('English');
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  const [sfxIntensity, setSfxIntensity] = useState<'subtle' | 'moderate' | 'dramatic' | 'explosive'>('moderate');
  const [musicMood, setMusicMood] = useState<'cinematic' | 'ambient' | 'epic' | 'chill'>('cinematic');
  const [musicGenre, setMusicGenre] = useState<'orchestral' | 'synthwave' | 'acoustic' | 'lo-fi'>('orchestral');
  const [musicBpm, setMusicBpm] = useState<number>(120);

  // Model Selection
  const [manualModelId, setManualModelId] = useState<string>('veo-3.1-lite-generate-preview');

  // Derive Current Task Type
  const currentTaskType: GenerationTaskType = useMemo(() => {
    if (activeTab === 'video') {
      if (videoSubTab === 'text_to_video') return 'text_to_video';
      if (videoSubTab === 'image_to_video') return 'image_to_video';
      if (videoSubTab === 'ref_video') return 'ref_image_to_video';
      if (videoSubTab === 'v2v') return 'video_to_video';
      if (videoSubTab === 'first_last') return 'first_last_frame_video';
      if (videoSubTab === 'extend') return 'extend_video';
      if (videoSubTab === 'b_roll') return 'b_roll_video';
      return 'transition_video';
    } else if (activeTab === 'image') {
      if (imageSubTab === 'text_to_image') return 'text_to_image';
      return 'image_variation';
    } else if (activeTab === 'audio') {
      if (audioSubTab === 'tts') return 'tts_speech';
      if (audioSubTab === 'sfx') return 'sound_effect';
      return 'music_generation';
    }
    return 'text_to_video';
  }, [activeTab, videoSubTab, imageSubTab, audioSubTab]);

  // Resolve Active Model dynamically using Auto Model Router
  const activeModel: ExtendedAIModel = useMemo(() => {
    return GenerationEngine.resolveModel({
      taskType: currentTaskType,
      preference: routerMode,
      targetDuration: durationSec,
      targetResolution: resolution,
      manualModelId,
    });
  }, [currentTaskType, routerMode, durationSec, resolution, manualModelId]);

  // Generation Execution & Modals state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatusText, setGenerationStatusText] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isFallbackModalOpen, setIsFallbackModalOpen] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');
  const [fallbackSuggestedId, setFallbackSuggestedId] = useState<string | undefined>();
  const [activePreviewRecord, setActivePreviewRecord] = useState<GenerationRecord | null>(null);
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);

  // Trigger Generation Initiation Flow
  const handleInitiateGenerate = () => {
    if (!prompt.trim()) {
      addNotification({
        category: 'ai',
        title: 'Prompt Required',
        message: 'Please enter a generation prompt or creative direction.',
      });
      return;
    }

    if (!isOnline) {
      addNotification({
        category: 'system',
        title: 'Offline Mode Active',
        message: 'Internet connection required for generative AI models. Your prompt has been preserved locally.',
      });
      return;
    }

    // Check configuration of active model
    const configCheck = ModelRegistryService.isModelConfigured(activeModel.id);
    if (!configCheck.configured) {
      setFallbackReason(configCheck.message);
      setFallbackSuggestedId(configCheck.suggestedAlternativeId);
      setIsFallbackModalOpen(true);
      return;
    }

    // Open Credit Confirmation Dialog
    setIsConfirmModalOpen(true);
  };

  // Execute Actual Generation
  const handleConfirmExecute = async () => {
    setIsConfirmModalOpen(false);
    setIsGenerating(true);
    setGenerationProgress(5);
    setGenerationStatusText('Initializing secure provider container...');

    // Create job in AI Job Manager
    const job = createJob({
      projectId: activeProject?.id || 'gen-session',
      projectTitle: activeProject?.title || 'Standalone Studio Session',
      command: prompt,
      modelId: activeModel.id,
      modelName: activeModel.name,
      provider: activeModel.provider,
      estimatedCredits: activeModel.costPerUnit,
    });

    updateJobStatus(job.id, 'EXECUTING', { progressPercent: 15 });

    const result = await GenerationEngine.executeGeneration({
      jobId: job.id,
      taskType: currentTaskType,
      prompt,
      modelId: activeModel.id,
      videoParams: {
        aspectRatio,
        durationSec,
        resolution,
        quality,
        sourceImageUrl,
        firstFrameUrl,
        lastFrameUrl,
        extendMode,
        cameraMotion,
      },
      imageParams: {
        aspectRatio,
        quality: quality === 'ultra' ? 'ultra' : quality === 'high' ? 'high' : 'standard',
        variationsCount: imageSubTab === 'variations' ? 3 : 1,
        referenceImageUrl: sourceImageUrl,
        styleInfluence,
        referenceStrength,
        referenceSetId: selectedRefSet?.id,
      },
      audioParams: {
        type: audioSubTab,
        language: ttsLanguage,
        speechSpeed: ttsSpeed,
        speechPitch: ttsPitch,
        sfxIntensity,
        sfxDurationSec: durationSec,
        musicMood,
        musicGenre,
        musicDurationSec: durationSec,
      },
      projectId: activeProject?.id,
      projectTitle: activeProject?.title,
      userId: currentUser?.id,
      userCreditBalance: currentUser?.aiCredits,
      isOwner,
      onProgress: (p, s) => {
        setGenerationProgress(p);
        setGenerationStatusText(s);
        updateJobStatus(job.id, 'EXECUTING', { progressPercent: p });
      },
    });

    setIsGenerating(false);

    if (result.success && result.record) {
      updateJobStatus(job.id, 'COMPLETED', {
        progressPercent: 100,
        resultReference: result.record.outputUrl,
        actualCreditsUsed: result.record.creditsDeducted,
      });

      // Show approval preview modal
      setActivePreviewRecord(result.record);
      setIsLivePreviewOpen(true);
    } else {
      updateJobStatus(job.id, 'FAILED', {
        errorInformation: result.error || 'Pipeline execution halted',
      });

      if (result.suggestedFallbackId) {
        setFallbackReason(result.error || 'Provider execution interrupted.');
        setFallbackSuggestedId(result.suggestedFallbackId);
        setIsFallbackModalOpen(true);
      } else {
        addNotification({
          category: 'ai',
          title: 'Generation Interrupted',
          message: result.error || 'Pipeline execution halted. Please try an alternative model.',
        });
      }
    }
  };

  // Add asset to project
  const handleAddToMediaBin = (record: GenerationRecord) => {
    if (!record.outputUrl) return;
    addMediaToProject({
      name: `${record.title} (${record.modelName.split(' ')[0]})`,
      type: record.outputType,
      url: record.outputUrl,
      durationSec: record.durationSec,
      sizeBytes: record.outputType === 'video' ? 5242880 : record.outputType === 'audio' ? 1048576 : 2097152,
    });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-[#0c0f16] text-neutral-900 dark:text-neutral-100 overflow-hidden">
      {/* Top Workspace Bar */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#10141d] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
            title="Return to Studio Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-tight">AI Generation Studio</h1>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                Multimodal Synthesis & Engine Hub
              </p>
            </div>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          {(
            [
              { id: 'video', label: 'AI Video', icon: Film },
              { id: 'image', label: 'AI Image', icon: ImageIcon },
              { id: 'audio', label: 'AI Audio', icon: Music },
              { id: 'references', label: 'Reference Sets', icon: Layers },
              { id: 'hub', label: 'Model Hub', icon: Cpu },
              { id: 'history', label: 'History', icon: History },
            ] as const
          ).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Info: Credits & Active Project */}
        <div className="flex items-center gap-2 sm:gap-3">
          {activeProject && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300">
              <FolderKanban className="w-3 h-3 text-purple-500" />
              <span className="truncate max-w-[130px]">{activeProject.title}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 text-xs font-mono text-purple-700 dark:text-purple-300">
            <Coins className="w-3.5 h-3.5" />
            <span className="font-bold">{currentUser.aiCredits.toLocaleString()}</span>
            <span className="text-[10px] opacity-70">Credits</span>
          </div>
        </div>
      </div>

      {/* Mobile Tab Scroller */}
      <div className="md:hidden flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#10141d] px-2 py-1.5 gap-1 scrollbar-none">
        {(
          [
            { id: 'video', label: 'AI Video', icon: Film },
            { id: 'image', label: 'AI Image', icon: ImageIcon },
            { id: 'audio', label: 'AI Audio', icon: Music },
            { id: 'references', label: 'References', icon: Layers },
            { id: 'hub', label: 'Model Hub', icon: Cpu },
            { id: 'history', label: 'History', icon: History },
          ] as const
        ).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Offline Status Warning Banner (User Request #28) */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Offline Mode:</strong> Internet connection required for cloud AI generation. You can prepare and save prompts locally.
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-500/20 px-2 py-0.5 rounded">Offline Safe</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {/* VIEW 1: MODEL HUB VIEW */}
        {activeTab === 'hub' && (
          <ModelHubView
            selectedModelId={activeModel.id}
            onSelectModel={model => {
              setManualModelId(model.id);
              setRouterMode('MANUAL');
              if (model.category === 'VIDEO') setActiveTab('video');
              else if (model.category === 'IMAGE') setActiveTab('image');
              else if (model.category === 'SPEECH' || model.category === 'AUDIO') setActiveTab('audio');
            }}
            onOpenSettings={onOpenSettings}
          />
        )}

        {/* VIEW 2: REFERENCE SETS VIEW */}
        {activeTab === 'references' && (
          <ReferenceSetsManager
            selectedSetId={selectedRefSet?.id}
            onSelectReferenceSet={refSet => {
              setSelectedRefSet(refSet);
              setActiveTab('image');
              setImageSubTab('ref_controls');
            }}
          />
        )}

        {/* VIEW 3: GENERATION HISTORY VIEW */}
        {activeTab === 'history' && (
          <GenerationHistoryView
            onOpenPreview={record => {
              setActivePreviewRecord(record);
              setIsLivePreviewOpen(true);
            }}
            onRegenerate={record => {
              setPrompt(record.prompt);
              if (record.outputType === 'video') setActiveTab('video');
              else if (record.outputType === 'image') setActiveTab('image');
              else setActiveTab('audio');
            }}
            onCreateVariation={record => {
              setPrompt(record.prompt);
              setActiveTab('image');
              setImageSubTab('variations');
              if (record.outputUrl) setSourceImageUrl(record.outputUrl);
            }}
            onAddToProject={handleAddToMediaBin}
          />
        )}

        {/* VIEW 4: GENERATIVE WORKSPACES (VIDEO / IMAGE / AUDIO) */}
        {(activeTab === 'video' || activeTab === 'image' || activeTab === 'audio') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Sub-Tool Selector & Form Inputs */}
            <div className="lg:col-span-8 space-y-5">
              {/* Sub-Tabs Selector */}
              {activeTab === 'video' && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(
                    [
                      { id: 'text_to_video', label: 'Text to Video' },
                      { id: 'image_to_video', label: 'Image to Video' },
                      { id: 'ref_video', label: 'Reference Image' },
                      { id: 'v2v', label: 'Video to Video' },
                      { id: 'first_last', label: 'First / Last Frame' },
                      { id: 'extend', label: 'Extend Clip' },
                      { id: 'b_roll', label: 'AI B-Roll' },
                      { id: 'transition', label: 'AI Transition' },
                    ] as const
                  ).map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setVideoSubTab(sub.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        videoSubTab === sub.id
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                          : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'image' && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(
                    [
                      { id: 'text_to_image', label: 'Text to Image' },
                      { id: 'variations', label: 'Image Variations' },
                      { id: 'ref_controls', label: 'Reference Image Controls' },
                    ] as const
                  ).map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setImageSubTab(sub.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        imageSubTab === sub.id
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                          : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(
                    [
                      { id: 'tts', label: 'AI Voice / TTS' },
                      { id: 'sfx', label: 'AI Sound Effects (SFX)' },
                      { id: 'music', label: 'AI Music Foundation' },
                    ] as const
                  ).map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setAudioSubTab(sub.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        audioSubTab === sub.id
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                          : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Primary Input Container */}
              <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12161f] shadow-xs space-y-4">
                {/* Specific Context Controls based on SubTab */}
                {/* 1. Image to Video / Reference Image */}
                {(videoSubTab === 'image_to_video' || videoSubTab === 'ref_video' || imageSubTab === 'variations' || imageSubTab === 'ref_controls') && (
                  <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Source Reference Image (URL or Project Asset)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={sourceImageUrl}
                        onChange={e => setSourceImageUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:ring-1 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setSourceImageUrl('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80')}
                        className="px-2.5 py-1 rounded bg-neutral-200 dark:bg-neutral-800 text-[11px] font-medium"
                      >
                        Sample
                      </button>
                    </div>

                    {sourceImageUrl && (
                      <div className="flex items-center gap-3 pt-1">
                        <img src={sourceImageUrl} alt="Ref" className="w-14 h-14 rounded object-cover border" />
                        <span className="text-[11px] text-neutral-400">Source image linked. Never modified directly.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Video to Video Specific (User Request #6) */}
                {videoSubTab === 'v2v' && (
                  <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold">Source Video Clip URL</label>
                      <input
                        type="url"
                        placeholder="Source video URL to transform..."
                        value={sourceVideoUrl}
                        onChange={e => setSourceVideoUrl(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                        Editing Intent Mode (Strict Distinction)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setV2vMode('edit_preserve_scene')}
                          className={`p-2.5 rounded-lg border text-left transition-all ${
                            v2vMode === 'edit_preserve_scene'
                              ? 'border-purple-500 bg-purple-500/10 font-semibold text-purple-900 dark:text-purple-200'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          <div>Edit Scene Elements</div>
                          <div className="text-[10px] font-normal opacity-70">
                            Preserves original camera motion & temporal physics
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setV2vMode('inspired_by_reference')}
                          className={`p-2.5 rounded-lg border text-left transition-all ${
                            v2vMode === 'inspired_by_reference'
                              ? 'border-purple-500 bg-purple-500/10 font-semibold text-purple-900 dark:text-purple-200'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          <div>Inspired Generation</div>
                          <div className="text-[10px] font-normal opacity-70">
                            Synthesizes a new scene inspired by source aesthetic
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. First / Last Frame Specific (User Request #7) */}
                {videoSubTab === 'first_last' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-purple-600 dark:text-purple-400">First Frame (Start)</label>
                      <input
                        type="url"
                        placeholder="Image URL for starting frame..."
                        value={firstFrameUrl}
                        onChange={e => setFirstFrameUrl(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-indigo-600 dark:text-indigo-400">Last Frame (Optional End)</label>
                      <input
                        type="url"
                        placeholder="Image URL for ending anchor..."
                        value={lastFrameUrl}
                        onChange={e => setLastFrameUrl(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Video Extension Specific (User Request #8) */}
                {videoSubTab === 'extend' && (
                  <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                    <label className="font-semibold">Extension Continuation Strategy</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          { id: 'continue_scene', label: 'Continue Scene' },
                          { id: 'continue_camera', label: 'Camera Path' },
                          { id: 'continue_environment', label: 'Environment' },
                          { id: 'additional_b_roll', label: 'B-Roll Cut' },
                        ] as const
                      ).map(mode => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setExtendMode(mode.id)}
                          className={`p-2 rounded border text-center transition-all ${
                            extendMode === mode.id
                              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold'
                              : 'border-neutral-200 dark:border-neutral-800'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. AI B-Roll Generator (User Request #9) */}
                {videoSubTab === 'b_roll' && (
                  <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-xs space-y-2">
                    <div className="font-semibold text-purple-900 dark:text-purple-200">
                      B-Roll Scene Directives
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Create a close-up product shot',
                        'Create a city establishing shot',
                        'Create a cinematic transition shot',
                        'Macro detail texture pan',
                      ].map(example => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setPrompt(example)}
                          className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[11px] hover:border-purple-500 transition-colors"
                        >
                          “{example}”
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. AI Transition Generator (User Request #10) */}
                {videoSubTab === 'transition' && (
                  <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                    <label className="font-semibold">AI Transition Motion Archetype</label>
                    <input
                      type="text"
                      value={transitionStyle}
                      onChange={e => setTransitionStyle(e.target.value)}
                      placeholder="e.g. Smooth cinematic whip pan with motion blur..."
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                    />
                  </div>
                )}

                {/* Main Prompt Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {activeTab === 'audio' && audioSubTab === 'tts'
                        ? 'Speech Script / Text Content *'
                        : 'Generation Prompt / Instruction *'}
                    </label>
                    {activeTab === 'image' && (
                      <button
                        type="button"
                        onClick={() => setPrompt('Cinematic portrait in golden hour light, high dynamic range, 35mm lens, sharp focus')}
                        className="text-purple-600 dark:text-purple-400 hover:underline text-[11px]"
                      >
                        Sample Prompt
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={activeTab === 'audio' && audioSubTab === 'tts' ? 4 : 3}
                    placeholder={
                      activeTab === 'video'
                        ? 'Describe action, subject, lighting, and camera motion (e.g. Cinematic slow push-in on a cyberpunk street in rain)...'
                        : activeTab === 'image'
                        ? 'Describe subject, style, lighting, composition (e.g. Minimalist architectural glass pavilion surrounded by pine forest)...'
                        : audioSubTab === 'tts'
                        ? 'Enter dialogue or voiceover script in Hindi, English, or Hinglish...'
                        : audioSubTab === 'sfx'
                        ? 'Describe sound effect (e.g. Cinematic whoosh with sub-bass drop, heavy camera shutter click)...'
                        : 'Describe mood, genre, tempo and instrumentation...'
                    }
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                {/* Aspect Ratio & Format Controls (Only if Model supports) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {/* Aspect Ratio */}
                  {activeModel.supportedAspectRatios && (
                    <div className="space-y-1 text-xs">
                      <label className="text-neutral-500 font-medium">Aspect Ratio</label>
                      <select
                        value={aspectRatio}
                        onChange={e => setAspectRatio(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                      >
                        {activeModel.supportedAspectRatios.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Duration */}
                  {(activeTab === 'video' || (activeTab === 'audio' && audioSubTab !== 'tts')) && (
                    <div className="space-y-1 text-xs">
                      <label className="text-neutral-500 font-medium">Duration</label>
                      <select
                        value={durationSec}
                        onChange={e => setDurationSec(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                      >
                        <option value={3}>3 Seconds</option>
                        <option value={5}>5 Seconds</option>
                        <option value={10}>10 Seconds</option>
                        {activeModel.durationLimitSec && activeModel.durationLimitSec >= 15 && (
                          <option value={15}>15 Seconds</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Resolution */}
                  {activeModel.supportedResolutions && (
                    <div className="space-y-1 text-xs">
                      <label className="text-neutral-500 font-medium">Resolution</label>
                      <select
                        value={resolution}
                        onChange={e => setResolution(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                      >
                        {activeModel.supportedResolutions.map(res => (
                          <option key={res} value={res}>{res}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quality Tier */}
                  <div className="space-y-1 text-xs">
                    <label className="text-neutral-500 font-medium">Quality Tier</label>
                    <select
                      value={quality}
                      onChange={e => setQuality(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                    >
                      <option value="standard">Standard</option>
                      <option value="high">High Quality</option>
                      <option value="ultra">Ultra Master</option>
                    </select>
                  </div>
                </div>

                {/* Audio Specific Controls (TTS / SFX / Music) */}
                {activeTab === 'audio' && audioSubTab === 'tts' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                    <div className="space-y-1">
                      <label className="text-neutral-500 font-medium">Language</label>
                      <select
                        value={ttsLanguage}
                        onChange={e => setTtsLanguage(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Hinglish">Hinglish (Hybrid)</option>
                        <option value="Spanish">Spanish</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-neutral-500">
                        <span>Speed</span>
                        <span className="font-mono">{ttsSpeed}x</span>
                      </div>
                      <input
                        type="range"
                        min={0.75}
                        max={1.5}
                        step={0.05}
                        value={ttsSpeed}
                        onChange={e => setTtsSpeed(parseFloat(e.target.value))}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-neutral-500">
                        <span>Pitch Modulation</span>
                        <span className="font-mono">{ttsPitch.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0.8}
                        max={1.3}
                        step={0.05}
                        value={ttsPitch}
                        onChange={e => setTtsPitch(parseFloat(e.target.value))}
                        className="w-full accent-purple-600"
                      />
                    </div>
                  </div>
                )}

                {/* SFX Intensity Control */}
                {activeTab === 'audio' && audioSubTab === 'sfx' && (
                  <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                    <label className="text-neutral-500 font-medium">Sound Effect Intensity</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['subtle', 'moderate', 'dramatic', 'explosive'] as const).map(int => (
                        <button
                          key={int}
                          type="button"
                          onClick={() => setSfxIntensity(int)}
                          className={`py-1.5 rounded text-center capitalize text-xs ${
                            sfxIntensity === int
                              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold'
                              : 'border border-neutral-200 dark:border-neutral-800'
                          }`}
                        >
                          {int}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Music Genre & Mood Controls */}
                {activeTab === 'audio' && audioSubTab === 'music' && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                    <div className="space-y-1">
                      <label className="text-neutral-500 font-medium">Musical Mood</label>
                      <select
                        value={musicMood}
                        onChange={e => setMusicMood(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                      >
                        <option value="cinematic">Cinematic Soundtrack</option>
                        <option value="ambient">Ambient Atmospheric</option>
                        <option value="epic">Epic Orchestral</option>
                        <option value="chill">Chill Lo-Fi</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-neutral-500 font-medium">Genre Style</label>
                      <select
                        value={musicGenre}
                        onChange={e => setMusicGenre(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                      >
                        <option value="orchestral">Orchestral Score</option>
                        <option value="synthwave">Retro Synthwave</option>
                        <option value="acoustic">Acoustic Indie</option>
                        <option value="lo-fi">Lo-Fi Beat</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Engine Selection, Cost Estimate & Action Bar */}
            <div className="lg:col-span-4 space-y-4">
              {/* Router Mode Selector (User Request #20) */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12161f] shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Model Router Mode</span>
                  <span className="text-[10px] uppercase font-mono text-purple-600 dark:text-purple-400 font-medium">
                    {routerMode} Routing
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {(['AUTO', 'FAST', 'BALANCED', 'QUALITY', 'MANUAL'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setRouterMode(mode)}
                      className={`py-1.5 rounded text-[10px] font-medium transition-colors ${
                        routerMode === mode
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Active Model Summary Card */}
                <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 dark:bg-purple-500/10 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-purple-600 dark:text-purple-400 font-medium">
                        {activeModel.provider}
                      </span>
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs leading-tight">
                        {activeModel.name}
                      </h4>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-500/20 text-purple-700 dark:text-purple-300">
                      {activeModel.badges[0] || 'Active'}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {activeModel.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-purple-500/20 text-[11px] font-mono">
                    <span className="text-neutral-400">Speed / Tier:</span>
                    <span className="capitalize">{activeModel.speed} ({activeModel.quality})</span>
                  </div>
                </div>

                {/* Model Hub Link */}
                <button
                  onClick={() => setActiveTab('hub')}
                  className="w-full py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-1 transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Browse Model Hub Registry</span>
                </button>
              </div>

              {/* Cost & Generation Launcher Card */}
              <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12161f] shadow-xs space-y-4">
                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Usage & Credit Estimate
                </div>

                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Base Model Cost:</span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {activeModel.costPerUnit} Credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Your Current Balance:</span>
                    <span className="font-mono">{currentUser.aiCredits.toLocaleString()} Credits</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span>Credit Guarantee:</span>
                    <span>No Charge on Failure</span>
                  </div>
                </div>

                {/* Progress bar if actively generating */}
                {isGenerating && (
                  <div className="space-y-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-purple-700 dark:text-purple-300 font-semibold">{generationStatusText}</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-purple-200 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Main Generate Button */}
                <button
                  type="button"
                  onClick={handleInitiateGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-xs hover:opacity-90 disabled:opacity-40 shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-purple-500" />
                      <span>Generating Asset...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Asset ({activeModel.costPerUnit} CR)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Confirm Cost Modal */}
      <ConfirmCostModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmExecute}
        model={activeModel}
        estimatedCredits={activeModel.costPerUnit}
        userCredits={CreditLedgerService.getAvailableBalanceForUser(currentUser.id, currentUser.aiCredits)}
        taskTitle={prompt.length > 30 ? `${prompt.substring(0, 30)}...` : prompt}
        isProUser={isPro}
      />

      {/* MODAL 2: Fallback Modal */}
      <ModelFallbackModal
        isOpen={isFallbackModalOpen}
        onClose={() => setIsFallbackModalOpen(false)}
        currentModel={activeModel}
        suggestedFallbackId={fallbackSuggestedId}
        reason={fallbackReason}
        onAcceptFallback={newModelId => {
          setManualModelId(newModelId);
          setRouterMode('MANUAL');
        }}
        onOpenSettings={onOpenSettings}
      />

      {/* MODAL 3: Live Preview & Approval Modal */}
      <GenerationPreviewModal
        isOpen={isLivePreviewOpen}
        onClose={() => setIsLivePreviewOpen(false)}
        record={activePreviewRecord}
        onAddToMediaBin={handleAddToMediaBin}
        onAddToTimeline={rec => {
          handleAddToMediaBin(rec);
          onNavigateToStudio?.('video');
        }}
        onOpenInPhotoStudio={rec => {
          handleAddToMediaBin(rec);
          onNavigateToStudio?.('photo');
        }}
        onOpenInAudioStudio={rec => {
          handleAddToMediaBin(rec);
          onNavigateToStudio?.('audio');
        }}
        onRegenerate={rec => {
          setIsLivePreviewOpen(false);
          setPrompt(rec.prompt);
          handleInitiateGenerate();
        }}
        onCreateVariation={rec => {
          setIsLivePreviewOpen(false);
          setActiveTab('image');
          setImageSubTab('variations');
          setPrompt(rec.prompt);
          if (rec.outputUrl) setSourceImageUrl(rec.outputUrl);
        }}
      />
    </div>
  );
};
