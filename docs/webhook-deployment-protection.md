# Webhook Deployment Protection Guide

**Context:** Two issues blocked Creem webhooks:
- Earlier, the database enum `credit_transactions_source_enum` did **not** include `'purchase'`, so `handleCreditPackPurchase` inserts crashed with `invalid input value for enum credit_transactions_source_enum: "purchase"` and the webhook returned 500.
- After the enum fix, Vercel preview deployments still had **Vercel Authentication** enabled, so POSTs to `https://viecom-git-payment-jeff-lees-projects-92a56a05.vercel.app/api/webhooks/creem` returned `401 Authentication Required` before hitting the API route, preventing credits from being granted.

## Root Cause

Vercel preview deployments had **Vercel Authentication** enabled (Deployment Protection). That feature forces every request to authenticate through Vercel before hitting the app. Third‑party webhook providers, including Creem, cannot complete that flow, so every POST was blocked at the edge.

Attempts to append `?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=<token>` failed because webhook clients do not follow redirects to set cookies. Creem also cannot add the `x-vercel-protection-bypass` header, so protection remained in place and the webhook kept receiving 401 responses.

## Resolutions

1. **500 error fix (enum mismatch)**
   - Added `'purchase'` to the `credit_transactions_source_enum` list in `src/server/db/schema.ts`.
   - Created migration `0004_credit_pack_purchase_source.sql` to add the value at the database layer.
   - After running `pnpm db:migrate`, the webhook handler could insert credit transactions successfully.

2. **401 error fix (deployment protection)**
   - Disabled **Vercel Authentication** on the preview deployment so webhook requests bypassed Vercel’s login page.
   - Resent the `checkout.completed` webhook: request reached the handler, credits were inserted, response was 200.

Once these two actions were complete, the webhook flow succeeded end to end.

## Best Practices for Future Projects

- **Webhooks require unauthenticated access.** Ensure any deployment receiving third‑party webhooks is *not* behind Vercel Authentication or password protection, unless the provider supports custom headers for bypass tokens.
- **Preview testing options:**
  - Disable protection temporarily on the preview deployment.
  - Or expose `localhost:3000/api/webhooks/creem` through a tunnel (ngrok, Cloudflare Tunnel) and point the webhook there.
- **Production deployments:** Keep the webhook domain or route unprotected. If you must protect the rest of the site, configure a separate subdomain for webhooks or run a proxy that injects Vercel’s bypass token on every request.
- **Verification checklist before enabling protection again:**
  1. Confirm all webhook providers can send custom headers/cookies; if not, leave the webhook endpoint unprotected.
  2. Test by replaying a real webhook event and watching for `[Creem Webhook] Incoming request` logs.
  3. Monitor `credit_transactions` (or equivalent tables) to ensure credits are granted.

Documenting this prevents future teams from wasting time debugging application code when the actual issue is deployment protection blocking webhook traffic.
