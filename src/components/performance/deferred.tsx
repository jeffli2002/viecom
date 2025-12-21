'use client';

import { useEffect, useState } from 'react';

type DeferredProps = {
  children: React.ReactNode;
  timeoutMs?: number;
};

export function Deferred({ children, timeoutMs = 1200 }: DeferredProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    const enable = () => setReady(true);

    if (typeof window === 'undefined') return;

    let handle: number | undefined;
    if ('requestIdleCallback' in window) {
      // @ts-expect-error - not in libdom
      handle = window.requestIdleCallback(enable, { timeout: timeoutMs });
    } else {
      handle = window.setTimeout(enable, timeoutMs);
    }

    window.addEventListener('pointerdown', enable, { once: true, passive: true });
    window.addEventListener('scroll', enable, { once: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('scroll', enable);
      if (!handle) return;
      // @ts-expect-error - not in libdom
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [ready, timeoutMs]);

  if (!ready) return null;
  return <>{children}</>;
}
