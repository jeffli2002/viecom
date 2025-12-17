CREATE TABLE IF NOT EXISTS "generation_lock" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"asset_type" text NOT NULL,
	"request_id" text,
	"task_id" text,
	"metadata" jsonb,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "generation_lock_user_asset_idx" ON "generation_lock" USING btree ("user_id","asset_type");
