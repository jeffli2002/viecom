-- Fix: Database shows active but Creem says canceled
-- We need to sync the database with Creem's reality

-- Step 1: Check current state
SELECT 
    'CURRENT STATE IN DATABASE' as info,
    subscription_id,
    status as db_status,
    price_id,
    user_id,
    created_at,
    period_end
FROM payment
WHERE subscription_id = 'sub_6IW1jzFGNaN8FdSrOaA3at';

-- Step 2: Update to match Creem (mark as canceled)
UPDATE payment
SET 
    status = 'canceled',
    updated_at = NOW()
WHERE subscription_id = 'sub_6IW1jzFGNaN8FdSrOaA3at';

-- Step 3: Verify the update
SELECT 
    'AFTER UPDATE' as info,
    subscription_id,
    status as db_status,
    price_id,
    user_id,
    updated_at
FROM payment
WHERE subscription_id = 'sub_6IW1jzFGNaN8FdSrOaA3at';

-- Step 4: Check if there are any other subscriptions
SELECT 
    'ALL SUBSCRIPTIONS FOR USER' as info,
    subscription_id,
    status,
    price_id,
    created_at
FROM payment
WHERE user_id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L'
ORDER BY created_at DESC;
