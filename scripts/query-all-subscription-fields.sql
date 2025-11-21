-- 查询所有订阅用户的所有订阅相关字段
-- 包含用户信息、订阅信息、scheduled 字段、积分信息等

SELECT 
  -- ========== 用户基本信息 ==========
  u.id AS user_id,
  u.email,
  u.name AS user_name,
  u.role,
  u.created_at AS user_created_at,
  u.banned,
  u.ban_reason,
  u.ban_expires,
  
  -- ========== 订阅/支付基本信息 ==========
  p.id AS subscription_id,
  p.subscription_id AS creem_subscription_id,
  p.provider,
  p.price_id,
  p.product_id,
  p.type AS payment_type,
  p.interval AS billing_interval,
  p.status AS subscription_status,
  
  -- ========== 计费周期信息 ==========
  p.period_start,
  p.period_end,
  p.cancel_at_period_end,
  p.trial_start,
  p.trial_end,
  
  -- ========== 客户和订阅 ID ==========
  p.customer_id,
  
  -- ========== Scheduled 升级/降级字段（方案2） ==========
  p.scheduled_plan_id,
  p.scheduled_interval,
  p.scheduled_period_start,
  p.scheduled_period_end,
  p.scheduled_at,
  
  -- ========== 时间戳 ==========
  p.created_at AS subscription_created_at,
  p.updated_at AS subscription_updated_at,
  
  -- ========== 积分信息 ==========
  uc.balance AS current_credits,
  uc.updated_at AS credits_updated_at,
  
  -- ========== 计算字段 ==========
  -- 订阅状态分类
  CASE 
    WHEN p.status IN ('active', 'trialing', 'past_due') THEN 'Active'
    WHEN p.status = 'canceled' THEN 'Canceled'
    WHEN p.status = 'unpaid' THEN 'Unpaid'
    ELSE 'Other'
  END AS status_category,
  
  -- 周期状态
  CASE 
    WHEN p.period_end IS NOT NULL AND p.period_end > NOW() THEN 'Current Period'
    WHEN p.period_end IS NOT NULL AND p.period_end <= NOW() THEN 'Expired'
    ELSE 'Unknown'
  END AS period_status,
  
  -- 距离周期结束的天数
  CASE 
    WHEN p.period_end IS NOT NULL AND p.period_end > NOW() 
    THEN EXTRACT(DAY FROM (p.period_end - NOW()))
    ELSE NULL
  END AS days_until_period_end,
  
  -- 是否有 scheduled 升级/降级
  CASE 
    WHEN p.scheduled_plan_id IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END AS has_scheduled_change,
  
  -- Scheduled 变更类型
  CASE 
    WHEN p.scheduled_plan_id IS NOT NULL AND p.price_id = 'pro' AND p.scheduled_plan_id = 'proplus' THEN 'Upgrade to Pro+'
    WHEN p.scheduled_plan_id IS NOT NULL AND p.price_id = 'proplus' AND p.scheduled_plan_id = 'pro' THEN 'Downgrade to Pro'
    WHEN p.scheduled_plan_id IS NOT NULL THEN 'Plan Change'
    ELSE NULL
  END AS scheduled_change_type,
  
  -- Scheduled 生效日期（格式化）
  CASE 
    WHEN p.scheduled_period_start IS NOT NULL 
    THEN TO_CHAR(p.scheduled_period_start, 'YYYY-MM-DD HH24:MI:SS')
    ELSE NULL
  END AS scheduled_effective_date_formatted

FROM "user" u
INNER JOIN payment p ON p.user_id = u.id
LEFT JOIN user_credits uc ON uc.user_id = u.id
WHERE p.type = 'subscription'
ORDER BY 
  -- 优先显示活跃订阅
  CASE WHEN p.status IN ('active', 'trialing', 'past_due') THEN 0 ELSE 1 END,
  -- 然后按创建时间倒序
  p.created_at DESC;

-- ========== 可选：仅查询活跃订阅 ==========
/*
SELECT 
  u.email,
  u.name AS user_name,
  p.price_id AS current_plan,
  p.status,
  p.interval AS billing_interval,
  p.period_start,
  p.period_end,
  p.scheduled_plan_id AS scheduled_plan,
  p.scheduled_period_start AS scheduled_effective_date,
  uc.balance AS credits
FROM "user" u
INNER JOIN payment p ON p.user_id = u.id
LEFT JOIN user_credits uc ON uc.user_id = u.id
WHERE p.type = 'subscription'
  AND p.status IN ('active', 'trialing', 'past_due')
ORDER BY p.created_at DESC;
*/

-- ========== 可选：统计查询 ==========
/*
SELECT 
  p.status,
  p.provider,
  p.price_id AS plan,
  p.interval AS billing_interval,
  COUNT(*) AS subscription_count,
  COUNT(DISTINCT p.user_id) AS unique_users,
  COUNT(CASE WHEN p.scheduled_plan_id IS NOT NULL THEN 1 END) AS scheduled_changes
FROM payment p
WHERE p.type = 'subscription'
GROUP BY p.status, p.provider, p.price_id, p.interval
ORDER BY p.status, p.price_id;
*/

-- ========== 可选：查询有 scheduled 升级的用户 ==========
/*
SELECT 
  u.email,
  u.name,
  p.price_id AS current_plan,
  p.scheduled_plan_id AS scheduled_plan,
  p.scheduled_interval AS scheduled_billing,
  p.scheduled_period_start AS takes_effect_at,
  p.period_end AS current_period_end
FROM "user" u
INNER JOIN payment p ON p.user_id = u.id
WHERE p.type = 'subscription'
  AND p.scheduled_plan_id IS NOT NULL
  AND p.status IN ('active', 'trialing', 'past_due')
ORDER BY p.scheduled_period_start;
*/

