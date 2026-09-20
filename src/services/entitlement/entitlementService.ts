import { EntitlementKey, GlobalFeatureFlags, User } from '../../types';

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  source?: 'owner_bypass' | 'user_override' | 'active_pro' | 'tool_whitelist' | 'free_allowance';
}

export class EntitlementService {
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
   * Centralized entitlement decision engine.
   * Never relies purely on a naive boolean flag.
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

    // 5. Active Pro Subscription / Pro Trial / Owner Grant
    const proValid = this.isProActive(user);
    if (proValid) {
      return { allowed: true, source: 'active_pro' };
    }

    // 6. Specific Tool ID Whitelist (for granular tool permissions)
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

    // 7. Base Tier Allowance
    if (key === 'ai_credits') {
      return {
        allowed: user.aiCredits > 0,
        reason: user.aiCredits <= 0 ? 'Insufficient AI Credits. Please upgrade or top up.' : undefined,
        source: 'free_allowance',
      };
    }

    // Otherwise requires Pro
    return {
      allowed: false,
      reason: 'This premium capability requires an active Studio Pro subscription or Owner permission.',
    };
  }
}
