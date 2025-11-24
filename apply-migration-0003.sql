-- Quick fix: Apply only migration 0003 (scheduled columns)
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_plan_id" text;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_interval" text;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_period_start" timestamp;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_period_end" timestamp;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp;

-- Verify
SELECT COUNT(*) as scheduled_columns_count 
FROM information_schema.columns
WHERE table_name = 'payment' AND column_name LIKE 'scheduled_%';
