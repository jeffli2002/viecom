'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CronExecution {
  id: string;
  jobName: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  status: 'running' | 'completed' | 'failed';
  results: {
    completed?: number;
    failed?: number;
    stillProcessing?: number;
    errors?: number;
    totalFound?: number;
  } | null;
  errorMessage: string | null;
}

interface CronStats {
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  totalTasksRecovered: number;
  totalTasksFailed: number;
}

export default function CronJobsPage() {
  const [executions, setExecutions] = useState<CronExecution[]>([]);
  const [stats, setStats] = useState<CronStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/cron-jobs', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions || []);
        setStats(data.stats || null);
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Failed to fetch cron jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const triggerCronJob = async () => {
    setIsTriggering(true);
    try {
      const response = await fetch('/api/admin/trigger-cron', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Cron job triggered successfully!\n\nResults:\n- Completed: ${data.results?.completed || 0}\n- Failed: ${data.results?.failed || 0}\n- Still Processing: ${data.results?.stillProcessing || 0}\n- Errors: ${data.results?.errors || 0}`);
        await fetchData(); // Refresh data
      } else {
        alert('Failed to trigger cron job');
      }
    } catch (error) {
      console.error('Failed to trigger cron:', error);
      alert('Error triggering cron job');
    } finally {
      setIsTriggering(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'running':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Cron Jobs Monitoring
          </h1>
          <p className="text-gray-500 mt-1">Automated task recovery system</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchData} variant="outline" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={triggerCronJob} disabled={isTriggering}>
            <Play className="mr-2 h-4 w-4" />
            {isTriggering ? 'Triggering...' : 'Trigger Now'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.successRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Avg Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(stats.avgDuration)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Tasks Recovered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                {stats.totalTasksRecovered}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions (Last 50)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="py-3 px-4">Started</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Found</th>
                    <th className="py-3 px-4">Completed</th>
                    <th className="py-3 px-4">Failed</th>
                    <th className="py-3 px-4">Processing</th>
                    <th className="py-3 px-4">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((exec) => (
                    <tr key={exec.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="py-3 px-4 text-sm">
                        {new Date(exec.startedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatDuration(exec.duration)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(exec.status)}>
                          {exec.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        {exec.results?.totalFound || 0}
                      </td>
                      <td className="py-3 px-4 text-sm text-center text-green-600 font-medium">
                        {exec.results?.completed || 0}
                      </td>
                      <td className="py-3 px-4 text-sm text-center text-red-600">
                        {exec.results?.failed || 0}
                      </td>
                      <td className="py-3 px-4 text-sm text-center text-yellow-600">
                        {exec.results?.stillProcessing || 0}
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        {exec.results?.errors || 0}
                      </td>
                    </tr>
                  ))}
                  {executions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">
                        No cron executions yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Cron Jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Schedule:</strong> Runs every 10 minutes automatically via Vercel Cron
          </p>
          <p>
            <strong>Purpose:</strong> Recovers stuck video/image generations that timed out
          </p>
          <p>
            <strong>Process:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Finds tasks stuck in &quot;processing&quot; status (&gt;10 min old)</li>
            <li>Checks KIE.ai for actual completion status</li>
            <li>If completed: Downloads, uploads to R2, charges credits</li>
            <li>If failed: Unfreezes credits (refunds user)</li>
            <li>Prevents frozen credits forever</li>
          </ul>
          <p className="pt-2">
            <strong>Max Recovery Time:</strong> 10 minutes (next cron run)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

