# 定价描述最终更新总结

## ✅ 更新完成

所有定价和积分信息已改为使用变量，并统一使用 "up to XX image generation or XX video generation" 格式。

---

## 📝 更新的文件

### 1. `src/config/payment.config.ts`
**保持简洁配置**：
```typescript
pro: {
  credits: { monthly: 500 },
  features: [
    '500 credits/month',  // 👈 简洁，运行时动态扩展
    'All image generation features',
    'Sora 2 & Sora 2 Pro video models',
    'Batch generation (3 concurrent)',
    // ...
  ]
}

proplus: {
  credits: { monthly: 900 },
  features: [
    '900 credits/month',  // 👈 简洁，运行时动态扩展
    'Everything in Pro',
    'Advanced AI models (Sora 2 Pro)',
    'Priority queue processing (10 concurrent)',
    // ...
  ]
}
```

### 2. `src/app/[locale]/pricing/page.tsx`
**运行时动态计算并替换**：
```typescript
const plans = paymentConfig.plans.map((plan) => {
  const monthlyCredits = plan.credits.monthly || plan.credits.onSignup || 0;
  
  // 基于 Nano Banana (5积分) 和 Sora 2 720P (20积分) 计算容量
  const imageCount = Math.floor(
    monthlyCredits / creditsConfig.consumption.imageGeneration['nano-banana']
  );
  const videoCount = Math.floor(
    monthlyCredits / creditsConfig.consumption.videoGeneration['sora-2-720p-15s']
  );
  
  // 动态生成功能列表
  const features = [...plan.features];
  
  // 替换第一项为详细容量描述
  if (monthlyCredits > 0 && features[0].includes('credits/month')) {
    features[0] = `${monthlyCredits} credits/month (up to ${imageCount} image generation or ${videoCount} video generation)`;
  }
  
  return { ...plan, features };
});
```

**实际显示效果**：
- **Pro**: `500 credits/month (up to 100 image generation or 25 video generation)`
- **Pro+**: `900 credits/month (up to 180 image generation or 45 video generation)`

### 3. `src/components/auth/UpgradePrompt.tsx`
**运行时动态计算并替换**：
```typescript
// 计算容量（基于 Nano Banana 和 Sora 2 720P）
const approxImages = Math.floor(
  targetPlanCredits / creditsConfig.consumption.imageGeneration['nano-banana']
);
const approxVideos = Math.floor(
  targetPlanCredits / creditsConfig.consumption.videoGeneration['sora-2-720p-15s']
);

// 替换功能列表第一项
if (targetPlanCredits > 0 && features.length > 0) {
  features[0] = {
    icon: Zap,
    text: `${targetPlanCredits} credits/month (up to ${approxImages} image generation or ${approxVideos} video generation)`,
  };
}
```

**实际显示效果**（弹窗中）：
- **Pro**: `⚡ 500 credits/month (up to 100 image generation or 25 video generation)`
- **Pro+**: `⚡ 900 credits/month (up to 180 image generation or 45 video generation)`

---

## 🎯 计算基准

### 基于的模型和价格

| 类型 | 模型 | 配置键 | 积分消耗 |
|------|------|--------|---------|
| **图片** | Nano Banana | `creditsConfig.consumption.imageGeneration['nano-banana']` | 5积分 |
| **视频** | Sora 2 720P 15s | `creditsConfig.consumption.videoGeneration['sora-2-720p-15s']` | 20积分 |

**为什么选择这两个基准**：
- ✅ Nano Banana: 标准图片模型，最常用
- ✅ Sora 2 720P: 最经济的视频选项，作为容量参考

---

## 📊 各套餐显示效果

### Free 套餐
```
价格: $0

功能:
✓ 30 credits on signup (one-time)
✓ Daily check-in rewards (2 credits/day)
✓ Text-to-image generation
✓ Text-to-video generation
✓ Batch generation (1 concurrent)  👈 支持批量
✓ Basic image styles
✓ 1GB storage
✓ Standard quality
✓ Community support
```

### Pro 套餐
```
价格: $14.9/月
积分: 500 credits/month
容量: up to 100 image generation or 25 video generation

功能:
✓ 500 credits/month (up to 100 image generation or 25 video generation)  👈 动态生成
✓ All image generation features
✓ Sora 2 & Sora 2 Pro video models
✓ Brand analysis
✓ Batch generation (3 concurrent)  👈 3倍速度
✓ No watermarks
✓ Commercial license
✓ 10GB storage
✓ HD quality exports
✓ Priority support
```

### Pro+ 套餐
```
价格: $24.9/月
积分: 900 credits/month
容量: up to 180 image generation or 45 video generation

功能:
✓ 900 credits/month (up to 180 image generation or 45 video generation)  👈 动态生成
✓ Everything in Pro
✓ Advanced AI models (Sora 2 Pro)
✓ Priority queue processing (10 concurrent)  👈 10倍速度
✓ API access
✓ Unlimited storage
✓ 4K quality exports
✓ White-label options
✓ Dedicated account manager
✓ 24/7 priority support
```

---

## 🔍 变量使用验证

### Pricing Page
```typescript
✅ imageCount = Math.floor(monthlyCredits / creditsConfig.consumption.imageGeneration['nano-banana'])
✅ videoCount = Math.floor(monthlyCredits / creditsConfig.consumption.videoGeneration['sora-2-720p-15s'])
✅ features[0] = `${monthlyCredits} credits/month (up to ${imageCount} image generation or ${videoCount} video generation)`
```

### UpgradePrompt
```typescript
✅ approxImages = Math.floor(targetPlanCredits / imageCreditCost)
✅ approxVideos = Math.floor(targetPlanCredits / videoCreditCost)
✅ features[0].text = `${targetPlanCredits} credits/month (up to ${approxImages} image generation or ${approxVideos} video generation)`
```

### 视频生成提示
```typescript
✅ `Video costs range from ${creditsConfig.consumption.videoGeneration['sora-2-720p-10s']} credits (Sora 2) 
   to ${creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s']} credits (Sora 2 Pro 1080P)`
```

### 奖励积分
```typescript
✅ Daily check-in (+${creditsConfig.rewards.checkin.dailyCredits})
✅ Referrals (+${creditsConfig.rewards.referral.creditsPerReferral})
✅ Social share (+${creditsConfig.rewards.socialShare.creditsPerShare})
```

---

## 🎯 关键优势

### ✅ **完全无硬编码**
- 所有数字都从配置文件计算
- 修改配置立即生效

### ✅ **统一描述格式**
- "up to XX image generation or XX video generation"
- 清晰直观的容量表达

### ✅ **准确的基准**
- 图片: 基于 Nano Banana (5积分)
- 视频: 基于 Sora 2 720P 15s (20积分)

### ✅ **自动同步**
- Pricing Page 和 UpgradePrompt 使用相同的计算逻辑
- 保证信息一致性

---

## 💡 用户理解

### 容量说明的含义

**"up to 100 image generation or 25 video generation"**

意思是：
- 如果全部用于生成图片（Nano Banana）: 最多100张
- 如果全部用于生成视频（Sora 2 720P）: 最多25个
- 实际使用可以混合搭配

**示例**：
```
Pro 套餐 500积分 可以：
- 100张图片 (100 × 5 = 500)
- 或 25个视频 (25 × 20 = 500)
- 或 50张图片 + 10个视频 (50×5 + 10×20 = 450)
- 或 80张图片 + 5个视频 (80×5 + 5×20 = 500)
```

---

## ✅ 更新验证清单

- [x] Pricing Page 使用 "up to" 格式
- [x] UpgradePrompt 使用 "up to" 格式
- [x] 基于 Nano Banana (5积分) 计算图片容量
- [x] 基于 Sora 2 720P (20积分) 计算视频容量
- [x] 所有价格使用变量
- [x] 所有积分消耗使用变量
- [x] 所有奖励值使用变量
- [x] 无硬编码数字
- [x] 无 lint 错误
- [x] 配置文件保持简洁

---

**更新日期**: 2024
**状态**: ✅ 完成
**格式**: "up to XX image generation or XX video generation"
**基准**: Nano Banana (5积分) + Sora 2 720P (20积分)

