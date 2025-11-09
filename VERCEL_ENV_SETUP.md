# Add Market Intelligence API Keys to Vercel

Follow these steps to enable the new market intelligence features in your Vercel deployment:

## Step 1: Access Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click on your **DealAnalyzer** project
3. Click on **Settings** (top navigation)
4. Click on **Environment Variables** (left sidebar)

## Step 2: Add API Keys

Add these two environment variables:

### Attom API Key
- **Name**: `ATTOM_API_KEY`
- **Value**: `c08f4aa53270034d3c1d22f093311d3f`
- **Environments**: Check all three:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

Click **Save**

### Census API Key
- **Name**: `CENSUS_API_KEY`
- **Value**: `61867eb674faa3f8e8113339dcdc5bc26715a19a`
- **Environments**: Check all three:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

Click **Save**

## Step 3: Redeploy

After adding the environment variables, you need to redeploy:

### Option A: Trigger Automatic Deployment
```bash
# Make a small change and push to trigger deployment
git add .
git commit -m "Add market intelligence API integration"
git push
```

### Option B: Manual Redeploy from Dashboard
1. Go to **Deployments** tab in Vercel
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (~2-3 minutes)

## Step 4: Test in Production

Once deployed, visit your production URL and test:

```
https://your-app.vercel.app/api/market/neighborhood-trends?live=true&zipCode=90210
```

You should see:
- ✅ `marketStats` with 100 properties analyzed
- ✅ `sampleProperties` array with 10 property listings
- ✅ `demographics` with Census data

## Expected Production Response

```json
{
  "success": true,
  "data": [
    {
      "zipCode": "90210",
      "neighborhood": "Beverly Hills",
      "marketStats": {
        "totalProperties": 100,
        "medianSalePrice": 3120000,
        "avgPricePerSqft": 1025.71,
        "medianBuildingSize": 4121,
        "avgYearBuilt": 1962,
        "propertyTypes": {
          "SINGLE FAMILY RESIDENCE": 91,
          "CONDOMINIUM": 6,
          "DUPLEX (2 UNITS, ANY COMBINATION)": 2
        },
        "ownerOccupancyRate": 81
      },
      "sampleProperties": [
        {
          "address": "502 N ALTA DR, BEVERLY HILLS, CA 90210",
          "beds": 3,
          "buildingSize": 1924,
          "lastSalePrice": 6055000,
          "ownerOccupied": true
        }
        // ... 9 more properties
      ],
      "demographics": {
        "population": 19627,
        "medianIncome": 154740,
        "medianAge": 49.1
        // ... more census data
      }
    }
  ]
}
```

## Troubleshooting

### If you still see old data:
1. **Clear cache**: Hard refresh (Cmd/Ctrl + Shift + R)
2. **Check deployment logs**: Look for API errors
3. **Verify env vars**: Settings → Environment Variables → Confirm they're set

### If you see errors:
1. Check Vercel deployment logs
2. Look for "ATTOM_API_KEY not configured" or similar warnings
3. Ensure you checked all three environments when adding the variables

## Success Indicators

You'll know it's working when:
- ✅ Market Intelligence tab shows 100 real properties
- ✅ Property cards display actual addresses, prices, specs
- ✅ Market statistics show calculated data (median prices, etc.)
- ✅ Demographics section shows Census data
- ✅ Console logs show "Fetched 100 properties from Attom API"

## Next: Use in Your App

Once deployed, your Market Intelligence tab will automatically use the new data:
1. Go to `/market` page
2. Toggle "Use Live Data" ON
3. Enter a zip code (e.g., 90210, 10001, 60601)
4. See 100 real properties + demographics!

---

**Note**: The API keys in this file are your actual production keys. Keep this file secure and don't share it publicly.
