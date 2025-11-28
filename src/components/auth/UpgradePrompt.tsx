// @ts-nocheck
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';
import { useCreemPayment } from '@/hooks/use-creem-payment';
import { usePathname } from '@/i18n/navigation';
import { getUserSubscription } from '@/server/actions/payment/get-billing-info';
import { Check, Loader2, Shield, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UpgradePromptProps {
  isOpen?: boolean; // Control visibility
  onClose?: () => void;
  onContinue?: () => void; // Callback for "Continue" button
  creditsUsed?: number;
  creditsLimit?: number;
  type?: 'imageToText' | 'textToPrompt' | 'imageGeneration' | 'videoGeneration' | 'credits';
  feature?: 'imageToText' | 'textToPrompt' | 'imageGeneration' | 'videoGeneration' | 'credits'; // Alias for type
  isAuthenticated?: boolean;
  limitType?: 'daily' | 'monthly';
  showContinueButton?: boolean; // Whether to show "Continue" button
}

export default function UpgradePrompt({
  isOpen = true,
  onClose,
  onContinue,
  creditsUsed = 0,
  creditsLimit: _creditsLimit = 5,
  type = 'credits',
  feature,
  isAuthenticated = true,
  limitType = 'daily',
  showContinueButton = false,
}: UpgradePromptProps) {
  // Use feature prop if provided, otherwise fall back to type
  const effectiveType = feature || type;
  const pathname = usePathname();
  const pathParts = pathname.split('/').filter(Boolean);
  const locale =
    pathParts[0] && ['en', 'zh', 'es', 'fr', 'ja'].includes(pathParts[0]) ? pathParts[0] : 'en';
  const [userPlanId, setUserPlanId] = useState<string>('free');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const { createCheckoutSession } = useCreemPayment();

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      getUserSubscription().then((result) => {
        if (result.success && result.data) {
          const priceId = result.data.priceId;
          const plan = paymentConfig.plans.find(
            (p) =>
              p.creemPriceIds?.monthly === priceId ||
              p.creemPriceIds?.yearly === priceId ||
              p.stripePriceIds?.monthly === priceId ||
              p.stripePriceIds?.yearly === priceId
          );
          if (plan) {
            setUserPlanId(plan.id);
          }
        }
      });
    }
  }, [isAuthenticated, isOpen]);

  // Get configured credit costs (use cheapest options as baseline)
  const imageCreditCost = creditsConfig.consumption.imageGeneration['nano-banana'];
  const videoCreditCost = creditsConfig.consumption.videoGeneration['sora-2-720p-10s'];

  // Determine which plan to recommend
  const targetPlan: 'pro' | 'proplus' = userPlanId === 'pro' ? 'proplus' : 'pro';
  const targetPlanConfig = paymentConfig.plans.find((p) => p.id === targetPlan);
  const targetPlanName = targetPlanConfig?.name || (targetPlan === 'proplus' ? 'Pro+' : 'Pro');
  const targetPlanPrice = targetPlanConfig?.price || 14.9;
  const targetPlanCredits = targetPlanConfig?.credits.monthly || 500;

  const handleUpgradeClick = async () => {
    if (!isAuthenticated) {
      window.location.href = `/${locale}/login`;
      return;
    }

    try {
      setIsProcessingCheckout(true);
      await createCheckoutSession({
        planId: targetPlan,
        interval: 'month',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout session';
      toast.error(message);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const getContentType = () => {
    switch (effectiveType) {
      case 'imageToText':
        return 'Image-to-Text conversions';
      case 'textToPrompt':
        return 'Text-to-Prompt generations';
      case 'imageGeneration':
        return 'image generations';
      case 'videoGeneration':
        return 'video generations';
      case 'credits':
        return 'credits';
      default:
        return 'credits';
    }
  };

  const _contentType = getContentType();

  // Calculate approximate images and videos based on Nano Banana (5 credits) and Sora 2 720P 10s (15 credits)
  const approxImages = Math.floor(targetPlanCredits / imageCreditCost);
  const approxVideos = Math.floor(targetPlanCredits / videoCreditCost);

  // Use features from config and add capacity info
  const features =
    targetPlanConfig?.features.map((text, index) => ({
      icon: [Zap, Sparkles, Shield, Check, Check, Check][index] || Check,
      text,
    })) || [];

  // Add capacity info as first feature if credits > 0
  if (targetPlanCredits > 0 && features.length > 0) {
    // Replace the first feature (credits/month) with detailed capacity
    features[0] = {
      icon: Zap,
      text: `${targetPlanCredits} credits/month (up to ${approxImages} image generation or ${approxVideos} video generation)`,
    };
  }

  const _resetTime = limitType === 'daily' ? 'midnight UTC' : 'the 1st of next month';

  if (!isOpen) {
    return null;
  }

  if (!isOpen) {
    return null;
  }

  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <Card
        className="w-full max-w-md max-h-[90vh] bg-white dark:bg-slate-900 shadow-2xl border-0 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              {!isAuthenticated ? 'Sign In Required' : 'Insufficient Credits'}
            </CardTitle>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </Button>
            )}
          </div>
          {!isAuthenticated && (
            <p className="mt-2 text-body text-sm font-medium">
              Please sign in to use this feature. Sign up now to get free credits!
            </p>
          )}
          {isAuthenticated && (
            <div className="mt-2 text-center">
              <Badge
                variant="outline"
                className="text-xs border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800"
              >
                Current balance: {creditsUsed} credits
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex flex-col bg-white dark:bg-slate-900 flex-1 min-h-0 p-6 space-y-0">
          {/* Upgrade to Pro section - Always visible */}
          <div className="rounded-lg bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 py-4 text-center border border-teal-100 dark:border-teal-800 mb-6 flex-shrink-0">
            <h3 className="mb-2 font-bold text-2xl text-slate-900 dark:text-white">
              Upgrade to {targetPlanName}
            </h3>
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold text-3xl text-teal-500">${targetPlanPrice}/mo</span>
            </div>
            <Badge className="mt-2 bg-teal-500 text-white hover:bg-teal-600">
              Save 20% with yearly
            </Badge>
          </div>

          {/* Features list - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0 mb-6">
            <div className="space-y-3 pr-2">
              {features.map((feature, index) => (
                <div key={`${feature.text}-${index}`} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30">
                    <feature.icon className="h-4 w-4 text-teal-500" />
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons section - Always visible */}
          <div className="space-y-3 flex-shrink-0">
            {!isAuthenticated ? (
              <>
                <Button
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold shadow-md"
                  onClick={() => {
                    window.location.href = `/${locale}/login`;
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium"
                  onClick={() => {
                    window.location.href = `/${locale}/signup`;
                  }}
                >
                  Create Free Account
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold shadow-md"
                  disabled={isProcessingCheckout}
                  onClick={handleUpgradeClick}
                >
                  {isProcessingCheckout ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Upgrade to ${targetPlanName}`
                  )}
                </Button>

                {showContinueButton && onContinue ? (
                  <Button
                    variant="outline"
                    className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium"
                    onClick={onContinue}
                  >
                    继续生成（使用可用积分）
                  </Button>
                ) : onClose ? (
                  <Button
                    variant="outline"
                    className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                ) : null}
              </>
            )}
          </div>

          {/* Earn free credits section - Always visible */}
          {isAuthenticated && (
            <div className="space-y-1 text-center text-body text-sm mt-3 flex-shrink-0">
              <p>
                💡 Earn free credits: Daily check-in (+{creditsConfig.rewards.checkin.dailyCredits}
                ), Referrals (+{creditsConfig.rewards.referral.creditsPerReferral}), Social share (+
                {creditsConfig.rewards.socialShare.creditsPerShare})
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
