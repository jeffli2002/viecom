'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuthStore } from '@/store/auth-store';
import { Copy, Info } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type AffiliateRecord = {
  id: string;
  userId: string;
  code: string;
  status: 'pending' | 'active' | 'suspended' | 'banned';
  createdAt: string;
  updatedAt: string;
};

type AffiliateProgram = {
  enabled: boolean;
  attributionWindowDays: number;
  settlementDelayDays: number;
  negativeBalanceLimitCents: number;
  defaultCommissionBps: number;
};

type AffiliateOverview = {
  clicks: number;
  commissionTotalCents: number;
  pendingCommissionCents: number;
  availableBalanceCents: number;
  recentCommissions: Array<{
    id: string;
    sourceType: string;
    sourceId: string | null;
    currency: string;
    baseAmountCents: number;
    commissionAmountCents: number;
    status: string;
    createdAt: string;
  }>;
};

type MePayload =
  | {
      success: true;
      data: {
        program: AffiliateProgram;
        affiliate: AffiliateRecord | null;
        overview?: AffiliateOverview | null;
      };
    }
  | { success: false; error: string };

function formatMoney(cents: number, currency: string) {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function AffiliateDashboard() {
  const { isAuthenticated, isLoading: authLoading, isInitialized } = useAuthStore();
  const [data, setData] = useState<MePayload['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();
  const router = useRouter();

  const loginRedirect = useCallback(() => {
    router.push(`/login?next=/${locale}/affiliate/dashboard`);
  }, [router, locale]);

  const fetchMe = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/affiliate/me', { credentials: 'include' });
      if (res.status === 401) {
        loginRedirect();
        return;
      }
      const payload = (await res.json()) as MePayload;
      if (!res.ok || !payload.success) {
        throw new Error('error' in payload ? payload.error : 'Failed to load affiliate data');
      }
      setData(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [loginRedirect]);

  useEffect(() => {
    if (authLoading || !isInitialized) return;
    if (!isAuthenticated) {
      loginRedirect();
      return;
    }
    void fetchMe();
  }, [authLoading, isInitialized, isAuthenticated, loginRedirect, fetchMe]);

  const shareLink = useMemo(() => {
    if (!data?.affiliate?.code) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (!origin) return '';
    return `${origin}/${locale}?ref=${encodeURIComponent(data.affiliate.code)}`;
  }, [data?.affiliate?.code, locale]);

  const handleCopy = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied');
    } catch {
      toast.error('Copy failed');
    }
  }, []);

  const join = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/join', {
        method: 'POST',
        credentials: 'include',
      });
      const payload = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to join affiliate program');
      }
      await fetchMe();
      toast.success('Affiliate account created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  }, [fetchMe]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-900/60 border-slate-800 text-white">
          <CardHeader>
            <Skeleton className="h-6 w-56 bg-slate-800" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full bg-slate-800" />
            <Skeleton className="h-24 w-full bg-slate-800" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Failed to load'}</AlertDescription>
      </Alert>
    );
  }

  const program = data.program;
  const affiliate = data.affiliate;
  const overview = data.overview;

  if (!program.enabled) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Affiliate program disabled</AlertTitle>
        <AlertDescription>Please check back later.</AlertDescription>
      </Alert>
    );
  }

  if (!affiliate) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 text-white">
        <CardHeader>
          <CardTitle>Affiliate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">
            Create your affiliate account to start sharing referral links and earning commissions.
          </p>
          <Button onClick={join}>Join Affiliate Program</Button>
        </CardContent>
      </Card>
    );
  }

  const commissionRate = `${(program.defaultCommissionBps / 100).toFixed(2)}%`;
  const currency = overview?.recentCommissions?.[0]?.currency || 'USD';

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/60 border-slate-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Affiliate Dashboard</CardTitle>
          <Badge variant="secondary">{affiliate.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Clicks</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-white">
                {overview?.clicks ?? 0}
              </CardContent>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Total Commission</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-white">
                {formatMoney(overview?.commissionTotalCents ?? 0, currency)}
              </CardContent>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Pending</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-white">
                {formatMoney(overview?.pendingCommissionCents ?? 0, currency)}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Available Balance</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-white">
                {formatMoney(overview?.availableBalanceCents ?? 0, currency)}
              </CardContent>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Settlement Delay</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-white">
                {program.settlementDelayDays} days
              </CardContent>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Negative Limit</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-white">
                {formatMoney(-program.negativeBalanceLimitCents, currency)}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-slate-300">Affiliate code</div>
            <div className="flex gap-2">
              <Input value={affiliate.code} readOnly className="bg-slate-950 border-slate-800" />
              <Button variant="secondary" onClick={() => handleCopy(affiliate.code)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-slate-300">
              Share link{' '}
              <span className="text-slate-500">
                (Last click, {program.attributionWindowDays} days)
              </span>
            </div>
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="bg-slate-950 border-slate-800" />
              <Button
                variant="secondary"
                onClick={() => handleCopy(shareLink)}
                disabled={!shareLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-slate-400">Default commission rate: {commissionRate}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/60 border-slate-800 text-white">
        <CardHeader>
          <CardTitle>Recent commissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(overview?.recentCommissions ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-slate-400">
                    No commissions yet.
                  </TableCell>
                </TableRow>
              ) : (
                (overview?.recentCommissions ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">
                      {row.sourceType}
                      {row.sourceId ? `:${row.sourceId}` : ''}
                    </TableCell>
                    <TableCell>{formatMoney(row.baseAmountCents, row.currency)}</TableCell>
                    <TableCell>{formatMoney(row.commissionAmountCents, row.currency)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
