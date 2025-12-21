'use client';

import { useEffect } from 'react';

export function AffiliateTracker() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get('ref')?.trim();
    if (!ref || !/^[A-Za-z0-9_-]{4,32}$/.test(ref)) {
      return;
    }

    const key = `affiliate_click_${ref}_${url.pathname}`;
    try {
      if (sessionStorage.getItem(key)) {
        return;
      }
      sessionStorage.setItem(key, '1');
    } catch {
      // ignore storage errors
    }

    void fetch('/api/affiliate/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ref,
        path: `${url.pathname}${url.search}`,
        referrer: document.referrer || undefined,
      }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  return null;
}
