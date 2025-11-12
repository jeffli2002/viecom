'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Download, Image as ImageIcon, Video } from 'lucide-react';

interface CreditsSummary {
  summary: {
    totalConsumed: number;
    imageCredits: number;
    videoCredits: number;
  };
  top10Users: Array<{
    id: string;
    email: string;
    name: string;
    total_consumed: number;
    image_credits: number;
    video_credits: number;
    remaining: number;
  }>;
  trend: Array<{
    date: string;
    imageCredits: number;
    videoCredits: number;
  }>;
}

export default function AdminCreditsPage() {
  const [data, setData] = useState<CreditsSummary | null>(null);
  const [range, setRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [range]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/credits/summary?range=${range}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Failed to fetch credits data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = (filename: string, dataArray: any[]) => {
    if (!dataArray || !dataArray.length) return;
    const header = Object.keys(dataArray[0]);
    const csv = [header.join(',')]
      .concat(dataArray.map((r) => header.map((h) => JSON.stringify(r[h] ?? '')).join(',')))
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
        <h1 className="text-3xl font-bold text-gray-900">Credits Management</h1>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ImageIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Credits Consumed</p>
                <p className="text-2xl font-bold">{data.summary.totalConsumed.toLocaleString()}</p>
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
                <p className="text-sm text-gray-500">Image Credits</p>
                <p className="text-2xl font-bold">{data.summary.imageCredits.toLocaleString()}</p>
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
                <p className="text-sm text-gray-500">Video Credits</p>
                <p className="text-2xl font-bold">{data.summary.videoCredits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Top 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Users by Credits Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.top10Users.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        {user.name || 'No name'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      Total: {Number(user.total_consumed).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Image {Number(user.image_credits).toLocaleString()} / Video {Number(user.video_credits).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Credits Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Credits Consumption Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="imageCredits" stackId="a" fill="#06b6d4" name="Image Credits" />
                  <Bar dataKey="videoCredits" stackId="a" fill="#ec4899" name="Video Credits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => downloadCSV('credits-summary.csv', [data.summary])}
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Summary
        </Button>
        <Button
          onClick={() => downloadCSV('top-10-users.csv', data.top10Users)}
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Top 10 Users
        </Button>
        <Button
          onClick={() => downloadCSV('credits-trend.csv', data.trend)}
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Trend Data
        </Button>
      </div>
    </div>
  );
}

function downloadCSV(filename: string, data: any[]) {
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
}

