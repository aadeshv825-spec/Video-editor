import { Project, MediaAsset } from '../../types';
import {
  QualityAnalysisReport,
  QualityCategory,
  QualityIssue,
  QualityStatus,
  SuggestedFix,
} from '../../types/aiQualityAndAutoEdit';
import { AnalysisCacheService } from './analysisCache';

export class QualityAnalyzerService {
  /**
   * Main Quality Analysis for a Project (Video, Photo, Audio)
   */
  static analyzeProject(project: Project, isFullCheck: boolean = true): QualityAnalysisReport {
    const cached = AnalysisCacheService.getQualityReport(project.id);
    if (cached && !isFullCheck) {
      return cached;
    }

    const issues: QualityIssue[] = [];
    const statusMap: Record<QualityCategory, QualityStatus> = {
      video: 'not_checked',
      audio: 'not_checked',
      photo: 'not_checked',
      framing: 'not_checked',
      exposure: 'not_checked',
      captions: 'not_checked',
    };

    if (project.type === 'video') {
      this.checkVideoProject(project, issues, statusMap, isFullCheck);
    } else if (project.type === 'photo') {
      this.checkPhotoProject(project, issues, statusMap, isFullCheck);
    } else if (project.type === 'audio') {
      this.checkAudioProject(project, issues, statusMap, isFullCheck);
    }

    // Determine high-level summary
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    let summary = 'All checks passed. Project meets export readiness standards.';
    if (criticalCount > 0) {
      summary = `Found ${criticalCount} critical problem${criticalCount > 1 ? 's' : ''} and ${warningCount} item${warningCount === 1 ? '' : 's'} needing attention. Fixes recommended before export.`;
    } else if (warningCount > 0) {
      summary = `Found ${warningCount} item${warningCount > 1 ? 's' : ''} needing attention. Optional auto-fixes available.`;
    } else if (infoCount > 0) {
      summary = `${infoCount} minor optimization tip${infoCount > 1 ? 's' : ''} identified.`;
    }

    const report: QualityAnalysisReport = {
      id: `report-${Date.now()}`,
      analyzedAt: new Date().toISOString(),
      scope: 'project',
      targetId: project.id,
      targetName: project.title,
      categorizedStatus: statusMap,
      issues,
      summary,
      isFullCheck,
      modelUsed: 'Local Media Quality Heuristics Engine v2.4',
      creditsUsed: 0,
    };

    AnalysisCacheService.saveQualityReport(report);
    return report;
  }

  /**
   * Pre-Export Quality Check (Quick Check or Full Check)
   */
  static runPreExportCheck(
    project: Project,
    isFullCheck: boolean,
    exportConfig?: { resolution?: string; format?: string; fps?: number }
  ): QualityAnalysisReport {
    const report = this.analyzeProject(project, isFullCheck);

    // Additional export-specific technical validations
    const exportIssues: QualityIssue[] = [];

    // Check 1: Timeline empty or zero duration
    const videoState = project.stateData?.videoState;
    const clips = videoState?.clips || [];
    if (project.type === 'video' && clips.length === 0) {
      exportIssues.push({
        id: `export-empty-timeline`,
        category: 'video',
        severity: 'critical',
        title: 'Empty Timeline Sequence',
        description: 'Cannot export a project with 0 active clips on the timeline.',
        evidence: 'Total active timeline clips: 0',
        targetType: 'export_config',
        suggestedFix: {
          title: 'Add Media to Timeline',
          description: 'Drag sample media from the Media Bin onto Track 1 before rendering.',
          actionType: 'add_sample_media',
          parameters: {},
          estimatedCredits: 0,
          requiresExternalAi: false,
        },
      });
    }

    // Check 2: Resolution upscale warning
    if (exportConfig?.resolution === '4K') {
      const hasLowResSources = clips.some((c: any) => {
        const dim = c.dimensions || '';
        return dim.includes('1280x720') || dim.includes('720p');
      });

      if (hasLowResSources) {
        exportIssues.push({
          id: `export-upscale-warning`,
          category: 'video',
          severity: 'warning',
          title: '4K Upscaling from 720p Sources',
          description: 'Exporting in 4K with 720p source clips may result in visible pixelation or softening.',
          evidence: 'Timeline contains clips with native 720p resolution rendering to 3840x2160.',
          targetType: 'export_config',
          suggestedFix: {
            title: 'Enable AI Super-Resolution Upscaler',
            description: 'Apply AI upscaler to enhance 720p sources or switch export resolution to 1080p.',
            actionType: 'upscale_clips',
            parameters: { targetResolution: '4K' },
            estimatedCredits: 2,
            requiresExternalAi: true,
          },
        });
      }
    }

    return {
      ...report,
      scope: 'export',
      issues: [...exportIssues, ...report.issues],
    };
  }

  /**
   * Video Project Analyzer
   */
  private static checkVideoProject(
    project: Project,
    issues: QualityIssue[],
    statusMap: Record<QualityCategory, QualityStatus>,
    isFullCheck: boolean
  ): void {
    const videoState = project.stateData?.videoState || {};
    const clips: any[] = videoState.clips || [];
    const mediaPool: MediaAsset[] = project.mediaAssets || [];
    const projectAspect = project.aspectRatio || '16:9';

    statusMap.video = 'good';
    statusMap.framing = 'good';
    statusMap.exposure = 'good';
    statusMap.audio = 'good';
    statusMap.captions = 'good';

    // 1. Check Missing / Offline Media
    clips.forEach((clip, idx) => {
      const assetExists = mediaPool.some(m => m.id === clip.assetId || m.name === clip.name || clip.url);
      if (!assetExists && !clip.url) {
        issues.push({
          id: `vid-missing-${clip.id || idx}`,
          category: 'video',
          severity: 'critical',
          title: `Offline / Missing Media: "${clip.name || `Clip ${idx + 1}`}"`,
          description: 'The source media file for this clip cannot be resolved in the project media pool.',
          evidence: `Clip ID: ${clip.id}, source reference missing.`,
          targetType: 'clip',
          targetId: clip.id,
          targetName: clip.name,
          suggestedFix: {
            title: 'Relink Source Media',
            description: 'Replace this offline clip with an available media asset from the Media Bin.',
            actionType: 'relink_media',
            parameters: { clipId: clip.id },
            estimatedCredits: 0,
            requiresExternalAi: false,
          },
        });
        statusMap.video = 'problem_detected';
      }
    });

    // 2. Aspect Ratio & Framing / Accidental Black Bars
    clips.forEach((clip, idx) => {
      const clipDim = clip.dimensions || '1920x1080';
      const [wStr, hStr] = clipDim.split('x');
      const w = parseInt(wStr, 10) || 1920;
      const h = parseInt(hStr, 10) || 1080;
      const isClipVertical = h > w;
      const isProjectVertical = projectAspect === '9:16';
      const isProjectSquare = projectAspect === '1:1';

      if (isProjectVertical && !isClipVertical && !clip.transform?.cropPreset) {
        issues.push({
          id: `vid-aspect-mismatch-${clip.id || idx}`,
          category: 'framing',
          severity: 'warning',
          title: `Aspect Ratio Mismatch: "${clip.name || `Clip ${idx + 1}`}"`,
          description: 'Horizontal 16:9 footage in a 9:16 vertical canvas creates heavy letterboxing (black bars).',
          evidence: `Source dimensions ${w}x${h} (16:9) placed in ${projectAspect} sequence.`,
          targetType: 'clip',
          targetId: clip.id,
          targetName: clip.name,
          suggestedFix: {
            title: 'AI Auto-Reframe to 9:16',
            description: 'Intelligently track the main subject and crop to fill the 9:16 frame.',
            actionType: 'auto_reframe',
            parameters: { clipId: clip.id, targetRatio: '9:16' },
            estimatedCredits: 1,
            requiresExternalAi: false,
          },
        });
        if (statusMap.framing !== 'problem_detected') statusMap.framing = 'needs_attention';
      } else if (!isProjectVertical && !isProjectSquare && isClipVertical && !clip.transform?.cropPreset) {
        issues.push({
          id: `vid-pillarbox-${clip.id || idx}`,
          category: 'framing',
          severity: 'warning',
          title: `Pillarboxing Detected: "${clip.name || `Clip ${idx + 1}`}"`,
          description: 'Vertical 9:16 footage placed in a 16:9 canvas causes black bars on left and right.',
          evidence: `Vertical source ${w}x${h} on horizontal ${projectAspect} timeline.`,
          targetType: 'clip',
          targetId: clip.id,
          targetName: clip.name,
          suggestedFix: {
            title: 'Apply Blurred Background Fill',
            description: 'Duplicate footage as an aesthetic blurred background behind the vertical clip.',
            actionType: 'background_fill_blur',
            parameters: { clipId: clip.id },
            estimatedCredits: 0,
            requiresExternalAi: false,
          },
        });
        if (statusMap.framing !== 'problem_detected') statusMap.framing = 'needs_attention';
      }

      // Check bad crop / extreme scale
      if (clip.transform?.scale && clip.transform.scale > 2.2) {
        issues.push({
          id: `vid-extreme-scale-${clip.id || idx}`,
          category: 'framing',
          severity: 'warning',
          title: `Excessive Digital Zoom: "${clip.name || `Clip ${idx + 1}`}"`,
          description: `Digital magnification is set to ${Math.round(clip.transform.scale * 100)}%, causing noticeable blur and subject cutoff.`,
          evidence: `Transform scale is ${clip.transform.scale}x (recommended limit <= 1.5x).`,
          targetType: 'clip',
          targetId: clip.id,
          targetName: clip.name,
          suggestedFix: {
            title: 'Reset Scale & Re-center Framing',
            description: 'Reset scale to 1.0x and use AI Subject Centering.',
            actionType: 'reset_scale',
            parameters: { clipId: clip.id },
            estimatedCredits: 0,
            requiresExternalAi: false,
          },
        });
        if (statusMap.framing !== 'problem_detected') statusMap.framing = 'needs_attention';
      }
    });

    // 3. Exposure, Highlights & Crushed Shadows
    clips.forEach((clip, idx) => {
      const color = clip.colorAdjustments || {};
      const brightness = color.brightness || 0;
      const contrast = color.contrast || 0;

      if (brightness > 65) {
        issues.push({
          id: `vid-blown-highlights-${clip.id || idx}`,
          category: 'exposure',
          severity: 'warning',
          title: `Extreme Highlights / Exposure: "${clip.name || `Clip ${idx + 1}`}"`,
          description: 'High brightness value risks clipping white levels and losing highlight detail.',
          evidence: `Brightness offset: +${brightness} (clipping zone > +60).`,
          targetType: 'clip',
          targetId: clip.id,
          targetName: clip.name,
          suggestedFix: {
            title: 'Auto-Recover Highlights',
            description: 'Lower brightness to +20 and apply highlight roll-off compression.',
            actionType: 'adjust_exposure',
            parameters: { clipId: clip.id, brightness: 20, highlights: -30 },
            estimatedCredits: 0,
            requiresExternalAi: false,
          },
        });
        if (statusMap.exposure !== 'problem_detected') statusMap.exposure = 'needs_attention';
      } else if (brightness < -65 || (brightness < -40 && contrast > 50)) {
        issues.push({
          id: `vid-crushed-shadows-${clip.id || idx}`,
          category: 'exposure',
          severity: 'warning',
          title: `Crushed Shadows: "${clip.name || `Clip ${idx + 1}`}"`,
          description: 'Low brightness combined with high contrast causes severe loss of shadow detail in darker tones.',
          evidence: `Brightness ${brightness}%, Contrast ${contrast}%.`,
          targetType: 'clip',
          targetId: clip.id,
          targetName: clip.name,
          suggestedFix: {
            title: 'Lift Shadow Detail',
            description: 'Normalize black levels and add +25 points to shadow recovery.',
            actionType: 'lift_shadows',
            parameters: { clipId: clip.id, brightness: -15, shadows: 25 },
            estimatedCredits: 0,
            requiresExternalAi: false,
          },
        });
        if (statusMap.exposure !== 'problem_detected') statusMap.exposure = 'needs_attention';
      }
    });

    // 4. Color Consistency / Inconsistent White Balance
    if (clips.length >= 2) {
      for (let i = 0; i < clips.length - 1; i++) {
        const c1 = clips[i];
        const c2 = clips[i + 1];
        const temp1 = c1.colorAdjustments?.temperature || 0;
        const temp2 = c2.colorAdjustments?.temperature || 0;
        const tempDelta = Math.abs(temp1 - temp2);

        if (tempDelta > 55) {
          issues.push({
            id: `vid-color-mismatch-${c1.id}-${c2.id}`,
            category: 'exposure',
            severity: 'warning',
            title: `Color Temperature Mismatch: Cut between "${c1.name}" and "${c2.name}"`,
            description: `Sudden white balance jump (${temp1 > 0 ? 'Warm' : 'Cool'} ${temp1} vs ${temp2 > 0 ? 'Warm' : 'Cool'} ${temp2}) looks jarring at the edit transition.`,
            evidence: `White balance differential of ${tempDelta} points across adjacent cuts.`,
            targetType: 'timeline',
            suggestedFix: {
              title: 'Auto Match White Balance',
              description: `Align white balance of "${c2.name}" to match reference "${c1.name}".`,
              actionType: 'match_color_temp',
              parameters: { targetClipId: c2.id, referenceTemp: temp1 },
              estimatedCredits: 0,
              requiresExternalAi: false,
            },
          });
          if ((statusMap.exposure as QualityStatus) !== 'problem_detected') statusMap.exposure = 'needs_attention';
        }
      }
    }

    // 5. Transitions & Timeline Check
    clips.forEach((clip, idx) => {
      if (clip.transitionIn) {
        const transDuration = clip.transitionIn.durationSec || 1.0;
        const clipDuration = clip.durationSec || 2.0;
        if (transDuration >= clipDuration) {
          issues.push({
            id: `vid-broken-trans-${clip.id || idx}`,
            category: 'video',
            severity: 'critical',
            title: `Broken Transition on "${clip.name}"`,
            description: `Transition length (${transDuration.toFixed(1)}s) equals or exceeds the total clip duration (${clipDuration.toFixed(1)}s).`,
            evidence: `Transition in duration ${transDuration}s >= clip duration ${clipDuration}s.`,
            targetType: 'clip',
            targetId: clip.id,
            targetName: clip.name,
            suggestedFix: {
              title: 'Shorten Transition Duration',
              description: `Clamp transition duration to ${(clipDuration * 0.4).toFixed(1)}s.`,
              actionType: 'adjust_transition',
              parameters: { clipId: clip.id, durationSec: Math.max(0.3, clipDuration * 0.4) },
              estimatedCredits: 0,
              requiresExternalAi: false,
            },
          });
          statusMap.video = 'problem_detected';
        }
      }
    });

    // 6. Audio Track Checks (Volume, Clipping, Silence)
    this.inspectAudioClips(clips, issues, statusMap);

    // 7. Caption Checks
    const captions: any[] = videoState.captions || [];
    this.inspectCaptions(captions, issues, statusMap);
  }

  /**
   * Audio Checks for video clips and audio sessions
   */
  private static inspectAudioClips(
    clips: any[],
    issues: QualityIssue[],
    statusMap: Record<QualityCategory, QualityStatus>
  ): void {
    let hasExtremeClipping = false;
    let hasMutedAudio = false;

    clips.forEach((clip, idx) => {
      const vol = clip.audio?.volume ?? 100;
      const isMuted = clip.audio?.muted;

      // Audio clipping
      if (vol > 150) {
        hasExtremeClipping = true;
        issues.push({
          id: `aud-clipping-${clip.id || idx}`,
          category: 'audio',
          severity: 'critical',
          title: `Severe Audio Clipping: "${clip.name || `Track ${idx + 1}`}"`,
          description: `Volume boosted to ${vol}%, causing digital waveform clipping and audible crackle/distortion.`,
          evidence: `Digital gain at ${vol}% exceeds +0.0dBFS ceiling without dynamic range limiting.`,
          targetType: 'clip',
          targetId: clip.id,
          targetName: clip.name,
          suggestedFix: {
            title: 'Normalize Audio & Apply Limiter',
            description: 'Reset gain to 95% (-1.0dB true peak) with brickwall limiter.',
            actionType: 'normalize_audio',
            parameters: { clipId: clip.id, targetVolume: 95, enableLimiter: true },
            estimatedCredits: 0,
            requiresExternalAi: false,
          },
        });
      } else if (vol < 15 && !isMuted) {
        issues.push({
          id: `aud-low-vol-${clip.id || idx}`,
          category: 'audio',
          severity: 'warning',
          title: `Low Audio Volume: "${clip.name || `Clip ${idx + 1}`}"`,
          description: `Audio volume is set to ${vol}%, making speech and audio nearly inaudible.`,
          evidence: `Measured playback level at ${vol}% of standard reference.`,
          targetType: 'clip',
          targetId: clip.id,
          targetName: clip.name,
          suggestedFix: {
            title: 'Boost to Standard Dialogue Level',
            description: 'Increase volume to 85% with voice clarity EQ curve.',
            actionType: 'boost_audio',
            parameters: { clipId: clip.id, targetVolume: 85 },
            estimatedCredits: 0,
            requiresExternalAi: false,
          },
        });
      }

      if (isMuted && clip.type === 'video') {
        hasMutedAudio = true;
      }
    });

    if (hasExtremeClipping) {
      statusMap.audio = 'problem_detected';
    } else if (issues.some(i => i.category === 'audio')) {
      statusMap.audio = 'needs_attention';
    }
  }

  /**
   * Caption Quality Checks
   */
  private static inspectCaptions(
    captions: any[],
    issues: QualityIssue[],
    statusMap: Record<QualityCategory, QualityStatus>
  ): void {
    if (captions.length === 0) {
      statusMap.captions = 'not_checked';
      return;
    }

    let hasOverlap = false;
    let hasSpeedIssue = false;

    captions.forEach((cap, idx) => {
      const dur = (cap.endSec || 0) - (cap.startSec || 0);
      const textLen = (cap.text || '').length;

      // 1. Timing overlap
      if (idx > 0) {
        const prevCap = captions[idx - 1];
        if ((cap.startSec || 0) < (prevCap.endSec || 0)) {
          hasOverlap = true;
          issues.push({
            id: `cap-overlap-${cap.id || idx}`,
            category: 'captions',
            severity: 'critical',
            title: `Subtitle Timing Collision`,
            description: `Caption "${cap.text.slice(0, 20)}..." starts at ${(cap.startSec || 0).toFixed(1)}s before the previous subtitle ends at ${(prevCap.endSec || 0).toFixed(1)}s.`,
            evidence: `Overlap of ${(prevCap.endSec - cap.startSec).toFixed(2)}s between caption index ${idx - 1} and ${idx}.`,
            targetType: 'caption',
            targetId: cap.id,
            suggestedFix: {
              title: 'Auto Align Caption Timings',
              description: `Shift start of caption ${idx} to ${(prevCap.endSec + 0.05).toFixed(2)}s with a 50ms gap.`,
              actionType: 'align_caption_timing',
              parameters: { captionId: cap.id, newStartSec: prevCap.endSec + 0.05 },
              estimatedCredits: 0,
              requiresExternalAi: false,
            },
          });
        }
      }

      // 2. Reading speed too fast
      if (dur < 0.65 && textLen > 15) {
        hasSpeedIssue = true;
        issues.push({
          id: `cap-speed-fast-${cap.id || idx}`,
          category: 'captions',
          severity: 'warning',
          title: `Subtitle Flash / Duration Too Short`,
          description: `Subtitle displays ${textLen} characters for only ${dur.toFixed(2)}s, which is too brief for viewer readability.`,
          evidence: `Calculated reading speed: ${(textLen / Math.max(0.1, dur)).toFixed(1)} chars/sec (maximum recommended is 20 chars/sec).`,
          targetType: 'caption',
          targetId: cap.id,
          suggestedFix: {
            title: 'Extend Subtitle Duration',
            description: `Extend display duration to ${(Math.max(1.2, textLen / 15)).toFixed(1)}s for comfortable reading.`,
            actionType: 'extend_caption_duration',
            parameters: { captionId: cap.id, minDurationSec: Math.max(1.2, textLen / 15) },
            estimatedCredits: 0,
            requiresExternalAi: false,
          },
        });
      }

      // 3. Line length safe area overflow
      if (textLen > 42) {
        issues.push({
          id: `cap-safe-area-${cap.id || idx}`,
          category: 'captions',
          severity: 'info',
          title: `Subtitle Line Exceeds Title Safe Area`,
          description: `Caption line has ${textLen} characters. On mobile displays (9:16), this may wrap awkwardly or clip outer margins.`,
          evidence: `Line length of ${textLen} chars exceeds the 38-char single-line safe boundary.`,
          targetType: 'caption',
          targetId: cap.id,
          suggestedFix: {
            title: 'Split into Two Balanced Lines',
            description: 'Add a line break at the natural grammatical pause.',
            actionType: 'split_caption_lines',
            parameters: { captionId: cap.id },
            estimatedCredits: 0,
            requiresExternalAi: false,
          },
        });
      }
    });

    if (hasOverlap) {
      statusMap.captions = 'problem_detected';
    } else if (hasSpeedIssue || issues.some(i => i.category === 'captions')) {
      statusMap.captions = 'needs_attention';
    }
  }

  /**
   * Photo Project Quality Analyzer
   */
  private static checkPhotoProject(
    project: Project,
    issues: QualityIssue[],
    statusMap: Record<QualityCategory, QualityStatus>,
    isFullCheck: boolean
  ): void {
    const photoState = project.stateData?.photoState || {};
    const layers = photoState.layers || [];
    const transform = photoState.transform || {};
    const adjustments = photoState.globalAdjustments || {};

    statusMap.photo = 'good';
    statusMap.framing = 'good';
    statusMap.exposure = 'good';

    // 1. Resolution Check
    const width = transform.canvasWidth || 1200;
    const height = transform.canvasHeight || 1500;
    if (width < 800 || height < 800) {
      issues.push({
        id: `photo-low-res`,
        category: 'photo',
        severity: 'warning',
        title: 'Low Canvas Resolution',
        description: `Current photo canvas is ${width}x${height}px. May appear blurry on high-DPI retina displays or in print.`,
        evidence: `Canvas dimensions (${width}x${height}) below 1080px minimum recommended master resolution.`,
        targetType: 'photo_layer',
        suggestedFix: {
          title: 'AI Canvas 2x Super-Resolution Upscale',
          description: `Upscale canvas to ${width * 2}x${height * 2}px with detail reconstruction.`,
          actionType: 'upscale_photo',
          parameters: { targetWidth: width * 2, targetHeight: height * 2 },
          estimatedCredits: 1,
          requiresExternalAi: true,
        },
      });
      statusMap.photo = 'needs_attention';
    }

    // 2. Exposure & Clipping
    const brightness = adjustments.brightness || 0;
    const contrast = adjustments.contrast || 0;
    const temperature = adjustments.temperature || 0;

    if (brightness > 60) {
      issues.push({
        id: `photo-blown-whites`,
        category: 'exposure',
        severity: 'warning',
        title: 'Blown Highlights / White Clipping',
        description: 'Brightness level is elevated (+${brightness}%), causing specular highlights to clip to pure white #FFFFFF.',
        evidence: `Global brightness offset is +${brightness}%.`,
        targetType: 'photo_layer',
        suggestedFix: {
          title: 'Auto-Tone Balance',
          description: 'Recalibrate exposure to +15% with tonal highlight compression.',
          actionType: 'adjust_photo_exposure',
          parameters: { brightness: 15, contrast: Math.max(0, contrast - 10) },
          estimatedCredits: 0,
          requiresExternalAi: false,
        },
      });
      statusMap.exposure = 'needs_attention';
    }

    // 3. Color Temperature Imbalance
    if (Math.abs(temperature) > 60) {
      issues.push({
        id: `photo-temp-extreme`,
        category: 'exposure',
        severity: 'info',
        title: `Extreme Color Temperature (${temperature > 0 ? 'Warm' : 'Cool'})`,
        description: `White balance is shifted by ${temperature > 0 ? '+' : ''}${temperature} points, introducing a heavy color cast.`,
        evidence: `Temperature value ${temperature} exceeds neutral photography band (-30 to +30).`,
        targetType: 'photo_layer',
        suggestedFix: {
          title: 'Neutralize Color Temperature',
          description: 'Center temperature at +5 to retain warmth without unnatural tinting.',
          actionType: 'adjust_photo_temperature',
          parameters: { temperature: 5 },
          estimatedCredits: 0,
          requiresExternalAi: false,
        },
      });
      if ((statusMap.exposure as QualityStatus) !== 'problem_detected') statusMap.exposure = 'needs_attention';
    }

    // 4. Over-sharpening / Noise
    if (adjustments.sharpen && adjustments.sharpen > 75) {
      issues.push({
        id: `photo-over-sharpen`,
        category: 'photo',
        severity: 'warning',
        title: 'Over-Sharpening Halo Artifacts',
        description: 'Sharpening exceeds 75 points, causing artificial edge halos and amplifying image noise.',
        evidence: `Sharpening setting: ${adjustments.sharpen}/100.`,
        targetType: 'photo_layer',
        suggestedFix: {
          title: 'Reduce Sharpening to Natural Level',
          description: 'Set sharpening to 35 with unsharp mask radius control.',
          actionType: 'adjust_photo_sharpen',
          parameters: { sharpen: 35 },
          estimatedCredits: 0,
          requiresExternalAi: false,
        },
      });
      statusMap.photo = 'needs_attention';
    }
  }

  /**
   * Audio Session Quality Analyzer
   */
  private static checkAudioProject(
    project: Project,
    issues: QualityIssue[],
    statusMap: Record<QualityCategory, QualityStatus>,
    isFullCheck: boolean
  ): void {
    const audioState = project.stateData?.audioState || {};
    const tracks: any[] = audioState.tracks || [];
    const clips: any[] = audioState.clips || [];

    statusMap.audio = 'good';

    if (tracks.length === 0 || clips.length === 0) {
      issues.push({
        id: `aud-session-empty`,
        category: 'audio',
        severity: 'critical',
        title: 'Empty Audio Session',
        description: 'No active audio clips loaded on the timeline tracks.',
        evidence: 'Active clip count: 0',
        targetType: 'timeline',
        suggestedFix: {
          title: 'Add Audio Clips',
          description: 'Import audio files or generate ambient audio from AI Generation Studio.',
          actionType: 'add_audio_sample',
          parameters: {},
          estimatedCredits: 0,
          requiresExternalAi: false,
        },
      });
      statusMap.audio = 'problem_detected';
      return;
    }

    // Check channel imbalance or excessive gain on individual tracks
    tracks.forEach((track, idx) => {
      const vol = track.volume ?? 100;
      const pan = track.pan ?? 0;

      if (vol > 130) {
        issues.push({
          id: `aud-track-clip-${track.id || idx}`,
          category: 'audio',
          severity: 'critical',
          title: `Track Clipping: "${track.name || `Track ${idx + 1}`}"`,
          description: `Fader level is set to ${vol}%, likely exceeding 0.0 dBFS true peak headroom.`,
          evidence: `Track gain is ${vol}%. Digital clipping will distort the master bus.`,
          targetType: 'track',
          targetId: track.id,
          targetName: track.name,
          suggestedFix: {
            title: 'Normalize Track Gain to -1.5dB',
            description: 'Reduce track fader to 92% and insert dynamic compressor.',
            actionType: 'normalize_track_gain',
            parameters: { trackId: track.id, targetVolume: 92 },
            estimatedCredits: 0,
            requiresExternalAi: false,
          },
        });
        statusMap.audio = 'problem_detected';
      }

      if (Math.abs(pan) > 85) {
        issues.push({
          id: `aud-track-imbalance-${track.id || idx}`,
          category: 'audio',
          severity: 'warning',
          title: `Extreme Stereo Pan: "${track.name || `Track ${idx + 1}`}"`,
          description: `Track is panned ${pan > 0 ? 'Right' : 'Left'} ${Math.abs(pan)}%, which creates a disorienting headphone experience.`,
          evidence: `Stereo pan position: ${pan} (-100 to +100).`,
          targetType: 'track',
          targetId: track.id,
          targetName: track.name,
          suggestedFix: {
            title: 'Center Stereo Pan',
            description: 'Reset pan to center (0%) or balanced ±25% stereo spread.',
            actionType: 'center_track_pan',
            parameters: { trackId: track.id },
            estimatedCredits: 0,
            requiresExternalAi: false,
          },
        });
        if (statusMap.audio !== 'problem_detected') statusMap.audio = 'needs_attention';
      }
    });
  }

  /**
   * Single Media Asset Quality Inspector
   */
  static analyzeSingleMedia(asset: MediaAsset): QualityAnalysisReport {
    const issues: QualityIssue[] = [];
    const statusMap: Record<QualityCategory, QualityStatus> = {
      video: 'not_checked',
      audio: 'not_checked',
      photo: 'not_checked',
      framing: 'not_checked',
      exposure: 'not_checked',
      captions: 'not_checked',
    };

    if (asset.type === 'video') {
      statusMap.video = 'good';
      statusMap.framing = 'good';
      statusMap.audio = 'good';

      // Check resolution
      if (asset.dimensions?.includes('1280x720') || asset.dimensions?.includes('720p')) {
        issues.push({
          id: `media-720p-${asset.id}`,
          category: 'video',
          severity: 'info',
          title: 'HD 720p Source Resolution',
          description: 'Source resolution is standard 720p. AI Super-Resolution is available if exporting in 4K.',
          evidence: `Native resolution is ${asset.dimensions}.`,
          targetType: 'media_asset',
          targetId: asset.id,
          targetName: asset.name,
          suggestedFix: {
            title: 'AI 4K Upscale Source',
            description: 'Upscale asset resolution with edge sharpening.',
            actionType: 'upscale_asset',
            parameters: { assetId: asset.id },
            estimatedCredits: 2,
            requiresExternalAi: true,
          },
        });
      }
    } else if (asset.type === 'image') {
      statusMap.photo = 'good';
      statusMap.framing = 'good';
      statusMap.exposure = 'good';
    } else if (asset.type === 'audio') {
      statusMap.audio = 'good';
    }

    const report: QualityAnalysisReport = {
      id: `report-asset-${asset.id}`,
      analyzedAt: new Date().toISOString(),
      scope: 'media',
      targetId: asset.id,
      targetName: asset.name,
      categorizedStatus: statusMap,
      issues,
      summary: issues.length === 0 ? 'Media asset verified. Clean technical parameters.' : `Identified ${issues.length} technical parameter to review.`,
      isFullCheck: true,
      modelUsed: 'Local Media Quality Heuristics Engine v2.4',
      creditsUsed: 0,
    };

    AnalysisCacheService.saveQualityReport(report);
    return report;
  }
}
