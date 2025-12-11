'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { creditsConfig } from '@/config/credits.config';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { Copy, Facebook, Info, Linkedin, MessageCircle, Send, Share2, Twitter } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ReferralHistoryItem = {
  id: string;
  referralCode: string;
  referrerId: string;
  referredId: string;
  creditsAwarded: boolean;
  referredUserFirstGenerationCompleted: boolean;
  createdAt: string;
  creditsAwardedAt: string | null;
  referredEmail?: string | null;
  referredName?: string | null;
};

type ReferralStats = {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarnedCredits?: number;
  referrals: ReferralHistoryItem[];
};

type SocialPlatform = {
  id: 'facebook' | 'x' | 'whatsapp' | 'linkedin' | 'telegram';
  label: string;
  icon: typeof Facebook;
  className: string;
  buildUrl: (payload: { message: string; url: string }) => string;
};

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    className: 'bg-[#1877F2]/10 text-[#1877F2]',
    buildUrl: ({ message, url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`,
  },
  {
    id: 'x',
    label: 'X',
    icon: Twitter,
    className: 'bg-slate-200 text-slate-900 dark:bg-slate-800/80 dark:text-white',
    buildUrl: ({ message, url }) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${message}\n\n${url}`)}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    className: 'bg-[#25D366]/10 text-[#25D366]',
    buildUrl: ({ message, url }) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${message}\n\n${url}`)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    className: 'bg-[#0A66C2]/10 text-[#0A66C2]',
    buildUrl: ({ message, url }) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(message)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: Send,
    className: 'bg-[#239FD3]/10 text-[#239FD3]',
    buildUrl: ({ message, url }) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`,
  },
];

const rewardsPerReferral = creditsConfig.rewards.referral.creditsPerReferral;

const ReferralSkeleton = () => (
  <div className="space-y-6">
    <Card className="bg-slate-900/80 border-slate-800 text-white">
      <CardHeader>
        <Skeleton className="h-6 w-48 bg-slate-800" />
        <Skeleton className="h-4 w-64 bg-slate-800 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-12 w-full bg-slate-800" />
        <Skeleton className="h-32 w-full bg-slate-800" />
      </CardContent>
    </Card>
    <Card className="bg-slate-900/60 border-slate-800 text-white">
      <CardContent className="grid gap-4 md:grid-cols-3 pt-6">
        {['one', 'two', 'three'].map((id) => (
          <div key={`referral-skeleton-${id}`} className="space-y-2">
            <Skeleton className="h-4 w-32 bg-slate-800" />
            <Skeleton className="h-8 w-24 bg-slate-800" />
          </div>
        ))}
      </CardContent>
    </Card>
    <Card className="bg-slate-900/60 border-slate-800 text-white">
      <CardHeader>
        <Skeleton className="h-5 w-40 bg-slate-800" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-40 w-full bg-slate-800" />
      </CardContent>
    </Card>
  </div>
);

export function ReferralProgram() {
  const { isAuthenticated, isLoading: authLoading, isInitialized } = useAuthStore();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [isMessageEdited, setIsMessageEdited] = useState(false);
  const [appBaseUrl, setAppBaseUrl] = useState('');
  const locale = useLocale();
  const t = useTranslations('referrals');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppBaseUrl(window.location.origin);
    }
  }, []);

  const loginRedirect = useCallback(() => {
    router.push('/login?next=/referrals');
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/rewards/referral', {
        credentials: 'include',
      });

      if (response.status === 401) {
        loginRedirect();
        return;
      }

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load referral data');
      }

      setStats(payload.data);
    } catch (err) {
      console.error('Failed to fetch referral data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [loginRedirect]);

  useEffect(() => {
    if (authLoading || !isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      loginRedirect();
      return;
    }

    void fetchStats();
  }, [authLoading, isInitialized, isAuthenticated, loginRedirect, fetchStats]);

  const referralLink = useMemo(() => {
    if (!stats?.referralCode) {
      return '';
    }
    const base = (appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
    if (!base) {
      return '';
    }
    return `${base}/invitation-landing?invite_code=${stats.referralCode}`;
  }, [stats?.referralCode, appBaseUrl]);

  const defaultMessage = useMemo(() => {
    if (!referralLink) {
      return t('defaultMessageNoLink', { credits: rewardsPerReferral });
    }
    return t('defaultMessage', { credits: rewardsPerReferral, link: referralLink });
  }, [referralLink, t]);

  useEffect(() => {
    if (!isMessageEdited) {
      setShareMessage(defaultMessage);
    }
  }, [defaultMessage, isMessageEdited]);

  const ensureLinkInMessage = useCallback(
    (message: string) => {
      if (!referralLink) {
        return message;
      }
      return message.includes(referralLink) ? message : `${message.trim()}\n\n${referralLink}`;
    },
    [referralLink]
  );

  const handleCopy = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error(t('copyFailed'));
    }
  };

  const formattedNumber = useMemo(() => new Intl.NumberFormat(locale || 'en-US'), [locale]);

  const statsCards = [
    {
      label: t('totalEarnedCredits'),
      value:
        stats?.totalEarnedCredits ?? (stats ? stats.successfulReferrals * rewardsPerReferral : 0),
    },
    {
      label: t('referredFreeUsers'),
      value: stats ? stats.pendingReferrals : 0,
    },
    {
      label: t('referredPaidUsers'),
      value: stats ? stats.successfulReferrals : 0,
    },
  ];

  const getReferralTypeLabel = (item: ReferralHistoryItem) => {
    if (item.creditsAwarded) {
      return t('typePaid');
    }
    if (item.referredUserFirstGenerationCompleted) {
      return t('typeActive');
    }
    return t('typePending');
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ReferralSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Alert variant="destructive">
          <AlertTitle>{t('errorTitle')}</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <span>{error}</span>
            <div>
              <Button onClick={() => void fetchStats()}>{t('retry')}</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <section className="w-full bg-[#f2f4ff] dark:bg-slate-950 transition-colors">
      <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">
        <Card className="bg-white text-slate-900 dark:bg-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-2xl">{t('title')}</CardTitle>
              <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/20">
                +{rewardsPerReferral} {t('creditsPerPaid')}
              </Badge>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              {t('description')}
              <Link
                href="/docs#referral-program"
                className="ml-2 text-pink-300 hover:text-pink-200 underline decoration-dotted"
              >
                {t('guidelines')}
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-600 dark:text-slate-300"
                htmlFor="referral-link"
              >
                {t('linkLabel')}
              </label>
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  id="referral-link"
                  readOnly
                  value={referralLink || t('linkPlaceholder')}
                  className="bg-slate-100 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <Button
                  className="md:w-auto w-full bg-pink-500 hover:bg-pink-400 text-white"
                  onClick={() => referralLink && void handleCopy(referralLink, t('linkCopied'))}
                  disabled={!referralLink}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {t('copyLink')}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-100 dark:bg-slate-900/70 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800"
                  onClick={() => {
                    setIsMessageEdited(false);
                    setShareMessage(defaultMessage);
                  }}
                >
                  {t('defaultPreset')}
                </Button>
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('shareVia')}</span>
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-500 focus-visible:ring-offset-slate-950',
                        platform.className
                      )}
                      onClick={() => {
                        if (!referralLink) return;
                        const payload = ensureLinkInMessage(shareMessage);
                        const url = platform.buildUrl({ message: payload, url: referralLink });
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      aria-label={t('sharePlatform', { platform: platform.label })}
                    >
                      <platform.icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('preview')}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-pink-500 dark:text-pink-300 hover:text-pink-400 dark:hover:text-pink-200 hover:bg-transparent"
                    onClick={() => {
                      const message = ensureLinkInMessage(shareMessage);
                      void handleCopy(message, t('messageCopied'));
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {t('copyMessage')}
                  </Button>
                </div>
                <Textarea
                  className="mt-3 h-32 resize-none bg-white dark:bg-transparent border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={shareMessage}
                  onChange={(event) => {
                    setShareMessage(event.target.value);
                    setIsMessageEdited(true);
                  }}
                  placeholder={t('messagePlaceholder')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-900 text-slate-900 dark:text-white">
          <CardHeader>
            <CardTitle className="text-xl">{t('rewardsTitle')}</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              {t('rewardsSubtitle', { credits: rewardsPerReferral })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            {statsCards.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold">
                  {formattedNumber.format(item.value || 0)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-900 text-slate-900 dark:text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t('historyTitle')}</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                {t('historySubtitle')}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              <Info className="mr-2 h-3.5 w-3.5" />
              {t('historyHint')}
            </Badge>
          </CardHeader>
          <CardContent>
            {stats && stats.referrals.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
                {t('historyEmpty')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        {t('historyEmail')}
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        {t('historyType')}
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        {t('historyCredits')}
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        {t('historyTime')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.referrals.map((item) => (
                      <TableRow
                        key={item.id}
                        className="border-slate-200 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      >
                        <TableCell className="font-medium">
                          {item.referredEmail || item.referredName || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              'border-0',
                              item.creditsAwarded
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-300'
                            )}
                          >
                            {getReferralTypeLabel(item)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.creditsAwarded ? `+${rewardsPerReferral}` : '0'}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(item.createdAt).toLocaleString(locale || 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
