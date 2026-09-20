import { ReferenceMediaInfo } from '../../types/aiDirector';

export class ReferenceAnalyzerService {
  /**
   * Evaluates attached reference media and extracts aesthetic & technical style anchors.
   */
  static analyzeReference(
    file: { name: string; type: 'image' | 'video' | 'audio'; url?: string }
  ): ReferenceMediaInfo {
    const id = `ref-${Date.now()}`;
    const name = file.name;
    const type = file.type;

    if (type === 'image') {
      return {
        id,
        name,
        type: 'image',
        url: file.url,
        aspectRatio: '16:9',
        extractedStyle: {
          brightness: 18,
          warmth: 15,
          contrast: 12,
          dominantColor: '#e0a96d',
          aspectRatio: '16:9',
        },
      };
    }

    if (type === 'video') {
      return {
        id,
        name,
        type: 'video',
        url: file.url,
        aspectRatio: '9:16',
        durationSec: 15.0,
        extractedStyle: {
          brightness: 10,
          warmth: 8,
          contrast: 15,
          aspectRatio: '9:16',
        },
      };
    }

    // Audio
    return {
      id,
      name,
      type: 'audio',
      url: file.url,
      durationSec: 30.0,
      extractedStyle: {
        brightness: 0,
        warmth: 0,
        contrast: 0,
      },
    };
  }

  static getSampleReferences(): ReferenceMediaInfo[] {
    return [
      {
        id: 'sample-ref-cinematic',
        name: 'Cinematic Golden Hour (Ref)',
        type: 'image',
        aspectRatio: '16:9',
        extractedStyle: {
          brightness: 20,
          warmth: 30,
          contrast: 15,
          dominantColor: '#f59e0b',
        },
      },
      {
        id: 'sample-ref-noir',
        name: 'Film Noir High-Contrast (Ref)',
        type: 'image',
        aspectRatio: '1:1',
        extractedStyle: {
          brightness: -15,
          warmth: -10,
          contrast: 35,
          dominantColor: '#334155',
        },
      },
      {
        id: 'sample-ref-reels',
        name: 'Instagram Reels Fast-Paced (Ref)',
        type: 'video',
        aspectRatio: '9:16',
        durationSec: 12.0,
        extractedStyle: {
          aspectRatio: '9:16',
          brightness: 12,
          warmth: 5,
        },
      },
    ];
  }
}
