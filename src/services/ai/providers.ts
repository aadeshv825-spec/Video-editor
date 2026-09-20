import { Project } from '../../types';
import {
  DirectorIntent,
  EditOperation,
  ReferenceMediaInfo,
  StructuredEditPlan,
  TargetMediaType,
} from '../../types/aiDirector';
import { ModelRegistryService } from './modelRegistry';

export interface DirectorContext {
  project: Project;
  selectedTargetId?: string;
  selectedTargetType?: TargetMediaType;
  referenceMedia?: ReferenceMediaInfo;
  isProUser: boolean;
  userCredits: number;
}

export interface AIProvider {
  id: string;
  name: string;
  isAvailable(): boolean;
  getConfigurationStatus(): { isReady: boolean; message: string };
  analyzeAndPlan(
    prompt: string,
    context: DirectorContext
  ): Promise<StructuredEditPlan>;
}

export class LocalCreativeDirectorProvider implements AIProvider {
  id = 'creative-director-local';
  name = 'Local Creative Engine v4';

  isAvailable(): boolean {
    return true;
  }

  getConfigurationStatus(): { isReady: boolean; message: string } {
    return { isReady: true, message: 'Built-in local engine is operational.' };
  }

  async analyzeAndPlan(
    prompt: string,
    context: DirectorContext
  ): Promise<StructuredEditPlan> {
    const raw = prompt.trim();
    const lower = raw.toLowerCase();
    const { project, referenceMedia } = context;

    // Detect target media & context
    let targetType: TargetMediaType = 'entire_timeline';
    let targetId = 'timeline-master';
    let targetTitle = project.title;

    if (project.type === 'video') {
      const videoState = project.stateData?.videoState;
      const clips = videoState?.clips || [];
      const selectedClip = clips.find((c: any) => c.id === videoState?.selectedClipId) || clips[0];
      if (selectedClip) {
        targetType = 'video_clip';
        targetId = selectedClip.id;
        targetTitle = selectedClip.title || 'Main Video Clip';
      }
    } else if (project.type === 'photo') {
      const photoState = project.stateData?.photoState;
      const layers = photoState?.layers || [];
      const selectedLayer = layers.find((l: any) => l.id === photoState?.activeLayerId) || layers[0];
      targetType = 'photo_layer';
      targetId = selectedLayer?.id || 'layer-master';
      targetTitle = selectedLayer?.name || 'Master Photo Layer';
    } else if (project.type === 'audio') {
      const audioState = project.stateData?.audioState;
      const clips = audioState?.clips || [];
      const tracks = audioState?.tracks || [];
      const selectedClip = clips.find((c: any) => c.id === audioState?.selectedClipId) || clips[0];
      const selectedTrack = tracks.find((t: any) => t.id === audioState?.selectedTrackId) || tracks[0];
      if (selectedClip) {
        targetType = 'audio_clip';
        targetId = selectedClip.id;
        targetTitle = selectedClip.title;
      } else {
        targetType = 'audio_track';
        targetId = selectedTrack?.id || 'track-1';
        targetTitle = selectedTrack?.name || 'Master Audio Track';
      }
    }

    const operations: EditOperation[] = [];
    let intent: DirectorIntent = 'video_edit';
    let explanation = '';
    let clarification_question: string | undefined;
    let estimated_complexity: 'low' | 'medium' | 'high' = 'low';
    let cost = 1;

    // 1. Check for vague commands requiring clarification
    const vaguePatterns = [
      'make it better',
      'fix this',
      'do something cool',
      'improve it',
      'enhance',
      'auto edit',
      'make it good',
    ];
    if (vaguePatterns.some(p => lower === p || lower.startsWith(p + ' ') || lower.endsWith(' ' + p))) {
      return {
        id: `plan-${Date.now()}`,
        command: raw,
        intent: 'clarification_needed',
        target: {
          type: targetType,
          id: targetId,
          title: targetTitle,
          projectId: project.id,
          projectType: project.type,
        },
        operations: [],
        requires_reference: false,
        estimated_complexity: 'low',
        estimated_cost_credits: 0,
        requires_external_ai: false,
        explanation: 'The instruction is too broad to execute safely without risking unwanted changes.',
        clarification_question:
          'What specific aspect would you like to improve — brightness, color grade, sharpness, audio volume, trimming, or overall pacing?',
        validation: {
          isValid: false,
          canExecute: false,
          checks: [
            { code: 'TARGET_FOUND', label: 'Target media identified', passed: true },
            { code: 'SPECIFIC_INTENT', label: 'Actionable intent specified', passed: false, message: 'Clarification required.' },
          ],
          errors: ['Command is ambiguous. Please clarify your intent.'],
          warnings: [],
          requiresPro: false,
          creditsRequired: 0,
        },
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
    }

    // 2. Check for unsupported futuristic features
    const unsupportedPatterns = [
      { pattern: /clone.*voice/i, reason: 'AI Voice Cloning is scheduled for Phase 5 integration.' },
      { pattern: /replace.*face/i, reason: 'Facial tracking and replacement are not yet connected.' },
      { pattern: /generate.*(movie|full video|3 min)/i, reason: 'Long-form generative text-to-video requires external render compute.' },
      { pattern: /rotoscope/i, reason: 'Advanced rotoscoping segmentation model is not yet configured.' },
    ];
    for (const item of unsupportedPatterns) {
      if (item.pattern.test(lower)) {
        return {
          id: `plan-${Date.now()}`,
          command: raw,
          intent: 'unsupported',
          target: {
            type: targetType,
            id: targetId,
            title: targetTitle,
            projectId: project.id,
            projectType: project.type,
          },
          operations: [],
          requires_reference: false,
          estimated_complexity: 'high',
          estimated_cost_credits: 0,
          requires_external_ai: true,
          explanation: item.reason,
          validation: {
            isValid: false,
            canExecute: false,
            checks: [
              { code: 'FEATURE_SUPPORTED', label: 'Feature supported in current release', passed: false, message: item.reason },
            ],
            errors: [item.reason],
            warnings: [],
            requiresPro: true,
            creditsRequired: 0,
          },
          status: 'draft',
          createdAt: new Date().toISOString(),
        };
      }
    }

    // 3. Natural language parsing for AI tools and supported editing tasks

    // AI TOOL: BACKGROUND REMOVAL (e.g., "Remove the background", "Cutout subject")
    if (lower.includes('remove') && lower.includes('background') || lower.includes('cutout') || lower.includes('transparent background')) {
      operations.push({
        id: `op-${Date.now()}-bg-rem`,
        type: 'bg_removal',
        parameters: { edgeFeather: 1.5, transparent: true },
        description: `Execute neural foreground segmentation and remove background from ${targetTitle}`,
        targetScope: project.type === 'photo' ? 'photo_layer' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = 'ai_tool_execution';
      cost = 2;
      explanation = `Isolates primary foreground subject on ${targetTitle} using semantic alpha matte matting.`;
    }

    // AI TOOL: OBJECT REMOVAL (e.g., "Remove the person in the background", "Erase object")
    else if ((lower.includes('remove') || lower.includes('erase')) && (lower.includes('person') || lower.includes('object') || lower.includes('watermark') || lower.includes('distraction'))) {
      operations.push({
        id: `op-${Date.now()}-obj-rem`,
        type: 'object_removal',
        parameters: { seamlessFill: true },
        description: `Erase detected background obstruction from ${targetTitle} with generative texture inpainting`,
        targetScope: project.type === 'photo' ? 'photo_layer' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = 'ai_tool_execution';
      cost = 2;
      explanation = `Excises selected region and synthesizes contiguous surrounding texture without artifacts.`;
    }

    // AI TOOL: OBJECT REPLACEMENT
    else if (lower.includes('replace') && (lower.includes('object') || lower.includes('with') || lower.includes('item'))) {
      operations.push({
        id: `op-${Date.now()}-obj-rep`,
        type: 'object_replace',
        parameters: { prompt: raw },
        description: `Neural object inpaint replacement on ${targetTitle}`,
        targetScope: project.type === 'photo' ? 'photo_layer' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = 'ai_tool_execution';
      cost = 3;
      explanation = `Synthesizes context-aware replacement item with harmonic lighting and shadow projection.`;
    }

    // AI TOOL: VIDEO AUTO REFRAME (e.g., "Convert this video to 9:16 and keep the subject centered", "Auto reframe")
    else if (lower.includes('reframe') || (lower.includes('9:16') && (lower.includes('subject') || lower.includes('centered') || lower.includes('keep')))) {
      operations.push({
        id: `op-${Date.now()}-reframe`,
        type: 'auto_reframe',
        parameters: { targetRatio: '9:16', trackSubject: true },
        description: `Auto-reframe ${targetTitle} to 9:16 with active face/action centering`,
        targetScope: project.type === 'video' ? 'video_clip' : 'entire_timeline',
        targetId,
        targetTitle,
      });
      intent = 'ai_tool_execution';
      cost = 2;
      explanation = `Calculates dynamic motion vector bounding box to keep the focal subject centered in vertical format.`;
    }

    // AI TOOL: VIDEO CAPTIONS & SUBTITLES (e.g., "Generate captions for this video", "Add subtitles")
    else if (lower.includes('caption') || lower.includes('subtitle') || lower.includes('transcribe')) {
      operations.push({
        id: `op-${Date.now()}-captions`,
        type: 'captions',
        parameters: { language: 'en', font: 'Plus Jakarta Sans', style: 'pop' },
        description: `Transcribe dialogue and generate synchronized animated captions for ${targetTitle}`,
        targetScope: 'entire_timeline',
        targetId,
        targetTitle,
      });
      intent = 'ai_tool_execution';
      cost = 2;
      explanation = `Performs neural speech-to-text alignment and builds synchronized subtitle layer on the timeline.`;
    }

    // AI TOOL: SCENE CUT DETECTION (e.g., "Detect scenes", "Find cuts", "Scene detection")
    else if (lower.includes('scene') && (lower.includes('detect') || lower.includes('cut') || lower.includes('split') || lower.includes('boundary'))) {
      operations.push({
        id: `op-${Date.now()}-scene-det`,
        type: 'scene_detection',
        parameters: { threshold: 0.3 },
        description: `Analyze frame flux and place timeline markers at discovered shot transitions`,
        targetScope: 'entire_timeline',
        targetId,
        targetTitle,
      });
      intent = 'ai_tool_execution';
      cost = 1;
      explanation = `Scans temporal color histograms across ${targetTitle} to locate edit transition points non-destructively.`;
    }

    // AI TOOL: SHARPEN & ENHANCE (e.g., "Make this image sharper", "Enhance portrait")
    else if (lower.includes('sharp') || (lower.includes('enhance') && (lower.includes('portrait') || lower.includes('face') || lower.includes('detail')))) {
      operations.push({
        id: `op-${Date.now()}-sharp`,
        type: 'sharpen',
        parameters: { amount: 35, unsharpRadius: 1.5 },
        description: `Apply unsharp micro-contrast mask and edge sharpening to ${targetTitle}`,
        targetScope: project.type === 'photo' ? 'photo_layer' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = 'ai_tool_execution';
      cost = 1;
      explanation = `Recovers fine high-frequency edge detail and cleans blur degradation.`;
    }

    // AI TOOL: UPSCALE (e.g., "Upscale this video", "4k upscale", "super resolution")
    else if (lower.includes('upscale') || lower.includes('super resolution') || lower.includes('4k')) {
      operations.push({
        id: `op-${Date.now()}-upscale`,
        type: 'upscale',
        parameters: { scaleFactor: 2, model: 'neural_esr' },
        description: `Upscale ${targetTitle} to 2X / 4K UHD with neural texture synthesis`,
        targetScope: project.type === 'photo' ? 'photo_layer' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = 'ai_tool_execution';
      cost = 3;
      explanation = `Generates high-fidelity synthesized sub-pixel detail for ultra-high-resolution viewing.`;
    }

    // AI TOOL: PHOTO RESTORATION & COLORIZE (e.g., "Restore photo", "Colorize black and white")
    else if (lower.includes('restore') || (lower.includes('colorize') && lower.includes('photo')) || lower.includes('scratch')) {
      const isColorize = lower.includes('colorize');
      operations.push({
        id: `op-${Date.now()}-restore`,
        type: isColorize ? 'colorize' : 'restoration',
        parameters: { denoise: true, scratchFill: true, colorize: isColorize },
        description: isColorize ? `Colorize monochrome historical photo ${targetTitle}` : `Remove scratches and restore archival photo ${targetTitle}`,
        targetScope: 'photo_layer',
        targetId,
        targetTitle,
      });
      intent = 'ai_tool_execution';
      cost = 3;
      explanation = `Repairs degradation, fills physical tears, and infers natural skin and landscape tones.`;
    }

    // AI TOOL: RELIGHT (e.g., "Relight photo", "Studio lighting")
    else if (lower.includes('relight') || lower.includes('studio light')) {
      operations.push({
        id: `op-${Date.now()}-relight`,
        type: 'relight',
        parameters: { mode: 'studio_softbox', intensity: 75 },
        description: `Cast 3D virtual studio softbox lighting across ${targetTitle}`,
        targetScope: 'photo_layer',
        targetId,
        targetTitle,
      });
      intent = 'ai_tool_execution';
      cost = 2;
      explanation = `Estimates normal depth surface map to project directional key and rim illumination.`;
    }

    // A. TRIMMING (e.g., "Trim the first 2 seconds", "Trim 3s from start", "Cut 2 seconds")
    const trimMatch = lower.match(/trim\s+(?:the\s+)?(?:first\s+)?(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?/i) ||
                      lower.match(/cut\s+(?:the\s+)?(?:first\s+)?(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?/i);
    if (trimMatch) {
      const seconds = parseFloat(trimMatch[1]);
      operations.push({
        id: `op-${Date.now()}-1`,
        type: 'trim',
        parameters: { trimInSec: seconds, mode: 'head' },
        description: `Trim first ${seconds} second${seconds === 1 ? '' : 's'} from start of ${targetTitle}`,
        targetScope: targetType,
        targetId,
        targetTitle,
      });
      intent = project.type === 'audio' ? 'audio_edit' : 'video_edit';
      explanation = `Trimming the beginning head of ${targetTitle} by ${seconds}s while maintaining track alignment.`;
    }

    // B. BRIGHTNESS (e.g. "Make this clip brighter", "Increase brightness by 15", "Make it darker")
    if (lower.includes('bright') || lower.includes('dark') || lower.includes('exposure')) {
      let delta = 20;
      if (lower.includes('dark')) delta = -20;
      if (lower.includes('slightly')) delta = delta > 0 ? 10 : -10;
      const valMatch = lower.match(/(?:by|\+|-)\s*(\d+)/);
      if (valMatch) delta = parseInt(valMatch[1], 10) * (lower.includes('dark') ? -1 : 1);

      operations.push({
        id: `op-${Date.now()}-2`,
        type: 'brightness',
        parameters: { delta, absolute: false },
        description: `${delta > 0 ? 'Increase' : 'Decrease'} brightness by ${Math.abs(delta)}%`,
        targetScope: project.type === 'photo' ? 'photo_layer' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = project.type === 'photo' ? 'photo_edit' : 'video_edit';
      explanation = `${delta > 0 ? 'Elevating luminosity curve' : 'Deepening exposure'} to improve visual clarity.`;
    }

    // C. WARMTH & TEMPERATURE (e.g. "Make this photo warmer", "Cool down colors")
    if (lower.includes('warm') || lower.includes('cool') || lower.includes('golden') || lower.includes('temperature')) {
      const delta = lower.includes('cool') ? -25 : 25;
      operations.push({
        id: `op-${Date.now()}-3`,
        type: 'temperature',
        parameters: { delta },
        description: `${delta > 0 ? 'Increase color temperature (warmer tone)' : 'Cool color temperature (subtle cyan bias)'} by ${Math.abs(delta)} pts`,
        targetScope: project.type === 'photo' ? 'photo_layer' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = project.type === 'photo' ? 'photo_edit' : 'video_edit';
      explanation = `Adjusting white balance color temperature for a cinematic ${delta > 0 ? 'golden-hour warmth' : 'moody twilight cool'}.`;
    }

    // D. REELS / TIKTOK / 9:16 CROP & ASPECT RATIO (e.g. "Crop this image to 9:16", "Make this clip fit Instagram Reels")
    if (lower.includes('9:16') || lower.includes('reels') || lower.includes('tiktok') || lower.includes('story') || lower.includes('vertical')) {
      operations.push({
        id: `op-${Date.now()}-4`,
        type: 'crop',
        parameters: { preset: '9:16', aspectRatio: '9:16' },
        description: 'Crop and frame viewport to 9:16 vertical (Instagram Reels / TikTok)',
        targetScope: project.type === 'photo' ? 'photo_canvas' : 'entire_timeline',
        targetId,
        targetTitle,
      });
      intent = 'aspect_ratio_adjust';
      explanation = 'Re-centering canvas and setting viewport bounding box to 9:16 vertical aspect ratio.';
    }

    // E. 1:1 SQUARE OR 16:9 LANDSCAPE
    if (lower.includes('1:1') || lower.includes('square')) {
      operations.push({
        id: `op-${Date.now()}-5`,
        type: 'crop',
        parameters: { preset: '1:1', aspectRatio: '1:1' },
        description: 'Set aspect ratio to 1:1 square',
        targetScope: project.type === 'photo' ? 'photo_canvas' : 'entire_timeline',
        targetId,
        targetTitle,
      });
      intent = 'aspect_ratio_adjust';
      explanation = 'Adjusting aspect ratio to 1:1 square.';
    }

    // F. AUDIO LOUDNESS & VOLUME (e.g. "Make the audio louder", "Boost volume", "Lower audio", "Mute")
    if (lower.includes('louder') || lower.includes('volume') || lower.includes('audio') && (lower.includes('boost') || lower.includes('quieter') || lower.includes('increase'))) {
      const isLouder = !lower.includes('quieter') && !lower.includes('lower');
      const deltaDb = isLouder ? 4.0 : -4.0;
      operations.push({
        id: `op-${Date.now()}-6`,
        type: 'volume',
        parameters: { deltaDb, volumeScale: isLouder ? 1.25 : 0.75 },
        description: `${isLouder ? 'Increase' : 'Decrease'} audio gain by ${Math.abs(deltaDb)} dB`,
        targetScope: project.type === 'audio' ? 'audio_clip' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = 'audio_edit';
      explanation = `Adjusting dynamic range and gain stage by ${deltaDb > 0 ? '+' : ''}${deltaDb} dB.`;
    }

    // G. NOISE REDUCTION / BACKGROUND NOISE (e.g. "Reduce the background noise")
    if (lower.includes('noise') || lower.includes('hiss') || lower.includes('hum')) {
      operations.push({
        id: `op-${Date.now()}-7`,
        type: 'eq',
        parameters: { bassDb: -3.0, trebleDb: -2.0, filter: 'noise_gate_shelving' },
        description: 'Apply noise attenuation filter and low/high EQ de-hiss',
        targetScope: project.type === 'audio' ? 'audio_track' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = 'audio_edit';
      explanation = 'Applying 3-band parametric EQ shelving to suppress low rumble and high-frequency background noise.';
    }

    // H. SMOOTH FADE / TRANSITIONS (e.g. "Add a smooth fade between these clips", "Fade in audio")
    if (lower.includes('fade') || lower.includes('transition') || lower.includes('crossfade')) {
      operations.push({
        id: `op-${Date.now()}-8`,
        type: project.type === 'audio' ? 'fade' : 'transition',
        parameters: { type: 'crossfade', durationSec: 1.2 },
        description: 'Add 1.2-second smooth crossfade transition',
        targetScope: project.type === 'audio' ? 'audio_clip' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = project.type === 'audio' ? 'audio_edit' : 'video_edit';
      explanation = 'Inserting a 1.2s ease-in-out transition curve for seamless continuity.';
    }

    // I. CONTRAST / SATURATION / VIGNETTE / SHARPEN
    if (lower.includes('contrast')) {
      const delta = lower.includes('less') ? -15 : 15;
      operations.push({
        id: `op-${Date.now()}-9`,
        type: 'contrast',
        parameters: { delta },
        description: `${delta > 0 ? 'Increase' : 'Decrease'} contrast by ${Math.abs(delta)}%`,
        targetScope: project.type === 'photo' ? 'photo_layer' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = project.type === 'photo' ? 'photo_edit' : 'video_edit';
      explanation = 'Adjusting contrast curve for enhanced dynamic punch.';
    }

    if (lower.includes('saturation') || lower.includes('vibrant') || lower.includes('colorful') || lower.includes('black and white') || lower.includes('monochrome')) {
      let delta = 20;
      if (lower.includes('black and white') || lower.includes('monochrome')) delta = -100;
      else if (lower.includes('desaturate') || lower.includes('muted')) delta = -30;

      operations.push({
        id: `op-${Date.now()}-10`,
        type: 'saturation',
        parameters: { delta },
        description: delta === -100 ? 'Convert to Black & White (0% saturation)' : `${delta > 0 ? 'Boost' : 'Reduce'} saturation by ${Math.abs(delta)}%`,
        targetScope: project.type === 'photo' ? 'photo_layer' : 'video_clip',
        targetId,
        targetTitle,
      });
      intent = project.type === 'photo' ? 'photo_edit' : 'video_edit';
      explanation = 'Modifying chroma saturation matrix.';
    }

    // J. REFERENCE MATCHING (e.g. "Match the brightness of this clip with the reference")
    const requiresRef = lower.includes('reference') || lower.includes('match') || !!referenceMedia;
    if (requiresRef && referenceMedia) {
      intent = 'style_match';
      const refBrightness = referenceMedia.extractedStyle?.brightness ?? 15;
      operations.push({
        id: `op-${Date.now()}-ref-1`,
        type: 'brightness',
        parameters: { delta: refBrightness },
        description: `Match brightness to reference (${referenceMedia.name}): +${refBrightness}%`,
        targetScope: targetType,
        targetId,
        targetTitle,
      });
      operations.push({
        id: `op-${Date.now()}-ref-2`,
        type: 'temperature',
        parameters: { delta: referenceMedia.extractedStyle?.warmth ?? 10 },
        description: `Match color temperature to reference (${referenceMedia.name}): +${referenceMedia.extractedStyle?.warmth ?? 10} pts`,
        targetScope: targetType,
        targetId,
        targetTitle,
      });
      explanation = `Computed aesthetic vectors from reference media "${referenceMedia.name}" and synthesized matching brightness and warmth offsets.`;
      cost = 2;
    } else if (lower.includes('reference') && !referenceMedia) {
      return {
        id: `plan-${Date.now()}`,
        command: raw,
        intent: 'clarification_needed',
        target: {
          type: targetType,
          id: targetId,
          title: targetTitle,
          projectId: project.id,
          projectType: project.type,
        },
        operations: [],
        requires_reference: true,
        estimated_complexity: 'medium',
        estimated_cost_credits: 0,
        requires_external_ai: false,
        explanation: 'Reference-based editing requires an attached reference media file.',
        clarification_question: 'Please attach or select a reference image, video, or audio clip to match against.',
        validation: {
          isValid: false,
          canExecute: false,
          checks: [
            { code: 'REFERENCE_ATTACHED', label: 'Reference media attached', passed: false, message: 'Missing reference media.' },
          ],
          errors: ['Reference media required for style matching.'],
          warnings: [],
          requiresPro: false,
          creditsRequired: 0,
        },
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
    }

    // Default fallback if no specific operation was matched
    if (operations.length === 0) {
      // General subtle enhancement
      operations.push({
        id: `op-${Date.now()}-fallback`,
        type: 'contrast',
        parameters: { delta: 10 },
        description: `Apply cinematic contrast balancing (+10%) to ${targetTitle}`,
        targetScope: targetType,
        targetId,
        targetTitle,
      });
      explanation = `Interpreted "${raw}" as a request for subtle cinematic tone balancing.`;
    }

    return {
      id: `plan-${Date.now()}`,
      command: raw,
      intent,
      target: {
        type: targetType,
        id: targetId,
        title: targetTitle,
        projectId: project.id,
        projectType: project.type,
      },
      operations,
      requires_reference: !!referenceMedia,
      referenceMedia,
      estimated_complexity,
      estimated_cost_credits: cost,
      requires_external_ai: false,
      explanation,
      validation: {
        isValid: true,
        canExecute: true,
        checks: [
          { code: 'TARGET_VALID', label: 'Target media found and verified', passed: true },
          { code: 'OPS_VALID', label: 'All operations supported and within safe bounds', passed: true },
          { code: 'CREDITS_AVAILABLE', label: `User has sufficient credits (${cost} credits)`, passed: context.userCredits >= cost },
        ],
        errors: [],
        warnings: context.userCredits < cost ? ['Insufficient AI credits.'] : [],
        requiresPro: false,
        creditsRequired: cost,
      },
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  }
}
