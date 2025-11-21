# Creem Dashboard Verification Checklist

**CRITICAL:** The API key has NO access to any resources. You must verify the project structure in Creem Dashboard.

---

## Step 1: Log into Creem Dashboard

1. Go to: **https://app.creem.io**
2. Log in with your Creem account credentials
3. Ensure you're in **Test Mode** (look for a toggle switch, usually top-right corner)

---

## Step 2: Check for Multiple Projects

### Look for Project Switcher
- **Location:** Usually top-left or top-right of the dashboard
- **Appears as:** Dropdown menu, project name, or organization selector
- **Example:** "Project: Main" or "Viecom Project" with dropdown arrow

### Questions to Answer:
1. ❓ Do you see multiple projects in the dropdown?
2. ❓ What are the project names?
3. ❓ Which project are you currently viewing?

**Screenshot:** Take a screenshot of the project switcher for reference

---

## Step 3: Locate Your Subscription

### Search in Each Project

**For EACH project in your account:**

1. Navigate to: **Subscriptions** (in left sidebar)
2. Search for: `sub_5EM6IgULEBVjEtMx5OH0TT`
3. Check if it exists in this project

### When You Find the Subscription:

Record the following:
```
✅ Found in Project: __________________
✅ Status: __________________
✅ Environment: [ ] Test Mode  [ ] Production Mode
✅ Customer Email: __________________
✅ Plan/Product: __________________
✅ Current Period End: __________________
```

### If NOT Found:
- ⚠️ Try switching to **Production Mode** (toggle at top)
- ⚠️ Check **Canceled Subscriptions** or **All Subscriptions** view
- ⚠️ If still not found, the subscription may have been deleted

---

## Step 4: Check Your Products

### Verify Products Exist

1. Navigate to: **Products** (in left sidebar)
2. Look for your subscription plans:
   - **Pro Monthly** (should match: `prod_kUzMsZPgszRro3jOiUrfd`)
   - **Pro+ Monthly** (should match: `prod_4s8si1GkKRtU0HuUEWz6ry`)

### For Each Product:

Record the product IDs:
```
Pro Monthly Product ID:     ____________________
Pro+ Monthly Product ID:    ____________________

✅ In which project? ____________________
✅ Test or Production? ____________________
```

### Compare with Your .env.local:
```bash
# Your current config:
CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY=prod_kUzMsZPgszRro3jOiUrfd
CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY=prod_4s8si1GkKRtU0HuUEWz6ry
```

❓ Do the IDs in Creem Dashboard **exactly match** your .env.local?

---

## Step 5: Check API Keys

### Navigate to API Keys

1. Go to: **Settings** → **API Keys** (or **Developers** → **API Keys**)
2. Ensure you're in **Test Mode**
3. Find your current API key: `creem_test_6ixL5X18W5Ceb7RGzpHks9`

### For Your Current API Key:

Check and record:
```
✅ Key Name/Label: __________________
✅ In which project? __________________
✅ Environment: [ ] Test  [ ] Production
✅ Status: [ ] Active  [ ] Revoked
✅ Created Date: __________________
✅ Last Used: __________________

Permissions:
[ ] Customers - Read
[ ] Customers - Write
[ ] Products - Read
[ ] Products - Write
[ ] Subscriptions - Read    ← CRITICAL
[ ] Subscriptions - Write   ← CRITICAL
[ ] Checkouts - Read
[ ] Checkouts - Write
[ ] Other: __________________
```

### Critical Check:
❓ Is the API key in the **SAME project** as the subscription?
- [ ] YES - Same project
- [ ] NO - Different project ⚠️ **THIS IS THE PROBLEM**
- [ ] UNSURE - Can't tell from UI

---

## Step 6: Summary of Findings

### Project Structure
```
Total number of projects: __________

Project 1 Name: __________________
  - Contains subscription? [ ] Yes  [ ] No
  - Contains products? [ ] Yes  [ ] No
  - Contains API key? [ ] Yes  [ ] No

Project 2 Name: __________________
  - Contains subscription? [ ] Yes  [ ] No
  - Contains products? [ ] Yes  [ ] No
  - Contains API key? [ ] Yes  [ ] No
```

### The CORRECT Project Is:
```
Project name: __________________
Contains:
  ✅ Subscription sub_5EM6IgULEBVjEtMx5OH0TT
  ✅ Products (Pro, Pro+)
  ✅ Should have the API key
```

---

## Step 7: Generate New API Key (IF NEEDED)

**ONLY if the API key is in a different project than the subscription:**

### In the CORRECT Project:

1. Navigate to: **Settings** → **API Keys**
2. Click: **"Create API Key"** or **"New API Key"**
3. Configure:
   ```
   Name: Dev Server - Full Access
   Environment: Test Mode
   Permissions: SELECT ALL (or at minimum):
     ✅ Customers - Read + Write
     ✅ Products - Read + Write
     ✅ Subscriptions - Read + Write  ← CRITICAL
     ✅ Checkouts - Read + Write
   ```
4. Click: **Create**
5. **COPY THE KEY IMMEDIATELY** (you'll only see it once!)

### Update .env.local:
```bash
CREEM_API_KEY="creem_test_NEW_KEY_HERE"
```

### Restart Dev Server:
```bash
# Stop current server (Ctrl+C)
pnpm dev
```

---

## Step 8: Verify the Fix

### Run Diagnostic Script:
```bash
node scripts/test-creem-api-capabilities.mjs
```

### Expected Output (Success):
```
✅ SUCCESS: Can list products
✅ SUCCESS: Can list customers
✅ SUCCESS: Can list subscriptions
✅ SUCCESS: Can retrieve this subscription
✅ SUCCESS: Can create checkouts

API Key Capabilities:
  List Products:           ✅ YES
  List Customers:          ✅ YES
  List Subscriptions:      ✅ YES
  Retrieve Subscription:   ✅ YES
  Create Checkout:         ✅ YES
```

---

## Common Creem Dashboard Layouts

### Option A: Projects in Dropdown
```
┌─────────────────────────────────┐
│ [Creem Logo]  Project: Main ▼  │
│                                 │
│ ├─ Dashboard                    │
│ ├─ Subscriptions               │
│ ├─ Customers                    │
│ ├─ Products                     │
│ └─ Settings                     │
│    └─ API Keys                  │
└─────────────────────────────────┘
```

### Option B: Organization Switcher
```
┌─────────────────────────────────┐
│ [Creem Logo]  Viecom ▼   [Test]│
│                                 │
│ All Projects:                   │
│  • Main Project                 │
│  • Development                  │
│  • Production                   │
└─────────────────────────────────┘
```

### Option C: Workspace Selector
```
┌─────────────────────────────────┐
│ Workspace: Default ▼            │
│                                 │
│ Switch workspace:               │
│  • Default (current)            │
│  • Test Environment             │
│  • Staging                      │
└─────────────────────────────────┘
```

---

## What to Look For: Screenshots

### 1. Project Switcher
**Where:** Top-left or top-right corner  
**Shows:** Current project name with dropdown icon

### 2. Subscription Detail Page
**Navigate:** Subscriptions → Click on `sub_5EM6IgULEBVjEtMx5OH0TT`  
**Shows:** 
- Customer info
- Plan/Product
- Status
- Current period
- **Which project it belongs to**

### 3. API Key List
**Navigate:** Settings → API Keys  
**Shows:**
- List of all API keys
- Their permissions
- Environment (Test/Production)
- **Which project each belongs to**

---

## If You Can't Find Project Switcher

### This means ONE of:

1. **Single Project Account:** You only have one project (most likely)
2. **Hidden UI:** Project switcher exists but is in a different location
3. **Different Account:** You're logged into wrong Creem account

### If Single Project:

Then the problem is NOT cross-project access, but one of:
- ❌ API key has restricted permissions (read-only)
- ❌ API key was revoked
- ❌ Subscription is in production but key is for test (or vice versa)

**Action:** Create a NEW API key with FULL permissions in the same environment as the subscription

---

## Test vs Production Mode Toggle

### Look for Toggle Switch:
- **Location:** Usually top-right corner
- **Label:** "Test Mode" or "Live Mode" or "Production"
- **Appears as:** Toggle switch or dropdown

### Current State Should Be:
- [x] **Test Mode** ← You should be here
- [ ] Production Mode

### Your Subscription Should Be In:
- Based on API key: **Test Mode** (`creem_test_...`)
- Verify in dashboard: Check subscription details

---

## Contact Creem Support (If Still Stuck)

If after checking all of the above you still can't resolve the issue:

### Prepare This Information:

```
Subject: API Key Cannot Access Subscription (403 Forbidden)

Account Email: ____________________
Subscription ID: sub_5EM6IgULEBVjEtMx5OH0TT
API Key (first 10 chars): creem_test_6ixL5X18W5Ceb7RGzpHks9

Issue:
- API key returns 403 Forbidden for all operations
- Cannot list products, customers, or subscriptions
- Cannot retrieve subscription by ID (returns 404)
- API key was regenerated but lost access to existing subscriptions

Question:
1. Does my account have multiple projects?
2. Which project contains subscription sub_5EM6IgULEBVjEtMx5OH0TT?
3. How do I generate an API key with access to this subscription?

Screenshots attached:
- Dashboard overview
- API Keys page
- Subscription details
```

### Creem Support:
- **Email:** support@creem.io (check their website for correct email)
- **Dashboard:** Look for "Help" or "Support" button
- **Documentation:** https://docs.creem.io

---

## Quick Decision Tree

```
START: API key returns 403 Forbidden

├─ Can you find the subscription in dashboard?
│  ├─ NO → Subscription deleted or wrong account
│  └─ YES → Note which project it's in
│     │
│     ├─ Is your API key in the SAME project?
│     │  ├─ NO → Generate new API key in correct project ✅
│     │  └─ YES → Check API key permissions
│     │     │
│     │     ├─ Has "Subscriptions - Read/Write"?
│     │     │  ├─ NO → Regenerate with full permissions ✅
│     │     │  └─ YES → Contact Creem support 🆘
│     │     │
│     │     └─ Is API key Active (not revoked)?
│     │        ├─ NO → Generate new API key ✅
│     │        └─ YES → Contact Creem support 🆘
│
└─ Is subscription in Test/Production mode?
   ├─ Test → Use creem_test_... API key ✅
   └─ Production → Use creem_live_... API key ✅
```

---

**Generated:** 2025-11-21  
**Purpose:** Guide user through Creem Dashboard to diagnose API key access issues  
**Related:** See `CREEM_API_KEY_DIAGNOSTIC_FINDINGS.md` for detailed analysis
