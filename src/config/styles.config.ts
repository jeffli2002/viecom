/**
 * E-commerce Image and Video Style Configurations
 * Based on PRD requirements for diverse e-commerce content generation
 */

export interface StyleConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  promptEnhancement?: string; // Additional prompt text to enhance the style
}

// Image Styles for E-commerce
export const IMAGE_STYLES: StyleConfig[] = [
  {
    id: 'studio-shot',
    name: 'studio-shot',
    displayName: '影棚拍摄',
    description: '专业产品摄影，纯色背景，专业灯光',
    promptEnhancement: 'professional product photography, studio lighting, clean white background, soft shadows, commercial quality, high resolution',
  },
  {
    id: 'lifestyle',
    name: 'lifestyle',
    displayName: '生活方式',
    description: '产品在真实生活场景中，自然光线，温馨氛围',
    promptEnhancement: 'lifestyle photography, natural setting, warm ambient lighting, cozy atmosphere, depth of field, real-life context',
  },
  {
    id: 'minimalist',
    name: 'minimalist',
    displayName: '极简主义',
    description: '简洁设计，留白充足，突出产品',
    promptEnhancement: 'minimalist design, clean composition, ample white space, focus on product, simple and elegant, modern aesthetic',
  },
  {
    id: 'seasonal',
    name: 'seasonal',
    displayName: '季节主题',
    description: '根据季节主题设计，节日氛围',
    promptEnhancement: 'seasonal theme, festive atmosphere, holiday styling, themed background, celebratory mood',
  },
  {
    id: 'infographic',
    name: 'infographic',
    displayName: '信息图表',
    description: '包含产品信息和数据展示',
    promptEnhancement: 'infographic style, product information overlay, data visualization, informative design, clear typography',
  },
];

// Video Styles for E-commerce
export const VIDEO_STYLES: StyleConfig[] = [
  {
    id: 'spoken-script',
    name: 'spoken-script',
    displayName: '口播文案型',
    description: '口播讲解产品，动态文字和产品镜头',
    promptEnhancement: 'spoken script style, voiceover narration, dynamic text overlay, product close-ups, engaging presentation, clear audio',
  },
  {
    id: 'product-comparison',
    name: 'product-comparison',
    displayName: '产品对比型',
    description: '产品对比展示，前后对比或竞品对比',
    promptEnhancement: 'product comparison style, side-by-side comparison, before and after, competitive analysis, clear visual contrast',
  },
  {
    id: 'narrative-comedy',
    name: 'narrative-comedy',
    displayName: '叙事/喜剧型',
    description: '故事化呈现，幽默有趣',
    promptEnhancement: 'narrative storytelling, comedic elements, engaging storyline, character-driven, entertaining and memorable',
  },
  {
    id: '360-showcase',
    name: '360-showcase',
    displayName: '360度展示',
    description: '产品360度旋转展示，全方位展示',
    promptEnhancement: '360-degree product rotation, smooth spin, professional studio lighting, clean background, seamless loop, all angles visible',
  },
  {
    id: 'product-demo',
    name: 'product-demo',
    displayName: '产品演示',
    description: '展示产品功能和使用场景',
    promptEnhancement: 'product demonstration, feature highlights, usage scenarios, close-up shots, smooth transitions, clear presentation',
  },
];

/**
 * Get style by ID
 */
export function getImageStyle(styleId: string): StyleConfig | undefined {
  return IMAGE_STYLES.find((style) => style.id === styleId);
}

export function getVideoStyle(styleId: string): StyleConfig | undefined {
  return VIDEO_STYLES.find((style) => style.id === styleId);
}

/**
 * Get default style
 */
export function getDefaultImageStyle(): StyleConfig {
  return IMAGE_STYLES[0]; // Studio Shot
}

export function getDefaultVideoStyle(): StyleConfig {
  return VIDEO_STYLES[0]; // Spoken Script
}



