-- Check ALL subscriptions for this user in database
SELECT 
    subscription_id,
    status,
    price_id,
    interval,
    created_at,
    period_start,
    period_end,
    cancel_at_period_end
FROM payment
WHERE user_id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L'
  AND provider = 'creem'
ORDER BY created_at DESC;
