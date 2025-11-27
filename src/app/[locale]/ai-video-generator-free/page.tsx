import { Button } from '@/components/ui/button';
import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';
import { buildLocaleCanonicalMetadata } from '@/lib/seo/metadata';
import { ArrowRight, Calendar, Check, Gift, Sparkles, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseMetadata = buildLocaleCanonicalMetadata(locale, '/ai-video-generator-free');

  if (locale === 'zh') {
    return {
      ...baseMetadata,
      title: '免费AI视频生成器 | 送30积分，无需信用卡',
      description:
        '免费创建AI视频。注册送30积分，每日签到送2积分，无需信用卡。Sora 2模型，文字转视频，图片转视频。立即开始！',
      keywords: [
        '免费AI视频生成器',
        'AI视频生成器免费在线',
        '免费视频AI',
        '无需信用卡AI视频',
        '免费AI视频制作',
        '免费Sora 2',
      ],
      openGraph: {
        title: '免费AI视频生成器 | 送30积分，无需信用卡',
        description: '免费创建AI视频。注册送30积分，每日签到送2积分，无需信用卡。',
        type: 'website',
      },
    };
  }

  return {
    ...baseMetadata,
    title: 'Free AI Video Generator | 30 Credits, No Credit Card Required',
    description:
      'Create AI videos for free. Get 30 credits on signup, earn 2 credits daily, no credit card required. Sora 2 models, text-to-video, image-to-video. Start now!',
    keywords: [
      'free ai video generator',
      'ai video generator free online',
      'free video ai',
      'no credit card ai video',
      'free ai video maker',
      'free sora 2',
    ],
    openGraph: {
      title: 'Free AI Video Generator | 30 Credits, No Credit Card',
      description:
        'Create AI videos for free. Get 30 credits on signup, earn 2 credits daily, no credit card required.',
      type: 'website',
    },
  };
}

const freeFeatures = [
  'No credit card required',
  'No hidden fees or charges',
  'No time limits',
  'No watermarks on all images/videos',
  'Full access to Sora 2 models',
  'Text-to-video generation',
  'Image-to-video generation',
  'Download videos in MP4 format',
  'Commercial use allowed',
  'Upgrade anytime',
];

const earnMoreCredits = [
  {
    title: 'Daily Check-in',
    description: 'Get 2 free credits every day just by checking in',
    icon: Calendar,
    credits: '+2 credits/day',
  },
  {
    title: 'Referral Program',
    description: 'Invite friends and earn 10 credits per signup',
    icon: Users,
    credits: '+10 credits/referral',
  },
  {
    title: 'Social Sharing',
    description: 'Share your videos on social media to earn bonus credits',
    icon: Sparkles,
    credits: '+5 credits/share',
  },
];

export default function FreeAIVideoGeneratorPage() {
  const dailyCheckinCredits = creditsConfig.rewards.checkin.dailyCredits;
  const referralReward = creditsConfig.rewards.referral.creditsPerReferral;
  const shareReward = creditsConfig.rewards.socialShare.creditsPerShare;
  const cheapestPack = paymentConfig.creditPacks[0]; // First pack is usually the cheapest

  // Get plan configurations
  const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
  const proPlan = paymentConfig.plans.find((p) => p.id === 'pro');
  const proPlusPlan = paymentConfig.plans.find((p) => p.id === 'proplus');

  // Build comparison table dynamically from config
  // All plans get the same sign-up bonus (30 credits)
  const signupBonus = freePlan?.credits.onSignup || 30;
  const comparisonTable = [
    {
      feature: 'Sign-up Bonus',
      free: signupBonus ? `${signupBonus} credits (one-time)` : 'N/A',
      pro: signupBonus ? `${signupBonus} credits (one-time)` : 'N/A',
      proPlus: signupBonus ? `${signupBonus} credits (one-time)` : 'N/A',
    },
    {
      feature: 'Monthly Credits',
      free: String(freePlan?.credits.monthly || 0),
      pro: String(proPlan?.credits.monthly || 0),
      proPlus: String(proPlusPlan?.credits.monthly || 0),
    },
    { feature: 'Video Quality', free: '720p', pro: '720p/1080p', proPlus: '720p/1080p' },
    { feature: 'AI Models', free: 'Sora 2', pro: 'Sora 2 & Pro', proPlus: 'Sora 2 & Pro' },
    { feature: 'Concurrent Videos', free: '1', pro: '3', proPlus: '5' },
    { feature: 'Priority Processing', free: '\u2717', pro: '\u2717', proPlus: '\u2713' },
    { feature: 'Batch Generation', free: '\u2713', pro: '\u2713', proPlus: '\u2713' },
    { feature: 'Brand Analysis', free: '\u2713', pro: '\u2713', proPlus: '\u2713' },
    { feature: 'Commercial Use', free: '\u2713', pro: '\u2713', proPlus: '\u2713' },
    {
      feature: 'Monthly Price',
      free: `$${freePlan?.price || 0}`,
      pro: `$${proPlan?.price || 0}`,
      proPlus: `$${proPlusPlan?.price || 0}`,
    },
  ];

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Viecom Free AI Video Generator',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: '30 free credits on signup, no credit card required',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is the free AI video generator really free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Get 30 free credits on signup with no credit card required. Earn 2 more credits daily through check-ins, plus bonuses for referrals and social sharing.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need a credit card to sign up?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No credit card required. Simply create an account with your email and start generating videos immediately with 30 free credits.',
        },
      },
      {
        '@type': 'Question',
        name: 'How many videos can I create with 30 credits?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'With 30 credits, you can create approximately 1-6 videos depending on settings. Sora 2 720p videos cost 15-20 credits each.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are there watermarks on free videos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, all images and videos generated on our platform have no watermarks, regardless of whether you use free credits or paid credits. All content is watermark-free.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use free AI videos commercially?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! All videos generated on our platform, including free tier, can be used for commercial purposes.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema is safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema is safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container-base py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 px-4 py-2 rounded-full border border-green-200 dark:border-green-800 mb-6">
            <Gift className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              100% Free - No Credit Card Required
            </span>
          </div>

          <h1 className="h1-hero text-center mb-6">
            Create{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">
              Professional AI Videos
            </span>{' '}
            for Free
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Start with 30 free credits sign-up bonus (one-time). No credit card, no hidden fees, no
            time limits. Create videos with Sora 2 AI models and earn more credits daily. Perfect
            for trying our platform risk-free.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/video-generation">
              <Button size="lg" className="btn-primary text-lg px-8 py-6 group">
                Start Creating Free Videos
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Compare Plans
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>30 Free Credits</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>No Expiration</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Commercial Use OK</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mb-20">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 md:p-12 border border-slate-200 dark:border-slate-700">
            <h2 className="h2-section text-center mb-12">What's Included for Free</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {freeFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-lg text-slate-700 dark:text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="h2-section text-center mb-4">Earn More Free Credits</h2>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-12">
            Keep creating videos for free by earning credits every day
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {earnMoreCredits.map((method) => (
              <div
                key={method.title}
                className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-8 hover:border-green-500 dark:hover:border-green-500 transition-colors"
              >
                <method.icon className="h-12 w-12 text-green-500 mb-4" />
                <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                  {method.credits}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                  {method.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">{method.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="h2-section text-center mb-4">Free vs Paid Plans Comparison</h2>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-12">
            Start free, upgrade when you need more
          </p>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white">
                      Free
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white bg-teal-100 dark:bg-teal-900/30">
                      Pro
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white">
                      Pro+
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {comparisonTable.map((row) => (
                    <tr key={row.feature} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-700 dark:text-slate-300">
                        {row.free}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-700 dark:text-slate-300 bg-teal-50 dark:bg-teal-900/20">
                        {row.pro}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-700 dark:text-slate-300">
                        {row.proPlus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="h2-section text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                Is the free AI video generator really free?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Yes! Get 30 free credits on signup with no credit card required. Earn 2 more credits
                daily through check-ins, plus bonuses for referrals and social sharing.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                Do I need a credit card to sign up?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                No credit card required. Simply create an account with your email and start
                generating videos immediately with 30 free credits.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                How many videos can I create with 30 credits?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                With 30 credits, you can create approximately 1-6 videos depending on settings. Sora
                2 720p videos cost 15-20 credits each.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                Are there watermarks on free videos?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                No, all images and videos generated on our platform have no watermarks, regardless
                of whether you use free credits or paid credits. All content is watermark-free.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                Can I use free AI videos commercially?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Yes! All videos generated on our platform, including free tier, can be used for
                commercial purposes.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                What happens when I run out of credits?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                You have several options: (1) Purchase one-time credit packs starting at $
                {cheapestPack.price} for {cheapestPack.credits} credits (packs never expire), (2)
                Upgrade to Pro/Pro+ for monthly credit allocations (500-900 credits/month), or (3)
                Earn credits daily through check-ins ({dailyCheckinCredits} credits/day), referrals
                ({referralReward} credits per referral), and social sharing ({shareReward} credits
                per share). Credit packs are perfect if you need extra credits without committing to
                a subscription. No forced upgrades - stay free forever if you prefer!
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Creating?</h2>
            <p className="text-xl mb-8 opacity-90">
              Get your 30 free credits now. No credit card. No commitment. No risk.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/video-generation">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  Start Free Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/image-to-video-ai">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 bg-transparent hover:bg-white/10 text-white border-white"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
