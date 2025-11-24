#!/usr/bin/env tsx
/**
 * 检查生产环境静态资源是否可访问
 * 用法: pnpm tsx scripts/check-static-assets.ts [production-url]
 */

const productionUrl = process.argv[2] || 'http://localhost:3000';

const staticAssets = [
  // 图片样本
  '/imagesgen/changemodel1.jpg',
  '/imagesgen/targetmodel.jpg',
  '/imagesgen/changemode_output.png',
  '/imagesgen/virtual_tryon_garment.png',
  '/imagesgen/virtual_tryon_model.jpg',
  '/imagesgen/virtual_tryon_output.png',
  '/imagesgen/chair.jpg',
  '/imagesgen/livingroom.jpg',
  '/imagesgen/furniture_output.png',
  '/imagesgen/lotion.jpg',
  '/imagesgen/stream.jpg',
  '/imagesgen/scenechange_output.png',
  '/imagesgen/candles.jpg',
  '/imagesgen/christmas.jpg',
  '/imagesgen/christmas_output.png',

  // 批量图片
  '/batch/shoes.jpg',
  '/batch/skincare.jpg',
  '/batch/sweater.png',
  '/batch/lotionmodel.png',

  // 视频
  '/video/lipstick.mp4',
];

async function checkAsset(
  url: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      success: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  console.log(`\n🔍 检查静态资源访问: ${productionUrl}\n`);

  const results = await Promise.all(
    staticAssets.map(async (path) => {
      const url = `${productionUrl}${path}`;
      const result = await checkAsset(url);
      return { path, url, ...result };
    })
  );

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  console.log('📊 检查结果:\n');

  results.forEach(({ path, success, status, error }) => {
    const icon = success ? '✅' : '❌';
    const statusText = success ? `Status: ${status}` : `Error: ${error || status}`;
    console.log(`${icon} ${path} - ${statusText}`);
  });

  console.log(`\n📈 总计: ${successCount}/${results.length} 成功, ${failCount} 失败\n`);

  if (failCount > 0) {
    console.log('⚠️  部分资源无法访问，建议：');
    console.log('   1. 检查 public 文件夹是否被正确复制到构建输出');
    console.log('   2. 如果使用 standalone 模式，确认 public 文件夹在容器中');
    console.log('   3. 考虑迁移到 R2 以获得更好的性能和 CDN 支持\n');
    process.exit(1);
  } else {
    console.log('✅ 所有静态资源都可以正常访问！\n');
  }
}

main().catch(console.error);
