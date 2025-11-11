import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { paymentConfig } from '@/config/payment.config';
import { creditsConfig } from '@/config/credits.config';

export default function PricingPage() {
  // Get pricing data from config
  const plans = paymentConfig.plans.map((plan) => {
    const monthlyCredits = plan.credits.monthly || plan.credits.onSignup || 0;
    
    // Calculate estimated capacity based on Nano Banana (5 credits) and Sora 2 720P 10s (15 credits)
    const imageCount = Math.floor(monthlyCredits / creditsConfig.consumption.imageGeneration['nano-banana']);
    const videoCount = Math.floor(monthlyCredits / creditsConfig.consumption.videoGeneration['sora-2-720p-10s']);
    
    // Create dynamic features list
    const features = [...plan.features];
    
    // Replace first feature (credits/month) with detailed capacity if plan has credits
    if (monthlyCredits > 0 && features.length > 0 && features[0].includes('credits/month')) {
      features[0] = `${monthlyCredits} credits/month (up to ${imageCount} image generation or ${videoCount} video generation)`;
    }
    
    return {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      yearlyPrice: plan.yearlyPrice,
      monthlyCredits,
      description: plan.description,
      features,
      popular: plan.popular,
      cta: plan.id === 'free' ? 'Get Started' : `Upgrade to ${plan.name}`,
      highlighted: plan.popular,
      savings: plan.yearlyPrice ? 'Save 20% with yearly' : undefined,
      capacityInfo: monthlyCredits > 0 
        ? `up to ${imageCount} image generation or ${videoCount} video generation` 
        : undefined,
      batchConcurrency: plan.limits?.batchSize,
    };
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
        <p className="text-lg text-gray-600 mb-6">
          Choose the plan that fits your business needs. Upgrade or downgrade anytime.
        </p>
        <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-200">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-900">
            All plans include daily check-in rewards and referral bonuses
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.highlighted
                ? 'border-purple-500 border-2 shadow-xl scale-105'
                : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white px-4 py-1">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                {plan.price > 0 && <span className="text-gray-600">/month</span>}
              </div>
              {plan.monthlyCredits > 0 && (
                <>
                  <p className="text-sm text-purple-600 font-medium">
                    {plan.monthlyCredits} credits/month
                  </p>
                  {plan.capacityInfo && (
                    <p className="text-xs text-gray-500 mt-1">
                      {plan.capacityInfo}
                    </p>
                  )}
                </>
              )}
              {plan.savings && (
                <Badge variant="outline" className="mt-2 border-purple-300 text-purple-700">
                  {plan.savings}
                </Badge>
              )}
              <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.id === 'free' ? '/signup' : '/#pricing'} className="block">
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Credit Consumption Rates */}
      <div className="mb-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-purple-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Credit Consumption Rates
        </h3>
        
        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Image Generation - Single Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 border border-blue-200 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-gray-900 text-lg">Image Generation</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {creditsConfig.consumption.imageGeneration['nano-banana']} credits
              </p>
              <p className="text-sm text-gray-600 mb-4">per image (Nano Banana model)</p>
              <div className="pt-4 border-t border-blue-100">
                <p className="text-xs text-gray-600">
                  ⚡ Fast generation • 📸 High quality
                </p>
              </div>
            </div>
          </div>

          {/* Video Generation - Two Cards in Column */}
          <div className="lg:col-span-2">
            <div className="text-center mb-4">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span className="font-bold text-gray-900 text-lg">Video Generation</span>
              </div>
              <p className="text-sm text-gray-600">Pricing varies by model, resolution, and duration</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Sora 2 */}
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <div className="mb-3">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Sora 2</Badge>
                  <p className="text-xs text-gray-500 mt-1">Standard quality • 720P • 2-3 min</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">10 seconds</span>
                    <span className="font-bold text-blue-600">
                      {creditsConfig.consumption.videoGeneration['sora-2-720p-10s']} credits
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">15 seconds</span>
                    <span className="font-bold text-blue-600">
                      {creditsConfig.consumption.videoGeneration['sora-2-720p-15s']} credits
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600">
                    💰 Most economical • ⚡ Fast generation
                  </p>
                </div>
              </div>

              {/* Sora 2 Pro */}
              <div className="bg-white rounded-lg p-4 border border-purple-200 relative">
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-purple-600 text-white text-xs">Pro</Badge>
                </div>
                <div className="mb-3">
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Sora 2 Pro</Badge>
                  <p className="text-xs text-gray-500 mt-1">High quality • 720P/1080P • 2-13 min</p>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500 mb-1">720P Resolution:</div>
                  <div className="flex justify-between items-center pl-2">
                    <span className="text-sm text-gray-700">10 seconds</span>
                    <span className="font-bold text-purple-600">
                      {creditsConfig.consumption.videoGeneration['sora-2-pro-720p-10s']} credits
                    </span>
                  </div>
                  <div className="flex justify-between items-center pl-2">
                    <span className="text-sm text-gray-700">15 seconds</span>
                    <span className="font-bold text-purple-600">
                      {creditsConfig.consumption.videoGeneration['sora-2-pro-720p-15s']} credits
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-500 mb-1 mt-3">1080P Resolution:</div>
                  <div className="flex justify-between items-center pl-2">
                    <span className="text-sm text-gray-700">10 seconds</span>
                    <span className="font-bold text-purple-600">
                      {creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-10s']} credits
                    </span>
                  </div>
                  <div className="flex justify-between items-center pl-2">
                    <span className="text-sm text-gray-700">15 seconds</span>
                    <span className="font-bold text-purple-600">
                      {creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s']} credits
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-purple-100">
                  <p className="text-xs text-gray-600">
                    ✨ Premium quality • 🎬 Professional grade
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Tips */}
            <div className="mt-4 bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-900">
                <strong>💡 Pro Tip:</strong> Use Sora 2 for drafts and iterations (economical), 
                then upgrade to Sora 2 Pro 1080P for final deliverables (premium quality).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Can I change plans anytime?
            </h3>
            <p className="text-gray-700 text-sm">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect
              immediately when upgrading, or at the end of your billing period when downgrading.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              What happens to unused credits?
            </h3>
            <p className="text-gray-700 text-sm">
              Unused monthly credits expire at the end of your billing cycle. However, credits
              earned through check-ins and rewards carry over as long as your account is active.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-gray-700 text-sm">
              We offer a 7-day satisfaction guarantee for new subscriptions. If you're not
              satisfied, contact us within 7 days for a full refund. After 7 days, all fees are
              non-refundable.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Is there a free plan?
            </h3>
            <p className="text-gray-700 text-sm">
              Yes! The Free plan is completely free forever. You get {paymentConfig.plans[0].credits.onSignup} credits 
              as a sign-up bonus and can earn {creditsConfig.rewards.checkin.dailyCredits} credits per day through daily check-ins. 
              You can also earn bonus credits through referrals ({creditsConfig.rewards.referral.creditsPerReferral} credits per referral) 
              and social sharing ({creditsConfig.rewards.socialShare.creditsPerShare} credits per share).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-gray-700 text-sm">
              We accept all major credit cards (Visa, MasterCard, American Express) and various
              digital payment methods through our payment processor Creem.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Why does Sora 2 Pro cost more than Sora 2?
            </h3>
            <p className="text-gray-700 text-sm">
              Sora 2 Pro delivers significantly higher quality videos with better motion, refined 
              physics, and support for 1080P resolution. The premium pricing (3x for 720P, more for 1080P) 
              reflects the advanced AI model and longer generation times. We recommend using Sora 2 for 
              drafts and testing, then Sora 2 Pro for final deliverables.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              How many videos can I create with my monthly credits?
            </h3>
            <p className="text-gray-700 text-sm">
              It depends on your choice of model and settings:
            </p>
            <ul className="text-gray-700 text-sm mt-2 space-y-1 list-disc list-inside">
              {paymentConfig.plans.filter(p => p.credits.monthly > 0).map((plan) => {
                const credits = plan.credits.monthly;
                const sora2Count = Math.floor(credits / creditsConfig.consumption.videoGeneration['sora-2-720p-15s']);
                const sora2Pro720Count = Math.floor(credits / creditsConfig.consumption.videoGeneration['sora-2-pro-720p-15s']);
                const sora2Pro1080Count = Math.floor(credits / creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s']);
                
                return (
                  <li key={plan.id}>
                    <strong>{plan.name} ({credits} credits):</strong> {sora2Count} Sora 2 videos, 
                    or {sora2Pro720Count} Sora 2 Pro 720P videos, 
                    or {sora2Pro1080Count} Sora 2 Pro 1080P videos
                  </li>
                );
              })}
            </ul>
            <p className="text-gray-700 text-sm mt-2">
              💡 <strong>Tip:</strong> Mix different models to optimize your budget. Use Sora 2 for quantity, 
              Sora 2 Pro for quality where it matters most.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Do you offer enterprise plans?
            </h3>
            <p className="text-gray-700 text-sm">
              Yes! For businesses with higher volume needs or custom requirements, please{' '}
              <Link href="/contact" className="text-purple-600 hover:underline">
                contact our sales team
              </Link>{' '}
              for a customized enterprise plan.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-4">Ready to Transform Your E-commerce Visuals?</h3>
        <p className="text-purple-100 mb-6">
          Start with our free plan today. No credit card required.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
        >
          Start Free Trial
        </Link>
      </div>
    </div>
  );
}

