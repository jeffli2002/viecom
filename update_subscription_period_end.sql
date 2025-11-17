-- 更新现有订阅的 period_end
-- 如果 period_end 为空但 period_start 存在，根据 interval 计算 period_end

UPDATE payment
SET 
  period_end = CASE 
    -- 如果有 period_start，根据 interval 计算 period_end
    WHEN period_start IS NOT NULL AND period_end IS NULL THEN
      CASE interval
        WHEN 'month' THEN period_start + INTERVAL '1 month'
        WHEN 'year' THEN period_start + INTERVAL '1 year'
        ELSE period_start + INTERVAL '1 month'  -- 默认按月
      END
    ELSE period_end  -- 保持原值
  END,
  updated_at = NOW()
WHERE type = 'subscription'
  AND status IN ('active', 'trialing', 'past_due')
  AND period_end IS NULL
  AND period_start IS NOT NULL;

-- 查看更新结果
SELECT 
  id,
  subscription_id,
  price_id,
  status,
  interval,
  period_start,
  period_end,
  updated_at
FROM payment
WHERE type = 'subscription'
  AND status IN ('active', 'trialing', 'past_due')
ORDER BY updated_at DESC
LIMIT 10;

