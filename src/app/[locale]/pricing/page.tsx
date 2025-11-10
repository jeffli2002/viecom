import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      description: 'Perfect for trying out our platform',
      features: [
        '2 credits per day (daily check-in)',
        'Text-to-image generation',
        'Text-to-video generation',
        'Basic image styles',
        '3 Image-to-Prompt per day',
        '1GB storage',
        'Standard quality',
        'Community support',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 14.9,
      monthlyCredits: 500,
      description: 'For growing e-commerce businesses',
      features: [
        '500 credits/month (~100 images or 25 videos)',
        'All image generation features',
        'All video generation features',
        'Brand analysis',
        '300 Image-to-Prompt per month',
        'Batch generation',
        'No watermarks',
        'Commercial license',
        '10GB storage',
        'HD quality exports',
        'Priority support',
        'Early access to new features',
      ],
      cta: 'Upgrade to Pro',
      highlighted: true,
      popular: true,
      savings: 'Save 20% with yearly',
    },
    {
      id: 'proplus',
      name: 'Pro+',
      price: 29.9,
      monthlyCredits: 1200,
      description: 'For professional agencies and high-volume sellers',
      features: [
        '1200 credits/month (~240 images or 60 videos)',
        'Everything in Pro',
        'Advanced AI models',
        'Unlimited Image-to-Prompt',
        'Priority queue processing',
        'Direct platform publishing',
        'API access',
        'Unlimited storage',
        '4K/8K quality exports',
        'White-label options',
        'Dedicated account manager',
        '24/7 priority support',
      ],
      cta: 'Upgrade to Pro+',
      highlighted: false,
    },
  ];

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

      {/* Credit Costs */}
      <div className="mb-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Credit Consumption Rates
        </h3>
        <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-gray-900">Image Generation</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">5 credits</p>
            <p className="text-sm text-gray-600">per image</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="font-semibold text-gray-900">Video Generation</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">20 credits</p>
            <p className="text-sm text-gray-600">per video</p>
          </div>
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
              {plan.monthlyCredits && (
                <p className="text-sm text-purple-600 font-medium">
                  {plan.monthlyCredits} credits/month
                </p>
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
              Is there a free trial?
            </h3>
            <p className="text-gray-700 text-sm">
              Yes! The Free plan is completely free forever. You can earn 2 credits per day
              through daily check-ins. You can also earn bonus credits through referrals and
              social sharing.
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

