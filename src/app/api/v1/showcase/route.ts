import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 根据文件名推断分类
function inferCategory(filename: string): string {
  const lowerName = filename.toLowerCase();
  
  // 分类关键词映射
  if (lowerName.includes('fashion') || lowerName.includes('apparel') || lowerName.includes('cloth')) {
    return 'Fashion';
  }
  if (lowerName.includes('beauty') || lowerName.includes('cosmetic') || lowerName.includes('skincare')) {
    return 'Beauty';
  }
  if (lowerName.includes('home') || lowerName.includes('furniture') || lowerName.includes('living')) {
    return 'Home';
  }
  if (lowerName.includes('tech') || lowerName.includes('gadget') || lowerName.includes('electronic')) {
    return 'Tech';
  }
  if (lowerName.includes('shoe') || lowerName.includes('footwear')) {
    return 'Shoes';
  }
  if (lowerName.includes('jewelry') || lowerName.includes('jewellery') || lowerName.includes('accessory')) {
    return 'Jewelry';
  }
  if (lowerName.includes('beverage') || lowerName.includes('drink') || lowerName.includes('food')) {
    return 'Beverage';
  }
  if (lowerName.includes('automotive') || lowerName.includes('car') || lowerName.includes('vehicle')) {
    return 'Automotive';
  }
  
  // 默认分类
  return 'Showcase';
}

// 根据文件名生成标题
function generateTitle(filename: string): string {
  // 移除扩展名
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // 移除 hash 和 UUID（通常以 _ 开头）
  let cleanName = nameWithoutExt.replace(/^_[a-f0-9]+_/, '').replace(/_[a-f0-9-]+$/, '');
  
  // 如果文件名包含括号，尝试提取括号内的内容
  const match = cleanName.match(/\(([^)]+)\)/);
  if (match) {
    cleanName = match[1];
  }
  
  // 将下划线和连字符替换为空格，并首字母大写
  const words = cleanName
    .replace(/[_-]/g, ' ')
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  
  return words.length > 0 ? words.join(' ') : 'Showcase Item';
}

// 根据文件名生成稳定的 hash ID
function generateItemId(filename: string): string {
  const hash = createHash('md5').update(filename).digest('hex');
  // 取前 12 位作为 ID
  return hash.substring(0, 12);
}

// 判断文件类型
function getFileType(filename: string): 'image' | 'video' {
  const lowerName = filename.toLowerCase();
  if (
    lowerName.endsWith('.mp4') ||
    lowerName.endsWith('.webm') ||
    lowerName.endsWith('.mov') ||
    lowerName.endsWith('.avi') ||
    lowerName.endsWith('.mkv')
  ) {
    return 'video';
  }
  return 'image';
}

export async function GET() {
  try {
    // 读取 public/showcase 目录
    const showcaseDir = join(process.cwd(), 'public', 'showcase');
    const files = await readdir(showcaseDir);

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
        message: 'No files found in public/showcase directory',
      });
    }

    // 过滤出图片和视频文件
    const mediaFiles = files.filter(
      (file) => {
        const lowerName = file.toLowerCase();
        return (
          lowerName.endsWith('.jpg') ||
          lowerName.endsWith('.jpeg') ||
          lowerName.endsWith('.png') ||
          lowerName.endsWith('.gif') ||
          lowerName.endsWith('.webp') ||
          lowerName.endsWith('.mp4') ||
          lowerName.endsWith('.webm') ||
          lowerName.endsWith('.mov') ||
          lowerName.endsWith('.avi') ||
          lowerName.endsWith('.mkv')
        );
      }
    );

    if (mediaFiles.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
        message: 'No media files found in public/showcase directory',
      });
    }

    // 按文件名排序以确保一致性
    const sortedFiles = [...mediaFiles].sort();

    // 为每个文件生成展示项
    const items = sortedFiles.map((filename) => {
      const fileType = getFileType(filename);
      const filePath = `/showcase/${filename}`;
      const itemId = generateItemId(filename);
      const category = inferCategory(filename);
      const title = generateTitle(filename);

      return {
        id: itemId,
        type: fileType,
        url: filePath,
        category,
        title,
        filename,
      };
    });

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('Failed to read showcase directory:', error);
    
    // 如果读取失败，返回空数组而不是错误
    return NextResponse.json(
      {
        success: true,
        items: [],
        message: 'Failed to read showcase directory',
      },
      { status: 200 }
    );
  }
}
