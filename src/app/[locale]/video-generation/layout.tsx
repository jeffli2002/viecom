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
        'Create professional product videos with AI. Text-to-video and image-to-video modes. Sora 2 models, 720p/1080p quality. Free trial with 30 credits.',
      keywords: [
        'ai video generator',
        'text to video',
        'image to video',
        'product video generator',
        'sora 2',
        'sora 2 pro',
        'free ai video',
      ],
    },
    zh: {
      title: 'AI视频生成器 | 文字转视频和图片转视频免费',
      description:
        '用AI创建专业产品视频。文字转视频和图片转视频模式。Sora 2模型，720p/1080p质量。30积分免费试用。',
      keywords: [
        'AI视频生成器',
        '文字转视频',
        '图片转视频',
        '产品视频生成器',
        'sora 2',
        'sora 2 pro',
        '免费AI视频',
      ],
    },
    es: {
      title: 'Generador de Video IA | Texto a Video e Imagen a Video Gratis',
      description:
        'Crea videos de productos profesionales con IA. Modos texto a video e imagen a video. Modelos Sora 2, calidad 720p/1080p. Prueba gratuita con 30 créditos.',
      keywords: [
        'generador video ia',
        'texto a video',
        'imagen a video',
        'generador video producto',
        'sora 2',
      ],
    },
    fr: {
      title: 'Générateur de Vidéo IA | Texte en Vidéo et Image en Vidéo Gratuit',
      description:
        'Créez des vidéos de produits professionnelles avec l\'IA. Modes texte vers vidéo et image vers vidéo. Modèles Sora 2, qualité 720p/1080p. Essai gratuit avec 30 crédits.',
      keywords: [
        'générateur vidéo ia',
        'texte en vidéo',
        'image en vidéo',
        'générateur vidéo produit',
        'sora 2',
      ],
    },
    de: {
      title: 'KI-Videogenerator | Text zu Video & Bild zu Video Kostenlos',
      description:
        'Erstellen Sie professionelle Produktvideos mit KI. Text-zu-Video- und Bild-zu-Video-Modi. Sora 2 Modelle, 720p/1080p Qualität. Kostenlose Testversion mit 30 Credits.',
      keywords: [
        'ki videogenerator',
        'text zu video',
        'bild zu video',
        'produktvideo generator',
        'sora 2',
      ],
    },
    ja: {
      title: 'AI動画生成器 | テキストから動画・画像から動画 無料',
      description:
        'AIでプロフェッショナルな商品動画を作成。テキストから動画、画像から動画モード。Sora 2モデル、720p/1080p品質。30クレジットの無料トライアル。',
      keywords: [
        'ai動画生成器',
        'テキストから動画',
        '画像から動画',
        '商品動画生成器',
        'sora 2',
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
