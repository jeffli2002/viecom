import type { LucideIcon } from 'lucide-react';
import { Facebook, Instagram, Music2, Twitter, Youtube } from 'lucide-react';

export type SharePlatformId = 'x' | 'facebook' | 'youtube' | 'instagram' | 'tiktok';

export interface SharePlatform {
  id: SharePlatformId;
  label: string;
  icon: LucideIcon;
  platformValue: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'pinterest' | 'tiktok' | 'other';
  buildUrl?: (encodedUrl: string) => string;
  openUrl?: string;
  requiresCopy?: boolean;
}

export const buildSharePlatforms = (
  labels: Record<SharePlatformId, string>,
  defaultShareText: string
): SharePlatform[] => [
  {
    id: 'x',
    label: labels.x,
    icon: Twitter,
    platformValue: 'twitter',
    buildUrl: (encodedUrl) =>
      `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(defaultShareText)}`,
  },
  {
    id: 'facebook',
    label: labels.facebook,
    icon: Facebook,
    platformValue: 'facebook',
    buildUrl: (encodedUrl) => `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  },
  {
    id: 'youtube',
    label: labels.youtube,
    icon: Youtube,
    platformValue: 'other',
    openUrl: 'https://studio.youtube.com/',
    requiresCopy: true,
  },
  {
    id: 'instagram',
    label: labels.instagram,
    icon: Instagram,
    platformValue: 'instagram',
    openUrl: 'https://www.instagram.com/',
    requiresCopy: true,
  },
  {
    id: 'tiktok',
    label: labels.tiktok,
    icon: Music2,
    platformValue: 'tiktok',
    openUrl: 'https://www.tiktok.com/upload?lang=en',
    requiresCopy: true,
  },
];
