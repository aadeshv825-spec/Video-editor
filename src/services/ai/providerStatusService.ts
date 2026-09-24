/**
 * Provider Status & Connection Registry Service
 * Interacts with the secure server-side provider manager.
 * Provides real-time availability states for all models and AI tools.
 */

import { checkHardwareSupportForTask, detectHardwareCapabilities } from '../../utils/hardwareCapabilities';

export type ModelRealAvailabilityState =
  | 'AVAILABLE'
  | 'CONFIGURATION_REQUIRED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'USER_NOT_ENTITLED'
  | 'CREDITS_REQUIRED'
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

class ProviderStatusServiceClass {
  private providers: Map<string, ProviderConnectionInfo> = new Map();
  private listeners: Set<StatusChangeListener> = new Set();
  private isLoaded = false;
  private isFetching = false;

  constructor() {
    this.refreshProviders();
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

    // 2. Scheduled Maintenance Check
    if (model.availability === 'maintenance') {
      return {
        state: 'TEMPORARILY_UNAVAILABLE',
        isReadyToRun: false,
        badgeLabel: 'Maintenance',
        buttonLabel: 'Unavailable',
        userFacingMessage: `${model.name} is temporarily offline for maintenance. Please try another available model.`,
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
            state: 'PROVIDER_UNAVAILABLE',
            isReadyToRun: false,
            badgeLabel: 'Provider Offline',
            buttonLabel: 'Unavailable',
            userFacingMessage: 'This AI provider is currently decommissioned. Please try another available model.',
            adminFacingMessage: `Provider ${provider.name} is set to DECOMMISSIONED in Owner Controls.`,
            suggestedAlternativeModelId: 'gemini-3.8-flash',
          };
        }

        if (!provider.isConfigured) {
          return {
            state: 'CONFIGURATION_REQUIRED',
            isReadyToRun: false,
            badgeLabel: 'Setup Required',
            buttonLabel: 'Provider Setup Required',
            userFacingMessage: 'Provider setup required. Please try another available model.',
            adminFacingMessage: `Provider ${provider.name} credentials are missing on the server. Configure in Owner Settings.`,
            suggestedAlternativeModelId: 'veo-3.1-lite-generate-preview',
          };
        }

        if (provider.connectionStatus === 'error') {
          return {
            state: 'PROVIDER_UNAVAILABLE',
            isReadyToRun: false,
            badgeLabel: 'Provider Error',
            buttonLabel: 'Temporarily Unavailable',
            userFacingMessage: 'Temporarily unavailable. Please try another available model.',
            adminFacingMessage: `Provider ${provider.name} returned an error: ${provider.errorMessage || 'Unknown error'}.`,
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
          state: 'CONFIGURATION_REQUIRED',
          isReadyToRun: false,
          badgeLabel: 'Setup Required',
          buttonLabel: 'Provider Setup Required',
          userFacingMessage: 'Provider setup required. Please try another available model.',
          adminFacingMessage: `Provider credentials are not set on the server.`,
          suggestedAlternativeModelId: 'veo-3.1-lite-generate-preview',
        };
      }
    }

    // 4. User Entitlement Check (Pro vs Free)
    if (model.isProOnly && !userContext.isPro) {
      return {
        state: 'USER_NOT_ENTITLED',
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
        badgeLabel: 'Low Credits',
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
