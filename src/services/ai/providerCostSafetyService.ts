/**
 * Provider Cost & Safety Control Service
 *
 * OWNER-LEVEL HARD SAFETY CONTROLS.
 * Protects the platform owner from unexpected external API billing spikes
 * while enforcing per-user, per-provider, and global spending ceilings.
 */

import { ProviderCostLedgerService } from './providerCostLedgerService';

export interface CostSafetyLimits {
  globalDailySpendLimitUsd: number;
  globalMonthlySpendLimitUsd: number;
  perProviderDailyLimitUsd: Record<string, number>;
  perProviderMonthlyLimitUsd: Record<string, number>;
  perUserDailySpendLimitUsd: number;
  perUserMonthlySpendLimitUsd: number;
  perUserDailyCreditLimit: number;
  perUserMonthlyCreditLimit: number;
  maxSingleGenerationCostUsd: number;
  maxVideoDurationSec: number;
  maxResolutionForExpensiveModels: '720p' | '1080p' | '4K';
  maxConcurrentAiJobsGlobal: number;
  maxQueuedJobsPerUser: number;
  emergencyKillSwitch: boolean;
  providerMaintenance: Record<string, boolean>;
  disabledModels: Record<string, boolean>;
  autoFallbackEnabled: boolean;
}

export const DEFAULT_SAFETY_LIMITS: CostSafetyLimits = {
  globalDailySpendLimitUsd: 50.0,
  globalMonthlySpendLimitUsd: 500.0,
  perProviderDailyLimitUsd: {
    google: 30.0,
    runway: 20.0,
    openai: 25.0,
    flux: 15.0,
    elevenlabs: 10.0,
    anthropic: 15.0,
    stability: 10.0,
    local: 999.0,
  },
  perProviderMonthlyLimitUsd: {
    google: 300.0,
    runway: 200.0,
    openai: 250.0,
    flux: 150.0,
    elevenlabs: 100.0,
    anthropic: 150.0,
    stability: 100.0,
    local: 9999.0,
  },
  perUserDailySpendLimitUsd: 5.0,
  perUserMonthlySpendLimitUsd: 35.0,
  perUserDailyCreditLimit: 250,
  perUserMonthlyCreditLimit: 2500,
  maxSingleGenerationCostUsd: 2.5,
  maxVideoDurationSec: 15,
  maxResolutionForExpensiveModels: '1080p',
  maxConcurrentAiJobsGlobal: 8,
  maxQueuedJobsPerUser: 2,
  emergencyKillSwitch: false,
  providerMaintenance: {
    google: false,
    runway: false,
    openai: false,
    flux: false,
    elevenlabs: false,
    anthropic: false,
    stability: false,
    local: false,
  },
  disabledModels: {},
  autoFallbackEnabled: true,
};

const LIMITS_STORAGE_KEY = 'vyro_owner_cost_safety_limits_v1';

export interface PreflightCheckResult {
  allowed: boolean;
  userSafeMessage?: string;
  adminReason?: string;
  estimatedCostUsd: number;
  vyroCreditsRequired: number;
}

export class ProviderCostSafetyService {
  public static getLimits(): CostSafetyLimits {
    try {
      const saved = localStorage.getItem(LIMITS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SAFETY_LIMITS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load cost safety limits', e);
    }
    return { ...DEFAULT_SAFETY_LIMITS };
  }

  public static updateLimits(updates: Partial<CostSafetyLimits>): CostSafetyLimits {
    const current = this.getLimits();
    const updated: CostSafetyLimits = {
      ...current,
      ...updates,
      perProviderDailyLimitUsd: {
        ...current.perProviderDailyLimitUsd,
        ...(updates.perProviderDailyLimitUsd || {}),
      },
      perProviderMonthlyLimitUsd: {
        ...current.perProviderMonthlyLimitUsd,
        ...(updates.perProviderMonthlyLimitUsd || {}),
      },
      providerMaintenance: {
        ...current.providerMaintenance,
        ...(updates.providerMaintenance || {}),
      },
      disabledModels: {
        ...current.disabledModels,
        ...(updates.disabledModels || {}),
      },
    };

    try {
      localStorage.setItem(LIMITS_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vyro-safety-limits-updated', { detail: updated }));
      }
    } catch (e) {
      console.warn('Failed to persist cost safety limits', e);
    }

    return updated;
  }

  /**
   * Estimates provider cost in USD based on model parameters
   */
  public static estimateProviderCostUsd(params: {
    modelId: string;
    provider: string;
    durationSec?: number;
    resolution?: string;
    taskType?: string;
  }): number {
    const { modelId, provider, durationSec = 5, resolution = '1080p' } = params;

    if (provider === 'local') return 0.0;

    // Video Models
    if (modelId.includes('veo')) {
      // Google Veo 3.1 Lite: ~$0.04 per 5s clip
      return (durationSec / 5) * 0.04;
    }
    if (modelId.includes('runway-gen3')) {
      // Runway Gen-3: ~$0.15 per 5s clip (higher for 4K)
      const multiplier = resolution.includes('4K') ? 1.8 : 1.0;
      return (durationSec / 5) * 0.15 * multiplier;
    }
    if (modelId.includes('sora')) {
      // Sora Turbo: ~$0.20 per 5s clip
      return (durationSec / 5) * 0.20;
    }

    // Image Models
    if (modelId.includes('flux')) {
      return 0.04; // Flux 1.1 Pro: ~$0.04 per image
    }
    if (modelId.includes('gemini-3.1-flash-image') || modelId.includes('nano-banana')) {
      return 0.005; // Nano Banana / Gemini Flash Image: ~$0.005 per image
    }
    if (modelId.includes('dall-e-3')) {
      return 0.04; // DALL-E 3: ~$0.04 per image
    }
    if (modelId.includes('sd-3.5') || modelId.includes('stable-diffusion')) {
      return 0.035; // Stability AI: ~$0.035 per image
    }

    // Audio & Speech Models
    if (modelId.includes('elevenlabs')) {
      return 0.015; // ElevenLabs: ~$0.015 per TTS call
    }
    if (modelId.includes('tts') || modelId.includes('flash-tts')) {
      return 0.002; // Google Flash TTS: ~$0.002
    }
    if (modelId.includes('lyria')) {
      return 0.01; // Lyria Audio: ~$0.01 per clip
    }

    // Text & Director Models
    if (modelId.includes('claude-3.7-sonnet')) {
      return 0.02; // Claude 3.7 Sonnet: ~$0.02 per planning query
    }
    if (modelId.includes('gemini-3.1-pro')) {
      return 0.005; // Gemini 3.1 Pro: ~$0.005
    }
    if (modelId.includes('gemini-3.8-flash') || modelId.includes('gemini-3.6-flash')) {
      return 0.001; // Gemini Flash: ~$0.001
    }

    // Conservative default
    return 0.02;
  }

  /**
   * Preflight Cost & Safety Check
   * Must pass BEFORE any provider job is dispatched
   */
  public static preflightSafetyCheck(params: {
    userId: string;
    modelId: string;
    provider: string;
    durationSec?: number;
    resolution?: string;
    vyroCreditsRequired: number;
    userCreditBalance: number;
    isOwner?: boolean;
  }): PreflightCheckResult {
    const limits = this.getLimits();
    const providerKey = params.provider === 'gemini' ? 'google' : params.provider;
    const estimatedCostUsd = this.estimateProviderCostUsd({
      modelId: params.modelId,
      provider: providerKey,
      durationSec: params.durationSec,
      resolution: params.resolution,
    });

    // 1. Emergency Kill Switch Check
    if (limits.emergencyKillSwitch && !params.isOwner) {
      return {
        allowed: false,
        userSafeMessage: 'AI generation is temporarily paused for platform maintenance. Please try again shortly.',
        adminReason: 'Emergency Kill Switch is active in Owner Cost & Safety Controls.',
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // 2. Provider Maintenance / Offline Switch Check
    if (limits.providerMaintenance[providerKey] && !params.isOwner) {
      return {
        allowed: false,
        userSafeMessage: 'This AI provider is currently undergoing scheduled maintenance.',
        adminReason: `Provider '${providerKey}' is marked as MAINTENANCE in Owner Controls.`,
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // 3. Model Disabled by Owner Check
    if (limits.disabledModels[params.modelId] && !params.isOwner) {
      return {
        allowed: false,
        userSafeMessage: 'This specific model is currently unavailable.',
        adminReason: `Model '${params.modelId}' has been disabled by the Owner.`,
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // 4. Video Duration Cap Check
    if (params.durationSec && params.durationSec > limits.maxVideoDurationSec) {
      return {
        allowed: false,
        userSafeMessage: `Generation duration exceeds maximum allowed limit (${limits.maxVideoDurationSec}s). Please select a shorter duration.`,
        adminReason: `Requested duration ${params.durationSec}s exceeds maxVideoDurationSec limit of ${limits.maxVideoDurationSec}s.`,
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // 5. Resolution Cap Check
    if (
      params.resolution &&
      params.resolution.includes('4K') &&
      limits.maxResolutionForExpensiveModels !== '4K' &&
      !params.isOwner
    ) {
      return {
        allowed: false,
        userSafeMessage: '4K resolution is currently restricted to conserve provider compute. Please select 1080p.',
        adminReason: '4K generation requested while maxResolutionForExpensiveModels is set to 1080p.',
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // 6. Single Generation Cost Cap
    if (estimatedCostUsd > limits.maxSingleGenerationCostUsd && !params.isOwner) {
      return {
        allowed: false,
        userSafeMessage: 'AI generation is temporarily unavailable because the requested parameters exceed single-job compute limits.',
        adminReason: `Estimated cost $${estimatedCostUsd.toFixed(2)} exceeds maxSingleGenerationCostUsd ($${limits.maxSingleGenerationCostUsd.toFixed(2)}).`,
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // 7. User Daily Credit Cap Check
    const userCreditsToday = ProviderCostLedgerService.getUserCreditsConsumedToday(params.userId);
    if (userCreditsToday + params.vyroCreditsRequired > limits.perUserDailyCreditLimit && !params.isOwner) {
      return {
        allowed: false,
        userSafeMessage: 'You have reached your daily AI generation allowance. Your credits will refresh tomorrow.',
        adminReason: `User daily credit limit reached (${userCreditsToday}/${limits.perUserDailyCreditLimit} credits).`,
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // 8. User Daily Spend Cap (USD)
    const userSpendToday = ProviderCostLedgerService.getUserSpendTodayUsd(params.userId);
    if (userSpendToday + estimatedCostUsd > limits.perUserDailySpendLimitUsd && !params.isOwner) {
      return {
        allowed: false,
        userSafeMessage: 'AI generation is temporarily unavailable because the configured usage limit has been reached.',
        adminReason: `User daily spend limit exceeded ($${userSpendToday.toFixed(2)} + $${estimatedCostUsd.toFixed(2)} > $${limits.perUserDailySpendLimitUsd.toFixed(2)}).`,
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // 9. Provider Daily Limit (USD)
    const providerDailyLimit = limits.perProviderDailyLimitUsd[providerKey] ?? 25.0;
    const providerSpendToday = ProviderCostLedgerService.getProviderSpendTodayUsd(providerKey);
    if (providerSpendToday + estimatedCostUsd > providerDailyLimit && !params.isOwner) {
      return {
        allowed: false,
        userSafeMessage: 'AI generation is temporarily unavailable because the configured usage limit has been reached.',
        adminReason: `Provider '${providerKey}' daily limit reached ($${providerSpendToday.toFixed(2)} / $${providerDailyLimit.toFixed(2)}).`,
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // 10. Global Daily Spend Limit (USD)
    const globalSpendToday = ProviderCostLedgerService.getGlobalSpendTodayUsd();
    if (globalSpendToday + estimatedCostUsd > limits.globalDailySpendLimitUsd && !params.isOwner) {
      return {
        allowed: false,
        userSafeMessage: 'AI generation is temporarily unavailable because the configured usage limit has been reached.',
        adminReason: `Global daily spend limit reached ($${globalSpendToday.toFixed(2)} / $${limits.globalDailySpendLimitUsd.toFixed(2)}).`,
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // 11. Global Concurrent AI Jobs Limit
    const activeGlobalJobs = ProviderCostLedgerService.getActiveJobsCount();
    if (activeGlobalJobs >= limits.maxConcurrentAiJobsGlobal && !params.isOwner) {
      return {
        allowed: false,
        userSafeMessage: 'Platform AI processing capacity is temporarily full. Please wait a moment for current operations to finish.',
        adminReason: `Global concurrent jobs limit reached (${activeGlobalJobs}/${limits.maxConcurrentAiJobsGlobal}).`,
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // 12. Per-User Queued / Active AI Jobs Limit
    const userActiveJobs = ProviderCostLedgerService.getUserActiveJobsCount(params.userId);
    if (userActiveJobs >= limits.maxQueuedJobsPerUser && !params.isOwner) {
      return {
        allowed: false,
        userSafeMessage: 'You already have active AI operations in progress. Please wait for them to finish before starting a new one.',
        adminReason: `User active jobs limit reached (${userActiveJobs}/${limits.maxQueuedJobsPerUser}).`,
        estimatedCostUsd,
        vyroCreditsRequired: params.vyroCreditsRequired,
      };
    }

    // All safety checks passed
    return {
      allowed: true,
      estimatedCostUsd,
      vyroCreditsRequired: params.vyroCreditsRequired,
    };
  }
}
