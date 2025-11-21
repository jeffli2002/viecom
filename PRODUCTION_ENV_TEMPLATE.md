# Viecom Production Environment Variables

## 🚨 REQUIRED Variables (App will NOT start without these)

Copy these to your production environment (Vercel, Railway, etc.):

```bash
# App URL (REQUIRED)
NEXT_PUBLIC_APP_URL="https://www.viecom.pro"

# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Auth Secret (REQUIRED - at least 32 characters)
BETTER_AUTH_SECRET="generate-a-long-random-string-at-least-32-chars"

# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# KIE API for AI Generation (REQUIRED)
KIE_API_KEY="your-kie-api-key"
```

## 🔑 Admin Dashboard Variables (Required for `/admin/login`)

```bash
# Admin JWT Secret (REQUIRED for admin login)
ADMIN_JWT_SECRET="your-super-secret-admin-key-min-32-chars"

# Admin Account Creation (optional)
ADMIN_EMAIL="admin@viecom.pro"
ADMIN_PASSWORD="admin123456"
```

## ⚙️ Optional Variables (with defaults)

```bash
# Node Environment
NODE_ENV="production"

# Email Service (Resend)
RESEND_API_KEY="re_your_resend_api_key"
RESEND_FROM_EMAIL="noreply@viecom.pro"

# R2 Storage (Cloudflare)
R2_BUCKET_NAME="viecom-storage"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://storage.viecom.pro"

# AI Services (optional)
DEEPSEEK_API_KEY="sk-your-deepseek-api-key"
FIRECRAWL_API_KEY="fc-your-firecrawl-api-key"
OPENROUTER_API_KEY="sk-or-your-openrouter-key"

# Cron Jobs Security
CRON_SECRET="your-cron-secret-key"

# Redis (optional, for job queue)
REDIS_URL="redis://default:password@host:6379"

# Creem Payment Gateway
CREEM_API_KEY="your-creem-api-key"
CREEM_WEBHOOK_SECRET="your-creem-webhook-secret"
CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY="pro-monthly-key"
CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY="proplus-monthly-key"
CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY="pro-yearly-key"
CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY="proplus-yearly-key"
NEXT_PUBLIC_CREEM_TEST_MODE="false"
NEXT_PUBLIC_CREEM_PRICE_PRO_MONTHLY="creem-price-pro-monthly"
NEXT_PUBLIC_CREEM_PRICE_PRO_YEARLY="creem-price-pro-yearly"
NEXT_PUBLIC_CREEM_PRICE_PROPLUS_MONTHLY="creem-price-proplus-monthly"
NEXT_PUBLIC_CREEM_PRICE_PROPLUS_YEARLY="creem-price-proplus-yearly"
NEXT_PUBLIC_CREEM_PRICE_PACK_1000="creem-price-pack-1000"
NEXT_PUBLIC_CREEM_PRICE_PACK_2000="creem-price-pack-2000"
NEXT_PUBLIC_CREEM_PRICE_PACK_5000="creem-price-pack-5000"
NEXT_PUBLIC_CREEM_PRICE_PACK_10000="creem-price-pack-10000"
```

## 📝 How to Set Environment Variables

### In Vercel:
1. Go to: https://vercel.com/your-username/viecom/settings/environment-variables
2. Add each variable
3. Select "Production", "Preview", and "Development" environments
4. Click "Save"
5. Redeploy your application

### In Railway:
1. Go to your project settings
2. Click "Variables" tab
3. Add each variable
4. Railway will auto-redeploy

### In Docker/VPS:
Create a `.env` file in the project root with all variables, then:
```bash
docker-compose up -d
# or
systemctl restart viecom
```

## 🔐 Generating Secrets

### For BETTER_AUTH_SECRET and ADMIN_JWT_SECRET:
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online
# Visit: https://generate-secret.vercel.app/32
```

## ✅ Verifying Environment Variables

After setting all variables, verify they're loaded:

```bash
# Check if app can start
pnpm build

# Should see: ✓ Compiled successfully
# Should NOT see: "Invalid environment variables"
```

## ⚠️ Common Issues

### Error: "Invalid environment variables"
- **Cause**: Missing required variables
- **Fix**: Double-check all REQUIRED variables are set

### Error: "Database connection failed"
- **Cause**: Invalid `DATABASE_URL`
- **Fix**: Verify database URL format and credentials

### Admin login not working
- **Cause**: Missing `ADMIN_JWT_SECRET`
- **Fix**: Add `ADMIN_JWT_SECRET` environment variable

### Images/videos not generating
- **Cause**: Invalid `KIE_API_KEY`
- **Fix**: Get valid API key from KIE.ai

## 🎯 Minimum Configuration for Testing

If you just want to get the app running quickly for testing:

```bash
# Absolute minimum (5 variables)
NEXT_PUBLIC_APP_URL="https://www.viecom.pro"
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="at-least-32-chars-random-string-here"
GOOGLE_CLIENT_ID="dummy-for-testing"
GOOGLE_CLIENT_SECRET="dummy-for-testing"
KIE_API_KEY="your-real-kie-api-key"

# Add for admin access (2 more variables)
ADMIN_JWT_SECRET="another-32-chars-random-string"
```

Last Updated: 2024-11-12

