CREATE TABLE "cron_job_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"job_name" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"duration" integer,
	"status" text DEFAULT 'running' NOT NULL,
	"results" jsonb,
	"error_message" text,
	"created_at" timestamp NOT NULL
);
