-- Quick verification query for scheduled upgrade columns
-- Run this in Neon SQL Editor

-- 1. Check if all 5 columns exist
SELECT 
  'Columns Check' as test,
  COUNT(*) as found_columns,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 5, found ' || COUNT(*)
  END as status
FROM information_schema.columns
WHERE table_name = 'payment' 
  AND column_name LIKE 'scheduled_%';

-- 2. List all scheduled columns with their types
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'payment'
  AND column_name IN (
    'scheduled_plan_id',
    'scheduled_interval', 
    'scheduled_period_start',
    'scheduled_period_end',
    'scheduled_at'
  )
ORDER BY column_name;

-- 3. Check for any existing scheduled upgrades
SELECT 
  'Scheduled Upgrades Check' as test,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Found ' || COUNT(*) || ' scheduled upgrade(s)'
    ELSE 'ℹ️  No scheduled upgrades yet'
  END as status
FROM payment
WHERE scheduled_plan_id IS NOT NULL;

-- 4. Sample of any scheduled upgrades (if they exist)
SELECT 
  id,
  user_id,
  price_id as current_plan,
  scheduled_plan_id,
  scheduled_interval,
  scheduled_period_start,
  period_end as current_period_end,
  status
FROM payment
WHERE scheduled_plan_id IS NOT NULL
LIMIT 5;
