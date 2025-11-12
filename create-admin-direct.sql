-- Direct SQL to create admin account
-- Password: admin123456 (bcrypt hash)
-- 
-- Run this SQL in your PostgreSQL database

INSERT INTO admins (
  id,
  email,
  name,
  password_hash,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@viecom.pro',
  'Admin User',
  '$2a$10$YourBcryptHashHere',  -- You need to generate this
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- To generate the password hash for 'admin123456', run:
-- node -e "console.log(require('bcryptjs').hashSync('admin123456', 10))"

