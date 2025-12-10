import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseMetadata = getSEOMetadata(locale, 'tool', '/image-generation');

  // Page-specific overrides
  const pageSpecific: Record<string, Partial<Metadata>> = {
    en: {
      title: 'AI Image Generator | Text to Image & Image to Image Free',
      description:
        'Generate professional product images with AI. Text-to-image and image-to-image modes. Nano Banana models, multiple styles. Free trial with 15 credits.',
      keywords: [
        'ai image generator',
        'text to image',
        'image to image',
        'product image generator',
        'nano banana',
        'nano banana pro',
        'free ai image',
      ],
    },
    zh: {
      title: 'AI图像生成器 | 文字转图像和图像转图像免费',
      description:
        '用AI生成专业产品图像。文字转图像和图像转图像模式。Nano Banana模型，多种风格。30积分免费试用。',
      keywords: [
        'AI图像生成器',
        '文字转图像',
        '图像转图像',
        '产品图像生成器',
        'nano banana',
        'nano banana pro',
        '免费AI图像',
      ],
    },
    es: {
      title: 'Generador de Imagen IA | Texto a Imagen e Imagen a Imagen Gratis',
      description:
        'Genera imágenes de productos profesionales con IA. Modos texto a imagen e imagen a imagen. Modelos Nano Banana, múltiples estilos. Prueba gratuita con 30 créditos.',
      keywords: [
        'generador imagen ia',
        'texto a imagen',
        'imagen a imagen',
        'generador imagen producto',
        'nano banana',
      ],
    },
    fr: {
      title: "Générateur d'Image IA | Texte en Image et Image en Image Gratuit",
      description:
        "Générez des images de produits professionnelles avec l'IA. Modes texte vers image et image vers image. Modèles Nano Banana, plusieurs styles. Essai gratuit avec 30 crédits.",
      keywords: [
        'générateur image ia',
        'texte en image',
        'image en image',
        'générateur image produit',
        'nano banana',
      ],
    },
    de: {
      title: 'KI-Bildgenerator | Text zu Bild & Bild zu Bild Kostenlos',
      description:
        'Generieren Sie professionelle Produktbilder mit KI. Text-zu-Bild- und Bild-zu-Bild-Modi. Nano Banana Modelle, mehrere Stile. Kostenlose Testversion mit 15 Credits.',
      keywords: [
        'ki bildgenerator',
        'text zu bild',
        'bild zu bild',
        'produktbild generator',
        'nano banana',
      ],
    },
    ja: {
      title: 'AI画像生成器 | テキストから画像・画像から画像 無料',
      description:
        'AIでプロフェッショナルな商品画像を生成。テキストから画像、画像から画像モード。Nano Bananaモデル、複数のスタイル。30クレジットの無料トライアル。',
      keywords: [
        'ai画像生成器',
        'テキストから画像',
        '画像から画像',
        '商品画像生成器',
        'nano banana',
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

export default function ImageGenerationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
