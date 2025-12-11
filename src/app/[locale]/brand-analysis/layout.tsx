import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseMetadata = getSEOMetadata(locale, 'tool', '/brand-analysis');

  // Page-specific overrides
  const pageSpecific: Record<string, Partial<Metadata>> = {
    en: {
      title: 'AI Brand Analysis | Analyze Your Brand Tone & Style Free',
      description:
        'Analyze your brand automatically with AI. Get brand tone, colors, audience insights, and style recommendations. Perfect for consistent e-commerce content generation.',
      keywords: [
        'brand analysis ai',
        'brand tone analysis',
        'brand style analyzer',
        'ai brand analyzer',
        'e-commerce brand analysis',
      ],
    },
    zh: {
      title: 'AI品牌分析 | 免费分析品牌调性和风格',
      description:
        '用AI自动分析您的品牌。获取品牌调性、颜色、受众洞察和风格建议。适合一致的电商内容生成。',
      keywords: ['品牌分析AI', '品牌调性分析', '品牌风格分析器', 'AI品牌分析器', '电商品牌分析'],
    },
    es: {
      title: 'Análisis de Marca IA | Analiza Tono y Estilo de Marca Gratis',
      description:
        'Analiza tu marca automáticamente con IA. Obtén tono de marca, colores, insights de audiencia y recomendaciones de estilo. Perfecto para generación de contenido e-commerce consistente.',
      keywords: [
        'análisis marca ia',
        'análisis tono marca',
        'analizador estilo marca',
        'analizador marca ia',
        'análisis marca e-commerce',
      ],
    },
    fr: {
      title: 'Analyse de Marque IA | Analysez Tono et Style de Marque Gratuit',
      description:
        "Analysez votre marque automatiquement avec l'IA. Obtenez le tono de marque, les couleurs, les insights d'audience et les recommandations de style. Parfait pour la génération de contenu e-commerce cohérent.",
      keywords: [
        'analyse marque ia',
        'analyse tono marque',
        'analyseur style marque',
        'analyseur marque ia',
        'analyse marque e-commerce',
      ],
    },
    de: {
      title: 'KI-Markenanalyse | Analysieren Sie Markenton & Stil Kostenlos',
      description:
        'Analysieren Sie Ihre Marke automatisch mit KI. Erhalten Sie Markenton, Farben, Zielgruppen-Insights und Stilempfehlungen. Perfekt für konsistente E-Commerce-Inhaltsgenerierung.',
      keywords: [
        'markenanalyse ki',
        'markenton analyse',
        'markenstil analysator',
        'ki marken analysator',
        'e-commerce markenanalyse',
      ],
    },
    ja: {
      title: 'AIブランド分析 | ブランドトーンとスタイルを無料で分析',
      description:
        'AIでブランドを自動分析。ブランドトーン、色、オーディエンスインサイト、スタイル推奨を取得。一貫したEコマースコンテンツ生成に最適。',
      keywords: [
        'ブランド分析ai',
        'ブランドトーン分析',
        'ブランドスタイル分析器',
        'aiブランド分析器',
        'eコマースブランド分析',
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

export default function BrandAnalysisLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
