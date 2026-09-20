import { ModelCapability } from './index';

export type AIToolCategory = 'photo' | 'video';

export type PhotoAIToolId =
  | 'photo_bg_removal'
  | 'photo_bg_replace'
  | 'photo_object_removal'
  | 'photo_object_replace'
  | 'photo_gen_fill'
  | 'photo_gen_expand'
  | 'photo_upscale'
  | 'photo_enhance'
  | 'photo_portrait_enhance'
  | 'photo_relight'
  | 'photo_restoration'
  | 'photo_colorize'
  | 'photo_image_gen'
  | 'photo_img2img';

export type VideoAIToolId =
  | 'video_bg_removal'
  | 'video_object_removal'
  | 'video_object_replace'
  | 'video_enhance'
  | 'video_upscale'
  | 'video_stabilization'
  | 'video_frame_interpolation'
  | 'video_auto_reframe'
  | 'video_scene_detection'
  | 'video_auto_cut'
  | 'video_captions';

export type AIToolId = PhotoAIToolId | VideoAIToolId;

export type AIToolWorkflowStep =
  | 'select_media'
  | 'configure'
  | 'analyze'
  | 'preview'
  | 'user_approval'
  | 'process'
  | 'result';

export interface AIToolMeta {
  id: AIToolId;
  name: string;
  category: AIToolCategory;
  shortDescription: string;
  fullDescription: string;
  capability: ModelCapability;
  defaultModelId: string;
  costCredits: number;
  isProOnly: boolean;
  supportedInputTypes: ('image' | 'video' | 'audio')[];
  badge?: string;
  iconName?: string;
  requiresExternalProvider?: boolean;
  requiredProviderName?: string;
}

export interface SelectedMediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  aspectRatio?: string;
  resolution?: string;
  durationSec?: number;
  sourceType: 'project_clip' | 'project_layer' | 'media_bin' | 'uploaded' | 'sample';
}

export interface SubtitleCaption {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
}

export interface SceneBoundary {
  id: string;
  timestampSec: number;
  formattedTime: string;
  confidence: number;
  thumbnailUrl?: string;
  label?: string;
}

export interface AIToolResultPayload {
  toolId: AIToolId;
  resultUrl?: string;
  transparentUrl?: string;
  originalUrl: string;
  summaryText: string;
  captions?: SubtitleCaption[];
  scenes?: SceneBoundary[];
  metrics?: {
    processingTimeMs: number;
    creditsUsed: number;
    modelUsed: string;
    resolutionChange?: string;
    compressionImprovement?: string;
  };
  undoData?: any;
}
