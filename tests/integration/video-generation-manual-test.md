# Video Generation E2E Manual Test Plan

## 测试目标

验证视频生成的完整流程，确保：
1. KIE.ai 成功时，用户能收到视频
2. 积分正确扣除
3. 数据库正确保存
4. 重试机制正常工作
5. 部分失败场景正确处理

## 测试环境准备

### 1. 前置条件
- [ ] 开发服务器运行在 `http://localhost:3000`
- [ ] 数据库连接正常
- [ ] R2 存储配置正确
- [ ] KIE API 密钥配置正确
- [ ] 测试用户有足够的积分（至少 30 credits）

### 2. 测试用户准备
```bash
# 使用脚本设置测试用户积分
pnpm tsx scripts/set-user-credits.ts test@example.com 100
```

## 测试场景

### 场景 1: 完整成功流程 ✅

**步骤：**
1. 登录测试账户
2. 导航到 `/en/video-generation`
3. 输入提示词：`A beautiful sunset over the ocean, cinematic, 4K quality`
4. 选择模型：`sora-2`
5. 选择时长：`10 seconds`
6. 点击生成按钮
7. 等待生成完成（2-5 分钟）

**预期结果：**
- ✅ 视频成功生成并显示
- ✅ 积分被扣除（30 credits for sora-2 720p 10s）
- ✅ 数据库中有完整的资产记录
- ✅ 积分交易记录存在
- ✅ 用户能看到视频 URL

**验证命令：**
```bash
# 检查数据库记录
npx tsx scripts/check-task-ids.ts

# 检查积分交易
# 查询 credit_transactions 表，查找最近的 'spend' 类型交易
```

### 场景 2: 数据库保存重试测试

**模拟场景：**
- 需要临时修改代码，在第一次保存时抛出错误
- 验证重试机制是否工作

**预期结果：**
- ✅ 重试最多 3 次
- ✅ 如果所有重试失败，创建 fallback 记录
- ✅ 视频 URL 仍然返回给用户
- ✅ 积分仍然被扣除

### 场景 3: 积分扣除重试测试

**模拟场景：**
- 需要临时修改代码，在第一次积分扣除时抛出错误
- 验证重试机制是否工作

**预期结果：**
- ✅ 重试最多 3 次
- ✅ 如果所有重试失败，记录关键错误
- ✅ 视频 URL 仍然返回给用户
- ✅ 在 metadata 中标记积分扣除失败

### 场景 4: KIE.ai 成功但部分失败

**测试步骤：**
1. 正常生成视频
2. 在数据库保存时模拟失败（但重试成功）
3. 验证最终结果

**预期结果：**
- ✅ 视频成功返回
- ✅ 积分正确扣除
- ✅ 数据库有记录（可能是 fallback 记录）

## 验证检查清单

### 数据库验证

```sql
-- 检查最近的视频生成记录
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
  description,
  metadata->>'taskId' as task_id,
  created_at
FROM credit_transactions
WHERE user_id = 'YOUR_USER_ID'
  AND source = 'api_call'
ORDER BY created_at DESC
LIMIT 5;
```

### API 验证

```bash
# 测试视频生成 API
curl -X POST http://localhost:3000/api/v1/generate-video \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "prompt": "A test video for E2E testing",
    "model": "sora-2",
    "mode": "t2v",
    "aspect_ratio": "16:9",
    "duration": 10,
    "quality": "standard"
  }'

# 检查响应
# 应该包含：
# - videoUrl
# - taskId
# - creditsUsed
# - assetId (如果保存成功)
```

### 日志验证

检查服务器日志，应该看到：
- `[Video Generation] Task created successfully`
- `[Video Generation] Task polling completed`
- `[Video Generation] Video downloaded successfully`
- `[Video Generation] Video uploaded to R2 successfully`
- `[Video Generation] Successfully saved asset to database`
- `[Video Generation] Successfully charged credits`

## 自动化测试脚本

运行自动化测试：

```bash
# E2E 测试（Playwright）
pnpm test:e2e tests/e2e/video-generation-flow.spec.ts

# 集成测试（Jest）
pnpm test:integration tests/integration/video-generation-api-flow.test.ts
```

## 问题排查

### 如果视频生成失败

1. 检查 KIE API 状态
2. 检查服务器日志
3. 检查数据库记录
4. 检查积分交易记录

### 如果积分未扣除

1. 检查 credit_transactions 表
2. 检查服务器日志中的错误
3. 检查是否有重试记录

### 如果数据库无记录

1. 检查 generated_asset 表
2. 检查是否有 fallback 记录
3. 检查服务器日志中的保存错误

## 测试报告模板

```
测试日期: [DATE]
测试人员: [NAME]
测试环境: [ENV]

场景 1: 完整成功流程
- 结果: [PASS/FAIL]
- 视频 URL: [URL]
- 任务 ID: [TASK_ID]
- 积分扣除: [YES/NO]
- 数据库记录: [YES/NO]

场景 2: 数据库保存重试
- 结果: [PASS/FAIL]
- 重试次数: [N]
- 最终状态: [SUCCESS/FAIL]

场景 3: 积分扣除重试
- 结果: [PASS/FAIL]
- 重试次数: [N]
- 最终状态: [SUCCESS/FAIL]

问题记录:
- [ISSUE 1]
- [ISSUE 2]
```

