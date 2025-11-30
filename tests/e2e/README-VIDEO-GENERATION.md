# Video Generation E2E 测试指南

## 测试文件说明

### 1. Playwright E2E 测试
**文件**: `tests/e2e/video-generation-flow.spec.ts`

**用途**: 测试前端到后端的完整用户流程

**运行方式**:
```bash
# 运行所有 e2e 测试
pnpm test:e2e

# 只运行视频生成测试
pnpm test:e2e:video

# 使用 UI 模式运行（推荐）
pnpm test:e2e:ui

# 有界面模式运行（可以看到浏览器）
pnpm test:e2e:headed
```

### 2. API 集成测试
**文件**: `tests/integration/video-generation-api-flow.test.ts`

**用途**: 测试 API 层面的完整流程

**运行方式**:
```bash
pnpm test:integration tests/integration/video-generation-api-flow.test.ts
```

### 3. 手动测试脚本
**文件**: `scripts/test-video-generation-flow.ts`

**用途**: 验证已生成的视频记录是否正确

**运行方式**:
```bash
# 检查特定用户的视频生成记录
pnpm test:video-flow <userId>

# 检查特定任务 ID
pnpm test:video-flow <userId> <taskId>

# 示例
pnpm test:video-flow 2YmBeot0u8jbw1CU0P7dRdDtQDXw4CIY
```

### 4. 手动测试计划
**文件**: `tests/integration/video-generation-manual-test.md

**用途**: 详细的手动测试步骤和检查清单

## 快速开始

### 前置条件

1. **启动开发服务器**
```bash
pnpm dev
```

2. **准备测试用户**
```bash
# 设置测试用户积分
pnpm tsx scripts/set-user-credits.ts test@example.com 100
```

3. **确保环境变量配置正确**
- `DATABASE_URL`
- `KIE_API_KEY`
- `R2_*` 配置

### 运行测试

#### 方式 1: 自动化 E2E 测试（推荐用于 CI/CD）

```bash
# 运行完整的 e2e 测试套件
pnpm test:e2e:video
```

#### 方式 2: 手动测试（推荐用于开发调试）

1. 按照 `tests/integration/video-generation-manual-test.md` 中的步骤操作
2. 使用 `pnpm test:video-flow <userId>` 验证结果

#### 方式 3: API 直接测试

```bash
# 使用 curl 测试 API
curl -X POST http://localhost:3000/api/v1/generate-video \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "prompt": "A test video",
    "model": "sora-2",
    "mode": "t2v",
    "aspect_ratio": "16:9",
    "duration": 10
  }'
```

## 测试覆盖范围

### ✅ 成功场景
- [x] 完整成功流程（KIE.ai 成功 → 数据库保存 → 积分扣除 → 返回视频）
- [x] 视频 URL 可访问性验证
- [x] 积分正确扣除验证
- [x] 数据库记录完整性验证

### ✅ 重试机制
- [x] 数据库保存重试（最多 3 次）
- [x] 积分扣除重试（最多 3 次）
- [x] 幂等性处理（referenceId 检查）

### ✅ 错误处理
- [x] KIE.ai 成功但数据库保存失败
- [x] KIE.ai 成功但积分扣除失败
- [x] 部分失败时的降级处理

### ✅ 数据一致性
- [x] 视频 URL 与数据库记录一致
- [x] 积分扣除与资产记录一致
- [x] 任务 ID 在所有记录中一致

## 验证检查点

### 1. 数据库验证

```sql
-- 检查视频资产记录
SELECT 
  id,
  user_id,
  asset_type,
  status,
  credits_spent,
  metadata->>'taskId' as task_id,
  public_url,
  created_at
FROM generated_asset
WHERE asset_type = 'video'
  AND user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;

-- 检查积分交易
SELECT 
  id,
  user_id,
  type,
  amount,
  source,
  metadata->>'taskId' as task_id,
  created_at
FROM credit_transactions
WHERE user_id = 'YOUR_USER_ID'
  AND source = 'api_call'
ORDER BY created_at DESC
LIMIT 5;
```

### 2. API 响应验证

成功的 API 响应应该包含：
```json
{
  "videoUrl": "https://...",
  "previewUrl": "...",
  "model": "sora-2",
  "prompt": "...",
  "duration": 10,
  "taskId": "...",
  "creditsUsed": 30,
  "assetId": "...",
  "warnings": []
}
```

### 3. 日志验证

检查服务器日志，应该看到：
- ✅ `[Video Generation] Task created successfully`
- ✅ `[Video Generation] Task polling completed`
- ✅ `[Video Generation] Video downloaded successfully`
- ✅ `[Video Generation] Video uploaded to R2 successfully`
- ✅ `[Video Generation] Successfully saved asset to database`
- ✅ `[Video Generation] Successfully charged credits`

## 常见问题

### Q: 测试失败，提示找不到元素
A: 确保页面已完全加载，可能需要增加等待时间

### Q: 测试超时
A: 视频生成需要 2-5 分钟，确保测试超时时间足够长

### Q: 数据库连接失败
A: 检查 `.env.local` 中的 `DATABASE_URL` 配置

### Q: 积分不足
A: 使用 `pnpm tsx scripts/set-user-credits.ts <email> <amount>` 设置测试用户积分

## 持续集成

在 CI/CD 中运行测试：

```yaml
# .github/workflows/test.yml 示例
- name: Run E2E tests
  run: |
    pnpm test:e2e:video
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    KIE_API_KEY: ${{ secrets.KIE_API_KEY }}
```

## 测试报告

运行测试后，查看报告：

```bash
# Playwright HTML 报告
npx playwright show-report

# Jest 覆盖率报告
pnpm test:coverage
```

## 贡献指南

添加新测试时，请确保：
1. 测试名称清晰描述测试场景
2. 包含必要的注释
3. 遵循现有的测试结构
4. 更新此 README 文档

