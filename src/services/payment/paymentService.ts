import { 
  PaymentGateway, 
  PaymentInitResult, 
  PaymentOrderCreationResult,
  PaymentVerificationPayload,
  PaymentVerificationResult,
  ProPlanItem, 
  UserSubscription 
} from '../../types';

export interface PaymentProviderConfig {
  gateway: PaymentGateway;
  isConfigured: boolean;
  status: 'READY' | 'SETUP_REQUIRED';
  keyId?: string;
  missingConfig?: string[];
}

let cachedGatewayConfig: PaymentProviderConfig | null = null;
let lastConfigFetchTime = 0;

export class PaymentService {
  /**
   * Retrieves the authoritative server-side payment gateway status.
   * If secrets are not present in server environment, it clearly returns SETUP_REQUIRED.
   */
  public static async fetchGatewayStatus(): Promise<PaymentProviderConfig> {
    const now = Date.now();
    if (cachedGatewayConfig && (now - lastConfigFetchTime < 60000)) {
      return cachedGatewayConfig;
    }

    try {
      const res = await fetch('/api/payments/status');
      if (res.ok) {
        const data = await res.json();
        cachedGatewayConfig = {
          gateway: data.gateway || 'not_configured',
          isConfigured: Boolean(data.isConfigured),
          status: data.status || 'SETUP_REQUIRED',
          keyId: data.keyId,
          missingConfig: data.missingConfig || [],
        };
        lastConfigFetchTime = now;
        return cachedGatewayConfig;
      }
    } catch {
      // Server unreachable, fallback safely
    }

    return {
      gateway: 'not_configured',
      isConfigured: false,
      status: 'SETUP_REQUIRED',
      missingConfig: ['Server payment gateway service connection'],
    };
  }

  /**
   * Synchronous cached config inspection
   */
  public static getGatewayConfig(): PaymentProviderConfig {
    if (cachedGatewayConfig) {
      return cachedGatewayConfig;
    }
    // Eagerly trigger background refresh
    this.fetchGatewayStatus();
    return {
      gateway: 'not_configured',
      isConfigured: false,
      status: 'SETUP_REQUIRED',
    };
  }

  public static isConfigured(): boolean {
    return this.getGatewayConfig().isConfigured;
  }

  /**
   * Initiates payment checkout through the server-authoritative abstraction layer.
   * Never fakes successful payment or fabricates transactions!
   */
  public static async initiateSubscription(
    plan: ProPlanItem,
    userEmail: string,
    userId?: string
  ): Promise<PaymentInitResult> {
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          userEmail,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          supported: false,
          gateway: data.gateway || 'not_configured',
          setupRequired: data.setupRequired ?? true,
          message:
            data.message ||
            'Payment gateway setup is required for real transactions. Live merchant billing requires RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET or STRIPE_SECRET_KEY in server environment variables. Platform owners can grant testing Pro privileges directly in the Owner Control Center.',
        };
      }

      const orderDetails: PaymentOrderCreationResult = {
        success: true,
        orderId: data.orderId,
        gateway: data.gateway,
        amount: data.amount,
        currency: data.currency,
        keyId: data.keyId,
        message: 'Order created with payment gateway',
      };

      return {
        supported: true,
        gateway: data.gateway,
        orderDetails,
        message: `Secure order created via ${data.gateway.toUpperCase()}. Proceed to gateway checkout.`,
      };
    } catch (err: any) {
      return {
        supported: false,
        gateway: 'not_configured',
        setupRequired: true,
        message:
          'Payment gateway setup is required for real transactions. Live merchant billing requires RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET or STRIPE_SECRET_KEY in server environment variables. Platform owners can grant testing Pro privileges directly in the Owner Control Center.',
      };
    }
  }

  /**
   * Server-authoritative payment signature verification.
   * Client-side callbacks alone NEVER activate Pro.
   */
  public static async verifyPayment(
    payload: PaymentVerificationPayload
  ): Promise<PaymentVerificationResult> {
    try {
      const res = await fetch('/api/payments/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          proGranted: true,
          subscription: data.subscription,
          message: data.message || 'Payment verified and Pro activated successfully.',
        };
      }

      return {
        success: false,
        proGranted: false,
        message: data.message || 'Payment verification failed.',
        error: data.error,
      };
    } catch (err: any) {
      return {
        success: false,
        proGranted: false,
        message: 'Network error communicating with payment verification server.',
        error: err.message,
      };
    }
  }

  /**
   * Fetches server-authoritative subscription state for a user.
   */
  public static async getUserSubscription(
    userId: string
  ): Promise<{ isPro: boolean; subscription: UserSubscription | null; expired?: boolean }> {
    try {
      const res = await fetch(`/api/subscriptions/user/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        return {
          isPro: Boolean(data.isPro),
          subscription: data.subscription || null,
          expired: Boolean(data.expired),
        };
      }
    } catch {
      // safe fallback
    }
    return { isPro: false, subscription: null };
  }

  /**
   * Requests server-authoritative cancellation of auto-renewal.
   */
  public static async cancelSubscription(
    userId: string,
    subscriptionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscriptionId }),
      });
      const data = await res.json();
      return {
        success: Boolean(data.success),
        message: data.message || (data.success ? 'Subscription auto-renew canceled.' : 'Cancellation failed.'),
      };
    } catch {
      return { success: false, message: 'Server communication error.' };
    }
  }
}
