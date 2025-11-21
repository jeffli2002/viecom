-- 将 jefflee2002@gmail.com 从 pro+ 设置为 free，并将积分设置为 100
-- 执行日期: 2024

-- 1. 查看当前状态
SELECT 
    u.email,
    u.id as user_id,
    p.id as subscription_id,
    p.subscription_id as creem_subscription_id,
    p.price_id,
    p.status,
    p.interval,
    uc.balance,
    uc.total_earned,
    uc.total_spent
FROM "user" u
LEFT JOIN payment p ON p.user_id = u.id AND p.type = 'subscription'
LEFT JOIN user_credits uc ON uc.user_id = u.id
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

-- 3. 设置积分为 100
-- 首先确保用户有积分账户，然后更新余额
WITH target_user AS (
  SELECT id, email
  FROM "user"
  WHERE email = 'jefflee2002@gmail.com'
  LIMIT 1
)
INSERT INTO user_credits (id, user_id, balance, total_earned, total_spent, frozen_balance, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    tu.id,
    100,
    100,
    0,
    0,
    NOW(),
    NOW()
FROM target_user tu
WHERE NOT EXISTS (
  SELECT 1 FROM user_credits uc WHERE uc.user_id = tu.id
)
ON CONFLICT (user_id) DO UPDATE
SET 
    balance = 100,
    updated_at = NOW();

-- 4. 记录积分调整交易（如果需要）
-- 获取调整前的余额，然后记录交易
WITH target_user AS (
  SELECT id, email
  FROM "user"
  WHERE email = 'jefflee2002@gmail.com'
  LIMIT 1
),
old_balance AS (
  SELECT uc.balance
  FROM user_credits uc
  INNER JOIN target_user tu ON uc.user_id = tu.id
)
INSERT INTO credit_transactions (
    id,
    user_id,
    type,
    amount,
    balance_after,
    source,
    description,
    reference_id,
    created_at
)
SELECT 
    gen_random_uuid(),
    tu.id,
    CASE 
      WHEN COALESCE(ob.balance, 0) < 100 THEN 'earn'
      WHEN COALESCE(ob.balance, 0) > 100 THEN 'spend'
      ELSE 'admin_adjust'
    END,
    ABS(100 - COALESCE(ob.balance, 0)),
    100,
    'admin',
    'Admin adjustment: Set credits to 100 (downgrade from pro+ to free)',
    'admin_set_credits_' || tu.id || '_' || EXTRACT(EPOCH FROM NOW())::bigint,
    NOW()
FROM target_user tu
CROSS JOIN LATERAL (
  SELECT balance FROM user_credits WHERE user_id = tu.id
) ob
WHERE 100 - COALESCE(ob.balance, 0) != 0;

-- 6. 验证最终状态
SELECT 
    u.email,
    u.id as user_id,
    p.id as subscription_id,
    p.status as subscription_status,
    p.price_id,
    uc.balance,
    uc.total_earned,
    uc.total_spent,
    uc.updated_at as credits_updated_at
FROM "user" u
LEFT JOIN payment p ON p.user_id = u.id AND p.type = 'subscription' AND p.status = 'active'
LEFT JOIN user_credits uc ON uc.user_id = u.id
WHERE u.email = 'jefflee2002@gmail.com';

