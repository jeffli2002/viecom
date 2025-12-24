CREATE TABLE IF NOT EXISTS "rateLimit" (
  "key" text PRIMARY KEY NOT NULL,
  "count" integer NOT NULL,
  "last_request" bigint NOT NULL
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rateLimit'
      AND column_name = 'id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rateLimit'
      AND column_name = 'key'
  ) THEN
    ALTER TABLE "rateLimit" RENAME COLUMN "id" TO "key";
  END IF;
END $$;
