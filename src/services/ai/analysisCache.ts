import { MediaSemanticMetadata, QualityAnalysisReport } from '../../types/aiQualityAndAutoEdit';

export interface AIAnalysisPrivacySettings {
  analyzeProjectAllowed: boolean;
  analyzeSelectedOnly: boolean;
  autoAnalysisEnabled: boolean;
  storeTranscripts: boolean;
  storeSemanticMetadata: boolean;
  cloudSyncAnalysis: boolean;
}

const DEFAULT_PRIVACY_SETTINGS: AIAnalysisPrivacySettings = {
  analyzeProjectAllowed: true,
  analyzeSelectedOnly: false,
  autoAnalysisEnabled: true,
  storeTranscripts: true,
  storeSemanticMetadata: true,
  cloudSyncAnalysis: false,
};

const STORAGE_KEY_REPORTS = 'creative_studio_quality_reports_v1';
const STORAGE_KEY_SEMANTICS = 'creative_studio_semantic_metadata_v1';
const STORAGE_KEY_PRIVACY = 'creative_studio_ai_privacy_settings_v1';

export class AnalysisCacheService {
  private static inMemoryReports: Map<string, QualityAnalysisReport> = new Map();
  private static inMemorySemantics: Map<string, MediaSemanticMetadata> = new Map();

  /**
   * Load privacy settings from local storage
   */
  static getPrivacySettings(): AIAnalysisPrivacySettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRIVACY);
      if (stored) {
        return { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore fallback
    }
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }

  /**
   * Update privacy settings
   */
  static updatePrivacySettings(settings: Partial<AIAnalysisPrivacySettings>): AIAnalysisPrivacySettings {
    const current = this.getPrivacySettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(STORAGE_KEY_PRIVACY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    return updated;
  }

  /**
   * Get cached quality report for a target
   */
  static getQualityReport(targetId: string): QualityAnalysisReport | null {
    if (this.inMemoryReports.has(targetId)) {
      return this.inMemoryReports.get(targetId)!;
    }
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_REPORTS}_${targetId}`);
      if (stored) {
        const report = JSON.parse(stored);
        this.inMemoryReports.set(targetId, report);
        return report;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Cache a quality report
   */
  static saveQualityReport(report: QualityAnalysisReport): void {
    this.inMemoryReports.set(report.targetId, report);
    try {
      localStorage.setItem(`${STORAGE_KEY_REPORTS}_${report.targetId}`, JSON.stringify(report));
    } catch {
      // Ignore
    }
  }

  /**
   * Get cached semantic metadata for a media asset
   */
  static getSemanticMetadata(mediaId: string): MediaSemanticMetadata | null {
    if (this.inMemorySemantics.has(mediaId)) {
      return this.inMemorySemantics.get(mediaId)!;
    }
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_SEMANTICS}_${mediaId}`);
      if (stored) {
        const meta = JSON.parse(stored);
        this.inMemorySemantics.set(mediaId, meta);
        return meta;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Save semantic metadata
   */
  static saveSemanticMetadata(metadata: MediaSemanticMetadata): void {
    const privacy = this.getPrivacySettings();
    if (!privacy.storeSemanticMetadata) return;

    // Filter transcripts if privacy dictates
    const toSave = {
      ...metadata,
      transcript: privacy.storeTranscripts ? metadata.transcript : undefined,
    };

    this.inMemorySemantics.set(metadata.mediaId, toSave);
    try {
      localStorage.setItem(`${STORAGE_KEY_SEMANTICS}_${metadata.mediaId}`, JSON.stringify(toSave));
    } catch {
      // Ignore
    }
  }

  /**
   * Clear all AI analysis data (Privacy Action)
   */
  static clearAllAnalysisData(): void {
    this.inMemoryReports.clear();
    this.inMemorySemantics.clear();
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(STORAGE_KEY_REPORTS) || k.startsWith(STORAGE_KEY_SEMANTICS)) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Clear all transcripts (Privacy Action)
   */
  static clearAllTranscripts(): void {
    for (const [mediaId, meta] of this.inMemorySemantics.entries()) {
      meta.transcript = undefined;
      this.saveSemanticMetadata(meta);
    }
  }

  /**
   * Clear semantic tags and descriptions (Privacy Action)
   */
  static clearAllSemanticMetadata(): void {
    for (const [mediaId, meta] of this.inMemorySemantics.entries()) {
      meta.autoTags = [];
      meta.scenes = [];
      this.saveSemanticMetadata(meta);
    }
  }

  /**
   * Invalidate cache for a specific media item (e.g. when replaced or edited)
   */
  static invalidateMedia(mediaId: string): void {
    this.inMemoryReports.delete(mediaId);
    this.inMemorySemantics.delete(mediaId);
    try {
      localStorage.removeItem(`${STORAGE_KEY_REPORTS}_${mediaId}`);
      localStorage.removeItem(`${STORAGE_KEY_SEMANTICS}_${mediaId}`);
    } catch {
      // Ignore
    }
  }
}
