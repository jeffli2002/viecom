'use client';

import Script from 'next/script';

export function GoogleAnalytics() {
  if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'true') {
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
