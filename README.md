# E-commerce AI Content Studio

一个简单、优雅且高效的电商AI内容生成工具，用于批量生成高质量的产品图片和视频。

## 🎯 项目概述

本项目是一个基于 Next.js 15 的电商AI内容生成平台，支持文本到图片、图片到图片、文本到视频、图片到视频等多种生成模式。集成了完整的用户系统、积分系统、订阅计划和品牌调性分析功能。

## ✨ 核心功能

### 1. 用户认证系统
- ✅ **邮箱密码注册/登录**
- ✅ **Google OAuth 登录**
- ✅ **会话管理** (Better Auth)
- ✅ **密码重置** (Resend 邮件服务)
- ✅ **用户状态管理** (Zustand)

### 2. 积分系统
- ✅ **积分账户管理** - 自动创建和管理用户积分账户
- ✅ **注册奖励** - 新用户注册获得30积分
- ✅ **积分交易** - 支持赚取、消费、退款、冻结、解冻
- ✅ **交易历史** - 完整的积分交易记录
- ✅ **幂等性保证** - 防止重复交易
- ✅ **积分冻结机制** - 防止滥用

### 3. 订阅计划系统
- ✅ **Creem 支付集成** - 完整的订阅支付流程
- ✅ **订阅管理** - 创建、升级、降级、取消、重新激活
- ✅ **自动积分发放** - 订阅创建和续费时自动发放积分
- ✅ **Webhook 处理** - 处理支付事件和订阅状态变更
- ✅ **客户门户** - 生成客户管理门户链接
- ✅ **计划变更** - 升级/降级时自动调整积分

**订阅计划：**
- **Free Plan**: 30积分注册奖励，3次/天图片提取（10次/月），无限文本提示词生成
- **Pro Plan ($14.9/月)**: 500积分/月，300次图片提取/月，商业许可
- **Pro+ Plan ($24.9/月)**: 900积分/月，600次图片提取/月，商业许可

### 4. 配额管理系统
- ✅ **多维度配额跟踪** - API调用、存储、图片生成、视频生成、图片提取
- ✅ **日度和月度配额** - 支持按日/月跟踪使用量
- ✅ **配额初始化** - 新用户自动初始化配额
- ✅ **配额重置** - 支持配额重置功能

### 5. 图片生成模块 (增强版)
- ✅ **Text-to-Image** - 文本生成图片
- ✅ **Image-to-Image** - 图片到图片转换
- ✅ **品牌调性分析** - 通过公司网页URL分析品牌调性（DeepSeek AI）
  - 品牌个性关键词
  - 产品特性
  - 目标受众
  - 色彩调色板
  - 风格关键词
- ✅ **产品卖点输入** - 支持输入产品卖点，自动整合到提示词
- ✅ **Prompt 增强** - AI驱动的提示词优化（DeepSeek AI）
  - 集成品牌调性上下文
  - 集成产品卖点
  - 优化艺术方向、光照、构图
- ✅ **多模型支持** - Nano Banana (Gemini 2.5 Flash), Flux 1.1 Pro, Flux 1.1 Ultra
- ✅ **多种宽高比** - 1:1, 16:9, 9:16, 4:3, 3:2
- ✅ **图片预览和下载** - 支持预览、下载、分享

### 6. 升级提示系统
- ✅ **积分不足提示** - 当积分不足时自动显示升级弹窗
- ✅ **配额用完提示** - 当日度/月度配额用完时提示升级
- ✅ **智能推荐** - 根据用户当前计划推荐升级方案
- ✅ **计划对比** - 显示计划特性和价格

## 🛠 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **UI库**: Tailwind CSS + Radix UI + Shadcn/ui
- **状态管理**: Zustand
- **表单处理**: React Hook Form + Zod

### 后端
- **数据库**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **认证**: Better Auth
- **存储**: Cloudflare R2
- **邮件**: Resend

### AI 服务
- **图片生成**: KIE API (nano banana), Flux API, OpenRouter (Gemini)
- **视频生成**: KIE API (sora 2)
- **Prompt 增强**: DeepSeek AI
- **品牌分析**: DeepSeek AI

### 支付
- **支付提供商**: Creem
- **订阅管理**: Creem API

## 📁 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── auth/                 # 认证 API
│   │   ├── credits/              # 积分 API
│   │   ├── creem/                # Creem 支付 API
│   │   │   ├── checkout/         # 支付会话
│   │   │   ├── subscription/     # 订阅管理
│   │   │   └── customer-portal/  # 客户门户
│   │   ├── v1/                   # V1 API
│   │   │   ├── analyze-brand-tone/  # 品牌分析
│   │   │   ├── enhance-prompt/      # 提示词增强
│   │   │   └── generate-image/       # 图片生成
│   │   └── webhooks/             # Webhook 处理
│   │       └── creem/            # Creem Webhook
│   ├── image-generation/        # 图片生成页面
│   ├── login/                    # 登录页面
│   └── signup/                   # 注册页面
├── components/                    # React 组件
│   ├── auth/                     # 认证组件
│   │   └── UpgradePrompt.tsx     # 升级提示组件
│   ├── blocks/                    # 功能块组件
│   │   ├── login/                # 登录表单
│   │   └── signup/               # 注册表单
│   ├── image-generator.tsx       # 图片生成器（增强版）
│   └── ui/                       # UI 组件库
├── config/                       # 配置文件
│   ├── credits.config.ts         # 积分配置
│   └── payment.config.ts         # 支付配置
├── lib/                          # 工具库和服务
│   ├── auth/                     # 认证服务
│   ├── brand/                    # 品牌分析
│   │   └── brand-tone-analyzer.ts
│   ├── credits/                  # 积分服务
│   │   ├── credit-service.ts
│   │   └── index.ts
│   ├── creem/                    # Creem 服务
│   │   ├── creem-service.ts
│   │   ├── plan-utils.ts
│   │   └── subscription-utils.ts
│   ├── kie/                      # KIE API 集成
│   ├── quota/                    # 配额服务
│   │   └── quota-service.ts
│   └── storage/                  # R2 存储服务
│       └── r2.ts
├── payment/                      # 支付模块
│   ├── creem/                    # Creem 支付
│   │   ├── client.ts
│   │   └── provider.ts
│   └── types.ts                  # 支付类型定义
├── server/                       # 服务端代码
│   ├── actions/                  # Server Actions
│   │   └── payment/              # 支付相关
│   │       └── get-billing-info.ts
│   └── db/                       # 数据库
│       ├── repositories/         # 数据仓库
│       │   └── payment-repository.ts
│       ├── schema.ts             # 数据库 Schema
│       ├── types.ts              # 数据库类型
│       └── index.ts              # 数据库连接
├── store/                        # 状态管理
│   └── auth-store.ts            # 认证状态
└── hooks/                        # React Hooks
    ├── use-login.ts
    ├── use-toast-messages.ts
    └── use-upgrade-prompt.ts
```

## 🗄 数据库 Schema

### 用户和认证
- `user` - 用户信息
- `session` - 会话信息
- `account` - OAuth 账户
- `verification` - 验证码

### 积分系统
- `userCredits` - 用户积分账户（余额、总赚取、总消费、冻结余额）
- `creditTransactions` - 积分交易记录（类型、金额、来源、参考ID）

### 支付和订阅
- `payment` - 支付记录（订阅、一次性支付）
- `paymentEvent` - 支付事件日志（Stripe/Creem 事件）

### 配额管理
- `userQuotaUsage` - 配额使用记录（服务类型、周期、使用量）

### 内容生成
- `batchGenerationJob` - 批量生成任务
- `generatedAsset` - 生成的资产（图片/视频）
- `brandToneProfile` - 品牌调性配置
- `styleConfiguration` - 样式配置

### 系统配置
- `creditConsumptionConfig` - 积分消费配置
- `subscription` - 订阅信息
- `showcaseGallery` - 展示画廊
- `contentFlags` - 内容标志
- `systemConfig` - 系统配置
- `moderationLogs` - 审核日志

## 🔌 API 端点

### 认证
- `POST /api/auth/[...all]` - Better Auth 认证端点（登录、注册、OAuth等）

### 积分系统
- `POST /api/credits/initialize` - 初始化积分账户（注册时调用）
- `GET /api/credits/balance` - 获取积分余额
- `GET /api/credits/history` - 获取积分交易历史

### Creem 支付
- `POST /api/creem/checkout` - 创建支付会话
- `POST /api/creem/subscription/create` - 创建订阅
- `GET /api/creem/subscription/[subscriptionId]` - 获取订阅信息
- `PATCH /api/creem/subscription/[subscriptionId]` - 更新订阅
- `DELETE /api/creem/subscription/[subscriptionId]` - 取消订阅
- `POST /api/creem/subscription/[subscriptionId]/upgrade` - 升级订阅
- `POST /api/creem/subscription/[subscriptionId]/downgrade` - 降级订阅
- `POST /api/creem/subscription/[subscriptionId]/reactivate` - 重新激活订阅
- `POST /api/creem/customer-portal` - 生成客户门户链接
- `POST /api/webhooks/creem` - Creem Webhook 处理

### 图片生成
- `POST /api/v1/analyze-brand-tone` - 分析品牌调性（DeepSeek AI）
- `POST /api/v1/enhance-prompt` - 增强提示词（DeepSeek AI）
- `POST /api/v1/generate-image` - 生成图片（支持 T2I 和 I2I）

## ⚙️ 环境变量配置

### 必需配置
```bash
# 应用
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# 认证
BETTER_AUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI 服务
KIE_API_KEY="your-kie-api-key"
DEEPSEEK_API_KEY="your-deepseek-api-key"
OPENROUTER_API_KEY="your-openrouter-api-key"

# 存储
R2_BUCKET_NAME="your-bucket-name"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://your-domain.com"
```

### Creem 支付配置
```bash
CREEM_API_KEY="your-creem-api-key"
CREEM_WEBHOOK_SECRET="your-creem-webhook-secret"
CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY="your-pro-monthly-product-key"
CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY="your-proplus-monthly-product-key"
CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY="your-pro-yearly-product-key"
CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY="your-proplus-yearly-product-key"
NEXT_PUBLIC_CREEM_TEST_MODE="false"
```

### 可选配置
```bash
# 邮件服务
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# 管理
ADMIN_EMAILS="admin@example.com"
CRON_SECRET="your-cron-secret-key"

# Redis (可选)
REDIS_URL="redis://localhost:6379"
```

## 🚀 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量
```bash
cp env.example .env.local
# 编辑 .env.local 填写所有必需的配置
```

### 3. 设置数据库
```bash
# 生成迁移文件
pnpm db:generate

# 运行迁移
pnpm db:migrate
```

### 4. 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000

## 📊 积分消费规则

### 图片生成
- Nano Banana: 5 积分
- Flux 1.1 Pro: 5 积分
- Flux 1.1 Ultra: 8 积分

### 视频生成
- Sora 2: 15 积分

### 免费配额
- 图片生成: 1次/天，3次/月
- 视频生成: 0次/天，0次/月
- 图片提取: 3次/天，10次/月

## 🔐 安全特性

- ✅ Webhook 签名验证（Creem）
- ✅ 用户认证和授权
- ✅ 积分交易幂等性保证
- ✅ 配额限制和积分检查
- ✅ 环境变量验证（@t3-oss/env-nextjs）

## 📝 开发指南

### 代码检查
```bash
pnpm check
```

### 类型检查
```bash
pnpm typecheck
```

### 数据库管理
```bash
# 打开 Drizzle Studio
pnpm db:studio

# 推送 Schema 变更
pnpm db:push
```

## 🚢 部署

### 环境要求
- Node.js 18+
- PostgreSQL 数据库（推荐 Neon）
- Cloudflare R2 存储
- Creem 支付账户

### 部署步骤

1. **配置生产环境变量**
   - 在部署平台配置所有必需的环境变量
   - 确保 `NEXT_PUBLIC_APP_URL` 指向生产域名

2. **运行数据库迁移**
   ```bash
   pnpm db:migrate:deploy
   ```

3. **配置 Creem Webhook**
   - 在 Creem 后台配置 Webhook URL: `https://your-domain.com/api/webhooks/creem`
   - 设置 Webhook Secret

4. **构建和部署**
   ```bash
   pnpm build
   pnpm start
   ```

## 🎨 功能亮点

### 品牌调性分析
- 输入公司网站 URL，AI 自动分析品牌调性
- 提取品牌个性、产品特性、目标受众、色彩、风格关键词
- 分析结果自动整合到提示词增强中

### 智能提示词增强
- 集成品牌调性上下文
- 集成产品卖点
- AI 优化艺术方向、光照、构图
- 支持多种生成上下文（图片、视频）

### 完整的订阅管理
- 自动积分发放
- 订阅升级/降级时自动调整积分
- Webhook 处理所有支付事件
- 支持试用期和按比例计费

## 📚 相关文档

- [PRD 文档](./Product%20Requirements%20Document_%20E-commerce%20AI%20Image%20and%20Video%20Generator.md)
- [环境变量示例](./env.example)

## 📄 许可证

MIT
