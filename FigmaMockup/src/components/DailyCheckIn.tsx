import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Calendar, 
  Sparkles, 
  Gift, 
  TrendingUp, 
  CheckCircle2,
  Circle,
  Flame,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DailyCheckInProps {
  onCheckIn?: (credits: number) => void;
}

interface CheckInData {
  lastCheckIn: string | null;
  streak: number;
  totalCredits: number;
  checkInHistory: string[]; // Array of dates in YYYY-MM-DD format
}

export function DailyCheckIn({ onCheckIn }: DailyCheckInProps) {
  const [checkInData, setCheckInData] = useState<CheckInData>({
    lastCheckIn: null,
    streak: 0,
    totalCredits: 40, // Starting credits
    checkInHistory: []
  });
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedCredits, setEarnedCredits] = useState(0);

  // Load check-in data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dailyCheckInData');
    if (saved) {
      const data = JSON.parse(saved);
      setCheckInData(data);
      
      // Check if user can check in today
      const today = new Date().toDateString();
      const lastCheckIn = data.lastCheckIn ? new Date(data.lastCheckIn).toDateString() : null;
      setCanCheckIn(today !== lastCheckIn);
    }
  }, []);

  // Save check-in data to localStorage
  const saveCheckInData = (data: CheckInData) => {
    setCheckInData(data);
    localStorage.setItem('dailyCheckInData', JSON.stringify(data));
  };

  const handleCheckIn = () => {
    if (!canCheckIn) return;

    const now = new Date();
    const today = now.toDateString();
    const todayISO = now.toISOString().split('T')[0];
    
    let newStreak = 1;
    let credits = 2; // Base daily credits
    
    // Calculate streak
    if (checkInData.lastCheckIn) {
      const lastDate = new Date(checkInData.lastCheckIn);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if last check-in was yesterday (consecutive)
      if (lastDate.toDateString() === yesterday.toDateString()) {
        newStreak = checkInData.streak + 1;
      }
    }
    
    // Check for 7-day bonus
    if (newStreak % 7 === 0) {
      credits += 5; // Bonus for 7 consecutive days
    }
    
    const newData: CheckInData = {
      lastCheckIn: now.toISOString(),
      streak: newStreak,
      totalCredits: checkInData.totalCredits + credits,
      checkInHistory: [...checkInData.checkInHistory, todayISO].slice(-30) // Keep last 30 days
    };
    
    saveCheckInData(newData);
    setCanCheckIn(false);
    setEarnedCredits(credits);
    setShowCelebration(true);
    
    // Call parent callback
    if (onCheckIn) {
      onCheckIn(credits);
    }
    
    // Hide celebration after 3 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  // Get last 7 days for display
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isChecked = checkInData.checkInHistory.includes(dateStr);
      const isToday = i === 0;
      
      days.push({
        date: dateStr,
        dayName,
        isChecked,
        isToday
      });
    }
    
    return days;
  };

  const daysUntilBonus = 7 - (checkInData.streak % 7);
  const progress = ((checkInData.streak % 7) / 7) * 100;

  return (
    <Card className="relative overflow-hidden border-2 border-violet-200 bg-gradient-to-br from-white to-violet-50/30">
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 z-50 bg-gradient-to-br from-violet-600/95 to-fuchsia-600/95 flex items-center justify-center backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.6 }}
              >
                <div className="size-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="size-12 text-white" />
                </div>
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-4xl text-white mb-2">+{earnedCredits} Credits!</h3>
                <p className="text-xl text-violet-100">
                  {earnedCredits > 2 ? '🎉 7-Day Streak Bonus!' : 'Daily check-in complete!'}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-violet-600" />
              Daily Check-In
            </CardTitle>
            <CardDescription>
              Check in daily to earn credits and build your streak
            </CardDescription>
          </div>
          <Badge className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
            <Sparkles className="size-3" />
            {checkInData.totalCredits} Credits
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Streak Info */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Flame className="size-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-slate-600">Current Streak</div>
              <div className="text-2xl text-slate-900">{checkInData.streak} Days</div>
            </div>
          </div>
          {checkInData.streak > 0 && (
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="size-3" />
              Keep it up!
            </Badge>
          )}
        </div>

        {/* 7-Day Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="size-4 text-violet-600" />
              <span className="text-sm text-slate-700">7-Day Bonus Progress</span>
            </div>
            <span className="text-sm text-slate-600">
              {daysUntilBonus === 7 ? '0' : 7 - daysUntilBonus}/7 days
            </span>
          </div>
          <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-slate-600">
            {daysUntilBonus === 7 
              ? 'Start your streak to unlock +5 bonus credits!' 
              : `${daysUntilBonus} more ${daysUntilBonus === 1 ? 'day' : 'days'} to earn +5 bonus credits!`
            }
          </p>
        </div>

        {/* Last 7 Days */}
        <div className="space-y-3">
          <h4 className="text-sm text-slate-700">Last 7 Days</h4>
          <div className="grid grid-cols-7 gap-2">
            {getLast7Days().map((day, index) => (
              <div key={day.date} className="text-center">
                <div className="text-xs text-slate-600 mb-1">{day.dayName}</div>
                <motion.div
                  className={`
                    size-10 rounded-lg mx-auto flex items-center justify-center border-2 transition-colors
                    ${day.isChecked 
                      ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 border-violet-600' 
                      : day.isToday 
                        ? 'border-violet-300 bg-violet-50' 
                        : 'border-slate-200 bg-slate-50'
                    }
                  `}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {day.isChecked ? (
                    <CheckCircle2 className="size-5 text-white" />
                  ) : (
                    <Circle className="size-5 text-slate-300" />
                  )}
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Check-in Button */}
        <Button
          className={`
            w-full gap-2 py-6 relative overflow-hidden
            ${canCheckIn 
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/25' 
              : 'bg-slate-300 cursor-not-allowed'
            }
          `}
          onClick={handleCheckIn}
          disabled={!canCheckIn}
        >
          {canCheckIn ? (
            <>
              <Sparkles className="size-5" />
              Check In Today (+2 Credits)
            </>
          ) : (
            <>
              <CheckCircle2 className="size-5" />
              Checked In Today
            </>
          )}
        </Button>

        {/* Rewards Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="size-6 rounded bg-violet-600 flex items-center justify-center">
                <Sparkles className="size-3 text-white" />
              </div>
              <span className="text-xs text-slate-600">Daily Reward</span>
            </div>
            <p className="text-lg text-slate-900">+2 Credits</p>
          </div>
          <div className="p-3 rounded-lg bg-fuchsia-50 border border-fuchsia-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="size-6 rounded bg-fuchsia-600 flex items-center justify-center">
                <Award className="size-3 text-white" />
              </div>
              <span className="text-xs text-slate-600">7-Day Bonus</span>
            </div>
            <p className="text-lg text-slate-900">+5 Credits</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
