-- Check if scheduled columns exist
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

-- Check subscriptions with scheduled upgrades
SELECT 
  COUNT(*) as total_scheduled_upgrades
FROM payment
WHERE scheduled_plan_id IS NOT NULL;

-- Show sample of scheduled upgrades  
SELECT 
  id,
  user_id,
  price_id as current_plan,
  scheduled_plan_id,
  scheduled_interval,
  scheduled_period_start,
  status,
  created_at,
  updated_at
FROM payment
WHERE scheduled_plan_id IS NOT NULL
LIMIT 10;
