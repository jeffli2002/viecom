-- 修复后的 SQL 查询，正确映射产品 ID 到计划名称
-- 根据环境变量配置：
-- CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY="prod_kUzMsZPgszRro3jOiUrfd" → Pro
-- CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY="prod_4s8si1GkKRtU0HuUEWz6ry" → ProPlus
-- CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY="prod_7VQbOmypdWBKd8k1W4aiH2" → Pro (Yearly)
-- CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY="prod_4SM5v4tktYr2rNXZnH70Fh" → ProPlus (Yearly)

WITH target_user AS (
  SELECT id, email
  FROM "user"
  WHERE email = 'jefflee2002@gmail.com'
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
  ls.subscription_id,
  ls.price_id AS plan_identifier,
  CASE ls.price_id
    -- Pro Monthly
    WHEN 'prod_kUzMsZPgszRro3jOiUrfd' THEN 'Pro'
    -- ProPlus Monthly
    WHEN 'prod_4s8si1GkKRtU0HuUEWz6ry' THEN 'Pro+'
    -- Pro Yearly
    WHEN 'prod_7VQbOmypdWBKd8k1W4aiH2' THEN 'Pro (Yearly)'
    -- ProPlus Yearly
    WHEN 'prod_4SM5v4tktYr2rNXZnH70Fh' THEN 'Pro+ (Yearly)'
    -- Fallback: return the price_id itself
    ELSE ls.price_id
  END AS logical_plan,
  ls.interval,
  ls.status,
  ls.cancel_at_period_end,
  uc.balance AS credit_balance,
  uc.total_earned,
  uc.total_spent,
  uc.updated_at AS credits_updated_at
FROM target_user tu
LEFT JOIN latest_subscription ls ON ls.user_id = tu.id
LEFT JOIN user_credits uc ON uc.user_id = tu.id;

