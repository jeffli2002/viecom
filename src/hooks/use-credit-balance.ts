'use client';

import { useAuthStore } from '@/store/auth-store';
import { useCallback, useEffect, useState } from 'react';

export interface CreditBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  frozenBalance: number;
  availableBalance: number;
}

interface UseCreditBalanceOptions {
  fetchOnMount?: boolean;
}

export function useCreditBalance(options?: UseCreditBalanceOptions) {
  const { fetchOnMount = true } = options ?? {};
  const { isAuthenticated } = useAuthStore();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated) {
      setBalance(null);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/credits/balance', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to fetch credit balance');
      }

      const data = (await response.json()) as {
        data?: CreditBalance;
        error?: string;
      };

      if (data?.data) {
        setBalance(data.data);
        setError(null);
      } else {
        throw new Error(data?.error || 'Missing balance payload');
      }
    } catch (err) {
      console.error('Failed to fetch credit balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credit balance');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (fetchOnMount && isAuthenticated) {
      void fetchBalance();
    } else if (!isAuthenticated) {
      setBalance(null);
    }
  }, [fetchOnMount, isAuthenticated, fetchBalance]);

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance,
  };
}
