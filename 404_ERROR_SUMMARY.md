# 404 Error Summary - Email Deal Analysis

## The Problem

When trying to analyze an email deal, you're getting:
```
Failed to load resource: the server responded with a status of 404
```

## Root Cause Analysis

The 404 error is most likely coming from the `/api/analyze-email-deal` endpoint when it can't find the email deal in storage. Here's the flow:

1. **Frontend** calls the API with `dealId` and `emailContent`
2. **API Route** (`app/api/analyze-email-deal/route.ts:19-24`) tries to fetch the deal:
   ```typescript
   const emailDeal = await storage.getEmailDeal(dealId);
   if (!emailDeal) {
     return NextResponse.json(
       { success: false, error: "Email deal not found" },
       { status: 404 }
     );
   }
   ```
3. **If deal not found** → Returns 404

## Why This Happens

1. **Deal ID mismatch**: The `deal.id` from the frontend doesn't match what's in storage
2. **Deal was deleted**: The deal exists in the list but was removed from storage
3. **Storage not initialized**: Convex or in-memory storage isn't properly set up
4. **ID format issue**: Using wrong ID format (Gmail ID vs Convex ID)

## The Fix

### 1. Add Error Handling to Frontend

The mutation currently has no `onError` handler, so errors aren't shown to users. Add this:

```typescript
const analyzeDealMutation = useMutation({
  mutationFn: async (deal: EmailDeal) => {
    // Validate deal has required data
    if (!deal.id) {
      throw new Error('Deal ID is missing');
    }
    if (!deal.emailContent) {
      throw new Error('Email content is missing');
    }
    
    const response = await apiRequest('POST', '/api/analyze-email-deal', {
      dealId: deal.id,
      emailContent: deal.emailContent
    });
    return response.json() as Promise<AnalyzePropertyResponse>;
  },
  onSuccess: (data) => {
    if (data.success) {
      queryClient.invalidateQueries({ queryKey: ['/api/email-deals'] });
      toast({
        title: "Deal Analyzed",
        description: "Property analysis completed successfully",
      });
    }
  },
  onError: (error: Error) => {
    console.error('Error analyzing deal:', error);
    toast({
      title: "Analysis Failed",
      description: error.message || "Failed to analyze email deal",
      variant: "destructive",
    });
  }
});
```

### 2. Improve API Error Messages

Update the API route to provide more context:

```typescript
// In app/api/analyze-email-deal/route.ts
const emailDeal = await storage.getEmailDeal(dealId);
if (!emailDeal) {
  console.error(`Email deal not found: ${dealId}`);
  // Log available deals for debugging
  const allDeals = await storage.getEmailDeals();
  console.log(`Total deals in storage: ${allDeals.length}`);
  console.log('Available deal IDs:', allDeals.map(d => d.id).slice(0, 10));
  
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

### 3. Verify Deal Before Analyzing

Add a check in the frontend before calling the API:

```typescript
// Before calling mutate, verify deal exists
if (!deal.id || !deal.emailContent) {
  toast({
    title: "Invalid Deal",
    description: "This deal is missing required information",
    variant: "destructive",
  });
  return;
}
```

## How to Debug Right Now

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Click "Analyze Deal"** on a deal
4. **Find the failed request** to `/api/analyze-email-deal`
5. **Click on it** and check:
   - **Request Payload**: Does it have `dealId` and `emailContent`?
   - **Response**: What's the error message?
6. **Check Console tab** for any JavaScript errors

## Quick Test

Test if the deal exists by checking the deals list API:

```bash
# In browser console or terminal
fetch('/api/email-deals')
  .then(r => r.json())
  .then(deals => {
    console.log('Total deals:', deals.length);
    console.log('Deal IDs:', deals.map(d => d.id));
  });
```

Then verify the deal ID you're trying to analyze is in that list.

## Most Common Solution

**Refresh the deals list** and try again. The deal might have been:
- Deleted
- Updated with a new ID
- Not properly synced from email

If the problem persists, check:
- Convex dashboard for the deal
- Server logs for storage errors
- Environment variables (CONVEX_URL, etc.)

