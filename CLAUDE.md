# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

E-commerce AI Content Studio - A Next.js 15 platform for generating product images and videos using AI. Features subscription management (Creem), credit system, brand analysis, and batch generation.

**Tech Stack**: Next.js 15, TypeScript, PostgreSQL (Neon), Drizzle ORM, Better Auth, Tailwind CSS, Zustand, Cloudflare R2

**AI Services**: KIE API (image/video), DeepSeek AI (prompt enhancement/brand analysis), OpenRouter (Gemini)

## Essential Commands

### Development
```bash
pnpm dev                    # Start dev server (localhost:3000)
pnpm build                  # Build for production
pnpm start                  # Run production build
pnpm preview                # Build and start production server
```

### Code Quality
```bash
pnpm check                  # Lint with Biome
pnpm check:write            # Auto-fix lint issues
pnpm typecheck              # TypeScript type checking
```

**CRITICAL**: Always run `pnpm check` and `pnpm typecheck` before committing code.

### Database
```bash
pnpm db:generate            # Generate Drizzle migrations
pnpm db:migrate             # Run migrations locally
pnpm db:migrate:deploy      # Run migrations in production (uses scripts/migrate.ts)
pnpm db:push                # Push schema changes directly
pnpm db:studio              # Open Drizzle Studio (database GUI)
```

### Testing
```bash
pnpm test                   # Run Jest unit tests
pnpm test:unit              # Unit tests only
pnpm test:integration       # Integration tests only
pnpm test:coverage          # Tests with coverage report
pnpm test:e2e               # Playwright E2E tests
pnpm test:e2e:ui            # E2E with Playwright UI
pnpm test:all               # Run all tests
```

### Admin
```bash
pnpm admin:setup            # Create admin user (scripts/setup-admin.ts)
```

## Configuration-Driven Architecture

**CRITICAL RULE**: NEVER hardcode pricing, credits, or feature limits. Always use config files.

### Config Files
- `src/config/payment.config.ts` - Plans, pricing, features, limits
- `src/config/credits.config.ts` - Credit consumption rates, rewards, quotas
- `src/config/batch.config.ts` - Batch processing configuration
- `src/config/styles.config.ts` - UI styles and theme

### Examples
```typescript
// ✅ CORRECT
import { paymentConfig } from '@/config/payment.config';
import { creditsConfig } from '@/config/credits.config';

const proPlan = paymentConfig.plans.find(p => p.id === 'pro');
const imageCost = creditsConfig.consumption.imageGeneration['nano-banana'];

// ❌ WRONG
const price = 14.9;
const credits = 5;
```

**Apply this rule to ALL pages, components, and API routes** that mention pricing, credits, or features. See `.cursorrules` for comprehensive examples.

## Routing & Internationalization

**CRITICAL RULES** - Follow these to avoid site-wide 404 errors:

### Configuration Rules

1. **NEVER use `localePrefix: 'as-needed'`** 
   - It breaks in production with Next.js standalone builds
   - Works in dev but fails in production
   
2. **ALWAYS use `localePrefix: 'always'`**
   - Explicit locale prefixes ensure reliability
   - All URLs include `/en` or `/zh` prefix
   - This is the ONLY supported configuration

3. **Test production builds locally before deploying**
   ```bash
   pnpm build
   pnpm start
   # Test critical routes manually
   ```

### Current Configuration

**Location**: `src/i18n/routing.ts`

```typescript
export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'always', // NEVER change this to 'as-needed'
  localeDetection: true,
});
```

**Middleware**: `middleware.ts` at root level

- Root path redirect: `/` → `/en`
- Admin routes bypass i18n (no locale prefix)
- All other routes handled by `next-intl` middleware

### URL Structure

- ✅ `/` → redirects to `/en`
- ✅ `/en/video-generation`
- ✅ `/en/image-generation`
- ✅ `/en/pricing`
- ✅ `/zh/pricing` (Chinese)
- ❌ `/video-generation` (will 404, must include locale)

### Middleware Best Practices

1. Keep middleware logic minimal
2. Use explicit redirects over rewrites
3. Never add custom rewrite logic for locale handling
4. Let `next-intl` middleware handle routing

**See `docs/BUG_REPORT_MIDDLEWARE_404.md` for detailed history of routing issues.**

## Architecture

### Authentication & Authorization
- **Better Auth**: Email/password + Google OAuth
- **Admin System**: Separate admin portal at `/admin` with role-based access
- **Session Management**: Zustand store (`src/store/auth-store.ts`)

### Credit System
- **Tables**: `userCredits`, `creditTransactions`
- **Service**: `src/lib/credits/credit-service.ts`
- **Features**: Earn, spend, refund, freeze/unfreeze, idempotency
- **Rewards**: Daily check-in (2 credits), referrals (10 credits), social sharing (5 credits)

### Subscription System (Creem)
- **Service**: `src/lib/creem/creem-service.ts`
- **Plans**: Free (30 credits signup), Pro ($14.9/mo, 500 credits/mo), Pro+ ($24.9/mo, 900 credits/mo)
- **Operations**: Create, upgrade, downgrade, cancel, reactivate
- **Webhooks**: `/api/webhooks/creem` handles subscription lifecycle events
- **Auto Credit Grant**: Subscription creation and renewal automatically grant monthly credits

### Quota Management
- **Service**: `src/lib/quota/quota-service.ts`
- **Tracks**: API calls, storage, image generation, video generation, image extraction
- **Periods**: Daily and monthly quotas
- **Free Limits**: 3 image extractions/day (10/month), 0 paid generations

### Image Generation
- **API**: `/api/v1/generate-image` (T2I, I2I)
- **Models**: Nano Banana (5 credits), Flux 1.1 Pro (5 credits), Flux 1.1 Ultra (8 credits)
- **Features**: Brand analysis, prompt enhancement, multi aspect ratios
- **Component**: `src/components/image-generator.tsx`

### Video Generation
- **API**: `/api/v1/generate-video`
- **Models**: 
  - Sora 2 (720p only): 15-20 credits
  - Sora 2 Pro (720p/1080p): 45-130 credits
- **Component**: `src/components/video-generator.tsx`

### Batch Generation
- **Priority Queue**: 720p tasks processed first for faster user feedback
- **Concurrency**: Free (1), Pro (3), Pro+ (5)
- **Smart Adjustment**: Auto-adjusts based on model, resolution, duration
- **API**: `/api/v1/workflow/batch-generate`, `/api/v1/workflow/status/[jobId]`
- **Guide**: See `docs/BATCH_PROCESSING_GUIDE.md`

### Brand Analysis
- **API**: `/api/v1/analyze-brand-tone`
- **AI**: DeepSeek analyzes company URLs for brand personality, colors, style keywords
- **Integration**: Results feed into prompt enhancement
- **Component**: `src/components/brand/brand-analysis-page.tsx`

### Storage
- **Cloudflare R2**: Asset storage via `src/lib/storage/r2.ts`
- **AWS SDK**: S3-compatible API for uploads/downloads

## Database Schema

### Core Tables
- `user`, `session`, `account`, `verification` - Auth (Better Auth)
- `userCredits`, `creditTransactions` - Credit system
- `payment`, `paymentEvent` - Subscriptions and payment tracking
- `userQuotaUsage` - Daily/monthly quota tracking
- `batchGenerationJob`, `generatedAsset` - Content generation
- `brandToneProfile`, `styleConfiguration` - Brand analysis
- `creditConsumptionConfig`, `subscription` - System config

## API Routes

### Authentication
- `/api/auth/[...all]` - Better Auth unified endpoint

### Credits
- `/api/credits/initialize` - Create credit account (called on signup)
- `/api/credits/balance` - Get user balance
- `/api/credits/history` - Transaction history

### Creem Payment
- `/api/creem/checkout` - Create checkout session
- `/api/creem/subscription/[subscriptionId]` - CRUD operations
- `/api/creem/subscription/[subscriptionId]/upgrade` - Upgrade plan
- `/api/creem/subscription/[subscriptionId]/downgrade` - Downgrade plan
- `/api/creem/customer-portal` - Customer management portal link
- `/api/webhooks/creem` - Webhook handler (CRITICAL: validates signatures)

### Generation
- `/api/v1/analyze-brand-tone` - Brand analysis (DeepSeek)
- `/api/v1/enhance-prompt` - Prompt enhancement (DeepSeek)
- `/api/v1/generate-image` - Image generation (KIE API)
- `/api/v1/generate-video` - Video generation (KIE API)
- `/api/v1/workflow/batch-generate` - Batch processing

### Rewards
- `/api/rewards/checkin` - Daily check-in rewards
- `/api/rewards/referral` - Referral rewards
- `/api/rewards/share` - Social share rewards

## Environment Variables

### Required
```bash
NEXT_PUBLIC_APP_URL          # App URL
DATABASE_URL                 # PostgreSQL connection string
BETTER_AUTH_SECRET           # Auth secret key
KIE_API_KEY                  # Image/video generation
DEEPSEEK_API_KEY             # Prompt enhancement/brand analysis
R2_*                         # Cloudflare R2 credentials
CREEM_API_KEY                # Payment provider (creem_test_* for test, creem_* for prod)
CREEM_WEBHOOK_SECRET         # Webhook validation
CREEM_*_PRODUCT_KEY_*        # Product keys for plans
```

**Note**: Creem API URL is auto-detected from API key prefix:
- `creem_test_*` → uses `https://test-api.creem.io`
- `creem_*` (without test_) → uses `https://api.creem.io`
No manual `CREEM_API_URL` configuration needed.

### Optional
```bash
GOOGLE_CLIENT_ID/SECRET      # Google OAuth
RESEND_API_KEY               # Email service
OPENROUTER_API_KEY           # Alternative AI provider
ADMIN_EMAILS                 # Admin user emails
```

See `env.example` for complete list. All env vars are validated via `src/env.ts` using `@t3-oss/env-nextjs`.

## Important Patterns

### Credit Deduction
```typescript
import { CreditService } from '@/lib/credits/credit-service';
import { getModelCost } from '@/config/credits.config';

const cost = getModelCost('imageGeneration', 'nano-banana');
const result = await CreditService.deductCredits(userId, cost, 'api_call', 'image_generation');
```

### Subscription Check
```typescript
import { useSubscription } from '@/hooks/use-subscription';

const { subscription, isLoading, hasActiveSubscription, canAccessFeature } = useSubscription();
const hasPro = canAccessFeature('pro');
```

### Upgrade Prompt
```typescript
import { useUpgradePrompt } from '@/hooks/use-upgrade-prompt';

const { openUpgradePrompt } = useUpgradePrompt();
openUpgradePrompt('insufficient_credits');
```

### Batch Processing
- Always use config values from `src/config/batch.config.ts`
- Respect concurrency limits per plan
- Check credit balance before starting batch jobs
- Use priority queue processor for optimal UX

## Testing Strategy

- **Unit**: Jest for services, utilities, hooks
- **Integration**: API route testing
- **E2E**: Playwright for critical user flows
- **Coverage**: Target >80% for core business logic

Run tests with proper environment setup. See `tests/README.md`.

## Deployment

1. Set all env vars in deployment platform
2. Run `pnpm db:migrate:deploy` to apply migrations
3. Configure Creem webhook URL: `https://yourdomain.com/api/webhooks/creem`
4. Build: `pnpm build`
5. Start: `pnpm start`

**Production Checklist**:
- [ ] All env vars configured
- [ ] Database migrations applied
- [ ] Webhook endpoints configured and tested
- [ ] Admin user created (`pnpm admin:setup`)
- [ ] Credit costs verified in config files

## Internationalization

- **next-intl**: Locale management
- **Supported**: English (en), Chinese (zh)
- **Messages**: `src/i18n/messages/`
- **Middleware**: Auto-detects locale and redirects

## Security Notes

- Webhook signature verification for Creem events
- Better Auth handles password hashing and session management
- Credit transaction idempotency prevents double-spending
- Admin routes protected by role checks
- Never expose API keys client-side

## Common Tasks

### Add New Subscription Plan
1. Update `src/config/payment.config.ts` plans array
2. Add Creem product key to env vars
3. Update credit grant logic in `src/lib/creem/subscription-credits.ts`
4. Test upgrade/downgrade flows

### Add New AI Model
1. Add model to `src/config/credits.config.ts` consumption
2. Update generation API route to handle new model
3. Add UI option in generator component
4. Document cost in pricing pages

### Modify Credit Costs
1. Update `src/config/credits.config.ts` only
2. Changes apply immediately across entire app
3. Verify changes in pricing page, terms page, FAQ

### Debug Subscription Issues
1. Check `payment` table for subscription records
2. Review `paymentEvent` table for webhook events
3. Verify `creditTransactions` for credit grants
4. Use Drizzle Studio: `pnpm db:studio`

### Fix Missing Scheduled Upgrade Columns
If Pro → Pro+ upgrade doesn't show "will take effect on..." notice:

1. **Verify columns exist**:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'payment' AND column_name LIKE 'scheduled_%';
   ```
   Should return 5 rows.

2. **Run migration if needed**:
   ```bash
   pnpm db:migrate
   ```
   This applies `drizzle/0003_lethal_menace.sql`

3. **Manual fix if migration fails**:
   ```sql
   ALTER TABLE payment ADD COLUMN IF NOT EXISTS scheduled_plan_id text;
   ALTER TABLE payment ADD COLUMN IF NOT EXISTS scheduled_interval text;
   ALTER TABLE payment ADD COLUMN IF NOT EXISTS scheduled_period_start timestamp;
   ALTER TABLE payment ADD COLUMN IF NOT EXISTS scheduled_period_end timestamp;
   ALTER TABLE payment ADD COLUMN IF NOT EXISTS scheduled_at timestamp;
   ```

4. **Test**: See `scripts/test-upgrade-flow.md` for comprehensive testing steps

The scheduled upgrade flow:
- User upgrades → API sets `scheduled_plan_id`, `scheduled_period_start`
- Billing page fetches subscription → API reads scheduled fields → Returns `upcomingPlan`
- UI displays purple alert: "Plan Upgrade Scheduled: Pro+" with effective date
