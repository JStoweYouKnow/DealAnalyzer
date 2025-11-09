# Free APIs for Market Intelligence Tab

Based on your market intelligence tab requirements (neighborhood trends, comparable sales, heat map data), here are the best free API options:

---

## 🏆 **Best Free Options**

### 1. **Attom Data Solutions** (Best Overall)
**API:** Property Data API  
**Free Tier:** 1,000 requests/month  
**Best For:** Comprehensive property data, sales history, valuations

**What You Get:**
- Property details (beds, baths, sq ft, year built)
- Sales history and comparable sales
- Tax assessor data
- Property valuations (AVM - Automated Valuation Model)
- Neighborhood demographics
- Market trends

**Pricing:**
- FREE: 1,000 calls/month
- Paid: $0.03-$0.10 per call after free tier

**Sign Up:** https://api.developer.attomdata.com/signup  
**Docs:** https://api.developer.attomdata.com/docs

**Sample Endpoints:**
```
GET /property/detail
GET /property/sale
GET /avm (Automated Valuation Model)
GET /salestrend
```

---

### 2. **Zillow Zestimate (via RapidAPI)** 
**API:** Zillow API on RapidAPI  
**Free Tier:** 500 requests/month  
**Best For:** Property valuations, Zestimates

**What You Get:**
- Zestimate (Zillow's home value estimate)
- Property details
- Rent Zestimate
- Historical pricing data
- Recently sold homes

**Sign Up:** https://rapidapi.com/apimaker/api/zillow-com1/  
**Docs:** https://rapidapi.com/apimaker/api/zillow-com1/

**Sample Usage:**
```javascript
// Get Zestimate for an address
const options = {
  method: 'GET',
  url: 'https://zillow-com1.p.rapidapi.com/property',
  params: { zpid: '48749425' },
  headers: {
    'X-RapidAPI-Key': 'YOUR_KEY',
    'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
  }
};
```

---

### 3. **Realtor.com (via RapidAPI)**
**API:** Realtor Data API  
**Free Tier:** 500 requests/month  
**Best For:** Listings, market trends, sold properties

**What You Get:**
- Active listings
- Recently sold properties
- Market statistics
- Price trends
- Days on market (DOM)
- Inventory levels

**Sign Up:** https://rapidapi.com/apidojo/api/realty-in-us/  
**Docs:** https://rapidapi.com/apidojo/api/realty-in-us/

---

### 4. **US Census Bureau** (100% Free, Unlimited)
**API:** American Community Survey (ACS) API  
**Free Tier:** Unlimited (requires API key)  
**Best For:** Demographics, neighborhood statistics

**What You Get:**
- Population demographics
- Income levels
- Education statistics
- Employment data
- Housing statistics
- Crime rates (via FBI Crime Data API)

**Sign Up:** https://api.census.gov/data/key_signup.html  
**Docs:** https://www.census.gov/data/developers/data-sets.html

**Sample Endpoints:**
```
# Get median household income for zip code
https://api.census.gov/data/2021/acs/acs5?get=NAME,B19013_001E&for=zip%20code%20tabulation%20area:94103&key=YOUR_KEY

# Get population
https://api.census.gov/data/2021/pep/population?get=POP&for=zip%20code%20tabulation%20area:*&key=YOUR_KEY
```

---

### 5. **Google Places API** (Limited Free Tier)
**API:** Places API  
**Free Tier:** $200/month credit (~40,000 requests)  
**Best For:** Points of interest, neighborhood amenities

**What You Get:**
- Schools nearby
- Restaurants, shopping
- Transit access
- Parks and recreation
- Reviews and ratings

**Sign Up:** https://console.cloud.google.com/  
**Docs:** https://developers.google.com/maps/documentation/places/web-service

---

### 6. **Walk Score API** (Limited Free)
**API:** Walk Score  
**Free Tier:** 5,000 requests/day  
**Best For:** Walkability, transit, bike scores

**What You Get:**
- Walk Score (0-100)
- Transit Score
- Bike Score
- Nearby amenities breakdown

**Sign Up:** https://www.walkscore.com/professional/api.php  
**Docs:** https://www.walkscore.com/professional/api.php

**Sample Request:**
```
https://api.walkscore.com/score?format=json
&address=1119%8th%20Avenue%20Seattle%20WA%2098101
&lat=47.6085
&lon=-122.3295
&wsapikey=YOUR_KEY
```

---

### 7. **Redfin (Web Scraping - No Official API)**
**Method:** Web scraping or unofficial APIs  
**Free Tier:** Unlimited (use responsibly)  
**Best For:** Recent sales data, market statistics

**Note:** Redfin doesn't have an official API, but you can:
- Use their data download tools
- Web scrape (check their robots.txt)
- Use third-party wrappers

**Data Available:**
- Recently sold homes
- Active listings
- Price per sq ft trends
- Days on market
- Market competitiveness

---

## 🔄 **Alternative Options**

### 8. **HouseCanary** 
- **Free Trial:** 14 days, then paid
- Real-time property valuations
- Rental estimates
- Market analytics

### 9. **Estated**
- **Free Tier:** 500 requests/month
- Property details
- Owner information
- Sales history
- https://estated.com/developers

### 10. **Rentcast API** (You already have!)
- **What you're using:** Rental comps
- Great for rental market data
- Keep using this for rental estimates

---

## 📊 **Recommended Integration Strategy**

### **For Neighborhood Trends:**
```javascript
// Combine multiple sources for best results
const neighborhoodData = {
  // US Census API - Demographics (FREE, unlimited)
  demographics: await getCensusData(zipCode),
  
  // Attom API - Sales trends (1,000/month free)
  salesTrends: await getAttomSalesTrends(zipCode),
  
  // Walk Score - Walkability (5,000/day free)
  walkability: await getWalkScore(address),
  
  // Google Places - Amenities ($200/month credit)
  amenities: await getNearbyAmenities(coords)
};
```

### **For Comparable Sales:**
```javascript
// Primary: Attom Data (most comprehensive)
const comps = await attomApi.getComparableSales({
  address,
  radius: 2, // miles
  limit: 10
});

// Fallback: Zillow (if Attom quota exceeded)
if (!comps) {
  const zillowComps = await zillowApi.getNearbyHomes(zpid);
}
```

### **For Market Heat Map:**
```javascript
// Combine for heat level calculation
const heatData = {
  // Attom - Price trends
  priceChange: await attomApi.getPriceTrends(zipCode),
  
  // Realtor - Days on market
  dom: await realtorApi.getMarketStats(zipCode),
  
  // Census - Population growth
  population: await censusApi.getPopulationChange(zipCode)
};

// Calculate heat level
const heatLevel = calculateHeat(heatData);
```

---

## 🚀 **Quick Start: Attom API (Recommended)**

### 1. Sign Up
```bash
# Go to https://api.developer.attomdata.com/signup
# Fill out form
# Get API key immediately
```

### 2. Test the API
```bash
# Get property details
curl -X GET "https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=4529%20Winona%20Court&address2=Denver%2C%20CO%2080212" \
  -H "apikey: YOUR_API_KEY" \
  -H "accept: application/json"
```

### 3. Add to Your App
```typescript
// server/attom-api.ts
export async function getPropertyDetails(address: string) {
  const response = await fetch(
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(address)}`,
    {
      headers: {
        'apikey': process.env.ATTOM_API_KEY!,
        'accept': 'application/json'
      }
    }
  );
  return response.json();
}
```

---

## 💰 **Cost Comparison**

| API | Free Tier | After Free | Best For |
|-----|-----------|------------|----------|
| **Attom** | 1,000/mo | $0.03-0.10/call | Property data, sales |
| **Zillow** | 500/mo | $0.004/call | Valuations |
| **Realtor** | 500/mo | $0.004/call | Listings, trends |
| **Census** | Unlimited | Free forever | Demographics |
| **Walk Score** | 5,000/day | Contact sales | Walkability |
| **Google Places** | $200 credit | $17/1000 calls | Amenities |
| **RentCast** | Limited | $0.02/call | Rentals (you have) |

---

## 🎯 **Best Combo for Your App (Under $10/month)**

### **Free Tier Strategy:**
1. **Attom Data** - 1,000 calls/month for property data & comps
2. **US Census** - Unlimited for demographics
3. **Walk Score** - 5,000/day for walkability
4. **Google Places** - $200 credit for amenities

### **Paid Strategy (if needed):**
- Attom: 1,000 free + 1,000 paid = 2,000 total (~$30-100/mo)
- Total cost: ~$30-50/month for comprehensive data

### **Budget Strategy (100% Free):**
1. **US Census API** - Demographics (unlimited)
2. **Walk Score** - Walkability (5,000/day)
3. **Web scraping** - Zillow/Redfin for property data (use sparingly)
4. **Manual data entry** - Seed database with key markets

---

## 📝 **Next Steps**

1. **Sign up for Attom Data** (best free tier)
   - Get 1,000 calls/month free
   - Test with your app

2. **Get US Census API key** (unlimited free)
   - Demographics data
   - Neighborhood stats

3. **Add Walk Score** (5,000/day free)
   - Walkability scores
   - Transit info

4. **Optional: Google Places** ($200 credit)
   - Nearby amenities
   - School ratings

5. **Create integration layer**
   - Build unified API in your backend
   - Cache responses to reduce calls
   - Implement rate limiting

---

## 🔧 **Implementation Tips**

### Cache Responses
```typescript
// Cache API responses for 24 hours
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 86400 });

export async function getCachedMarketData(zipCode: string) {
  const cacheKey = `market_${zipCode}`;
  const cached = cache.get(cacheKey);
  
  if (cached) return cached;
  
  const data = await fetchMarketData(zipCode);
  cache.set(cacheKey, data);
  return data;
}
```

### Rate Limiting
```typescript
import pLimit from 'p-limit';

// Limit to 5 concurrent requests
const limit = pLimit(5);

const results = await Promise.all(
  addresses.map(addr => 
    limit(() => getPropertyData(addr))
  )
);
```

### Fallback Strategy
```typescript
export async function getPropertyDataWithFallback(address: string) {
  try {
    return await attomApi.getProperty(address);
  } catch (error) {
    console.warn('Attom failed, trying Zillow...');
    return await zillowApi.getProperty(address);
  }
}
```

---

## ✅ **Summary**

**Best Free Setup:**
- **Attom Data** (1,000/mo) - Primary property data source
- **US Census** (unlimited) - Demographics
- **Walk Score** (5,000/day) - Walkability
- **RentCast** (existing) - Rental data

**Total Cost:** FREE (within limits)  
**Estimated Coverage:** ~1,000 properties/month with comprehensive data

This should power your market intelligence tab with live, accurate real estate data!
