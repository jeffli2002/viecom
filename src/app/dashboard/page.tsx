'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { Coins, CreditCard, History, Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('Free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch credit balance
      const balanceResponse = await fetch('/api/credits/balance', {
        credentials: 'include',
      });
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setCreditBalance(balanceData.balance || 0);
      }

      // Fetch subscription info
      const billingResponse = await fetch('/api/creem/subscription', {
        credentials: 'include',
      });
      if (billingResponse.ok) {
        const billingData = await billingResponse.json();
        if (billingData.subscription) {
          setSubscriptionPlan(billingData.subscription.plan || 'Free');
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">控制台</h1>
        <p className="text-muted-foreground">欢迎回来，{user?.name || user?.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Credit Balance */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">积分余额</p>
              <p className="text-3xl font-bold">{creditBalance !== null ? creditBalance : '--'}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <Coins className="h-6 w-6 text-primary" />
            </div>
          </div>
          <Link href="/credits/history">
            <Button variant="ghost" className="mt-4 w-full">
              查看历史记录
            </Button>
          </Link>
        </Card>

        {/* Subscription Plan */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">订阅计划</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{subscriptionPlan}</p>
                <Badge variant={subscriptionPlan === 'Free' ? 'secondary' : 'default'}>
                  {subscriptionPlan === 'Free' ? '免费' : '付费'}
                </Badge>
              </div>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
          </div>
          <Link href="/settings/billing">
            <Button variant="ghost" className="mt-4 w-full">
              管理订阅
            </Button>
          </Link>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">快速操作</p>
              <p className="text-lg font-semibold">开始生成</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/image-generation">
              <Button className="w-full" size="sm">
                生成图片
              </Button>
            </Link>
            <Link href="/batch-image-generation">
              <Button variant="outline" className="w-full" size="sm">
                批量生图
              </Button>
            </Link>
            <Link href="/batch-video-generation">
              <Button variant="outline" className="w-full" size="sm">
                批量生视频
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">最近活动</h2>
          <div className="text-center py-8 text-muted-foreground">
            <History className="mx-auto mb-2 h-8 w-8" />
            <p>暂无最近活动</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
