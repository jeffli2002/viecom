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

  // Get config values for metadata
  const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
  const signupBonus = freePlan?.credits.onSignup || 15;
  const dailyCheckinCredits = creditsConfig.rewards.checkin.dailyCredits;

  const translations: Record<string, Metadata> = {
    en: {
      ...baseMetadata,
      title: 'Seedance 2.0 Fast Credit Guide | Earn Free Credits',
      description: `Get ${signupBonus} credits on signup and earn ${dailyCheckinCredits} daily toward Seedance 2.0 Fast videos, which start at 50 credits.`,
      keywords: [
        'free ai video generator',
        'ai video generator free online',
        'free video ai',
        'no credit card ai video',
        'free ai video maker',
        'free seedance 2.0 fast',
      ],
      openGraph: {
        title: 'Seedance 2.0 Fast Credit Guide',
        description: `Start with ${signupBonus} credits and earn more toward Seedance videos starting at 50 credits.`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Seedance 2.0 Fast Credit Guide',
        description: `Start with ${signupBonus} credits and earn more toward Seedance videos starting at 50 credits.`,
      },
    },
    zh: {
      ...baseMetadata,
      title: `免费AI视频生成器 | 送${signupBonus}积分，无需信用卡`,
      description: `注册送${signupBonus}积分，每日签到送${dailyCheckinCredits}积分，用于最低50积分起的 Seedance 2.0 Fast 视频。`,
      keywords: [
        '免费AI视频生成器',
        'AI视频生成器免费在线',
        '免费视频AI',
        '无需信用卡AI视频',
        '免费AI视频制作',
        '免费 Seedance 2.0',
      ],
      openGraph: {
        title: `免费AI视频生成器 | 送${signupBonus}积分，无需信用卡`,
        description: `注册送${signupBonus}积分并继续赚取积分，Seedance 视频最低50积分起。`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `免费AI视频生成器 | 送${signupBonus}积分，无需信用卡`,
        description: `注册送${signupBonus}积分并继续赚取积分，Seedance 视频最低50积分起。`,
      },
    },
    es: {
      ...baseMetadata,
      title: `Generador de Video IA Gratis | ${signupBonus} Créditos, Sin Tarjeta de Crédito`,
      description: `Obtén ${signupBonus} créditos al registrarte y ${dailyCheckinCredits} diarios para videos Seedance 2.0 Fast, desde 50 créditos.`,
      keywords: [
        'generador video ia gratis',
        'generador video ia gratis online',
        'video ia gratis',
        'video ia sin tarjeta',
        'creador video ia gratis',
        'seedance 2.0 fast gratis',
      ],
      openGraph: {
        title: `Generador de Video IA Gratis | ${signupBonus} Créditos, Sin Tarjeta`,
        description: `Empieza con ${signupBonus} créditos y gana más para videos Seedance desde 50 créditos.`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Generador de Video IA Gratis | ${signupBonus} Créditos, Sin Tarjeta`,
        description: `Empieza con ${signupBonus} créditos y gana más para videos Seedance desde 50 créditos.`,
      },
    },
    fr: {
      ...baseMetadata,
      title: `Générateur de Vidéo IA Gratuit | ${signupBonus} Crédits, Sans Carte de Crédit`,
      description: `Recevez ${signupBonus} crédits à l'inscription et ${dailyCheckinCredits} par jour pour les vidéos Seedance 2.0 Fast, à partir de 50 crédits.`,
      keywords: [
        'générateur vidéo ia gratuit',
        'générateur vidéo ia gratuit en ligne',
        'vidéo ia gratuite',
        'vidéo ia sans carte',
        'créateur vidéo ia gratuit',
        'seedance 2.0 fast gratuit',
      ],
      openGraph: {
        title: `Générateur de Vidéo IA Gratuit | ${signupBonus} Crédits, Sans Carte`,
        description: `Commencez avec ${signupBonus} crédits et gagnez-en plus pour les vidéos Seedance dès 50 crédits.`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Générateur de Vidéo IA Gratuit | ${signupBonus} Crédits, Sans Carte`,
        description: `Commencez avec ${signupBonus} crédits et gagnez-en plus pour les vidéos Seedance dès 50 crédits.`,
      },
    },
    de: {
      ...baseMetadata,
      title: `Kostenloser KI-Videogenerator | ${signupBonus} Credits, Keine Kreditkarte`,
      description: `Erhalten Sie ${signupBonus} Credits bei der Anmeldung und täglich ${dailyCheckinCredits} für Seedance 2.0 Fast Videos ab 50 Credits.`,
      keywords: [
        'kostenloser ki videogenerator',
        'ki videogenerator kostenlos online',
        'kostenloses video ki',
        'video ki ohne kreditkarte',
        'kostenloser ki video ersteller',
        'kostenloses seedance 2.0 fast',
      ],
      openGraph: {
        title: `Kostenloser KI-Videogenerator | ${signupBonus} Credits, Keine Kreditkarte`,
        description: `Starten Sie mit ${signupBonus} Credits und sammeln Sie mehr für Seedance Videos ab 50 Credits.`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Kostenloser KI-Videogenerator | ${signupBonus} Credits, Keine Kreditkarte`,
        description: `Starten Sie mit ${signupBonus} Credits und sammeln Sie mehr für Seedance Videos ab 50 Credits.`,
      },
    },
    ja: {
      ...baseMetadata,
      title: `無料AI動画生成器 | ${signupBonus}クレジット、クレジットカード不要`,
      description: `登録時に${signupBonus}クレジット、毎日${dailyCheckinCredits}クレジットを獲得。Seedance 2.0 Fast動画は50クレジットから。`,
      keywords: [
        '無料ai動画生成器',
        'ai動画生成器無料オンライン',
        '無料動画ai',
        'クレジットカード不要動画ai',
        '無料ai動画メーカー',
        '無料seedance 2.0 fast',
      ],
      openGraph: {
        title: `無料AI動画生成器 | ${signupBonus}クレジット、クレジットカード不要`,
        description: `${signupBonus}クレジットから始め、50クレジット以上のSeedance動画に向けて追加獲得。`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `無料AI動画生成器 | ${signupBonus}クレジット、クレジットカード不要`,
        description: `${signupBonus}クレジットから始め、50クレジット以上のSeedance動画に向けて追加獲得。`,
      },
    },
  };

  return translations[locale] || translations.en;
}

const freeFeatures = [
  'No credit card required',
  'No hidden fees or charges',
  'No time limits',
  'No watermarks on all images/videos',
  'Access to Seedance 2.0 Fast',
  'Text-to-video generation',
  'Image-to-video generation',
  'Download videos in MP4 format',
  'Commercial use on Pro and Pro+',
  'Upgrade anytime',
];

// This will be populated dynamically using config values
const getEarnMoreCredits = (
  dailyCheckinCredits: number,
  referralReward: number,
  shareReward: number
) => [
  {
    title: 'Daily Check-in',
    description: `Get ${dailyCheckinCredits} free credits every day just by checking in`,
    icon: Calendar,
    credits: `+${dailyCheckinCredits} credits/day`,
  },
  {
    title: 'Referral Program',
    description: `Invite friends and earn ${referralReward} credits per signup`,
    icon: Users,
    credits: `+${referralReward} credits/referral`,
  },
  {
    title: 'Social Sharing',
    description: 'Share your videos on social media to earn bonus credits',
    icon: Sparkles,
    credits: `+${shareReward} credits/share`,
  },
];

export default function FreeAIVideoGeneratorPage() {
  const dailyCheckinCredits = creditsConfig.rewards.checkin.dailyCredits;
  const referralReward = creditsConfig.rewards.referral.creditsPerReferral;
  const shareReward = creditsConfig.rewards.socialShare.creditsPerShare;
  const cheapestPack = paymentConfig.creditPacks[0]; // First pack is usually the cheapest

  // Get earn more credits data dynamically from config
  const earnMoreCredits = getEarnMoreCredits(dailyCheckinCredits, referralReward, shareReward);

  // Get plan configurations
  const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
  const proPlan = paymentConfig.plans.find((p) => p.id === 'pro');
  const proPlusPlan = paymentConfig.plans.find((p) => p.id === 'proplus');

  // Get video generation costs from config
  const seedanceMinCost = creditsConfig.consumption.videoGeneration['seedance-2-fast-480p-10s'];
  const seedanceMaxCost = creditsConfig.consumption.videoGeneration['seedance-2-fast-720p-15s'];

  // Build comparison table dynamically from config
  // All plans get the same sign-up bonus
  const signupBonus = freePlan?.credits.onSignup || 15;
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
    { feature: 'Video Quality', free: '480p/720p', pro: '480p/720p', proPlus: '480p/720p' },
    { feature: 'AI Models', free: 'Seedance Fast', pro: 'Seedance Fast', proPlus: 'Seedance Fast' },
    { feature: 'Concurrent Videos', free: '1', pro: '3', proPlus: '5' },
    { feature: 'Priority Processing', free: '\u2717', pro: '\u2717', proPlus: '\u2713' },
    { feature: 'Batch Generation', free: '\u2713', pro: '\u2713', proPlus: '\u2713' },
    { feature: 'Brand Analysis', free: '\u2713', pro: '\u2713', proPlus: '\u2713' },
    { feature: 'Commercial Use', free: 'Personal/testing', pro: '\u2713', proPlus: '\u2713' },
    {
      feature: 'Monthly Price',
      free: `$${freePlan?.price || 0}`,
      pro: `$${proPlan?.price || 0}`,
      proPlus: `$${proPlusPlan?.price || 0}`,
    },
  ];

  const creditsNeededForFirstVideo = Math.max(0, seedanceMinCost - signupBonus);

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Viecom Seedance 2.0 Fast Credit Guide',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: `${signupBonus} free credits on signup, no credit card required`,
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
          text: `Yes! Get ${signupBonus} free credits on signup with no credit card required. Earn ${dailyCheckinCredits} more credits daily through check-ins, plus bonuses for referrals and social sharing.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need a credit card to sign up?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `No credit card is required. The ${signupBonus}-credit bonus does not by itself cover a Seedance video, which starts at ${seedanceMinCost} credits. Earn or purchase ${creditsNeededForFirstVideo} more credits for the first 480p 10s video.`,
        },
      },
      {
        '@type': 'Question',
        name: `Can I create a Seedance video with ${signupBonus} sign-up credits?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Not with the sign-up bonus alone. Seedance videos cost ${seedanceMinCost}-${seedanceMaxCost} credits, so you need at least ${creditsNeededForFirstVideo} additional credits from rewards or a credit purchase.`,
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
          text: 'Commercial-use rights are included with Pro and Pro+ plans. Review the current Terms of Service before publishing generated content commercially.',
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
              Start with {signupBonus} Free Credits - No Credit Card Required
            </span>
          </div>

          <h1 className="h1-hero text-center mb-6">
            Create{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">
              Seedance Product Videos
            </span>{' '}
            with Flexible Credits
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Start with {signupBonus} free credits and earn more through check-ins, referrals, and
            sharing. Seedance 2.0 Fast videos cost {seedanceMinCost}-{seedanceMaxCost} credits, so
            the sign-up bonus alone does not cover a video.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/video-generation">
              <Button size="lg" className="btn-primary text-lg px-8 py-6 group">
                Open Seedance Generator
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
              <span>{signupBonus} Free Credits</span>
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
                Yes! Get {signupBonus} free credits on signup with no credit card required. Earn{' '}
                {dailyCheckinCredits} more credits daily through check-ins, plus bonuses for
                referrals and social sharing.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                Do I need a credit card to sign up?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                No credit card is required. Seedance videos start at {seedanceMinCost} credits, so
                earn or purchase {creditsNeededForFirstVideo} more credits after the sign-up bonus
                for your first 480p 10s video.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                Can I create a Seedance video with {signupBonus} sign-up credits?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Not with the sign-up bonus alone. Seedance 2.0 Fast videos cost {seedanceMinCost}-
                {seedanceMaxCost} credits, so you need at least {creditsNeededForFirstVideo} more
                credits from rewards or a credit purchase.
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
                Commercial-use rights are included with Pro and Pro+ plans. Review the current Terms
                of Service before publishing generated content commercially.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                What happens when I run out of credits?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                You have several options: (1) Purchase one-time credit packs starting at $
                {cheapestPack.price} for {cheapestPack.credits} credits (packs never expire), (2)
                Upgrade to Pro/Pro+ for monthly credit allocations (
                {proPlan?.credits.monthly || 500}-{proPlusPlan?.credits.monthly || 900}{' '}
                credits/month), or (3) Earn credits daily through check-ins ({dailyCheckinCredits}{' '}
                credits/day), referrals ({referralReward} credits per referral), and social sharing
                ({shareReward} credits per share). Credit packs are perfect if you need extra
                credits without committing to a subscription. No forced upgrades - stay free forever
                if you prefer!
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Creating?</h2>
            <p className="text-xl mb-8 opacity-90">
              Get your {signupBonus} free credits now. No credit card. No commitment. No risk.
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
