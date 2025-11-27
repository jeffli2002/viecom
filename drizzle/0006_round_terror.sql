CREATE TABLE "landing_showcase_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"category" text,
	"cta_url" text,
	"is_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "publish_submissions" ADD COLUMN "landing_order" integer;