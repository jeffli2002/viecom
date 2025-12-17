-- Migration: Add reward system tables (checkin, referral, social share)
-- These tables are new additions and should not conflict with existing tables

CREATE TABLE IF NOT EXISTS "user_daily_checkin" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"checkin_date" text NOT NULL,
	"consecutive_days" integer DEFAULT 1 NOT NULL,
	"credits_earned" integer DEFAULT 0 NOT NULL,
	"weekly_bonus_earned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_daily_checkin_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "user_daily_checkin_user_date_unique" UNIQUE("user_id", "checkin_date")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_daily_checkin_user_id_idx" ON "user_daily_checkin"("user_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referred_id" text NOT NULL,
	"referral_code" text NOT NULL,
	"credits_awarded" boolean DEFAULT false NOT NULL,
	"referred_user_first_generation_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"credits_awarded_at" timestamp,
	CONSTRAINT "user_referrals_referrer_id_user_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "user_referrals_referred_id_user_id_fk" FOREIGN KEY ("referred_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "user_referrals_referred_id_unique" UNIQUE("referred_id"),
	CONSTRAINT "user_referrals_referral_code_idx" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_referrals_referrer_id_idx" ON "user_referrals"("referrer_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"asset_id" text,
	"platform" text NOT NULL,
	"share_url" text,
	"credits_earned" integer DEFAULT 0 NOT NULL,
	"reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_shares_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "social_shares_user_reference_unique" UNIQUE("user_id", "reference_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "social_shares_user_id_idx" ON "social_shares"("user_id");--> statement-breakpoint
-- Update credit_transactions source enum to include new reward sources
-- Note: This requires ALTER TYPE which may need to be done manually if the enum already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transactions_source_enum') THEN
        CREATE TYPE credit_transactions_source_enum AS ENUM ('subscription', 'api_call', 'admin', 'storage', 'bonus', 'checkin', 'referral', 'social_share');
    ELSE
        -- Add new enum values if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'checkin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'credit_transactions_source_enum')) THEN
            ALTER TYPE credit_transactions_source_enum ADD VALUE 'checkin';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'referral' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'credit_transactions_source_enum')) THEN
            ALTER TYPE credit_transactions_source_enum ADD VALUE 'referral';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'social_share' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'credit_transactions_source_enum')) THEN
            ALTER TYPE credit_transactions_source_enum ADD VALUE 'social_share';
        END IF;
    END IF;
END $$;

