export interface AudioClip {
  id: string;
  trackId: string;
  title: string;
  startSec: number;        // position on timeline in seconds
  durationSec: number;    // duration in seconds on timeline
  offsetSec?: number;     // offset into original audio
  sourceDurationSec?: number;
  volumeDb: number;       // -60 to +12 dB
  pan: number;            // -100 to +100
  fadeInSec: number;      // fade in duration
  fadeOutSec: number;     // fade out duration
  crossfadeSec: number;   // crossfade duration
  muted: boolean;
  speed: number;          // 0.5x to 2.0x
  pitchSemitones: number; // -12 to +12
  waveformSamples: number[]; // 0..1 normalized heights
  color: string;
  sourceAudioUrl?: string;
  originalAudioUrl?: string; // Preserves original untouched
}

export interface AudioTrackEq {
  bassDb: number;       // -12 to +12 dB
  midDb: number;        // -12 to +12 dB
  trebleDb: number;     // -12 to +12 dB
  bassFreq: number;     // e.g. 100 Hz
  midFreq: number;      // e.g. 1000 Hz
  trebleFreq: number;   // e.g. 8000 Hz
  enabled: boolean;
}

export interface AudioTrack {
  id: string;
  name: string;
  color: string;
  volumeDb: number;     // -60 to +6 dB
  pan: number;          // -100 to +100
  muted: boolean;
  solo: boolean;
  balance?: number;     // -100 to +100
  eq: AudioTrackEq;
}

export type AudioEditorTab = 'timeline' | 'inspector' | 'mixer' | 'ai_prep';

export interface AudioProjectState {
  tracks: AudioTrack[];
  clips: AudioClip[];
  selectedClipId: string | null;
  selectedTrackId: string | null;
  currentTimeSec?: number;
  totalDurationSec: number;
  isPlaying?: boolean;
  isLooping?: boolean;
  zoom?: number;
  zoomPixelsPerSec?: number; // 20 to 200
  masterVolumeDb: number;
  masterPan: number;
  masterMute: boolean;
  masterEq: AudioTrackEq;
  activeTab: AudioEditorTab;
}

export const DEFAULT_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'track-1',
    name: 'Dialogue Voice',
    color: '#3b82f6',
    volumeDb: 0,
    pan: 0,
    muted: false,
    solo: false,
    balance: 0,
    eq: {
      bassDb: 0,
      midDb: 1.5,
      trebleDb: 2.0,
      bassFreq: 100,
      midFreq: 1000,
      trebleFreq: 8000,
      enabled: true,
    },
  },
  {
    id: 'track-2',
    name: 'Ambient Foley FX',
    color: '#10b981',
    volumeDb: -4.0,
    pan: -15,
    muted: false,
    solo: false,
    balance: 0,
    eq: {
      bassDb: -1.0,
      midDb: 0,
      trebleDb: 0.5,
      bassFreq: 100,
      midFreq: 1000,
      trebleFreq: 8000,
      enabled: true,
    },
  },
  {
    id: 'track-3',
    name: 'Cinematic Music Bed',
    color: '#8b5cf6',
    volumeDb: -6.5,
    pan: 10,
    muted: false,
    solo: false,
    balance: 0,
    eq: {
      bassDb: 1.0,
      midDb: -1.0,
      trebleDb: 0,
      bassFreq: 100,
      midFreq: 1000,
      trebleFreq: 8000,
      enabled: true,
    },
  },
];

export const DEFAULT_AUDIO_CLIPS: AudioClip[] = [
  {
    id: 'clip-1',
    trackId: 'track-1',
    title: 'Lead Narration Stem',
    startSec: 1.0,
    durationSec: 12.0,
    offsetSec: 0,
    volumeDb: 0,
    pan: 0,
    fadeInSec: 0.3,
    fadeOutSec: 0.5,
    crossfadeSec: 0,
    muted: false,
    speed: 1,
    pitchSemitones: 0,
    waveformSamples: [
      0.1, 0.4, 0.8, 0.6, 0.9, 0.7, 0.4, 0.6, 0.9, 0.8, 0.5, 0.7, 0.4, 0.2, 0.5, 0.8,
      0.9, 0.6, 0.8, 0.7, 0.4, 0.6, 0.5, 0.3, 0.6, 0.7, 0.4, 0.2, 0.5, 0.6, 0.3, 0.1,
    ],
    color: '#3b82f6',
  },
  {
    id: 'clip-2',
    trackId: 'track-2',
    title: 'Room Ambience & Wind',
    startSec: 0.0,
    durationSec: 24.0,
    offsetSec: 0,
    volumeDb: -3.0,
    pan: -15,
    fadeInSec: 1.0,
    fadeOutSec: 1.5,
    crossfadeSec: 0,
    muted: false,
    speed: 1,
    pitchSemitones: 0,
    waveformSamples: [
      0.2, 0.3, 0.25, 0.35, 0.4, 0.3, 0.25, 0.3, 0.35, 0.4, 0.3, 0.25, 0.35, 0.4, 0.3, 0.2,
      0.25, 0.3, 0.35, 0.3, 0.25, 0.3, 0.35, 0.3, 0.25, 0.2, 0.3, 0.35, 0.3, 0.25, 0.2, 0.15,
    ],
    color: '#10b981',
  },
  {
    id: 'clip-3',
    trackId: 'track-3',
    title: 'Warm Analog Synth Bed',
    startSec: 3.5,
    durationSec: 18.0,
    offsetSec: 0,
    volumeDb: -5.0,
    pan: 10,
    fadeInSec: 2.0,
    fadeOutSec: 2.5,
    crossfadeSec: 0.5,
    muted: false,
    speed: 1,
    pitchSemitones: 0,
    waveformSamples: [
      0.3, 0.5, 0.6, 0.7, 0.8, 0.75, 0.6, 0.7, 0.8, 0.7, 0.65, 0.7, 0.8, 0.75, 0.6, 0.5,
      0.55, 0.65, 0.75, 0.8, 0.7, 0.6, 0.7, 0.75, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.3, 0.2,
    ],
    color: '#8b5cf6',
  },
];
