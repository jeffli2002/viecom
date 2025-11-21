# Pricing Page 更新总结

## ✅ 已完成的更新

### 1. 移除硬编码，使用配置文件

**更新的文件**：
- `src/app/[locale]/pricing/page.tsx`

**变更内容**：
- ✅ 所有套餐价格从 `paymentConfig.plans` 读取
- ✅ 所有积分消耗从 `creditsConfig.consumption` 读取
- ✅ 动态计算月度容量（图片数量和视频数量）
- ✅ 动态生成 FAQ 中的容量说明

**示例**：
```typescript
// 之前（硬编码）
<span className="font-bold text-blue-600">15 credits</span>

// 现在（从配置读取）
<span className="font-bold text-blue-600">
  {creditsConfig.consumption.videoGeneration['sora-2-720p-10s']} credits
</span>
```

---

### 2. 删除 Image-to-Prompt 相关功能

**更新的文件**：
- `src/config/payment.config.ts` - 套餐功能描述
- `src/app/[locale]/pricing/page.tsx` - FAQ 部分

**删除的内容**：
- ❌ "3 Image-to-Prompt per day (10/month)"
- ❌ "300 Image-to-Text per month"
- ❌ "600 Image-to-Text per month"
- ❌ "Unlimited Image-to-Prompt"

**替换为**：
- ✅ 更专注于图片和视频生成的功能描述
- ✅ 突出批量处理和并发能力

---

### 3. 删除每日/每月 Quota 限制

**更新的文件**：
- `src/app/[locale]/dashboard/page.tsx`

**变更内容**：
- ❌ 隐藏了所有 Quota 使用显示（每日限制、每月限制）
- ✅ 保留了积分余额显示（这是基于积分系统，不是 quota）
- ✅ 保留了总获得、总花费的统计信息

**技术实现**：
```typescript
// 使用 false && 来禁用 quota 显示，保留代码以便未来需要时恢复
{false && quotaUsage && (
  // Quota display components...
)}
```

---

## 📊 新的定价展示

### 图片生成
- **Nano Banana 模型**: 5 积分/张
- 从配置动态读取

### 视频生成

#### Sora 2（标准版）
| 时长 | 积分 | 来源 |
|------|------|------|
| 10秒 | 15 | `creditsConfig.consumption.videoGeneration['sora-2-720p-10s']` |
| 15秒 | 20 | `creditsConfig.consumption.videoGeneration['sora-2-720p-15s']` |

#### Sora 2 Pro（高级版）
| 分辨率 | 时长 | 积分 | 来源 |
|--------|------|------|------|
| 720P | 10秒 | 45 | `creditsConfig.consumption.videoGeneration['sora-2-pro-720p-10s']` |
| 720P | 15秒 | 60 | `creditsConfig.consumption.videoGeneration['sora-2-pro-720p-15s']` |
| 1080P | 10秒 | 100 | `creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-10s']` |
| 1080P | 15秒 | 130 | `creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s']` |

---

## 🎯 套餐信息

### Free 套餐
- **价格**: $0
- **积分**: 30积分（注册时）
- **功能**: 
  - 30 credits on signup (one-time)
  - Daily check-in rewards (2 credits/day)
  - Text-to-image generation
  - Text-to-video generation
  - Basic image styles
  - 1GB storage
  - Standard quality
  - Community support

### Pro 套餐
- **价格**: $14.9/月
- **积分**: 500积分/月
- **容量**: ~100张图片 或 ~25个视频（Sora 2）
- **功能**:
  - All image generation features
  - Sora 2 & Sora 2 Pro video models
  - Brand analysis
  - Batch generation (3 concurrent)
  - No watermarks
  - Commercial license
  - 10GB storage
  - HD quality exports
  - Priority support

### Pro+ 套餐
- **价格**: $24.9/月
- **积分**: 900积分/月
- **容量**: ~180张图片 或 ~45个视频（Sora 2）
- **功能**:
  - Everything in Pro
  - Advanced AI models (Sora 2 Pro)
  - Priority queue processing (10 concurrent)
  - API access
  - Unlimited storage
  - 4K quality exports
  - White-label options
  - Dedicated account manager
  - 24/7 priority support

---

## 📝 FAQ 更新

### 更新的问题

**"Is there a free trial?" → "Is there a free plan?"**
- 更准确地描述 Free 套餐的性质
- 强调 30 积分注册奖励和每日签到

### 动态生成的内容

**"How many videos can I create with my monthly credits?"**
```typescript
// 动态计算每个套餐的容量
{paymentConfig.plans.filter(p => p.credits.monthly > 0).map((plan) => {
  const credits = plan.credits.monthly;
  const sora2Count = Math.floor(credits / creditsConfig.consumption.videoGeneration['sora-2-720p-15s']);
  const sora2Pro720Count = Math.floor(credits / creditsConfig.consumption.videoGeneration['sora-2-pro-720p-15s']);
  const sora2Pro1080Count = Math.floor(credits / creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s']);
  
  return (
    <li key={plan.id}>
      <strong>{plan.name} ({credits} credits):</strong> {sora2Count} Sora 2 videos, 
      or {sora2Pro720Count} Sora 2 Pro 720P videos, 
      or {sora2Pro1080Count} Sora 2 Pro 1080P videos
    </li>
  );
})}
```

结果：
- **Pro (500 credits):** 25 Sora 2 videos, or 8 Sora 2 Pro 720P videos, or 3 Sora 2 Pro 1080P videos
- **Pro+ (900 credits):** 45 Sora 2 videos, or 15 Sora 2 Pro 720P videos, or 6 Sora 2 Pro 1080P videos

---

## 🔧 技术改进

### 1. 配置驱动
- 所有价格和容量信息都从配置文件读取
- 修改定价只需更新配置文件，不需要修改 UI 代码

### 2. 自动计算
- 容量自动根据积分和单价计算
- 避免手动计算错误

### 3. 可维护性
- 单一数据源（配置文件）
- 减少重复代码
- 更容易测试和更新

---

## 📍 配置文件位置

### 定价配置
- **文件**: `src/config/payment.config.ts`
- **内容**: 套餐价格、功能列表、积分配额

### 积分消耗配置
- **文件**: `src/config/credits.config.ts`
- **内容**: 各种模型的积分消耗

### 批量配置
- **文件**: `src/config/batch.config.ts`
- **内容**: 批量处理的并发数、批次大小

---

## ✅ 验证清单

- [x] 所有价格信息从配置读取
- [x] 所有积分消耗从配置读取
- [x] 移除 Image-to-Prompt 引用
- [x] 移除 Quota 限制显示
- [x] FAQ 动态生成容量信息
- [x] 无 lint 错误
- [x] Dashboard 隐藏 quota 显示
- [x] 保留积分余额显示

---

## 🚀 下一步建议

### 短期
1. 测试 pricing page 在不同套餐下的显示
2. 验证容量计算的准确性
3. 测试 dashboard 的积分显示

### 中期
1. 考虑添加积分充值选项
2. 添加套餐对比功能
3. 优化移动端显示

### 长期
1. A/B 测试不同的定价展示方式
2. 添加计算器让用户估算所需套餐
3. 考虑企业套餐的定制化展示

---

**更新日期**: 2024
**状态**: ✅ 完成
**影响**: pricing page, payment.config, dashboard

