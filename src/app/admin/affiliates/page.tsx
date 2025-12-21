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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type AffiliateStatus = 'pending' | 'active' | 'suspended' | 'banned';

type AdminAffiliateRow = {
  id: string;
  userId: string;
  code: string;
  status: AffiliateStatus;
  userEmail: string | null;
  clicks: number;
  pendingCommissionCents: number;
  totalCommissionCents: number;
  balanceCents: number;
  createdAt: string;
  updatedAt: string;
};

function formatMoney(cents: number, currency = 'USD') {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function AdminAffiliatesPage() {
  const [rows, setRows] = useState<AdminAffiliateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<AffiliateStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const handleStatusChange = (value: string) => {
    const allowed: Array<AffiliateStatus | 'all'> = [
      'all',
      'pending',
      'active',
      'suspended',
      'banned',
    ];
    const next = value as AffiliateStatus | 'all';
    setStatus(allowed.includes(next) ? next : 'all');
  };

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status !== 'all') qs.set('status', status);
      if (query.trim()) qs.set('q', query.trim());
      qs.set('_t', String(Date.now()));

      const res = await fetch(`/api/admin/affiliate/affiliates?${qs.toString()}`, {
        cache: 'no-store',
      });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load affiliates');
      }
      setRows(payload.data || []);
    } catch (error) {
      console.error('Failed to fetch affiliates:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load affiliates');
    } finally {
      setIsLoading(false);
    }
  }, [status, query]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const updateStatus = useCallback(
    async (affiliateId: string, nextStatus: AffiliateStatus) => {
      setActingId(affiliateId);
      try {
        const res = await fetch(`/api/admin/affiliate/affiliates/${affiliateId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
        const payload = await res.json().catch(() => ({}));
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        if (!res.ok || !payload.success) {
          throw new Error(payload.error || 'Update failed');
        }
        toast.success('Updated');
        await fetchRows();
      } catch (error) {
        console.error('Affiliate update failed:', error);
        toast.error(error instanceof Error ? error.message : 'Update failed');
      } finally {
        setActingId(null);
      }
    },
    [fetchRows]
  );

  const statusBadge = (value: AffiliateStatus) => {
    const variant =
      value === 'active'
        ? 'default'
        : value === 'pending'
          ? 'outline'
          : value === 'suspended'
            ? 'secondary'
            : 'destructive';
    return <Badge variant={variant as never}>{value}</Badge>;
  };

  const filteredRows = useMemo(() => rows, [rows]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Affiliates</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search email / code / user id"
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
          <CardTitle>Affiliate Members</CardTitle>
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
                  <TableHead>User</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Total Commission</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-500 py-10">
                      No affiliates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell className="text-sm">
                        <div>{row.userEmail || '-'}</div>
                        <div className="font-mono text-xs text-slate-600">{row.userId}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.code}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(row.balanceCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.pendingCommissionCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.totalCommissionCents)}
                      </TableCell>
                      <TableCell className="text-right">{row.clicks}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateStatus(row.id, 'active')}
                            disabled={actingId === row.id || row.status === 'active'}
                          >
                            Activate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(row.id, 'suspended')}
                            disabled={actingId === row.id || row.status === 'suspended'}
                          >
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(row.id, 'banned')}
                            disabled={actingId === row.id || row.status === 'banned'}
                          >
                            Ban
                          </Button>
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
