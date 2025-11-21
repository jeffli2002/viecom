# 升级和降级逻辑确认

## 核心原则

**所有付费用户升级和降级都需要等到下个订阅周期开始时生效，同时自动 billing，自动发送对应级别的积分。**

## 实现确认

### 1. 升级 API (`/api/creem/subscription/[subscriptionId]/upgrade`)

✅ **已修复**：
- 强制所有升级都延迟生效（`useProration = false`）
- 设置 `scheduledPlanId`、`scheduledInterval` 等字段
- 保持当前 `priceId` 不变（仍然是旧计划）
- **不立即发放积分**
- 创建事件记录

**流程**：
1. 用户发起升级（Pro → Pro+）
2. 调用 Creem API 升级订阅（延迟生效）
3. 设置 scheduled 字段：
   - `scheduledPlanId = 'proplus'`
   - `scheduledPeriodStart = 当前周期结束时间`
   - `scheduledPeriodEnd = 下个周期结束时间`
4. 保持 `priceId = 'pro'`（当前计划）
5. **不发放积分**

### 2. 降级 API (`/api/creem/subscription/[subscriptionId]/downgrade`)

✅ **已修复**：
- 强制所有降级都延迟生效（`scheduleAtPeriodEnd = true`）
- 设置 `scheduledPlanId`、`scheduledInterval` 等字段
- 保持当前 `priceId` 不变
- **不立即发放积分**
- 不允许立即取消（降级到 Free 也必须延迟生效）

**流程**：
1. 用户发起降级（Pro+ → Pro）
2. 调用 Creem API 降级订阅（延迟生效）
3. 设置 scheduled 字段：
   - `scheduledPlanId = 'pro'`
   - `scheduledPeriodStart = 当前周期结束时间`
   - `scheduledPeriodEnd = 下个周期结束时间`
4. 保持 `priceId = 'proplus'`（当前计划）
5. **不发放积分**

### 3. Webhook 处理 - `checkout.completed`

✅ **已修复**：
- 对于升级，设置 scheduled 字段，不立即更新 priceId
- 不立即发放积分

**流程**：
1. 用户通过 checkout 升级（Pro → Pro+）
2. `checkout.completed` webhook 触发
3. 检测到计划变更（升级）
4. 设置 scheduled 字段
5. 保持当前 `priceId` 不变
6. **不发放积分**

### 4. Webhook 处理 - `subscription.updated`（周期结束时）

✅ **已修复**：
- 检测到 `scheduledPlanId` 存在时，应用升级/降级
- 发放新计划的**完整积分**（不是差额）
- 更新 `priceId` 为新计划
- 清空 scheduled 字段

**升级流程**（周期结束时）：
1. Creem 发送 `subscription.updated` webhook
2. 检测到续费（`hasRenewed = true`）
3. 检测到 `scheduledPlanId` 存在（例如 `proplus`）
4. 应用升级：
   - 更新 `priceId = 'proplus'`
   - 更新 `interval`、`periodStart`、`periodEnd`
   - **发放 Pro+ 的完整积分**（例如 900 credits）
   - 清空 scheduled 字段

**降级流程**（周期结束时）：
1. Creem 发送 `subscription.updated` webhook
2. 检测到续费（`hasRenewed = true`）
3. 检测到 `scheduledPlanId` 存在（例如 `pro`）
4. 应用降级：
   - 更新 `priceId = 'pro'`
   - 更新 `interval`、`periodStart`、`periodEnd`
   - **发放 Pro 的完整积分**（例如 500 credits，如果降级到 Pro）
   - 清空 scheduled 字段

### 5. Webhook 处理 - `subscription.updated`（非续费时）

✅ **已修复**：
- 对于升级/降级，设置 scheduled 字段，不立即应用
- 不立即发放积分

**流程**：
1. Creem 发送 `subscription.updated` webhook（非续费）
2. 检测到计划变更（升级或降级）
3. 设置 scheduled 字段
4. 保持当前 `priceId` 不变
5. **不发放积分**

## 自动 Billing

✅ **由 Creem 处理**：
- Creem 会在周期结束时自动扣款
- 扣款金额为新计划的费用
- 不需要我们处理

## 积分发放确认

✅ **已确认**：
- 升级时：在周期结束时发放**新计划的完整积分**（例如 Pro+ 的 900 credits）
- 降级时：在周期结束时发放**新计划的完整积分**（例如 Pro 的 500 credits）
- **不是差额**，是完整积分

## 数据库状态

### 升级时（Pro → Pro+）

**升级请求后（周期结束前）**：
```sql
payment {
  priceId: 'pro',              -- 当前计划
  status: 'active',
  scheduledPlanId: 'proplus',  -- 即将生效的计划
  scheduledInterval: 'month',
  scheduledPeriodStart: '2024-02-01',
  scheduledPeriodEnd: '2024-03-01',
  scheduledAt: '2024-01-15'
}
```

**周期结束后**：
```sql
payment {
  priceId: 'proplus',          -- 已升级
  status: 'active',
  scheduledPlanId: null,        -- 已清空
  ...
}
```

### 降级时（Pro+ → Pro）

**降级请求后（周期结束前）**：
```sql
payment {
  priceId: 'proplus',          -- 当前计划
  status: 'active',
  scheduledPlanId: 'pro',      -- 即将生效的计划
  scheduledInterval: 'month',
  scheduledPeriodStart: '2024-02-01',
  scheduledPeriodEnd: '2024-03-01',
  scheduledAt: '2024-01-15'
}
```

**周期结束后**：
```sql
payment {
  priceId: 'pro',              -- 已降级
  status: 'active',
  scheduledPlanId: null,       -- 已清空
  ...
}
```

## 关键代码位置

1. **升级 API**: `src/app/api/creem/subscription/[subscriptionId]/upgrade/route.ts`
2. **降级 API**: `src/app/api/creem/subscription/[subscriptionId]/downgrade/route.ts`
3. **Webhook - Checkout**: `src/app/api/webhooks/creem/route.ts` - `handleCheckoutComplete`
4. **Webhook - Update**: `src/app/api/webhooks/creem/route.ts` - `handleSubscriptionUpdate`

## 测试要点

1. **升级延迟生效**：
   - 验证 scheduled 字段正确设置
   - 验证当前计划保持不变
   - 验证周期结束时正确应用升级
   - 验证发放新计划的完整积分

2. **降级延迟生效**：
   - 验证 scheduled 字段正确设置
   - 验证当前计划保持不变
   - 验证周期结束时正确应用降级
   - 验证发放新计划的完整积分

3. **自动 Billing**：
   - 验证 Creem 在周期结束时自动扣款
   - 验证扣款金额为新计划的费用

4. **积分发放**：
   - 验证发放的是新计划的完整积分，不是差额
   - 验证在周期结束时发放，不是立即发放

