-- Apply only the scheduled columns migration (0003_lethal_menace.sql)
-- Run this directly in your database if drizzle-kit migrate fails

-- Add the scheduled upgrade columns
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_plan_id" text;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_interval" text;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_period_start" timestamp;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_period_end" timestamp;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
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

-- Update the migration tracking table so Drizzle knows this migration was applied
-- First, check if the __drizzle_migrations table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = '__drizzle_migrations'
    ) THEN
        -- Insert the migration record if not exists
        INSERT INTO __drizzle_migrations (hash, created_at)
        VALUES (
            (SELECT hash FROM (VALUES 
                ('0003_lethal_menace')
            ) AS v(hash)),
            EXTRACT(EPOCH FROM NOW()) * 1000
        )
        ON CONFLICT (hash) DO NOTHING;
        
        RAISE NOTICE 'Migration 0003_lethal_menace marked as applied';
    ELSE
        RAISE NOTICE 'Migration table does not exist - columns added but not tracked';
    END IF;
END $$;

-- Final verification
SELECT 
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ SUCCESS: All 5 scheduled columns exist!'
        ELSE '⚠️  WARNING: Only ' || COUNT(*) || ' out of 5 columns exist'
    END AS result
FROM information_schema.columns
WHERE table_name = 'payment' 
  AND column_name LIKE 'scheduled_%';
