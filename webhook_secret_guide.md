# Creem Webhook Secret - Which One to Use?

## The Two Values Explained

### `whsec_1Fjrs44z8YRXHr0DKiA9z3`
- **Format**: `whsec_...` (Webhook Secret)
- **Purpose**: This is the **signing secret** used to verify webhook authenticity
- **Usage**: Set as `CREEM_WEBHOOK_SECRET` env var
- **How it works**: Creem uses this to create HMAC signature of webhook payload

### `wh_test_4BGUMCSMw6GoQ96yVqbiR2`
- **Format**: `wh_test_...` (Webhook ID)
- **Purpose**: This is the **webhook endpoint identifier**
- **Usage**: Stored in Creem dashboard, NOT in your env vars
- **How it works**: Creem's internal ID for your webhook URL

## ✅ Correct Configuration

```bash
# In your .env or .env.local file:
CREEM_WEBHOOK_SECRET=whsec_1Fjrs44z8YRXHr0DKiA9z3

# DO NOT use:
# CREEM_WEBHOOK_SECRET=wh_test_4BGUMCSMw6GoQ96yVqbiR2  ❌ Wrong\!
```

## How Webhook Verification Works

1. **Creem sends webhook** with payload + signature in header
2. **Your server** (line 657-658 in creem-service.ts):
   ```typescript
   const hmac = crypto.createHmac('sha256', CREEM_WEBHOOK_SECRET);
   const digest = hmac.update(payload).digest('hex');
   ```
3. **Compare** generated signature with Creem's signature
4. **Accept** if match, **reject** if not

## Check Your Current Setting

```bash
# Check what you have configured:
grep CREEM_WEBHOOK_SECRET .env .env.local 2>/dev/null

# Should output:
# CREEM_WEBHOOK_SECRET=whsec_1Fjrs44z8YRXHr0DKiA9z3
```

## If You Have Wrong Secret

This explains the 500 error\! Update your env file:

```bash
# Edit .env.local
echo "CREEM_WEBHOOK_SECRET=whsec_1Fjrs44z8YRXHr0DKiA9z3" >> .env.local

# Restart dev server
pkill -f "next dev"
pnpm dev
```

## Test After Fix

Resend webhook from Creem dashboard. If secret is correct:
- ✅ Signature verification passes
- ✅ Webhook processes normally
- ✅ Returns 200 OK (or other non-401 status)

If secret is wrong:
- ❌ Line 659: `isValid = false`
- ❌ Line 662: Logs "[SECURITY] Invalid webhook signature detected"
- ❌ Returns 401 Unauthorized

## Where to Find These in Creem Dashboard

1. **Webhook Secret** (`whsec_...`):
   - Creem Dashboard → Developers → Webhooks
   - Click on your webhook endpoint
   - Look for "Signing Secret" section
   - Click "Reveal" to see the `whsec_...` value

2. **Webhook ID** (`wh_test_...`):
   - Same location, but shown in the webhook list
   - You don't need this in your code

## Summary

**Use**: `whsec_1Fjrs44z8YRXHr0DKiA9z3` ✅  
**Don't use**: `wh_test_4BGUMCSMw6GoQ96yVqbiR2` ❌

The `whsec_` prefix indicates it's a **signing secret**, which is what the HMAC verification needs.
