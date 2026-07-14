import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseMetadata = getSEOMetadata(locale, 'tool', '/video-generation');

  // Page-specific overrides
  const pageSpecific: Record<string, Partial<Metadata>> = {
    en: {
      title: 'AI Video Generator | Text to Video & Image to Video Free',
      description:
        'Create professional product videos with Seedance 2.0 Fast. Text-to-video and image-to-video in 480p or 720p.',
      keywords: [
        'ai video generator',
        'text to video',
        'image to video',
        'product video generator',
        'seedance 2.0 fast',
        'free ai video',
      ],
    },
    zh: {
      title: 'AI视频生成器 | 文字转视频和图片转视频免费',
      description:
        '使用 Seedance 2.0 Fast 创建专业产品视频，支持文字转视频、图片转视频以及 480p/720p 输出。',
      keywords: [
        'AI视频生成器',
        '文字转视频',
        '图片转视频',
        '产品视频生成器',
        'seedance 2.0 fast',
        '免费AI视频',
      ],
    },
    es: {
      title: 'Generador de Video IA | Texto a Video e Imagen a Video Gratis',
      description:
        'Crea videos profesionales con Seedance 2.0 Fast, de texto o imagen a video en 480p o 720p.',
      keywords: [
        'generador video ia',
        'texto a video',
        'imagen a video',
        'generador video producto',
        'seedance 2.0 fast',
      ],
    },
    fr: {
      title: 'Générateur de Vidéo IA | Texte en Vidéo et Image en Vidéo Gratuit',
      description:
        'Créez des vidéos professionnelles avec Seedance 2.0 Fast, en 480p ou 720p à partir de texte ou d’images.',
      keywords: [
        'générateur vidéo ia',
        'texte en vidéo',
        'image en vidéo',
        'générateur vidéo produit',
        'seedance 2.0 fast',
      ],
    },
    de: {
      title: 'KI-Videogenerator | Text zu Video & Bild zu Video Kostenlos',
      description:
        'Erstellen Sie professionelle Videos mit Seedance 2.0 Fast aus Text oder Bildern in 480p oder 720p.',
      keywords: [
        'ki videogenerator',
        'text zu video',
        'bild zu video',
        'produktvideo generator',
        'seedance 2.0 fast',
      ],
    },
    ja: {
      title: 'AI動画生成器 | テキストから動画・画像から動画 無料',
      description: 'Seedance 2.0 Fastでテキストや画像から480pまたは720pの商品動画を作成します。',
      keywords: [
        'ai動画生成器',
        'テキストから動画',
        '画像から動画',
        '商品動画生成器',
        'seedance 2.0 fast',
      ],
    },
  };

  const specific = pageSpecific[locale] || pageSpecific.en;
  return {
    ...baseMetadata,
    ...specific,
    openGraph: {
      ...baseMetadata.openGraph,
      ...(specific.openGraph || {}),
    },
  };
}

export default function VideoGenerationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
