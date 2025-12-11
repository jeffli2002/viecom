import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseMetadata = getSEOMetadata(locale, 'tool', '/batch-generation');

  // Page-specific overrides
  const pageSpecific: Record<string, Partial<Metadata>> = {
    en: {
      title: 'Batch Generation | Generate Multiple Images & Videos at Once',
      description:
        'Upload Excel/CSV files to generate multiple product images and videos simultaneously. Batch processing for e-commerce. Free, Pro, and Pro+ plans available.',
      keywords: [
        'batch generation',
        'batch image generation',
        'batch video generation',
        'bulk image generator',
        'bulk video generator',
        'e-commerce batch processing',
      ],
    },
    zh: {
      title: '批量生成 | 同时生成多个图像和视频',
      description:
        '上传Excel/CSV文件，同时生成多个产品图像和视频。电商批量处理。提供免费、专业和专业+计划。',
      keywords: [
        '批量生成',
        '批量图像生成',
        '批量视频生成',
        '批量图像生成器',
        '批量视频生成器',
        '电商批量处理',
      ],
    },
    es: {
      title: 'Generación por Lotes | Genera Múltiples Imágenes y Videos a la Vez',
      description:
        'Sube archivos Excel/CSV para generar múltiples imágenes y videos de productos simultáneamente. Procesamiento por lotes para e-commerce. Planes Gratis, Pro y Pro+ disponibles.',
      keywords: [
        'generación por lotes',
        'generación imagen por lotes',
        'generación video por lotes',
        'generador imagen masivo',
        'generador video masivo',
        'procesamiento por lotes e-commerce',
      ],
    },
    fr: {
      title: 'Génération par Lots | Générez Plusieurs Images et Vidéos à la Fois',
      description:
        "Téléchargez des fichiers Excel/CSV pour générer plusieurs images et vidéos de produits simultanément. Traitement par lots pour l'e-commerce. Plans Gratuit, Pro et Pro+ disponibles.",
      keywords: [
        'génération par lots',
        'génération image par lots',
        'génération vidéo par lots',
        'générateur image en masse',
        'générateur vidéo en masse',
        'traitement par lots e-commerce',
      ],
    },
    de: {
      title: 'Batch-Generierung | Mehrere Bilder und Videos auf Einmal Generieren',
      description:
        'Laden Sie Excel/CSV-Dateien hoch, um mehrere Produktbilder und -videos gleichzeitig zu generieren. Batch-Verarbeitung für E-Commerce. Kostenlose, Pro- und Pro+-Pläne verfügbar.',
      keywords: [
        'batch generierung',
        'batch bildgenerierung',
        'batch videogenerierung',
        'massen bildgenerator',
        'massen videogenerator',
        'e-commerce batch verarbeitung',
      ],
    },
    ja: {
      title: 'バッチ生成 | 複数の画像と動画を一度に生成',
      description:
        'Excel/CSVファイルをアップロードして、複数の商品画像と動画を同時に生成。Eコマース向けバッチ処理。無料、Pro、Pro+プラン利用可能。',
      keywords: [
        'バッチ生成',
        'バッチ画像生成',
        'バッチ動画生成',
        '一括画像生成器',
        '一括動画生成器',
        'eコマースバッチ処理',
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

export default function BatchGenerationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
