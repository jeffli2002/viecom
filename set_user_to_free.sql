-- 将用户设置为 Free 计划
-- 通过取消活跃订阅来实现

WITH target_user AS (
  SELECT id, email
  FROM "user"
  WHERE email = 'jefflee2002@gmail.com'
  LIMIT 1
)
UPDATE payment
SET 
  status = 'canceled',
  cancel_at_period_end = false,
  updated_at = NOW()
WHERE user_id IN (SELECT id FROM target_user)
  AND type = 'subscription'
  AND status IN ('active', 'trialing', 'past_due');

-- 验证更新结果
SELECT 
  tu.email,
  p.subscription_id,
  p.price_id AS plan_identifier,
  p.status,
  p.cancel_at_period_end,
  p.updated_at
FROM "user" tu
LEFT JOIN payment p ON p.user_id = tu.id AND p.type = 'subscription'
WHERE tu.email = 'jefflee2002@gmail.com'
ORDER BY p.created_at DESC;

