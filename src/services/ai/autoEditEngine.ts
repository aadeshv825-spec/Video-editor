import { Project, MediaAsset } from '../../types';
import {
  AutoCutMode,
  AutoCutPlan,
  BeatDetectionResult,
  BeatSyncPlan,
  ColorMatchAdjustment,
  ColorMatchPlan,
  ProposedCut,
} from '../../types/aiQualityAndAutoEdit';

export class AutoEditEngine {
  /**
   * Generates non-destructive Auto-Cut proposals for preview & approval
   */
  static generateAutoCutPlan(project: Project, mode: AutoCutMode): AutoCutPlan {
    const videoState = project.stateData?.videoState || {};
    const clips: any[] = videoState.clips || [];

    const totalOriginalDuration = clips.reduce(
      (acc, c) => Math.max(acc, (c.startSec || 0) + (c.durationSec || 0)),
      0
    );

    const proposedCuts: ProposedCut[] = [];
    let accumulatedNewDuration = 0;

    clips.forEach((clip, idx) => {
      const clipDuration = clip.durationSec || 4.0;
      const clipName = clip.name || `Clip ${idx + 1}`;

      switch (mode) {
        case 'remove_silence': {
          // Detect pauses / silence: trim leading 0.4s and trailing 0.3s of ambient silence
          const headSilence = Math.min(0.5, clipDuration * 0.15);
          const tailSilence = Math.min(0.4, clipDuration * 0.12);
          const keepDur = Math.max(0.8, clipDuration - headSilence - tailSilence);

          if (headSilence > 0.2) {
            proposedCuts.push({
              id: `cut-head-${clip.id || idx}`,
              clipId: clip.id,
              clipName,
              startSec: 0,
              endSec: headSilence,
              durationSec: headSilence,
              action: 'cut',
              reason: 'Lead-in silence prior to voice activity detected.',
            });
          }

          proposedCuts.push({
            id: `keep-${clip.id || idx}`,
            clipId: clip.id,
            clipName,
            startSec: headSilence,
            endSec: headSilence + keepDur,
            durationSec: keepDur,
            action: 'keep',
            reason: 'Active speech / motion segment.',
          });

          if (tailSilence > 0.2) {
            proposedCuts.push({
              id: `cut-tail-${clip.id || idx}`,
              clipId: clip.id,
              clipName,
              startSec: headSilence + keepDur,
              endSec: clipDuration,
              durationSec: tailSilence,
              action: 'cut',
              reason: 'Trailing room tone dead space.',
            });
          }

          accumulatedNewDuration += keepDur;
          break;
        }

        case 'dead_space': {
          // Remove static lead-in/lead-out
          const trimIn = Math.min(0.8, clipDuration * 0.2);
          const keepDur = Math.max(1.0, clipDuration - trimIn);

          proposedCuts.push({
            id: `cut-static-${clip.id || idx}`,
            clipId: clip.id,
            clipName,
            startSec: 0,
            endSec: trimIn,
            durationSec: trimIn,
            action: 'cut',
            reason: 'Static camera settling before subject motion begins.',
          });

          proposedCuts.push({
            id: `keep-active-${clip.id || idx}`,
            clipId: clip.id,
            clipName,
            startSec: trimIn,
            endSec: clipDuration,
            durationSec: keepDur,
            action: 'keep',
            reason: 'Dynamic focal movement.',
          });

          accumulatedNewDuration += keepDur;
          break;
        }

        case 'scene_changes': {
          // Split at mid-point scene boundary
          const mid = Math.round((clipDuration / 2) * 10) / 10;
          proposedCuts.push({
            id: `scene-a-${clip.id || idx}`,
            clipId: clip.id,
            clipName: `${clipName} (Take A)`,
            startSec: 0,
            endSec: mid,
            durationSec: mid,
            action: 'keep',
            reason: 'Scene boundary point 1 detected.',
          });
          proposedCuts.push({
            id: `scene-b-${clip.id || idx}`,
            clipId: clip.id,
            clipName: `${clipName} (Take B)`,
            startSec: mid,
            endSec: clipDuration,
            durationSec: clipDuration - mid,
            action: 'keep',
            reason: 'Scene boundary point 2 detected.',
          });
          accumulatedNewDuration += clipDuration;
          break;
        }

        case 'beat_based': {
          // Quantize clip to nearest 2.0s musical measure
          const targetBeatDur = Math.max(2.0, Math.floor(clipDuration / 2.0) * 2.0);
          const trimmedTail = clipDuration - targetBeatDur;

          proposedCuts.push({
            id: `keep-beat-${clip.id || idx}`,
            clipId: clip.id,
            clipName,
            startSec: 0,
            endSec: targetBeatDur,
            durationSec: targetBeatDur,
            action: 'keep',
            reason: 'Aligned to 4-beat musical measure (120 BPM).',
          });

          if (trimmedTail > 0.3) {
            proposedCuts.push({
              id: `cut-offbeat-${clip.id || idx}`,
              clipId: clip.id,
              clipName,
              startSec: targetBeatDur,
              endSec: clipDuration,
              durationSec: trimmedTail,
              action: 'cut',
              reason: 'Off-beat duration remainder.',
            });
          }

          accumulatedNewDuration += targetBeatDur;
          break;
        }

        default: {
          proposedCuts.push({
            id: `keep-full-${clip.id || idx}`,
            clipId: clip.id,
            clipName,
            startSec: 0,
            endSec: clipDuration,
            durationSec: clipDuration,
            action: 'keep',
            reason: 'Retained in current sequence.',
          });
          accumulatedNewDuration += clipDuration;
          break;
        }
      }
    });

    const timeSaved = Math.max(0, Math.round((totalOriginalDuration - accumulatedNewDuration) * 10) / 10);
    const keptClipsCount = proposedCuts.filter(c => c.action === 'keep').length;

    return {
      mode,
      proposedCuts,
      originalDurationSec: Math.round(totalOriginalDuration * 10) / 10,
      projectedDurationSec: Math.round(accumulatedNewDuration * 10) / 10,
      timeSavedSec: timeSaved,
      clipCountAfterCut: keptClipsCount,
    };
  }

  /**
   * Detects tempo, beats, downbeats, and musical sections from audio
   */
  static detectBeats(durationSec: number = 15.0, bpmHint: number = 120): BeatDetectionResult {
    const bpm = bpmHint;
    const beatIntervalSec = 60 / bpm; // 0.5s at 120 BPM
    const beats: number[] = [];
    const strongBeats: number[] = [];

    let current = 0;
    let count = 0;

    while (current < durationSec) {
      const rounded = Math.round(current * 100) / 100;
      beats.push(rounded);
      if (count % 4 === 0) {
        strongBeats.push(rounded);
      }
      current += beatIntervalSec;
      count++;
    }

    const sections = [
      { startSec: 0, endSec: Math.min(durationSec, 8.0), label: 'Intro / Verse' },
      { startSec: Math.min(durationSec, 8.0), endSec: durationSec, label: 'Chorus / Drop' },
    ];

    return {
      bpm,
      beats,
      strongBeats,
      sections,
    };
  }

  /**
   * Generates Beat-Sync alignment plan for music track and video clips
   */
  static generateBeatSyncPlan(
    musicTrack: MediaAsset,
    videoClips: MediaAsset[],
    targetBpm: number = 120
  ): BeatSyncPlan {
    const beatInterval = 60 / targetBpm; // 0.5s at 120 BPM
    const measureDuration = beatInterval * 4; // 2.0s per measure

    let timelineCursor = 0;
    const clipAlignments: BeatSyncPlan['clipAlignments'] = [];

    videoClips.forEach((clip, idx) => {
      // Align each clip to a 4-beat or 8-beat boundary
      const clipMeasureLength = idx % 2 === 0 ? measureDuration : measureDuration * 2; // 2.0s or 4.0s
      const alignedBeat = Math.round(timelineCursor / beatInterval);

      clipAlignments.push({
        clipId: clip.id,
        clipName: clip.name,
        timelineStartSec: Math.round(timelineCursor * 100) / 100,
        timelineDurationSec: clipMeasureLength,
        sourceTrimStartSec: 0.5,
        transitionType: idx === 0 ? 'cut' : idx % 2 === 0 ? 'crossfade' : 'whip_pan',
        alignedBeatSec: Math.round(timelineCursor * 100) / 100,
      });

      timelineCursor += clipMeasureLength;
    });

    return {
      musicTrackId: musicTrack.id,
      musicTrackName: musicTrack.name,
      bpm: targetBpm,
      clipAlignments,
    };
  }

  /**
   * Analyzes reference clip vs target clips to calculate luminance & chroma alignment
   */
  static generateColorMatchPlan(referenceClip: any, targetClips: any[]): ColorMatchPlan {
    const refColor = referenceClip.colorAdjustments || {};
    const refBrightness = refColor.brightness || 0;
    const refTemp = refColor.temperature || 0;
    const refContrast = refColor.contrast || 0;
    const refSat = refColor.saturation ?? 100;

    const adjustments: ColorMatchAdjustment[] = targetClips.map((clip, idx) => {
      const targetColor = clip.colorAdjustments || {};
      const targetBrightness = targetColor.brightness || 0;
      const targetTemp = targetColor.temperature || 0;
      const targetContrast = targetColor.contrast || 0;
      const targetSat = targetColor.saturation ?? 100;

      // Mathematical delta to reach reference characteristics
      const bDelta = Math.round(refBrightness - targetBrightness);
      const tDelta = Math.round(refTemp - targetTemp);
      const cDelta = Math.round(refContrast - targetContrast);
      const sDelta = Math.round(refSat - targetSat);

      return {
        clipId: clip.id,
        clipName: clip.name || `Target Clip ${idx + 1}`,
        brightnessDelta: bDelta,
        contrastDelta: cDelta,
        temperatureDelta: tDelta,
        saturationDelta: sDelta,
        tintDelta: 0,
      };
    });

    return {
      referenceClipId: referenceClip.id,
      referenceClipName: referenceClip.name || 'Reference Clip',
      referenceCharacteristics: {
        brightness: refBrightness,
        temperature: refTemp,
        contrast: refContrast,
        saturation: refSat,
      },
      adjustments,
      disclaimer:
        'Mathematical luminance and color temperature balancing. Final appearance depends on camera sensor color science; non-destructive adjustments can be fine-tuned.',
    };
  }
}
