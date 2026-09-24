import { VyroTemplate, TemplateCategory } from '../../types/templates';
import { TimelineTrack, TimelineClip, VideoEditorState } from '../../types/videoEditor';
import { DEFAULT_COLOR } from '../../data/videoEditorDefaults';
import { MediaAsset, Project } from '../../types';

const TEMPLATES_STORAGE_KEY = 'vyro_studio_templates_v1';

// Initial library of 16 original handcrafted VYRO templates
const INITIAL_TEMPLATES: VyroTemplate[] = [
  {
    id: 'tpl-trending-neon-drift',
    title: 'Neon Drift Rush',
    category: 'trending',
    description: 'High-octane urban rhythm with punchy beat cuts, glow accents, and dynamic push transitions.',
    aspectRatio: '9:16',
    durationSec: 12,
    bpm: 128,
    tags: ['trending', 'neon', 'fast', 'reels', 'energy'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
    accentColor: '#8b5cf6',
    createdAt: '2026-01-10T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Video Main', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'v2', label: 'Overlay / FX', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Titles & Captions', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Music Beat', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      {
        id: 'ph-1',
        label: 'Hook Scene (Opening impact)',
        type: 'video',
        targetTrackId: 'v1',
        startSec: 0,
        durationSec: 2.5,
        suggestedDurationText: '2.5s clip',
        transitionIn: { type: 'crossfade', durationSec: 0.3 },
        transitionOut: { type: 'push-left', durationSec: 0.3 },
        colorAdjustments: { contrast: 15, saturation: 115, exposure: 5, brightness: 0, temperature: -10, tint: 5, highlights: -10, shadows: 10 },
      },
      {
        id: 'ph-2',
        label: 'Beat Drop Scene',
        type: 'video',
        targetTrackId: 'v1',
        startSec: 2.5,
        durationSec: 3.5,
        suggestedDurationText: '3.5s clip',
        transitionIn: { type: 'push-left', durationSec: 0.3 },
        transitionOut: { type: 'zoom-in', durationSec: 0.4 },
        colorAdjustments: { contrast: 20, saturation: 120, exposure: 10, brightness: 0, temperature: 5, tint: 0, highlights: 0, shadows: 15 },
      },
      {
        id: 'ph-3',
        label: 'Climax Action',
        type: 'video',
        targetTrackId: 'v1',
        startSec: 6.0,
        durationSec: 3.5,
        suggestedDurationText: '3.5s clip',
        transitionIn: { type: 'zoom-in', durationSec: 0.4 },
        transitionOut: { type: 'dip-black', durationSec: 0.5 },
      },
      {
        id: 'ph-4',
        label: 'Outro Finale',
        type: 'video',
        targetTrackId: 'v1',
        startSec: 9.5,
        durationSec: 2.5,
        suggestedDurationText: '2.5s clip',
        transitionIn: { type: 'dip-black', durationSec: 0.5 },
        transitionOut: { type: 'crossfade', durationSec: 0.5 },
      },
      {
        id: 'ph-text-1',
        label: 'Opening Headline',
        type: 'text',
        targetTrackId: 't1',
        startSec: 0.5,
        durationSec: 2.0,
        defaultText: 'STAY TUNED',
      },
      {
        id: 'ph-text-2',
        label: 'Punchline / Call to Action',
        type: 'text',
        targetTrackId: 't1',
        startSec: 7.0,
        durationSec: 3.0,
        defaultText: 'FOLLOW FOR MORE',
      },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-beat-sync-voltage',
    title: 'Bass Drop Voltage',
    category: 'beat_sync',
    description: 'Precision synced cut pattern with flash pulses, zoom bounces, and dynamic speed ramping.',
    aspectRatio: '9:16',
    durationSec: 10,
    bpm: 140,
    tags: ['beat', 'sync', 'edm', 'flash', 'fast'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    accentColor: '#ec4899',
    createdAt: '2026-01-12T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Primary Video', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Beat Captions', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'EDM Master', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-b1', label: 'Intro Buildup', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 2.0, suggestedDurationText: '2s' },
      { id: 'ph-b2', label: 'Drop Kick 1', type: 'video', targetTrackId: 'v1', startSec: 2.0, durationSec: 1.5, suggestedDurationText: '1.5s', transitionIn: { type: 'flash', durationSec: 0.2 } },
      { id: 'ph-b3', label: 'Drop Kick 2', type: 'video', targetTrackId: 'v1', startSec: 3.5, durationSec: 1.5, suggestedDurationText: '1.5s', transitionIn: { type: 'zoom-in', durationSec: 0.2 } },
      { id: 'ph-b4', label: 'Main Sequence', type: 'video', targetTrackId: 'v1', startSec: 5.0, durationSec: 3.0, suggestedDurationText: '3s', transitionIn: { type: 'whip-pan', durationSec: 0.3 } },
      { id: 'ph-b5', label: 'Impact Outro', type: 'video', targetTrackId: 'v1', startSec: 8.0, durationSec: 2.0, suggestedDurationText: '2s', transitionOut: { type: 'dip-black', durationSec: 0.4 } },
      { id: 'ph-bt-1', label: 'Center Drop Text', type: 'text', targetTrackId: 't1', startSec: 2.0, durationSec: 2.5, defaultText: 'FEEL THE DROP' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-reels-viral-pov',
    title: 'Viral POV Story',
    category: 'reels',
    description: 'Clean TikTok & Reels narrative layout with punchy text cards and seamless slide transitions.',
    aspectRatio: '9:16',
    durationSec: 15,
    tags: ['reels', 'tiktok', 'story', 'pov', 'creator'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    accentColor: '#3b82f6',
    createdAt: '2026-01-14T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Camera Roll', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Subtitles & Badges', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Voiceover / Audio', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-r1', label: 'POV Hook (First 3 sec)', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 3.0 },
      { id: 'ph-r2', label: 'Context / Evidence', type: 'video', targetTrackId: 'v1', startSec: 3.0, durationSec: 4.0, transitionIn: { type: 'slide-left', durationSec: 0.3 } },
      { id: 'ph-r3', label: 'The Surprise / Reaction', type: 'video', targetTrackId: 'v1', startSec: 7.0, durationSec: 4.0, transitionIn: { type: 'zoom-in', durationSec: 0.3 } },
      { id: 'ph-r4', label: 'Final Result', type: 'video', targetTrackId: 'v1', startSec: 11.0, durationSec: 4.0, transitionIn: { type: 'crossfade', durationSec: 0.4 } },
      { id: 'ph-rt-1', label: 'Hook Title', type: 'text', targetTrackId: 't1', startSec: 0, durationSec: 3.0, defaultText: 'POV: You discovered this secret' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-shorts-quick-reveal',
    title: 'Quick Tech Reveal',
    category: 'shorts',
    description: 'Fast vertical YouTube Shorts showcase with high-contrast text bubbles and camera push cuts.',
    aspectRatio: '9:16',
    durationSec: 12,
    tags: ['shorts', 'tech', 'reveal', 'fast', 'social'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    accentColor: '#10b981',
    createdAt: '2026-01-15T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Product Video', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Feature Bullets', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Background Beat', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-s1', label: 'Product Teaser', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 3.0 },
      { id: 'ph-s2', label: 'Feature 1 in Action', type: 'video', targetTrackId: 'v1', startSec: 3.0, durationSec: 3.0, transitionIn: { type: 'push-left', durationSec: 0.25 } },
      { id: 'ph-s3', label: 'Feature 2 Detail', type: 'video', targetTrackId: 'v1', startSec: 6.0, durationSec: 3.0, transitionIn: { type: 'push-right', durationSec: 0.25 } },
      { id: 'ph-s4', label: 'Final Call to Action', type: 'video', targetTrackId: 'v1', startSec: 9.0, durationSec: 3.0, transitionIn: { type: 'zoom-in', durationSec: 0.3 } },
      { id: 'ph-st-1', label: 'Feature Callout', type: 'text', targetTrackId: 't1', startSec: 0.5, durationSec: 2.5, defaultText: 'GAME CHANGER' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-travel-wanderlust',
    title: 'Wanderlust Horizons',
    category: 'travel',
    description: 'Breathtaking landscape montage with warm film grading, soft dissolves, and gentle pans.',
    aspectRatio: '16:9',
    durationSec: 18,
    tags: ['travel', 'nature', 'cinematic', 'landscape', 'warm'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
    accentColor: '#f59e0b',
    createdAt: '2026-01-16T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Scenery Track', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Location Marker', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Acoustic Soundscape', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-t1', label: 'Arrival / Road', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 4.5, transitionOut: { type: 'film-dissolve', durationSec: 0.8 } },
      { id: 'ph-t2', label: 'Scenic Vista 1', type: 'video', targetTrackId: 'v1', startSec: 4.5, durationSec: 4.5, transitionIn: { type: 'film-dissolve', durationSec: 0.8 }, transitionOut: { type: 'film-dissolve', durationSec: 0.8 } },
      { id: 'ph-t3', label: 'Scenic Vista 2', type: 'video', targetTrackId: 'v1', startSec: 9.0, durationSec: 4.5, transitionIn: { type: 'film-dissolve', durationSec: 0.8 }, transitionOut: { type: 'film-dissolve', durationSec: 0.8 } },
      { id: 'ph-t4', label: 'Golden Hour Sunset', type: 'video', targetTrackId: 'v1', startSec: 13.5, durationSec: 4.5, transitionIn: { type: 'film-dissolve', durationSec: 0.8 }, transitionOut: { type: 'dip-black', durationSec: 1.0 } },
      { id: 'ph-tt-1', label: 'Location & Year', type: 'text', targetTrackId: 't1', startSec: 1.0, durationSec: 4.0, defaultText: 'NORWAY // 2026' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-bike-velocity-apex',
    title: 'Velocity Apex (Motor & Action)',
    category: 'bike_auto',
    description: 'Fast-paced motor and sports edit with whip-pan sweeps, speed ramps, and high contrast.',
    aspectRatio: '9:16',
    durationSec: 14,
    tags: ['bike', 'auto', 'action', 'speed', 'whip-pan'],
    isPro: true,
    previewThumbnail: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    accentColor: '#ef4444',
    createdAt: '2026-01-18T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Action Cam', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'HUD & Tachometer', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Engine & Bass', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-va1', label: 'Helmet / Start Up', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 2.5, transitionOut: { type: 'whip-pan', durationSec: 0.3 } },
      { id: 'ph-va2', label: 'Corner Lean', type: 'video', targetTrackId: 'v1', startSec: 2.5, durationSec: 3.5, transitionIn: { type: 'whip-pan', durationSec: 0.3 }, transitionOut: { type: 'zoom-in', durationSec: 0.3 } },
      { id: 'ph-va3', label: 'Straightaway Acceleration', type: 'video', targetTrackId: 'v1', startSec: 6.0, durationSec: 4.0, transitionIn: { type: 'zoom-in', durationSec: 0.3 }, transitionOut: { type: 'whip-pan', durationSec: 0.3 } },
      { id: 'ph-va4', label: 'Finish Line Stop', type: 'video', targetTrackId: 'v1', startSec: 10.0, durationSec: 4.0, transitionIn: { type: 'whip-pan', durationSec: 0.3 } },
      { id: 'ph-vat-1', label: 'Speed / Track Name', type: 'text', targetTrackId: 't1', startSec: 0.5, durationSec: 3.0, defaultText: 'FULL THROTTLE' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-cinematic-noir-anamorphic',
    title: 'Anamorphic Moody Noir',
    category: 'cinematic',
    description: 'Ultra-wide cinematic storytelling with subtle film grain, letterboxing, and deep shadows.',
    aspectRatio: '16:9',
    durationSec: 20,
    tags: ['cinematic', 'film', 'letterbox', 'noir', 'story'],
    isPro: true,
    previewThumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80',
    accentColor: '#6366f1',
    createdAt: '2026-01-20T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Cinema Primary', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Title Card', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Orchestral Score', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-c1', label: 'Establishing Wide', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 6.0, transitionOut: { type: 'film-dissolve', durationSec: 1.0 } },
      { id: 'ph-c2', label: 'Medium Character Focus', type: 'video', targetTrackId: 'v1', startSec: 6.0, durationSec: 7.0, transitionIn: { type: 'film-dissolve', durationSec: 1.0 }, transitionOut: { type: 'film-dissolve', durationSec: 1.0 } },
      { id: 'ph-c3', label: 'Dramatic Close Up', type: 'video', targetTrackId: 'v1', startSec: 13.0, durationSec: 7.0, transitionIn: { type: 'film-dissolve', durationSec: 1.0 }, transitionOut: { type: 'dip-black', durationSec: 1.2 } },
      { id: 'ph-ct-1', label: 'Film Title', type: 'text', targetTrackId: 't1', startSec: 1.5, durationSec: 4.5, defaultText: 'THE UNSEEN HOUR' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-birthday-celebration',
    title: 'Celebration Confetti Party',
    category: 'birthday',
    description: 'Vibrant party montage with cheerful color saturation, pop animations, and photo frames.',
    aspectRatio: '9:16',
    durationSec: 15,
    tags: ['birthday', 'celebration', 'party', 'happy', 'family'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
    accentColor: '#f43f5e',
    createdAt: '2026-01-22T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Party Footage', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Greeting Badges', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Upbeat Track', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-bd1', label: 'Cake / Candles', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 3.5, transitionOut: { type: 'zoom-in', durationSec: 0.3 } },
      { id: 'ph-bd2', label: 'Friends & Family Cheering', type: 'video', targetTrackId: 'v1', startSec: 3.5, durationSec: 4.0, transitionIn: { type: 'zoom-in', durationSec: 0.3 }, transitionOut: { type: 'slide-left', durationSec: 0.3 } },
      { id: 'ph-bd3', label: 'Gift Opening / Surprise', type: 'video', targetTrackId: 'v1', startSec: 7.5, durationSec: 4.0, transitionIn: { type: 'slide-left', durationSec: 0.3 }, transitionOut: { type: 'crossfade', durationSec: 0.4 } },
      { id: 'ph-bd4', label: 'Group Hug / Photo', type: 'video', targetTrackId: 'v1', startSec: 11.5, durationSec: 3.5, transitionIn: { type: 'crossfade', durationSec: 0.4 } },
      { id: 'ph-bdt-1', label: 'Happy Birthday Header', type: 'text', targetTrackId: 't1', startSec: 0.5, durationSec: 4.0, defaultText: 'HAPPY BIRTHDAY!' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-festival-carnival-glow',
    title: 'Festival Carnival Lights',
    category: 'festival',
    description: 'Dynamic light leak bursts and colorful festival memories with strobe transitions.',
    aspectRatio: '9:16',
    durationSec: 15,
    tags: ['festival', 'lights', 'concert', 'music', 'dance'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    accentColor: '#06b6d4',
    createdAt: '2026-01-24T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Stage / Crowd', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Event Banner', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Festival Drop', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-f1', label: 'Crowd Waves', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 3.5, transitionOut: { type: 'flash', durationSec: 0.25 } },
      { id: 'ph-f2', label: 'Stage Lights Burst', type: 'video', targetTrackId: 'v1', startSec: 3.5, durationSec: 4.0, transitionIn: { type: 'flash', durationSec: 0.25 }, transitionOut: { type: 'whip-pan', durationSec: 0.3 } },
      { id: 'ph-f3', label: 'Dancing Moment', type: 'video', targetTrackId: 'v1', startSec: 7.5, durationSec: 4.0, transitionIn: { type: 'whip-pan', durationSec: 0.3 }, transitionOut: { type: 'zoom-in', durationSec: 0.3 } },
      { id: 'ph-f4', label: 'Fireworks Finale', type: 'video', targetTrackId: 'v1', startSec: 11.5, durationSec: 3.5, transitionIn: { type: 'zoom-in', durationSec: 0.3 } },
      { id: 'ph-ft-1', label: 'Festival Name', type: 'text', targetTrackId: 't1', startSec: 0.5, durationSec: 3.5, defaultText: 'ELECTRIC NIGHTS' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-photo-montage-polaroid',
    title: 'Polaroid Memory Flashback',
    category: 'photo_montage',
    description: 'Transform multiple still photos into an animated scrapbook with subtle zoom and soft shadows.',
    aspectRatio: '1:1',
    durationSec: 14,
    tags: ['photos', 'polaroid', 'memories', 'montage', 'square'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&auto=format&fit=crop&q=80',
    accentColor: '#14b8a6',
    createdAt: '2026-01-26T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Photo Slides', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Date Captions', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Acoustic Melody', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-pm1', label: 'Memory Photo 1', type: 'image', targetTrackId: 'v1', startSec: 0, durationSec: 2.8, transitionOut: { type: 'crossfade', durationSec: 0.4 } },
      { id: 'ph-pm2', label: 'Memory Photo 2', type: 'image', targetTrackId: 'v1', startSec: 2.8, durationSec: 2.8, transitionIn: { type: 'crossfade', durationSec: 0.4 }, transitionOut: { type: 'crossfade', durationSec: 0.4 } },
      { id: 'ph-pm3', label: 'Memory Photo 3', type: 'image', targetTrackId: 'v1', startSec: 5.6, durationSec: 2.8, transitionIn: { type: 'crossfade', durationSec: 0.4 }, transitionOut: { type: 'crossfade', durationSec: 0.4 } },
      { id: 'ph-pm4', label: 'Memory Photo 4', type: 'image', targetTrackId: 'v1', startSec: 8.4, durationSec: 2.8, transitionIn: { type: 'crossfade', durationSec: 0.4 }, transitionOut: { type: 'crossfade', durationSec: 0.4 } },
      { id: 'ph-pm5', label: 'Memory Photo 5', type: 'image', targetTrackId: 'v1', startSec: 11.2, durationSec: 2.8, transitionIn: { type: 'crossfade', durationSec: 0.4 } },
      { id: 'ph-pmt-1', label: 'Scrapbook Note', type: 'text', targetTrackId: 't1', startSec: 0.5, durationSec: 4.0, defaultText: 'MOMENTS TO REMEMBER' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-slow-mo-elegance',
    title: 'Elegance Slow Motion',
    category: 'slow_mo',
    description: 'Silky smooth 0.5x speed curve with soft color grading and motion blur dissolve.',
    aspectRatio: '9:16',
    durationSec: 12,
    tags: ['slowmo', 'aesthetic', 'smooth', 'elegance', 'fashion'],
    isPro: true,
    previewThumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
    accentColor: '#a855f7',
    createdAt: '2026-01-28T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Slow Motion Video', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Aesthetic Subtitle', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Ambient Synth', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-sm1', label: 'Glance / Entry (Slow-Mo)', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 6.0, transitionOut: { type: 'motion-blur-dissolve', durationSec: 0.6 } },
      { id: 'ph-sm2', label: 'Movement / Flow (Slow-Mo)', type: 'video', targetTrackId: 'v1', startSec: 6.0, durationSec: 6.0, transitionIn: { type: 'motion-blur-dissolve', durationSec: 0.6 } },
      { id: 'ph-smt-1', label: 'Minimalist Quote', type: 'text', targetTrackId: 't1', startSec: 1.0, durationSec: 5.0, defaultText: 'Grace in every motion' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-music-promo-pulse',
    title: 'Soundwave Track Teaser',
    category: 'music_promo',
    description: 'Promotional music video teaser with center cover art, audio reactivity, and streaming callouts.',
    aspectRatio: '9:16',
    durationSec: 15,
    tags: ['music', 'album', 'single', 'streaming', 'cover'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    accentColor: '#e11d48',
    createdAt: '2026-01-30T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Cover Art / Backdrop', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Track & Artist Title', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Song Preview', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-mp1', label: 'Album Artwork / Visualizer', type: 'image', targetTrackId: 'v1', startSec: 0, durationSec: 15.0 },
      { id: 'ph-mpt-1', label: 'Song Title & Artist', type: 'text', targetTrackId: 't1', startSec: 0.5, durationSec: 14.0, defaultText: 'OUT NOW ON ALL PLATFORMS' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-product-minimal-spec',
    title: 'Minimalist Product Spotlight',
    category: 'product_showcase',
    description: 'Studio commercial layout with feature badges, smooth push transitions, and crisp lighting.',
    aspectRatio: '1:1',
    durationSec: 12,
    tags: ['product', 'commercial', 'brand', 'e-commerce', 'clean'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    accentColor: '#0ea5e9',
    createdAt: '2026-02-01T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Product Hero', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Spec Callouts', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Chic Commercial Beat', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-pr1', label: 'Product Angle 1', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 4.0, transitionOut: { type: 'slide-left', durationSec: 0.3 } },
      { id: 'ph-pr2', label: 'Detail / Material Close-up', type: 'video', targetTrackId: 'v1', startSec: 4.0, durationSec: 4.0, transitionIn: { type: 'slide-left', durationSec: 0.3 }, transitionOut: { type: 'slide-left', durationSec: 0.3 } },
      { id: 'ph-pr3', label: 'In Use / In Hand', type: 'video', targetTrackId: 'v1', startSec: 8.0, durationSec: 4.0, transitionIn: { type: 'slide-left', durationSec: 0.3 } },
      { id: 'ph-prt-1', label: 'Key Selling Point', type: 'text', targetTrackId: 't1', startSec: 1.0, durationSec: 3.0, defaultText: 'ENGINEERED FOR PERFECTION' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-before-after-reveal',
    title: 'Transformation Split Reveal',
    category: 'before_after',
    description: 'Clean before-and-after comparison with wipe reveal and side-by-side verification tags.',
    aspectRatio: '9:16',
    durationSec: 10,
    tags: ['before-after', 'comparison', 'transformation', 'results'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
    accentColor: '#10b981',
    createdAt: '2026-02-03T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Comparison Video', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Label Badges', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Suspense Sound', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-ba1', label: 'Before State', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 5.0, transitionOut: { type: 'wipe-right', durationSec: 0.5 } },
      { id: 'ph-ba2', label: 'After / Transformed State', type: 'video', targetTrackId: 'v1', startSec: 5.0, durationSec: 5.0, transitionIn: { type: 'wipe-right', durationSec: 0.5 } },
      { id: 'ph-bat-1', label: 'Before Tag', type: 'text', targetTrackId: 't1', startSec: 0.5, durationSec: 4.0, defaultText: 'BEFORE' },
      { id: 'ph-bat-2', label: 'After Tag', type: 'text', targetTrackId: 't1', startSec: 5.5, durationSec: 4.0, defaultText: 'AFTER' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-status-story-minimal',
    title: 'Daily Reflection Status',
    category: 'status_story',
    description: 'Clean typographic story layout for WhatsApp status, Instagram stories, and daily thoughts.',
    aspectRatio: '9:16',
    durationSec: 10,
    tags: ['status', 'story', 'quote', 'minimal', 'aesthetic'],
    isPro: false,
    previewThumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    accentColor: '#64748b',
    createdAt: '2026-02-05T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Background Video', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Reflection Quote', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Lo-Fi Audio', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-ss1', label: 'Calm Background Video / Photo', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 10.0 },
      { id: 'ph-sst-1', label: 'Thought of the Day', type: 'text', targetTrackId: 't1', startSec: 1.0, durationSec: 8.0, defaultText: 'Consistency compounds quietly.' },
    ],
    defaultClips: [],
  },
  {
    id: 'tpl-intro-outro-ident',
    title: 'Cyber Studio Intro / Outro',
    category: 'intro_outro',
    description: 'Electric logo blast and social subscribe callout for YouTube channels and video creators.',
    aspectRatio: '16:9',
    durationSec: 8,
    tags: ['intro', 'outro', 'youtube', 'logo', 'subscribe'],
    isPro: true,
    previewThumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    accentColor: '#f97316',
    createdAt: '2026-02-07T12:00:00.000Z',
    tracks: [
      { id: 'v1', label: 'Motion Graphics', type: 'video', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 't1', label: 'Channel Name', type: 'text', muted: false, locked: false, hidden: false, volume: 1 },
      { id: 'a1', label: 'Sound FX Whoosh', type: 'audio', muted: false, locked: false, hidden: false, volume: 1 },
    ],
    placeholders: [
      { id: 'ph-io1', label: 'Logo / Graphic Burst', type: 'video', targetTrackId: 'v1', startSec: 0, durationSec: 8.0 },
      { id: 'ph-iot-1', label: 'Channel Name / Social Handle', type: 'text', targetTrackId: 't1', startSec: 1.0, durationSec: 6.0, defaultText: 'YOUR CHANNEL NAME' },
    ],
    defaultClips: [],
  },
];

export class TemplateService {
  /**
   * Get all available templates
   */
  static getAllTemplates(): VyroTemplate[] {
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (stored) {
        const customTemplates: VyroTemplate[] = JSON.parse(stored);
        // Combine initial and custom, eliminating duplicates
        const customMap = new Map(customTemplates.map(t => [t.id, t]));
        const combined = INITIAL_TEMPLATES.map(t => customMap.get(t.id) || t);
        // Add any purely custom created ones
        customTemplates.forEach(t => {
          if (!combined.some(c => c.id === t.id)) {
            combined.push(t);
          }
        });
        return combined;
      }
    } catch {
      // Fallback to initial
    }
    return INITIAL_TEMPLATES;
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): VyroTemplate | null {
    const all = this.getAllTemplates();
    return all.find(t => t.id === id) || null;
  }

  /**
   * Favorites management
   */
  static getFavorites(): string[] {
    try {
      const saved = localStorage.getItem('vyro_template_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  static toggleFavorite(templateId: string): boolean {
    const favs = this.getFavorites();
    const idx = favs.indexOf(templateId);
    let isFav = false;
    if (idx >= 0) {
      favs.splice(idx, 1);
      isFav = false;
    } else {
      favs.push(templateId);
      isFav = true;
    }
    try {
      localStorage.setItem('vyro_template_favorites', JSON.stringify(favs));
      window.dispatchEvent(new CustomEvent('template-favorites-updated', { detail: favs }));
    } catch (e) {
      console.warn('Failed to save template favorites', e);
    }
    return isFav;
  }

  /**
   * Recently used templates tracking
   */
  static getRecentlyUsed(): string[] {
    try {
      const saved = localStorage.getItem('vyro_template_recently_used');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  static recordRecentlyUsed(templateId: string): void {
    const recent = this.getRecentlyUsed().filter(id => id !== templateId);
    recent.unshift(templateId);
    try {
      localStorage.setItem('vyro_template_recently_used', JSON.stringify(recent.slice(0, 20)));
    } catch (e) {
      console.warn('Failed to save recently used template', e);
    }
  }

  /**
   * User custom saved templates ("My Templates")
   */
  static getMyTemplates(): VyroTemplate[] {
    try {
      const saved = localStorage.getItem('vyro_my_custom_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  static saveToMyTemplates(template: VyroTemplate): void {
    const list = this.getMyTemplates();
    const existingIdx = list.findIndex(t => t.id === template.id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...template, createdAt: new Date().toISOString() };
    } else {
      list.unshift({ ...template, createdAt: new Date().toISOString() });
    }
    try {
      localStorage.setItem('vyro_my_custom_templates', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('my-templates-updated', { detail: list }));
    } catch (e) {
      console.warn('Failed to save to my templates', e);
    }
  }

  /**
   * Owner action: Save or create a new template
   */
  static saveTemplate(template: VyroTemplate): void {
    const all = this.getAllTemplates();
    const existingIndex = all.findIndex(t => t.id === template.id);
    if (existingIndex >= 0) {
      all[existingIndex] = { ...template, createdAt: new Date().toISOString() };
    } else {
      all.unshift({ ...template, createdByOwner: true, createdAt: new Date().toISOString() });
    }
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      console.error('Failed to persist template:', err);
    }
  }

  /**
   * Owner action: Delete a template
   */
  static deleteTemplate(id: string): void {
    const all = this.getAllTemplates().filter(t => t.id !== id);
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  }

  /**
   * Instantiate template into a functional VYRO Video Project
   */
  static instantiateTemplate(
    template: VyroTemplate,
    mediaMap: Record<string, { url: string; name?: string; type?: 'video' | 'image' | 'audio' }> = {}
  ): {
    title: string;
    aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '4:3';
    tracks: TimelineTrack[];
    clips: TimelineClip[];
    totalDurationSec: number;
  } {
    const tracks = JSON.parse(JSON.stringify(template.tracks)) as TimelineTrack[];
    const clips: TimelineClip[] = [];

    template.placeholders.forEach((ph, idx) => {
      const userAsset = mediaMap[ph.id];
      const clipId = `clip-tpl-${Date.now()}-${idx}`;
      const url = userAsset?.url || (ph.type === 'video' || ph.type === 'image' ? template.previewThumbnail : undefined);

      if (ph.type === 'text') {
        clips.push({
          id: clipId,
          trackId: ph.targetTrackId,
          type: 'text',
          title: ph.label,
          startSec: ph.startSec,
          durationSec: ph.durationSec,
          trimInSec: 0,
          trimOutSec: ph.durationSec,
          colorBadge: '#8b5cf6',
          transform: {
            positionX: 0,
            positionY: 40,
            scale: 100,
            rotation: 0,
            cropTop: 0,
            cropBottom: 0,
            cropLeft: 0,
            cropRight: 0,
            flipHorizontal: false,
            flipVertical: false,
            opacity: 100,
            blendMode: 'normal',
            fitMode: 'fit',
          },
          keyframes: [],
          speed: { speed: 1.0, reverse: false, freezeFrame: false, ramp: 'linear' },
          colorAdjustments: { ...DEFAULT_COLOR },
          text: {
            text: ph.defaultText || 'TEXT TITLE',
            fontFamily: 'Inter, sans-serif',
            fontSize: 28,
            color: '#FFFFFF',
            alignment: 'center',
            opacity: 100,
            animation: 'fade',
          },
          audio: { volume: 100, muted: false, fadeInSec: 0, fadeOutSec: 0 },
          transitionIn: ph.transitionIn,
          transitionOut: ph.transitionOut,
        });
      } else if (ph.type === 'audio') {
        clips.push({
          id: clipId,
          trackId: ph.targetTrackId,
          type: 'audio',
          title: userAsset?.name || ph.label,
          url,
          startSec: ph.startSec,
          durationSec: ph.durationSec,
          trimInSec: 0,
          trimOutSec: ph.durationSec,
          colorBadge: '#10b981',
          transform: {
            positionX: 0,
            positionY: 0,
            scale: 100,
            rotation: 0,
            cropTop: 0,
            cropBottom: 0,
            cropLeft: 0,
            cropRight: 0,
            flipHorizontal: false,
            flipVertical: false,
            opacity: 100,
          },
          keyframes: [],
          speed: { speed: 1.0, reverse: false, freezeFrame: false, ramp: 'linear' },
          colorAdjustments: { ...DEFAULT_COLOR },
          audio: { volume: 100, muted: false, fadeInSec: 0.5, fadeOutSec: 0.5 },
        });
      } else {
        // Video or Image
        clips.push({
          id: clipId,
          trackId: ph.targetTrackId,
          type: (userAsset?.type || ph.type) as 'video' | 'image',
          title: userAsset?.name || ph.label,
          url,
          startSec: ph.startSec,
          durationSec: ph.durationSec,
          trimInSec: 0,
          trimOutSec: ph.durationSec,
          colorBadge: template.accentColor || '#3b82f6',
          transform: {
            positionX: ph.transform?.positionX ?? 0,
            positionY: ph.transform?.positionY ?? 0,
            scale: ph.transform?.scale ?? 100,
            rotation: ph.transform?.rotation ?? 0,
            cropTop: ph.transform?.cropTop ?? 0,
            cropBottom: ph.transform?.cropBottom ?? 0,
            cropLeft: ph.transform?.cropLeft ?? 0,
            cropRight: ph.transform?.cropRight ?? 0,
            flipHorizontal: ph.transform?.flipHorizontal ?? false,
            flipVertical: ph.transform?.flipVertical ?? false,
            opacity: ph.transform?.opacity ?? 100,
            blendMode: ph.transform?.blendMode ?? 'normal',
            fitMode: ph.transform?.fitMode ?? 'fill',
          },
          keyframes: [],
          speed: { speed: 1.0, reverse: false, freezeFrame: false, ramp: 'linear' },
          colorAdjustments: {
            ...DEFAULT_COLOR,
            ...ph.colorAdjustments,
          },
          audio: { volume: 100, muted: false, fadeInSec: 0, fadeOutSec: 0 },
          transitionIn: ph.transitionIn,
          transitionOut: ph.transitionOut,
        });
      }
    });

    return {
      title: `${template.title} Project`,
      aspectRatio: template.aspectRatio,
      tracks,
      clips,
      totalDurationSec: template.durationSec,
    };
  }
}
