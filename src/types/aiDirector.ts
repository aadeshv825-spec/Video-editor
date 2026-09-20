import { ModelCapability, StudioType } from './index';

export type DirectorIntent =
  | 'video_edit'
  | 'photo_edit'
  | 'audio_edit'
  | 'aspect_ratio_adjust'
  | 'style_match'
  | 'ai_tool_execution'
  | 'clarification_needed'
  | 'unsupported';

export type TargetMediaType =
  | 'video_clip'
  | 'photo_layer'
  | 'audio_track'
  | 'audio_clip'
  | 'entire_timeline'
  | 'photo_canvas'
  | 'master_audio';

export interface EditOperation {
  id: string;
  type:
    | 'trim'
    | 'split'
    | 'delete'
    | 'move'
    | 'crop'
    | 'resize'
    | 'rotate'
    | 'flip'
    | 'opacity'
    | 'brightness'
    | 'contrast'
    | 'saturation'
    | 'temperature'
    | 'tint'
    | 'highlights'
    | 'shadows'
    | 'sharpen'
    | 'blur'
    | 'vignette'
    | 'volume'
    | 'mute'
    | 'fade'
    | 'speed'
    | 'transition'
    | 'normalize'
    | 'eq'
    | 'bg_removal'
    | 'object_removal'
    | 'object_replace'
    | 'gen_fill'
    | 'gen_expand'
    | 'upscale'
    | 'enhance'
    | 'relight'
    | 'restoration'
    | 'colorize'
    | 'auto_reframe'
    | 'scene_detection'
    | 'captions'
    | 'stabilize';
  parameters: Record<string, any>;
  description: string;
  targetScope: TargetMediaType;
  targetId?: string;
  targetTitle?: string;
}

export interface PlanValidationCheck {
  code: string;
  label: string;
  passed: boolean;
  message?: string;
}

export interface PlanValidationResult {
  isValid: boolean;
  canExecute: boolean;
  checks: PlanValidationCheck[];
  errors: string[];
  warnings: string[];
  requiresPro: boolean;
  creditsRequired: number;
}

export interface ReferenceMediaInfo {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  url?: string;
  aspectRatio?: string;
  durationSec?: number;
  extractedStyle?: {
    brightness?: number;
    warmth?: number;
    contrast?: number;
    dominantColor?: string;
    aspectRatio?: string;
  };
}

export interface StructuredEditPlan {
  id: string;
  command: string;
  intent: DirectorIntent;
  target: {
    type: TargetMediaType;
    id: string;
    title: string;
    projectId: string;
    projectType: StudioType;
  };
  operations: EditOperation[];
  requires_reference: boolean;
  referenceMedia?: ReferenceMediaInfo;
  estimated_complexity: 'low' | 'medium' | 'high';
  estimated_cost_credits: number;
  requires_external_ai: boolean;
  required_model_id?: string;
  explanation: string;
  clarification_question?: string;
  validation: PlanValidationResult;
  status: 'draft' | 'approved' | 'executed' | 'cancelled';
  createdAt: string;
  executedAt?: string;
  snapshotVersionId?: string;
}

export type AIJobStatus =
  | 'QUEUED'
  | 'ANALYZING'
  | 'WAITING_FOR_APPROVAL'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface AIJob {
  id: string;
  projectId: string;
  projectTitle: string;
  taskType: DirectorIntent;
  command: string;
  modelId: string;
  modelName: string;
  provider: string;
  status: AIJobStatus;
  progressPercent: number;
  createdTime: string;
  startedTime?: string;
  completedTime?: string;
  errorInformation?: string;
  resultReference?: string;
  estimatedCredits: number;
  actualCreditsUsed?: number;
  plan?: StructuredEditPlan;
}

export interface MediaAnalysisData {
  mediaId: string;
  mediaName: string;
  mediaType: 'video' | 'photo' | 'audio';
  technical: {
    durationSec?: number;
    resolution?: string;
    fps?: number;
    aspectRatio?: string;
    orientation?: 'landscape' | 'portrait' | 'square';
    hasAudio?: boolean;
    sampleRateHz?: number;
    channels?: number;
    layerCount?: number;
    clipCount?: number;
    format?: string;
  };
  semanticFoundation: {
    status: 'ready_for_model' | 'analyzed';
    detectedSceneType?: string;
    lightingProfile?: string;
    colorPalette?: string[];
    speechDetected?: boolean;
    importantKeypoints?: string[];
    notes: string;
  };
}
