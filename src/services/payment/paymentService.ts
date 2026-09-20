import { PaymentGateway, PaymentInitResult, ProPlanItem } from '../../types';

export interface PaymentProviderConfig {
  gateway: PaymentGateway;
  isConfigured: boolean;
  apiKey?: string;
  merchantId?: string;
}

export class PaymentService {
  /**
   * Evaluates if a live production payment gateway is configured in the environment.
   * By default, we do NOT fake payment completion or fabricate fake transaction IDs.
   */
  public static getGatewayConfig(): PaymentProviderConfig {
    // Check for real environment keys or configured custom credentials
    const razorpayKey = (typeof process !== 'undefined' && process.env?.RAZORPAY_KEY_ID) || null;
    const stripeKey = (typeof process !== 'undefined' && process.env?.STRIPE_PUBLISHABLE_KEY) || null;

    if (razorpayKey) {
      return {
        gateway: 'razorpay',
        isConfigured: true,
        apiKey: razorpayKey,
      };
    }

    if (stripeKey) {
      return {
        gateway: 'stripe',
        isConfigured: true,
        apiKey: stripeKey,
      };
    }

    return {
      gateway: 'not_configured',
      isConfigured: false,
    };
  }

  public static isConfigured(): boolean {
    return this.getGatewayConfig().isConfigured;
  }

  /**
   * Initiates payment checkout through the abstraction layer.
   * If backend or payment credentials are not configured, returns clear unconfigured status.
   * Never fakes successful payment!
   */
  public static async initiateSubscription(
    plan: ProPlanItem,
    userEmail: string
  ): Promise<PaymentInitResult> {
    const config = this.getGatewayConfig();

    if (!config.isConfigured) {
      return {
        supported: false,
        gateway: 'not_configured',
        message:
          'Payments are not configured yet. Live billing infrastructure requires a merchant gateway key. To test Pro entitlements and AI credit allocations in this development environment, use the Owner Control Center or active testing grants.',
      };
    }

    // In a configured environment with Razorpay or Stripe:
    return {
      supported: true,
      gateway: config.gateway,
      message: `Initiating ${config.gateway.toUpperCase()} secure checkout for ${plan.name} (${plan.currency}${plan.price}).`,
    };
  }
}
