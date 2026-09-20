export type QualityStatus = 'good' | 'needs_attention' | 'problem_detected' | 'not_checked';

export type QualityCategory = 'video' | 'audio' | 'photo' | 'framing' | 'exposure' | 'captions';

export interface SuggestedFix {
  title: string;
  description: string;
  actionType: string;
  parameters: Record<string, any>;
  estimatedCredits: number;
  requiresExternalAi: boolean;
}

export interface QualityIssue {
  id: string;
  category: QualityCategory;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  evidence: string;
  targetType: 'clip' | 'track' | 'photo_layer' | 'caption' | 'timeline' | 'export_config' | 'media_asset';
  targetId?: string;
  targetName?: string;
  suggestedFix?: SuggestedFix;
  isResolved?: boolean;
  isIgnored?: boolean;
}

export interface QualityAnalysisReport {
  id: string;
  analyzedAt: string;
  scope: 'project' | 'media' | 'export';
  targetId: string;
  targetName: string;
  categorizedStatus: Record<QualityCategory, QualityStatus>;
  issues: QualityIssue[];
  summary: string;
  isFullCheck: boolean;
  modelUsed: string;
  creditsUsed: number;
}

export interface TranscriptWord {
  word: string;
  startSec: number;
  endSec: number;
}

export interface TranscriptSegment {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  confidence: number;
  words?: TranscriptWord[];
}

export interface SceneDetectionResult {
  id: string;
  mediaId: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  label: string;
  thumbnailUrl?: string;
  confidence: number;
  keyObjects?: string[];
  lighting?: string;
}

export interface BestTakeCandidate {
  mediaId: string;
  name: string;
  url: string;
  durationSec: number;
  dimensions?: string;
  sharpnessScore: number; // 0 - 100
  stabilityScore: number; // 0 - 100
  audioQualityScore: number; // 0 - 100
  framingScore: number; // 0 - 100
  overallRecommendationScore: number; // 0 - 100
  signals: string[];
  drawbacks?: string[];
  isRecommended: boolean;
}

export interface MediaSemanticMetadata {
  mediaId: string;
  tags: string[];
  autoTags: string[];
  manualTags: string[];
  transcript?: TranscriptSegment[];
  scenes?: SceneDetectionResult[];
  detectedBpm?: number;
  beatMarkers?: number[];
  sharpnessScore?: number;
  stabilityScore?: number;
  audioQualityScore?: number;
  faceDetected?: boolean;
  isBestTakeCandidate?: boolean;
  bestTakeReason?: string;
  analysisVersion: string;
  analyzedAt: string;
  modelUsed: string;
}

export type AutoCutMode =
  | 'remove_silence'
  | 'dead_space'
  | 'duplicate_frames'
  | 'scene_changes'
  | 'beat_based'
  | 'highlights';

export interface ProposedCut {
  id: string;
  clipId: string;
  clipName: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  action: 'keep' | 'cut';
  reason: string;
}

export interface AutoCutPlan {
  mode: AutoCutMode;
  proposedCuts: ProposedCut[];
  originalDurationSec: number;
  projectedDurationSec: number;
  timeSavedSec: number;
  clipCountAfterCut: number;
}

export interface BeatDetectionResult {
  bpm: number;
  beats: number[];
  strongBeats: number[];
  sections: { startSec: number; endSec: number; label: string }[];
}

export interface BeatSyncPlan {
  musicTrackId: string;
  musicTrackName: string;
  bpm: number;
  clipAlignments: {
    clipId: string;
    clipName: string;
    timelineStartSec: number;
    timelineDurationSec: number;
    sourceTrimStartSec: number;
    transitionType: string;
    alignedBeatSec: number;
  }[];
}

export interface ColorMatchAdjustment {
  clipId: string;
  clipName: string;
  brightnessDelta: number;
  contrastDelta: number;
  temperatureDelta: number;
  saturationDelta: number;
  tintDelta: number;
}

export interface ColorMatchPlan {
  referenceClipId: string;
  referenceClipName: string;
  referenceCharacteristics: {
    brightness: number;
    temperature: number;
    contrast: number;
    saturation: number;
  };
  adjustments: ColorMatchAdjustment[];
  disclaimer: string;
}

export interface ProjectSummaryStats {
  videoClipsCount: number;
  photosCount: number;
  audioTracksCount: number;
  totalDurationSec: number;
  aspectRatio: string;
  resolution: string;
  fps: number;
  detectedScenesCount: number;
  captionsCount: number;
  aiGeneratedAssetsCount: number;
  pendingIssuesCount: number;
  recentAiOperationsCount: number;
  lastQualityCheckDate?: string;
}
