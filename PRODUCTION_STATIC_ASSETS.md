# 生产环境静态资源使用说明

## 当前情况

### 1. 静态资源位置
- **落地页图片样本**: `public/imagesgen/` 文件夹
- **批量图片样本**: `public/batch/` 文件夹  
- **视频样本**: `public/video/` 文件夹

### 2. 代码中的使用方式
- 图片路径: `/imagesgen/xxx.jpg`, `/batch/xxx.jpg`
- 视频路径: `/video/xxx.mp4`

## Next.js Public 文件夹在生产环境的行为

### ✅ 可以工作的情况
1. **Vercel 部署**: `public` 文件夹会被自动复制，路径可以正常工作
2. **标准 Next.js 部署**: `public` 文件夹会被包含在构建输出中

### ⚠️ 潜在问题
1. **Standalone 模式**: 虽然配置了 `output: 'standalone'`，但 public 文件夹应该仍然会被复制
2. **Docker 部署**: 需要确保 public 文件夹被正确复制到容器中
3. **CDN 性能**: public 文件夹的资源不会自动获得 CDN 加速（除非使用 Vercel Edge Network）

## 建议方案

### 方案 1: 继续使用 Public 文件夹（简单，适合 Vercel）
**优点**:
- 无需额外配置
- 在 Vercel 上可以正常工作
- 开发和生产环境一致

**缺点**:
- 资源会包含在构建包中，增加构建大小
- 没有独立的 CDN 加速（除非使用 Vercel Edge）

**适用场景**: 如果部署在 Vercel，且资源文件不大（<50MB）

### 方案 2: 迁移到 R2（推荐，更好的性能）
**优点**:
- CDN 加速，全球访问速度快
- 不占用服务器资源
- 更好的缓存控制
- 可以独立更新资源，无需重新部署

**缺点**:
- 需要配置 R2 公共访问
- 需要上传脚本
- 需要更新代码中的路径

**适用场景**: 
- 资源文件较大
- 需要全球 CDN 加速
- 希望资源与代码分离

## 推荐方案：迁移到 R2

### 步骤 1: 配置 R2 公共访问

1. 在 Cloudflare R2 中创建公共访问策略
2. 设置 `R2_PUBLIC_URL` 环境变量指向 R2 公共 URL

### 步骤 2: 创建上传脚本

创建 `scripts/upload-static-assets.ts`:

```typescript
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { r2StorageService } from '../src/lib/storage/r2';

async function uploadStaticAssets() {
  const folders = [
    { localPath: 'public/imagesgen', r2Folder: 'static/imagesgen' },
    { localPath: 'public/batch', r2Folder: 'static/batch' },
    { localPath: 'public/video', r2Folder: 'static/video' },
  ];

  for (const { localPath, r2Folder } of folders) {
    const files = await readdir(localPath);
    
    for (const file of files) {
      const filePath = join(localPath, file);
      const buffer = await readFile(filePath);
      const contentType = getContentType(file);
      
      const result = await r2StorageService.uploadFile(
        buffer,
        file,
        contentType,
        r2Folder
      );
      
      console.log(`Uploaded: ${file} -> ${result.url}`);
    }
  }
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
  };
  return types[ext || ''] || 'application/octet-stream';
}

uploadStaticAssets().catch(console.error);
```

### 步骤 3: 更新代码使用 R2 URL

创建环境变量配置：
```bash
# 在 .env 或生产环境变量中
NEXT_PUBLIC_STATIC_ASSETS_BASE_URL="https://your-r2-public-url.com/static"
```

或者直接使用 R2_PUBLIC_URL：
```bash
NEXT_PUBLIC_STATIC_ASSETS_BASE_URL="${R2_PUBLIC_URL}/static"
```

### 步骤 4: 创建工具函数

创建 `src/lib/utils/static-assets.ts`:

```typescript
export function getStaticAssetUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_STATIC_ASSETS_BASE_URL || '';
  
  // 开发环境使用本地路径
  if (process.env.NODE_ENV === 'development' || !baseUrl) {
    return path;
  }
  
  // 生产环境使用 R2 URL
  return `${baseUrl}${path}`;
}
```

### 步骤 5: 更新组件代码

将代码中的路径从：
```typescript
image: '/imagesgen/changemodel1.jpg'
```

改为：
```typescript
import { getStaticAssetUrl } from '@/lib/utils/static-assets';
image: getStaticAssetUrl('/imagesgen/changemodel1.jpg')
```

## 快速检查清单

### 如果使用 Public 文件夹（Vercel）
- [x] 确认部署在 Vercel
- [x] 检查构建日志，确认 public 文件夹被复制
- [x] 测试生产环境 URL 访问

### 如果迁移到 R2
- [ ] 配置 R2 公共访问
- [ ] 设置 R2_PUBLIC_URL 环境变量
- [ ] 运行上传脚本
- [ ] 更新代码使用 R2 URL
- [ ] 测试生产环境访问

## 当前建议

**对于 Vercel 部署**: 可以继续使用 public 文件夹，它会正常工作。

**如果遇到性能问题或需要更好的 CDN**: 考虑迁移到 R2。

## 测试生产环境

运行以下命令测试当前配置：

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 访问 http://localhost:3000 检查图片/视频是否正常加载
```

