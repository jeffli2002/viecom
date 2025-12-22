CREATE TABLE IF NOT EXISTS "rateLimit" (
  "key" text PRIMARY KEY NOT NULL,
  "count" integer NOT NULL,
  "last_request" bigint NOT NULL
);
