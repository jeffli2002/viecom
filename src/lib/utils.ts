import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isWebView(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const standalone = (window.navigator as any).standalone;

  const isIosWebView =
    /iphone|ipod|ipad/.test(userAgent) && !standalone && !/safari/.test(userAgent);

  const isAndroidWebView =
    /android/.test(userAgent) &&
    (/wv|\.0\.0\.0/.test(userAgent) ||
      (/version\/[\d.]+/.test(userAgent) && !/(chrome|crios|crmo)\/[\d]+/.test(userAgent)));

  const isFacebookBrowser = /fban|fbav|fbios|fb_iab|fb4a/i.test(userAgent);
  const isInstagramBrowser = /instagram/i.test(userAgent);
  const isTwitterBrowser = /twitter/i.test(userAgent);
  const isLineBrowser = /line/i.test(userAgent);

  return (
    isIosWebView ||
    isAndroidWebView ||
    isFacebookBrowser ||
    isInstagramBrowser ||
    isTwitterBrowser ||
    isLineBrowser
  );
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod|mobile/i.test(window.navigator.userAgent);
}
