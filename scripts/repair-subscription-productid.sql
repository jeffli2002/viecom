-- Repair Script: Fix product_id for existing subscriptions
-- This fixes the sync issue where database product_id doesn't match Creem

-- For the specific user with subscription sub_5EM6IgULEBVjEtMx5OH0TT
-- Update to Pro+ Monthly product ID
UPDATE payment
SET product_id = 'prod_4s8si1GkKRtU0HuUEWz6ry'
WHERE subscription_id = 'sub_5EM6IgULEBVjEtMx5OH0TT'
AND provider = 'creem';

-- Verify the update
SELECT 
  id,
  subscription_id,
  product_id,
  price_id,
  status,
  interval,
  provider
FROM payment
WHERE subscription_id = 'sub_5EM6IgULEBVjEtMx5OH0TT';
