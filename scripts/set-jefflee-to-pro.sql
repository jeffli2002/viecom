-- Set jefflee2002@gmail.com subscription to Pro plan for testing
-- This allows testing the Pro → Pro+ upgrade flow

-- Step 1: Find the user
SELECT 
  id as user_id, 
  email, 
  name 
FROM "user" 
WHERE email = 'jefflee2002@gmail.com';

-- Step 2: Check current subscription
SELECT 
  id,
  user_id,
  subscription_id,
  product_id,
  price_id,
  status,
  interval,
  provider,
  created_at
FROM payment
WHERE user_id = (SELECT id FROM "user" WHERE email = 'jefflee2002@gmail.com')
AND provider = 'creem'
ORDER BY created_at DESC
LIMIT 1;

-- Step 3: Update subscription to Pro Monthly
-- Pro Monthly product_id: prod_kUzMsZPgszRro3jOiUrfd
UPDATE payment
SET 
  product_id = 'prod_kUzMsZPgszRro3jOiUrfd',
  price_id = 'pro',
  interval = 'month',
  status = 'active'
WHERE subscription_id = 'sub_5EM6IgULEBVjEtMx5OH0TT'
AND provider = 'creem';

-- Step 4: Clear any scheduled upgrades
UPDATE payment
SET 
  scheduled_plan_id = NULL,
  scheduled_interval = NULL,
  scheduled_period_start = NULL,
  scheduled_period_end = NULL,
  scheduled_at = NULL
WHERE subscription_id = 'sub_5EM6IgULEBVjEtMx5OH0TT'
AND provider = 'creem';

-- Step 5: Verify the change
SELECT 
  id,
  subscription_id,
  product_id,
  price_id,
  status,
  interval,
  scheduled_plan_id,
  scheduled_period_start
FROM payment
WHERE subscription_id = 'sub_5EM6IgULEBVjEtMx5OH0TT';

-- Expected result:
-- product_id: prod_kUzMsZPgszRro3jOiUrfd (Pro Monthly)
-- price_id: pro
-- interval: month
-- status: active
-- scheduled_plan_id: NULL (no scheduled upgrade)
