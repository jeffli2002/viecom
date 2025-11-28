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
import { DollarSign, Download, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface CreditPackStats {
  summary: {
    totalRevenue: number;
    revenueInRange: number;
    transactionCount: number;
    averageTransaction: number;
  };
  trend: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
  purchases: Array<{
    id: string;
    userEmail: string;
    credits: number;
    amount: number;
    currency: string;
    provider: string;
    createdAt: Date;
  }>;
}

export default function AdminCreditPacksPage() {
  const [data, setData] = useState<CreditPackStats | null>(null);
  const [range, setRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/credit-packs?range=${range}&_t=${timestamp}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Failed to fetch credit pack stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const downloadCSV = (filename: string, rows: Array<Record<string, unknown>>) => {
    if (!rows || rows.length === 0) return;
    const header = Object.keys(rows[0]);
    const csv = [header.join(',')]
      .concat(rows.map((row) => header.map((key) => JSON.stringify(row[key] ?? '')).join(',')))
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Credit Pack Purchases</h1>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">
                  $
                  {data.summary.totalRevenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue in {range}</p>
                <p className="text-2xl font-bold">
                  $
                  {data.summary.revenueInRange.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-2xl font-bold">{data.summary.transactionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Transaction</p>
                <p className="text-2xl font-bold">${data.summary.averageTransaction.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {data.trend.map((entry) => (
                  <tr key={entry.date} className="border-b">
                    <td className="py-3 px-4 text-sm">{entry.date}</td>
                    <td className="py-3 px-4 text-sm">${entry.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm">{entry.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Purchases</CardTitle>
          <Button
            onClick={() =>
              downloadCSV(
                'credit-pack-purchases.csv',
                data.purchases as Array<Record<string, unknown>>
              )
            }
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">User Email</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">Provider</th>
                </tr>
              </thead>
              <tbody>
                {data.purchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b">
                    <td className="py-3 px-4 text-sm">
                      {new Date(purchase.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm">{purchase.userEmail}</td>
                    <td className="py-3 px-4 text-sm">{purchase.credits.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm">${purchase.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm">{purchase.currency}</td>
                    <td className="py-3 px-4 text-sm uppercase">{purchase.provider}</td>
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
