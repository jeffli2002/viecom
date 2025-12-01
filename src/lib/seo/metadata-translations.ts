import type { Metadata } from 'next';
import { buildLocaleCanonicalMetadata } from './metadata';

export type PageType = 'landing' | 'tool' | 'learn' | 'pricing';

export type PagePath =
  | '/'
  | '/about'
  | '/contact'
  | '/showcase'
  | '/docs'
  | '/image-generation'
  | '/video-generation'
  | '/batch-generation'
  | '/batch-image-generation'
  | '/batch-video-generation'
  | '/brand-analysis'
  | '/pricing';

export interface SEOTranslations {
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
  };
  twitter?: {
    title: string;
    description: string;
  };
}

/**
 * SEO metadata translations for all supported locales
 * Supports: en, zh, es, fr, de, ja
 */
export const seoTranslations: Record<
  PageType,
  Record<string, SEOTranslations>
> = {
  // Homepage / Landing Page
  landing: {
    en: {
      title: 'AI Video Generator for E-commerce | Image to Video in Seconds',
      description:
        'Transform product photos into engaging videos with AI. Free trial with 30 credits. Sora 2 models, batch generation, 720p in minutes. No credit card required.',
      keywords: [
        'ai video generator',
        'image to video ai',
        'free ai video generator',
        'product video generator',
        'e-commerce video ai',
        'batch video generation',
        'ai image generator',
        'sora 2 video',
        'nano banana',
        'nano banana pro',
        'free nano banana image',
        'gemini 3',
        'gemini 3 pro',
      ],
      openGraph: {
        title: 'AI Video Generator for E-commerce | Image to Video in Seconds',
        description: 'Transform product photos into engaging videos with AI. Free trial with 30 credits.',
      },
      twitter: {
        title: 'AI Video Generator for E-commerce | Image to Video in Seconds',
        description: 'Transform product photos into engaging videos with AI. Free trial with 30 credits.',
      },
    },
    zh: {
      title: 'AI视频生成器 | 电商产品照片秒变视频',
      description:
        '用AI将产品照片转换为吸引人的视频。注册送30积分免费试用。Sora 2模型，批量生成，720p视频几分钟完成。无需信用卡。',
      keywords: [
        'AI视频生成器',
        '图片转视频',
        '免费AI视频生成',
        '产品视频生成',
        '电商视频AI',
        '批量视频生成',
        'AI图像生成器',
        'Sora 2视频',
        'nano banana',
        'nano banana pro',
        'free nano banana image',
        'gemini 3',
        'gemini 3 pro',
      ],
      openGraph: {
        title: 'AI视频生成器 | 电商产品照片秒变视频',
        description: '用AI将产品照片转换为吸引人的视频。注册送30积分免费试用。',
      },
      twitter: {
        title: 'AI视频生成器 | 电商产品照片秒变视频',
        description: '用AI将产品照片转换为吸引人的视频。注册送30积分免费试用。',
      },
    },
    es: {
      title: 'Generador de Video IA para E-commerce | Imagen a Video en Segundos',
      description:
        'Transforma fotos de productos en videos atractivos con IA. Prueba gratuita con 30 créditos. Modelos Sora 2, generación por lotes, 720p en minutos. Sin tarjeta de crédito.',
      keywords: [
        'generador de video ia',
        'imagen a video ia',
        'generador de video ia gratis',
        'generador de video de productos',
        'video ia e-commerce',
        'generación de video por lotes',
        'generador de imagen ia',
        'video sora 2',
      ],
      openGraph: {
        title: 'Generador de Video IA para E-commerce | Imagen a Video en Segundos',
        description: 'Transforma fotos de productos en videos atractivos con IA. Prueba gratuita con 30 créditos.',
      },
      twitter: {
        title: 'Generador de Video IA para E-commerce | Imagen a Video en Segundos',
        description: 'Transforma fotos de productos en videos atractivos con IA. Prueba gratuita con 30 créditos.',
      },
    },
    fr: {
      title: 'Générateur de Vidéo IA pour E-commerce | Image en Vidéo en Secondes',
      description:
        'Transformez les photos de produits en vidéos attrayantes avec l\'IA. Essai gratuit avec 30 crédits. Modèles Sora 2, génération par lots, 720p en minutes. Aucune carte de crédit requise.',
      keywords: [
        'générateur de vidéo ia',
        'image en vidéo ia',
        'générateur de vidéo ia gratuit',
        'générateur de vidéo produit',
        'vidéo ia e-commerce',
        'génération de vidéo par lots',
        'générateur d\'image ia',
        'vidéo sora 2',
      ],
      openGraph: {
        title: 'Générateur de Vidéo IA pour E-commerce | Image en Vidéo en Secondes',
        description: 'Transformez les photos de produits en vidéos attrayantes avec l\'IA. Essai gratuit avec 30 crédits.',
      },
      twitter: {
        title: 'Générateur de Vidéo IA pour E-commerce | Image en Vidéo en Secondes',
        description: 'Transformez les photos de produits en vidéos attrayantes avec l\'IA. Essai gratuit avec 30 crédits.',
      },
    },
    de: {
      title: 'KI-Videogenerator für E-Commerce | Bild zu Video in Sekunden',
      description:
        'Verwandeln Sie Produktfotos mit KI in ansprechende Videos. Kostenlose Testversion mit 30 Credits. Sora 2 Modelle, Batch-Generierung, 720p in Minuten. Keine Kreditkarte erforderlich.',
      keywords: [
        'ki videogenerator',
        'bild zu video ki',
        'kostenloser ki videogenerator',
        'produktvideo generator',
        'e-commerce video ki',
        'batch videogenerierung',
        'ki bildgenerator',
        'sora 2 video',
      ],
      openGraph: {
        title: 'KI-Videogenerator für E-Commerce | Bild zu Video in Sekunden',
        description: 'Verwandeln Sie Produktfotos mit KI in ansprechende Videos. Kostenlose Testversion mit 30 Credits.',
      },
      twitter: {
        title: 'KI-Videogenerator für E-Commerce | Bild zu Video in Sekunden',
        description: 'Verwandeln Sie Produktfotos mit KI in ansprechende Videos. Kostenlose Testversion mit 30 Credits.',
      },
    },
    ja: {
      title: 'Eコマース向けAI動画生成器 | 画像を数秒で動画に変換',
      description:
        'AIで商品写真を魅力的な動画に変換。30クレジットの無料トライアル。Sora 2モデル、バッチ生成、720pを数分で。クレジットカード不要。',
      keywords: [
        'ai動画生成器',
        '画像から動画ai',
        '無料ai動画生成器',
        '商品動画生成器',
        'eコマース動画ai',
        'バッチ動画生成',
        'ai画像生成器',
        'sora 2動画',
      ],
      openGraph: {
        title: 'Eコマース向けAI動画生成器 | 画像を数秒で動画に変換',
        description: 'AIで商品写真を魅力的な動画に変換。30クレジットの無料トライアル。',
      },
      twitter: {
        title: 'Eコマース向けAI動画生成器 | 画像を数秒で動画に変換',
        description: 'AIで商品写真を魅力的な動画に変換。30クレジットの無料トライアル。',
      },
    },
  },
  // Tool Pages
  tool: {
    en: {
      title: 'AI Video & Image Generator Tools | Free Trial Available',
      description:
        'Professional AI tools for e-commerce: image generation, video generation, batch processing, and brand analysis. Free trial with 30 credits. No credit card required.',
      keywords: [
        'ai video generator',
        'ai image generator',
        'batch generation tool',
        'brand analysis ai',
        'e-commerce ai tools',
      ],
      openGraph: {
        title: 'AI Video & Image Generator Tools | Free Trial Available',
        description: 'Professional AI tools for e-commerce. Free trial with 30 credits.',
      },
      twitter: {
        title: 'AI Video & Image Generator Tools | Free Trial Available',
        description: 'Professional AI tools for e-commerce. Free trial with 30 credits.',
      },
    },
    zh: {
      title: 'AI视频和图像生成工具 | 免费试用',
      description:
        '专业的电商AI工具：图像生成、视频生成、批量处理和品牌分析。30积分免费试用。无需信用卡。',
      keywords: [
        'AI视频生成器',
        'AI图像生成器',
        '批量生成工具',
        '品牌分析AI',
        '电商AI工具',
      ],
      openGraph: {
        title: 'AI视频和图像生成工具 | 免费试用',
        description: '专业的电商AI工具。30积分免费试用。',
      },
      twitter: {
        title: 'AI视频和图像生成工具 | 免费试用',
        description: '专业的电商AI工具。30积分免费试用。',
      },
    },
    es: {
      title: 'Herramientas Generadoras de Video e Imagen IA | Prueba Gratuita Disponible',
      description:
        'Herramientas IA profesionales para e-commerce: generación de imágenes, generación de videos, procesamiento por lotes y análisis de marca. Prueba gratuita con 30 créditos.',
      keywords: [
        'generador de video ia',
        'generador de imagen ia',
        'herramienta de generación por lotes',
        'análisis de marca ia',
        'herramientas ia e-commerce',
      ],
      openGraph: {
        title: 'Herramientas Generadoras de Video e Imagen IA | Prueba Gratuita Disponible',
        description: 'Herramientas IA profesionales para e-commerce. Prueba gratuita con 30 créditos.',
      },
      twitter: {
        title: 'Herramientas Generadoras de Video e Imagen IA | Prueba Gratuita Disponible',
        description: 'Herramientas IA profesionales para e-commerce. Prueba gratuita con 30 créditos.',
      },
    },
    fr: {
      title: 'Outils Générateurs de Vidéo et Image IA | Essai Gratuit Disponible',
      description:
        'Outils IA professionnels pour l\'e-commerce : génération d\'images, génération de vidéos, traitement par lots et analyse de marque. Essai gratuit avec 30 crédits.',
      keywords: [
        'générateur de vidéo ia',
        'générateur d\'image ia',
        'outil de génération par lots',
        'analyse de marque ia',
        'outils ia e-commerce',
      ],
      openGraph: {
        title: 'Outils Générateurs de Vidéo et Image IA | Essai Gratuit Disponible',
        description: 'Outils IA professionnels pour l\'e-commerce. Essai gratuit avec 30 crédits.',
      },
      twitter: {
        title: 'Outils Générateurs de Vidéo et Image IA | Essai Gratuit Disponible',
        description: 'Outils IA professionnels pour l\'e-commerce. Essai gratuit avec 30 crédits.',
      },
    },
    de: {
      title: 'KI-Video- und Bildgenerator-Tools | Kostenlose Testversion Verfügbar',
      description:
        'Professionelle KI-Tools für E-Commerce: Bildgenerierung, Videogenerierung, Batch-Verarbeitung und Markenanalyse. Kostenlose Testversion mit 30 Credits.',
      keywords: [
        'ki videogenerator',
        'ki bildgenerator',
        'batch generierung tool',
        'markenanalyse ki',
        'e-commerce ki tools',
      ],
      openGraph: {
        title: 'KI-Video- und Bildgenerator-Tools | Kostenlose Testversion Verfügbar',
        description: 'Professionelle KI-Tools für E-Commerce. Kostenlose Testversion mit 30 Credits.',
      },
      twitter: {
        title: 'KI-Video- und Bildgenerator-Tools | Kostenlose Testversion Verfügbar',
        description: 'Professionelle KI-Tools für E-Commerce. Kostenlose Testversion mit 30 Credits.',
      },
    },
    ja: {
      title: 'AI動画・画像生成ツール | 無料トライアル利用可能',
      description:
        'Eコマース向けプロフェッショナルAIツール：画像生成、動画生成、バッチ処理、ブランド分析。30クレジットの無料トライアル。',
      keywords: [
        'ai動画生成器',
        'ai画像生成器',
        'バッチ生成ツール',
        'ブランド分析ai',
        'eコマースaiツール',
      ],
      openGraph: {
        title: 'AI動画・画像生成ツール | 無料トライアル利用可能',
        description: 'Eコマース向けプロフェッショナルAIツール。30クレジットの無料トライアル。',
      },
      twitter: {
        title: 'AI動画・画像生成ツール | 無料トライアル利用可能',
        description: 'Eコマース向けプロフェッショナルAIツール。30クレジットの無料トライアル。',
      },
    },
  },
  // Learn / Docs Pages
  learn: {
    en: {
      title: 'Documentation - How to Use Viecom AI Image & Video Generator',
      description:
        'Complete guide on how to generate AI images and videos for e-commerce. Learn how to use text-to-image, image-to-image, text-to-video, batch generation, and brand analysis features.',
      keywords: [
        'how to generate AI images',
        'how to create AI videos',
        'AI image generator guide',
        'e-commerce product images',
        'batch image generation tutorial',
        'Sora 2 Pro guide',
      ],
      openGraph: {
        title: 'How to Use Viecom AI Generator - Complete Documentation',
        description: 'Step-by-step guides for AI image and video generation',
      },
      twitter: {
        title: 'How to Use Viecom AI Generator - Complete Documentation',
        description: 'Step-by-step guides for AI image and video generation',
      },
    },
    zh: {
      title: '文档 - 如何使用Viecom AI图像和视频生成器',
      description:
        '完整的电商AI图像和视频生成指南。学习如何使用文本转图像、图像转图像、文本转视频、批量生成和品牌分析功能。',
      keywords: [
        '如何生成AI图像',
        '如何创建AI视频',
        'AI图像生成器指南',
        '电商产品图像',
        '批量图像生成教程',
        'Sora 2 Pro指南',
      ],
      openGraph: {
        title: '如何使用Viecom AI生成器 - 完整文档',
        description: 'AI图像和视频生成的逐步指南',
      },
      twitter: {
        title: '如何使用Viecom AI生成器 - 完整文档',
        description: 'AI图像和视频生成的逐步指南',
      },
    },
    es: {
      title: 'Documentación - Cómo Usar el Generador de Imagen y Video IA de Viecom',
      description:
        'Guía completa sobre cómo generar imágenes y videos IA para e-commerce. Aprende a usar texto a imagen, imagen a imagen, texto a video, generación por lotes y análisis de marca.',
      keywords: [
        'cómo generar imágenes ia',
        'cómo crear videos ia',
        'guía generador imagen ia',
        'imágenes producto e-commerce',
        'tutorial generación imagen por lotes',
        'guía sora 2 pro',
      ],
      openGraph: {
        title: 'Cómo Usar el Generador IA de Viecom - Documentación Completa',
        description: 'Guías paso a paso para generación de imágenes y videos IA',
      },
      twitter: {
        title: 'Cómo Usar el Generador IA de Viecom - Documentación Completa',
        description: 'Guías paso a paso para generación de imágenes y videos IA',
      },
    },
    fr: {
      title: 'Documentation - Comment Utiliser le Générateur d\'Image et Vidéo IA de Viecom',
      description:
        'Guide complet sur la génération d\'images et vidéos IA pour l\'e-commerce. Apprenez à utiliser texte vers image, image vers image, texte vers vidéo, génération par lots et analyse de marque.',
      keywords: [
        'comment générer images ia',
        'comment créer videos ia',
        'guide générateur image ia',
        'images produit e-commerce',
        'tutoriel génération image par lots',
        'guide sora 2 pro',
      ],
      openGraph: {
        title: 'Comment Utiliser le Générateur IA de Viecom - Documentation Complète',
        description: 'Guides étape par étape pour la génération d\'images et vidéos IA',
      },
      twitter: {
        title: 'Comment Utiliser le Générateur IA de Viecom - Documentation Complète',
        description: 'Guides étape par étape pour la génération d\'images et vidéos IA',
      },
    },
    de: {
      title: 'Dokumentation - So Verwenden Sie den KI-Bild- und Videogenerator von Viecom',
      description:
        'Vollständige Anleitung zur Generierung von KI-Bildern und -Videos für E-Commerce. Lernen Sie Text-zu-Bild, Bild-zu-Bild, Text-zu-Video, Batch-Generierung und Markenanalyse.',
      keywords: [
        'wie ki bilder generieren',
        'wie ki videos erstellen',
        'ki bildgenerator anleitung',
        'e-commerce produktbilder',
        'batch bildgenerierung tutorial',
        'sora 2 pro anleitung',
      ],
      openGraph: {
        title: 'So Verwenden Sie den KI-Generator von Viecom - Vollständige Dokumentation',
        description: 'Schritt-für-Schritt-Anleitungen für KI-Bild- und Videogenerierung',
      },
      twitter: {
        title: 'So Verwenden Sie den KI-Generator von Viecom - Vollständige Dokumentation',
        description: 'Schritt-für-Schritt-Anleitungen für KI-Bild- und Videogenerierung',
      },
    },
    ja: {
      title: 'ドキュメント - Viecom AI画像・動画生成器の使い方',
      description:
        'Eコマース向けAI画像・動画生成の完全ガイド。テキストから画像、画像から画像、テキストから動画、バッチ生成、ブランド分析機能の使い方を学びます。',
      keywords: [
        'ai画像の生成方法',
        'ai動画の作成方法',
        'ai画像生成器ガイド',
        'eコマース商品画像',
        'バッチ画像生成チュートリアル',
        'sora 2 proガイド',
      ],
      openGraph: {
        title: 'Viecom AI生成器の使い方 - 完全ドキュメント',
        description: 'AI画像・動画生成のステップバイステップガイド',
      },
      twitter: {
        title: 'Viecom AI生成器の使い方 - 完全ドキュメント',
        description: 'AI画像・動画生成のステップバイステップガイド',
      },
    },
  },
  // Pricing Page
  pricing: {
    en: {
      title: 'Pricing | AI Video Generator from $19.9/mo - Free Trial Available',
      description:
        'Simple, transparent pricing for AI video and image generation. Free plan with 30 credits sign-up bonus (one-time). Pro plans from $19.9/month. No credit card required for trial.',
      keywords: [
        'ai video generator pricing',
        'free ai video credits',
        'video generation pricing',
        'image to video pricing',
        'ai video subscription',
      ],
      openGraph: {
        title: 'Pricing | AI Video Generator from $19.9/mo',
        description: 'Simple, transparent pricing for AI video and image generation. Free trial available.',
      },
      twitter: {
        title: 'Pricing | AI Video Generator from $19.9/mo',
        description: 'Simple, transparent pricing for AI video and image generation. Free trial available.',
      },
    },
    zh: {
      title: '定价 | AI视频生成器从$19.9/月起 - 免费试用',
      description:
        '简单透明的AI视频和图像生成定价。免费计划注册送30积分（一次性）。专业计划从$19.9/月起。试用无需信用卡。',
      keywords: [
        'AI视频生成器定价',
        '免费AI视频积分',
        '视频生成定价',
        '图片转视频定价',
        'AI视频订阅',
      ],
      openGraph: {
        title: '定价 | AI视频生成器从$19.9/月起',
        description: '简单透明的AI视频和图像生成定价。免费试用。',
      },
      twitter: {
        title: '定价 | AI视频生成器从$19.9/月起',
        description: '简单透明的AI视频和图像生成定价。免费试用。',
      },
    },
    es: {
      title: 'Precios | Generador de Video IA desde $19.9/mes - Prueba Gratuita Disponible',
      description:
        'Precios simples y transparentes para generación de video e imagen IA. Plan gratuito con 30 créditos de bonificación (única vez). Planes Pro desde $19.9/mes. Sin tarjeta de crédito para prueba.',
      keywords: [
        'precios generador video ia',
        'créditos video ia gratis',
        'precios generación video',
        'precios imagen a video',
        'suscripción video ia',
      ],
      openGraph: {
        title: 'Precios | Generador de Video IA desde $19.9/mes',
        description: 'Precios simples y transparentes para generación de video e imagen IA. Prueba gratuita disponible.',
      },
      twitter: {
        title: 'Precios | Generador de Video IA desde $19.9/mes',
        description: 'Precios simples y transparentes para generación de video e imagen IA. Prueba gratuita disponible.',
      },
    },
    fr: {
      title: 'Tarifs | Générateur de Vidéo IA à partir de 19,9$/mois - Essai Gratuit Disponible',
      description:
        'Tarifs simples et transparents pour la génération de vidéo et d\'image IA. Plan gratuit avec 30 crédits de bonus (unique). Plans Pro à partir de 19,9$/mois. Aucune carte de crédit requise pour l\'essai.',
      keywords: [
        'tarifs générateur vidéo ia',
        'crédits vidéo ia gratuits',
        'tarifs génération vidéo',
        'tarifs image en vidéo',
        'abonnement vidéo ia',
      ],
      openGraph: {
        title: 'Tarifs | Générateur de Vidéo IA à partir de 19,9$/mois',
        description: 'Tarifs simples et transparents pour la génération de vidéo et d\'image IA. Essai gratuit disponible.',
      },
      twitter: {
        title: 'Tarifs | Générateur de Vidéo IA à partir de 19,9$/mois',
        description: 'Tarifs simples et transparents pour la génération de vidéo et d\'image IA. Essai gratuit disponible.',
      },
    },
    de: {
      title: 'Preise | KI-Videogenerator ab 19,9$/Monat - Kostenlose Testversion Verfügbar',
      description:
        'Einfache, transparente Preise für KI-Video- und Bildgenerierung. Kostenloser Plan mit 30 Credits Bonus (einmalig). Pro-Pläne ab 19,9$/Monat. Keine Kreditkarte für Testversion erforderlich.',
      keywords: [
        'preise ki videogenerator',
        'kostenlose ki video credits',
        'preise videogenerierung',
        'preise bild zu video',
        'ki video abonnement',
      ],
      openGraph: {
        title: 'Preise | KI-Videogenerator ab 19,9$/Monat',
        description: 'Einfache, transparente Preise für KI-Video- und Bildgenerierung. Kostenlose Testversion verfügbar.',
      },
      twitter: {
        title: 'Preise | KI-Videogenerator ab 19,9$/Monat',
        description: 'Einfache, transparente Preise für KI-Video- und Bildgenerierung. Kostenlose Testversion verfügbar.',
      },
    },
    ja: {
      title: '料金 | AI動画生成器 $19.9/月から - 無料トライアル利用可能',
      description:
        'AI動画・画像生成のシンプルで透明な料金。30クレジットのボーナス付き無料プラン（初回のみ）。プロプランは$19.9/月から。トライアルにクレジットカード不要。',
      keywords: [
        'ai動画生成器料金',
        '無料ai動画クレジット',
        '動画生成料金',
        '画像から動画料金',
        'ai動画サブスクリプション',
      ],
      openGraph: {
        title: '料金 | AI動画生成器 $19.9/月から',
        description: 'AI動画・画像生成のシンプルで透明な料金。無料トライアル利用可能。',
      },
      twitter: {
        title: '料金 | AI動画生成器 $19.9/月から',
        description: 'AI動画・画像生成のシンプルで透明な料金。無料トライアル利用可能。',
      },
    },
  },
};

/**
 * Page-specific SEO translations
 * These override the generic page type translations for specific pages
 */
export const pageSpecificTranslations: Record<
  PagePath,
  Record<string, SEOTranslations>
> = {
  '/about': {
    en: {
      title: 'About Viecom | AI-Powered E-commerce Content Generation Platform',
      description:
        'Learn about Viecom, the AI-powered platform that helps e-commerce businesses create professional product images and videos at scale. Our mission, technology, and team.',
      keywords: [
        'about viecom',
        'ai content generation platform',
        'e-commerce ai tools',
        'product photography ai',
        'video generation platform',
      ],
      openGraph: {
        title: 'About Viecom | AI-Powered E-commerce Content Platform',
        description: 'Learn about Viecom and how we help e-commerce businesses create professional content with AI.',
      },
      twitter: {
        title: 'About Viecom | AI-Powered E-commerce Content Platform',
        description: 'Learn about Viecom and how we help e-commerce businesses create professional content with AI.',
      },
    },
    zh: {
      title: '关于Viecom | AI驱动的电商内容生成平台',
      description:
        '了解Viecom，这个AI驱动的平台帮助电商企业大规模创建专业产品图像和视频。我们的使命、技术和团队。',
      keywords: ['关于viecom', 'AI内容生成平台', '电商AI工具', '产品摄影AI', '视频生成平台'],
      openGraph: {
        title: '关于Viecom | AI驱动的电商内容平台',
        description: '了解Viecom以及我们如何帮助电商企业使用AI创建专业内容。',
      },
      twitter: {
        title: '关于Viecom | AI驱动的电商内容平台',
        description: '了解Viecom以及我们如何帮助电商企业使用AI创建专业内容。',
      },
    },
    es: {
      title: 'Acerca de Viecom | Plataforma de Generación de Contenido IA para E-commerce',
      description:
        'Conoce Viecom, la plataforma impulsada por IA que ayuda a las empresas de e-commerce a crear imágenes y videos de productos profesionales a escala. Nuestra misión, tecnología y equipo.',
      keywords: [
        'acerca de viecom',
        'plataforma generación contenido ia',
        'herramientas ia e-commerce',
        'fotografía producto ia',
        'plataforma generación video',
      ],
      openGraph: {
        title: 'Acerca de Viecom | Plataforma de Contenido IA para E-commerce',
        description: 'Conoce Viecom y cómo ayudamos a las empresas de e-commerce a crear contenido profesional con IA.',
      },
      twitter: {
        title: 'Acerca de Viecom | Plataforma de Contenido IA para E-commerce',
        description: 'Conoce Viecom y cómo ayudamos a las empresas de e-commerce a crear contenido profesional con IA.',
      },
    },
    fr: {
      title: 'À Propos de Viecom | Plateforme de Génération de Contenu IA pour E-commerce',
      description:
        'Découvrez Viecom, la plateforme alimentée par IA qui aide les entreprises e-commerce à créer des images et vidéos de produits professionnelles à grande échelle. Notre mission, technologie et équipe.',
      keywords: [
        'à propos viecom',
        'plateforme génération contenu ia',
        'outils ia e-commerce',
        'photographie produit ia',
        'plateforme génération vidéo',
      ],
      openGraph: {
        title: 'À Propos de Viecom | Plateforme de Contenu IA pour E-commerce',
        description: 'Découvrez Viecom et comment nous aidons les entreprises e-commerce à créer du contenu professionnel avec IA.',
      },
      twitter: {
        title: 'À Propos de Viecom | Plateforme de Contenu IA pour E-commerce',
        description: 'Découvrez Viecom et comment nous aidons les entreprises e-commerce à créer du contenu professionnel avec IA.',
      },
    },
    de: {
      title: 'Über Viecom | KI-gestützte E-Commerce-Inhaltsgenerierungsplattform',
      description:
        'Erfahren Sie mehr über Viecom, die KI-gestützte Plattform, die E-Commerce-Unternehmen dabei hilft, professionelle Produktbilder und -videos in großem Maßstab zu erstellen. Unsere Mission, Technologie und Team.',
      keywords: [
        'über viecom',
        'ki inhaltsgenerierungsplattform',
        'e-commerce ki tools',
        'produktfotografie ki',
        'videogenerierungsplattform',
      ],
      openGraph: {
        title: 'Über Viecom | KI-gestützte E-Commerce-Inhaltsplattform',
        description: 'Erfahren Sie mehr über Viecom und wie wir E-Commerce-Unternehmen dabei helfen, professionelle Inhalte mit KI zu erstellen.',
      },
      twitter: {
        title: 'Über Viecom | KI-gestützte E-Commerce-Inhaltsplattform',
        description: 'Erfahren Sie mehr über Viecom und wie wir E-Commerce-Unternehmen dabei helfen, professionelle Inhalte mit KI zu erstellen.',
      },
    },
    ja: {
      title: 'Viecomについて | AI駆動のEコマースコンテンツ生成プラットフォーム',
      description:
        'Viecomについて学ぶ。Eコマース企業が大規模にプロフェッショナルな商品画像と動画を作成するのを支援するAI駆動プラットフォーム。私たちの使命、技術、チーム。',
      keywords: [
        'viecomについて',
        'aiコンテンツ生成プラットフォーム',
        'eコマースaiツール',
        '商品写真ai',
        '動画生成プラットフォーム',
      ],
      openGraph: {
        title: 'Viecomについて | AI駆動のEコマースコンテンツプラットフォーム',
        description: 'Viecomについて、そしてEコマース企業がAIでプロフェッショナルなコンテンツを作成するのをどのように支援しているかを学びます。',
      },
      twitter: {
        title: 'Viecomについて | AI駆動のEコマースコンテンツプラットフォーム',
        description: 'Viecomについて、そしてEコマース企業がAIでプロフェッショナルなコンテンツを作成するのをどのように支援しているかを学びます。',
      },
    },
  },
  '/contact': {
    en: {
      title: 'Contact Us | Get Help with AI Video & Image Generation',
      description:
        'Contact Viecom for support, sales inquiries, partnerships, or general questions about our AI video and image generation platform. We\'re here to help!',
      keywords: [
        'contact viecom',
        'ai video generator support',
        'customer support',
        'sales inquiry',
        'partnership',
      ],
      openGraph: {
        title: 'Contact Viecom | Get Help with AI Generation',
        description: 'Contact us for support, sales inquiries, or questions about our AI video and image generation platform.',
      },
      twitter: {
        title: 'Contact Viecom | Get Help with AI Generation',
        description: 'Contact us for support, sales inquiries, or questions about our AI video and image generation platform.',
      },
    },
    zh: {
      title: '联系我们 | 获取AI视频和图像生成帮助',
      description:
        '联系Viecom获取支持、销售咨询、合作伙伴关系或关于我们AI视频和图像生成平台的一般问题。我们随时为您提供帮助！',
      keywords: ['联系viecom', 'AI视频生成器支持', '客户支持', '销售咨询', '合作伙伴'],
      openGraph: {
        title: '联系Viecom | 获取AI生成帮助',
        description: '联系我们获取支持、销售咨询或关于我们AI视频和图像生成平台的问题。',
      },
      twitter: {
        title: '联系Viecom | 获取AI生成帮助',
        description: '联系我们获取支持、销售咨询或关于我们AI视频和图像生成平台的问题。',
      },
    },
    es: {
      title: 'Contáctanos | Obtén Ayuda con Generación de Video e Imagen IA',
      description:
        'Contacta a Viecom para soporte, consultas de ventas, asociaciones o preguntas generales sobre nuestra plataforma de generación de video e imagen IA. ¡Estamos aquí para ayudar!',
      keywords: [
        'contactar viecom',
        'soporte generador video ia',
        'soporte cliente',
        'consulta ventas',
        'asociación',
      ],
      openGraph: {
        title: 'Contacta Viecom | Obtén Ayuda con Generación IA',
        description: 'Contáctanos para soporte, consultas de ventas o preguntas sobre nuestra plataforma de generación de video e imagen IA.',
      },
      twitter: {
        title: 'Contacta Viecom | Obtén Ayuda con Generación IA',
        description: 'Contáctanos para soporte, consultas de ventas o preguntas sobre nuestra plataforma de generación de video e imagen IA.',
      },
    },
    fr: {
      title: 'Contactez-nous | Obtenez de l\'Aide pour la Génération de Vidéo et Image IA',
      description:
        'Contactez Viecom pour le support, les demandes de vente, les partenariats ou les questions générales sur notre plateforme de génération de vidéo et image IA. Nous sommes là pour vous aider !',
      keywords: [
        'contacter viecom',
        'support générateur vidéo ia',
        'support client',
        'demande vente',
        'partenariat',
      ],
      openGraph: {
        title: 'Contactez Viecom | Obtenez de l\'Aide pour la Génération IA',
        description: 'Contactez-nous pour le support, les demandes de vente ou les questions sur notre plateforme de génération de vidéo et image IA.',
      },
      twitter: {
        title: 'Contactez Viecom | Obtenez de l\'Aide pour la Génération IA',
        description: 'Contactez-nous pour le support, les demandes de vente ou les questions sur notre plateforme de génération de vidéo et image IA.',
      },
    },
    de: {
      title: 'Kontaktieren Sie uns | Hilfe bei KI-Video- und Bildgenerierung',
      description:
        'Kontaktieren Sie Viecom für Support, Verkaufsanfragen, Partnerschaften oder allgemeine Fragen zu unserer KI-Video- und Bildgenerierungsplattform. Wir sind hier, um zu helfen!',
      keywords: [
        'viecom kontaktieren',
        'ki videogenerator support',
        'kundensupport',
        'verkaufsanfrage',
        'partnerschaft',
      ],
      openGraph: {
        title: 'Kontaktieren Sie Viecom | Hilfe bei KI-Generierung',
        description: 'Kontaktieren Sie uns für Support, Verkaufsanfragen oder Fragen zu unserer KI-Video- und Bildgenerierungsplattform.',
      },
      twitter: {
        title: 'Kontaktieren Sie Viecom | Hilfe bei KI-Generierung',
        description: 'Kontaktieren Sie uns für Support, Verkaufsanfragen oder Fragen zu unserer KI-Video- und Bildgenerierungsplattform.',
      },
    },
    ja: {
      title: 'お問い合わせ | AI動画・画像生成のヘルプを取得',
      description:
        'サポート、販売のお問い合わせ、パートナーシップ、またはAI動画・画像生成プラットフォームに関する一般的な質問については、Viecomにお問い合わせください。お手伝いします！',
      keywords: [
        'viecomお問い合わせ',
        'ai動画生成器サポート',
        'カスタマーサポート',
        '販売お問い合わせ',
        'パートナーシップ',
      ],
      openGraph: {
        title: 'Viecomにお問い合わせ | AI生成のヘルプを取得',
        description: 'サポート、販売のお問い合わせ、またはAI動画・画像生成プラットフォームに関する質問については、お問い合わせください。',
      },
      twitter: {
        title: 'Viecomにお問い合わせ | AI生成のヘルプを取得',
        description: 'サポート、販売のお問い合わせ、またはAI動画・画像生成プラットフォームに関する質問については、お問い合わせください。',
      },
    },
  },
  '/showcase': {
    en: {
      title: 'Viecom Showcase | Featured AI-Generated Images & Videos',
      description:
        'Browse curated AI-generated images and videos from the Viecom community. Discover creative examples of product photography, videos, and e-commerce content created with AI.',
      keywords: [
        'viecom showcase',
        'ai generated images',
        'ai generated videos',
        'product photography examples',
        'e-commerce content examples',
      ],
      openGraph: {
        title: 'Viecom Showcase | Featured AI-Generated Content',
        description: 'Browse curated AI-generated images and videos from the Viecom community.',
      },
      twitter: {
        title: 'Viecom Showcase | Featured AI-Generated Content',
        description: 'Browse curated AI-generated images and videos from the Viecom community.',
      },
    },
    zh: {
      title: 'Viecom展示 | 精选AI生成的图像和视频',
      description:
        '浏览来自Viecom社区的精选AI生成图像和视频。发现使用AI创建的产品摄影、视频和电商内容的创意示例。',
      keywords: ['viecom展示', 'AI生成图像', 'AI生成视频', '产品摄影示例', '电商内容示例'],
      openGraph: {
        title: 'Viecom展示 | 精选AI生成内容',
        description: '浏览来自Viecom社区的精选AI生成图像和视频。',
      },
      twitter: {
        title: 'Viecom展示 | 精选AI生成内容',
        description: '浏览来自Viecom社区的精选AI生成图像和视频。',
      },
    },
    es: {
      title: 'Viecom Showcase | Imágenes y Videos Generados por IA Destacados',
      description:
        'Explora imágenes y videos generados por IA curados de la comunidad Viecom. Descubre ejemplos creativos de fotografía de productos, videos y contenido e-commerce creado con IA.',
      keywords: [
        'vitrina viecom',
        'imágenes generadas ia',
        'videos generados ia',
        'ejemplos fotografía producto',
        'ejemplos contenido e-commerce',
      ],
      openGraph: {
        title: 'Viecom Showcase | Contenido Generado por IA Destacado',
        description: 'Explora imágenes y videos generados por IA curados de la comunidad Viecom.',
      },
      twitter: {
        title: 'Viecom Showcase | Contenido Generado por IA Destacado',
        description: 'Explora imágenes y videos generados por IA curados de la comunidad Viecom.',
      },
    },
    fr: {
      title: 'Viecom Showcase | Images et Vidéos Générées par IA en Vedette',
      description:
        'Parcourez des images et vidéos générées par IA sélectionnées de la communauté Viecom. Découvrez des exemples créatifs de photographie de produits, vidéos et contenu e-commerce créés avec IA.',
      keywords: [
        'vitrine viecom',
        'images générées ia',
        'vidéos générées ia',
        'exemples photographie produit',
        'exemples contenu e-commerce',
      ],
      openGraph: {
        title: 'Viecom Showcase | Contenu Généré par IA en Vedette',
        description: 'Parcourez des images et vidéos générées par IA sélectionnées de la communauté Viecom.',
      },
      twitter: {
        title: 'Viecom Showcase | Contenu Généré par IA en Vedette',
        description: 'Parcourez des images et vidéos générées par IA sélectionnées de la communauté Viecom.',
      },
    },
    de: {
      title: 'Viecom Showcase | Ausgewählte KI-generierte Bilder und Videos',
      description:
        'Durchsuchen Sie kuratierte KI-generierte Bilder und Videos aus der Viecom-Community. Entdecken Sie kreative Beispiele für Produktfotografie, Videos und E-Commerce-Inhalte, die mit KI erstellt wurden.',
      keywords: [
        'viecom showcase',
        'ki generierte bilder',
        'ki generierte videos',
        'produktfotografie beispiele',
        'e-commerce inhalt beispiele',
      ],
      openGraph: {
        title: 'Viecom Showcase | Ausgewählte KI-generierte Inhalte',
        description: 'Durchsuchen Sie kuratierte KI-generierte Bilder und Videos aus der Viecom-Community.',
      },
      twitter: {
        title: 'Viecom Showcase | Ausgewählte KI-generierte Inhalte',
        description: 'Durchsuchen Sie kuratierte KI-generierte Bilder und Videos aus der Viecom-Community.',
      },
    },
    ja: {
      title: 'Viecom Showcase | 注目のAI生成画像と動画',
      description:
        'ViecomコミュニティからキュレートされたAI生成画像と動画を閲覧。AIで作成された商品写真、動画、Eコマースコンテンツの創造的な例を発見。',
      keywords: [
        'viecom showcase',
        'ai生成画像',
        'ai生成動画',
        '商品写真例',
        'eコマースコンテンツ例',
      ],
      openGraph: {
        title: 'Viecom Showcase | 注目のAI生成コンテンツ',
        description: 'ViecomコミュニティからキュレートされたAI生成画像と動画を閲覧。',
      },
      twitter: {
        title: 'Viecom Showcase | 注目のAI生成コンテンツ',
        description: 'ViecomコミュニティからキュレートされたAI生成画像と動画を閲覧。',
      },
    },
  },
  '/batch-image-generation': {
    en: {
      title: 'Batch Image Generation | Generate Multiple Product Images at Once',
      description:
        'Upload Excel/CSV files to generate multiple product images simultaneously. Batch processing for e-commerce. Free, Pro, and Pro+ plans available.',
      keywords: [
        'batch image generation',
        'bulk image generator',
        'batch product images',
        'e-commerce batch processing',
        'csv image generation',
      ],
      openGraph: {
        title: 'Batch Image Generation | Generate Multiple Images at Once',
        description: 'Upload Excel/CSV files to generate multiple product images simultaneously. Batch processing for e-commerce.',
      },
      twitter: {
        title: 'Batch Image Generation | Generate Multiple Images at Once',
        description: 'Upload Excel/CSV files to generate multiple product images simultaneously. Batch processing for e-commerce.',
      },
    },
    zh: {
      title: '批量图像生成 | 同时生成多个产品图像',
      description:
        '上传Excel/CSV文件，同时生成多个产品图像。电商批量处理。提供免费、专业和专业+计划。',
      keywords: ['批量图像生成', '批量图像生成器', '批量产品图像', '电商批量处理', 'CSV图像生成'],
      openGraph: {
        title: '批量图像生成 | 同时生成多个图像',
        description: '上传Excel/CSV文件，同时生成多个产品图像。电商批量处理。',
      },
      twitter: {
        title: '批量图像生成 | 同时生成多个图像',
        description: '上传Excel/CSV文件，同时生成多个产品图像。电商批量处理。',
      },
    },
    es: {
      title: 'Generación de Imagen por Lotes | Genera Múltiples Imágenes de Productos a la Vez',
      description:
        'Sube archivos Excel/CSV para generar múltiples imágenes de productos simultáneamente. Procesamiento por lotes para e-commerce. Planes Gratis, Pro y Pro+ disponibles.',
      keywords: [
        'generación imagen por lotes',
        'generador imagen masivo',
        'imágenes producto por lotes',
        'procesamiento por lotes e-commerce',
        'generación imagen csv',
      ],
      openGraph: {
        title: 'Generación de Imagen por Lotes | Genera Múltiples Imágenes a la Vez',
        description: 'Sube archivos Excel/CSV para generar múltiples imágenes de productos simultáneamente. Procesamiento por lotes para e-commerce.',
      },
      twitter: {
        title: 'Generación de Imagen por Lotes | Genera Múltiples Imágenes a la Vez',
        description: 'Sube archivos Excel/CSV para generar múltiples imágenes de productos simultáneamente. Procesamiento por lotes para e-commerce.',
      },
    },
    fr: {
      title: 'Génération d\'Image par Lots | Générez Plusieurs Images de Produits à la Fois',
      description:
        'Téléchargez des fichiers Excel/CSV pour générer plusieurs images de produits simultanément. Traitement par lots pour l\'e-commerce. Plans Gratuit, Pro et Pro+ disponibles.',
      keywords: [
        'génération image par lots',
        'générateur image en masse',
        'images produit par lots',
        'traitement par lots e-commerce',
        'génération image csv',
      ],
      openGraph: {
        title: 'Génération d\'Image par Lots | Générez Plusieurs Images à la Fois',
        description: 'Téléchargez des fichiers Excel/CSV pour générer plusieurs images de produits simultanément. Traitement par lots pour l\'e-commerce.',
      },
      twitter: {
        title: 'Génération d\'Image par Lots | Générez Plusieurs Images à la Fois',
        description: 'Téléchargez des fichiers Excel/CSV pour générer plusieurs images de produits simultanément. Traitement par lots pour l\'e-commerce.',
      },
    },
    de: {
      title: 'Batch-Bildgenerierung | Generieren Sie Mehrere Produktbilder auf Einmal',
      description:
        'Laden Sie Excel/CSV-Dateien hoch, um mehrere Produktbilder gleichzeitig zu generieren. Batch-Verarbeitung für E-Commerce. Kostenlose, Pro- und Pro+-Pläne verfügbar.',
      keywords: [
        'batch bildgenerierung',
        'massenbild generator',
        'batch produktbilder',
        'e-commerce batch verarbeitung',
        'csv bildgenerierung',
      ],
      openGraph: {
        title: 'Batch-Bildgenerierung | Generieren Sie Mehrere Bilder auf Einmal',
        description: 'Laden Sie Excel/CSV-Dateien hoch, um mehrere Produktbilder gleichzeitig zu generieren. Batch-Verarbeitung für E-Commerce.',
      },
      twitter: {
        title: 'Batch-Bildgenerierung | Generieren Sie Mehrere Bilder auf Einmal',
        description: 'Laden Sie Excel/CSV-Dateien hoch, um mehrere Produktbilder gleichzeitig zu generieren. Batch-Verarbeitung für E-Commerce.',
      },
    },
    ja: {
      title: 'バッチ画像生成 | 複数の商品画像を一度に生成',
      description:
        'Excel/CSVファイルをアップロードして、複数の商品画像を同時に生成。Eコマース向けバッチ処理。無料、プロ、プロ+プラン利用可能。',
      keywords: [
        'バッチ画像生成',
        '一括画像生成器',
        'バッチ商品画像',
        'eコマースバッチ処理',
        'csv画像生成',
      ],
      openGraph: {
        title: 'バッチ画像生成 | 複数の画像を一度に生成',
        description: 'Excel/CSVファイルをアップロードして、複数の商品画像を同時に生成。Eコマース向けバッチ処理。',
      },
      twitter: {
        title: 'バッチ画像生成 | 複数の画像を一度に生成',
        description: 'Excel/CSVファイルをアップロードして、複数の商品画像を同時に生成。Eコマース向けバッチ処理。',
      },
    },
  },
  '/batch-video-generation': {
    en: {
      title: 'Batch Video Generation | Generate Multiple Product Videos at Once',
      description:
        'Upload Excel/CSV files to generate multiple product videos simultaneously. Batch processing for e-commerce. Free, Pro, and Pro+ plans available.',
      keywords: [
        'batch video generation',
        'bulk video generator',
        'batch product videos',
        'e-commerce batch processing',
        'csv video generation',
      ],
      openGraph: {
        title: 'Batch Video Generation | Generate Multiple Videos at Once',
        description: 'Upload Excel/CSV files to generate multiple product videos simultaneously. Batch processing for e-commerce.',
      },
      twitter: {
        title: 'Batch Video Generation | Generate Multiple Videos at Once',
        description: 'Upload Excel/CSV files to generate multiple product videos simultaneously. Batch processing for e-commerce.',
      },
    },
    zh: {
      title: '批量视频生成 | 同时生成多个产品视频',
      description:
        '上传Excel/CSV文件，同时生成多个产品视频。电商批量处理。提供免费、专业和专业+计划。',
      keywords: ['批量视频生成', '批量视频生成器', '批量产品视频', '电商批量处理', 'CSV视频生成'],
      openGraph: {
        title: '批量视频生成 | 同时生成多个视频',
        description: '上传Excel/CSV文件，同时生成多个产品视频。电商批量处理。',
      },
      twitter: {
        title: '批量视频生成 | 同时生成多个视频',
        description: '上传Excel/CSV文件，同时生成多个产品视频。电商批量处理。',
      },
    },
    es: {
      title: 'Generación de Video por Lotes | Genera Múltiples Videos de Productos a la Vez',
      description:
        'Sube archivos Excel/CSV para generar múltiples videos de productos simultáneamente. Procesamiento por lotes para e-commerce. Planes Gratis, Pro y Pro+ disponibles.',
      keywords: [
        'generación video por lotes',
        'generador video masivo',
        'videos producto por lotes',
        'procesamiento por lotes e-commerce',
        'generación video csv',
      ],
      openGraph: {
        title: 'Generación de Video por Lotes | Genera Múltiples Videos a la Vez',
        description: 'Sube archivos Excel/CSV para generar múltiples videos de productos simultáneamente. Procesamiento por lotes para e-commerce.',
      },
      twitter: {
        title: 'Generación de Video por Lotes | Genera Múltiples Videos a la Vez',
        description: 'Sube archivos Excel/CSV para generar múltiples videos de productos simultáneamente. Procesamiento por lotes para e-commerce.',
      },
    },
    fr: {
      title: 'Génération de Vidéo par Lots | Générez Plusieurs Vidéos de Produits à la Fois',
      description:
        'Téléchargez des fichiers Excel/CSV pour générer plusieurs vidéos de produits simultanément. Traitement par lots pour l\'e-commerce. Plans Gratuit, Pro et Pro+ disponibles.',
      keywords: [
        'génération vidéo par lots',
        'générateur vidéo en masse',
        'vidéos produit par lots',
        'traitement par lots e-commerce',
        'génération vidéo csv',
      ],
      openGraph: {
        title: 'Génération de Vidéo par Lots | Générez Plusieurs Vidéos à la Fois',
        description: 'Téléchargez des fichiers Excel/CSV pour générer plusieurs vidéos de produits simultanément. Traitement par lots pour l\'e-commerce.',
      },
      twitter: {
        title: 'Génération de Vidéo par Lots | Générez Plusieurs Vidéos à la Fois',
        description: 'Téléchargez des fichiers Excel/CSV pour générer plusieurs vidéos de produits simultanément. Traitement par lots pour l\'e-commerce.',
      },
    },
    de: {
      title: 'Batch-Videogenerierung | Generieren Sie Mehrere Produktvideos auf Einmal',
      description:
        'Laden Sie Excel/CSV-Dateien hoch, um mehrere Produktvideos gleichzeitig zu generieren. Batch-Verarbeitung für E-Commerce. Kostenlose, Pro- und Pro+-Pläne verfügbar.',
      keywords: [
        'batch videogenerierung',
        'massenvideo generator',
        'batch produktvideos',
        'e-commerce batch verarbeitung',
        'csv videogenerierung',
      ],
      openGraph: {
        title: 'Batch-Videogenerierung | Generieren Sie Mehrere Videos auf Einmal',
        description: 'Laden Sie Excel/CSV-Dateien hoch, um mehrere Produktvideos gleichzeitig zu generieren. Batch-Verarbeitung für E-Commerce.',
      },
      twitter: {
        title: 'Batch-Videogenerierung | Generieren Sie Mehrere Videos auf Einmal',
        description: 'Laden Sie Excel/CSV-Dateien hoch, um mehrere Produktvideos gleichzeitig zu generieren. Batch-Verarbeitung für E-Commerce.',
      },
    },
    ja: {
      title: 'バッチ動画生成 | 複数の商品動画を一度に生成',
      description:
        'Excel/CSVファイルをアップロードして、複数の商品動画を同時に生成。Eコマース向けバッチ処理。無料、プロ、プロ+プラン利用可能。',
      keywords: [
        'バッチ動画生成',
        '一括動画生成器',
        'バッチ商品動画',
        'eコマースバッチ処理',
        'csv動画生成',
      ],
      openGraph: {
        title: 'バッチ動画生成 | 複数の動画を一度に生成',
        description: 'Excel/CSVファイルをアップロードして、複数の商品動画を同時に生成。Eコマース向けバッチ処理。',
      },
      twitter: {
        title: 'バッチ動画生成 | 複数の動画を一度に生成',
        description: 'Excel/CSVファイルをアップロードして、複数の商品動画を同時に生成。Eコマース向けバッチ処理。',
      },
    },
  },
};

/**
 * Get SEO metadata for a specific page type and locale
 */
export function getSEOMetadata(
  locale: string,
  pageType: PageType,
  pathname: string
): Metadata {
  const normalizedLocale = locale || 'en';
  
  // Check for page-specific translations first
  const pageSpecific = pageSpecificTranslations[pathname as PagePath];
  const pageTranslations = pageSpecific?.[normalizedLocale] || pageSpecific?.en;
  
  // Fall back to generic page type translations
  const genericTranslations = seoTranslations[pageType]?.[normalizedLocale] || seoTranslations[pageType]?.en;
  
  // Use page-specific if available, otherwise use generic
  const translations = pageTranslations || genericTranslations;
  
  const baseMetadata = buildLocaleCanonicalMetadata(normalizedLocale, pathname);

  return {
    ...baseMetadata,
    title: translations.title,
    description: translations.description,
    keywords: translations.keywords,
    openGraph: {
      ...translations.openGraph,
      type: 'website',
    },
    twitter: translations.twitter
      ? {
          card: 'summary_large_image',
          ...translations.twitter,
        }
      : undefined,
  };
}

