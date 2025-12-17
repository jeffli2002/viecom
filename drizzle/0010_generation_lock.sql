CREATE TABLE "generation_lock" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"asset_type" text NOT NULL,
	"request_id" text,
	"task_id" text,
	"metadata" jsonb,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);

ALTER TABLE "generation_lock" ADD CONSTRAINT "generation_lock_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;

CREATE UNIQUE INDEX "generation_lock_user_asset_idx" ON "generation_lock" USING btree ("user_id","asset_type");
