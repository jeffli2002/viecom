// @ts-nocheck
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SubscriptionStats {
  planCounts: {
    free: number;
    pro: number;
    proplus: number;
  };
  statusCounts: {
    active: number;
    canceled: number;
    expired: number;
  };
  recentSubscriptions: Array<{
    id: string;
    userId: string;
    userEmail: string;
    plan: string;
    status: string;
    startDate: Date;
    endDate: Date;
    amount: number;
  }>;
}

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<SubscriptionStats | null>(null);
  const [range, setRange] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Add cache-busting timestamp to prevent stale data
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/admin/subscriptions/stats?range=${range}&_t=${timestamp}`,
        {
          cache: 'no-store',
        }
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const downloadCSV = (filename: string, data: Array<Record<string, unknown>>) => {
    if (!data || !data.length) return;
    const header = Object.keys(data[0]);
    const csv = [header.join(',')]
      .concat(data.map((r) => header.map((h) => JSON.stringify(r[h] ?? '')).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Subscriptions Management
        </h1>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => downloadCSV('subscriptions.csv', data.recentSubscriptions || [])}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Subscriptions
          </Button>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Free Plan Users</p>
                <p className="text-2xl font-bold">{data.planCounts.free}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pro Plan Users</p>
                <p className="text-2xl font-bold">{data.planCounts.pro}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <Users className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pro+ Plan Users</p>
                <p className="text-2xl font-bold">{data.planCounts.proplus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Active Subscriptions</p>
            <p className="text-3xl font-bold text-green-600">{data.statusCounts.active}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Canceled</p>
            <p className="text-3xl font-bold text-amber-600">{data.statusCounts.canceled}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Expired</p>
            <p className="text-3xl font-bold text-slate-600 dark:text-slate-400">
              {data.statusCounts.expired}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="py-3 px-4">User Email</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentSubscriptions || []).map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-slate-50 dark:bg-slate-900">
                    <td className="py-3 px-4 text-sm">{sub.userEmail}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          sub.plan === 'proplus'
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-slate-700 dark:text-slate-300'
                            : sub.plan === 'pro'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          sub.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : sub.status === 'canceled'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(sub.startDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(sub.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">${sub.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
