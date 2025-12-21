// @ts-nocheck
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type PayoutStatus = 'requested' | 'approved' | 'paid' | 'rejected' | 'failed';

type AdminPayoutRow = {
  id: string;
  affiliateId: string;
  affiliateCode: string | null;
  userId: string;
  userEmail: string | null;
  amountCents: number;
  currency: string;
  status: PayoutStatus;
  evidenceUrl: string | null;
  externalReference: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatMoney(cents: number, currency: string) {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

async function uploadEvidence(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('fileName', file.name);
  form.append('contentType', file.type || 'application/octet-stream');

  const res = await fetch('/api/admin/uploads/direct', {
    method: 'POST',
    body: form,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.publicUrl) {
    throw new Error(payload?.error || 'Upload failed');
  }
  return payload.publicUrl as string;
}

export default function AdminAffiliatePayoutsPage() {
  const [rows, setRows] = useState<AdminPayoutRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<PayoutStatus | 'all'>('requested');
  const [query, setQuery] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [evidenceFileById, setEvidenceFileById] = useState<Record<string, File | null>>({});
  const [externalRefById, setExternalRefById] = useState<Record<string, string>>({});

  const handleStatusChange = (value: string) => {
    const allowed: Array<PayoutStatus | 'all'> = [
      'all',
      'requested',
      'approved',
      'paid',
      'rejected',
      'failed',
    ];
    const next = value as PayoutStatus | 'all';
    setStatus(allowed.includes(next) ? next : 'all');
  };

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status !== 'all') qs.set('status', status);
      if (query.trim()) qs.set('q', query.trim());
      qs.set('_t', String(Date.now()));
      const res = await fetch(`/api/admin/affiliate/payouts?${qs.toString()}`, {
        cache: 'no-store',
      });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load payouts');
      }
      setRows(payload.data || []);
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load payouts');
    } finally {
      setIsLoading(false);
    }
  }, [status, query]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const filteredRows = useMemo(() => rows, [rows]);

  const patchPayout = useCallback(
    async (
      payoutId: string,
      body: {
        action: 'approve' | 'reject' | 'mark_paid' | 'mark_failed';
        evidenceUrl?: string;
        externalReference?: string;
      }
    ) => {
      setActingId(payoutId);
      try {
        const res = await fetch(`/api/admin/affiliate/payouts/${payoutId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const payload = await res.json().catch(() => ({}));
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        if (!res.ok || !payload.success) {
          throw new Error(payload.error || 'Action failed');
        }
        toast.success('Updated');
        await fetchRows();
      } catch (error) {
        console.error('Payout action failed:', error);
        toast.error(error instanceof Error ? error.message : 'Action failed');
      } finally {
        setActingId(null);
      }
    },
    [fetchRows]
  );

  const handleMarkPaid = useCallback(
    async (row: AdminPayoutRow) => {
      const file = evidenceFileById[row.id] || null;
      const externalReference = externalRefById[row.id] || '';

      if (!file) {
        toast.error('Please upload a payment evidence file');
        return;
      }
      if (!externalReference.trim()) {
        toast.error('Please provide an external reference (transfer id)');
        return;
      }

      try {
        setActingId(row.id);
        const evidenceUrl = await uploadEvidence(file);
        await patchPayout(row.id, { action: 'mark_paid', evidenceUrl, externalReference });
      } finally {
        setActingId(null);
      }
    },
    [evidenceFileById, externalRefById, patchPayout]
  );

  const statusBadge = (value: PayoutStatus) => {
    const variant =
      value === 'paid'
        ? 'default'
        : value === 'approved'
          ? 'secondary'
          : value === 'requested'
            ? 'outline'
            : 'destructive';
    return <Badge variant={variant as never}>{value}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Affiliate Payouts</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search email / affiliate code / payout id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[320px]"
          />
          <Button variant="outline" onClick={() => fetchRows()} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Requests</CardTitle>
          <div className="text-sm text-slate-500">{filteredRows.length} items</div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-slate-500">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-10">
                      No payouts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell className="font-medium">
                        {formatMoney(row.amountCents, row.currency)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-mono text-xs text-slate-600">{row.userId}</div>
                        <div>{row.userEmail || '-'}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-mono text-xs text-slate-600">{row.affiliateId}</div>
                        <div className="font-mono text-xs">{row.affiliateCode || '-'}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(row.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.paidAt ? new Date(row.paidAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => patchPayout(row.id, { action: 'approve' })}
                            disabled={actingId === row.id || row.status !== 'requested'}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => patchPayout(row.id, { action: 'reject' })}
                            disabled={actingId === row.id || row.status === 'paid'}
                          >
                            Reject
                          </Button>

                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                              <Upload className="h-4 w-4" />
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) =>
                                  setEvidenceFileById((prev) => ({
                                    ...prev,
                                    [row.id]: e.target.files?.[0] || null,
                                  }))
                                }
                              />
                              Evidence
                            </label>
                            <Input
                              placeholder="Transfer id"
                              value={externalRefById[row.id] || ''}
                              onChange={(e) =>
                                setExternalRefById((prev) => ({
                                  ...prev,
                                  [row.id]: e.target.value,
                                }))
                              }
                              className="w-[170px] h-8 text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleMarkPaid(row)}
                              disabled={
                                actingId === row.id ||
                                (row.status !== 'approved' && row.status !== 'requested')
                              }
                            >
                              Mark paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => patchPayout(row.id, { action: 'mark_failed' })}
                              disabled={actingId === row.id || row.status === 'paid'}
                            >
                              Mark failed
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
