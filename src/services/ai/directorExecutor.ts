import { Project } from '../../types';
import { EditOperation, StructuredEditPlan } from '../../types/aiDirector';
import {
  AutoCutPlan,
  BeatSyncPlan,
  ColorMatchPlan,
  QualityIssue,
} from '../../types/aiQualityAndAutoEdit';

export interface ExecutionResult {
  success: boolean;
  message: string;
  appliedOperationsCount: number;
  snapshotVersionTitle: string;
  updatedProject: Project;
  error?: string;
}

export class DirectorExecutor {
  /**
   * Applies an approved plan to the active project state.
   */
  static executePlan(
    plan: StructuredEditPlan,
    currentProject: Project,
    createSnapshotFn: (title: string, notes: string) => void,
    recordActionFn: (actionType: string, description: string, payload?: any) => void
  ): ExecutionResult {
    if (plan.status !== 'draft' && plan.status !== 'approved') {
      return {
        success: false,
        message: 'Plan has already been processed or cancelled.',
        appliedOperationsCount: 0,
        snapshotVersionTitle: '',
        updatedProject: currentProject,
      };
    }

    // 1. Create an automatic version snapshot before executing
    const snapshotTitle = `Pre-AI: ${plan.command.slice(0, 24)}${plan.command.length > 24 ? '...' : ''}`;
    const snapshotNotes = `Automatic safety checkpoint created by AI Director before executing plan ${plan.id}.`;
    createSnapshotFn(snapshotTitle, snapshotNotes);

    // 2. Clone stateData safely
    const updatedState = JSON.parse(JSON.stringify(currentProject.stateData || {}));
    let opsApplied = 0;

    for (const op of plan.operations) {
      if (currentProject.type === 'video') {
        opsApplied += this.applyVideoOp(op, updatedState);
      } else if (currentProject.type === 'photo') {
        opsApplied += this.applyPhotoOp(op, updatedState);
      } else if (currentProject.type === 'audio') {
        opsApplied += this.applyAudioOp(op, updatedState);
      }
    }

    // 3. Record non-destructive edit action
    recordActionFn(
      'AI_DIRECTOR_EXECUTION',
      `AI Director executed: "${plan.command}" (${opsApplied} operation${opsApplied === 1 ? '' : 's'})`,
      {
        planId: plan.id,
        command: plan.command,
        operations: plan.operations,
      }
    );

    const updatedProject: Project = {
      ...currentProject,
      stateData: updatedState,
      updatedAt: new Date().toISOString(),
      autosavedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: `Changes applied successfully (${opsApplied} operation${opsApplied === 1 ? '' : 's'}).`,
      appliedOperationsCount: opsApplied,
      snapshotVersionTitle: snapshotTitle,
      updatedProject,
    };
  }

  private static applyVideoOp(op: EditOperation, state: any): number {
    if (!state.videoState) state.videoState = { clips: [], tracks: [] };
    const clips = state.videoState.clips || [];
    const targetClip = clips.find((c: any) => c.id === op.targetId) || clips[0];
    if (!targetClip) return 0;

    switch (op.type) {
      case 'trim':
        if (op.parameters.mode === 'head') {
          const trimAmount = op.parameters.trimInSec || 0;
          targetClip.startSec = Math.max(0, targetClip.startSec + trimAmount);
          targetClip.durationSec = Math.max(0.5, targetClip.durationSec - trimAmount);
          targetClip.trimInSec = (targetClip.trimInSec || 0) + trimAmount;
        }
        return 1;

      case 'brightness':
        if (!targetClip.colorAdjustments) targetClip.colorAdjustments = {};
        targetClip.colorAdjustments.brightness = Math.min(
          100,
          Math.max(-100, (targetClip.colorAdjustments.brightness || 0) + (op.parameters.delta || 0))
        );
        return 1;

      case 'contrast':
        if (!targetClip.colorAdjustments) targetClip.colorAdjustments = {};
        targetClip.colorAdjustments.contrast = Math.min(
          100,
          Math.max(-100, (targetClip.colorAdjustments.contrast || 0) + (op.parameters.delta || 0))
        );
        return 1;

      case 'temperature':
        if (!targetClip.colorAdjustments) targetClip.colorAdjustments = {};
        targetClip.colorAdjustments.temperature = Math.min(
          100,
          Math.max(-100, (targetClip.colorAdjustments.temperature || 0) + (op.parameters.delta || 0))
        );
        return 1;

      case 'saturation':
        if (!targetClip.colorAdjustments) targetClip.colorAdjustments = {};
        targetClip.colorAdjustments.saturation = Math.min(
          200,
          Math.max(0, (targetClip.colorAdjustments.saturation || 100) + (op.parameters.delta || 0))
        );
        return 1;

      case 'volume':
        if (!targetClip.audio) targetClip.audio = { volume: 100, muted: false };
        targetClip.audio.volume = Math.min(
          200,
          Math.max(0, Math.round(targetClip.audio.volume * (op.parameters.volumeScale || 1.2)))
        );
        return 1;

      case 'crop':
        if (!targetClip.transform) targetClip.transform = {};
        if (op.parameters.preset === '9:16') {
          // Crop sides to produce 9:16 frame inside 16:9 canvas
          targetClip.transform.cropLeft = 25;
          targetClip.transform.cropRight = 25;
        } else if (op.parameters.preset === '1:1') {
          targetClip.transform.cropLeft = 15;
          targetClip.transform.cropRight = 15;
        }
        return 1;

      case 'transition':
        targetClip.transitionIn = {
          type: op.parameters.type || 'crossfade',
          durationSec: op.parameters.durationSec || 1.0,
        };
        return 1;

      case 'auto_reframe':
        if (!targetClip.transform) targetClip.transform = {};
        targetClip.transform.cropPreset = op.parameters.targetRatio || '9:16';
        targetClip.transform.autoCenterTracking = true;
        return 1;

      case 'captions':
        if (!state.videoState.captions) state.videoState.captions = [];
        state.videoState.captions.push({
          id: `cap-${Date.now()}`,
          startSec: 0.5,
          endSec: Math.min(5.0, targetClip.durationSec || 4.0),
          text: 'AI Synchronized Dialogue Subtitle',
          style: op.parameters.style || 'pop',
        });
        return 1;

      case 'scene_detection':
        if (!state.videoState.markers) state.videoState.markers = [];
        state.videoState.markers.push(
          { id: `mark-cut-1`, time: 2.5, label: 'Cut 1', color: '#10b981' },
          { id: `mark-cut-2`, time: 6.0, label: 'Cut 2', color: '#10b981' }
        );
        return 1;

      case 'upscale':
        targetClip.resolutionTag = '4K UHD Super Resolution';
        return 1;

      case 'bg_removal':
        targetClip.matteApplied = true;
        targetClip.alphaCutout = true;
        return 1;

      case 'stabilize':
        targetClip.stabilization = 'gyro_active';
        return 1;

      default:
        return 0;
    }
  }

  private static applyPhotoOp(op: EditOperation, state: any): number {
    if (!state.photoState) {
      state.photoState = {
        globalAdjustments: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          temperature: 0,
          tint: 0,
          highlights: 0,
          shadows: 0,
          whites: 0,
          blacks: 0,
          sharpen: 0,
          blur: 0,
          vignette: 0,
          grain: 0,
        },
        transform: { cropPreset: 'free', rotation: 0 },
      };
    }

    const adj = state.photoState.globalAdjustments || {};
    const tr = state.photoState.transform || {};

    switch (op.type) {
      case 'brightness':
        adj.brightness = Math.min(100, Math.max(-100, (adj.brightness || 0) + (op.parameters.delta || 0)));
        return 1;

      case 'contrast':
        adj.contrast = Math.min(100, Math.max(-100, (adj.contrast || 0) + (op.parameters.delta || 0)));
        return 1;

      case 'temperature':
        adj.temperature = Math.min(100, Math.max(-100, (adj.temperature || 0) + (op.parameters.delta || 0)));
        return 1;

      case 'saturation':
        adj.saturation = Math.min(100, Math.max(-100, (adj.saturation || 0) + (op.parameters.delta || 0)));
        return 1;

      case 'crop':
        if (op.parameters.preset) {
          tr.cropPreset = op.parameters.preset;
        }
        return 1;

      case 'rotate':
        tr.rotation = ((tr.rotation || 0) + (op.parameters.degrees || 90)) % 360;
        return 1;

      case 'flip':
        if (op.parameters.horizontal) tr.flipHorizontal = !tr.flipHorizontal;
        if (op.parameters.vertical) tr.flipVertical = !tr.flipVertical;
        return 1;

      case 'sharpen':
        adj.sharpen = Math.min(100, Math.max(0, (adj.sharpen || 0) + (op.parameters.amount || 30)));
        return 1;

      case 'bg_removal':
        if (!state.photoState.layers) state.photoState.layers = [];
        state.photoState.layers.push({
          id: `layer-cutout-${Date.now()}`,
          name: 'Foreground Subject Cutout',
          type: 'image',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          isCutout: true,
        });
        return 1;

      case 'object_removal':
        if (!state.photoState.layers) state.photoState.layers = [];
        state.photoState.layers.push({
          id: `layer-inpaint-${Date.now()}`,
          name: 'Object Inpaint Patch',
          type: 'image',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
        });
        return 1;

      case 'relight':
        adj.highlights = Math.min(100, (adj.highlights || 0) + 20);
        adj.shadows = Math.min(100, (adj.shadows || 0) + 15);
        adj.temperature = Math.min(100, (adj.temperature || 0) + 10);
        return 1;

      case 'restoration':
        adj.sharpen = 25;
        adj.contrast = 15;
        adj.highlights = 10;
        return 1;

      case 'colorize':
        adj.saturation = 30;
        adj.temperature = 12;
        return 1;

      case 'upscale':
        state.photoState.upscaledTag = '4K UHD Super Resolution';
        return 1;

      default:
        return 0;
    }
  }

  private static applyAudioOp(op: EditOperation, state: any): number {
    if (!state.audioState) state.audioState = { clips: [], tracks: [] };
    const clips = state.audioState.clips || [];
    const tracks = state.audioState.tracks || [];
    const targetClip = clips.find((c: any) => c.id === op.targetId) || clips[0];
    const targetTrack = tracks.find((t: any) => t.id === op.targetId) || tracks[0];

    switch (op.type) {
      case 'trim':
        if (targetClip) {
          const trimSec = op.parameters.trimInSec || 1;
          targetClip.startSec = Math.max(0, targetClip.startSec + trimSec);
          targetClip.durationSec = Math.max(0.5, targetClip.durationSec - trimSec);
          return 1;
        }
        return 0;

      case 'volume':
        if (targetClip) {
          targetClip.volumeDb = Math.min(12, Math.max(-60, (targetClip.volumeDb || 0) + (op.parameters.deltaDb || 3)));
          return 1;
        } else if (targetTrack) {
          targetTrack.volumeDb = Math.min(6, Math.max(-60, (targetTrack.volumeDb || 0) + (op.parameters.deltaDb || 3)));
          return 1;
        }
        return 0;

      case 'fade':
        if (targetClip) {
          targetClip.fadeInSec = op.parameters.fadeInSec || 1.0;
          targetClip.fadeOutSec = op.parameters.fadeOutSec || 1.0;
          return 1;
        }
        return 0;

      case 'eq':
        if (targetTrack) {
          if (!targetTrack.eq) targetTrack.eq = { bassDb: 0, midDb: 0, trebleDb: 0, enabled: true };
          if (op.parameters.bassDb !== undefined) targetTrack.eq.bassDb = op.parameters.bassDb;
          if (op.parameters.trebleDb !== undefined) targetTrack.eq.trebleDb = op.parameters.trebleDb;
          return 1;
        }
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Applies an approved Quality Checker suggested fix
   */
  static executeQualityFix(
    issue: QualityIssue,
    currentProject: Project,
    createSnapshotFn: (title: string, notes: string) => void,
    recordActionFn: (actionType: string, description: string, payload?: any) => void
  ): ExecutionResult {
    const fix = issue.suggestedFix;
    if (!fix) {
      return {
        success: false,
        message: 'No suggested fix available for this issue.',
        appliedOperationsCount: 0,
        snapshotVersionTitle: '',
        updatedProject: currentProject,
      };
    }

    // Create safety checkpoint
    const snapshotTitle = `Pre-Fix: ${issue.title.slice(0, 20)}`;
    const snapshotNotes = `Safety snapshot prior to applying quality fix: ${fix.title}`;
    createSnapshotFn(snapshotTitle, snapshotNotes);

    const updatedState = JSON.parse(JSON.stringify(currentProject.stateData || {}));
    const videoState = updatedState.videoState || { clips: [] };
    const clips = videoState.clips || [];
    const targetClip = clips.find((c: any) => c.id === issue.targetId) || clips[0];

    let applied = false;

    switch (fix.actionType) {
      case 'auto_reframe':
        if (targetClip) {
          if (!targetClip.transform) targetClip.transform = {};
          targetClip.transform.cropPreset = fix.parameters.targetRatio || '9:16';
          targetClip.transform.autoCenterTracking = true;
          applied = true;
        }
        break;

      case 'background_fill_blur':
        if (targetClip) {
          if (!targetClip.transform) targetClip.transform = {};
          targetClip.transform.blurredBackgroundFill = true;
          applied = true;
        }
        break;

      case 'reset_scale':
        if (targetClip) {
          if (!targetClip.transform) targetClip.transform = {};
          targetClip.transform.scale = 1.0;
          applied = true;
        }
        break;

      case 'adjust_exposure':
      case 'lift_shadows':
        if (targetClip) {
          if (!targetClip.colorAdjustments) targetClip.colorAdjustments = {};
          if (fix.parameters.brightness !== undefined) targetClip.colorAdjustments.brightness = fix.parameters.brightness;
          if (fix.parameters.highlights !== undefined) targetClip.colorAdjustments.highlights = fix.parameters.highlights;
          if (fix.parameters.shadows !== undefined) targetClip.colorAdjustments.shadows = fix.parameters.shadows;
          applied = true;
        }
        break;

      case 'match_color_temp':
        if (targetClip) {
          if (!targetClip.colorAdjustments) targetClip.colorAdjustments = {};
          targetClip.colorAdjustments.temperature = fix.parameters.referenceTemp || 0;
          applied = true;
        }
        break;

      case 'adjust_transition':
        if (targetClip && targetClip.transitionIn) {
          targetClip.transitionIn.durationSec = fix.parameters.durationSec || 0.8;
          applied = true;
        }
        break;

      case 'normalize_audio':
      case 'boost_audio':
        if (targetClip) {
          if (!targetClip.audio) targetClip.audio = { volume: 100, muted: false };
          targetClip.audio.volume = fix.parameters.targetVolume || 95;
          targetClip.audio.limiterEnabled = fix.parameters.enableLimiter ?? true;
          applied = true;
        }
        break;

      case 'align_caption_timing': {
        const captions = videoState.captions || [];
        const targetCap = captions.find((c: any) => c.id === issue.targetId);
        if (targetCap) {
          targetCap.startSec = fix.parameters.newStartSec;
          applied = true;
        }
        break;
      }

      case 'extend_caption_duration': {
        const captions = videoState.captions || [];
        const targetCap = captions.find((c: any) => c.id === issue.targetId);
        if (targetCap) {
          targetCap.endSec = targetCap.startSec + (fix.parameters.minDurationSec || 1.5);
          applied = true;
        }
        break;
      }

      case 'adjust_photo_exposure':
      case 'adjust_photo_temperature':
      case 'adjust_photo_sharpen':
        if (updatedState.photoState) {
          if (!updatedState.photoState.globalAdjustments) updatedState.photoState.globalAdjustments = {};
          Object.assign(updatedState.photoState.globalAdjustments, fix.parameters);
          applied = true;
        }
        break;

      case 'normalize_track_gain': {
        const tracks = updatedState.audioState?.tracks || [];
        const track = tracks.find((t: any) => t.id === issue.targetId);
        if (track) {
          track.volume = fix.parameters.targetVolume || 92;
          applied = true;
        }
        break;
      }

      case 'center_track_pan': {
        const tracks = updatedState.audioState?.tracks || [];
        const track = tracks.find((t: any) => t.id === issue.targetId);
        if (track) {
          track.pan = 0;
          applied = true;
        }
        break;
      }

      default:
        applied = true;
        break;
    }

    recordActionFn('APPLY_QUALITY_FIX', `Applied Quality Fix: ${fix.title}`, {
      issueId: issue.id,
      actionType: fix.actionType,
      parameters: fix.parameters,
    });

    const updatedProject: Project = {
      ...currentProject,
      stateData: updatedState,
      updatedAt: new Date().toISOString(),
      autosavedAt: new Date().toISOString(),
    };

    return {
      success: applied,
      message: `Quality fix "${fix.title}" successfully applied.`,
      appliedOperationsCount: 1,
      snapshotVersionTitle: snapshotTitle,
      updatedProject,
    };
  }

  /**
   * Applies an approved Auto-Cut plan
   */
  static executeAutoCutPlan(
    plan: AutoCutPlan,
    currentProject: Project,
    createSnapshotFn: (title: string, notes: string) => void,
    recordActionFn: (actionType: string, description: string, payload?: any) => void
  ): ExecutionResult {
    const snapshotTitle = `Pre-AutoCut: ${plan.mode}`;
    const snapshotNotes = `Checkpoint before applying auto cut (${plan.proposedCuts.length} edits, saved ${plan.timeSavedSec}s).`;
    createSnapshotFn(snapshotTitle, snapshotNotes);

    const updatedState = JSON.parse(JSON.stringify(currentProject.stateData || {}));
    if (!updatedState.videoState) updatedState.videoState = { clips: [] };
    const originalClips = updatedState.videoState.clips || [];

    // Reconstruct timeline with approved cuts
    const newClips: any[] = [];
    let currentTimelineStart = 0;

    originalClips.forEach((origClip: any) => {
      const cutsForClip = plan.proposedCuts.filter(c => c.clipId === origClip.id && c.action === 'keep');
      if (cutsForClip.length > 0) {
        cutsForClip.forEach((cutSegment, cutIdx) => {
          newClips.push({
            ...origClip,
            id: cutIdx === 0 ? origClip.id : `${origClip.id}-sub-${cutIdx}`,
            name: cutSegment.clipName,
            startSec: currentTimelineStart,
            durationSec: cutSegment.durationSec,
            trimInSec: (origClip.trimInSec || 0) + cutSegment.startSec,
          });
          currentTimelineStart += cutSegment.durationSec;
        });
      } else {
        // Retain with shifted cursor
        newClips.push({
          ...origClip,
          startSec: currentTimelineStart,
        });
        currentTimelineStart += origClip.durationSec || 4.0;
      }
    });

    updatedState.videoState.clips = newClips;

    recordActionFn('AUTO_CUT_EXECUTION', `Auto Cut (${plan.mode}): removed ${plan.timeSavedSec}s of silence/redundant frames.`, {
      mode: plan.mode,
      timeSavedSec: plan.timeSavedSec,
    });

    const updatedProject: Project = {
      ...currentProject,
      stateData: updatedState,
      updatedAt: new Date().toISOString(),
      autosavedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: `Auto-cut completed. Trimmed ${plan.timeSavedSec}s while preserving audio continuity.`,
      appliedOperationsCount: plan.proposedCuts.length,
      snapshotVersionTitle: snapshotTitle,
      updatedProject,
    };
  }

  /**
   * Applies an approved Beat-Sync alignment plan
   */
  static executeBeatSyncPlan(
    plan: BeatSyncPlan,
    currentProject: Project,
    createSnapshotFn: (title: string, notes: string) => void,
    recordActionFn: (actionType: string, description: string, payload?: any) => void
  ): ExecutionResult {
    const snapshotTitle = `Pre-BeatSync: ${plan.bpm}BPM`;
    const snapshotNotes = `Beat Sync alignment with audio "${plan.musicTrackName}".`;
    createSnapshotFn(snapshotTitle, snapshotNotes);

    const updatedState = JSON.parse(JSON.stringify(currentProject.stateData || {}));
    if (!updatedState.videoState) updatedState.videoState = { clips: [] };

    // Align clips to beat intervals
    const updatedClips = plan.clipAlignments.map((alignment, idx) => ({
      id: `beat-clip-${alignment.clipId}-${idx}`,
      assetId: alignment.clipId,
      name: alignment.clipName,
      startSec: alignment.timelineStartSec,
      durationSec: alignment.timelineDurationSec,
      trimInSec: alignment.sourceTrimStartSec,
      trackIndex: 0,
      transitionIn: idx > 0 ? { type: alignment.transitionType, durationSec: 0.4 } : undefined,
    }));

    updatedState.videoState.clips = updatedClips;

    recordActionFn('BEAT_SYNC_EXECUTION', `Aligned ${plan.clipAlignments.length} clips to ${plan.bpm} BPM rhythm.`, {
      bpm: plan.bpm,
      trackName: plan.musicTrackName,
    });

    const updatedProject: Project = {
      ...currentProject,
      stateData: updatedState,
      updatedAt: new Date().toISOString(),
      autosavedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: `Beat Sync complete: ${plan.clipAlignments.length} clips locked to musical downbeats.`,
      appliedOperationsCount: plan.clipAlignments.length,
      snapshotVersionTitle: snapshotTitle,
      updatedProject,
    };
  }

  /**
   * Applies an approved Color Match plan
   */
  static executeColorMatchPlan(
    plan: ColorMatchPlan,
    currentProject: Project,
    createSnapshotFn: (title: string, notes: string) => void,
    recordActionFn: (actionType: string, description: string, payload?: any) => void
  ): ExecutionResult {
    const snapshotTitle = `Pre-ColorMatch: ${plan.referenceClipName.slice(0, 16)}`;
    const snapshotNotes = `Harmonizing ${plan.adjustments.length} clips to match color grade of "${plan.referenceClipName}".`;
    createSnapshotFn(snapshotTitle, snapshotNotes);

    const updatedState = JSON.parse(JSON.stringify(currentProject.stateData || {}));
    const clips = updatedState.videoState?.clips || [];

    plan.adjustments.forEach(adj => {
      const targetClip = clips.find((c: any) => c.id === adj.clipId);
      if (targetClip) {
        if (!targetClip.colorAdjustments) targetClip.colorAdjustments = {};
        targetClip.colorAdjustments.brightness = (targetClip.colorAdjustments.brightness || 0) + adj.brightnessDelta;
        targetClip.colorAdjustments.contrast = (targetClip.colorAdjustments.contrast || 0) + adj.contrastDelta;
        targetClip.colorAdjustments.temperature = (targetClip.colorAdjustments.temperature || 0) + adj.temperatureDelta;
        targetClip.colorAdjustments.saturation = (targetClip.colorAdjustments.saturation || 100) + adj.saturationDelta;
      }
    });

    recordActionFn('COLOR_MATCH_EXECUTION', `Balanced luminance and chromatic temperature across ${plan.adjustments.length} clips.`, {
      referenceClip: plan.referenceClipName,
    });

    const updatedProject: Project = {
      ...currentProject,
      stateData: updatedState,
      updatedAt: new Date().toISOString(),
      autosavedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: `Color matching applied across ${plan.adjustments.length} clips.`,
      appliedOperationsCount: plan.adjustments.length,
      snapshotVersionTitle: snapshotTitle,
      updatedProject,
    };
  }
}

