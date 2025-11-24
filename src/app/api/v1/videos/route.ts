import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 视频分类映射（基于文件名）
const CATEGORY_MAP: Record<string, string> = {
  apparel: 'Apparel',
  beauty: 'Beauty',
  cat: 'Pet',
  pet: 'Pet',
  dog: 'Pet',
  lipstick: 'Beauty',
  electronics: 'Electronics',
  food: 'Food',
  shoes: 'Shoes',
  sports: 'Sports',
  furniture: 'Furniture',
  jewelry: 'Jewelry',
  cosmetics: 'Beauty',
};

// 默认提示词模板（基于分类）
const PROMPT_TEMPLATES: Record<string, string[]> = {
  Apparel: [
    'Cinematic slow motion of woman in floral dress walking through meadow at golden hour',
    'Elegant fashion model showcasing premium clothing with dynamic lighting',
    'Stylish outfit presentation with professional studio lighting',
  ],
  Beauty: [
    'Macro shot of perfume bottle with water ripples and floating petals, high end commercial',
    'Luxury cosmetics product showcase with cinematic lighting and reflections',
    'Professional beauty product photography with soft focus and elegant composition',
  ],
  Electronics: [
    '360 degree product spin of smartwatch with holographic data visualization overlay',
    'Modern tech product reveal with dynamic lighting and smooth camera movement',
    'High-tech gadget showcase with futuristic UI elements and sleek design',
  ],
  Food: [
    'Steam rising from fresh pizza, cheese pull close up, appetizing commercial lighting',
    'Gourmet food presentation with professional culinary photography',
    'Delicious meal showcase with vibrant colors and appetizing composition',
  ],
  Shoes: [
    'Sneaker floating in zero gravity, dynamic lighting, urban street background',
    'Premium footwear showcase with studio lighting and elegant presentation',
    'Athletic shoe in action with dynamic movement and professional photography',
  ],
  Sports: [
    'High energy fitness model lifting weights, sweat droplets, neon gym atmosphere',
    'Athletic performance showcase with dynamic action and professional lighting',
    'Sports equipment in action with motion blur and energetic composition',
  ],
  Furniture: [
    'Modern furniture in elegant living space with natural lighting',
    'Premium home decor showcase with sophisticated interior design',
    'Luxury furniture presentation with professional interior photography',
  ],
  Jewelry: [
    'Luxury jewelry close-up with sparkling reflections and elegant composition',
    'Premium accessories showcase with studio lighting and refined aesthetics',
    'High-end jewelry presentation with cinematic lighting and detail focus',
  ],
  Pet: [
    'Adorable pet in natural environment with soft lighting and warm tones',
    'Playful pet showcase with dynamic movement and professional pet photography',
    'Cute pet portrait with vibrant colors and engaging composition',
  ],
};

// 根据文件名推断分类
function inferCategory(filename: string): string {
  const lowerName = filename.toLowerCase();
  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    if (lowerName.includes(key)) {
      return category;
    }
  }
  return 'Apparel'; // 默认分类
}

// 根据分类获取随机提示词
function getPromptForCategory(category: string): string {
  const templates = PROMPT_TEMPLATES[category] || PROMPT_TEMPLATES['Apparel'];
  return templates[Math.floor(Math.random() * templates.length)] || templates[0] || '';
}

// 生成随机观看数
function generateViews(): string {
  const views = Math.floor(Math.random() * 5) + 1; // 1-5M
  const decimals = Math.random() < 0.5 ? '' : `.${Math.floor(Math.random() * 9) + 1}`;
  return `${views}${decimals}M`;
}

// 根据文件名生成稳定的 hash ID
function generateVideoId(filename: string): string {
  const hash = createHash('md5').update(filename).digest('hex');
  // 取前 12 位作为 ID（足够唯一且不会太长）
  return hash.substring(0, 12);
}

export async function GET() {
  try {
    // 读取 public/video 目录
    const videoDir = join(process.cwd(), 'public', 'video');
    const files = await readdir(videoDir);

    // 过滤出视频文件
    const videoFiles = files.filter(
      (file) =>
        file.endsWith('.mp4') ||
        file.endsWith('.webm') ||
        file.endsWith('.mov') ||
        file.endsWith('.avi')
    );

    if (videoFiles.length === 0) {
      return NextResponse.json({
        success: true,
        videos: [],
        message: 'No video files found in public/video directory',
      });
    }

    // 为每个视频生成演示项（按文件名排序以确保一致性）
    const sortedVideoFiles = [...videoFiles].sort();
    
    const videos = sortedVideoFiles.map((filename, index) => {
      const category = inferCategory(filename);
      const videoPath = `/video/${filename}`;
      const videoId = generateVideoId(filename);
      
      // 生成一个占位输入图片 URL（可以后续改进为实际图片）
      // 使用 hash 的一部分来生成不同的图片 ID
      const hashNum = parseInt(videoId.substring(0, 8), 16);
      const inputImageUrl = `https://images.unsplash.com/photo-${1500000000000 + (hashNum % 1000)}?auto=format&fit=crop&q=80&w=800`;

      return {
        id: videoId,
        category,
        input: inputImageUrl,
        video: videoPath,
        prompt: getPromptForCategory(category),
        views: generateViews(),
        ratio: index % 2 === 0 ? '16:9' : '9:16', // 交替使用不同的宽高比
        filename,
      };
    });

    return NextResponse.json({
      success: true,
      videos,
      count: videos.length,
    });
  } catch (error) {
    console.error('Failed to read video directory:', error);
    
    // 如果读取失败，返回空数组而不是错误
    return NextResponse.json(
      {
        success: true,
        videos: [],
        message: 'Failed to read video directory',
      },
      { status: 200 }
    );
  }
}

