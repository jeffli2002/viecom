CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_generation_job" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_rows" integer NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"successful_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"csv_file_key" text,
	"column_mapping" jsonb,
	"error_report" text,
	"zip_file_key" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "brand_tone_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"website_url" text,
	"brand_attributes" jsonb,
	"color_palette" jsonb,
	"tone_description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "brand_tone_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "credit_consumption_config" (
	"id" text PRIMARY KEY NOT NULL,
	"generation_type" text NOT NULL,
	"style_id" text,
	"credits" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"source" text NOT NULL,
	"description" text,
	"reference_id" text,
	"metadata" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_asset" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"batch_job_id" text,
	"asset_type" text NOT NULL,
	"generation_mode" text NOT NULL,
	"product_name" text,
	"product_description" text,
	"base_image_url" text,
	"prompt" text NOT NULL,
	"enhanced_prompt" text,
	"negative_prompt" text,
	"style_id" text,
	"style_customization" text,
	"video_style" text,
	"script" text,
	"script_audio_url" text,
	"r2_key" text NOT NULL,
	"public_url" text NOT NULL,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"duration" integer,
	"file_size" integer,
	"status" text DEFAULT 'processing' NOT NULL,
	"error_message" text,
	"credits_spent" integer DEFAULT 0 NOT NULL,
	"generation_params" jsonb,
	"metadata" jsonb,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"price_id" text NOT NULL,
	"product_id" text,
	"type" text NOT NULL,
	"interval" text,
	"user_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"subscription_id" text,
	"status" text NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"cancel_at_period_end" boolean,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_event" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"event_type" text NOT NULL,
	"stripe_event_id" text,
	"creem_event_id" text,
	"event_data" text,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "payment_event_stripe_event_id_unique" UNIQUE("stripe_event_id"),
	CONSTRAINT "payment_event_creem_event_id_unique" UNIQUE("creem_event_id")
);
--> statement-breakpoint
CREATE TABLE "platform_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"account_name" text,
	"account_id" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"connection_metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_publish" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"platform" text NOT NULL,
	"platform_account_id" text,
	"product_id" text,
	"product_name" text,
	"product_description" text,
	"product_category" text,
	"product_brand" text,
	"product_model" text,
	"product_sku" text,
	"product_upc" text,
	"product_country_of_origin" text,
	"standard_price" numeric(10, 2),
	"sale_price" numeric(10, 2),
	"currency" text DEFAULT 'USD',
	"inventory_quantity" integer,
	"min_purchase_quantity" integer DEFAULT 1,
	"max_purchase_quantity" integer,
	"image_id" text,
	"video_id" text,
	"thumbnail_id" text,
	"publish_status" text DEFAULT 'pending' NOT NULL,
	"publish_url" text,
	"publish_id" text,
	"error_message" text,
	"publish_metadata" jsonb,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "showcase_gallery" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"asset_id" text,
	"platform" text NOT NULL,
	"share_url" text,
	"credits_earned" integer DEFAULT 0 NOT NULL,
	"reference_id" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "style_configuration" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"style_type" text NOT NULL,
	"prompt_template" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan_type" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"frozen_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_credits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_daily_checkin" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"checkin_date" text NOT NULL,
	"consecutive_days" integer DEFAULT 1 NOT NULL,
	"credits_earned" integer DEFAULT 0 NOT NULL,
	"weekly_bonus_earned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_quota_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"service" text NOT NULL,
	"period" text NOT NULL,
	"used_amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referred_id" text NOT NULL,
	"referral_code" text NOT NULL,
	"credits_awarded" boolean DEFAULT false NOT NULL,
	"referred_user_first_generation_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"credits_awarded_at" timestamp,
	CONSTRAINT "user_referrals_referred_id_unique" UNIQUE("referred_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_generation_job" ADD CONSTRAINT "batch_generation_job_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_tone_profile" ADD CONSTRAINT "brand_tone_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_consumption_config" ADD CONSTRAINT "credit_consumption_config_style_id_style_configuration_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."style_configuration"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_asset" ADD CONSTRAINT "generated_asset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_asset" ADD CONSTRAINT "generated_asset_batch_job_id_batch_generation_job_id_fk" FOREIGN KEY ("batch_job_id") REFERENCES "public"."batch_generation_job"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_account" ADD CONSTRAINT "platform_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_publish" ADD CONSTRAINT "platform_publish_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_publish" ADD CONSTRAINT "platform_publish_asset_id_generated_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."generated_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_gallery" ADD CONSTRAINT "showcase_gallery_asset_id_generated_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."generated_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_checkin" ADD CONSTRAINT "user_daily_checkin_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quota_usage" ADD CONSTRAINT "user_quota_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_referrals" ADD CONSTRAINT "user_referrals_referrer_id_user_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_referrals" ADD CONSTRAINT "user_referrals_referred_id_user_id_fk" FOREIGN KEY ("referred_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;