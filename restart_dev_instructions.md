# RESTART REQUIRED

The code changes are saved but your dev server needs to restart to apply them.

## Quick Restart

### Option 1: Stop and Restart (Recommended)
```bash
# Stop the dev server (Ctrl+C in the terminal where it's running)
# Or kill the process:
pkill -f "next dev"

# Wait 2 seconds
sleep 2

# Restart
pnpm dev
```

### Option 2: If using PowerShell (Windows WSL)
```powershell
# In your PowerShell terminal:
.\start-dev.ps1
```

## Verify Changes Applied

After restart, check the logs when you resend the webhook. You should see:

```
[Creem Webhook] handleSubscriptionUpdate called with: ...
[Creem] handleSubscriptionUpdate plan resolution: ...
[Creem Webhook] Scheduled upgrade already set by API endpoint: pro → proplus. Skipping duplicate scheduling.
```

## Why Restart is Needed

Next.js hot reload doesn't always catch changes in:
- API route handlers (`/api/webhooks/creem/route.ts`)
- Server-side services (`creem-service.ts`)

These require a full server restart.
