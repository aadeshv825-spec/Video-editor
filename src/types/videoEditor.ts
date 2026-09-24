export type TrackType = 'video' | 'audio' | 'text';

export interface TimelineTrack {
  id: string;
  label: string;
  type: TrackType;
  muted: boolean;
  locked: boolean;
  hidden: boolean;
  volume: number; // 0 to 2 (1 = 100%)
  solo?: boolean;
  height?: 'compact' | 'standard' | 'expanded';
  colorTag?: string;
  gainDb?: number;
  pan?: number; // -100 (Left) to +100 (Right)
  groupId?: string;
}

export type ClipType = 'video' | 'audio' | 'image' | 'text' | 'adjustment' | 'compound';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'color-dodge'
  | 'luminosity';

export interface TransformProperties {
  positionX: number; // px offset from center
  positionY: number; // px offset from center
  scale: number; // percentage (10 to 300)
  rotation: number; // degrees (-180 to 180)
  cropTop: number; // percentage (0 to 100)
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  opacity: number; // percentage (0 to 100)
  blendMode?: BlendMode;
  cropPreset?: string;
  autoCenterTracking?: boolean;
  fitMode?: 'fit' | 'fill' | 'stretch' | 'original';
}

export type KeyframeInterpolation = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';

export interface Keyframe {
  id: string;
  timeSec: number; // relative to clip start
  property: 'positionX' | 'positionY' | 'scale' | 'rotation' | 'opacity' | 'volume' | 'exposure' | 'saturation';
  value: number;
  interpolation?: KeyframeInterpolation;
  controlPoints?: [number, number, number, number]; // Bezier [x1, y1, x2, y2]
}

export type SpeedRampType = 'linear' | 'ease-in' | 'ease-out' | 'smooth' | 'bezier';

export interface SpeedRampPoint {
  id: string;
  timeRatio: number; // 0.0 to 1.0 along the clip
  speed: number; // 0.1 to 16.0
}

export interface SpeedProperties {
  speed: number; // 0.1 to 16.0
  reverse: boolean;
  freezeFrame: boolean;
  ramp: SpeedRampType;
  rampPoints?: SpeedRampPoint[];
  preservePitch?: boolean;
}

export interface CurvePoint {
  x: number; // 0 to 100
  y: number; // 0 to 100
}

export interface ColorCurves {
  master: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export interface HSLChannel {
  hue: number; // -100 to 100
  saturation: number; // -100 to 100
  luminance: number; // -100 to 100
}

export interface ColorWheelOffset {
  hue: number; // 0 to 360 deg
  saturation: number; // 0 to 100%
  luminance: number; // -100 to 100%
}

export interface ColorWheels {
  lift: ColorWheelOffset; // Shadows
  gamma: ColorWheelOffset; // Midtones
  gain: ColorWheelOffset; // Highlights
}

export interface VignetteProperties {
  amount: number; // -100 (dark) to 100 (light)
  midpoint: number; // 0 to 100
  roundness: number; // -100 to 100
  feather: number; // 0 to 100
}

export interface FilmGrainProperties {
  amount: number; // 0 to 100
  roughness: number; // 0 to 100
  size: number; // 1 to 5
}

export interface LUTSettings {
  id?: string;
  name: string;
  intensity: number; // 0 to 100%
  enabled: boolean;
  customCubeData?: string;
}

export interface ColorProperties {
  // Basic
  exposure: number; // -100 to 100
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // 0 to 200
  temperature: number; // -100 (cool/blue) to 100 (warm/orange)
  tint: number; // -100 (green) to 100 (magenta)
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  whites?: number; // -100 to 100
  blacks?: number; // -100 to 100
  sharpen: number; // 0 to 100
  blur: number; // 0 to 20 px
  vibrance?: number; // -100 to 100
  midtoneDetail?: number; // -100 to 100
  // Advanced grading
  curves?: ColorCurves;
  hsl?: {
    red: HSLChannel;
    orange: HSLChannel;
    yellow: HSLChannel;
    green: HSLChannel;
    cyan: HSLChannel;
    blue: HSLChannel;
    purple: HSLChannel;
    magenta: HSLChannel;
  };
  wheels?: ColorWheels;
  vignette?: VignetteProperties;
  grain?: FilmGrainProperties;
  lut?: LUTSettings;
}

export interface ClipMask {
  id: string;
  name: string;
  type: 'rectangle' | 'ellipse' | 'path';
  feather: number; // 0 to 100 px
  opacity: number; // 0 to 100%
  expansion: number; // -50 to 50 px
  inverted: boolean;
  enabled: boolean;
  points?: Array<{ x: number; y: number }>;
  rectX?: number;
  rectY?: number;
  rectWidth?: number;
  rectHeight?: number;
}

export interface ChromaKeySettings {
  enabled: boolean;
  keyColor: string; // Hex e.g. #00FF00
  tolerance: number; // 0 to 100
  softness: number; // 0 to 100
  spillSuppression: number; // 0 to 100
  edgeRefinement: number; // 0 to 100
  feather: number; // 0 to 50
  mattePreview: 'composite' | 'matte' | 'color';
}

export interface CornerPinPoint {
  x: number; // 0 to 100 %
  y: number; // 0 to 100 %
}

export interface CornerPinSettings {
  enabled: boolean;
  topLeft: CornerPinPoint;
  topRight: CornerPinPoint;
  bottomRight: CornerPinPoint;
  bottomLeft: CornerPinPoint;
}

export interface MotionBlurSettings {
  enabled: boolean;
  amount: number; // 0 to 100%
  shutterAngle: number; // 0 to 360 deg (180 = standard)
}

export interface StabilizationSettings {
  enabled: boolean;
  mode: 'automatic' | 'smooth' | 'strong';
  cropAmount: number; // 0 to 50%
  smoothing: number; // 0 to 100%
  framing: 'crop' | 'preserve';
  status: 'applied' | 'processing' | 'none';
}

export interface OpticalFlowSettings {
  enabled: boolean;
  targetFps: number; // 24, 30, 60, 120, 240
  qualityMode: 'draft' | 'neural_flow' | 'film_precision';
  status: 'not_configured' | 'processing' | 'ready';
}

export interface TrackPoint {
  timeSec: number;
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
}

export interface TrackData {
  id: string;
  name: string;
  type: 'point' | 'object' | 'planar';
  points: TrackPoint[];
  confidence: number; // 0.0 to 1.0
  isPlanar?: boolean;
  planeCorners?: {
    tl: [number, number];
    tr: [number, number];
    br: [number, number];
    bl: [number, number];
  };
}

export interface TrackingAttachment {
  trackId: string;
  attachType: 'position' | 'scale' | 'rotation' | 'corner-pin';
  offset?: { x: number; y: number };
}

export type TextAlignment = 'left' | 'center' | 'right';
export type TextAnimationType =
  | 'none'
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'typewriter'
  | 'zoom'
  | 'pop'
  | 'glow';

export interface TextProperties {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  alignment: TextAlignment;
  opacity: number;
  animation: TextAnimationType;
  letterSpacing?: number; // px
  lineHeight?: number; // multiplier e.g. 1.2
  backgroundColor?: string;
  backgroundPadding?: number;
  borderRadius?: number;
  outlineColor?: string;
  outlineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  gradient?: {
    enabled: boolean;
    startColor: string;
    endColor: string;
    direction: 'to-r' | 'to-b' | 'to-br';
  };
}

// Professional Audio Effects
export interface AudioEQBand {
  freqHz: number;
  gainDb: number; // -15 to +15
  q: number; // 0.1 to 10
  type: 'lowshelf' | 'peaking' | 'highshelf';
}

export interface AudioEQSettings {
  enabled: boolean;
  bands: AudioEQBand[];
}

export interface AudioCompressorSettings {
  enabled: boolean;
  thresholdDb: number; // -60 to 0
  ratio: number; // 1:1 to 20:1
  attackMs: number; // 1 to 200
  releaseMs: number; // 10 to 1000
  makeupGainDb: number; // 0 to 24
}

export interface AudioLimiterSettings {
  enabled: boolean;
  ceilingDb: number; // -12 to 0
  releaseMs: number; // 10 to 500
}

export interface AudioGateSettings {
  enabled: boolean;
  thresholdDb: number; // -80 to 0
  reductionDb: number; // -80 to 0
}

export interface AudioReverbSettings {
  enabled: boolean;
  roomSize: number; // 0 to 100
  damping: number; // 0 to 100
  wetDryMix: number; // 0 to 100%
}

export interface AudioDelaySettings {
  enabled: boolean;
  delayTimeMs: number; // 10 to 1000
  feedback: number; // 0 to 90%
  wetDryMix: number; // 0 to 100%
}

export interface AutoDuckingSettings {
  enabled: boolean;
  targetTrackId: string; // Track to duck under (e.g. Dialogue / Voiceover)
  duckAmountDb: number; // -6 to -24 dB
  attackMs: number; // 20 to 500 ms
  releaseMs: number; // 100 to 2000 ms
  thresholdDb: number; // -40 to -10 dB
}

export interface AudioNormalizationSettings {
  enabled: boolean;
  targetLufs: number; // e.g. -14 (YouTube), -23 (EBU R128), -16 (Podcast)
  peakCeilingDb: number; // e.g. -1.0 dBFS
  integratedLufsMeasured?: number;
}

export interface AudioProperties {
  volume: number; // 0 to 200
  muted: boolean;
  fadeInSec: number; // 0 to 5s
  fadeOutSec: number; // 0 to 5s
  pan?: number; // -100 (Left) to +100 (Right)
  syncOffsetMs?: number; // Manual micro-offset for audio sync
  eq?: AudioEQSettings;
  compressor?: AudioCompressorSettings;
  limiter?: AudioLimiterSettings;
  gate?: AudioGateSettings;
  reverb?: AudioReverbSettings;
  delay?: AudioDelaySettings;
  ducking?: AutoDuckingSettings;
  normalization?: AudioNormalizationSettings;
}

export type TransitionType =
  | 'none'
  | 'crossfade'
  | 'film-dissolve'
  | 'dip-black'
  | 'dip-white'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'wipe-down'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'motion-blur-dissolve'
  | 'glitch'
  | 'flash'
  | 'push-left'
  | 'push-right'
  | 'split'
  | 'whip-pan';

export interface Transition {
  type: TransitionType;
  durationSec: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  intensity?: number;
}

export interface TimelineClip {
  id: string;
  trackId: string;
  mediaAssetId?: string;
  type: ClipType;
  title: string;
  url?: string;
  startSec: number;
  durationSec: number;
  trimInSec: number;
  trimOutSec: number;
  colorBadge: string;
  transform: TransformProperties;
  keyframes: Keyframe[];
  speed: SpeedProperties;
  colorAdjustments: ColorProperties;
  text?: TextProperties;
  audio: AudioProperties;
  transitionIn?: Transition;
  transitionOut?: Transition;
  waveformSamples?: number[];
  thumbnailUrl?: string;
  // Phase 6 extensions:
  disabled?: boolean;
  groupId?: string;
  linkedClipId?: string; // Links detached audio/video
  masks?: ClipMask[];
  chromaKey?: ChromaKeySettings;
  cornerPin?: CornerPinSettings;
  motionBlur?: MotionBlurSettings;
  stabilization?: StabilizationSettings | string;
  opticalFlow?: OpticalFlowSettings;
  trackingAttachment?: TrackingAttachment;
  // Compound / Nested sequence contents
  compoundChildren?: TimelineClip[];
  resolutionTag?: string;
  matteApplied?: boolean;
  alphaCutout?: boolean;
  // Enhanced editing attributes
  filterPreset?: string;
  isFrozen?: boolean;
  freezeDurationSec?: number;
  extractedAudioClipId?: string;
}

export interface TimelineMarker {
  id: string;
  timeSec: number;
  label: string;
  color: string; // e.g. '#3b82f6'
}

export type EditModeTool = 'select' | 'split' | 'trim' | 'roll' | 'slip' | 'slide';

export interface ClipboardAttributes {
  transform?: boolean;
  colorGrade?: boolean;
  audio?: boolean;
  vfx?: boolean;
  transitions?: boolean;
  data: {
    transform?: TransformProperties;
    colorAdjustments?: ColorProperties;
    audio?: AudioProperties;
    masks?: ClipMask[];
    chromaKey?: ChromaKeySettings;
    cornerPin?: CornerPinSettings;
    motionBlur?: MotionBlurSettings;
    keyframes?: Keyframe[];
  };
}

export interface RenderQueueJob {
  id: string;
  title: string;
  projectTitle: string;
  type: 'export' | 'stabilization' | 'upscale' | 'optical_flow' | 'audio_master';
  status: 'queued' | 'running' | 'completed' | 'paused' | 'failed';
  progress: number; // 0 to 100
  createdAt: string;
  elapsedSec: number;
  estimatedSecRemaining?: number;
  outputUrl?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceSettings {
  mode: 'auto' | 'performance' | 'quality';
  useProxies: boolean;
  proxyResolution: '540p' | '720p';
  renderCacheEnabled: boolean;
  lowResPreview: boolean;
}

export type CanvasBackgroundType = 'color' | 'blur' | 'gradient';

export interface CanvasBackgroundSettings {
  type: CanvasBackgroundType;
  color?: string; // hex color e.g. '#000000', '#ffffff', '#1e293b'
  blurIntensity?: number; // 5 to 40 px
  gradient?: string; // e.g. 'linear-gradient(135deg, #1e1e24 0%, #2a2b36 100%)'
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  textColor: string;
  bgColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  position: 'bottom' | 'middle' | 'top';
  animation: 'none' | 'pop' | 'fade' | 'bounce';
}

export interface VideoEditorState {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  playheadSec: number;
  timelineZoom: number; // px per second
  snappingEnabled: boolean;
  rippleDeleteEnabled: boolean;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  markers?: TimelineMarker[];
  activeSequencePath?: string[]; // e.g. ['main', 'compound-clip-1']
  editModeTool?: EditModeTool;
  performanceSettings?: PerformanceSettings;
  clipboardAttributes?: ClipboardAttributes | null;
  tracksHeight?: 'compact' | 'standard' | 'expanded';
  canvasBackground?: CanvasBackgroundSettings;
  captions?: Array<{
    id: string;
    startSec: number;
    endSec: number;
    text: string;
  }>;
  captionStyle?: CaptionStyle;
}
