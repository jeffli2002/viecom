ALTER TABLE "rateLimit"
ADD COLUMN IF NOT EXISTS "id" text;

UPDATE "rateLimit"
SET "id" = "key"
WHERE "id" IS NULL;
