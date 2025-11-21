# Admin Login Troubleshooting Guide

## 🚨 Problem: Login Not Working

If you're experiencing "no response" when logging in to the admin panel, follow these steps:

---

## ✅ Step 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try logging in again
4. Check for errors

**Common errors:**
- `Failed to fetch` - Backend not running or API route issue
- `401 Unauthorized` - Invalid credentials or admin not created
- `500 Internal Server Error` - Database connection issue

---

## ✅ Step 2: Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try logging in
4. Look for the request to `/api/admin/auth/login`

**Check:**
- Status code (should be 200 for success, 401 for wrong credentials)
- Response body (check error message)

---

## ✅ Step 3: Verify Admin Account Exists

### Option A: Run the Create Admin Script (Recommended)

On your production server:

```bash
# Navigate to project directory
cd /path/to/viecom

# Set environment variables (optional)
export ADMIN_EMAIL=admin@viecom.pro
export ADMIN_PASSWORD=admin123456

# Run the script
pnpm tsx src/scripts/create-admin.ts
```

**Expected output:**
```
✅ Admin user created successfully:
Email: admin@viecom.pro
Password: admin123456
ID: [some-uuid]

⚠️ Please change the password after first login!
```

If you see:
```
ℹ️ Admin user already exists with email: admin@viecom.pro
```
Then the account already exists, and the issue is elsewhere.

### Option B: Check Database Directly

Connect to your PostgreSQL database and run:

```sql
SELECT id, email, name, created_at 
FROM admins 
WHERE email = 'admin@viecom.pro';
```

**If no results:** Admin account doesn't exist. Go to Step 4.

**If results exist:** Admin account exists. Go to Step 5.

---

## ✅ Step 4: Create Admin Account

### Method 1: Using Node.js Script

```bash
cd /path/to/viecom
pnpm tsx src/scripts/create-admin.ts
```

### Method 2: Using SQL (Generate hash first)

Generate bcrypt hash for password:

```bash
node -e "console.log(require('bcryptjs').hashSync('admin123456', 10))"
```

Example output: `$2a$10$N9qo8uLOickgx2ZMRZoMye/IVI0fNzW5jZOab0laE7SZF5q0XS8ba`

Then run SQL:

```sql
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
  '$2a$10$N9qo8uLOickgx2ZMRZoMye/IVI0fNzW5jZOab0laE7SZF5q0XS8ba',
  'admin',
  NOW(),
  NOW()
);
```

---

## ✅ Step 5: Verify Environment Variables

Check that these environment variables are set on your production server:

```bash
# Required
DATABASE_URL=postgresql://...
ADMIN_JWT_SECRET=your-secret-key-here

# Optional (for custom admin)
ADMIN_EMAIL=admin@viecom.pro
ADMIN_PASSWORD=admin123456
```

**To verify:**

```bash
echo $ADMIN_JWT_SECRET
# Should output your secret key

echo $DATABASE_URL
# Should output your database connection string
```

---

## ✅ Step 6: Check Database Connection

Test if the app can connect to the database:

```bash
# Try running a simple query
pnpm tsx -e "
import { db } from './src/server/db/index.ts';
console.log('Testing database connection...');
const result = await db.execute('SELECT NOW()');
console.log('✅ Database connected:', result);
"
```

---

## ✅ Step 7: Check Application Logs

Look at your application logs for errors:

```bash
# If using PM2
pm2 logs viecom

# If using Docker
docker logs <container-id>

# If using systemd
journalctl -u viecom -n 100
```

**Look for:**
- Database connection errors
- JWT secret errors
- bcrypt errors
- Route handler errors

---

## ✅ Step 8: Verify Deployment

Make sure the latest code is deployed:

```bash
# Check latest commit
git log -1

# Should show:
# commit 6afb0c1 or later
# fix(admin): fix table names and replace jsonwebtoken with jose
```

If not on latest commit:

```bash
git pull origin main
pnpm install
pnpm build
# Restart your application
```

---

## 🔍 Quick Diagnosis Checklist

- [ ] Browser console shows no JavaScript errors
- [ ] Network tab shows request to `/api/admin/auth/login`
- [ ] Request returns 401 (wrong credentials) or 500 (server error)
- [ ] Admin account exists in database
- [ ] `ADMIN_JWT_SECRET` environment variable is set
- [ ] `DATABASE_URL` environment variable is set
- [ ] Database is accessible and running
- [ ] Latest code is deployed (commit 6afb0c1 or later)

---

## 🆘 Still Not Working?

### Test with cURL

```bash
curl -X POST https://www.viecom.pro/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@viecom.pro",
    "password": "admin123456",
    "remember": false
  }'
```

**Expected responses:**

**Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "admin": {
    "id": "...",
    "email": "admin@viecom.pro",
    "name": "Admin User"
  }
}
```

**Wrong credentials (401):**
```json
{
  "error": "Invalid email or password"
}
```

**Server error (500):**
```json
{
  "error": "Internal server error"
}
```

---

## 📞 Common Solutions

### Solution 1: Admin Not Created
```bash
pnpm tsx src/scripts/create-admin.ts
```

### Solution 2: Wrong Password
Reset password by updating database:
```sql
UPDATE admins 
SET password_hash = '$2a$10$[NEW_HASH]'
WHERE email = 'admin@viecom.pro';
```

### Solution 3: Database Connection
Check `DATABASE_URL` and database status:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Solution 4: JWT Secret Missing
Add to `.env` or environment:
```bash
export ADMIN_JWT_SECRET=your-super-secret-key-change-in-production
```

---

## 📧 Default Credentials

**Email:** `admin@viecom.pro`
**Password:** `admin123456`

⚠️ **IMPORTANT:** Change the password immediately after first successful login!

---

Last Updated: 2024-11-12

