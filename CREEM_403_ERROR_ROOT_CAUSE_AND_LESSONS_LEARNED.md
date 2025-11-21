# Creem 403 Forbidden Error - Root Cause Analysis & Lessons Learned

**Date:** November 21, 2025  
**Issue:** Pro → Pro+ subscription upgrade failing with 403 Forbidden  
**Time Spent:** ~3 hours of investigation  
**Final Resolution:** Wrong authentication header format  

---

## Executive Summary

A subscription upgrade API call was failing with **403 Forbidden** error. The investigation initially focused on:
- ❌ Wrong API URL (test vs production)
- ❌ Invalid API key
- ❌ Missing permissions
- ❌ Test/production environment mismatch

**The actual root cause:** Using `Authorization: Bearer` header instead of `x-api-key` header.

**What should have been done:** Compare with working implementation in `../im2prompt` project **immediately** instead of making assumptions.

---

## The Error

### Symptoms
```
[Creem] Upgrading subscription: sub_5EM6IgULEBVjEtMx5OH0TT to proplus_monthly
[Creem] Base URL: https://test-api.creem.io
[Creem] Full URL: https://test-api.creem.io/v1/subscriptions/sub_5EM6IgULEBVjEtMx5OH0TT/upgrade
[Creem] Upgrade API error (direct call): {
  status: 403,
  statusText: 'Forbidden',
  errorData: {
    trace_id: 'c08a3196-1a54-4297-a922-9b1e8137069c',
    status: 403,
    error: 'Forbidden'
  }
}
```

### Initial Observations
- ✅ API URL was correct (`https://test-api.creem.io`)
- ✅ Subscription ID existed
- ✅ Product ID was valid
- ✅ Request body was correct
- ❌ Still getting 403 Forbidden

---

## Investigation Timeline (What Actually Happened)

### Phase 1: Wrong URL Hypothesis (~1 hour)
**Assumption:** Using wrong API URL (production vs test)

**Actions Taken:**
1. Checked if `sandbox.creem.io` vs `api.creem.io` issue
2. Implemented auto-detection from API key prefix
3. Modified `getCreemBaseUrl()` to detect test vs production
4. Updated environment variable documentation

**Result:** ❌ Still 403 error (URL was already correct!)

**Mistake:** Made assumptions without checking actual API response patterns.

---

### Phase 2: API Key Format Investigation (~1 hour)
**Assumption:** Production API keys use `creem_live_*` prefix

**Actions Taken:**
1. Assumed production keys have `creem_live_*` or `creem_prod_*` prefix
2. Implemented detection logic for these prefixes
3. Updated documentation with incorrect formats
4. User corrected: "Production keys are just `creem_*`"
5. Re-implemented detection logic

**Result:** ❌ Still 403 error (API key format was not the issue!)

**Mistake:** Made assumptions about API key formats without verifying against actual production keys.

---

### Phase 3: Test vs Production Environment (~30 minutes)
**Assumption:** Test keys can't access production resources

**Actions Taken:**
1. Investigated subscription ID format (no `test_` prefix)
2. Assumed key/subscription mismatch
3. Suggested regenerating API key
4. User clarified: "All test subscriptions use `sub_*` format"

**Result:** ❌ Still 403 error (subscription format was correct!)

**Mistake:** Made assumptions about Creem's ID format without checking their documentation or working examples.

---

### Phase 4: The Actual Root Cause (~30 minutes)
**User pushed back:** "You asked me to regenerate API key before, same error. Check im2prompt!"

**What Finally Worked:**
1. **Tested authentication headers directly:**
   ```bash
   # With Authorization: Bearer
   curl -H "Authorization: Bearer creem_test_XXX" https://test-api.creem.io/v1/products
   → 403 Forbidden ❌
   
   # With x-api-key
   curl -H "x-api-key: creem_test_XXX" https://test-api.creem.io/v1/products
   → 200 OK ✅
   ```

2. **Found the bug in code:**
   ```typescript
   // ❌ WRONG (Line 388)
   headers: {
     Authorization: `Bearer ${CREEM_API_KEY}`,
     'Content-Type': 'application/json',
   }
   
   // ✅ CORRECT (should have been)
   headers: {
     'x-api-key': CREEM_API_KEY,
     'Content-Type': 'application/json',
   }
   ```

3. **Fixed 7 locations** in `creem-service.ts` where `Authorization: Bearer` was used instead of `x-api-key`

**Result:** ✅ **FIXED!** Upgrade works perfectly.

---

## Root Cause Analysis

### The Bug

**Location:** `/mnt/d/ai/viecom/src/lib/creem/creem-service.ts`

**Lines affected:** 182, 238, 308, 388, 515, 594, 658

**What was wrong:**
```typescript
// Fallback fetch calls used wrong authentication header
fetch(url, {
  headers: {
    Authorization: `Bearer ${CREEM_API_KEY}`,  // ❌ WRONG
  }
})
```

**Why it was wrong:**
- Creem API expects `x-api-key` header for authentication
- `Authorization: Bearer` is commonly used for OAuth2 tokens
- The Creem SDK internally converts `xApiKey` parameter to `x-api-key` header
- When SDK failed and code fell back to fetch, it used wrong header format

### Why It Took So Long

**Primary reason:** Made assumptions instead of comparing with working implementation.

**What should have been done first:**
1. ✅ Check `../im2prompt` implementation immediately
2. ✅ Compare authentication headers between projects
3. ✅ Test API calls with different header formats
4. ✅ Read Creem SDK source code for correct header format

**What was actually done:**
1. ❌ Assumed URL was wrong → spent 1 hour fixing non-issue
2. ❌ Assumed API key format was wrong → spent 1 hour fixing non-issue
3. ❌ Assumed environment mismatch → spent 30 minutes fixing non-issue
4. ✅ Finally tested headers → found real issue in 30 minutes

---

## What Was Checked in im2prompt (Should Have Been First)

**File:** `/mnt/d/ai/im2prompt/src/lib/creem/creem-service.ts`

**Key Findings:**
1. **Authentication method:**
   ```typescript
   // im2prompt ALWAYS uses Creem SDK (never direct fetch)
   const creem = new Creem({ serverIdx: testMode ? 1 : 0 });
   await creem.upgradeSubscription({
     xApiKey: CREEM_API_KEY,  // SDK converts to x-api-key header
   });
   ```

2. **No fallback fetch calls** - They rely entirely on SDK
3. **SDK handles authentication correctly** - Uses `x-api-key` internally
4. **No custom header logic** - SDK does it all

**Lesson:** If SDK works, there's no need for custom fetch fallbacks. If fallbacks are needed, must match SDK's authentication exactly.

---

## Lessons Learned

### 1. **Always Compare with Working Implementation First**

**What went wrong:**
- Spent 3 hours investigating wrong hypotheses
- User repeatedly mentioned `im2prompt` works
- Only checked `im2prompt` after user insisted

**What should have been done:**
```
User: "Upgrade failing with 403"
Assistant: "Let me check how im2prompt handles this..."
→ Opens im2prompt/src/lib/creem/creem-service.ts
→ Sees SDK-only approach with xApiKey parameter
→ Checks viecom fallback fetch headers
→ Finds Authorization: Bearer instead of x-api-key
→ Fixed in 15 minutes ✅
```

**Golden Rule:** When a working reference exists, **START THERE**, don't end there.

---

### 2. **Test the Actual API Call First**

**What went wrong:**
- Made assumptions about URL, API key format, environment
- Changed code multiple times based on speculation
- Never tested actual API behavior until very end

**What should have been done:**
```bash
# Immediate test (5 minutes)
curl -H "Authorization: Bearer creem_test_XXX" https://test-api.creem.io/v1/products
→ 403 Forbidden

curl -H "x-api-key: creem_test_XXX" https://test-api.creem.io/v1/products
→ 200 OK

# Root cause found in 5 minutes!
```

**Golden Rule:** Test the actual API behavior before changing code.

---

### 3. **Don't Make Assumptions About Third-Party APIs**

**Assumptions Made (all wrong):**
- ❌ Creem uses `sandbox.creem.io` for test mode
- ❌ Production keys use `creem_live_*` prefix
- ❌ Test subscriptions use `sub_test_*` format
- ❌ `Authorization: Bearer` is standard for API keys

**Reality (verified from im2prompt & testing):**
- ✅ Test URL is `test-api.creem.io` (not sandbox)
- ✅ Production keys are `creem_*`, test keys are `creem_test_*`
- ✅ All subscriptions use `sub_*` format (no test prefix)
- ✅ Creem uses `x-api-key` header (not Authorization Bearer)

**Golden Rule:** Verify API behavior through testing and working examples, not assumptions.

---

### 4. **Read SDK Source Code**

**What went wrong:**
- Used Creem SDK for main path but custom fetch for fallback
- Didn't check how SDK implements authentication
- Assumed `Authorization: Bearer` was correct

**What should have been checked:**
```typescript
// node_modules/creem/src/lib/fetcher.ts (or similar)
// SDK converts xApiKey to x-api-key header

function makeRequest(options) {
  const headers = {
    'x-api-key': options.xApiKey,  // ✅ This is the correct format!
  };
  return fetch(url, { headers });
}
```

**Golden Rule:** When using SDKs, check their source code to understand correct API patterns.

---

### 5. **Listen to User Feedback**

**User's signals (ignored initially):**
1. "Already regenerated API key, same error" → But kept suggesting API key issues
2. "Check im2prompt project" → But only checked after 2+ hours
3. "Creem URL is decided by Creem, not us" → But kept investigating URL configuration
4. "Why you spent so much time?" → User frustrated by repeated wrong solutions

**What should have happened:**
- User says "already tried X" → Immediately rule out X
- User says "check Y" → Immediately check Y
- User questions approach → Re-evaluate methodology

**Golden Rule:** User knows their system. Listen to their pushback and adjust strategy.

---

## The Correct Fix (Final Solution)

### Changed Files
1. `/mnt/d/ai/viecom/src/lib/creem/creem-service.ts`

### Changes Made
```diff
# Lines 182, 238, 308, 388, 515, 594, 658

- Authorization: `Bearer ${CREEM_API_KEY}`,
+ 'x-api-key': CREEM_API_KEY,
```

### Verification
```bash
# Before fix
curl -X POST https://test-api.creem.io/v1/subscriptions/sub_XXX/upgrade \
  -H "Authorization: Bearer creem_test_XXX" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"prod_XXX","update_behavior":"proration-none"}'
→ 403 Forbidden ❌

# After fix
curl -X POST https://test-api.creem.io/v1/subscriptions/sub_XXX/upgrade \
  -H "x-api-key: creem_test_XXX" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"prod_XXX","update_behavior":"proration-none"}'
→ 200 OK ✅ Subscription upgraded
```

---

## Side Benefits of Investigation

While the investigation was inefficient, some improvements were made:

### 1. Auto-Detection of Test Mode
```typescript
// Before: Manual environment variable
const testMode = env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true';

// After: Auto-detect from API key
const testMode = apiKey.startsWith('creem_test_');
```

**Benefit:** Less configuration needed, prevents test key + production URL mismatches.

### 2. Better Error Messages
```typescript
// Added detailed logging
console.log('[Creem] Base URL:', baseUrl);
console.log('[Creem] Full URL:', fullUrl);
console.log('[Creem] API Key prefix:', apiKey.substring(0, 15));
```

**Benefit:** Easier debugging for future issues.

### 3. Updated Documentation
- Corrected API URL in comments
- Fixed API key format documentation
- Added notes about auto-detection

**Benefit:** Clearer documentation for future developers.

---

## Checklist for Future Debugging

When facing API authentication errors (403 Forbidden):

### Immediate Actions (First 15 minutes)
- [ ] **Check working reference implementation** (e.g., im2prompt)
- [ ] **Compare authentication headers** between working and failing code
- [ ] **Test API call directly** with curl/Postman
- [ ] **Try different header formats** (Bearer, x-api-key, etc.)
- [ ] **Check SDK source code** for correct authentication pattern

### If Still Failing (Next 30 minutes)
- [ ] Verify API key is valid (not revoked)
- [ ] Check API URL is correct (test vs production)
- [ ] Verify request body format matches API spec
- [ ] Check for IP whitelisting or rate limits
- [ ] Review API provider's documentation

### Last Resort (After 45 minutes)
- [ ] Contact API provider support with trace_id
- [ ] Check API status page for outages
- [ ] Review recent API changes or deprecations

---

## Estimated Time Savings

**Actual time spent:** ~3 hours

**Breakdown:**
- Wrong URL investigation: 1 hour
- API key format investigation: 1 hour  
- Environment mismatch: 30 minutes
- Header format (actual issue): 30 minutes

**Optimal approach (if followed checklist):**
- Check im2prompt immediately: 5 minutes
- Test header formats: 5 minutes
- Fix and verify: 5 minutes
- **Total: 15 minutes**

**Time wasted:** 2 hours 45 minutes (~91% of total time)

---

## Key Takeaways

### For AI Assistants
1. ✅ **Reference first, speculate last** - Check working implementations before making assumptions
2. ✅ **Test before coding** - Verify API behavior with direct tests
3. ✅ **Listen to user** - When user says "already tried X", believe them
4. ✅ **SDK source is truth** - Check SDK implementation for correct patterns
5. ✅ **Simple before complex** - Authentication headers before environment configuration

### For Developers
1. ✅ **Document working examples** - im2prompt served as reference
2. ✅ **Use SDKs correctly** - If SDK works, match its patterns in fallbacks
3. ✅ **Keep authentication consistent** - Don't mix Bearer tokens and API keys
4. ✅ **Test third-party APIs directly** - Don't rely on assumptions
5. ✅ **Read SDK source code** - Understanding SDK internals prevents bugs

---

## Conclusion

A simple authentication header mismatch (`Authorization: Bearer` vs `x-api-key`) caused a 3-hour debugging session due to:
- Making assumptions instead of checking working reference
- Not testing API behavior directly first
- Ignoring user's feedback about im2prompt
- Over-engineering solutions for non-existent problems

**The 15-minute fix became a 3-hour investigation** because the methodology was backwards.

**Correct debugging order:**
1. Check working reference (im2prompt)
2. Test actual API behavior
3. Compare implementations
4. Fix the difference
5. Verify

**Actual debugging order:**
1. Assume URL is wrong → fix non-issue
2. Assume key format is wrong → fix non-issue
3. Assume environment is wrong → fix non-issue
4. Finally test headers → find real issue

**Lesson:** Start with empirical evidence (working code, API tests), not theoretical analysis (assumptions, speculation).

---

## References

- **Working Implementation:** `/mnt/d/ai/im2prompt/src/lib/creem/creem-service.ts`
- **Fixed File:** `/mnt/d/ai/viecom/src/lib/creem/creem-service.ts`
- **Creem SDK:** `node_modules/creem/`
- **Test API URL:** `https://test-api.creem.io`
- **Production API URL:** `https://api.creem.io`

---

**Document Version:** 1.0  
**Last Updated:** November 21, 2025  
**Author:** Claude (AI Assistant)  
**Reviewed By:** User (Project Owner)
