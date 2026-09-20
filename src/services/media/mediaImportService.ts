export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  metadata?: {
    name: string;
    sizeBytes: number;
    sizeFormatted: string;
    mimeType: string;
    category: 'video' | 'audio' | 'image' | 'document' | 'other';
    duration?: number;
    width?: number;
    height?: number;
    aspectRatio?: string;
    codec?: string;
  };
}

const MAX_VIDEO_BYTES = 1024 * 1024 * 1024; // 1 GB
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;    // 50 MB
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;   // 100 MB
const MAX_DOC_BYTES = 25 * 1024 * 1024;      // 25 MB

export class MediaImportService {
  public static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public static async validateMediaFile(file: File): Promise<MediaValidationResult> {
    const fileName = file.name;
    const sizeBytes = file.size;
    const mimeType = file.type || '';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // Determine category
    let category: 'video' | 'audio' | 'image' | 'document' | 'other' = 'other';
    if (mimeType.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext)) {
      category = 'video';
    } else if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext)) {
      category = 'image';
    } else if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'].includes(ext)) {
      category = 'audio';
    } else if (mimeType.includes('pdf') || ['pdf', 'txt', 'json', 'md'].includes(ext)) {
      category = 'document';
    }

    if (category === 'other') {
      return {
        valid: false,
        error: `Unsupported file format (.${ext || 'unknown'}). Please import MP4, MOV, WebM, PNG, JPG, WebP, MP3, WAV, or AAC media.`,
      };
    }

    // Size limit check
    if (category === 'video' && sizeBytes > MAX_VIDEO_BYTES) {
      return {
        valid: false,
        error: `Video size (${this.formatBytes(sizeBytes)}) exceeds browser processing buffer limit (1 GB). Please compress or trim the file before importing.`,
      };
    }

    if (category === 'image' && sizeBytes > MAX_IMAGE_BYTES) {
      return {
        valid: false,
        error: `Image size (${this.formatBytes(sizeBytes)}) exceeds maximum memory ceiling (50 MB). Please downscale or compress before importing.`,
      };
    }

    if (category === 'audio' && sizeBytes > MAX_AUDIO_BYTES) {
      return {
        valid: false,
        error: `Audio size (${this.formatBytes(sizeBytes)}) exceeds in-memory processing limit (100 MB).`,
      };
    }

    // Deep inspection for images
    if (category === 'image') {
      try {
        const dimensions = await this.inspectImage(file);
        return {
          valid: true,
          metadata: {
            name: fileName,
            sizeBytes,
            sizeFormatted: this.formatBytes(sizeBytes),
            mimeType,
            category,
            width: dimensions.width,
            height: dimensions.height,
            aspectRatio: `${dimensions.width}:${dimensions.height}`,
          },
        };
      } catch {
        return {
          valid: false,
          error: 'The image file appears corrupted or unreadable by the browser.',
        };
      }
    }

    // Deep inspection for video
    if (category === 'video') {
      try {
        const videoInfo = await this.inspectVideo(file);
        return {
          valid: true,
          warning: videoInfo.warning,
          metadata: {
            name: fileName,
            sizeBytes,
            sizeFormatted: this.formatBytes(sizeBytes),
            mimeType,
            category,
            duration: videoInfo.duration,
            width: videoInfo.width,
            height: videoInfo.height,
            aspectRatio: videoInfo.aspectRatio,
          },
        };
      } catch (err: any) {
        return {
          valid: false,
          error: err?.message || 'Video container or codec is unsupported by your browser canvas pipeline.',
        };
      }
    }

    // Deep inspection for audio
    if (category === 'audio') {
      try {
        const audioInfo = await this.inspectAudio(file);
        return {
          valid: true,
          metadata: {
            name: fileName,
            sizeBytes,
            sizeFormatted: this.formatBytes(sizeBytes),
            mimeType,
            category,
            duration: audioInfo.duration,
          },
        };
      } catch {
        return {
          valid: false,
          error: 'The audio stream could not be decoded. Ensure it is encoded in MP3, WAV, AAC, or OGG.',
        };
      }
    }

    return {
      valid: true,
      metadata: {
        name: fileName,
        sizeBytes,
        sizeFormatted: this.formatBytes(sizeBytes),
        mimeType,
        category,
      },
    };
  }

  private static inspectImage(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        URL.revokeObjectURL(url);
        resolve({ width, height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  }

  private static inspectVideo(
    file: File
  ): Promise<{ width: number; height: number; duration: number; aspectRatio: string; warning?: string }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const duration = video.duration;
        let warning: string | undefined;

        if (width > 3840 || height > 2160) {
          warning = 'Video resolution exceeds 4K UHD. Playback may experience dropped frames in realtime canvas preview.';
        }

        URL.revokeObjectURL(url);
        resolve({
          width,
          height,
          duration,
          aspectRatio: width && height ? `${width}:${height}` : '16:9',
          warning,
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to parse video metadata. Format or codec unsupported.'));
      };

      video.src = url;
    });
  }

  private static inspectAudio(file: File): Promise<{ duration: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const audio = document.createElement('audio');
      audio.preload = 'metadata';

      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        URL.revokeObjectURL(url);
        resolve({ duration });
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to parse audio metadata.'));
      };

      audio.src = url;
    });
  }
}
