-- 将 jefflee2002@gmail.com 设置为 Free 计划
-- 通过取消活跃订阅来实现

-- 1. 查看当前订阅状态
SELECT 
    u.email,
    p.id as subscription_id,
    p.subscription_id as creem_subscription_id,
    p.price_id,
    p.product_id,
    p.status,
    p.interval,
    p.period_start,
    p.period_end,
    p.cancel_at_period_end,
    p.created_at
FROM "user" u
LEFT JOIN payment p ON p.user_id = u.id
WHERE u.email = 'jefflee2002@gmail.com'
ORDER BY p.created_at DESC;

-- 2. 取消所有活跃订阅（设置为 canceled 状态）
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

-- 3. 验证更新结果
SELECT 
    u.email,
    p.id as subscription_id,
    p.subscription_id as creem_subscription_id,
    p.price_id,
    p.product_id,
    p.status,
    p.interval,
    p.period_start,
    p.period_end,
    p.cancel_at_period_end,
    p.updated_at
FROM "user" u
LEFT JOIN payment p ON p.user_id = u.id AND p.type = 'subscription'
WHERE u.email = 'jefflee2002@gmail.com'
ORDER BY p.created_at DESC;

-- 4. 显示用户当前积分状态
SELECT 
    u.email,
    uc.balance,
    uc.total_earned,
    uc.total_spent,
    uc.updated_at as credits_updated_at
FROM "user" u
LEFT JOIN user_credits uc ON uc.user_id = u.id
WHERE u.email = 'jefflee2002@gmail.com';

