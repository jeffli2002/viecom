-- Fix missing or incorrect subscription_id in payment table
-- Run this in Neon SQL Editor

-- STEP 1: Diagnose the problem
SELECT 
    '=== DIAGNOSIS ===' as step,
    COUNT(*) FILTER (WHERE subscription_id IS NULL) as null_subscription_ids,
    COUNT(*) FILTER (WHERE subscription_id = id) as id_matches_subscription_id,
    COUNT(*) FILTER (WHERE subscription_id IS NOT NULL AND subscription_id != id) as has_different_subscription_id,
    COUNT(*) as total_active_subscriptions
FROM payment
WHERE status IN ('active', 'trialing')
  AND type = 'subscription'
  AND provider = 'creem';

-- STEP 2: Show affected records
SELECT 
    '=== AFFECTED RECORDS ===' as step;

SELECT 
    id as payment_id,
    subscription_id,
    user_id,
    price_id,
    status,
    created_at
FROM payment
WHERE status IN ('active', 'trialing')
  AND type = 'subscription'
  AND provider = 'creem'
  AND subscription_id IS NULL
ORDER BY created_at DESC;

-- STEP 3: Fix - Set subscription_id to payment.id
-- UNCOMMENT BELOW TO APPLY FIX
/*
UPDATE payment
SET subscription_id = id
WHERE status IN ('active', 'trialing')
  AND type = 'subscription'
  AND provider = 'creem'
  AND subscription_id IS NULL;
*/

-- STEP 4: Verify the fix
SELECT 
    '=== VERIFICATION ===' as step;

SELECT 
    id,
    subscription_id,
    user_id,
    price_id,
    status,
    CASE 
        WHEN subscription_id IS NULL THEN '❌ Still NULL'
        WHEN subscription_id = id THEN '✅ Fixed (id = subscription_id)'
        ELSE '✅ Has different subscription_id'
    END as fix_status
FROM payment
WHERE status IN ('active', 'trialing')
  AND type = 'subscription'
  AND provider = 'creem'
ORDER BY created_at DESC;

-- STEP 5: Test with a specific user (optional)
-- Replace 'user_email@example.com' with actual email
/*
SELECT 
    '=== USER SUBSCRIPTION CHECK ===' as step;

SELECT 
    p.id,
    p.subscription_id,
    p.user_id,
    p.price_id,
    p.status,
    u.email
FROM payment p
JOIN "user" u ON u.id = p.user_id
WHERE u.email = 'user_email@example.com'
  AND p.status IN ('active', 'trialing')
ORDER BY p.created_at DESC;
*/
