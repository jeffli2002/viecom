import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { BadgeCheck, Check, Film, Globe, Handshake, Link2, Percent, Shield } from 'lucide-react';

const WHY_PARTNER = [
  {
    title: 'Cutting-edge AI content suite',
    description: 'Viecom helps ecommerce teams create listing-ready visuals and videos in minutes.',
    icon: Film,
  },
  {
    title: 'Attractive commission structure',
    description: 'Earn on first purchases plus renewals or upgrades when your audience converts.',
    icon: Percent,
  },
  {
    title: 'Real-time tracking',
    description: 'Monitor clicks, conversions, and earnings in one simple dashboard.',
    icon: Link2,
  },
  {
    title: 'Helpful support',
    description: 'Get quick answers, shareable assets, and guidance from the Viecom team.',
    icon: Handshake,
  },
];

const HOW_IT_WORKS = [
  {
    title: 'Sign up',
    description: 'Apply for the affiliate program and get approved.',
    illustration: (className: string) => (
      <svg viewBox="0 0 140 80" className={className} aria-hidden="true">
        <rect x="12" y="10" width="116" height="60" rx="12" fill="#0f172a" opacity="0.12" />
        <rect x="28" y="24" width="68" height="6" rx="3" fill="#94a3b8" opacity="0.8" />
        <rect x="28" y="38" width="48" height="6" rx="3" fill="#94a3b8" opacity="0.6" />
        <rect x="28" y="52" width="36" height="6" rx="3" fill="#94a3b8" opacity="0.4" />
        <circle cx="106" cy="52" r="10" fill="#22c55e" opacity="0.9" />
        <path d="M102 52l3 3 6-7" stroke="#0f172a" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    title: 'Get your affiliate links',
    description: 'Receive a unique referral link tied to your account.',
    illustration: (className: string) => (
      <svg viewBox="0 0 140 80" className={className} aria-hidden="true">
        <rect x="12" y="10" width="116" height="60" rx="12" fill="#0f172a" opacity="0.12" />
        <circle cx="46" cy="40" r="14" fill="#38bdf8" opacity="0.8" />
        <circle cx="94" cy="40" r="14" fill="#f472b6" opacity="0.8" />
        <rect x="60" y="36" width="20" height="8" rx="4" fill="#0f172a" opacity="0.6" />
      </svg>
    ),
  },
  {
    title: 'Promote Viecom.pro',
    description: 'Share tutorials, workflows, and success stories.',
    illustration: (className: string) => (
      <svg viewBox="0 0 140 80" className={className} aria-hidden="true">
        <rect x="12" y="10" width="116" height="60" rx="12" fill="#0f172a" opacity="0.12" />
        <rect x="28" y="26" width="84" height="28" rx="8" fill="#0f172a" opacity="0.15" />
        <circle cx="46" cy="40" r="6" fill="#22d3ee" />
        <circle cx="70" cy="40" r="6" fill="#60a5fa" />
        <circle cx="94" cy="40" r="6" fill="#facc15" />
      </svg>
    ),
  },
  {
    title: 'Earn commissions',
    description: 'Get paid for qualifying purchases made through your links.',
    illustration: (className: string) => (
      <svg viewBox="0 0 140 80" className={className} aria-hidden="true">
        <rect x="12" y="10" width="116" height="60" rx="12" fill="#0f172a" opacity="0.12" />
        <circle cx="70" cy="40" r="16" fill="#facc15" opacity="0.9" />
        <path
          d="M70 30v20M62 36h16M62 44h16"
          stroke="#0f172a"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M106 26l8 6-8 6" stroke="#94a3b8" strokeWidth="2" fill="none" />
        <path d="M34 54l-8-6 8-6" stroke="#94a3b8" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
];

const DOS = [
  'Create relevant engaging content to promote Viecom.',
  'Promote Viecom in an ethical way.',
  'Keep up with Viecom updates and new features.',
  'Disclose you’re a Viecom affiliate.',
];

const DONTS = [
  'Publish excessive posts or send unsolicited messages.',
  'Make exaggerated or false claims about Viecom.',
  'Promote Viecom on coupon sites without approval.',
  'Bid on Viecom brand keywords or spoof our domain.',
  'Use a Viecom domain as the landing page for ads.',
];

const FAQ_ITEMS = [
  {
    question: 'How do I sign up for the Viecom affiliate program?',
    answer: 'Create an account, open the affiliate dashboard, and submit your application.',
  },
  {
    question: 'Can I get a commission if my referred users upgrade or renew their plans?',
    answer:
      'Yes. When a user upgrades, your commission is calculated based on the price difference between the new and old plan.',
  },
  {
    question: 'What happens if a customer requests a refund?',
    answer:
      'If a customer requests a refund, the commission associated with that sale will be deducted from your earnings.',
  },
  {
    question: 'Can I promote Viecom through paid advertising?',
    answer:
      'Paid advertising is allowed, but you must not use our brand name or logo in your campaign or put our domain name in ad destination URLs.',
  },
  {
    question: 'When do I receive commission payouts?',
    answer: 'Payouts are available after the standard settlement window shown in your dashboard.',
  },
  {
    question: 'What channels can I promote on?',
    answer:
      'You can share via content, newsletters, social media, or paid ads that follow the guidelines.',
  },
  {
    question: 'Can I track clicks and conversions in real time?',
    answer: 'Yes. Your dashboard shows clicks, commissions, and payout status in one place.',
  },
  {
    question: 'What if I have more questions?',
    answer: 'Contact our affiliate support team at support@viecom.pro and we will help you out.',
  },
];

export function AffiliateLanding() {
  return (
    <main className="bg-main text-slate-900 dark:text-white">
      <section className="section-base border-b-0 bg-main relative overflow-hidden min-h-[78vh] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.25),transparent_55%),radial-gradient(circle_at_right,rgba(37,99,235,0.18),transparent_55%),radial-gradient(circle_at_left,rgba(14,116,144,0.2),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.35),transparent_55%),radial-gradient(circle_at_right,rgba(37,99,235,0.25),transparent_55%),radial-gradient(circle_at_left,rgba(14,116,144,0.3),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(241,245,249,0.8),rgba(255,255,255,0.9))] dark:bg-[radial-gradient(circle_at_center,rgba(2,6,23,0.65),rgba(0,0,0,0.9))]" />
          <svg
            aria-hidden="true"
            viewBox="0 0 240 140"
            className="absolute left-1/2 top-6 h-32 w-48 -translate-x-1/2 opacity-70 dark:opacity-80"
          >
            <defs>
              <linearGradient id="giftGlow" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <ellipse cx="120" cy="110" rx="70" ry="18" fill="url(#giftGlow)" opacity="0.35" />
            <rect x="72" y="58" width="96" height="46" rx="12" fill="#0f172a" opacity="0.7" />
            <rect x="102" y="48" width="36" height="20" rx="6" fill="#facc15" opacity="0.9" />
            <circle cx="64" cy="86" r="14" fill="#22d3ee" opacity="0.8" />
            <circle cx="176" cy="82" r="18" fill="#f59e0b" opacity="0.8" />
            <path
              d="M120 24c-12 0-20 8-20 16 0 8 8 14 20 14s20-6 20-14c0-8-8-16-20-16z"
              fill="#f97316"
              opacity="0.85"
            />
          </svg>
        </div>
        <div className="container-base relative z-10 flex flex-col items-center text-center">
          <div className="mb-6 flex items-center gap-3 rounded-full border border-slate-200/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200">
            <BadgeCheck className="h-4 w-4 text-teal-500" />
            Viecom Affiliate Program
          </div>
          <h1 className="text-display text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            Earn up to 30% commission with the Viecom affiliate program
          </h1>
          <p className="text-body mt-6 max-w-2xl text-sm sm:text-base">
            Unlock recurring revenue by promoting Viecom’s AI image and video generator. Earn
            commission on every first purchase, renewal, or upgrade generated through your unique
            affiliate links.
          </p>
          <Button
            asChild
            className="btn-primary mt-12 rounded-full px-10 py-5 text-base font-semibold"
          >
            <Link href="/affiliate/signup">Sign Up Now</Link>
          </Button>
        </div>
      </section>

      <section className="section-base border-b-0 bg-alt">
        <div className="container-base text-center">
          <h2 className="h2-section text-center">Why partner with Viecom?</h2>
          <div className="mt-10 mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
            {WHY_PARTNER.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 p-8 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 120 120"
                    className="absolute -right-6 -top-6 h-24 w-24 opacity-40"
                  >
                    <circle cx="60" cy="60" r="48" fill="#14b8a6" opacity="0.2" />
                    <circle cx="70" cy="50" r="28" fill="#38bdf8" opacity="0.2" />
                  </svg>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
          <Button
            asChild
            className="btn-primary mt-12 rounded-full px-10 py-5 text-base font-semibold"
          >
            <Link href="/affiliate/signup">Join Now</Link>
          </Button>
        </div>
      </section>

      <section className="section-base border-b-0 bg-main">
        <div className="container-base text-center">
          <h2 className="h2-section text-center">How our affiliate program works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.title}
                className="relative mx-auto w-full max-w-[220px] rounded-2xl border border-slate-200 bg-white/90 p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70"
              >
                {step.illustration('mb-4 h-14 w-full opacity-80')}
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {step.title}
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <Button
            asChild
            className="btn-primary mt-12 rounded-full px-10 py-5 text-base font-semibold"
          >
            <Link href="/affiliate/signup">Join Now</Link>
          </Button>
        </div>
      </section>

      <section className="section-base border-b-0 bg-alt">
        <div className="container-base">
          <h2 className="h2-section text-center">Dos and Don’ts for promoting Viecom</h2>
          <div className="mt-10 mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
            <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70">
              <div className="mb-6 flex items-center gap-2 text-lg font-semibold text-teal-600 dark:text-teal-400">
                <Check className="h-5 w-5" /> Dos
              </div>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {DOS.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-teal-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70">
              <div className="mb-6 flex items-center gap-2 text-lg font-semibold text-orange-500 dark:text-orange-400">
                <Shield className="h-5 w-5" /> Don’ts
              </div>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {DONTS.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-orange-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section-base border-b-0 bg-main">
        <div className="container-base">
          <h2 className="h2-section text-center">FAQs</h2>
          <div className="mt-8 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70"
              >
                <summary className="cursor-pointer text-lg font-semibold text-slate-900 dark:text-white">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
