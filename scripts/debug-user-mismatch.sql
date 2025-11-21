-- Debug user mismatch issue for 403 Forbidden error
-- The subscription_id exists but user doesn't match

-- Step 1: Check which user owns this subscription
SELECT 
    p.id as payment_id,
    p.subscription_id,
    p.user_id as payment_user_id,
    u.email as payment_owner_email,
    u.name as payment_owner_name,
    p.price_id,
    p.status
FROM payment p
JOIN "user" u ON u.id = p.user_id
WHERE p.subscription_id = 'sub_6IW1jzFGNaN8FdSrOaA3at';

-- Step 2: Check if there are any other users with active subscriptions
SELECT 
    u.email,
    u.name,
    u.id as user_id,
    p.subscription_id,
    p.price_id,
    p.status
FROM payment p
JOIN "user" u ON u.id = p.user_id
WHERE p.status IN ('active', 'trialing')
  AND p.provider = 'creem'
ORDER BY p.created_at DESC;

-- Step 3: Find which user is currently logged in trying to upgrade
-- You'll need to check the session in the application
-- But here's a query to see all users:
SELECT 
    id as user_id,
    email,
    name,
    created_at
FROM "user"
ORDER BY created_at DESC
LIMIT 10;
