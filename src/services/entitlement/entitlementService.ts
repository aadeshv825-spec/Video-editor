import { EntitlementKey, FeatureEntitlementMap, FeatureTier, GlobalFeatureFlags, User } from '../../types';

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  source?: 'owner_bypass' | 'user_override' | 'active_pro' | 'tool_whitelist' | 'free_allowance' | 'free_tier_policy' | 'trial_tier_policy';
}

const FEATURE_TIERS_STORAGE_KEY = 'vyro_studio_feature_tiers_v1';

// Centralized safe default feature tier configuration
export const DEFAULT_FEATURE_TIERS: FeatureEntitlementMap = {
  advanced_video_editing: 'free',
  advanced_photo_tools: 'free',
  advanced_audio: 'free',
  ai_director: 'pro',
  ai_generation: 'trial',
  ai_quality_checker: 'pro',
  semantic_search: 'trial',
  premium_models: 'pro',
  advanced_export: 'pro',
  cloud_features: 'pro',
  ai_credits: 'free',
};

export class EntitlementService {
  /**
   * Retrieves the dynamic feature tier mapping (e.g. Free vs Pro vs Trial vs Owner).
   */
  public static getFeatureTiers(): FeatureEntitlementMap {
    try {
      const saved = localStorage.getItem(FEATURE_TIERS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_FEATURE_TIERS, ...JSON.parse(saved) };
      }
    } catch {
      // safe fallback
    }
    return { ...DEFAULT_FEATURE_TIERS };
  }

  /**
   * Updates the required tier for a specific feature key dynamically.
   */
  public static setFeatureTier(key: EntitlementKey, tier: FeatureTier): void {
    const current = this.getFeatureTiers();
    current[key] = tier;
    try {
      localStorage.setItem(FEATURE_TIERS_STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('feature-entitlements-updated', { detail: current }));
    } catch (e) {
      console.warn('Failed to save dynamic feature tier', e);
    }
  }

  /**
   * Bulk updates feature tiers (e.g. synced from backend / Owner).
   */
  public static setAllFeatureTiers(tiers: Partial<FeatureEntitlementMap>): void {
    const current = { ...this.getFeatureTiers(), ...tiers };
    try {
      localStorage.setItem(FEATURE_TIERS_STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('feature-entitlements-updated', { detail: current }));
    } catch (e) {
      console.warn('Failed to bulk save feature tiers', e);
    }
  }

  /**
   * Resets all feature tiers to safe default policies.
   */
  public static resetFeatureTiers(): void {
    try {
      localStorage.setItem(FEATURE_TIERS_STORAGE_KEY, JSON.stringify(DEFAULT_FEATURE_TIERS));
      window.dispatchEvent(new CustomEvent('feature-entitlements-updated', { detail: DEFAULT_FEATURE_TIERS }));
    } catch (e) {
      console.warn('Failed to reset feature tiers', e);
    }
  }

  /**
   * Checks whether a user has active Pro privileges (verifying expiration date)
   */
  public static isProActive(user: User): boolean {
    if (!user.isPro) return false;
    if (user.proExpiresAt === null) return true; // Lifetime or owner grant
    if (user.proExpiresAt === undefined) return true;

    const expiresTime = new Date(user.proExpiresAt).getTime();
    return !isNaN(expiresTime) && expiresTime > Date.now();
  }

  /**
   * Checks whether a user is in an active trial
   */
  public static isTrialActive(user: User): boolean {
    if (user.proSource !== 'trial') return false;
    if (!user.proExpiresAt) return true;
    const expiresTime = new Date(user.proExpiresAt).getTime();
    return !isNaN(expiresTime) && expiresTime > Date.now();
  }

  /**
   * Centralized entitlement decision engine.
   * Dynamically checks feature tier configuration without hardcoded restrictions.
   */
  public static checkEntitlement(
    user: User,
    key: EntitlementKey,
    globalFlags?: GlobalFeatureFlags
  ): EntitlementCheckResult {
    // 1. Account Suspended Check
    if (user.status === 'suspended') {
      return {
        allowed: false,
        reason: 'Account is currently suspended. Please contact platform administration.',
      };
    }

    // 2. Global Feature Killswitch Check
    if (globalFlags) {
      if (key === 'ai_director' && !globalFlags.directorModule) {
        return { allowed: false, reason: 'AI Director module is temporarily disabled by platform owner.' };
      }
      if (key === 'advanced_video_editing' && !globalFlags.videoEditorModule) {
        return { allowed: false, reason: 'Video editor module is temporarily offline.' };
      }
      if (key === 'advanced_photo_tools' && !globalFlags.photoStudioModule) {
        return { allowed: false, reason: 'Photo studio module is temporarily offline.' };
      }
      if (key === 'advanced_audio' && !globalFlags.audioStudioModule) {
        return { allowed: false, reason: 'Audio studio module is temporarily offline.' };
      }
      if (key === 'ai_generation' && !globalFlags.aiToolsModule) {
        return { allowed: false, reason: 'AI generation suite is currently offline.' };
      }
      if (key === 'advanced_export' && !globalFlags.cloudExportEngine) {
        return { allowed: false, reason: 'High-bitrate cloud export is temporarily disabled.' };
      }
      if (key === 'cloud_features' && !globalFlags.autoSaveCloudSync) {
        return { allowed: false, reason: 'Cloud synchronization is currently paused.' };
      }
    }

    // 3. Owner Universal Bypass
    if (user.role === 'owner') {
      return { allowed: true, source: 'owner_bypass' };
    }

    // 4. Per-User Individual Feature Override (Configured by Owner)
    if (user.featureOverrides && user.featureOverrides[key] !== undefined) {
      const explicit = user.featureOverrides[key];
      if (explicit) {
        return { allowed: true, source: 'user_override' };
      } else {
        return {
          allowed: false,
          reason: 'Feature access has been customized or disabled for your account by the owner.',
        };
      }
    }

    // 5. Dynamic Feature Tier Policy Check (Configured dynamically by Owner)
    const tiers = this.getFeatureTiers();
    const requiredTier: FeatureTier = tiers[key] || 'pro';

    // Free Tier: Accessible to all active users
    if (requiredTier === 'free') {
      if (key === 'ai_credits') {
        return {
          allowed: user.aiCredits > 0,
          reason: user.aiCredits <= 0 ? 'Insufficient AI Credits. Please top up.' : undefined,
          source: 'free_allowance',
        };
      }
      return { allowed: true, source: 'free_tier_policy' };
    }

    // Trial Tier: Accessible to trial users, Pro users, and Owner
    if (requiredTier === 'trial') {
      if (this.isProActive(user) || this.isTrialActive(user)) {
        return { allowed: true, source: 'trial_tier_policy' };
      }
      return {
        allowed: false,
        reason: 'This feature requires an active Free Trial or Studio Pro subscription.',
      };
    }

    // Owner Tier: Strictly restricted to Owner
    if (requiredTier === 'owner') {
      return {
        allowed: false,
        reason: 'This feature is strictly reserved for the Platform Owner.',
      };
    }

    // Pro Tier: Active Pro subscription / Lifetime grant
    const proValid = this.isProActive(user);
    if (proValid) {
      return { allowed: true, source: 'active_pro' };
    }

    // 6. Specific Tool ID Whitelist (for granular individual tool permissions)
    const toolMapping: Record<EntitlementKey, string[]> = {
      advanced_video_editing: ['video_neural_upscale', 'vfx_motion_tracker'],
      advanced_photo_tools: ['flux_photo_studio'],
      advanced_audio: ['spatial_audio_engine'],
      ai_director: ['director_ai'],
      ai_generation: ['flux_photo_studio', 'director_ai'],
      ai_quality_checker: ['quality_checker_pro'],
      semantic_search: ['semantic_search_pro'],
      premium_models: ['flux_photo_studio'],
      advanced_export: ['batch_export_pro'],
      cloud_features: ['cloud_sync_pro'],
      ai_credits: [],
    };

    const matchingTools = toolMapping[key] || [];
    const hasSpecificTool = matchingTools.some(toolId => user.enabledPremiumTools?.includes(toolId));
    if (hasSpecificTool) {
      return { allowed: true, source: 'tool_whitelist' };
    }

    // Otherwise requires Pro
    return {
      allowed: false,
      reason: 'This premium capability currently requires Studio Pro. You can upgrade anytime.',
    };
  }
}
