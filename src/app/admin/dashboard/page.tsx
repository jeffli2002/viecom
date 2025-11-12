'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Download, Users, DollarSign, Image as ImageIcon, Video, TrendingUp } from 'lucide-react';

interface DashboardStats {
  kpis: {
    todayRegistrations: number;
    registrationsInRange: number;
    activeSubscriptions: number;
    todayRevenue: number;
    todayImageCredits: number;
    todayVideoCredits: number;
  };
  trends: {
    registrations: Array<{ date: string; count: number }>;
    credits: Array<{ date: string; imageCredits: number; videoCredits: number }>;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [range, setRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [range]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/dashboard/stats?range=${range}`);
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
  };

  const downloadCSV = (filename: string, data: any[]) => {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today's Registrations</p>
                <p className="text-2xl font-bold">{stats.kpis.todayRegistrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Past {range}</p>
                <p className="text-2xl font-bold">{stats.kpis.registrationsInRange}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold">{stats.kpis.activeSubscriptions}</p>
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
                <p className="text-sm text-gray-500">Today's Revenue</p>
                <p className="text-2xl font-bold">${stats.kpis.todayRevenue.toFixed(2)}</p>
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
                <p className="text-sm text-gray-500">Today's Image Credits</p>
                <p className="text-2xl font-bold">{stats.kpis.todayImageCredits}</p>
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
                <p className="text-sm text-gray-500">Today's Video Credits</p>
                <p className="text-2xl font-bold">{stats.kpis.todayVideoCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          onClick={() => downloadCSV('dashboard-stats.csv', [
            {
              todayRegistrations: stats.kpis.todayRegistrations,
              registrationsInRange: stats.kpis.registrationsInRange,
              activeSubscriptions: stats.kpis.activeSubscriptions,
              todayRevenue: stats.kpis.todayRevenue,
              todayImageCredits: stats.kpis.todayImageCredits,
              todayVideoCredits: stats.kpis.todayVideoCredits,
            },
          ])}
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

