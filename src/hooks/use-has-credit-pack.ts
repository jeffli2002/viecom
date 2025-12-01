'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect, useState } from 'react';

export function useHasCreditPack(): { hasCreditPack: boolean; loading: boolean } {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [hasCreditPack, setHasCreditPack] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setHasCreditPack(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const checkCreditPack = async () => {
      try {
        const res = await fetch('/api/user/has-credit-pack', { credentials: 'include' });
        if (!res.ok) {
          throw new Error('Failed to check credit pack');
        }
        const data = (await res.json()) as { hasCreditPack: boolean };
        if (!cancelled) {
          setHasCreditPack(data.hasCreditPack || false);
        }
      } catch (e) {
        console.error('Error checking credit pack:', e);
        if (!cancelled) {
          setHasCreditPack(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void checkCreditPack();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading]);

  return { hasCreditPack, loading };
}


