# 生成功能测试指南

## 测试准备

### 1. 环境变量配置

确保 `.env.local` 文件包含以下配置：

```bash
# KIE API (图片和视频生成)
KIE_API_KEY=your-kie-api-key

# DeepSeek API (Prompt 增强)
DEEPSEEK_API_KEY=your-deepseek-api-key

# 应用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. 启动开发服务器

```bash
pnpm dev
```

服务器将在 `http://localhost:3000` 启动。

## 运行测试

### 完整测试套件

运行所有生成功能测试：

```bash
pnpm test:generation
```

### 测试内容

测试脚本将依次测试：

1. **Prompt 增强 (DeepSeek API)**
   - 测试使用 DeepSeek API 增强提示词
   - 包含品牌调性和产品卖点

2. **单个图片生成 - Text to Image (KIE API)**
   - 使用 KIE API 的 nano-banana 模型
   - 测试 T2I 模式

3. **单个图片生成 - Image to Image (KIE API)**
   - 使用 KIE API 的 nano-banana-image-to-image 模型
   - 测试 I2I 模式

4. **单个视频生成 - Text to Video (KIE API)**
   - 使用 KIE API 的 sora-2-text-to-video 模型
   - 测试 T2V 模式

5. **单个视频生成 - Image to Video (KIE API)**
   - 使用 KIE API 的 sora-2-image-to-video 模型
   - 测试 I2V 模式

6. **批量图片生成**
   - 上传 CSV 文件
   - 批量生成多张图片
   - 轮询任务状态直到完成

7. **批量视频生成**
   - 上传 CSV 文件
   - 批量生成多个视频
   - 轮询任务状态直到完成

## API 端点说明

### 单个图片生成

**POST** `/api/v1/generate-image`

```json
{
  "prompt": "A beautiful sunset over the ocean",
  "model": "nano-banana",
  "aspect_ratio": "1:1",
  "image": "https://example.com/image.jpg" // 可选，用于 I2I 模式
}
```

### 单个视频生成

**POST** `/api/v1/generate-video`

```json
{
  "prompt": "A peaceful morning scene with birds flying",
  "mode": "t2v", // 或 "i2v"
  "aspect_ratio": "16:9",
  "image": "https://example.com/image.jpg" // I2V 模式需要
}
```

### Prompt 增强

**POST** `/api/v1/enhance-prompt`

```json
{
  "prompt": "A beautiful sunset",
  "context": "image",
  "productSellingPoints": ["Eco-friendly", "Premium quality"],
  "styleKeywords": ["Modern", "Minimalist"]
}
```

### 批量生成

**POST** `/api/v1/workflow/batch`

FormData:
- `file`: CSV/Excel 文件
- `generationType`: "image" 或 "video"
- `mode`: "t2i", "i2i", "t2v", "i2v"

## 注意事项

1. **测试模式**: 测试脚本使用 `x-test-mode: true` 头，跳过认证和积分检查
2. **轮询超时**: 批量任务最多等待 5 分钟（60 次轮询，每次 5 秒）
3. **视频生成**: 视频生成可能需要更长时间，请耐心等待
4. **KIE API**: KIE API 使用异步任务模式，需要轮询任务状态

## 故障排除

### API Key 未配置

如果看到 "API key not configured" 错误，请检查 `.env.local` 文件。

### 任务超时

如果任务超时，可以：
1. 增加 `maxAttempts` 值
2. 检查 KIE API 服务状态
3. 查看服务器日志获取详细错误信息

### 批量任务失败

批量任务失败时，检查：
1. CSV 文件格式是否正确
2. 必填字段是否完整
3. 服务器日志中的错误信息



