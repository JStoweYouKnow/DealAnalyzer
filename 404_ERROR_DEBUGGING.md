# 404 Error Debugging Guide - Email Deal Analysis

## Error Message
```
Failed to load resource: the server responded with a status of 404
```

## Understanding the Error

This 404 error occurs when trying to analyze an email deal. The error message is generic and could refer to:

1. **The API endpoint itself** (`/api/analyze-email-deal`)
2. **The email deal not being found** (most likely cause)
3. **A missing static asset** (JS, CSS, image file)
4. **A missing dependency module**

## Most Likely Cause: Email Deal Not Found

Based on the code in `/app/api/analyze-email-deal/route.ts`, the endpoint returns a 404 error when:

```typescript
const emailDeal = await storage.getEmailDeal(dealId);
if (!emailDeal) {
  return NextResponse.json(
    { success: false, error: "Email deal not found" },
    { status: 404 }
  );
}
```

**This means the `dealId` you're trying to analyze doesn't exist in the database/storage.**

## How to Debug

### Step 1: Check Browser Network Tab

1. Open your browser's Developer Tools (F12)
2. Go to the **Network** tab
3. Try to analyze the email deal again
4. Look for the failed request:
   - **What URL is returning 404?**
   - **What's the response body?** (Click on the failed request to see details)

### Step 2: Verify the Deal ID

Check if the email deal exists:

1. **Check the deals list**: Go to `/deals` page and verify the deal is visible
2. **Check the deal ID format**: 
   - Convex IDs start with `k` (e.g., `k1234567890`)
   - Gmail IDs are typically longer strings
3. **Verify in database**: Check your Convex dashboard or storage to confirm the deal exists

### Step 3: Check Server Logs

Look at your server console/logs for:
- Error messages from the API route
- Database connection issues
- Storage initialization problems

### Step 4: Test the API Directly

You can test the endpoint directly using curl or Postman:

```bash
curl -X POST http://localhost:3000/api/analyze-email-deal \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": "YOUR_DEAL_ID_HERE",
    "emailContent": "YOUR_EMAIL_CONTENT_HERE"
  }'
```

Replace `YOUR_DEAL_ID_HERE` with an actual deal ID from your database.

## Common Scenarios

### Scenario 1: Deal Was Deleted
**Symptom**: Deal appears in list but returns 404 when analyzing
**Solution**: The deal may have been deleted. Refresh the deals list and try again.

### Scenario 2: Wrong Deal ID Format
**Symptom**: Using Gmail ID when Convex ID is expected (or vice versa)
**Solution**: The storage layer tries both formats, but verify you're using the correct ID from the deals list.

### Scenario 3: Storage Not Initialized
**Symptom**: All deals return 404
**Solution**: Check your Convex configuration:
- `CONVEX_URL` environment variable is set
- Convex deployment is active
- Storage is properly initialized

### Scenario 4: Static Asset Missing
**Symptom**: 404 on a `.js`, `.css`, or image file
**Solution**: 
- Check if the file exists in your `public` folder
- Rebuild the application: `npm run build`
- Clear browser cache

## Code Flow

Here's what happens when you click "Analyze Deal":

1. **Frontend** (`app/deals/page.tsx` line 115):
   ```typescript
   const response = await apiRequest('POST', '/api/analyze-email-deal', {
     dealId: deal.id,
     emailContent: deal.emailContent
   });
   ```

2. **API Route** (`app/api/analyze-email-deal/route.ts`):
   - Receives `dealId` and `emailContent`
   - Calls `storage.getEmailDeal(dealId)` (line 19)
   - **If deal not found → returns 404** (line 20-24)
   - If found → continues with analysis

3. **Storage Layer** (`server/storage.ts`):
   - Tries to get deal from Convex or in-memory storage
   - Returns `null` or `undefined` if not found

## Fixes

### Fix 1: Ensure Deal Exists Before Analyzing

Add validation in the frontend before calling the API:

```typescript
const analyzeDealMutation = useMutation({
  mutationFn: async (deal: EmailDeal) => {
    // Verify deal has required data
    if (!deal.id || !deal.emailContent) {
      throw new Error('Deal is missing required data');
    }
    
    const response = await apiRequest('POST', '/api/analyze-email-deal', {
      dealId: deal.id,
      emailContent: deal.emailContent
    });
    return response.json() as Promise<AnalyzePropertyResponse>;
  },
  // ... rest of mutation
});
```

### Fix 2: Better Error Handling

Improve error messages in the API route:

```typescript
const emailDeal = await storage.getEmailDeal(dealId);
if (!emailDeal) {
  console.error(`Email deal not found: ${dealId}`);
  return NextResponse.json(
    { 
      success: false, 
      error: `Email deal not found with ID: ${dealId}`,
      suggestion: "Please refresh the deals list and try again"
    },
    { status: 404 }
  );
}
```

### Fix 3: Check Storage Connection

Add logging to verify storage is working:

```typescript
// In the API route, before getting the deal
console.log('Looking for email deal with ID:', dealId);
const allDeals = await storage.getEmailDeals();
console.log(`Total deals in storage: ${allDeals.length}`);
console.log('Available deal IDs:', allDeals.map(d => d.id));

const emailDeal = await storage.getEmailDeal(dealId);
```

## Quick Checklist

- [ ] Check browser Network tab to see exact 404 URL
- [ ] Verify the deal exists in the deals list
- [ ] Check server console for error messages
- [ ] Verify Convex/storage is properly configured
- [ ] Try refreshing the deals list
- [ ] Check if the deal ID format is correct
- [ ] Verify environment variables are set

## Next Steps

1. **Check the Network tab** to see the exact request that's failing
2. **Verify the deal ID** exists in your database
3. **Check server logs** for more detailed error information
4. **Test with a known good deal ID** to isolate the issue

If the error persists, share:
- The exact URL from the Network tab
- The response body (if any)
- Server console logs
- The deal ID you're trying to analyze

