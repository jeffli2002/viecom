# 定价计划更新

## ✅ 完成的更新

已更新所有订阅计划的功能说明，移除存储相关福利，添加资产展示期限，并明确显示 Free plan 的奖励积分。

---

## 🎯 **主要变更**

### 1. **Free Plan 更新** ✨

#### 积分描述优化
```diff
- '30 credits on signup (one-time)'
+ '30 credits sign-up bonus (one-time)'
```

#### 新增奖励积分说明
```typescript
features: [
  '30 credits sign-up bonus (one-time)',
  'Daily check-in rewards (2 credits/day)',           // 已有
+ 'Referral rewards (10 credits per referral)',       // 新增
+ 'Social share rewards (5 credits per share)',       // 新增
  'Text-to-image generation',
  'Text-to-video generation',
  'Batch generation (1 concurrent)',
  'Basic image styles',
- '1GB storage',                                      // 移除
+ '7 days asset display',                             // 新增
  'Standard quality',
  'Community support',
]
```

**变更说明**：
- ✅ 明确说明是"sign-up bonus"（注册奖励）而不是月度积分
- ✅ 添加推荐奖励（10 积分/推荐）
- ✅ 添加社交分享奖励（5 积分/分享）
- ✅ 移除存储限制（1GB storage）
- ✅ 添加资产展示期限（7 天）

---

### 2. **Pro Plan 更新**

```diff
features: [
  '500 credits/month',
  'All image generation features',
  'Sora 2 & Sora 2 Pro video models',
  'Brand analysis',
  'Batch generation (3 concurrent)',
  'No watermarks',
  'Commercial license',
- '10GB storage',                    // 移除
+ '30 days asset display',           // 新增
  'HD quality exports',
  'Priority support',
]
```

**变更说明**：
- ❌ 移除存储限制（10GB storage）
- ✅ 添加资产展示期限（30 天）

---

### 3. **Pro+ Plan 更新**

```diff
features: [
  '900 credits/month',
  'Everything in Pro',
  'Advanced AI models (Sora 2 Pro)',
  'Priority queue processing (10 concurrent)',
  'API access',
- 'Unlimited storage',               // 移除
+ '30 days asset display',           // 新增
  '4K quality exports',
  'White-label options',
  'Dedicated account manager',
  '24/7 priority support',
]
```

**变更说明**：
- ❌ 移除无限存储（Unlimited storage）
- ✅ 添加资产展示期限（30 天）

---

## 📊 **完整的 Free Plan 功能**

### 更新后的完整列表
```
1. 30 credits sign-up bonus (one-time)          ← 注册奖励
2. Daily check-in rewards (2 credits/day)       ← 每日签到
3. Referral rewards (10 credits per referral)   ← 推荐奖励
4. Social share rewards (5 credits per share)   ← 分享奖励
5. Text-to-image generation                     ← 图片生成
6. Text-to-video generation                     ← 视频生成
7. Batch generation (1 concurrent)              ← 批量生成
8. Basic image styles                           ← 基础风格
9. 7 days asset display                         ← 资产展示
10. Standard quality                            ← 标准质量
11. Community support                           ← 社区支持
```

### 奖励积分获取方式
```
📝 Sign-up Bonus:        30 credits (一次性)
📅 Daily Check-in:       2 credits/day
👥 Referral:            10 credits/referral
📢 Social Share:         5 credits/share

💡 示例：
- 注册：+30 积分
- 连续签到 7 天：+14 积分
- 推荐 2 个朋友：+20 积分
- 分享 3 次：+15 积分
总计：79 积分（可生成 15+ 张图片）
```

---

## 🗂️ **资产展示期限**

### 各计划的展示期限

| Plan | Asset Display Period | Storage Mention | Notes |
|------|---------------------|-----------------|-------|
| **Free** | 7 days | ❌ Removed | 资产保留 7 天后自动删除 |
| **Pro** | 30 days | ❌ Removed | 资产保留 30 天 |
| **Pro+** | 30 days | ❌ Removed | 资产保留 30 天 |

### 为什么移除存储限制？
```
之前的问题：
❌ "1GB storage" - 用户难以估算能存多少资产
❌ "10GB storage" - 需要复杂的存储管理系统
❌ "Unlimited storage" - 成本不可控

新的方案：
✅ 基于时间的资产展示期限
✅ 用户理解清晰（7天/30天）
✅ 自动清理过期资产
✅ 成本可预测和控制
```

---

## 📋 **Pricing Page FAQ 更新**

### 之前（硬编码）
```typescript
<p>
  Yes! The Free plan is completely free forever. You get 30 credits on signup 
  and can earn 2 credits per day through daily check-ins. You can also earn 
  bonus credits through referrals and social sharing.
</p>
```

### 现在（配置驱动） ✨
```typescript
<p>
  Yes! The Free plan is completely free forever. You get {paymentConfig.plans[0].credits.onSignup} credits 
  as a sign-up bonus and can earn {creditsConfig.rewards.checkin.dailyCredits} credits per day through daily check-ins. 
  You can also earn bonus credits through referrals ({creditsConfig.rewards.referral.creditsPerReferral} credits per referral) 
  and social sharing ({creditsConfig.rewards.socialShare.creditsPerShare} credits per share).
</p>
```

**好处**：
- ✅ 自动同步配置更新
- ✅ 无需手动修改多处
- ✅ 减少维护成本
- ✅ 避免数据不一致

---

## 🎨 **视觉对比**

### Free Plan Card（定价页面）

#### 之前
```
┌─────────────────────────────┐
│          Free               │
│          $0/month           │
├─────────────────────────────┤
│ ✓ 30 credits on signup      │
│ ✓ Daily check-in (2/day)    │
│ ✓ Text-to-image generation  │
│ ✓ Text-to-video generation  │
│ ✓ Batch generation (1)      │
│ ✓ Basic image styles        │
│ ✓ 1GB storage               │  ← 移除
│ ✓ Standard quality          │
│ ✓ Community support         │
└─────────────────────────────┘
```

#### 现在 ✨
```
┌─────────────────────────────────────┐
│          Free                       │
│          $0/month                   │
├─────────────────────────────────────┤
│ ✓ 30 credits sign-up bonus          │  ← 更新
│ ✓ Daily check-in (2 credits/day)    │
│ ✓ Referral rewards (10/referral)    │  ← 新增
│ ✓ Social share rewards (5/share)    │  ← 新增
│ ✓ Text-to-image generation          │
│ ✓ Text-to-video generation          │
│ ✓ Batch generation (1 concurrent)   │
│ ✓ Basic image styles                │
│ ✓ 7 days asset display              │  ← 新增
│ ✓ Standard quality                  │
│ ✓ Community support                 │
└─────────────────────────────────────┘
```

---

## 💰 **积分获取方式总结**

### Free Plan 用户可获得积分的所有途径

```
1️⃣ 注册奖励
   - 一次性获得 30 积分
   - 立即可用

2️⃣ 每日签到
   - 每天签到获得 2 积分
   - 连续签到 7 天额外获得 5 积分奖励
   - 月度最多：2 × 30 + 5 × 4 = 80 积分

3️⃣ 推荐好友
   - 推荐用户完成首次生成后获得 10 积分
   - 无上限

4️⃣ 社交分享
   - 每次分享到社交媒体获得 5 积分
   - 可分享生成的作品

📊 首月最低积分预估：
- 注册：30
- 签到 30 天：60
- 推荐 3 个朋友：30
- 分享 5 次：25
总计：145 积分 ≈ 29 张图片 或 9 个视频（Sora 2）
```

---

## 🔧 **技术实现**

### 配置文件更新
```typescript
// src/config/payment.config.ts

// Free Plan
credits: {
  monthly: 0,              // 无月度积分
  onSignup: 30,           // 注册奖励 30 积分
}

// Features 数组完全由配置驱动
features: [
  '30 credits sign-up bonus (one-time)',
  'Daily check-in rewards (2 credits/day)',
  'Referral rewards (10 credits per referral)',
  'Social share rewards (5 credits per share)',
  // ... 其他功能
  '7 days asset display',   // 新增
]
```

### 动态显示
```typescript
// Pricing Page FAQ 使用配置变量
{paymentConfig.plans[0].credits.onSignup} credits
{creditsConfig.rewards.checkin.dailyCredits} credits per day
{creditsConfig.rewards.referral.creditsPerReferral} credits per referral
{creditsConfig.rewards.socialShare.creditsPerShare} credits per share
```

---

## 📝 **配置引用**

### Credits Config (src/config/credits.config.ts)
```typescript
rewards: {
  checkin: {
    dailyCredits: 2,                    // 每日签到积分
    weeklyBonusCredits: 5,              // 连续签到 7 天奖励
    consecutiveDaysRequired: 7,         // 连续天数要求
  },
  referral: {
    creditsPerReferral: 10,             // 每个推荐的积分
  },
  socialShare: {
    creditsPerShare: 5,                 // 每次分享的积分
  },
}
```

### Payment Config (src/config/payment.config.ts)
```typescript
plans: [
  {
    id: 'free',
    credits: {
      monthly: 0,        // 无月度积分
      onSignup: 30,      // 注册奖励
    },
    features: [
      // 完整的功能列表
    ],
  },
  // ... Pro, Pro+
]
```

---

## ✅ **验证清单**

### Free Plan
- [x] 更新为 "30 credits sign-up bonus (one-time)"
- [x] 添加 "Daily check-in rewards (2 credits/day)"
- [x] 添加 "Referral rewards (10 credits per referral)"
- [x] 添加 "Social share rewards (5 credits per share)"
- [x] 移除 "1GB storage"
- [x] 添加 "7 days asset display"

### Pro Plan
- [x] 移除 "10GB storage"
- [x] 添加 "30 days asset display"

### Pro+ Plan
- [x] 移除 "Unlimited storage"
- [x] 添加 "30 days asset display"

### Pricing Page
- [x] FAQ 使用配置变量
- [x] 动态显示奖励积分数量

### 其他
- [x] 无 linter 错误
- [x] 配置驱动，易于维护

---

## 🎯 **用户体验改进**

### 更清晰的价值主张
```
之前：
- "30 credits on signup" - 不明确是否有月度积分
- 缺少具体的奖励积分说明
- 存储限制难以理解

现在：
- "30 credits sign-up bonus (one-time)" - 明确一次性
- 详细列出所有奖励途径和积分数量
- 资产展示期限更直观（7天/30天）
```

### 激励用户参与
```
Free Plan 现在清楚地展示：
1. 签到可获得积分 ✅
2. 推荐好友可获得积分 ✅
3. 分享作品可获得积分 ✅

用户知道如何免费获得更多积分！
```

---

**更新日期**: 2024-11
**状态**: ✅ 完成
**改进**: 移除存储限制 + 添加资产展示期限 + 明确奖励积分

