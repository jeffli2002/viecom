-- Export all users with their subscription status and scheduled changes
-- Run this in Neon SQL Editor

SELECT 
  u.email,
  u.name,
  u.id as user_id,
  u.created_at as registered_at,
  CASE 
    WHEN p.subscription_id IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END as has_subscription,
  COALESCE(p.plan_id, 'free') as current_plan,
  p.status,
  p.subscription_id,
  p.period_start,
  p.period_end,
  p.cancel_at_period_end,
  p.scheduled_plan_id,
  p.scheduled_period_start,
  p.scheduled_period_end,
  p.scheduled_at
FROM "user" u
LEFT JOIN LATERAL (
  SELECT *
  FROM payment
  WHERE user_id = u.id
    AND (status = 'active' OR status = 'trialing')
  ORDER BY created_at DESC
  LIMIT 1
) p ON true
ORDER BY 
  CASE WHEN p.subscription_id IS NOT NULL THEN 0 ELSE 1 END,
  u.email;

-- Summary statistics
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN p.subscription_id IS NOT NULL THEN u.id END) as subscribed_users,
  COUNT(DISTINCT CASE WHEN p.scheduled_plan_id IS NOT NULL THEN u.id END) as users_with_scheduled_changes,
  COUNT(DISTINCT CASE WHEN p.subscription_id IS NULL THEN u.id END) as free_users
FROM "user" u
LEFT JOIN LATERAL (
  SELECT *
  FROM payment
  WHERE user_id = u.id
    AND (status = 'active' OR status = 'trialing')
  ORDER BY created_at DESC
  LIMIT 1
) p ON true;