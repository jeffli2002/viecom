-- 检查 jefflee2002@gmail.com 的积分状态和交易记录
-- 用于诊断升级后积分未显示的问题

-- 1. 查看用户基本信息
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created_at
FROM "user" u
WHERE u.email = 'jefflee2002@gmail.com';

-- 2. 查看用户当前积分余额
SELECT 
    u.email,
    uc.id as credit_account_id,
    uc.balance,
    uc.total_earned,
    uc.total_spent,
    uc.frozen_balance,
    uc.created_at as credit_account_created_at,
    uc.updated_at as credit_account_updated_at
FROM "user" u
LEFT JOIN user_credits uc ON uc.user_id = u.id
WHERE u.email = 'jefflee2002@gmail.com';

-- 3. 查看最近的积分交易记录（最近 20 条）
SELECT 
    u.email,
    ct.id as transaction_id,
    ct.type,
    ct.amount,
    ct.balance_after,
    ct.source,
    ct.description,
    ct.reference_id,
    ct.metadata,
    ct.created_at
FROM "user" u
JOIN credit_transactions ct ON ct.user_id = u.id
WHERE u.email = 'jefflee2002@gmail.com'
ORDER BY ct.created_at DESC
LIMIT 20;

-- 4. 查看订阅相关的积分交易记录
SELECT 
    u.email,
    ct.id as transaction_id,
    ct.type,
    ct.amount,
    ct.balance_after,
    ct.source,
    ct.description,
    ct.reference_id,
    ct.metadata,
    ct.created_at
FROM "user" u
JOIN credit_transactions ct ON ct.user_id = u.id
WHERE u.email = 'jefflee2002@gmail.com'
  AND ct.source = 'subscription'
ORDER BY ct.created_at DESC
LIMIT 10;

-- 5. 查看最近的订阅记录
SELECT 
    u.email,
    p.id as payment_id,
    p.subscription_id,
    p.price_id,
    p.product_id,
    p.status,
    p.interval,
    p.period_start,
    p.period_end,
    p.cancel_at_period_end,
    p.created_at,
    p.updated_at
FROM "user" u
JOIN payment p ON p.user_id = u.id
WHERE u.email = 'jefflee2002@gmail.com'
  AND p.type = 'subscription'
ORDER BY p.created_at DESC
LIMIT 10;

-- 6. 查看活跃订阅记录
SELECT 
    u.email,
    p.id as payment_id,
    p.subscription_id,
    p.price_id,
    p.product_id,
    p.status,
    p.interval,
    p.period_start,
    p.period_end,
    p.cancel_at_period_end,
    p.created_at,
    p.updated_at
FROM "user" u
JOIN payment p ON p.user_id = u.id
WHERE u.email = 'jefflee2002@gmail.com'
  AND p.type = 'subscription'
  AND p.status IN ('active', 'trialing')
ORDER BY p.created_at DESC;

-- 7. 统计积分交易（按类型和来源）
SELECT 
    ct.type,
    ct.source,
    COUNT(*) as transaction_count,
    SUM(ct.amount) as total_amount,
    MIN(ct.created_at) as first_transaction,
    MAX(ct.created_at) as last_transaction
FROM "user" u
JOIN credit_transactions ct ON ct.user_id = u.id
WHERE u.email = 'jefflee2002@gmail.com'
GROUP BY ct.type, ct.source
ORDER BY last_transaction DESC;

-- 8. 检查是否有重复的积分授予（通过 reference_id）
SELECT 
    ct.reference_id,
    COUNT(*) as duplicate_count,
    MIN(ct.created_at) as first_created,
    MAX(ct.created_at) as last_created,
    SUM(ct.amount) as total_amount
FROM "user" u
JOIN credit_transactions ct ON ct.user_id = u.id
WHERE u.email = 'jefflee2002@gmail.com'
  AND ct.reference_id IS NOT NULL
  AND ct.source = 'subscription'
GROUP BY ct.reference_id
HAVING COUNT(*) > 1
ORDER BY last_created DESC;

-- 9. 检查最近 1 小时内的积分交易（用于诊断刚发生的升级）
SELECT 
    u.email,
    ct.id as transaction_id,
    ct.type,
    ct.amount,
    ct.balance_after,
    ct.source,
    ct.description,
    ct.reference_id,
    ct.metadata,
    ct.created_at,
    NOW() - ct.created_at as time_ago
FROM "user" u
JOIN credit_transactions ct ON ct.user_id = u.id
WHERE u.email = 'jefflee2002@gmail.com'
  AND ct.created_at > NOW() - INTERVAL '1 hour'
ORDER BY ct.created_at DESC;

