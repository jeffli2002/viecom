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

  // Get configured credit costs
  const imageCreditCost = creditsConfig.consumption.imageGeneration['nano-banana'];
  const videoCreditCost = creditsConfig.consumption.videoGeneration['sora-2'];

  // Determine which plan to recommend
  const targetPlan = userPlanId === 'pro' ? 'proplus' : 'pro';
  const targetPlanConfig = paymentConfig.plans.find((p) => p.id === targetPlan);
  const targetPlanName = targetPlan === 'proplus' ? 'Pro+' : 'Pro';
  const targetPlanPrice = targetPlanConfig?.price || 14.9;

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

  // Calculate approximate images and videos based on credit costs
  const creditsPerMonth = 500;
  const approxImages = Math.floor(creditsPerMonth / imageCreditCost);
  const approxVideos = Math.floor(creditsPerMonth / videoCreditCost);

  const features = targetPlanConfig?.features.map((text, index) => ({
    icon: [Zap, Sparkles, Shield, Check, Check, Check][index] || Check,
    text,
  })) || [
    { icon: Zap, text: '300 Image-to-Text per month' },
    {
      icon: Sparkles,
      text: `${creditsPerMonth} credits/month (~${approxImages} images or ${approxVideos} videos)`,
    },
    { icon: Shield, text: 'No Ads' },
    { icon: Check, text: 'Commercial license' },
    { icon: Check, text: 'HD quality exports' },
    { icon: Check, text: 'Priority support' },
  ];

  const resetTime = limitType === 'daily' ? 'midnight UTC' : 'the 1st of next month';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {!isAuthenticated
                ? 'Sign In Required'
                : `${limitType === 'daily' ? 'Daily' : 'Monthly'} Limit Reached`}
            </CardTitle>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            )}
          </div>
          <p className="mt-2 text-gray-600 text-sm">
            {!isAuthenticated
              ? `Please sign in to use this feature. Free users get ${creditsLimit} ${contentType} per ${limitType}!`
              : effectiveType === 'imageToText'
                ? `You've used all ${creditsLimit} free ${contentType} for ${limitType === 'daily' ? 'today' : 'this month'}.`
                : effectiveType === 'imageGeneration' || effectiveType === 'videoGeneration'
                  ? `Insufficient credits. You need more credits to generate ${effectiveType === 'imageGeneration' ? 'images' : 'videos'}. (1 image = ${imageCreditCost} credits, 1 video = ${videoCreditCost} credits)`
                  : `You've used all ${creditsLimit} free ${contentType} for ${limitType === 'daily' ? 'today' : 'this month'}. (1 image = ${imageCreditCost} credits, 1 video = ${videoCreditCost} credits)`}
          </p>
          {isAuthenticated && (
            <div className="mt-2 text-center">
              <Badge variant="outline" className="text-xs">
                Available: {creditsUsed} {effectiveType === 'credits' ? 'credits' : contentType}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 py-4 text-center">
            <h3 className="mb-2 font-bold text-2xl text-gray-900">Upgrade to {targetPlanName}</h3>
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold text-3xl text-purple-600">${targetPlanPrice}/mo</span>
            </div>
            <Badge className="mt-2 bg-purple-500">Save 20% with yearly</Badge>
          </div>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <feature.icon className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-gray-700">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {!isAuthenticated ? (
              <>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    window.location.href = `/${locale}/login`;
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
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
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => (window.location.href = `/${locale}/#pricing`)}
                >
                  Upgrade to {targetPlanName}
                </Button>

                {showContinueButton && onContinue ? (
                  <Button variant="outline" className="w-full" onClick={onContinue}>
                    继续生成（使用可用积分）
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={onClose}>
                    Try Again {limitType === 'daily' ? 'Tomorrow' : 'Next Month'}
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="space-y-1 text-center text-gray-500 text-sm">
            <p>
              Your {limitType} limit resets at {resetTime}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
