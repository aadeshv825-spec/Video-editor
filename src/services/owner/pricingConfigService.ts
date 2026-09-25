import { PricingConfiguration, ProPlanItem } from '../../types';
import { OwnerSecurityService } from './ownerSecurityService';

const PRICING_STORAGE_KEY = 'ai_creative_studio_pricing_v1';

export const DEFAULT_PRICING_CONFIG: PricingConfiguration = {
  currency: 'INR',
  currencySymbol: '₹',
  trialDurationDays: 7,
  trialCredits: 300,
  plans: {
    monthly: {
      id: 'monthly',
      name: 'Monthly Pro',
      periodMonths: 1,
      price: 249,
      currency: '₹',
      includedCredits: 5000,
    },
    three_months: {
      id: 'three_months',
      name: '3 Months Pro',
      periodMonths: 3,
      price: 649,
      currency: '₹',
      savingsLabel: 'Save 13%',
      includedCredits: 16000,
    },
    six_months: {
      id: 'six_months',
      name: '6 Months Pro',
      periodMonths: 6,
      price: 1099,
      currency: '₹',
      savingsLabel: 'Save 26%',
      includedCredits: 35000,
      isPopular: true,
    },
    yearly: {
      id: 'yearly',
      name: 'Annual Pro',
      periodMonths: 12,
      price: 1799,
      currency: '₹',
      savingsLabel: 'Best Value • Save 40%',
      includedCredits: 75000,
    },
  },
  proIncludedFeatures: [
    'Unlimited 4K Neural Video Upscaling',
    'Flux 1.1 Pro Photoreal Studio Canvas',
    'AI Director Cinematic Beat Breakdown',
    'Spatial Multi-Stem Voice Synthesis & Foley',
    'VFX Optical Flow & 3D Depth Tracker',
    'Batch Multi-Pass ProRes 422 & AV1 Export',
    'Continuous Cloud Sync & Offline Snapshot Backup',
    'Full AI Quality Checker & Auto-Cut Suite',
  ],
  updatedAt: new Date().toISOString(),
};

export class PricingConfigService {
  public static getPricingConfig(): PricingConfiguration {
    try {
      const saved = localStorage.getItem(PRICING_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse pricing configuration', e);
    }
    return DEFAULT_PRICING_CONFIG;
  }

  public static getConfig(): PricingConfiguration {
    return this.getPricingConfig();
  }

  public static savePricingConfig(config: PricingConfiguration): void {
    try {
      const updated = {
        ...config,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pricing-config-updated', { detail: updated }));
      }
      // Authorize and log server-side
      OwnerSecurityService.authorizeOwnerAction('pricing_changed', {
        details: `Updated plan pricing matrix on active platform currency (${config.currency})`,
        pricingConfig: updated,
      });
    } catch (e) {
      console.warn('Failed to persist pricing configuration', e);
    }
  }

  public static saveConfig(config: PricingConfiguration): void {
    this.savePricingConfig(config);
  }

  public static formatPrice(amount: number, symbol: string = '₹'): string {
    return `${symbol}${amount.toLocaleString()}`;
  }

  public static updatePlanPrice(planId: keyof PricingConfiguration['plans'], price: number): void {
    const current = this.getPricingConfig();
    if (current.plans[planId]) {
      current.plans[planId].price = Math.max(0, price);
      this.savePricingConfig(current);
    }
  }

  public static updateTrialSettings(days: number, credits: number): void {
    const current = this.getPricingConfig();
    current.trialDurationDays = Math.max(0, days);
    current.trialCredits = Math.max(0, credits);
    this.savePricingConfig(current);
  }

  public static resetToDefaults(): PricingConfiguration {
    try {
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(DEFAULT_PRICING_CONFIG));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pricing-config-updated', { detail: DEFAULT_PRICING_CONFIG }));
      }
    } catch (e) {
      console.warn('Failed to reset pricing config', e);
    }
    return DEFAULT_PRICING_CONFIG;
  }
}
