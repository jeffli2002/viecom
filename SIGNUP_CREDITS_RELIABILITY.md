# Signup Credits Reliability Improvements

## Problem
Some newly registered users were not receiving their signup bonus credits (15 credits). Investigation revealed that these users had no credit accounts, indicating the initialization API call failed silently.

## Root Causes
1. **Client-side initialization failure**: The `initializeUserCredits` function only logged warnings on failure, allowing registration to succeed even if credit initialization failed
2. **No retry mechanism**: Single attempt with no retry logic
3. **Session timing issues**: API requires valid session, which might not be established immediately after registration
4. **No fallback mechanism**: If initialization failed during signup, there was no automatic recovery

## Solutions Implemented

### 1. Enhanced Client-Side Retry Mechanism
**File**: `src/store/auth-store.ts`

- Added retry logic with exponential backoff (up to 3 attempts)
- Better error logging and handling
- Non-blocking: doesn't prevent registration from succeeding
- Retries in multiple places:
  - During `signUp()` - immediate attempt
  - During `initialize()` - fallback for new users
  - During `refreshSession()` - fallback when user changes

### 2. Credit Account Check API
**File**: `src/app/api/credits/check/route.ts`

- New endpoint to check if user has a credit account
- Used in `initialize()` method as a fallback check
- Helps identify users who need credit initialization

### 3. Background Cron Task
**File**: `src/app/api/cron/check-missing-signup-credits/route.ts`

- Automatically checks users registered in the last 24 hours
- Identifies users without credit accounts or signup bonus transactions
- Automatically grants missing signup bonuses
- Should be called periodically (e.g., every hour) via cron job

**Setup**:
```bash
# Add to your cron job configuration
# Run every hour
0 * * * * curl -X POST https://your-domain.com/api/cron/check-missing-signup-credits \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 4. Improved Error Handling
- Better logging at each step
- Graceful degradation - failures don't block user registration
- Multiple fallback mechanisms ensure credits are eventually granted

## How It Works Now

### Registration Flow:
1. **User registers** → `signUp()` is called
2. **Immediate attempt**: `initializeUserCredits()` is called with 3 retries
3. **If fails**: Registration still succeeds, but credits are not granted yet
4. **Fallback 1**: When user logs in, `initialize()` method checks and retries
5. **Fallback 2**: Background cron task checks and fixes within 24 hours

### Multiple Safety Nets:
1. ✅ **Primary**: Retry during signup (3 attempts)
2. ✅ **Fallback 1**: Check and initialize during app initialization
3. ✅ **Fallback 2**: Background cron task fixes missing credits

## Monitoring

### Check User Credits:
```bash
pnpm tsx scripts/check-user-signup-credits.ts user@example.com
```

### Fix Missing Credits:
```bash
pnpm tsx scripts/fix-missing-signup-credits.ts user@example.com
```

### Run Background Check:
```bash
curl -X POST http://localhost:3000/api/cron/check-missing-signup-credits \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Configuration

Set `CRON_SECRET` in your `.env.local`:
```
CRON_SECRET=your-secret-key-here
```

## Testing

To test the improvements:
1. Register a new user
2. Check if credits were granted: `pnpm tsx scripts/check-user-signup-credits.ts <email>`
3. If missing, wait for background task or manually fix

## Future Improvements

Consider:
1. Server-side hook in Better Auth (if supported) to initialize credits immediately after user creation
2. Database trigger to automatically create credit account on user creation
3. Queue system for credit initialization to handle high load
4. Monitoring dashboard to track signup credit grant success rate

