/**
 * Provider Status & Connection Registry Service
 * Interacts with the secure server-side provider manager.
 * Provides real-time availability states for all models and AI tools.
 */

import { checkHardwareSupportForTask, detectHardwareCapabilities } from '../../utils/hardwareCapabilities';
import { OwnerSecurityService } from '../owner/ownerSecurityService';

export type ModelRealAvailabilityState =
  // 12 Normalized Core Statuses
  | 'AVAILABLE'
  | 'SETUP_REQUIRED'
  | 'DISABLED_BY_OWNER'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'PROVIDER_ERROR'
  | 'RATE_LIMITED'
  | 'SPENDING_LIMIT_REACHED'
  | 'ENTITLEMENT_REQUIRED'
  | 'CREDITS_REQUIRED'
  | 'INPUT_NOT_SUPPORTED'
  | 'OUTPUT_NOT_SUPPORTED'
  | 'MAINTENANCE'
  // Compatibility Aliases
  | 'CONFIGURATION_REQUIRED'
  | 'PROVIDER_UNAVAILABLE'
  | 'USER_NOT_ENTITLED'
  | 'MODEL_NOT_SUPPORTED'
  | 'BROWSER_HARDWARE_LIMITED';

export interface ProviderConnectionInfo {
  id: string;
  name: string;
  isConfigured: boolean;
  isEnabled: boolean;
  connectionStatus: 'connected' | 'not_configured' | 'error' | 'testing' | 'decommissioned';
  lastTestedAt: string | null;
  lastLatencyMs: number | null;
  errorMessage?: string;
  maskedKey?: string;
  availableModels: string[];
  quotaStatus?: {
    status: 'normal' | 'low' | 'exceeded';
    note: string;
  };
}

export interface ModelAvailabilityCheckResult {
  state: ModelRealAvailabilityState;
  isReadyToRun: boolean;
  badgeLabel: string;
  buttonLabel: string;
  userFacingMessage: string;
  adminFacingMessage?: string;
  suggestedAlternativeModelId?: string;
}

type StatusChangeListener = () => void;

const DEFAULT_PROVIDERS: ProviderConnectionInfo[] = [
  { id: 'google', name: 'Google (Gemini & Veo)', isConfigured: true, isEnabled: true, connectionStatus: 'connected', lastTestedAt: null, lastLatencyMs: null, availableModels: ['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'veo-3.1-lite-generate-preview'] },
  { id: 'runway', name: 'Runway ML (Gen-3)', isConfigured: false, isEnabled: true, connectionStatus: 'not_configured', lastTestedAt: null, lastLatencyMs: null, availableModels: ['runway-gen3-alpha', 'runway-gen3-turbo'] },
  { id: 'openai', name: 'OpenAI (Sora & DALL-E)', isConfigured: false, isEnabled: true, connectionStatus: 'not_configured', lastTestedAt: null, lastLatencyMs: null, availableModels: ['openai-sora-turbo', 'dall-e-3'] },
  { id: 'flux', name: 'Black Forest Labs (Flux)', isConfigured: false, isEnabled: true, connectionStatus: 'not_configured', lastTestedAt: null, lastLatencyMs: null, availableModels: ['flux-1.1-pro', 'flux-schnell'] },
  { id: 'elevenlabs', name: 'ElevenLabs Sonic Audio', isConfigured: false, isEnabled: true, connectionStatus: 'not_configured', lastTestedAt: null, lastLatencyMs: null, availableModels: ['elevenlabs-voice-v2', 'elevenlabs-spatial-sfx'] },
  { id: 'anthropic', name: 'Anthropic Claude Engine', isConfigured: false, isEnabled: true, connectionStatus: 'not_configured', lastTestedAt: null, lastLatencyMs: null, availableModels: ['claude-3.7-sonnet-screenplay'] },
  { id: 'stability', name: 'Stability AI (SD 3.5)', isConfigured: false, isEnabled: true, connectionStatus: 'not_configured', lastTestedAt: null, lastLatencyMs: null, availableModels: ['sd-3.5-large'] },
];

class ProviderStatusServiceClass {
  private providers: Map<string, ProviderConnectionInfo> = new Map(
    DEFAULT_PROVIDERS.map(p => [p.id, p])
  );
  private listeners: Set<StatusChangeListener> = new Set();
  private isLoaded = false;
  private isFetching = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.refreshProviders();
    }
  }

  public subscribe(listener: StatusChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public async refreshProviders(): Promise<ProviderConnectionInfo[]> {
    if (this.isFetching) return Array.from(this.providers.values());
    this.isFetching = true;

    try {
      const res = await fetch('/api/ai/providers');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.providers)) {
          this.providers.clear();
          data.providers.forEach((p: ProviderConnectionInfo) => {
            this.providers.set(p.id, p);
          });
          this.isLoaded = true;
          this.notify();
        }
      }
    } catch (e) {
      console.warn('Could not fetch server provider status, falling back to local defaults', e);
    } finally {
      this.isFetching = false;
    }

    return Array.from(this.providers.values());
  }

  public getProviders(): ProviderConnectionInfo[] {
    return Array.from(this.providers.values());
  }

  public getProvider(id: string): ProviderConnectionInfo | undefined {
    const key = id === 'gemini' ? 'google' : id;
    return this.providers.get(key) || this.providers.get(id);
  }

  public isProviderConfigured(providerId: string): boolean {
    const key = providerId === 'gemini' ? 'google' : providerId;
    const prov = this.providers.get(key) || this.providers.get(providerId);
    return Boolean(prov?.isConfigured && prov?.isEnabled);
  }

  public isProviderOperational(providerId: string): boolean {
    const key = providerId === 'gemini' ? 'google' : providerId;
    const prov = this.providers.get(key) || this.providers.get(providerId);
    if (!prov) return false;
    return prov.isConfigured && prov.isEnabled && prov.connectionStatus === 'connected';
  }

  /**
   * Safe Owner test connection to a provider
   */
  public async testProvider(providerId: string): Promise<{
    success: boolean;
    latencyMs: number;
    message: string;
  }> {
    try {
      const res = await fetch('/api/ai/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json();
      await this.refreshProviders();
      return {
        success: Boolean(data.success),
        latencyMs: data.latencyMs || 0,
        message: data.message || (data.success ? 'Connected successfully' : 'Connection failed'),
      };
    } catch (e: any) {
      return {
        success: false,
        latencyMs: 0,
        message: e.message || 'Network error while contacting server.',
      };
    }
  }

  /**
   * Owner-only secure credential configuration (saved server-side, never exposed)
   */
  public async configureProvider(providerId: string, apiKey: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const res = await fetch('/api/ai/providers/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...OwnerSecurityService.getAuthHeaders(),
        },
        body: JSON.stringify({ providerId, apiKey }),
      });
      const data = await res.json();
      await this.refreshProviders();
      return {
        success: Boolean(data.success),
        message: data.message || 'Provider configuration updated.',
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Failed to update credentials on server.',
      };
    }
  }

  /**
   * Owner-only provider toggle (enable/decommission)
   */
  public async toggleProvider(providerId: string, enabled: boolean): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const res = await fetch('/api/ai/providers/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...OwnerSecurityService.getAuthHeaders(),
        },
        body: JSON.stringify({ providerId, enabled }),
      });
      const data = await res.json();
      await this.refreshProviders();
      return {
        success: Boolean(data.success),
        message: data.message || 'Provider state updated.',
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Failed to toggle provider on server.',
      };
    }
  }

  /**
   * Evaluate the REAL availability state for any model
   */
  public evaluateModelAvailability(
    model: {
      id: string;
      name: string;
      providerType?: string;
      isProOnly?: boolean;
      costPerUnit: number;
      availability?: string;
      capabilities?: string[];
      category?: string;
    },
    userContext: {
      isPro: boolean;
      credits: number;
      isOwner?: boolean;
    }
  ): ModelAvailabilityCheckResult {
    // 1. Hardware Check
    const hwCheck = checkHardwareSupportForTask(model.category?.toLowerCase() || 'general');
    if (!hwCheck.supported) {
      return {
        state: 'BROWSER_HARDWARE_LIMITED',
        isReadyToRun: false,
        badgeLabel: 'Device Limited',
        buttonLabel: 'Device Limited',
        userFacingMessage: hwCheck.reason || 'Your browser/device lacks the hardware capabilities for this engine.',
        suggestedAlternativeModelId: 'gemini-3.1-flash-image',
      };
    }

    // 2. Scheduled Maintenance & Safety Controls Check
    if (model.availability === 'maintenance') {
      return {
        state: 'MAINTENANCE',
        isReadyToRun: false,
        badgeLabel: 'Maintenance',
        buttonLabel: 'Unavailable',
        userFacingMessage: `${model.name} is temporarily offline for scheduled maintenance.`,
        suggestedAlternativeModelId: 'gemini-3.8-flash',
      };
    }

    // 3. Provider Readiness Check (Server-Side Verification)
    const pType = model.providerType || 'gemini';
    if (pType !== 'local') {
      const provider = this.getProvider(pType);
      
      // If server has reported on this provider
      if (provider) {
        if (!provider.isEnabled) {
          return {
            state: 'DISABLED_BY_OWNER',
            isReadyToRun: false,
            badgeLabel: 'Disabled by Owner',
            buttonLabel: 'Unavailable',
            userFacingMessage: 'This AI provider is currently disabled by platform administration.',
            adminFacingMessage: `Provider ${provider.name} is disabled in Owner Controls.`,
            suggestedAlternativeModelId: 'gemini-3.8-flash',
          };
        }

        if (!provider.isConfigured) {
          return {
            state: 'SETUP_REQUIRED',
            isReadyToRun: false,
            badgeLabel: 'Setup Required',
            buttonLabel: 'Provider Setup Required',
            userFacingMessage: `${provider.name} is currently unavailable. VYRO will use a compatible available model when possible.`,
            adminFacingMessage: `Provider ${provider.name} credentials are missing on the server. Configure in Owner Settings.`,
            suggestedAlternativeModelId: 'veo-3.1-lite-generate-preview',
          };
        }

        if (provider.connectionStatus === 'error') {
          const isRateLimit = provider.errorMessage?.toLowerCase().includes('429') || provider.errorMessage?.toLowerCase().includes('rate');
          return {
            state: isRateLimit ? 'RATE_LIMITED' : 'PROVIDER_ERROR',
            isReadyToRun: false,
            badgeLabel: isRateLimit ? 'Rate Limited' : 'Provider Error',
            buttonLabel: 'Temporarily Unavailable',
            userFacingMessage: isRateLimit
              ? 'This provider is currently rate limited. Please try again shortly or use an alternative model.'
              : 'This provider encountered a temporary connection issue. Please try another available model.',
            adminFacingMessage: `Provider ${provider.name} error: ${provider.errorMessage || 'Unknown error'}.`,
            suggestedAlternativeModelId: 'veo-3.1-lite-generate-preview',
          };
        }
      } else if (
        pType === 'runway' ||
        pType === 'openai' ||
        pType === 'flux' ||
        pType === 'elevenlabs' ||
        pType === 'anthropic' ||
        pType === 'stability'
      ) {
        // Not configured in server provider map
        return {
          state: 'SETUP_REQUIRED',
          isReadyToRun: false,
          badgeLabel: 'Setup Required',
          buttonLabel: 'Provider Setup Required',
          userFacingMessage: 'This provider is currently unavailable. VYRO will use a compatible available model when possible.',
          adminFacingMessage: `Provider credentials are not set on the server.`,
          suggestedAlternativeModelId: 'veo-3.1-lite-generate-preview',
        };
      }
    }

    // 4. User Entitlement Check (Pro vs Free)
    if (model.isProOnly && !userContext.isPro) {
      return {
        state: 'ENTITLEMENT_REQUIRED',
        isReadyToRun: false,
        badgeLabel: 'PRO Required',
        buttonLabel: 'Upgrade to PRO',
        userFacingMessage: `${model.name} is exclusive to VYRO Pro creators. Upgrade to unlock this professional model.`,
      };
    }

    // 5. User Credits Check
    if (userContext.credits < model.costPerUnit) {
      return {
        state: 'CREDITS_REQUIRED',
        isReadyToRun: false,
        badgeLabel: 'Credits Required',
        buttonLabel: 'Credits Required',
        userFacingMessage: `Insufficient VYRO credits (${userContext.credits} available, ${model.costPerUnit} required). Please top up your balance.`,
      };
    }

    // 6. Available!
    return {
      state: 'AVAILABLE',
      isReadyToRun: true,
      badgeLabel: 'Available',
      buttonLabel: 'Select Model',
      userFacingMessage: 'Ready for generation.',
    };
  }
}

export const ProviderStatusService = new ProviderStatusServiceClass();
