CREATE TABLE "publish_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"asset_id" text,
	"asset_url" text NOT NULL,
	"preview_url" text,
	"asset_type" text DEFAULT 'image' NOT NULL,
	"title" text,
	"prompt" text,
	"category" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"publish_to_landing" boolean DEFAULT false NOT NULL,
	"publish_to_showcase" boolean DEFAULT false NOT NULL,
	"tags" jsonb,
	"metadata" jsonb,
	"admin_notes" text,
	"rejection_reason" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "publish_submissions" ADD CONSTRAINT "publish_submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;