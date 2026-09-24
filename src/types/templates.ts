import { TimelineTrack, TimelineClip, TransformProperties, ColorProperties, Transition } from './videoEditor';

export type TemplateCategory =
  | 'reels'
  | 'shorts'
  | 'youtube'
  | 'travel'
  | 'bike'
  | 'cinematic'
  | 'vlog'
  | 'birthday'
  | 'festival'
  | 'product'
  | 'business'
  | 'photo_montage'
  | 'beat_sync'
  | 'social_media'
  // Legacy aliases
  | 'trending'
  | 'bike_auto'
  | 'slow_mo'
  | 'music_promo'
  | 'product_showcase'
  | 'before_after'
  | 'status_story'
  | 'intro_outro';

export interface TemplatePlaceholder {
  id: string;
  label: string;
  type: 'video' | 'image' | 'text' | 'audio';
  targetTrackId: string;
  startSec: number;
  durationSec: number;
  defaultText?: string;
  suggestedDurationText?: string;
  transform?: Partial<TransformProperties>;
  transitionIn?: Transition;
  transitionOut?: Transition;
  colorAdjustments?: Partial<ColorProperties>;
  userMediaUrl?: string;
  userMediaName?: string;
}

export interface VyroTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  description: string;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '4:3';
  durationSec: number;
  bpm?: number;
  tags: string[];
  isPro: boolean;
  previewThumbnail: string;
  accentColor: string;
  placeholders: TemplatePlaceholder[];
  tracks: TimelineTrack[];
  defaultClips: TimelineClip[];
  createdAt: string;
  createdByOwner?: boolean;
}
