'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-6NFEHPLFFL';
const sampleRateEnv = Number.parseFloat(process.env.NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE || '0.25');
const sampleRate = Number.isFinite(sampleRateEnv) && sampleRateEnv > 0 && sampleRateEnv <= 1 ? sampleRateEnv : 1;

export function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!analyticsEnabled || shouldLoad) return;
    if (!measurementId) return;

    const sampledIn = Math.random() < sampleRate;
    if (!sampledIn) return;

    const enable = () => setShouldLoad(true);
    const schedule = () => {
      if (typeof window === 'undefined') return;
      if ('requestIdleCallback' in window) {
        // @ts-expect-error - requestIdleCallback not in libdom
        return window.requestIdleCallback(() => setShouldLoad(true), { timeout: 2000 });
      }
      return window.setTimeout(() => setShouldLoad(true), 1500);
    };

    const handle = schedule();
    window.addEventListener('pointerdown', enable, { once: true, passive: true });
    window.addEventListener('scroll', enable, { once: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('scroll', enable);
      if (!handle) return;
      // @ts-expect-error - cancelIdleCallback not in libdom
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [shouldLoad]);

  if (!analyticsEnabled || !measurementId || !shouldLoad) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
