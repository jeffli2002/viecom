-- Ensure credit_transactions_source_enum supports credit pack purchases
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transactions_source_enum') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumlabel = 'purchase'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'credit_transactions_source_enum')
    ) THEN
      ALTER TYPE credit_transactions_source_enum ADD VALUE 'purchase';
    END IF;
  ELSE
    CREATE TYPE credit_transactions_source_enum AS ENUM (
      'subscription',
      'purchase',
      'api_call',
      'admin',
      'storage',
      'bonus',
      'checkin',
      'referral',
      'social_share'
    );
  END IF;
END $$;
