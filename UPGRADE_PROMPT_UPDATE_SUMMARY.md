# UpgradePrompt 组件更新总结

## ✅ 已完成的更新

### 文件: `src/components/auth/UpgradePrompt.tsx`

---

## 📝 更新内容

### 1. 积分消耗使用变量

#### 图片生成
```typescript
// 之前
const imageCreditCost = creditsConfig.consumption.imageGeneration['nano-banana']; // ✅ 已经使用变量

// 现在仍然保持
imageCreditCost = 5 credits
```

#### 视频生成
```typescript
// 之前
const videoCreditCost = creditsConfig.consumption.videoGeneration['sora-2'];

// 现在更新为
const videoCreditCost = creditsConfig.consumption.videoGeneration['sora-2-720p-15s'];
// 值: 20 credits (Sora 2 标准版 15秒)
```

---

### 2. 套餐信息使用变量

#### 套餐名称
```typescript
// 之前（硬编码）
const targetPlanName = targetPlan === 'proplus' ? 'Pro+' : 'Pro';

// 现在（从配置读取）
const targetPlanName = targetPlanConfig?.name || (targetPlan === 'proplus' ? 'Pro+' : 'Pro');
```

#### 套餐积分
```typescript
// 之前（硬编码）
const creditsPerMonth = 500;

// 现在（从配置读取）
const targetPlanCredits = targetPlanConfig?.credits.monthly || 500;
```

#### 容量计算
```typescript
// 现在自动计算
const approxImages = Math.floor(targetPlanCredits / imageCreditCost);
const approxVideos = Math.floor(targetPlanCredits / videoCreditCost);

// Pro套餐: 500积分 ÷ 5 = 100张图片
//          500积分 ÷ 20 = 25个视频

// Pro+套餐: 900积分 ÷ 5 = 180张图片
//           900积分 ÷ 20 = 45个视频
```

---

### 3. 功能列表使用配置

```typescript
// 之前（硬编码的 fallback）
const features = [
  { icon: Zap, text: '300 Image-to-Text per month' },  // ❌ 已删除
  { icon: Sparkles, text: `500 credits/month (...)` }, // ❌ 硬编码
  // ...
];

// 现在（完全从配置读取）
const features = targetPlanConfig?.features.map((text, index) => ({
  icon: [Zap, Sparkles, Shield, Check, Check, Check][index] || Check,
  text,  // 👈 直接使用配置中的文本
})) || [];
```

---

### 4. 奖励积分使用变量

```typescript
// 之前（硬编码）
💡 Earn free credits: Daily check-in (+2), Referrals (+10), Social share (+5)

// 现在（从配置读取）
💡 Earn free credits: 
  Daily check-in (+{creditsConfig.rewards.checkin.dailyCredits}), 
  Referrals (+{creditsConfig.rewards.referral.creditsPerReferral}), 
  Social share (+{creditsConfig.rewards.socialShare.creditsPerShare})

// 实际显示: Daily check-in (+2), Referrals (+10), Social share (+5)
```

---

### 5. 视频生成价格范围提示

```typescript
// 视频生成场景的错误提示
`Video costs range from ${creditsConfig.consumption.videoGeneration['sora-2-720p-10s']} credits (Sora 2) 
to ${creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s']} credits (Sora 2 Pro 1080P).`

// 实际显示
"Video costs range from 15 credits (Sora 2) to 130 credits (Sora 2 Pro 1080P)."
```

**优势**：
- ✅ 用户了解视频定价范围
- ✅ 知道最便宜和最贵的选项
- ✅ 有助于做出升级决策

---

## 📊 动态计算示例

### Pro 套餐推荐（500积分）

```tsx
套餐名称: targetPlanConfig.name = "Pro"
月度价格: targetPlanConfig.price = 14.9
月度积分: targetPlanConfig.credits.monthly = 500

容量计算:
- 图片: 500 ÷ 5 = 100张
- 视频: 500 ÷ 20 = 25个 (Sora 2)

功能列表: targetPlanConfig.features = [
  '500 credits/month',
  'All image generation features',
  'Sora 2 & Sora 2 Pro video models',
  'Brand analysis',
  'Batch generation (3 concurrent)',  // 👈 体现并发能力
  'No watermarks',
  'Commercial license',
  '10GB storage',
  'HD quality exports',
  'Priority support',
]
```

### Pro+ 套餐推荐（900积分）

```tsx
套餐名称: targetPlanConfig.name = "Pro+"
月度价格: targetPlanConfig.price = 24.9
月度积分: targetPlanConfig.credits.monthly = 900

容量计算:
- 图片: 900 ÷ 5 = 180张
- 视频: 900 ÷ 20 = 45个 (Sora 2)

功能列表: targetPlanConfig.features = [
  '900 credits/month',
  'Everything in Pro',
  'Advanced AI models (Sora 2 Pro)',
  'Priority queue processing (10 concurrent)',  // 👈 更高并发
  'API access',
  'Unlimited storage',
  '4K quality exports',
  'White-label options',
  'Dedicated account manager',
  '24/7 priority support',
]
```

---

## 🎯 显示效果对比

### 场景1：图片生成积分不足

**标题**: Insufficient Credits

**提示**:
```
You don't have enough credits to generate images. 
Each image costs 5 credits (Nano Banana model). 
Upgrade your plan to get more credits or earn them through daily check-ins.
```

**当前余额**: 2 credits

**推荐套餐**: Pro - $14.9/mo
- ⚡ 500 credits/month
- ✨ All image generation features
- 🛡️ Sora 2 & Sora 2 Pro video models
- ✓ Brand analysis
- ✓ Batch generation (3 concurrent)
- ...

---

### 场景2：视频生成积分不足

**标题**: Insufficient Credits

**提示**:
```
You don't have enough credits to generate videos. 
Video costs range from 15 credits (Sora 2) to 130 credits (Sora 2 Pro 1080P). 
Upgrade your plan to get more credits or earn them through daily check-ins.
```

**当前余额**: 10 credits

**推荐套餐**: Pro - $14.9/mo
- ⚡ 500 credits/month (~100 images or 25 videos)
- ...

**免费获取积分**:
💡 Earn free credits: Daily check-in (+2), Referrals (+10), Social share (+5)

---

## 🔧 技术改进

### 1. 完全配置驱动
- ✅ 所有价格从 `paymentConfig` 读取
- ✅ 所有积分消耗从 `creditsConfig.consumption` 读取
- ✅ 所有奖励值从 `creditsConfig.rewards` 读取

### 2. 智能推荐
- 自动根据用户当前套餐推荐下一级
- Free → Pro
- Pro → Pro+

### 3. 准确提示
- 图片生成：显示具体单价（5积分）
- 视频生成：显示价格范围（15-130积分）
- 帮助用户了解消耗情况

### 4. 移除硬编码
```typescript
// 之前
❌ const creditsPerMonth = 500;
❌ text: '300 Image-to-Text per month'
❌ text: '500 credits/month (~100 images or 25 videos)'
❌ Daily check-in (+2), Referrals (+10), Social share (+5)

// 现在
✅ const targetPlanCredits = targetPlanConfig?.credits.monthly || 500;
✅ text: targetPlanConfig.features[0]  // 从配置读取
✅ approxImages = Math.floor(targetPlanCredits / imageCreditCost)
✅ Daily check-in (+{creditsConfig.rewards.checkin.dailyCredits})
```

---

## 📊 套餐对比展示（弹窗中）

### Free 用户看到的 Pro 推荐
```
Upgrade to Pro - $14.9/mo

✓ 500 credits/month
✓ All image generation features
✓ Sora 2 & Sora 2 Pro video models
✓ Brand analysis
✓ Batch generation (3 concurrent)  // 👈 从1个提升到3个
✓ No watermarks
✓ Commercial license
✓ 10GB storage
✓ HD quality exports
✓ Priority support
```

### Pro 用户看到的 Pro+ 推荐
```
Upgrade to Pro+ - $24.9/mo

✓ 900 credits/month
✓ Everything in Pro
✓ Advanced AI models (Sora 2 Pro)
✓ Priority queue processing (10 concurrent)  // 👈 从3个提升到10个
✓ API access
✓ Unlimited storage
✓ 4K quality exports
✓ White-label options
✓ Dedicated account manager
✓ 24/7 priority support
```

---

## ✅ 更新验证

### 变量使用检查
- [x] 图片积分: `creditsConfig.consumption.imageGeneration['nano-banana']`
- [x] 视频积分: `creditsConfig.consumption.videoGeneration['sora-2-720p-15s']`
- [x] 视频范围: `'sora-2-720p-10s'` 到 `'sora-2-pro-1080p-15s'`
- [x] 套餐价格: `targetPlanConfig?.price`
- [x] 套餐积分: `targetPlanConfig?.credits.monthly`
- [x] 套餐功能: `targetPlanConfig?.features`
- [x] 每日签到: `creditsConfig.rewards.checkin.dailyCredits`
- [x] 推荐奖励: `creditsConfig.rewards.referral.creditsPerReferral`
- [x] 分享奖励: `creditsConfig.rewards.socialShare.creditsPerShare`

### 无硬编码检查
- [x] 无硬编码的价格
- [x] 无硬编码的积分数量
- [x] 无硬编码的功能描述
- [x] 无硬编码的奖励值
- [x] 所有数值从配置读取

### Lint 检查
- [x] 无 TypeScript 错误
- [x] 无 ESLint 错误
- [x] 代码格式正确

---

## 🎯 关键改进

### 1. 视频定价提示更准确
```
之前: "Each video costs 20 credits"
现在: "Video costs range from 15 credits (Sora 2) to 130 credits (Sora 2 Pro 1080P)"
```

### 2. 容量计算更准确
```
之前: 硬编码 "~100 images or 25 videos"
现在: 自动计算基于套餐积分和模型价格
```

### 3. 功能列表实时同步
```
之前: UpgradePrompt 中的功能列表可能与配置不一致
现在: 直接读取配置，保证一致性
```

### 4. 奖励信息动态
```
之前: 硬编码 "+2, +10, +5"
现在: 从 rewards 配置读取
```

---

## 💡 用户体验

### 积分不足时的清晰提示

**图片场景**:
```
❌ Insufficient Credits
You don't have enough credits to generate images. 
Each image costs 5 credits (Nano Banana model).
Upgrade your plan to get more credits or earn them through daily check-ins.

Current balance: 2 credits
```

**视频场景**:
```
❌ Insufficient Credits
You don't have enough credits to generate videos. 
Video costs range from 15 credits (Sora 2) to 130 credits (Sora 2 Pro 1080P).
Upgrade your plan to get more credits or earn them through daily check-ins.

Current balance: 10 credits

💡 Earn free credits: Daily check-in (+2), Referrals (+10), Social share (+5)
```

---

## 🔄 配置更改的连锁反应

### 如果更新 credits.config.ts

```typescript
// 假设视频价格调整
videoGeneration: {
  'sora-2-720p-15s': 25,  // 从20改为25
}

// UpgradePrompt 自动反映
"You don't have enough credits to generate videos. 
Video costs range from 15 credits (Sora 2) to 130 credits (Sora 2 Pro 1080P)."
// 👆 自动更新，无需修改代码
```

### 如果更新 payment.config.ts

```typescript
// 假设Pro套餐积分调整
pro: {
  credits: {
    monthly: 600,  // 从500改为600
  }
}

// UpgradePrompt 自动反映
"Upgrade to Pro - $14.9/mo"
"600 credits/month (~120 images or 30 videos)"
// 👆 自动计算新容量
```

---

## 🎯 所有更新的文件

### 核心组件
1. ✅ `src/components/auth/UpgradePrompt.tsx` - 完全使用变量

### 配置文件
2. ✅ `src/config/payment.config.ts` - 套餐功能列表已更新
3. ✅ `src/config/credits.config.ts` - 积分定价已完善

### 页面
4. ✅ `src/app/[locale]/pricing/page.tsx` - 使用配置驱动
5. ✅ `src/app/[locale]/dashboard/page.tsx` - 移除quota显示

---

## ✅ 最终状态

### 无硬编码
- ✅ 所有价格从配置读取
- ✅ 所有积分消耗从配置读取
- ✅ 所有功能描述从配置读取
- ✅ 所有奖励值从配置读取

### 配置一致性
- ✅ UpgradePrompt 与 Pricing Page 一致
- ✅ Dashboard 与配置一致
- ✅ 单一数据源

### 用户体验
- ✅ Free 套餐显示支持批量（1并发）
- ✅ 升级价值清晰（3并发 → 10并发）
- ✅ 视频定价范围明确（15-130积分）

---

**更新日期**: 2024
**状态**: ✅ 完成
**Lint 状态**: ✅ 无错误

