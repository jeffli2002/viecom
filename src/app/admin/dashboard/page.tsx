// @ts-nocheck
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Download,
  Image as ImageIcon,
  ShoppingCart,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DashboardStats {
  kpis: {
    registrations: number;
    subscriptionUsers: number;
    packPurchaseUsers: number;
    totalRevenue: number;
    subscriptionRevenue: number;
    packRevenue: number;
    totalCredits: number;
    imageCredits: number;
    videoCredits: number;
  };
  revenueSummary: {
    subscriptionRevenueInRange: number;
    packRevenueInRange: number;
    totalRevenueInRange: number;
  };
  trends: {
    registrations: Array<{ date: string; count: number }>;
    credits: Array<{ date: string; imageCredits: number; videoCredits: number }>;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [range, setRange] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const timestamp = new Date().getTime();
      let url = `/api/admin/dashboard/stats?range=${range}&_t=${timestamp}`;
      if (range === 'custom' && customStart && customEnd) {
        url += `&start=${customStart}&end=${customEnd}`;
      }
      const response = await fetch(url, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const handleRangeChange = (value: string) => {
    setRange(value);
    if (value !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
    }
  };

  const handleCustomDateApply = () => {
    if (customStart && customEnd) {
      void fetchStats();
    }
  };

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

  if (isLoading || !stats) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <Select value={range} onValueChange={handleRangeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {range === 'custom' && (
            <>
              <div>
                <Label htmlFor="start-date" className="text-xs mb-1 block">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-xs mb-1 block">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <Button onClick={handleCustomDateApply} disabled={!customStart || !customEnd}>
                Apply
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">User Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registrations</p>
                    <p className="text-2xl font-bold">{stats.kpis.registrations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subscription Users</p>
                    <p className="text-2xl font-bold">{stats.kpis.subscriptionUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pack Purchase Users</p>
                    <p className="text-2xl font-bold">{stats.kpis.packPurchaseUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
            Revenue Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.kpis.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subscription Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.kpis.subscriptionRevenue)}
                    </p>
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
                    <p className="text-sm text-gray-500">Pack Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.kpis.packRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
            Credits Consumption Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Overall Credits</p>
                    <p className="text-2xl font-bold">{stats.kpis.totalCredits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Image Consumption</p>
                    <p className="text-2xl font-bold">{stats.kpis.imageCredits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Video className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Video Consumption</p>
                    <p className="text-2xl font-bold">{stats.kpis.videoCredits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Summary ({range})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Subscription Revenue</p>
            <p className="text-2xl font-bold">
              {formatCurrency(stats.revenueSummary.subscriptionRevenueInRange)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Pack Revenue</p>
            <p className="text-2xl font-bold">
              {formatCurrency(stats.revenueSummary.packRevenueInRange)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">
              {formatCurrency(stats.revenueSummary.totalRevenueInRange)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registration Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trends.registrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credits Consumption Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trends.credits}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="imageCredits"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Image Credits"
                  />
                  <Line
                    type="monotone"
                    dataKey="videoCredits"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="Video Credits"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() =>
            downloadCSV('dashboard-stats.csv', [
              {
                registrations: stats.kpis.registrations,
                subscriptionUsers: stats.kpis.subscriptionUsers,
                packPurchaseUsers: stats.kpis.packPurchaseUsers,
                totalRevenue: stats.kpis.totalRevenue,
                subscriptionRevenue: stats.kpis.subscriptionRevenue,
                packRevenue: stats.kpis.packRevenue,
                totalCredits: stats.kpis.totalCredits,
                imageCredits: stats.kpis.imageCredits,
                videoCredits: stats.kpis.videoCredits,
              },
            ])
          }
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Dashboard Data
        </Button>
        <Button
          onClick={() => downloadCSV('registration-trend.csv', stats.trends.registrations)}
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Registration Trend
        </Button>
        <Button
          onClick={() => downloadCSV('credits-trend.csv', stats.trends.credits)}
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Credits Trend
        </Button>
      </div>
    </div>
  );
}
