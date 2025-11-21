-- Check if the subscription exists in the database
-- This is the subscription referenced in the webhook

SELECT 
  id,
  userId,
  subscriptionId,
  customerId,
  priceId,
  productId,
  status,
  interval,
  scheduledPlanId,
  scheduledInterval,
  scheduledPeriodStart,
  createdAt
FROM payment 
WHERE subscriptionId = 'sub_5EM6IgULEBVjEtMx5OH0TT';

-- Also check if there are any subscriptions for this user
SELECT COUNT(*) as total_subscriptions
FROM payment
WHERE userId = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L';

-- Check if the user exists
SELECT id, email, name 
FROM "user" 
WHERE id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L';
