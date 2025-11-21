-- 检查用户订阅计划的 SQL 脚本
-- 支持查看所有用户或特定用户的订阅信息

-- ============================================
-- 选项 1: 查看所有用户的订阅计划
-- ============================================
SELECT
  u.email,
  u.id AS user_id,
  p.id AS payment_id,
  p.subscription_id,
  p.price_id AS plan_identifier,
  CASE p.price_id
    -- Pro Monthly
    WHEN 'prod_kUzMsZPgszRro3jOiUrfd' THEN 'Pro'
    -- ProPlus Monthly
    WHEN 'prod_4s8si1GkKRtU0HuUEWz6ry' THEN 'Pro+'
    -- Pro Yearly
    WHEN 'prod_7VQbOmypdWBKd8k1W4aiH2' THEN 'Pro (Yearly)'
    -- ProPlus Yearly
    WHEN 'prod_4SM5v4tktYr2rNXZnH70Fh' THEN 'Pro+ (Yearly)'
    -- Fallback
    ELSE COALESCE(p.price_id, 'Free')
  END AS logical_plan,
  p.interval,
  p.status,
  p.cancel_at_period_end,
  p.period_start,
  p.period_end,
  p.created_at AS subscription_created_at,
  p.updated_at AS subscription_updated_at,
  uc.balance AS credit_balance,
  uc.total_earned,
  uc.total_spent
FROM "user" u
LEFT JOIN payment p ON p.user_id = u.id 
  AND p.type = 'subscription'
  AND p.status IN ('active', 'trialing', 'past_due')
LEFT JOIN user_credits uc ON uc.user_id = u.id
ORDER BY u.email, p.created_at DESC;

-- ============================================
-- 选项 2: 查看特定用户的订阅计划（替换 email）
-- ============================================
/*
WITH target_user AS (
  SELECT id, email
  FROM "user"
  WHERE email = 'jefflee2002@gmail.com'  -- 替换为要查询的邮箱
  LIMIT 1
),
latest_subscription AS (
  SELECT p.*
  FROM payment p
  JOIN target_user tu ON p.user_id = tu.id
  WHERE p.type = 'subscription'
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT
  tu.email,
  tu.id AS user_id,
  ls.id AS payment_id,
  ls.subscription_id,
  ls.price_id AS plan_identifier,
  CASE ls.price_id
    WHEN 'prod_kUzMsZPgszRro3jOiUrfd' THEN 'Pro'
    WHEN 'prod_4s8si1GkKRtU0HuUEWz6ry' THEN 'Pro+'
    WHEN 'prod_7VQbOmypdWBKd8k1W4aiH2' THEN 'Pro (Yearly)'
    WHEN 'prod_4SM5v4tktYr2rNXZnH70Fh' THEN 'Pro+ (Yearly)'
    ELSE COALESCE(ls.price_id, 'Free')
  END AS logical_plan,
  ls.interval,
  ls.status,
  ls.cancel_at_period_end,
  ls.period_start,
  ls.period_end,
  ls.created_at AS subscription_created_at,
  ls.updated_at AS subscription_updated_at,
  uc.balance AS credit_balance,
  uc.total_earned,
  uc.total_spent,
  uc.updated_at AS credits_updated_at
FROM target_user tu
LEFT JOIN latest_subscription ls ON ls.user_id = tu.id
LEFT JOIN user_credits uc ON uc.user_id = tu.id;
*/

-- ============================================
-- 选项 3: 查看所有活跃订阅用户（仅付费用户）
-- ============================================
/*
SELECT
  u.email,
  u.id AS user_id,
  p.subscription_id,
  p.price_id AS plan_identifier,
  CASE p.price_id
    WHEN 'prod_kUzMsZPgszRro3jOiUrfd' THEN 'Pro'
    WHEN 'prod_4s8si1GkKRtU0HuUEWz6ry' THEN 'Pro+'
    WHEN 'prod_7VQbOmypdWBKd8k1W4aiH2' THEN 'Pro (Yearly)'
    WHEN 'prod_4SM5v4tktYr2rNXZnH70Fh' THEN 'Pro+ (Yearly)'
    ELSE p.price_id
  END AS logical_plan,
  p.interval,
  p.status,
  p.cancel_at_period_end,
  p.period_end,
  uc.balance AS credit_balance
FROM "user" u
INNER JOIN payment p ON p.user_id = u.id
  AND p.type = 'subscription'
  AND p.status IN ('active', 'trialing', 'past_due')
LEFT JOIN user_credits uc ON uc.user_id = u.id
ORDER BY p.created_at DESC;
*/

-- ============================================
-- 选项 4: 统计各计划的订阅数量
-- ============================================
/*
SELECT
  CASE p.price_id
    WHEN 'prod_kUzMsZPgszRro3jOiUrfd' THEN 'Pro'
    WHEN 'prod_4s8si1GkKRtU0HuUEWz6ry' THEN 'Pro+'
    WHEN 'prod_7VQbOmypdWBKd8k1W4aiH2' THEN 'Pro (Yearly)'
    WHEN 'prod_4SM5v4tktYr2rNXZnH70Fh' THEN 'Pro+ (Yearly)'
    ELSE COALESCE(p.price_id, 'Free')
  END AS plan_name,
  p.interval,
  p.status,
  COUNT(*) AS subscription_count,
  COUNT(CASE WHEN p.cancel_at_period_end = true THEN 1 END) AS canceling_count
FROM payment p
WHERE p.type = 'subscription'
  AND p.status IN ('active', 'trialing', 'past_due')
GROUP BY 
  CASE p.price_id
    WHEN 'prod_kUzMsZPgszRro3jOiUrfd' THEN 'Pro'
    WHEN 'prod_4s8si1GkKRtU0HuUEWz6ry' THEN 'Pro+'
    WHEN 'prod_7VQbOmypdWBKd8k1W4aiH2' THEN 'Pro (Yearly)'
    WHEN 'prod_4SM5v4tktYr2rNXZnH70Fh' THEN 'Pro+ (Yearly)'
    ELSE COALESCE(p.price_id, 'Free')
  END,
  p.interval,
  p.status
ORDER BY plan_name, p.interval;
*/

