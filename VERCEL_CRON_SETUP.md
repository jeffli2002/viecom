# Vercel Cron Jobs 配置指南

## 📋 概述

Vercel 支持通过 `vercel.json` 配置文件自动设置 cron jobs。当 Vercel 调用 cron 端点时，会自动在请求头中包含 `Authorization: Bearer {CRON_SECRET}`。

## 🔧 配置步骤

### 1. 生成 CRON_SECRET

在本地生成一个安全的随机密钥：

```bash
pnpm tsx scripts/generate-cron-secret.ts
```

或者使用 Node.js：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. 在 Vercel 中配置环境变量

#### 方法 A: 通过 Vercel Dashboard（推荐）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目（例如：`viecom`）
3. 进入 **Settings** → **Environment Variables**
4. 添加新的环境变量：
   - **Key**: `CRON_SECRET`
   - **Value**: 你生成的密钥（例如：`STARokuG3a1LzsvB5g2ci7mjFA9Z5yfheyRojgP8/Zw=`）
   - **Environment**: 选择所有环境（Production, Preview, Development）
5. 点击 **Save**

#### 方法 B: 通过 Vercel CLI

```bash
# 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 登录
vercel login

# 添加环境变量
vercel env add CRON_SECRET production
# 然后粘贴你的密钥

vercel env add CRON_SECRET preview
vercel env add CRON_SECRET development
```

### 3. 验证配置

#### 检查 vercel.json

确保 `vercel.json` 包含所有需要的 cron jobs：

```json
{
  "crons": [
    {
      "path": "/api/cron/process-stuck-tasks",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/check-missing-signup-credits",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

#### 部署后验证

1. 部署到 Vercel：
   ```bash
   git push origin main
   ```

2. 在 Vercel Dashboard 中：
   - 进入 **Settings** → **Cron Jobs**
   - 确认所有 cron jobs 都已列出并启用
   - 检查状态是否为 "Active"

3. 手动测试 cron 端点：

```bash
# 获取你的 CRON_SECRET（从 Vercel Dashboard 或 .env.local）
export CRON_SECRET="your-secret-here"

# 测试端点
curl -X POST https://your-domain.com/api/cron/check-missing-signup-credits \
  -H "Authorization: Bearer $CRON_SECRET"
```

应该返回：
```json
{
  "success": true,
  "message": "Check completed",
  "data": {
    "totalUsers": 0,
    "fixed": 0,
    "skipped": 0
  }
}
```

## 📅 Cron Job 时间表

### 当前配置的 Cron Jobs

1. **process-stuck-tasks**
   - **路径**: `/api/cron/process-stuck-tasks`
   - **频率**: 每天午夜 (`0 0 * * *`)
   - **用途**: 处理卡住的视频/图片生成任务

2. **check-missing-signup-credits**
   - **路径**: `/api/cron/check-missing-signup-credits`
   - **频率**: 每 6 小时 (`0 */6 * * *`)
   - **用途**: 检查并修复缺失的注册奖励积分

### Cron 表达式格式

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── 星期几 (0-7, 0 和 7 都表示星期日)
│ │ │ └───── 月份 (1-12)
│ │ └─────── 日期 (1-31)
│ └───────── 小时 (0-23)
└─────────── 分钟 (0-59)
```

**常用示例**：
- `0 0 * * *` - 每天午夜
- `0 */6 * * *` - 每 6 小时
- `*/10 * * * *` - 每 10 分钟
- `0 9 * * 1` - 每周一上午 9 点

## 🔒 安全说明

### Vercel 如何传递 CRON_SECRET

当 Vercel 调用 cron 端点时，会自动：
1. 读取环境变量 `CRON_SECRET`
2. 在请求头中添加：`Authorization: Bearer {CRON_SECRET}`
3. 你的端点代码验证这个 token

### 端点验证逻辑

所有 cron 端点都包含类似的验证代码：

```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 安全最佳实践

1. ✅ **使用强随机密钥**：至少 32 字符
2. ✅ **不要提交到 Git**：密钥只在环境变量中
3. ✅ **定期轮换**：每 3-6 个月更换一次
4. ✅ **不同环境使用不同密钥**：开发、预览、生产环境分开
5. ✅ **监控未授权访问**：检查日志中的 401 错误

## 📊 监控 Cron Jobs

### Vercel Dashboard

1. 进入项目 → **Deployments**
2. 点击任意部署 → **Functions** 标签
3. 查看 cron job 的执行日志

### 查看执行历史

访问管理面板（如果已实现）：
```
https://your-domain.com/admin/cron-jobs
```

### 日志查询

在 Vercel Dashboard → **Logs** 中搜索：
- `[Cron]` - 所有 cron 相关日志
- `check-missing-signup-credits` - 特定 cron job
- `process-stuck-tasks` - 特定 cron job

## 🐛 故障排除

### 问题 1: Cron Job 未执行

**检查清单**：
- [ ] `vercel.json` 已提交到仓库
- [ ] 已部署到 Vercel
- [ ] 在 Vercel Dashboard → Settings → Cron Jobs 中看到 cron job
- [ ] Cron job 状态为 "Active"

**解决方案**：
1. 重新部署：`git push origin main`
2. 检查 Vercel Dashboard 中的 Cron Jobs 设置
3. 查看部署日志是否有错误

### 问题 2: 401 Unauthorized 错误

**原因**：`CRON_SECRET` 未设置或值不匹配

**解决方案**：
1. 确认在 Vercel 环境变量中设置了 `CRON_SECRET`
2. 确认值正确（没有多余空格）
3. 重新部署应用
4. 检查端点代码中的验证逻辑

### 问题 3: Cron Job 执行失败

**检查清单**：
- [ ] 查看 Vercel 日志中的错误信息
- [ ] 检查数据库连接是否正常
- [ ] 确认所有必需的环境变量都已设置
- [ ] 检查端点代码是否有错误

**解决方案**：
1. 查看详细的错误日志
2. 手动测试端点（使用 curl）
3. 检查数据库和 API 连接
4. 修复代码后重新部署

## 📝 更新 Cron Schedule

如果需要修改 cron 执行频率：

1. 编辑 `vercel.json`
2. 修改 `schedule` 字段
3. 提交并推送：
   ```bash
   git add vercel.json
   git commit -m "chore: update cron schedule"
   git push origin main
   ```
4. Vercel 会自动更新 cron job 配置

## 🔗 相关文档

- [Vercel Cron Jobs 官方文档](https://vercel.com/docs/cron-jobs)
- [Cron 表达式生成器](https://crontab.guru/)
- [项目 Cron Jobs 文档](./SIGNUP_CREDITS_RELIABILITY.md)
- [环境变量配置](./VERCEL_ENV_CHECKLIST.md)

