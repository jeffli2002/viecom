// @ts-nocheck
'use client';

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
import { Download, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  plan: string | null;
  subscriptionStatus: string | null;
  availableBalance: number;
  totalEarned: number;
  totalSpent: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Add cache-busting timestamp to prevent stale data
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/admin/users?search=${search}&range=${range}&limit=100&_t=${timestamp}`,
        {
          cache: 'no-store',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotal(data.total);
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [range, search]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Users Management</h1>
          <p className="text-gray-500 mt-1">Total: {total} users</p>
        </div>
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
          <Button onClick={() => downloadCSV('users.csv', users)} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Users
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Registration Date</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Available Credits</th>
                    <th className="py-3 px-4">Total Earned</th>
                    <th className="py-3 px-4">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-slate-50 dark:bg-slate-900">
                      <td className="py-3 px-4 text-sm">{user.email}</td>
                      <td className="py-3 px-4 text-sm">{user.name || '-'}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.plan === 'proplus'
                              ? 'bg-teal-100 dark:bg-teal-900/30 text-slate-700 dark:text-slate-300'
                              : user.plan === 'pro'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {user.plan || 'Free'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.subscriptionStatus === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {user.subscriptionStatus || 'inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {user.availableBalance?.toLocaleString() || 0}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {user.totalEarned?.toLocaleString() || 0}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {user.totalSpent?.toLocaleString() || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
