'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { creditsConfig } from '@/config/credits.config';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Calendar, Flame, Gift, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CheckinStatus {
  checkedInToday: boolean;
  consecutiveDays: number;
  todayCheckin: {
    checkinDate: string;
    consecutiveDays: number;
    creditsEarned: number;
    weeklyBonusEarned: boolean;
  } | null;
  lastCheckin: {
    checkinDate: string;
    consecutiveDays: number;
    creditsEarned: number;
    weeklyBonusEarned: boolean;
  } | null;
  recentCheckins?: {
    checkinDate: string;
    consecutiveDays: number;
    creditsEarned: number;
    weeklyBonusEarned: boolean;
  }[];
}

interface CreditBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  frozenBalance: number;
  availableBalance: number;
}

export function CheckinDropdown() {
  const t = useTranslations('nav');
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [_isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const dailyCredits = creditsConfig.rewards.checkin.dailyCredits;
  const weeklyBonusCredits = creditsConfig.rewards.checkin.weeklyBonusCredits;
  const consecutiveDaysRequired = creditsConfig.rewards.checkin.consecutiveDaysRequired;

  useEffect(() => {
    if (isOpen) {
      fetchCheckinStatus();
      fetchCreditBalance();
    }
  }, [isOpen]);

  const fetchCheckinStatus = async () => {
    try {
      const response = await fetch('/api/rewards/checkin', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Checkin status fetched:', {
          checkedInToday: data.data?.checkedInToday,
          consecutiveDays: data.data?.consecutiveDays,
          todayCheckin: data.data?.todayCheckin,
          localDate: new Date().toISOString().split('T')[0],
          localTime: new Date().toLocaleString(),
        });
        if (data.success) {
          setCheckinStatus(data.data);
        }
      } else {
        // Silently handle 401 (unauthorized) - user might not be logged in
        if (response.status !== 401) {
          console.error('Failed to fetch checkin status:', response.status);
        }
      }
    } catch (error) {
      // Only log unexpected errors, not network errors that might be temporary
      if (error instanceof Error && error.name !== 'TypeError') {
        console.error('Failed to fetch checkin status:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreditBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        console.log('💰 Credit balance fetched:', {
          balance: data.data?.balance,
          availableBalance: data.data?.availableBalance,
          totalEarned: data.data?.totalEarned,
        });
        if (data.success) {
          setCreditBalance(data.data);
        }
      } else {
        console.error('Failed to fetch credit balance:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    }
  };

  const handleCheckin = async () => {
    console.log('🎯 handleCheckin called:', {
      isAuthenticated,
      isCheckingIn,
      checkedInToday: checkinStatus?.checkedInToday,
      todayCheckin: checkinStatus?.todayCheckin,
    });

    // Check if user is authenticated first
    if (!isAuthenticated) {
      console.log('❌ User not authenticated');
      toast.error('Please login to check in', {
        description: 'You need to login to earn daily rewards',
        action: {
          label: 'Login',
          onClick: () => {
            setIsOpen(false);
            router.push('/login');
          },
        },
      });
      return;
    }

    // Show message if already checked in
    if (checkinStatus?.checkedInToday) {
      console.log(
        '⚠️ Already checked in today. Credits earned:',
        checkinStatus.todayCheckin?.creditsEarned
      );
      toast.info('Already checked in today!', {
        description: `You earned ${checkinStatus.todayCheckin?.creditsEarned || 0} credits. Come back tomorrow!`,
      });
      return;
    }

    if (isCheckingIn) {
      console.log('⏳ Already checking in, please wait...');
      return;
    }

    console.log('🚀 Starting checkin process...');
    setIsCheckingIn(true);
    try {
      const response = await fetch('/api/rewards/checkin', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      console.log('📥 Checkin API response:', {
        status: response.status,
        success: data.success,
        data: data.data,
        error: data.error,
      });

      if (response.ok && data.success) {
        console.log('✅ Checkin successful! Refreshing data...');

        // Show success message
        const creditsEarned = data.data?.creditsEarned || dailyCredits;
        const bonusMessage = data.data?.weeklyBonusEarned
          ? ` + ${weeklyBonusCredits} bonus credits!`
          : '';
        const message = `Check-in successful! You earned ${creditsEarned} credits${bonusMessage}`;
        toast.success(message, {
          description: `Your streak: ${data.data?.consecutiveDays || 1} days`,
          duration: 5000,
        });

        // Refresh status and balance
        console.log('🔄 Refreshing checkin status and credit balance...');
        await Promise.all([fetchCheckinStatus(), fetchCreditBalance()]);
        console.log('✅ Data refreshed!');
      } else {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          toast.error('Please login to check in', {
            description: 'You need to login to earn daily rewards',
            action: {
              label: 'Login',
              onClick: () => {
                setIsOpen(false);
                router.push('/login');
              },
            },
          });
        } else {
          toast.error(data.error || 'Failed to check in', {
            description: 'Please try again later',
          });
        }
      }
    } catch (error) {
      console.error('Failed to check in:', error);
      toast.error('Failed to check in', {
        description: 'Please try again later',
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleDateClick = (day: { date: string; isToday: boolean; isCheckedIn: boolean }) => {
    console.log('handleDateClick called:', {
      day,
      isToday: day.isToday,
      isCheckedIn: day.isCheckedIn,
      isCheckingIn,
      isAuthenticated,
      checkinStatus,
    });

    // Only allow clicking today's date if not already checked in
    if (day.isToday && !day.isCheckedIn && !isCheckingIn) {
      handleCheckin();
    }
  };

  const consecutiveDays = checkinStatus?.consecutiveDays || 0;
  const progressDays = Math.min(consecutiveDays, consecutiveDaysRequired);
  const progressPercentage = (progressDays / consecutiveDaysRequired) * 100;

  // Generate last 7 days calendar
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      const isToday = i === 0;

      // Check if this day is checked in
      let isCheckedIn = false;
      if (isToday && checkinStatus?.checkedInToday) {
        // If it's today and checkedInToday is true, mark as checked
        isCheckedIn = true;
      } else if (checkinStatus?.todayCheckin?.checkinDate === dateStr) {
        // Also check todayCheckin data
        isCheckedIn = true;
      } else if (checkinStatus?.recentCheckins?.some((c) => c.checkinDate === dateStr)) {
        // Check in recent checkins
        isCheckedIn = true;
      }

      days.push({
        dayName,
        date: dateStr,
        isToday,
        isCheckedIn,
      });
    }

    return days;
  }, [
    checkinStatus?.checkedInToday,
    checkinStatus?.todayCheckin?.checkinDate,
    checkinStatus?.recentCheckins,
  ]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Calendar className="h-4 w-4 mr-2" />
          {t('checkin')}
          {checkinStatus?.checkedInToday && (
            <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[420px] p-0 max-h-[90vh] overflow-y-auto" align="end">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-5 w-5 text-teal-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daily Check-In</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check in daily to earn credits
              </p>
            </div>
            {creditBalance && (
              <Badge className="bg-gradient-to-r from-teal-500 to-blue-500 text-white border-0 px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                {creditBalance.balance}
              </Badge>
            )}
          </div>

          {/* Current Streak */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Current Streak</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {consecutiveDays} Days
              </p>
            </div>
          </div>

          {/* 7-Day Bonus Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5 text-teal-500" />
                <span className="text-xs font-medium text-slate-900 dark:text-white">
                  7-Day Bonus
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {progressDays}/{consecutiveDaysRequired} days
              </span>
            </div>
            <Progress value={progressPercentage} className="h-1.5 mb-1" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {progressDays >= consecutiveDaysRequired
                ? '🎉 Bonus unlocked!'
                : `Unlock +${weeklyBonusCredits} bonus credits`}
            </p>
          </div>

          {/* Last 7 Days Calendar */}
          <div>
            <p className="text-xs font-medium text-slate-900 dark:text-white mb-2">Last 7 Days</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Click today's date to check in
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {last7Days.map((day) => {
                const isClickable = day.isToday && !day.isCheckedIn && !isCheckingIn;
                return (
                  <div key={day.date} className="flex flex-col items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      {day.dayName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDateClick(day)}
                      disabled={!isClickable}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs transition-all ${
                        day.isCheckedIn
                          ? 'bg-teal-500 border-teal-500 text-white cursor-default'
                          : day.isToday
                            ? isClickable
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 hover:scale-110 cursor-pointer'
                              : 'border-teal-500 cursor-default'
                            : 'border-slate-200 dark:border-slate-700 cursor-default'
                      }`}
                      title={
                        day.isToday
                          ? day.isCheckedIn
                            ? 'Already checked in today'
                            : `Click to check in (+${dailyCredits} credits)`
                          : ''
                      }
                    >
                      {day.isCheckedIn ? '✓' : day.isToday && isCheckingIn ? '...' : ''}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reward Summary */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-2 border border-teal-100 dark:border-teal-800">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="h-3 w-3 text-teal-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Daily
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">+{dailyCredits}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-1 mb-1">
                <Gift className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  7-Day
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                +{weeklyBonusCredits}
              </p>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
