ALTER TABLE "payment" ADD COLUMN "scheduled_plan_id" text;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "scheduled_interval" text;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "scheduled_period_start" timestamp;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "scheduled_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "scheduled_at" timestamp;