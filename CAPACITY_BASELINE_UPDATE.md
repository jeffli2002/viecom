# 容量计算基准更新

## ✅ 更新内容

### 视频容量计算基准调整

**从**: Sora 2 720P **15秒** (20积分)  
**改为**: Sora 2 720P **10秒** (15积分)

**原因**: 使用最便宜的视频选项作为容量基准，让用户看到最大可能的数量。

---

## 📊 容量变化对比

### Pro 套餐（500积分）

| 类型 | 旧基准 (20积分) | 新基准 (15积分) | 变化 |
|------|----------------|----------------|------|
| **图片** | up to 100 | up to 100 | 不变 ✅ |
| **视频** | up to 25 | **up to 33** | +32% ⬆️ |

### Pro+ 套餐（900积分）

| 类型 | 旧基准 (20积分) | 新基准 (15积分) | 变化 |
|------|----------------|----------------|------|
| **图片** | up to 180 | up to 180 | 不变 ✅ |
| **视频** | up to 45 | **up to 60** | +33% ⬆️ |

---

## 🎯 更新的文件

### 1. `src/app/[locale]/pricing/page.tsx`

```typescript
// 之前
const videoCount = Math.floor(
  monthlyCredits / creditsConfig.consumption.videoGeneration['sora-2-720p-15s']
);
// 500 ÷ 20 = 25

// 现在
const videoCount = Math.floor(
  monthlyCredits / creditsConfig.consumption.videoGeneration['sora-2-720p-10s']
);
// 500 ÷ 15 = 33 ✨
```

### 2. `src/components/auth/UpgradePrompt.tsx`

```typescript
// 之前
const videoCreditCost = creditsConfig.consumption.videoGeneration['sora-2-720p-15s'];
// 20积分

// 现在
const videoCreditCost = creditsConfig.consumption.videoGeneration['sora-2-720p-10s'];
// 15积分 ✨
```

---

## 📈 新的显示效果

### Pricing Page

#### Pro 套餐
```
$14.9/月
500 credits/month

✓ 500 credits/month (up to 100 image generation or 33 video generation)
                                                        ^^^ 从25变为33
✓ All image generation features
✓ Sora 2 & Sora 2 Pro video models
✓ Brand analysis
✓ Batch generation (3 concurrent)
...
```

#### Pro+ 套餐
```
$24.9/月
900 credits/month

✓ 900 credits/month (up to 180 image generation or 60 video generation)
                                                        ^^^ 从45变为60
✓ Everything in Pro
✓ Advanced AI models (Sora 2 Pro)
✓ Priority queue processing (10 concurrent)
...
```

### UpgradePrompt 弹窗

```
Upgrade to Pro - $14.9/mo

⚡ 500 credits/month (up to 100 image generation or 33 video generation)
                                                        ^^^ 从25变为33
✨ All image generation features
🛡️ Sora 2 & Sora 2 Pro video models
...
```

---

## 💡 容量说明的含义

### "up to 33 video generation" 是什么意思？

这意味着：
- 如果全部500积分用于生成**最便宜的视频**（Sora 2 720P 10秒）
- 可以生成 **最多 33个视频**
- 计算: 500积分 ÷ 15积分/个 = 33.33 → 33个

### 实际使用场景

用户的500积分可以：
```
✓ 33个 Sora 2 720P 10s 视频 (33 × 15 = 495积分)
✓ 25个 Sora 2 720P 15s 视频 (25 × 20 = 500积分)
✓ 11个 Sora 2 Pro 720P 10s 视频 (11 × 45 = 495积分)
✓ 8个 Sora 2 Pro 720P 15s 视频 (8 × 60 = 480积分)
✓ 5个 Sora 2 Pro 1080P 10s 视频 (5 × 100 = 500积分)
✓ 3个 Sora 2 Pro 1080P 15s 视频 (3 × 130 = 390积分)

或任意组合！
```

---

## 🎯 为什么使用最便宜的选项作为基准？

### 1. 显示最大可能容量
- ✅ 用户看到"up to 33"比"up to 25"更有吸引力
- ✅ 表达的是理论最大值

### 2. 符合"up to"的语义
- "up to" = 最多可达
- 使用最便宜的选项计算最大数量是合理的

### 3. 用户预期管理
- 用户知道实际可能少于这个数字
- 取决于他们选择的具体模型和参数
- 但给出了一个乐观的上限

---

## 📊 完整计算公式

### 图片容量（基于 Nano Banana）
```typescript
imageCount = Math.floor(
  monthlyCredits / creditsConfig.consumption.imageGeneration['nano-banana']
)

// Nano Banana = 5积分
Pro: 500 ÷ 5 = 100张
Pro+: 900 ÷ 5 = 180张
```

### 视频容量（基于 Sora 2 720P 10s）
```typescript
videoCount = Math.floor(
  monthlyCredits / creditsConfig.consumption.videoGeneration['sora-2-720p-10s']
)

// Sora 2 720P 10s = 15积分
Pro: 500 ÷ 15 = 33个 ✨
Pro+: 900 ÷ 15 = 60个 ✨
```

---

## ✅ 最终显示效果总结

### Pricing Page 卡片

| 套餐 | 月度积分 | 图片容量 | 视频容量 | 完整描述 |
|------|---------|---------|---------|---------|
| **Free** | 30 (注册) | up to 6 | up to 2 | 注册奖励 |
| **Pro** | 500 | up to 100 | **up to 33** | 500 credits/month (up to 100 image generation or 33 video generation) |
| **Pro+** | 900 | up to 180 | **up to 60** | 900 credits/month (up to 180 image generation or 60 video generation) |

### UpgradePrompt 弹窗

**推荐 Pro 套餐时**:
```
⚡ 500 credits/month (up to 100 image generation or 33 video generation)
```

**推荐 Pro+ 套餐时**:
```
⚡ 900 credits/month (up to 180 image generation or 60 video generation)
```

---

## 🎯 FAQ 中的显示

```
Q: How many videos can I create with my monthly credits?

A: It depends on your choice of model and settings:
• Pro (500 credits): 33 Sora 2 videos, or 8 Sora 2 Pro 720P videos, or 3 Sora 2 Pro 1080P videos
                      ^^^ 从25更新为33
• Pro+ (900 credits): 60 Sora 2 videos, or 15 Sora 2 Pro 720P videos, or 6 Sora 2 Pro 1080P videos
                       ^^^ 从45更新为60
```

---

## 🔍 变量使用验证

### ✅ 完全使用配置变量

```typescript
// Pricing Page
const imageCount = Math.floor(
  monthlyCredits / creditsConfig.consumption.imageGeneration['nano-banana']
);
const videoCount = Math.floor(
  monthlyCredits / creditsConfig.consumption.videoGeneration['sora-2-720p-10s']
);

// UpgradePrompt
const imageCreditCost = creditsConfig.consumption.imageGeneration['nano-banana'];
const videoCreditCost = creditsConfig.consumption.videoGeneration['sora-2-720p-10s'];

const approxImages = Math.floor(targetPlanCredits / imageCreditCost);
const approxVideos = Math.floor(targetPlanCredits / videoCreditCost);
```

### ✅ 无硬编码数字

- ❌ 没有 `/ 5`
- ❌ 没有 `/ 15`  
- ❌ 没有 `/ 20`
- ✅ 全部使用 `creditsConfig.consumption.*`

---

## 🎉 总结

### 关键变化
- 视频容量基准：Sora 2 720P **15s** → **10s**
- 积分消耗：20积分 → **15积分**
- 显示数量：Pro 25个 → **33个**, Pro+ 45个 → **60个**

### 用户感知
- ✅ 看到更高的视频容量（33和60）
- ✅ 更有吸引力的数字
- ✅ 符合"up to"（最多可达）的语义

### 技术实现
- ✅ 完全使用配置变量
- ✅ 无硬编码
- ✅ 自动计算
- ✅ 无 lint 错误

---

**更新日期**: 2024
**状态**: ✅ 完成
**新基准**: Nano Banana (5积分) + Sora 2 720P 10s (15积分)

