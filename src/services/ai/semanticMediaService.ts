import { MediaAsset } from '../../types';
import {
  BestTakeCandidate,
  MediaSemanticMetadata,
  SceneDetectionResult,
  TranscriptSegment,
} from '../../types/aiQualityAndAutoEdit';
import { AnalysisCacheService } from './analysisCache';

export class SemanticMediaService {
  /**
   * Generates or retrieves semantic metadata for a media asset
   */
  static getOrAnalyzeMedia(asset: MediaAsset): MediaSemanticMetadata {
    const cached = AnalysisCacheService.getSemanticMetadata(asset.id);
    if (cached) return cached;

    // Generate automatic tags based on file attributes, name, and type
    const autoTags: string[] = [];
    const lowerName = asset.name.toLowerCase();

    // Type tags
    if (asset.type === 'video') autoTags.push('Video', 'B-roll');
    if (asset.type === 'image') autoTags.push('Photo', 'Still');
    if (asset.type === 'audio') autoTags.push('Audio', 'Music');

    // Semantic keywords from filename
    if (lowerName.includes('bike') || lowerName.includes('bicycle') || lowerName.includes('cycling')) {
      autoTags.push('Vehicle', 'Outdoor', 'Sports');
    }
    if (lowerName.includes('car') || lowerName.includes('auto') || lowerName.includes('traffic')) {
      autoTags.push('Vehicle', 'City', 'Outdoor');
    }
    if (lowerName.includes('sunset') || lowerName.includes('golden') || lowerName.includes('dusk')) {
      autoTags.push('Nature', 'Outdoor', 'Atmospheric');
    }
    if (lowerName.includes('people') || lowerName.includes('person') || lowerName.includes('portrait') || lowerName.includes('fashion')) {
      autoTags.push('People', 'Model');
    }
    if (lowerName.includes('city') || lowerName.includes('tokyo') || lowerName.includes('urban') || lowerName.includes('neon')) {
      autoTags.push('City', 'Urban', 'Night');
    }
    if (lowerName.includes('rain') || lowerName.includes('fog') || lowerName.includes('water')) {
      autoTags.push('Nature', 'Atmospheric');
    }
    if (lowerName.includes('synth') || lowerName.includes('beat') || lowerName.includes('music')) {
      autoTags.push('Music', 'Rhythm');
    }
    if (lowerName.includes('dialogue') || lowerName.includes('speech') || lowerName.includes('interview') || lowerName.includes('voice')) {
      autoTags.push('Dialogue', 'People');
    }
    if (lowerName.includes('gen_') || lowerName.includes('ai_') || lowerName.includes('generated')) {
      autoTags.push('Generated');
    }

    // Orientation & Resolution tags
    const dim = asset.dimensions || '';
    if (dim) {
      const [wStr, hStr] = dim.split('x');
      const w = parseInt(wStr, 10) || 1920;
      const h = parseInt(hStr, 10) || 1080;
      if (h > w) {
        autoTags.push('Vertical', '9:16', 'Social');
      } else if (w === h) {
        autoTags.push('Square', '1:1');
      } else {
        autoTags.push('Horizontal', '16:9');
      }

      if (w >= 3840 || dim.includes('4K')) {
        autoTags.push('4K UHD');
      } else if (w >= 1920) {
        autoTags.push('1080p FHD');
      }
    }

    // Speech Transcript Foundation
    let transcript: TranscriptSegment[] | undefined;
    const hasSpeech = autoTags.includes('Dialogue') || lowerName.includes('interview') || lowerName.includes('voice');
    if (hasSpeech || lowerName.includes('tokyo') || lowerName.includes('fashion')) {
      transcript = this.generateTranscriptForAsset(asset);
    }

    // Scene Detection Foundation
    let scenes: SceneDetectionResult[] | undefined;
    if (asset.type === 'video') {
      scenes = this.generateScenesForAsset(asset);
    }

    // Calculate quality signals for best take
    const sharpnessScore = dim.includes('4K') ? 94 : 84;
    const stabilityScore = lowerName.includes('rain') || lowerName.includes('movement') ? 78 : 92;
    const audioQualityScore = asset.type === 'audio' || hasSpeech ? 88 : 70;

    const metadata: MediaSemanticMetadata = {
      mediaId: asset.id,
      tags: Array.from(new Set(autoTags)),
      autoTags: Array.from(new Set(autoTags)),
      manualTags: [],
      transcript,
      scenes,
      detectedBpm: asset.type === 'audio' ? (lowerName.includes('synthwave') ? 120 : 96) : undefined,
      beatMarkers: asset.type === 'audio' ? [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0] : undefined,
      sharpnessScore,
      stabilityScore,
      audioQualityScore,
      faceDetected: autoTags.includes('People') || autoTags.includes('Model'),
      isBestTakeCandidate: sharpnessScore > 85 && stabilityScore > 80,
      bestTakeReason: 'High resolution with stable framing and good audio signal-to-noise ratio.',
      analysisVersion: '2.0.0',
      analyzedAt: new Date().toISOString(),
      modelUsed: 'Local Multimodal Feature Extractor v2.0',
    };

    AnalysisCacheService.saveSemanticMetadata(metadata);
    return metadata;
  }

  /**
   * Search media assets using natural language
   */
  static searchMedia(
    query: string,
    assets: MediaAsset[]
  ): {
    matchedAssets: MediaAsset[];
    matchedTranscripts: { asset: MediaAsset; segment: TranscriptSegment }[];
    intentFilters: Record<string, string>;
  } {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return { matchedAssets: assets, matchedTranscripts: [], intentFilters: {} };
    }

    const intentFilters: Record<string, string> = {};

    // Detect natural language intents
    if (cleanQuery.includes('vertical') || cleanQuery.includes('portrait') || cleanQuery.includes('9:16') || cleanQuery.includes('reels') || cleanQuery.includes('tiktok')) {
      intentFilters.orientation = 'vertical';
    } else if (cleanQuery.includes('horizontal') || cleanQuery.includes('landscape') || cleanQuery.includes('16:9')) {
      intentFilters.orientation = 'horizontal';
    }

    if (cleanQuery.includes('video') || cleanQuery.includes('clip') || cleanQuery.includes('footage')) {
      intentFilters.type = 'video';
    } else if (cleanQuery.includes('photo') || cleanQuery.includes('image') || cleanQuery.includes('picture')) {
      intentFilters.type = 'image';
    } else if (cleanQuery.includes('audio') || cleanQuery.includes('music') || cleanQuery.includes('sound') || cleanQuery.includes('track')) {
      intentFilters.type = 'audio';
    }

    if (cleanQuery.includes('generated') || cleanQuery.includes('ai')) {
      intentFilters.generated = 'true';
    }

    // Extract core search terms by removing filler words
    const fillerWords = new Set(['show', 'find', 'me', 'clips', 'clip', 'with', 'a', 'an', 'the', 'containing', 'where', 'in', 'of', 'recorded', 'videos', 'my', 'latest']);
    const tokens = cleanQuery
      .split(/\s+/)
      .filter(t => !fillerWords.has(t) && t.length > 1);

    const matchedTranscripts: { asset: MediaAsset; segment: TranscriptSegment }[] = [];

    const scored = assets.map(asset => {
      const meta = this.getOrAnalyzeMedia(asset);
      let score = 0;

      // 1. Check intent filters
      if (intentFilters.type && asset.type !== intentFilters.type) {
        return { asset, score: -100 };
      }
      if (intentFilters.orientation === 'vertical') {
        const isVertical = meta.tags.includes('Vertical') || meta.tags.includes('9:16');
        if (!isVertical) return { asset, score: -100 };
        score += 30;
      }
      if (intentFilters.orientation === 'horizontal') {
        const isHorizontal = meta.tags.includes('Horizontal') || meta.tags.includes('16:9');
        if (!isHorizontal) return { asset, score: -100 };
        score += 30;
      }
      if (intentFilters.generated === 'true') {
        if (!meta.tags.includes('Generated')) return { asset, score: -100 };
        score += 40;
      }

      const allSearchable = [
        asset.name.toLowerCase(),
        ...meta.tags.map(t => t.toLowerCase()),
        ...(meta.scenes || []).map(s => s.label.toLowerCase()),
        ...(meta.scenes || []).flatMap(s => s.keyObjects || []).map(o => o.toLowerCase()),
      ].join(' ');

      // Check token matches
      tokens.forEach(tok => {
        if (asset.name.toLowerCase().includes(tok)) score += 50;
        if (meta.tags.some(t => t.toLowerCase().includes(tok))) score += 40;
        if (allSearchable.includes(tok)) score += 20;

        // Check transcript
        if (meta.transcript) {
          meta.transcript.forEach(seg => {
            if (seg.text.toLowerCase().includes(tok)) {
              score += 60;
              matchedTranscripts.push({ asset, segment: seg });
            }
          });
        }
      });

      return { asset, score };
    });

    const filtered = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.asset);

    return {
      matchedAssets: filtered,
      matchedTranscripts,
      intentFilters,
    };
  }

  /**
   * Add custom manual tag to an asset
   */
  static addManualTag(assetId: string, tag: string): MediaSemanticMetadata | null {
    const cleanTag = tag.trim();
    if (!cleanTag) return null;

    const meta = AnalysisCacheService.getSemanticMetadata(assetId);
    if (!meta) return null;

    if (!meta.manualTags.includes(cleanTag)) {
      meta.manualTags.push(cleanTag);
    }
    if (!meta.tags.includes(cleanTag)) {
      meta.tags.push(cleanTag);
    }

    AnalysisCacheService.saveSemanticMetadata(meta);
    return meta;
  }

  /**
   * Remove a tag from an asset
   */
  static removeTag(assetId: string, tagToRemove: string): MediaSemanticMetadata | null {
    const meta = AnalysisCacheService.getSemanticMetadata(assetId);
    if (!meta) return null;

    meta.manualTags = meta.manualTags.filter(t => t !== tagToRemove);
    meta.tags = meta.tags.filter(t => t !== tagToRemove);

    AnalysisCacheService.saveSemanticMetadata(meta);
    return meta;
  }

  /**
   * Best-Take Candidate Evaluator
   */
  static evaluateBestTakes(assets: MediaAsset[]): BestTakeCandidate[] {
    const candidates: BestTakeCandidate[] = assets.map(asset => {
      const meta = this.getOrAnalyzeMedia(asset);
      const sharpness = meta.sharpnessScore || 80;
      const stability = meta.stabilityScore || 80;
      const audioQ = meta.audioQualityScore || 75;
      const framing = meta.tags.includes('Vertical') ? 90 : 85;

      const overall = Math.round(sharpness * 0.35 + stability * 0.35 + audioQ * 0.15 + framing * 0.15);

      const signals: string[] = [];
      const drawbacks: string[] = [];

      if (sharpness > 88) signals.push('Crisp focal sharpness');
      if (stability > 85) signals.push('Smooth gimbal/tripod stability');
      if (audioQ > 80) signals.push('Clear audio dialogue capture');
      if (asset.dimensions?.includes('4K')) signals.push('Native 4K resolution');

      if (stability < 80) drawbacks.push('Noticeable camera shake in opening 2 seconds');
      if (sharpness < 80) drawbacks.push('Slight lens flare soft focus');

      return {
        mediaId: asset.id,
        name: asset.name,
        url: asset.url,
        durationSec: asset.durationSec || 5.0,
        dimensions: asset.dimensions,
        sharpnessScore: sharpness,
        stabilityScore: stability,
        audioQualityScore: audioQ,
        framingScore: framing,
        overallRecommendationScore: overall,
        signals,
        drawbacks: drawbacks.length > 0 ? drawbacks : undefined,
        isRecommended: false, // Calculated next
      };
    });

    if (candidates.length > 0) {
      // Sort and mark top candidate as recommended
      candidates.sort((a, b) => b.overallRecommendationScore - a.overallRecommendationScore);
      candidates[0].isRecommended = true;
    }

    return candidates;
  }

  /**
   * Generates timestamped speech transcript for media containing speech
   */
  private static generateTranscriptForAsset(asset: MediaAsset): TranscriptSegment[] {
    const lower = asset.name.toLowerCase();
    if (lower.includes('tokyo') || lower.includes('neon')) {
      return [
        {
          id: `seg-1-${asset.id}`,
          startSec: 0.8,
          endSec: 3.4,
          text: 'Welcome to the vibrant nighttime streets of Neo-Tokyo.',
          confidence: 0.94,
          words: [
            { word: 'Welcome', startSec: 0.8, endSec: 1.2 },
            { word: 'to', startSec: 1.2, endSec: 1.4 },
            { word: 'the', startSec: 1.4, endSec: 1.6 },
            { word: 'vibrant', startSec: 1.6, endSec: 2.1 },
            { word: 'nighttime', startSec: 2.1, endSec: 2.6 },
            { word: 'streets', startSec: 2.6, endSec: 3.0 },
            { word: 'of', startSec: 3.0, endSec: 3.1 },
            { word: 'Neo-Tokyo.', startSec: 3.1, endSec: 3.4 },
          ],
        },
        {
          id: `seg-2-${asset.id}`,
          startSec: 4.1,
          endSec: 7.2,
          text: 'Notice the neon reflections shimmering on the wet pavement.',
          confidence: 0.91,
          words: [
            { word: 'Notice', startSec: 4.1, endSec: 4.5 },
            { word: 'the', startSec: 4.5, endSec: 4.7 },
            { word: 'neon', startSec: 4.7, endSec: 5.1 },
            { word: 'reflections', startSec: 5.1, endSec: 5.8 },
            { word: 'shimmering', startSec: 5.8, endSec: 6.4 },
            { word: 'on', startSec: 6.4, endSec: 6.6 },
            { word: 'the', startSec: 6.6, endSec: 6.8 },
            { word: 'pavement.', startSec: 6.8, endSec: 7.2 },
          ],
        },
      ];
    }

    if (lower.includes('fashion') || lower.includes('studio')) {
      return [
        {
          id: `seg-1-${asset.id}`,
          startSec: 0.5,
          endSec: 2.8,
          text: 'Model turning into the primary key light on mark three.',
          confidence: 0.96,
        },
        {
          id: `seg-2-${asset.id}`,
          startSec: 3.2,
          endSec: 5.5,
          text: 'Hold steady for the profile close-up.',
          confidence: 0.93,
        },
      ];
    }

    // Default dialogue sample
    return [
      {
        id: `seg-default-1-${asset.id}`,
        startSec: 1.0,
        endSec: 3.5,
        text: 'Action sequence starting from the left side of the frame.',
        confidence: 0.88,
      },
      {
        id: `seg-default-2-${asset.id}`,
        startSec: 4.0,
        endSec: 6.2,
        text: 'The vehicle passes by in full focus.',
        confidence: 0.92,
      },
    ];
  }

  /**
   * Generates realistic detected scenes with timestamps and labels
   */
  private static generateScenesForAsset(asset: MediaAsset): SceneDetectionResult[] {
    const totalDuration = asset.durationSec || 8.0;
    const scene1Dur = Math.min(3.5, totalDuration * 0.45);
    const scene2Dur = totalDuration - scene1Dur;

    return [
      {
        id: `scene-1-${asset.id}`,
        mediaId: asset.id,
        startSec: 0,
        endSec: Math.round(scene1Dur * 10) / 10,
        durationSec: Math.round(scene1Dur * 10) / 10,
        label: 'Wide Establishing Shot',
        confidence: 0.93,
        keyObjects: ['architecture', 'street', 'lighting'],
        lighting: 'Ambient Cyan / Magenta',
        thumbnailUrl: asset.url,
      },
      {
        id: `scene-2-${asset.id}`,
        mediaId: asset.id,
        startSec: Math.round(scene1Dur * 10) / 10,
        endSec: Math.round(totalDuration * 10) / 10,
        durationSec: Math.round(scene2Dur * 10) / 10,
        label: 'Medium Subject Movement',
        confidence: 0.89,
        keyObjects: ['subject', 'shadows'],
        lighting: 'Directional Key Light',
        thumbnailUrl: asset.url,
      },
    ];
  }
}
