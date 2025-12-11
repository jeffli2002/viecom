/**
 * Schema.org structured data generators
 * Used for SEO and rich snippets in search results
 */

export interface SoftwareApplicationSchema {
  '@context': string;
  '@type': string;
  name: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    '@type': string;
    price: string;
    priceCurrency: string;
  };
  featureList?: string[];
  aggregateRating?: {
    '@type': string;
    ratingValue: string;
    ratingCount: string;
  };
}

export interface FAQPageSchema {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
}

export interface HowToSchema {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  step: Array<{
    '@type': string;
    name: string;
    text: string;
  }>;
}

export interface VideoObjectSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  contentUrl?: string;
  embedUrl?: string;
}

/**
 * Generate SoftwareApplication schema for product pages
 */
export function getSoftwareApplicationSchema(
  name: string,
  features: string[] = [],
  price = '0',
  rating?: { value: string; count: string }
): SoftwareApplicationSchema {
  const schema: SoftwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'USD',
    },
  };

  if (features.length > 0) {
    schema.featureList = features;
  }

  if (rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.value,
      ratingCount: rating.count,
    };
  }

  return schema;
}

/**
 * Generate FAQPage schema
 */
export function getFAQPageSchema(faqs: Array<{ question: string; answer: string }>): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate HowTo schema for tutorial pages
 */
export function getHowToSchema(
  name: string,
  steps: Array<{ name: string; text: string }>,
  description?: string
): HowToSchema {
  const schema: HowToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    step: steps.map((step) => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text,
    })),
  };

  if (description) {
    schema.description = description;
  }

  return schema;
}

/**
 * Generate VideoObject schema for embedded videos
 */
export function getVideoObjectSchema(
  name: string,
  description: string,
  options?: {
    thumbnailUrl?: string;
    uploadDate?: string;
    contentUrl?: string;
    embedUrl?: string;
  }
): VideoObjectSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    ...options,
  };
}
