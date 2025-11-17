-- 验证积分相关表和约束是否已创建
-- 此脚本用于检查并确保所有积分相关的数据库结构正确

-- 1. 检查 user_credits 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        RAISE EXCEPTION '表 user_credits 不存在';
    ELSE
        RAISE NOTICE '✓ 表 user_credits 存在';
    END IF;
END $$;

-- 2. 检查 user_credits 表的字段
DO $$
BEGIN
    -- 检查必要字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_credits' AND column_name = 'id') THEN
        RAISE EXCEPTION 'user_credits 表缺少 id 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_credits' AND column_name = 'user_id') THEN
        RAISE EXCEPTION 'user_credits 表缺少 user_id 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_credits' AND column_name = 'balance') THEN
        RAISE EXCEPTION 'user_credits 表缺少 balance 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_credits' AND column_name = 'total_earned') THEN
        RAISE EXCEPTION 'user_credits 表缺少 total_earned 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_credits' AND column_name = 'total_spent') THEN
        RAISE EXCEPTION 'user_credits 表缺少 total_spent 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_credits' AND column_name = 'frozen_balance') THEN
        RAISE EXCEPTION 'user_credits 表缺少 frozen_balance 字段';
    END IF;
    RAISE NOTICE '✓ user_credits 表所有必要字段存在';
END $$;

-- 3. 检查 credit_transactions 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_transactions') THEN
        RAISE EXCEPTION '表 credit_transactions 不存在';
    ELSE
        RAISE NOTICE '✓ 表 credit_transactions 存在';
    END IF;
END $$;

-- 4. 检查 credit_transactions 表的字段
DO $$
BEGIN
    -- 检查必要字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'id') THEN
        RAISE EXCEPTION 'credit_transactions 表缺少 id 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'user_id') THEN
        RAISE EXCEPTION 'credit_transactions 表缺少 user_id 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'type') THEN
        RAISE EXCEPTION 'credit_transactions 表缺少 type 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'amount') THEN
        RAISE EXCEPTION 'credit_transactions 表缺少 amount 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'balance_after') THEN
        RAISE EXCEPTION 'credit_transactions 表缺少 balance_after 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'source') THEN
        RAISE EXCEPTION 'credit_transactions 表缺少 source 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'description') THEN
        RAISE EXCEPTION 'credit_transactions 表缺少 description 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'reference_id') THEN
        RAISE EXCEPTION 'credit_transactions 表缺少 reference_id 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'metadata') THEN
        RAISE EXCEPTION 'credit_transactions 表缺少 metadata 字段';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'created_at') THEN
        RAISE EXCEPTION 'credit_transactions 表缺少 created_at 字段';
    END IF;
    RAISE NOTICE '✓ credit_transactions 表所有必要字段存在';
END $$;

-- 5. 检查 credit_user_reference_unique 唯一约束是否存在
-- 如果不存在，创建它（只对非 NULL 的 reference_id 应用唯一约束）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'credit_user_reference_unique'
    ) THEN
        -- 创建部分唯一索引（只对非 NULL 的 reference_id 应用唯一约束）
        -- 这样可以防止重复的 reference_id，同时允许 NULL 值
        CREATE UNIQUE INDEX credit_user_reference_unique 
        ON credit_transactions (user_id, reference_id) 
        WHERE reference_id IS NOT NULL;
        
        RAISE NOTICE '✓ 已创建唯一约束 credit_user_reference_unique';
    ELSE
        RAISE NOTICE '✓ 唯一约束 credit_user_reference_unique 已存在';
    END IF;
END $$;

-- 6. 检查外键约束
DO $$
BEGIN
    -- 检查 user_credits 的外键
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%user_credits_user_id%' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE WARNING 'user_credits 表可能缺少外键约束';
    ELSE
        RAISE NOTICE '✓ user_credits 表外键约束存在';
    END IF;
    
    -- 检查 credit_transactions 的外键
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%credit_transactions_user_id%' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE WARNING 'credit_transactions 表可能缺少外键约束';
    ELSE
        RAISE NOTICE '✓ credit_transactions 表外键约束存在';
    END IF;
END $$;

-- 7. 显示表结构摘要
SELECT 
    'user_credits' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'user_credits'
UNION ALL
SELECT 
    'credit_transactions' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'credit_transactions';

-- 8. 显示索引信息
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('user_credits', 'credit_transactions')
ORDER BY tablename, indexname;

RAISE NOTICE '========================================';
RAISE NOTICE '积分表验证完成！';
RAISE NOTICE '========================================';

