-- View all columns for subscribed users
-- This script shows comprehensive information about all users with active or past subscriptions

SELECT 
  -- User Information
  u.id AS user_id,
  u.email,
  u.name AS user_name,
  u.role,
  u.created_at AS user_created_at,
  u.banned,
  u.ban_reason,
  u.ban_expires,
  
  -- Subscription/Payment Information
  p.id AS subscription_id,
  p.subscription_id AS creem_subscription_id,
  p.provider,
  p.price_id,
  p.product_id,
  p.type AS payment_type,
  p.interval AS billing_interval,
  p.status AS subscription_status,
  p.period_start,
  p.period_end,
  p.cancel_at_period_end,
  p.trial_start,
  p.trial_end,
  p.customer_id,
  p.created_at AS subscription_created_at,
  p.updated_at AS subscription_updated_at,
  
  -- Scheduled upgrade/downgrade fields (if they exist)
  -- Note: These columns may not exist if migration hasn't been applied
  -- p.scheduled_plan_id,
  -- p.scheduled_interval,
  -- p.scheduled_period_start,
  -- p.scheduled_period_end,
  -- p.scheduled_at,
  
  -- Credit Information
  uc.balance AS current_credits,
  uc.updated_at AS credits_updated_at,
  
  -- Additional computed fields
  CASE 
    WHEN p.status IN ('active', 'trialing', 'past_due') THEN 'Active'
    WHEN p.status = 'canceled' THEN 'Canceled'
    ELSE 'Other'
  END AS subscription_status_category,
  
  CASE 
    WHEN p.period_end IS NOT NULL AND p.period_end > NOW() THEN 'Current Period'
    WHEN p.period_end IS NOT NULL AND p.period_end <= NOW() THEN 'Expired'
    ELSE 'Unknown'
  END AS period_status,
  
  -- Days until period end (if active)
  CASE 
    WHEN p.period_end IS NOT NULL AND p.period_end > NOW() 
    THEN EXTRACT(DAY FROM (p.period_end - NOW()))
    ELSE NULL
  END AS days_until_period_end

FROM "user" u
INNER JOIN payment p ON p.user_id = u.id
LEFT JOIN user_credits uc ON uc.user_id = u.id
WHERE p.type = 'subscription'
ORDER BY 
  -- Show active subscriptions first
  CASE WHEN p.status IN ('active', 'trialing', 'past_due') THEN 0 ELSE 1 END,
  p.created_at DESC;

-- Alternative query: Only show users with ACTIVE subscriptions
-- Uncomment below to use this instead:

/*
SELECT 
  -- User Information
  u.id AS user_id,
  u.email,
  u.name AS user_name,
  u.role,
  u.created_at AS user_created_at,
  
  -- Subscription Information
  p.id AS subscription_id,
  p.subscription_id AS creem_subscription_id,
  p.provider,
  p.price_id,
  p.product_id,
  p.interval AS billing_interval,
  p.status AS subscription_status,
  p.period_start,
  p.period_end,
  p.cancel_at_period_end,
  p.customer_id,
  p.created_at AS subscription_created_at,
  
  -- Credit Information
  uc.balance AS current_credits,
  
  -- Plan identification
  CASE 
    WHEN p.price_id = 'proplus' OR p.product_id LIKE '%proplus%' THEN 'Pro+'
    WHEN p.price_id = 'pro' OR p.product_id LIKE '%pro%' THEN 'Pro'
    ELSE 'Unknown'
  END AS plan_name

FROM "user" u
INNER JOIN payment p ON p.user_id = u.id
LEFT JOIN user_credits uc ON uc.user_id = u.id
WHERE p.type = 'subscription'
  AND p.status IN ('active', 'trialing', 'past_due')
ORDER BY p.created_at DESC;
*/

-- Summary query: Count subscriptions by status and plan
/*
SELECT 
  p.status,
  p.provider,
  CASE 
    WHEN p.price_id = 'proplus' OR p.product_id LIKE '%proplus%' THEN 'Pro+'
    WHEN p.price_id = 'pro' OR p.product_id LIKE '%pro%' THEN 'Pro'
    ELSE 'Unknown'
  END AS plan_name,
  p.interval AS billing_interval,
  COUNT(*) AS subscription_count,
  COUNT(DISTINCT p.user_id) AS unique_users
FROM payment p
WHERE p.type = 'subscription'
GROUP BY p.status, p.provider, plan_name, p.interval
ORDER BY p.status, plan_name;
*/

