/**
 * Capability-Accurate Fallback Service
 *
 * Enforces strict honesty about AI model capabilities.
 * NEVER falsely claims Google/Gemini or Local Engine can replace every
 * proprietary Runway/OpenAI/ElevenLabs/Flux/Anthropic/Stability feature.
 *
 * Categorizes fallbacks strictly as:
 * - TRUE_EQUIVALENT: Same capability supported. Automatic fallback is allowed.
 * - PARTIAL_ALTERNATIVE: Approximate capability with clear user disclosure (never silently substituted; confirmation required).
 * - NO_EQUIVALENT: No genuine equivalent exists; displays "Compatible provider setup required for this operation."
 */

export type FallbackAccuracyLevel = 'TRUE_EQUIVALENT' | 'PARTIAL_ALTERNATIVE' | 'NO_EQUIVALENT';

export interface CapabilityFallbackResolution {
  accuracy: FallbackAccuracyLevel;
  canFallback: boolean;
  isAutomaticAllowed: boolean;
  targetModelId?: string;
  targetModelName?: string;
  targetProvider?: string;
  userMessage: string;
  technicalDetails?: string;
}

interface CapabilityMapping {
  requestedModelId: string;
  taskType: string;
  accuracy: FallbackAccuracyLevel;
  fallbackModelId?: string;
  fallbackModelName?: string;
  fallbackProvider?: string;
  userNotice?: string;
  technicalDifference?: string;
}

const CAPABILITY_MAPPINGS: CapabilityMapping[] = [
  // ==================== 1. RUNWAY -> VEO ====================
  {
    requestedModelId: 'runway-gen3-alpha',
    taskType: 'text_to_video',
    accuracy: 'PARTIAL_ALTERNATIVE',
    fallbackModelId: 'veo-3.1-lite-generate-preview',
    fallbackModelName: 'Google Veo 3.1 Lite',
    fallbackProvider: 'Google DeepMind',
    userNotice:
      'Runway Gen-3 is unavailable. Google Veo 3.1 Lite can generate cinematic text-to-video, but motion characteristics, temporal diffusion, and camera dynamics will differ.',
    technicalDifference: 'Veo uses Google latent video diffusion; Runway Gen-3 features proprietary temporal motion smoothing.',
  },
  {
    requestedModelId: 'runway-gen3-turbo',
    taskType: 'text_to_video',
    accuracy: 'PARTIAL_ALTERNATIVE',
    fallbackModelId: 'veo-3.1-lite-generate-preview',
    fallbackModelName: 'Google Veo 3.1 Lite',
    fallbackProvider: 'Google DeepMind',
    userNotice:
      'Runway Gen-3 Turbo is unavailable. Google Veo 3.1 Lite is offered as an alternative video synthesis method with different motion characteristics.',
    technicalDifference: 'High-speed temporal sampling differs from Runway Turbo scheduling.',
  },
  {
    requestedModelId: 'runway-gen3-alpha',
    taskType: 'video_to_video', // Video style transfer / motion brush
    accuracy: 'NO_EQUIVALENT',
    userNotice: 'Compatible provider setup is required for this operation (video-to-video motion transfer).',
    technicalDifference: 'Motion brush and latent video-to-video transfer are proprietary to Runway Gen-3.',
  },

  // ==================== 2. FLUX/BFL -> GEMINI IMAGE GENERATION ====================
  {
    requestedModelId: 'flux-1.1-pro',
    taskType: 'text_to_image',
    accuracy: 'PARTIAL_ALTERNATIVE',
    fallbackModelId: 'gemini-3.1-flash-image',
    fallbackModelName: 'Gemini 3.1 Flash Image',
    fallbackProvider: 'Google DeepMind',
    userNotice:
      'Flux 1.1 Pro is unavailable. Gemini Flash Image can synthesize images, but prompt weighting, typography rendering, and photorealistic latent color science differ from BFL Flux flow-matching.',
    technicalDifference: 'Flux uses 12B parameter rectified flow transformers; Gemini Flash Image uses Google multimodal latent diffusion.',
  },
  {
    requestedModelId: 'flux-schnell',
    taskType: 'text_to_image',
    accuracy: 'PARTIAL_ALTERNATIVE',
    fallbackModelId: 'gemini-3.1-flash-image',
    fallbackModelName: 'Gemini 3.1 Flash Image',
    fallbackProvider: 'Google DeepMind',
    userNotice:
      'Flux Schnell is unavailable. Using Gemini Flash Image as an alternative generation method with different latent aesthetics.',
    technicalDifference: 'Flow matching step count differs from Gemini Flash diffusion schedule.',
  },
  {
    requestedModelId: 'flux-1.1-pro',
    taskType: 'controlnet_guidance',
    accuracy: 'NO_EQUIVALENT',
    userNotice: 'Compatible provider setup is required for this operation.',
    technicalDifference: 'BFL Flux specific LoRA and ControlNet guidance adapters are not supported in standard diffusion fallbacks.',
  },

  // ==================== 3. ELEVENLABS -> NEURAL TTS / AUDIO ====================
  {
    requestedModelId: 'elevenlabs-voice-v2',
    taskType: 'tts_speech',
    accuracy: 'PARTIAL_ALTERNATIVE',
    fallbackModelId: 'gemini-3.1-flash-tts-preview',
    fallbackModelName: 'Google Gemini Flash TTS',
    fallbackProvider: 'Google DeepMind',
    userNotice:
      'ElevenLabs Voice is unavailable. Google Gemini Flash TTS will synthesize natural neural speech. Note: Custom voice cloning profiles, cloned actor IDs, and emotion sliders are not supported by the fallback engine.',
    technicalDifference: 'Gemini Flash TTS provides expressive prosody but does not support ElevenLabs voice clone weights.',
  },
  {
    requestedModelId: 'elevenlabs-voice-v2',
    taskType: 'voice_cloning',
    accuracy: 'NO_EQUIVALENT',
    userNotice: 'Compatible provider setup is required for this operation (custom voice cloning).',
    technicalDifference: 'Instant voice cloning and speaker embeddings are proprietary to ElevenLabs.',
  },
  {
    requestedModelId: 'elevenlabs-spatial-sfx',
    taskType: 'sound_effect',
    accuracy: 'PARTIAL_ALTERNATIVE',
    fallbackModelId: 'creative-director-local',
    fallbackModelName: 'Vyro Acoustic Spatial WebAudio Engine',
    fallbackProvider: 'Local Studio',
    userNotice:
      'ElevenLabs SFX is unavailable. VYRO will synthesize procedural spatial acoustic stereo audio stems using the built-in Web Audio engine.',
    technicalDifference: 'Acoustic procedural synthesis differs from neural diffusion sound effect generation.',
  },

  // ==================== 4. OPENAI -> GOOGLE/GEMINI ====================
  {
    requestedModelId: 'openai-sora-turbo',
    taskType: 'text_to_video',
    accuracy: 'PARTIAL_ALTERNATIVE',
    fallbackModelId: 'veo-3.1-lite-generate-preview',
    fallbackModelName: 'Google Veo 3.1 Lite',
    fallbackProvider: 'Google DeepMind',
    userNotice:
      'Sora Turbo is unavailable. Google Veo 3.1 Lite provides cinematic video synthesis, but physical simulation dynamics and extended scene continuity differ.',
    technicalDifference: 'Sora 3D spacetime patch diffusion differs from Veo latent diffusion representations.',
  },
  {
    requestedModelId: 'openai-sora-turbo',
    taskType: 'world_simulation_3d',
    accuracy: 'NO_EQUIVALENT',
    userNotice: 'Compatible provider setup is required for this operation.',
    technicalDifference: 'Simulating persistent 3D world physics geometry is not available in basic video generation models.',
  },
  {
    requestedModelId: 'dall-e-3',
    taskType: 'text_to_image',
    accuracy: 'PARTIAL_ALTERNATIVE',
    fallbackModelId: 'gemini-3.1-flash-image',
    fallbackModelName: 'Gemini 3.1 Flash Image',
    fallbackProvider: 'Google DeepMind',
    userNotice:
      'DALL-E 3 is unavailable. Gemini Flash Image can synthesize images with high fidelity, though stylistic priors and prompt expansion differ.',
    technicalDifference: 'DALL-E 3 uses automated GPT prompt rewrites; Gemini Flash Image parses prompt semantics directly.',
  },

  // ==================== 5. ANTHROPIC -> GOOGLE/GEMINI ====================
  {
    requestedModelId: 'claude-3.7-sonnet-screenplay',
    taskType: 'director_plan',
    accuracy: 'TRUE_EQUIVALENT',
    fallbackModelId: 'gemini-3.1-pro-preview',
    fallbackModelName: 'Gemini 3.1 Pro (Deep Cinematic Reasoning)',
    fallbackProvider: 'Google DeepMind',
    userNotice:
      'Seamlessly routed to Google Gemini 3.1 Pro for high-order multimodal screenplay planning and non-destructive editing commands.',
    technicalDifference: 'Gemini 3.1 Pro provides equivalent high-order multimodal reasoning and strict JSON structured plan output.',
  },

  // ==================== 6. STABILITY AI -> GOOGLE/LOCAL ENGINES ====================
  {
    requestedModelId: 'sd-3.5-large',
    taskType: 'text_to_image',
    accuracy: 'PARTIAL_ALTERNATIVE',
    fallbackModelId: 'gemini-3.1-flash-image',
    fallbackModelName: 'Gemini 3.1 Flash Image',
    fallbackProvider: 'Google DeepMind',
    userNotice:
      'Stability AI SD 3.5 Large is unavailable. Gemini Flash Image is offered as an alternative, but latent noise schedules and photorealistic stylization differ.',
    technicalDifference: 'SD 3.5 MMDiT architecture differs from Google Flash Image multimodal transformer diffusion.',
  },
  {
    requestedModelId: 'sd-3.5-large',
    taskType: 'latent_depth_control',
    accuracy: 'NO_EQUIVALENT',
    userNotice: 'Compatible provider setup is required for this operation.',
    technicalDifference: 'Direct latent depth map conditioning requires proprietary Stability AI ControlNet pipelines.',
  },
];

export class CapabilityFallbackService {
  /**
   * Resolves fallback model and capability accuracy for a requested model
   */
  public static resolveFallback(
    requestedModelId: string,
    taskType: string = 'text_to_video'
  ): CapabilityFallbackResolution {
    // 1. First look for exact match on requested model and specific taskType
    let match = CAPABILITY_MAPPINGS.find(
      m => m.requestedModelId === requestedModelId && m.taskType === taskType
    );

    // 2. If not found, look for generic/primary model mapping
    if (!match) {
      match = CAPABILITY_MAPPINGS.find(m => m.requestedModelId === requestedModelId);
    }

    if (!match) {
      return {
        accuracy: 'NO_EQUIVALENT',
        canFallback: false,
        isAutomaticAllowed: false,
        userMessage: 'Compatible provider setup is required for this operation.',
      };
    }

    if (match.accuracy === 'NO_EQUIVALENT' || !match.fallbackModelId) {
      return {
        accuracy: 'NO_EQUIVALENT',
        canFallback: false,
        isAutomaticAllowed: false,
        userMessage: match.userNotice || 'Compatible provider setup is required for this operation.',
        technicalDetails: match.technicalDifference,
      };
    }

    return {
      accuracy: match.accuracy,
      canFallback: true,
      isAutomaticAllowed: match.accuracy === 'TRUE_EQUIVALENT',
      targetModelId: match.fallbackModelId,
      targetModelName: match.fallbackModelName,
      targetProvider: match.fallbackProvider,
      userMessage: match.userNotice || 'Using a compatible alternative model.',
      technicalDetails: match.technicalDifference,
    };
  }
}

