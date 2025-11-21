# Pro 升级到 Pro+ 逻辑分析

## 当前实现逻辑

### 1. 升级 API (`/api/creem/subscription/[subscriptionId]/upgrade`)

**当前行为：**
- 调用 `creemService.upgradeSubscription()` 升级订阅
- **直接更新现有 payment record**，将 `priceId` 从 `pro` 更新为 `proplus`
- 创建事件记录 (`payment_event`) 记录升级信息
- 如果 `useProration = false`，升级会在当前周期结束时生效

**问题：**
- ❌ **没有创建新的 payment record**
- ❌ **直接更新现有记录，导致无法区分当前计划和未来计划**
- ❌ **数据库只有一行记录，无法体现"Pro 当前有效，Pro+ 将在下个周期生效"的状态**

### 2. Webhook 处理 (`handleSubscriptionUpdate`)

**当前行为：**
- 当 Creem 发送 `subscription.updated` webhook 时
- 更新现有的 payment record
- 检测续费时发放积分

**问题：**
- ❌ **同样只更新现有记录，不创建新记录**

### 3. 积分发放逻辑

**当前行为：**
- 升级时（`useProration = false`）：**不立即发放积分**
- 续费时（周期结束时）：通过 webhook 检测到续费，发放 Pro+ 的积分

**问题：**
- ⚠️ **如果升级是立即生效（`useProration = true`），积分会立即发放**
- ⚠️ **如果升级是延迟生效（`useProration = false`），积分会在周期结束时发放**

### 4. 扣款逻辑

**当前行为：**
- 由 Creem 处理扣款
- 如果 `useProration = false`，扣款会在周期结束时发生
- 如果 `useProration = true`，会立即按比例扣款

## 用户期望的逻辑

### 数据库结构

**期望：** 在 Pro 还依旧有效期间，数据库应该有两行信息：
1. **Pro 记录**：`status = 'active'`, `priceId = 'pro'`
2. **Pro+ 记录**：`status = 'inactive'` 或 `status = 'scheduled'`, `priceId = 'proplus'`

**当前：** 只有一行记录，`priceId` 被更新为 `proplus`，但 `status` 仍然是 `active`

### 自动生效逻辑

1. **下个计费期开始时自动生效**
   - ✅ 已实现：通过 `scheduledAtPeriodEnd` 和事件记录实现
   - ⚠️ 但数据库结构不支持同时存在两个计划

2. **自动扣款**
   - ✅ 由 Creem 处理，逻辑正确

3. **自动发送积分**
   - ✅ 在周期结束时通过 webhook 检测续费并发放积分
   - ⚠️ 但无法提前知道即将升级到 Pro+

## 建议的改进方案

### 方案 1：创建新的 payment record（推荐）

**实现：**
1. 升级时创建新的 payment record：
   - `id` = 新的 UUID（或使用 `subscriptionId_scheduled`）
   - `subscriptionId` = 相同的 subscription ID
   - `priceId` = `proplus`
   - `status` = `scheduled` 或 `inactive`
   - `periodStart` = 当前周期的 `periodEnd`
   - `periodEnd` = 下个周期的结束时间

2. 保持现有 Pro 记录不变：
   - `status` = `active`
   - `priceId` = `pro`
   - `cancelAtPeriodEnd` = `true`（可选）

3. 在周期结束时：
   - 将 Pro 记录状态更新为 `canceled`
   - 将 Pro+ 记录状态更新为 `active`
   - 发放 Pro+ 积分

**优点：**
- ✅ 数据库结构清晰，可以同时看到当前计划和未来计划
- ✅ 支持查询"即将升级的计划"
- ✅ 符合用户期望

**缺点：**
- ⚠️ 需要修改现有逻辑
- ⚠️ 需要处理两个记录的状态同步

### 方案 2：使用事件记录 + 状态字段（当前方案改进）

**实现：**
1. 保持单条 payment record
2. 添加 `scheduledPlanId` 字段到 payment 表
3. 升级时：
   - 更新 `scheduledPlanId` = `proplus`
   - 保持 `priceId` = `pro`
   - 创建事件记录

4. 周期结束时：
   - 更新 `priceId` = `scheduledPlanId`
   - 清空 `scheduledPlanId`
   - 发放积分

**优点：**
- ✅ 改动较小
- ✅ 保持单条记录

**缺点：**
- ❌ 无法直接查询"即将升级的计划"
- ❌ 需要修改数据库 schema

## 当前实现的问题总结

1. **数据库结构问题：**
   - ❌ 升级时直接更新 `priceId`，无法区分当前计划和未来计划
   - ❌ 只有一行记录，无法体现"Pro 当前有效，Pro+ 将在下个周期生效"

2. **查询问题：**
   - ⚠️ `findActiveSubscriptionByUserId` 只能找到当前活跃的计划
   - ⚠️ 无法查询"即将升级的计划"

3. **积分发放：**
   - ✅ 逻辑基本正确，在周期结束时发放
   - ⚠️ 但无法提前知道即将升级到 Pro+

4. **扣款：**
   - ✅ 由 Creem 处理，逻辑正确

## 建议

**推荐使用方案 1**，创建新的 payment record 来代表即将生效的计划。这样可以：
1. 清晰地区分当前计划和未来计划
2. 支持查询即将升级的计划
3. 符合用户期望的数据库结构
4. 便于实现通知和展示逻辑

