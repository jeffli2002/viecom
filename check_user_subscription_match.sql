-- Check if there's a user ID mismatch in the payment table
-- This query will help diagnose the 403 Forbidden error

-- First, find the subscription
SELECT 
  p.id,
  p.userId as payment_userId,
  p.customerId,
  p.subscriptionId,
  p.priceId,
  p.status,
  u.id as user_table_id,
  u.email
FROM payment p
LEFT JOIN "user" u ON p.userId = u.id
WHERE p.subscriptionId = 'sub_5EM6IgULEBVjEtMx5OH0TT'
ORDER BY p.createdAt DESC;

-- Also check if there's a user with the expected email
SELECT id, email, name FROM "user" WHERE email = 'jefflee2002@gmail.com';

-- Check all subscriptions for this user
SELECT 
  p.id,
  p.userId,
  p.subscriptionId,
  p.priceId,
  p.status,
  p.provider
FROM payment p
WHERE p.userId IN (SELECT id FROM "user" WHERE email = 'jefflee2002@gmail.com');
