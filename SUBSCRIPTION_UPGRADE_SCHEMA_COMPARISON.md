# 订阅升级方案对比分析

## 方案对比：多条记录 vs 单条记录+字段

### 方案 1：多条订阅记录（推荐）

#### 数据库结构
```sql
-- 当前 Pro 订阅（active）
payment {
  id: 'sub_xxx',
  subscriptionId: 'sub_xxx',
  priceId: 'pro',
  status: 'active',
  periodStart: '2024-01-01',
  periodEnd: '2024-02-01',
  ...
}

-- 未来 Pro+ 订阅（scheduled）
payment {
  id: 'sub_xxx_scheduled',  -- 或新的 UUID
  subscriptionId: 'sub_xxx',  -- 相同的 subscriptionId
  priceId: 'proplus',
  status: 'scheduled',  -- 新状态
  periodStart: '2024-02-01',  -- 当前周期的结束时间
  periodEnd: '2024-03-01',
  ...
}
```

#### 优点 ✅

1. **数据清晰直观**
   - 可以同时看到当前计划和未来计划
   - 数据库结构自然，符合业务逻辑
   - 易于理解和维护

2. **查询简单**
   ```typescript
   // 查询当前活跃订阅
   findActiveSubscriptionByUserId(userId) // 返回 Pro
   
   // 查询即将生效的订阅
   findScheduledSubscriptionByUserId(userId) // 返回 Pro+
   ```

3. **状态管理清晰**
   - 每个计划有独立的状态
   - 状态转换简单：scheduled → active
   - 不需要复杂的字段判断逻辑

4. **扩展性好**
   - 支持多次升级（Pro → Pro+ → Pro++）
   - 支持降级后再升级
   - 历史记录完整

5. **与 Creem 行为一致**
   - Creem 可能在不同时间点发送不同的 webhook
   - 多条记录可以更好地处理异步更新

6. **审计和调试**
   - 可以清楚看到每个计划的生命周期
   - 便于追踪问题和分析数据

#### 缺点 ❌

1. **需要修改现有逻辑**
   - 需要修改 `findActiveSubscriptionByUserId` 过滤掉 scheduled 状态
   - 需要新增 `findScheduledSubscriptionByUserId` 方法
   - 需要修改 webhook 处理逻辑

2. **数据一致性**
   - 需要确保同一个 subscriptionId 只有一条 active 记录
   - 需要确保 scheduled 记录在周期结束时正确激活

3. **查询性能**
   - 需要额外的查询来获取 scheduled 订阅
   - 但可以通过索引优化（subscriptionId + status）

4. **需要新增状态**
   - 需要在 PaymentStatus 类型中添加 'scheduled' 状态
   - 需要更新所有状态相关的逻辑

#### 实现复杂度
- **数据库迁移**：中等（需要添加 scheduled 状态）
- **代码修改**：中等（需要修改查询逻辑和 webhook 处理）
- **测试复杂度**：中等（需要测试状态转换）

---

### 方案 2：单条记录 + 增加字段

#### 数据库结构
```sql
-- 单条记录，增加字段
payment {
  id: 'sub_xxx',
  subscriptionId: 'sub_xxx',
  priceId: 'pro',  -- 当前计划
  status: 'active',
  periodStart: '2024-01-01',
  periodEnd: '2024-02-01',
  
  -- 新增字段
  scheduledPlanId: 'proplus',  -- 未来计划
  scheduledInterval: 'month',
  scheduledPeriodStart: '2024-02-01',
  scheduledPeriodEnd: '2024-03-01',
  scheduledAt: '2024-01-15',  -- 升级请求时间
  ...
}
```

#### 优点 ✅

1. **改动最小**
   - 只需要添加几个字段
   - 不需要修改现有的查询逻辑
   - 不需要新增状态

2. **查询简单**
   - 仍然只需要查询一条记录
   - `findActiveSubscriptionByUserId` 逻辑不变

3. **数据一致性**
   - 单条记录，不存在多记录一致性问题
   - 状态转换简单：清空 scheduled 字段即可

4. **性能好**
   - 单条记录查询，性能最优
   - 不需要额外的 JOIN 或子查询

#### 缺点 ❌

1. **数据不够直观**
   - 需要同时查看 priceId 和 scheduledPlanId
   - 业务逻辑不够清晰

2. **查询复杂**
   ```typescript
   // 需要判断是否有 scheduled 计划
   const subscription = findActiveSubscriptionByUserId(userId);
   const upcomingPlan = subscription.scheduledPlanId 
     ? { planId: subscription.scheduledPlanId, ... }
     : null;
   ```

3. **扩展性差**
   - 如果用户多次升级（Pro → Pro+ → Pro++），字段会不够用
   - 无法记录历史升级记录

4. **状态管理复杂**
   - 需要同时维护 priceId 和 scheduledPlanId
   - 周期结束时需要同步更新多个字段

5. **与 Creem 行为不一致**
   - Creem 可能在不同时间点发送不同的 webhook
   - 单条记录可能无法很好地处理异步更新

6. **审计和调试困难**
   - 无法清楚看到每个计划的生命周期
   - 历史记录不完整

#### 实现复杂度
- **数据库迁移**：简单（只需要添加字段）
- **代码修改**：简单（主要是字段读取和更新）
- **测试复杂度**：简单（逻辑相对简单）

---

## 详细对比表

| 对比项 | 方案1：多条记录 | 方案2：单条记录+字段 |
|--------|----------------|---------------------|
| **数据清晰度** | ⭐⭐⭐⭐⭐ 非常清晰 | ⭐⭐⭐ 一般 |
| **查询复杂度** | ⭐⭐⭐⭐ 简单 | ⭐⭐⭐⭐⭐ 最简单 |
| **扩展性** | ⭐⭐⭐⭐⭐ 很好 | ⭐⭐ 较差 |
| **实现复杂度** | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 最简单 |
| **性能** | ⭐⭐⭐⭐ 好 | ⭐⭐⭐⭐⭐ 最好 |
| **维护性** | ⭐⭐⭐⭐⭐ 很好 | ⭐⭐⭐ 一般 |
| **与业务逻辑匹配** | ⭐⭐⭐⭐⭐ 完美匹配 | ⭐⭐⭐ 一般 |
| **历史记录** | ⭐⭐⭐⭐⭐ 完整 | ⭐⭐ 不完整 |

---

## 推荐方案：方案 1（多条记录）

### 推荐理由

1. **业务逻辑清晰**
   - 当前计划和未来计划是独立的实体
   - 多条记录更符合业务语义

2. **扩展性好**
   - 支持多次升级、降级、再升级
   - 支持复杂的订阅场景

3. **维护性好**
   - 代码逻辑清晰，易于理解和维护
   - 便于后续功能扩展

4. **数据完整性**
   - 可以完整记录订阅历史
   - 便于审计和问题排查

### 实现要点

1. **新增状态**
   ```typescript
   type PaymentStatus = 
     | 'active' 
     | 'trialing' 
     | 'past_due' 
     | 'canceled' 
     | 'unpaid'
     | 'scheduled'  // 新增
   ```

2. **查询方法**
   ```typescript
   // 查询当前活跃订阅（排除 scheduled）
   findActiveSubscriptionByUserId(userId) {
     // status IN ('active', 'trialing', 'past_due')
     // 排除 status = 'scheduled'
   }
   
   // 查询即将生效的订阅
   findScheduledSubscriptionByUserId(userId) {
     // status = 'scheduled'
     // subscriptionId = currentSubscription.subscriptionId
   }
   ```

3. **升级逻辑**
   ```typescript
   // 升级时创建新记录
   await paymentRepository.create({
     id: `${subscriptionId}_scheduled`,
     subscriptionId: subscriptionId,
     priceId: 'proplus',
     status: 'scheduled',
     periodStart: currentPeriodEnd,
     periodEnd: nextPeriodEnd,
     ...
   });
   ```

4. **周期结束处理**
   ```typescript
   // Webhook 检测到周期结束时
   // 1. 将当前 Pro 记录状态改为 canceled
   // 2. 将 scheduled Pro+ 记录状态改为 active
   // 3. 发放 Pro+ 积分
   ```

---

## 如果选择方案 2（单条记录+字段）

### 实现要点

1. **数据库迁移**
   ```sql
   ALTER TABLE payment 
   ADD COLUMN scheduled_plan_id TEXT,
   ADD COLUMN scheduled_interval TEXT,
   ADD COLUMN scheduled_period_start TIMESTAMP,
   ADD COLUMN scheduled_period_end TIMESTAMP,
   ADD COLUMN scheduled_at TIMESTAMP;
   ```

2. **升级逻辑**
   ```typescript
   await paymentRepository.update(paymentRecord.id, {
     scheduledPlanId: 'proplus',
     scheduledInterval: 'month',
     scheduledPeriodStart: currentPeriodEnd,
     scheduledPeriodEnd: nextPeriodEnd,
     scheduledAt: new Date(),
   });
   ```

3. **周期结束处理**
   ```typescript
   // Webhook 检测到周期结束时
   await paymentRepository.update(paymentRecord.id, {
     priceId: paymentRecord.scheduledPlanId,
     interval: paymentRecord.scheduledInterval,
     periodStart: paymentRecord.scheduledPeriodStart,
     periodEnd: paymentRecord.scheduledPeriodEnd,
     scheduledPlanId: null,  // 清空
     scheduledInterval: null,
     scheduledPeriodStart: null,
     scheduledPeriodEnd: null,
     scheduledAt: null,
   });
   ```

---

## 最终建议

**推荐使用方案 1（多条记录）**，原因：

1. ✅ 更符合业务逻辑和语义
2. ✅ 扩展性和维护性更好
3. ✅ 数据完整性更好
4. ✅ 虽然实现复杂度稍高，但长期收益更大

**如果选择方案 2**，适用于：
- 快速实现，不需要长期维护
- 确定不会有复杂的升级场景
- 性能要求极高

