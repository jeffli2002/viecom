'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';
import { getUserSubscription } from '@/server/actions/payment/get-billing-info';
import { Check, Shield, Sparkles, Zap } from 'lucide-react';
import { usePathname } from '@/i18n/navigation';
import { useEffect, useState } from 'react';

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
  creditsLimit = 5,
  type = 'credits',
  feature,
  isAuthenticated = true,
  limitType = 'daily',
  showContinueButton = false,
}: UpgradePromptProps) {
  // Use feature prop if provided, otherwise fall back to type
  const effectiveType = feature || type;

  if (!isOpen) {
    return null;
  }
  const pathname = usePathname();
  const pathParts = pathname.split('/').filter(Boolean);
  const locale =
    pathParts[0] && ['en', 'zh', 'es', 'fr', 'ja'].includes(pathParts[0]) ? pathParts[0] : 'en';
  const [userPlanId, setUserPlanId] = useState<string>('free');

  useEffect(() => {
    if (isAuthenticated) {
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
  }, [isAuthenticated]);

  // Get configured credit costs (use cheapest options as baseline)
  const imageCreditCost = creditsConfig.consumption.imageGeneration['nano-banana'];
  const videoCreditCost = creditsConfig.consumption.videoGeneration['sora-2-720p-10s'];

  // Determine which plan to recommend
  const targetPlan = userPlanId === 'pro' ? 'proplus' : 'pro';
  const targetPlanConfig = paymentConfig.plans.find((p) => p.id === targetPlan);
  const targetPlanName = targetPlanConfig?.name || (targetPlan === 'proplus' ? 'Pro+' : 'Pro');
  const targetPlanPrice = targetPlanConfig?.price || 14.9;
  const targetPlanCredits = targetPlanConfig?.credits.monthly || 500;

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

  const contentType = getContentType();

  // Calculate approximate images and videos based on Nano Banana (5 credits) and Sora 2 720P 10s (15 credits)
  const approxImages = Math.floor(targetPlanCredits / imageCreditCost);
  const approxVideos = Math.floor(targetPlanCredits / videoCreditCost);

  // Use features from config and add capacity info
  const features = targetPlanConfig?.features.map((text, index) => ({
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

  const resetTime = limitType === 'daily' ? 'midnight UTC' : 'the 1st of next month';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl border-0">
        <CardHeader className="bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">
              {!isAuthenticated
                ? 'Sign In Required'
                : 'Insufficient Credits'}
            </CardTitle>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                ✕
              </Button>
            )}
          </div>
          <p className="mt-2 text-gray-700 text-sm font-medium">
            {!isAuthenticated
              ? 'Please sign in to use this feature. Sign up now to get free credits!'
              : effectiveType === 'imageGeneration'
                ? `You don't have enough credits to generate images. Each image costs ${imageCreditCost} credits (Nano Banana model). Upgrade your plan to get more credits or earn them through daily check-ins.`
                : effectiveType === 'videoGeneration'
                  ? `You don't have enough credits to generate videos. Video costs range from ${creditsConfig.consumption.videoGeneration['sora-2-720p-10s']} credits (Sora 2) to ${creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s']} credits (Sora 2 Pro 1080P). Upgrade your plan to get more credits or earn them through daily check-ins.`
                  : effectiveType === 'imageToText'
                    ? `You don't have enough credits for image-to-text conversion. Upgrade your plan to get more credits or earn them through daily check-ins.`
                    : `You don't have enough credits. Upgrade your plan to get more credits or earn them through daily check-ins.`}
          </p>
          {isAuthenticated && (
            <div className="mt-2 text-center">
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 bg-gray-50">
                Current balance: {creditsUsed} credits
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6 bg-white">
          <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 py-4 text-center border border-purple-100">
            <h3 className="mb-2 font-bold text-2xl text-gray-900">Upgrade to {targetPlanName}</h3>
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold text-3xl text-purple-600">${targetPlanPrice}/mo</span>
            </div>
            <Badge className="mt-2 bg-purple-600 text-white hover:bg-purple-700">Save 20% with yearly</Badge>
          </div>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <feature.icon className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-gray-800 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {!isAuthenticated ? (
              <>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md"
                  onClick={() => {
                    window.location.href = `/${locale}/login`;
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
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
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md"
                  onClick={() => (window.location.href = `/${locale}/#pricing`)}
                >
                  Upgrade to {targetPlanName}
                </Button>

                {showContinueButton && onContinue ? (
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium" 
                    onClick={onContinue}
                  >
                    继续生成（使用可用积分）
                  </Button>
                ) : onClose ? (
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900" 
                    onClick={onClose}
                  >
                    Close
                  </Button>
                ) : null}
              </>
            )}
          </div>

          {isAuthenticated && (
            <div className="space-y-1 text-center text-gray-600 text-sm">
              <p>
                💡 Earn free credits: Daily check-in (+{creditsConfig.rewards.checkin.dailyCredits}), Referrals (+{creditsConfig.rewards.referral.creditsPerReferral}), Social share (+{creditsConfig.rewards.socialShare.creditsPerShare})
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
