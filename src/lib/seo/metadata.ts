import type { Metadata } from 'next';

const FALLBACK_APP_URL = 'http://localhost:3000';

const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_APP_URL;

let metadataBase: URL;
try {
  metadataBase = new URL(rawAppUrl);
} catch {
  metadataBase = new URL(FALLBACK_APP_URL);
}

export const DEFAULT_SEO_KEYWORDS: string[] = [
  'Viecom',
  'AI ecommerce studio',
  'AI e-commerce content',
  'batch image generation tool',
  'batch AI image generator',
  'batch product photo creation',
  'batch video generation platform',
  'batch AI video generator',
  'ecommerce product batch creator',
  'AI bulk product imagery',
  'automated ecommerce visuals',
  'batch background removal tool',
  'bulk marketing asset generator',
  'AI product photography automation',
  'batch lifestyle image generator',
  'ecommerce video batch production',
  'automated product showcase videos',
  'AI merchandise content generator',
  '批量图像生成工具',
  '批量AI图像生成器',
  '批量商品图片生成',
  '批量视频生成平台',
  '批量AI视频生成',
  '电商商品批量生成',
  'AI批量商品图像',
  '自动化电商视觉',
  '批量背景替换工具',
  '批量营销素材生成',
  'AI商品摄影自动化',
  '批量生活方式图生成',
  '电商视频批量制作',
  '自动化产品展示视频',
  'AI商品内容生成器',
];

export function getMetadataBase(): URL {
  return metadataBase;
}

export function buildCanonicalMetadata(pathname: string): Metadata {
  if (!pathname.startsWith('/')) {
    // Ensure the canonical path is always absolute relative to the domain
    // eslint-disable-next-line no-param-reassign
    pathname = `/${pathname}`;
  }
  return {
    alternates: {
      canonical: pathname,
    },
  };
}

export function buildLocaleCanonicalMetadata(
  locale: string | undefined,
  pathname: string
): Metadata {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const localePrefix = locale ? `/${locale.replace(/^\/+/, '')}` : '';
  const fullPath =
    normalizedPath === '/' ? `${localePrefix || '/'}` : `${localePrefix}${normalizedPath}`;
  return buildCanonicalMetadata(fullPath || '/');
}
