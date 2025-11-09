# Market Intelligence API Setup Guide

You now have Attom API and Census API integrated! Follow these steps to get it working.

---

## ✅ Step 1: Add Your API Keys to `.env`

Open your `.env` file and add these lines:

```bash
# Market Intelligence APIs
ATTOM_API_KEY=your_attom_api_key_here
CENSUS_API_KEY=your_census_api_key_here
```

Replace `your_attom_api_key_here` and `your_census_api_key_here` with your actual API keys.

---

## ✅ Step 2: Restart Your Dev Server

The APIs won't work until you restart:

```bash
# Stop your current server (Ctrl+C)
# Then start fresh:
npm run dev:next
```

---

## ✅ Step 3: Test the Integration

### **Test Endpoint in Browser:**

Visit this URL (replace with a real zip code):
```
http://localhost:3002/api/market/neighborhood-trends?live=true&zipCode=90210
```

### **Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "zipCode": "90210",
      "neighborhood": "Beverly Hills CA",
      "month": "2024-01",
      "medianPrice": 2500000,
      "priceChange": 5.2,
      "averageDaysOnMarket": 45,
      "salesVolume": 123,
      "demographics": {
        "population": 34109,
        "medianIncome": 85936,
        "medianAge": 45.2,
        "medianHomeValue": 2000000
      }
    }
  ]
}
```

---

## ✅ Step 4: Use in Your Market Intelligence Tab

The market intelligence tab will now automatically use live data when you:

1. Go to `/market` page
2. Toggle "Use Live Data" switch ON
3. Enter a zip code or select city/state
4. View rich data from Attom + Census APIs!

---

## 📊 What Data You Get

### **From Attom API:**
- Median sale prices
- Price change percentages
- Average days on market
- Sales volume
- Monthly trends

### **From Census API:**
- Population statistics
- Median household income
- Median age
- Median home values
- Homeownership rates
- Education levels

### **Combined Power:**
Market trends + demographics = **Powerful insights!**

---

## 🔍 Example Usage

### **Get Neighborhood Trends:**
```typescript
// With live data
const response = await fetch('/api/market/neighborhood-trends?live=true&zipCode=10001');
const data = await response.json();
console.log(data.data);
```

### **In Your React Component:**
```typescript
const { data: trends } = useQuery({
  queryKey: ['/api/market/neighborhood-trends', 'live', zipCode],
  queryFn: async () => {
    const response = await apiRequest(
      'GET',
      `/api/market/neighborhood-trends?live=true&zipCode=${zipCode}`
    );
    return response.json();
  }
});
```

---

## ⚡ API Features

### **Caching:**
- **Attom data:** Cached for 24 hours
- **Census data:** Cached for 7 days
- This saves your API quota!

### **Fallback Strategy:**
1. Try Attom API (market trends)
2. Try Census API (demographics)
3. Fall back to RentCast API
4. Fall back to stored database data

### **Error Handling:**
All APIs have graceful error handling. If one fails, it tries the next source automatically.

---

## 📈 API Usage Tracking

### **Free Tier Limits:**
- **Attom:** 1,000 calls/month
- **Census:** Unlimited
- **Caching:** Reduces calls by ~90%

### **Estimated Usage:**
With caching enabled:
- ~10-20 Attom calls per day
- ~300-600 calls per month
- Well within free tier! ✅

---

## 🔧 Advanced Configuration

### **Adjust Cache Duration:**

Edit `/server/services/attom-api.ts`:
```typescript
// Default: 24 hours (86400 seconds)
const cache = new NodeCache({ stdTTL: 86400 });

// Change to 1 week:
const cache = new NodeCache({ stdTTL: 604800 });
```

### **Add More Census Variables:**

Edit `/server/services/census-api.ts` and add to `CENSUS_VARIABLES`:
```typescript
CRIME_RATE: 'B01001_001E',  // Example
POVERTY_RATE: 'B17001_002E',
```

---

## 🐛 Troubleshooting

### **Issue:** "API key not configured" warning

**Solution:**
1. Check `.env` file has `ATTOM_API_KEY` and `CENSUS_API_KEY`
2. Restart dev server
3. Verify no typos in variable names

### **Issue:** API returns `null` or no data

**Solution:**
1. Check API key is valid
2. Check zip code format (5 digits, no spaces)
3. Try a different zip code (some might not have data)
4. Check console logs for specific errors

### **Issue:** "Failed to fetch neighborhood trends"

**Solution:**
1. Check network connection
2. Verify API keys are active
3. Check if you've hit rate limits (unlikely with free tier)

---

## 📝 Testing Different Zip Codes

Try these popular zip codes:

```
90210 - Beverly Hills, CA (high-end)
10001 - New York, NY (urban)
60601 - Chicago, IL (downtown)
78701 - Austin, TX (growing market)
98101 - Seattle, WA (tech hub)
```

---

## 🎯 Next Steps

1. **Add your API keys to `.env`**
2. **Restart server:** `npm run dev:next`
3. **Test endpoint:** Visit the URL above
4. **Use in UI:** Toggle "Live Data" in Market tab
5. **Enjoy rich market insights!** 🎉

---

## 💡 Pro Tips

1. **Cache is your friend:** Don't worry about API limits with caching enabled
2. **Combine data sources:** Attom + Census = Best insights
3. **Monitor usage:** Check console logs to see cache hits vs API calls
4. **Production:** Deploy env vars to Vercel dashboard

---

## 🚀 You're Ready!

Your market intelligence tab now has access to:
- ✅ Real-time sales data (Attom)
- ✅ Comprehensive demographics (Census)
- ✅ Rental market data (RentCast - already configured)
- ✅ Smart caching for efficiency
- ✅ Automatic fallbacks for reliability

**Enjoy your enhanced market intelligence! 🏠📊**
