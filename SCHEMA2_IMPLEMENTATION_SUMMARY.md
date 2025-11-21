# 方案2实现总结：单条记录+字段

## 实现内容

### 1. 数据库 Schema 更新

在 `payment` 表中添加了以下字段：
- `scheduled_plan_id`: 即将生效的计划 ID（pro/proplus）
- `scheduled_interval`: 即将生效的计费周期（month/year）
- `scheduled_period_start`: 即将生效的周期开始时间
- `scheduled_period_end`: 即将生效的周期结束时间
- `scheduled_at`: 升级请求的时间

**迁移文件**: `drizzle/0003_lethal_menace.sql`

### 2. 类型定义更新

- `PaymentRecord` 接口：添加了 scheduled 相关字段
- `UpdatePaymentData` 接口：支持更新 scheduled 字段

### 3. 升级逻辑 (`/api/creem/subscription/[subscriptionId]/upgrade`)

**延迟生效（`useProration = false`）**：
- 设置 `scheduledPlanId`、`scheduledInterval` 等字段
- 保持当前 `priceId` 不变（仍然是 Pro）
- 创建事件记录

**立即生效（`useProration = true`）**：
- 直接更新 `priceId` 为新计划
- 清空所有 scheduled 字段

### 4. Webhook 处理逻辑 (`/api/webhooks/creem`)

**周期结束时的处理**：
1. 检测是否有 `scheduledPlanId`
2. 如果有，应用 scheduled upgrade：
   - 更新 `priceId` = `scheduledPlanId`
   - 更新 `interval` = `scheduledInterval`
   - 更新 `periodStart`/`periodEnd`
   - 发放新计划的积分
   - 清空所有 scheduled 字段

### 5. 查询逻辑 (`/api/creem/subscription`)

**优先从 scheduled 字段读取**：
- 如果存在 `scheduledPlanId`，返回 `upcomingPlan`
- 否则从事件记录读取（兼容旧逻辑）

## 使用流程

### Pro 用户升级到 Pro+（延迟生效）

1. **用户发起升级**：
   ```
   POST /api/creem/subscription/{subscriptionId}/upgrade
   {
     "newPlanId": "proplus",
     "newInterval": "month",
     "useProration": false
   }
   ```

2. **数据库状态**：
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

3. **周期结束时（Webhook）**：
   - Creem 发送 `subscription.updated` webhook
   - 检测到 `scheduledPlanId` 存在
   - 应用升级：
     - `priceId` = `proplus`
     - 清空 scheduled 字段
     - 发放 Pro+ 积分

4. **最终状态**：
   ```sql
   payment {
     priceId: 'proplus',          -- 已升级
     status: 'active',
     scheduledPlanId: null,        -- 已清空
     ...
   }
   ```

## 数据库迁移

### 执行迁移

```bash
# 生成迁移（已完成）
pnpm db:generate

# 执行迁移
pnpm db:migrate:deploy
```

### 迁移内容

```sql
ALTER TABLE "payment" ADD COLUMN "scheduled_plan_id" text;
ALTER TABLE "payment" ADD COLUMN "scheduled_interval" text;
ALTER TABLE "payment" ADD COLUMN "scheduled_period_start" timestamp;
ALTER TABLE "payment" ADD COLUMN "scheduled_period_end" timestamp;
ALTER TABLE "payment" ADD COLUMN "scheduled_at" timestamp;
```

## 关键代码位置

1. **Schema 定义**: `src/server/db/schema.ts`
2. **类型定义**: `src/payment/types.ts`
3. **Repository**: `src/server/db/repositories/payment-repository.ts`
4. **升级 API**: `src/app/api/creem/subscription/[subscriptionId]/upgrade/route.ts`
5. **Webhook 处理**: `src/app/api/webhooks/creem/route.ts`
6. **订阅查询**: `src/app/api/creem/subscription/route.ts`

## 测试要点

1. **升级延迟生效**：
   - 验证 scheduled 字段正确设置
   - 验证当前计划保持不变
   - 验证周期结束时正确应用升级

2. **积分发放**：
   - 验证周期结束时发放新计划积分
   - 验证积分数量正确

3. **查询逻辑**：
   - 验证 `upcomingPlan` 正确返回
   - 验证 billing 页面显示升级通知

4. **立即生效**：
   - 验证 `useProration = true` 时直接更新 priceId
   - 验证 scheduled 字段被清空

## 注意事项

1. **数据一致性**：
   - 确保周期结束时正确应用 scheduled upgrade
   - 确保 scheduled 字段在应用后被清空

2. **兼容性**：
   - 保留了从事件记录读取的逻辑（向后兼容）
   - 优先使用 scheduled 字段

3. **性能**：
   - 单条记录查询，性能最优
   - 不需要额外的 JOIN 或子查询

## 下一步

1. 执行数据库迁移：`pnpm db:migrate:deploy`
2. 测试升级流程
3. 验证积分发放逻辑
4. 验证 billing 页面显示

