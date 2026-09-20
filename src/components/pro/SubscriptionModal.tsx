import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  AlertCircle, 
  HelpCircle,
  CreditCard,
  Zap,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PricingConfigService } from '../../services/owner/pricingConfigService';
import { PaymentService } from '../../services/payment/paymentService';
import { PricingConfiguration, ProPlanId, ProPlanItem } from '../../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, isPro, isOwner, restorePurchase } = useAuth();

  const [pricingConfig, setPricingConfig] = useState<PricingConfiguration>(() =>
    PricingConfigService.getConfig()
  );

  const [selectedPlanId, setSelectedPlanId] = useState<ProPlanId>('six_months');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = PricingConfigService.getConfig();
      setPricingConfig(config);
      const plansList = Object.values(config.plans);
      const popular = plansList.find(p => p.isPopular) || plansList[0];
      if (popular) {
        setSelectedPlanId(popular.id);
      }
      setPaymentNotice(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const plansList = Object.values(pricingConfig.plans);
  const selectedPlan: ProPlanItem = pricingConfig.plans[selectedPlanId] || plansList[0];
  const isPaymentConfigured = PaymentService.isConfigured();

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setPaymentNotice(null);

    const result = await PaymentService.initiateSubscription(
      selectedPlan,
      currentUser.email
    );

    setIsProcessing(false);

    if (result.supported) {
      setPaymentNotice({ text: result.message });
    } else {
      setPaymentNotice({
        text: result.message || 'Payment gateway is not configured yet in this environment.',
        isError: true,
      });
    }
  };

  const handleRestorePurchase = async () => {
    setIsRestoring(true);
    setPaymentNotice(null);
    try {
      const restored = await restorePurchase();
      if (restored) {
        setPaymentNotice({ text: 'Active subscription restored successfully.' });
      } else {
        setPaymentNotice({
          text: 'No active Google Play, App Store or Stripe subscription found for this account email.',
          isError: true,
        });
      }
    } catch {
      setPaymentNotice({ text: 'Failed to verify purchases.', isError: true });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="subscription-pro-modal"
        className="w-full max-w-2xl bg-white dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-xs"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center shadow-sm">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  AI Creative Studio Pro
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
                  {pricingConfig.currency} Tier
                </span>
              </div>
              <p className="text-neutral-500 text-[11px]">
                Unlock unbounded 4K video upscale, photoreal diffusion models & persistent cloud sync.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status / Notice if present */}
        {paymentNotice && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
              paymentNotice.isError
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300'
            }`}
          >
            {paymentNotice.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-[11px] leading-relaxed">
              {paymentNotice.text}
              {paymentNotice.isError && !isPaymentConfigured && (
                <div className="mt-1 font-mono text-[10px] opacity-80">
                  Live merchant infrastructure requires Razorpay/Stripe API secrets. Owner administrators can grant testing Pro status directly in the Owner Control Center.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plan Cards Matrix */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-[10px] uppercase">
              Select Subscription Duration
            </span>
            <span className="text-neutral-400 font-mono text-[10px]">
              {pricingConfig.trialDurationDays} Days Free Trial Included
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plansList.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                    isSelected
                      ? 'border-neutral-900 dark:border-white bg-neutral-900/5 dark:bg-white/5 ring-1 ring-neutral-900 dark:ring-white'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-[#151820]'
                  }`}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono text-[9px] font-bold uppercase tracking-wider shadow-xs">
                      Best Value
                    </span>
                  )}

                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                        {plan.name}
                      </h4>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        +{plan.includedCredits.toLocaleString()} AI Credits / mo
                      </div>
                      {plan.savingsLabel && (
                        <div className="mt-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          {plan.savingsLabel}
                        </div>
                      )}
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        {PricingConfigService.formatPrice(plan.price, plan.currency)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        /{plan.periodMonths === 1 ? 'month' : `${plan.periodMonths} mos`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clear Renewal & Terms Disclosure */}
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-600 dark:text-neutral-400 text-xs space-y-1.5">
          <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Transparent Subscription Terms</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            Includes {pricingConfig.trialDurationDays} days free trial, then renews at{' '}
            <strong className="text-neutral-900 dark:text-white">
              {PricingConfigService.formatPrice(selectedPlan.price, selectedPlan.currency)}/
              {selectedPlan.periodMonths === 1 ? 'month' : `${selectedPlan.periodMonths} months`}
            </strong>
            . You can cancel at any time directly through your Account Profile with zero penalty or locked-in contracts.
          </p>
        </div>

        {/* Pro Features Included */}
        <div className="space-y-2">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-[10px] uppercase">
            All Pro Privileges Included:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {pricingConfig.proIncludedFeatures.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleRestorePurchase}
              disabled={isRestoring}
              className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium flex items-center gap-1.5 text-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
              <span>Restore Purchases</span>
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="text-[11px] text-neutral-400">
              Gateway: {isPaymentConfigured ? 'Live Merchant Ready' : 'Development Gateway'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
            >
              Cancel
            </button>
            <button
              id="subscription-checkout-btn"
              onClick={handleSubscribe}
              disabled={isProcessing || isPro}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Contacting Gateway...</span>
                </>
              ) : isPro ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Already Pro</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Start Free Trial ({PricingConfigService.formatPrice(selectedPlan.price, selectedPlan.currency)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
