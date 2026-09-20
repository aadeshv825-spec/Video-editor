import { AIModel, ModelCapability } from '../../types';
import { ModelBadgeLabel, ModelHubCategory, ModelHubItem } from '../../types/aiGeneration';
import {
  ProviderStatusService,
  ModelRealAvailabilityState,
  ModelAvailabilityCheckResult,
} from './providerStatusService';

export interface ExtendedAIModel extends ModelHubItem {
  providerType: 'gemini' | 'local' | 'runway' | 'elevenlabs' | 'flux' | 'openai' | 'stability' | 'suno';
  notes?: string;
}

export const AI_MODEL_REGISTRY: ExtendedAIModel[] = [
  // ==================== VIDEO ====================
  {
    id: 'veo-3.1-lite-generate-preview',
    name: 'Google Veo 3.1 Lite (Cinematic Video)',
    provider: 'Google DeepMind',
    providerType: 'gemini',
    category: 'VIDEO',
    capabilities: ['video'],
    quality: 'high',
    speed: 'fast',
    costPerUnit: 6,
    costUnitLabel: 'per 5s video',
    resolutionMax: '1080p (1920x1080)',
    durationLimitSec: 10,
    supportedMaxDurationSec: 10,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:5'],
    supportedResolutions: ['720p', '1080p'],
    inputTypes: ['text', 'image'],
    outputTypes: ['video'],
    availability: 'online',
    isProOnly: false,
    apiConfigured: true,
    requiresApiKey: false,
    badges: ['Recommended', 'Fast'],
    description: 'High-efficiency neural video generation model from Google. Supports text-to-video, image-to-video, and camera push-in motion prompts.',
    features: ['Text-to-Video', 'Image-to-Video', 'Motion Strength', 'Camera Direction', '16:9 & 9:16'],
  },
  {
    id: 'runway-gen3-alpha',
    name: 'Runway Gen-3 Alpha (Motion Video)',
    provider: 'Runway ML',
    providerType: 'runway',
    category: 'VIDEO',
    capabilities: ['video', 'vfx'],
    quality: 'ultra',
    speed: 'quality',
    costPerUnit: 10,
    costUnitLabel: 'per 5s video',
    resolutionMax: '4K (3840x2160)',
    durationLimitSec: 15,
    supportedMaxDurationSec: 15,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:5'],
    supportedResolutions: ['720p', '1080p', '4K'],
    inputTypes: ['text', 'image', 'video'],
    outputTypes: ['video'],
    availability: 'online',
    isProOnly: true,
    apiConfigured: false,
    requiresApiKey: true,
    badges: ['Quality'],
    description: 'Cinematic video synthesis pipeline with high temporal consistency, fluid camera trajectories, and video-to-video style transfer.',
    features: ['Video-to-Video', 'First/Last Frame', 'Motion Brush', 'Multi-layer VFX', 'Scene Continuation'],
  },
  {
    id: 'openai-sora-turbo',
    name: 'OpenAI Sora Turbo (World Simulation)',
    provider: 'OpenAI',
    providerType: 'openai',
    category: 'VIDEO',
    capabilities: ['video'],
    quality: 'ultra',
    speed: 'balanced',
    costPerUnit: 12,
    costUnitLabel: 'per 5s video',
    resolutionMax: '1080p',
    durationLimitSec: 20,
    supportedMaxDurationSec: 20,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['1080p'],
    inputTypes: ['text', 'image'],
    outputTypes: ['video'],
    availability: 'beta',
    isProOnly: true,
    apiConfigured: false,
    requiresApiKey: true,
    badges: ['Experimental', 'Quality'],
    description: 'Diffusion transformer world simulator capable of complex multi-character scenes, physical interaction, and cinematic depth.',
    features: ['World Simulation', 'Complex Physics', 'Character Continuity', '20s Extensions'],
  },

  // ==================== IMAGE ====================
  {
    id: 'gemini-3.1-flash-image',
    name: 'Gemini 3.1 Flash Image (Nano Banana 2)',
    provider: 'Google DeepMind',
    providerType: 'gemini',
    category: 'IMAGE',
    capabilities: ['image', 'vfx'],
    quality: 'high',
    speed: 'fast',
    costPerUnit: 2,
    costUnitLabel: 'per image',
    resolutionMax: '2K (2048x2048)',
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:5'],
    supportedResolutions: ['1024x1024', '1920x1080', '1080x1920', '2048x2048'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    availability: 'online',
    isProOnly: false,
    apiConfigured: true,
    requiresApiKey: false,
    badges: ['Recommended', 'Fast'],
    description: 'Next-generation image generation and multimodal visual synthesis engine. Ultra-fast rendering with native support for resolutions up to 2K.',
    features: ['Text-to-Image', 'Image-to-Image', 'Aspect Ratio Control', 'Sub-second Latency'],
  },
  {
    id: 'flux-1.1-pro',
    name: 'Flux 1.1 Pro (Photoreal Studio)',
    provider: 'Black Forest Labs',
    providerType: 'flux',
    category: 'IMAGE',
    capabilities: ['image', 'upscaling', 'vfx'],
    quality: 'ultra',
    speed: 'balanced',
    costPerUnit: 5,
    costUnitLabel: 'per image',
    resolutionMax: '4K (3840x3840)',
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:5'],
    supportedResolutions: ['1024x1024', '2048x2048', '4096x4096'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    availability: 'online',
    isProOnly: true,
    apiConfigured: false,
    requiresApiKey: true,
    badges: ['Quality'],
    description: 'Uncompromising photorealism, tactile skin fidelity, natural micro-contrasts, typography rendering, and reference-guided consistency.',
    features: ['Ultra Photorealism', 'Typography Rendering', 'Reference Weighting', '4K Native Output'],
  },
  {
    id: 'stability-sd3-5',
    name: 'Stable Diffusion 3.5 Large',
    provider: 'Stability AI',
    providerType: 'stability',
    category: 'IMAGE',
    capabilities: ['image'],
    quality: 'high',
    speed: 'balanced',
    costPerUnit: 3,
    costUnitLabel: 'per image',
    resolutionMax: '2K (2048x2048)',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['1024x1024', '2048x2048'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    availability: 'online',
    isProOnly: false,
    apiConfigured: false,
    requiresApiKey: true,
    badges: ['Experimental'],
    description: 'Multi-modal diffusion model with prompt adherence, compositional versatility, and open reference embeddings.',
    features: ['Prompt Adherence', 'Compositional Variety', 'Open Reference Embeddings'],
  },

  // ==================== SPEECH / TTS ====================
  {
    id: 'gemini-3.1-flash-tts-preview',
    name: 'Gemini 3.1 Flash Speech (Natural TTS)',
    provider: 'Google DeepMind',
    providerType: 'gemini',
    category: 'SPEECH',
    capabilities: ['audio'],
    quality: 'high',
    speed: 'fast',
    costPerUnit: 1,
    costUnitLabel: 'per 60s speech',
    resolutionMax: '48kHz / 16-bit',
    durationLimitSec: 300,
    supportedMaxDurationSec: 300,
    inputTypes: ['text'],
    outputTypes: ['audio'],
    availability: 'online',
    isProOnly: false,
    apiConfigured: true,
    requiresApiKey: false,
    badges: ['Recommended', 'Fast'],
    description: 'Expressive neural speech synthesis with native multi-lingual support including Hindi, English, and Hinglish dialogue.',
    features: ['Hindi, English, Hinglish', 'Emotion & Pitch Control', 'Speed Adjustment', 'Broadcast Audio 48kHz'],
  },
  {
    id: 'elevenlabs-voice-v2',
    name: 'ElevenLabs Sonic v2 (Studio Voice)',
    provider: 'ElevenLabs',
    providerType: 'elevenlabs',
    category: 'SPEECH',
    capabilities: ['audio'],
    quality: 'ultra',
    speed: 'fast',
    costPerUnit: 3,
    costUnitLabel: 'per 30s speech',
    resolutionMax: '96kHz / 24-bit',
    durationLimitSec: 180,
    supportedMaxDurationSec: 180,
    inputTypes: ['text', 'audio'],
    outputTypes: ['audio'],
    availability: 'online',
    isProOnly: true,
    apiConfigured: false,
    requiresApiKey: true,
    badges: ['Quality'],
    description: 'Nuanced cinematic character voices, dialect inflection, high-dynamic pacing, and audio dubbing architecture.',
    features: ['Studio Master 96kHz', 'Nuanced Character Timbre', 'Breath & Pause Control', 'Dubbing Mode'],
  },

  // ==================== AUDIO / SFX ====================
  {
    id: 'creative-sfx-engine',
    name: 'Creative SFX Engine (Foley & Spatial)',
    provider: 'Creative Studio Core',
    providerType: 'local',
    category: 'AUDIO',
    capabilities: ['audio'],
    quality: 'high',
    speed: 'fast',
    costPerUnit: 1,
    costUnitLabel: 'per effect',
    resolutionMax: '48kHz / 24-bit',
    durationLimitSec: 60,
    supportedMaxDurationSec: 60,
    inputTypes: ['text'],
    outputTypes: ['audio'],
    availability: 'online',
    isProOnly: false,
    apiConfigured: true,
    requiresApiKey: false,
    badges: ['Recommended', 'Fast'],
    description: 'Instant atmospheric whooshes, cinematic impacts, footsteps, rain ambiences, and spatial foley synthesis.',
    features: ['Instant Foley Generation', 'Duration & Intensity Controls', 'Zero Latency', 'Royalty-Free'],
  },
  {
    id: 'lyria-3-clip-preview',
    name: 'Google Lyria 3 (Music Foundation)',
    provider: 'Google DeepMind',
    providerType: 'gemini',
    category: 'AUDIO',
    capabilities: ['audio'],
    quality: 'ultra',
    speed: 'balanced',
    costPerUnit: 4,
    costUnitLabel: 'per 30s track',
    resolutionMax: '48kHz / 24-bit',
    durationLimitSec: 120,
    supportedMaxDurationSec: 120,
    inputTypes: ['text'],
    outputTypes: ['audio'],
    availability: 'online',
    isProOnly: true,
    apiConfigured: true,
    requiresApiKey: false,
    badges: ['Quality', 'Experimental'],
    description: 'Next-generation instrumental and mood music generator. Produces licensed cinematic orchestrations, synthwave beats, and acoustic beds.',
    features: ['Mood & Genre Shaping', 'Tempo BPM Sync', 'Instrumental Master', 'Licensing Metadata Included'],
  },

  // ==================== ENHANCEMENT ====================
  {
    id: 'neural-video-upscale-4k',
    name: 'Neural Video Upscaler & Denoise',
    provider: 'Local Studio Core',
    providerType: 'local',
    category: 'ENHANCEMENT',
    capabilities: ['upscaling', 'vfx'],
    quality: 'ultra',
    speed: 'balanced',
    costPerUnit: 2,
    costUnitLabel: 'per clip',
    resolutionMax: '4K (3840x2160)',
    inputTypes: ['video', 'image'],
    outputTypes: ['video', 'image'],
    availability: 'online',
    isProOnly: false,
    apiConfigured: true,
    requiresApiKey: false,
    badges: ['Recommended'],
    description: 'Super-resolution neural model with edge sharpening, de-noising, optical de-blur, and frame rate interpolation.',
    features: ['2X / 4X Upscale', 'High-ISO Denoise', 'Frame Interpolation (60fps)'],
  },

  // ==================== ANALYSIS ====================
  {
    id: 'creative-director-local',
    name: 'Local Creative Engine v4 (Built-in)',
    provider: 'Local Studio Core',
    providerType: 'local',
    category: 'ANALYSIS',
    capabilities: ['scripting', 'storyboard', 'video', 'image', 'audio'],
    quality: 'ultra',
    speed: 'fast',
    costPerUnit: 1,
    costUnitLabel: 'per plan',
    resolutionMax: '4K (3840x2160)',
    durationLimitSec: 600,
    inputTypes: ['text', 'video', 'image', 'audio'],
    outputTypes: ['plan', 'edit_action'],
    availability: 'online',
    isProOnly: false,
    apiConfigured: true,
    requiresApiKey: false,
    badges: ['Recommended', 'Fast'],
    description: 'Deterministic, zero-latency local intelligence engine. Parses natural language instructions into strict, non-destructive editing plans.',
    features: ['Local Instant Parsing', 'Non-Destructive Edits', 'Offline Operational'],
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash (Multimodal Director)',
    provider: 'Google DeepMind',
    providerType: 'gemini',
    category: 'ANALYSIS',
    capabilities: ['scripting', 'storyboard', 'video', 'image', 'audio'],
    quality: 'high',
    speed: 'fast',
    costPerUnit: 2,
    costUnitLabel: 'per command',
    resolutionMax: '4K (3840x2160)',
    durationLimitSec: 300,
    inputTypes: ['text', 'image', 'video', 'audio'],
    outputTypes: ['text', 'plan'],
    availability: 'online',
    isProOnly: false,
    apiConfigured: true,
    requiresApiKey: false,
    badges: ['Fast'],
    description: 'Ultra-fast multimodal reasoning model for intent classification, shot analysis, and creative dialogue suggestions.',
    features: ['Multimodal Shot Analysis', 'Scene Pacing', 'Prompt Engineering', 'Zero Hallucination Guardrails'],
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Deep Cinematic Reasoning)',
    provider: 'Google DeepMind',
    providerType: 'gemini',
    category: 'ANALYSIS',
    capabilities: ['scripting', 'storyboard', 'video', 'upscaling'],
    quality: 'ultra',
    speed: 'balanced',
    costPerUnit: 4,
    costUnitLabel: 'per scene',
    resolutionMax: '4K (3840x2160)',
    durationLimitSec: 600,
    inputTypes: ['text', 'image', 'video', 'audio'],
    outputTypes: ['text', 'plan'],
    availability: 'online',
    isProOnly: true,
    apiConfigured: true,
    requiresApiKey: false,
    badges: ['Quality'],
    description: 'Advanced reasoning for complex scene transitions, color harmonization, and multi-track pacing.',
    features: ['Deep Three-Act Scripting', 'Pacing Optimization', 'Cinematographic Lighting Advice'],
  },
];

export class ModelRegistryService {
  static getAllModels(): ExtendedAIModel[] {
    return AI_MODEL_REGISTRY;
  }

  static getModelById(id: string): ExtendedAIModel | undefined {
    return AI_MODEL_REGISTRY.find(m => m.id === id);
  }

  static getModelsByCategory(category: ModelHubCategory): ExtendedAIModel[] {
    return AI_MODEL_REGISTRY.filter(m => m.category === category);
  }

  static getAvailableModelsForCapability(cap: ModelCapability): ExtendedAIModel[] {
    return AI_MODEL_REGISTRY.filter(m => m.capabilities.includes(cap));
  }

  /**
   * Check if a model is ready to execute based on server-side provider readiness.
   * NEVER returns raw environment variable names or keys.
   */
  static isModelConfigured(modelId: string): {
    configured: boolean;
    message: string;
    suggestedAlternativeId?: string;
  } {
    const model = this.getModelById(modelId);
    if (!model) {
      return { configured: false, message: `Model "${modelId}" was not found in the registry.` };
    }

    if (model.availability === 'maintenance') {
      const fallback = this.getSuggestedFallbackModel(modelId);
      return {
        configured: false,
        message: `${model.name} is currently undergoing scheduled maintenance.`,
        suggestedAlternativeId: fallback?.id,
      };
    }

    const pType = model.providerType || 'gemini';
    if (pType === 'local' || pType === 'gemini') {
      return { configured: true, message: 'Provider ready for generation.' };
    }

    const isProvConfigured = ProviderStatusService.isProviderConfigured(pType);
    if (isProvConfigured) {
      return { configured: true, message: 'Provider ready for generation.' };
    }

    const fallback = this.getSuggestedFallbackModel(modelId);
    return {
      configured: false,
      message: 'Provider setup required. Please try another available model.',
      suggestedAlternativeId: fallback?.id,
    };
  }

  /**
   * Evaluate complete real-time availability state for model cards and router
   */
  static getModelAvailability(
    modelId: string,
    userContext: { isPro: boolean; credits: number; isOwner?: boolean }
  ): ModelAvailabilityCheckResult {
    const model = this.getModelById(modelId);
    if (!model) {
      return {
        state: 'MODEL_NOT_SUPPORTED',
        isReadyToRun: false,
        badgeLabel: 'Unsupported',
        buttonLabel: 'Unavailable',
        userFacingMessage: 'Model not found or unsupported.',
      };
    }

    return ProviderStatusService.evaluateModelAvailability(model, userContext);
  }

  static getSuggestedFallbackModel(modelId: string): ExtendedAIModel | undefined {
    const target = this.getModelById(modelId);
    if (!target) return undefined;

    // Find configured and available model in the same category
    const candidates = AI_MODEL_REGISTRY.filter(
      m =>
        m.id !== modelId &&
        m.category === target.category &&
        m.availability === 'online' &&
        (m.providerType === 'gemini' || m.providerType === 'local' || ProviderStatusService.isProviderConfigured(m.providerType))
    );

    if (candidates.length > 0) {
      // Prefer recommended
      const rec = candidates.find(c => c.badges.includes('Recommended'));
      return rec || candidates[0];
    }

    // Fallback across category to any reliable engine
    return AI_MODEL_REGISTRY.find(m => m.id === 'veo-3.1-lite-generate-preview' || m.id === 'gemini-3.1-flash-image');
  }
}
