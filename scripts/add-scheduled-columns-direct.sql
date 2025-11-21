-- Direct SQL script to add scheduled columns to payment table
-- Run this directly in Neon database console or any PostgreSQL client

-- Check if columns exist first
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'payment'
  AND column_name LIKE 'scheduled%'
ORDER BY column_name;

-- Add columns (will fail if they already exist, which is fine)
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS scheduled_plan_id text;
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS scheduled_interval text;
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS scheduled_period_start timestamp;
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS scheduled_period_end timestamp;
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS scheduled_at timestamp;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'payment'
  AND column_name LIKE 'scheduled%'
ORDER BY column_name;

-- Test query to ensure columns are accessible
SELECT 
  id,
  price_id,
  scheduled_plan_id,
  scheduled_interval,
  scheduled_period_start,
  scheduled_period_end,
  scheduled_at
FROM payment
WHERE type = 'subscription'
LIMIT 1;

