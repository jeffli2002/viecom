'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';

export function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!analyticsEnabled || shouldLoad) return;

    const enable = () => setShouldLoad(true);
    const scheduleIdle = () => {
      if (typeof window === 'undefined') return;
      if ('requestIdleCallback' in window) {
        // @ts-expect-error - not in libdom
        return window.requestIdleCallback(() => setShouldLoad(true), { timeout: 3500 });
      }
      return window.setTimeout(() => setShouldLoad(true), 3500);
    };

    const idleHandle = scheduleIdle();
    window.addEventListener('pointerdown', enable, { once: true, passive: true });
    window.addEventListener('scroll', enable, { once: true, passive: true });

    return () => {
      if (!idleHandle) return;
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('scroll', enable);
      // @ts-expect-error - not in libdom
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle);
      else window.clearTimeout(idleHandle);
    };
  }, [shouldLoad]);

  if (!analyticsEnabled || !shouldLoad) {
    return null;
  }

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-6NFEHPLFFL"
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-6NFEHPLFFL');
        `}
      </Script>
    </>
  );
}
