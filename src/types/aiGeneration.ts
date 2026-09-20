import { AIModel, ModelCapability } from './index';

export type GenerationTaskType =
  | 'text_to_video'
  | 'image_to_video'
  | 'ref_image_to_video'
  | 'video_to_video'
  | 'first_last_frame_video'
  | 'extend_video'
  | 'b_roll_video'
  | 'transition_video'
  | 'text_to_image'
  | 'image_variation'
  | 'tts_speech'
  | 'sound_effect'
  | 'music_generation';

export type ModelHubCategory =
  | 'VIDEO'
  | 'IMAGE'
  | 'AUDIO'
  | 'SPEECH'
  | 'ENHANCEMENT'
  | 'ANALYSIS';

export type ModelBadgeLabel =
  | 'Recommended'
  | 'Fast'
  | 'Quality'
  | 'Experimental';

export type ReferenceType =
  | 'subject'
  | 'character'
  | 'product'
  | 'style'
  | 'composition';

export interface ReferenceSet {
  id: string;
  title: string;
  purpose: 'product' | 'character' | 'brand' | 'style';
  description: string;
  images: string[];
  triggerKeyword?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface VideoGenerationParams {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  durationSec: number;
  resolution: '720p' | '1080p' | '4K';
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  modelId: string;
  motionStrength?: number;
  variationsCount?: number;
  // Image to video
  sourceImageUrl?: string;
  cameraMotion?: string;
  // Reference images
  referenceImages?: { url: string; type: ReferenceType; weight: number }[];
  // Video to video / reference video
  sourceVideoUrl?: string;
  videoEditMode?: 'inspired_by_reference' | 'edit_preserve_scene';
  instructionPrompt?: string;
  // First / Last frame
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  // Extension
  extendMode?: 'continue_scene' | 'continue_camera' | 'continue_environment' | 'additional_b_roll';
  sourceClipId?: string;
  // B-roll
  sceneDescription?: string;
  transcriptContext?: string;
  // Transition
  transitionClipAUrl?: string;
  transitionClipBUrl?: string;
  transitionStyle?: string;
}

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  resolution: '1024x1024' | '1920x1080' | '1080x1920' | '2048x2048' | '4096x4096';
  quality: 'standard' | 'high' | 'ultra';
  variationsCount: number;
  modelId: string;
  referenceImageUrl?: string;
  referenceStrength?: number;
  styleInfluence?: number;
  compositionInfluence?: number;
  referenceSetId?: string;
  variationType?: 'composition' | 'lighting' | 'background' | 'color' | 'similar';
}

export interface AudioGenerationParams {
  type: 'tts' | 'sfx' | 'music';
  modelId: string;
  // TTS
  textPrompt?: string;
  language?: 'Hindi' | 'English' | 'Hinglish' | 'Spanish' | 'French' | 'German' | 'Japanese';
  voiceId?: string;
  speechSpeed?: number;
  speechPitch?: number;
  speechEmotion?: 'neutral' | 'cinematic' | 'excited' | 'whisper' | 'dramatic';
  // SFX
  sfxDescription?: string;
  sfxDurationSec?: number;
  sfxIntensity?: 'subtle' | 'moderate' | 'dramatic' | 'explosive';
  // Music
  musicMood?: 'cinematic' | 'ambient' | 'epic' | 'chill' | 'action' | 'electronic';
  musicGenre?: 'orchestral' | 'synthwave' | 'acoustic' | 'lo-fi' | 'hybrid';
  musicTempoBpm?: number;
  musicDurationSec?: number;
  isInstrumental?: boolean;
}

export interface GenerationRecord {
  id: string;
  taskType: GenerationTaskType;
  title: string;
  prompt: string;
  modelId: string;
  modelName: string;
  provider: string;
  createdAt: string;
  status: 'queued' | 'preparing' | 'generating' | 'completed' | 'failed' | 'cancelled';
  progressPercent?: number;
  outputUrl?: string;
  outputUrls?: string[];
  outputType: 'video' | 'image' | 'audio';
  durationSec?: number;
  resolution?: string;
  aspectRatio?: string;
  estimatedCredits: number;
  creditsDeducted: number;
  licenseInfo?: {
    licenseType: 'commercial' | 'creative_commons' | 'editorial' | 'royalty_free';
    usagePermitted: boolean;
    attributionRequired: boolean;
  };
  projectId?: string;
  projectTitle?: string;
  errorReason?: string;
  suggestedFallbackModelId?: string;
  inputMetadata?: Record<string, any>;
}

export interface ModelHubItem extends AIModel {
  category: ModelHubCategory;
  badges: ModelBadgeLabel[];
  apiConfigured: boolean;
  requiresApiKey: boolean;
  providerId?: string;
  supportedAspectRatios?: ('16:9' | '9:16' | '1:1' | '4:5')[];
  supportedMaxDurationSec?: number;
  supportedResolutions?: string[];
  features?: string[];
  releaseDate?: string;
}
