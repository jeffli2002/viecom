'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { creditsConfig } from '@/config/credits.config';
import { Calendar, Flame, Gift, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
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

interface DailyCheckinProps {
  className?: string;
}

export function DailyCheckin({ className }: DailyCheckinProps) {
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const dailyCredits = creditsConfig.rewards.checkin.dailyCredits;
  const weeklyBonusCredits = creditsConfig.rewards.checkin.weeklyBonusCredits;
  const consecutiveDaysRequired = creditsConfig.rewards.checkin.consecutiveDaysRequired;

  useEffect(() => {
    fetchCheckinStatus();
    fetchCreditBalance();
  }, []);

  const fetchCheckinStatus = async () => {
    try {
      const response = await fetch('/api/rewards/checkin', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCheckinStatus(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch checkin status:', error);
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
        if (data.success) {
          setCreditBalance(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    }
  };

  const handleCheckin = async () => {
    if (isCheckingIn || checkinStatus?.checkedInToday) return;

    setIsCheckingIn(true);
    try {
      const response = await fetch('/api/rewards/checkin', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
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
        await Promise.all([fetchCheckinStatus(), fetchCreditBalance()]);
      } else {
        toast.error(data.error || 'Failed to check in', {
          description: 'Please try again later',
        });
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

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </Card>
    );
  }

  const consecutiveDays = checkinStatus?.consecutiveDays || 0;
  const progressDays = Math.min(consecutiveDays, consecutiveDaysRequired);
  const progressPercentage = (progressDays / consecutiveDaysRequired) * 100;

  // Generate last 7 days calendar
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      const isToday = i === 0;
      // Check if this date was checked in
      const isCheckedIn =
        checkinStatus?.todayCheckin?.checkinDate === dateStr ||
        checkinStatus?.recentCheckins?.some((c) => c.checkinDate === dateStr) ||
        false;

      days.push({
        dayName,
        date: dateStr,
        isToday,
        isCheckedIn,
      });
    }

    return days;
  };

  const last7Days = getLast7Days();

  return (
    <Card className={`border-teal-200 dark:border-teal-800 bg-white p-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-teal-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Check-In</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Check in daily to earn credits and build your streak
          </p>
        </div>
        {creditBalance && (
          <Badge className="bg-gradient-to-r from-teal-500 to-blue-500 text-white border-0 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-1" />
            {creditBalance.balance} Credits
          </Badge>
        )}
      </div>

      {/* Current Streak */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="flex-shrink-0">
          <Flame className="h-12 w-12 text-orange-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Current Streak</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{consecutiveDays} Days</p>
        </div>
      </div>

      {/* 7-Day Bonus Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-teal-500" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">7-Day Bonus Progress</span>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {progressDays}/{consecutiveDaysRequired} days
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2 mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {progressDays >= consecutiveDaysRequired
            ? '🎉 Bonus unlocked! Keep your streak going!'
            : `Start your streak to unlock +${weeklyBonusCredits} bonus credits!`}
        </p>
      </div>

      {/* Last 7 Days Calendar */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">Last 7 Days</p>
        <div className="grid grid-cols-7 gap-2">
          {last7Days.map((day, index) => (
            <div
              key={day.checkinDate ?? `${day.dayName}-${index}`}
              className="flex flex-col items-center"
            >
              <span className="text-xs text-slate-600 dark:text-slate-400 mb-2">{day.dayName}</span>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  day.isCheckedIn
                    ? 'bg-teal-500 border-teal-500 text-white'
                    : day.isToday
                      ? 'border-teal-500 border-2'
                      : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {day.isCheckedIn ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Check In Button */}
      <Button
        onClick={handleCheckin}
        disabled={isCheckingIn || checkinStatus?.checkedInToday || false}
        className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold py-6 text-base mb-4"
      >
        <Sparkles className="h-5 w-5 mr-2" />
        {isCheckingIn
          ? 'Checking In...'
          : checkinStatus?.checkedInToday
            ? 'Already Checked In Today'
            : `Check In Today (+${dailyCredits} Credits)`}
      </Button>

      {/* Reward Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-teal-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Daily Reward</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">+{dailyCredits} Credits</p>
        </div>
        <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-teal-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">7-Day Bonus</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">+{weeklyBonusCredits} Credits</p>
        </div>
      </div>
    </Card>
  );
}
