# Free Market Data APIs - Setup Guide

Your DealAnalyzer mobile app now includes integration with **5 free public APIs** that provide comprehensive market intelligence data at no cost.

## 📊 Integrated APIs Overview

| API | Free Tier | Requires Key | Data Provided |
|-----|-----------|--------------|---------------|
| **Walk Score API** | 5,000 calls/day | ✅ Yes | Walkability, Transit, Bike Scores |
| **OpenWeatherMap** | 1,000 calls/day | ✅ Yes | Current Weather, Climate Data |
| **Bureau of Labor Statistics (BLS)** | 500 calls/day | ❌ No | Employment, Unemployment, Wages |
| **Federal Reserve (FRED)** | 120 requests/minute | ✅ Yes | Mortgage Rates, Home Price Index, Economic Indicators |
| **Nominatim (OpenStreetMap)** | 1 req/sec | ❌ No | Geocoding (Address → Coordinates) |

---

## 🚀 Quick Start

### Step 1: Get Your API Keys

#### Walk Score API (Recommended)
1. Visit: https://www.walkscore.com/professional/api.php
2. Fill out the application form
3. You'll receive your API key via email
4. **Cost:** FREE (5,000 calls/day)

#### OpenWeatherMap API (Recommended)
1. Visit: https://openweathermap.org/api
2. Sign up for a free account
3. Go to "API keys" section
4. Copy your default API key
5. **Cost:** FREE (1,000 calls/day, 60 calls/minute)

#### Federal Reserve Economic Data (FRED) API (Recommended)
1. Visit: https://fred.stlouisfed.org/docs/api/api_key.html
2. Create a free account
3. Request an API key
4. **Cost:** Completely FREE (120 requests/minute)

#### Bureau of Labor Statistics & Nominatim
**No API keys needed!** These are completely free public APIs.

### Step 2: Configure Your API Keys

**Option 1: Using app.json (Recommended for Expo)**

1. Open `mobile/app.json`
2. Add your keys to the `extra` section:

```json
{
  "expo": {
    "extra": {
      "walkScoreApiKey": "YOUR_WALK_SCORE_KEY",
      "openWeatherMapApiKey": "YOUR_OPENWEATHERMAP_KEY",
      "fredApiKey": "YOUR_FRED_KEY"
    }
  }
}
```

**Option 2: Using .env file**

1. Copy `.env.example` to `.env`
2. Fill in your API keys:

```bash
WALK_SCORE_API_KEY=your_key_here
OPENWEATHERMAP_API_KEY=your_key_here
FRED_API_KEY=your_key_here
```

### Step 3: Use in Your App

The APIs are automatically available through the `api` service:

```typescript
import { marketDataService } from '../services/api';

// Get comprehensive market intelligence
const data = await marketDataService.getMarketIntelligence({
  address: '123 Main St, Dallas, TX 75201',
});

console.log('Walkability:', data.walkability);
console.log('Weather:', data.weather);
console.log('Employment:', data.employment);
console.log('Economy:', data.economy);
```

---

## 📱 Using the Example Component

We've created a ready-to-use `MarketDataCard` component that displays all the market data:

```typescript
import MarketDataCard from '../components/MarketDataCard';

// In your screen
<MarketDataCard
  address="123 Main St, Dallas, TX 75201"
  lat={32.7767}  // Optional
  lon={-96.7970}  // Optional
  countyFips="48113"  // Optional, for BLS employment data
/>
```

---

## 🔍 What Each API Provides

### 1. Walk Score API
**What You Get:**
- **Walk Score (0-100):** How walkable is the neighborhood?
  - 90-100: Walker's Paradise
  - 70-89: Very Walkable
  - 50-69: Somewhat Walkable
  - 25-49: Car-Dependent
  - 0-24: Very Car-Dependent
- **Transit Score:** Access to public transportation
- **Bike Score:** How bikeable is the area?

**Why It Matters:**
Walkability affects property values, rental demand, and quality of life. Properties in walkable neighborhoods often command premium rents.

**Usage Example:**
```typescript
import { walkScoreAPI } from '../services/api';

const scores = await walkScoreAPI.getScores({
  address: '123 Main St',
  lat: 32.7767,
  lon: -96.7970,
});

console.log(scores.walkScore); // 75
console.log(scores.walkDescription); // "Very Walkable"
```

---

### 2. OpenWeatherMap API
**What You Get:**
- Current temperature
- Feels-like temperature
- Humidity
- Weather conditions
- Weather icon code

**Why It Matters:**
Climate affects property desirability, energy costs, and maintenance expenses. Hot/humid climates = higher AC costs.

**Usage Example:**
```typescript
import { openWeatherMapAPI } from '../services/api';

const weather = await openWeatherMapAPI.getCurrentWeather({
  lat: 32.7767,
  lon: -96.7970,
});

console.log(weather.temp); // 78°F
console.log(weather.description); // "partly cloudy"
```

---

### 3. Bureau of Labor Statistics (BLS) API
**What You Get:**
- Unemployment rate by county
- Employment levels
- Labor force size
- Average wages (QCEW data)

**Why It Matters:**
Employment trends indicate economic health. Low unemployment = higher rents, better tenant quality, stronger market.

**Usage Example:**
```typescript
import { blsAPI } from '../services/api';

// Get unemployment for Dallas County (FIPS: 48113)
const employment = await blsAPI.getUnemploymentRate('48113');

console.log(employment.unemploymentRate); // 3.8%
console.log(employment.laborForce); // 1,250,000
```

**Finding FIPS Codes:**
- Search: "county FIPS code [county name]"
- Format: 5 digits (2-digit state + 3-digit county)
- Example: Dallas County, TX = 48113

---

### 4. Federal Reserve (FRED) API
**What You Get:**
- **30-Year Mortgage Rate:** Current national average
- **Home Price Index:** S&P/Case-Shiller National Index
- **Home Price Change:** Year-over-year percentage change
- **Housing Starts:** New construction activity

**Why It Matters:**
- Mortgage rates affect affordability and demand
- Home Price Index tracks national market trends
- Housing starts indicate supply/demand balance

**Usage Example:**
```typescript
import { fredAPI } from '../services/api';

// Get current mortgage rate
const mortgage = await fredAPI.getMortgageRate();
console.log(mortgage.rate); // 6.5%

// Get home price index
const hpi = await fredAPI.getHomePriceIndex();
console.log(hpi.index); // 315.2
console.log(hpi.change1Year); // +5.8% (YoY)
```

---

### 5. Nominatim Geocoding API
**What You Get:**
- Latitude/Longitude from address
- County name
- State
- ZIP code
- Full formatted address

**Why It Matters:**
Converts addresses to coordinates so other APIs can work. Required for Walk Score, OpenWeatherMap, etc.

**Usage Example:**
```typescript
import { geocodingAPI } from '../services/api';

const location = await geocodingAPI.geocode('123 Main St, Dallas, TX');

console.log(location.lat); // 32.7767
console.log(location.lon); // -96.7970
console.log(location.county); // Dallas County
console.log(location.zipCode); // 75201
```

**Important:** Rate limited to 1 request per second. The API service handles this automatically.

---

## 📋 Complete Implementation Example

Here's a complete example of using all APIs together:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { marketDataService } from '../services/api';

export default function PropertyAnalysisScreen({ route }) {
  const { address } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketData();
  }, [address]);

  const loadMarketData = async () => {
    try {
      const marketData = await marketDataService.getMarketIntelligence({
        address,
        countyFips: '48113', // Dallas County
      });
      setData(marketData);
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <View>
      <Text>Address: {address}</Text>

      {/* Walkability */}
      {data?.walkability?.walkScore && (
        <View>
          <Text>Walk Score: {data.walkability.walkScore}</Text>
          <Text>Transit Score: {data.walkability.transitScore}</Text>
          <Text>Bike Score: {data.walkability.bikeScore}</Text>
        </View>
      )}

      {/* Current Weather */}
      {data?.weather?.temp && (
        <View>
          <Text>Temperature: {Math.round(data.weather.temp)}°F</Text>
          <Text>Conditions: {data.weather.description}</Text>
        </View>
      )}

      {/* Employment Data */}
      {data?.employment?.unemploymentRate && (
        <View>
          <Text>Unemployment: {data.employment.unemploymentRate.toFixed(1)}%</Text>
          <Text>Labor Force: {data.employment.laborForce?.toLocaleString()}</Text>
        </View>
      )}

      {/* Economic Indicators */}
      {data?.economy && (
        <View>
          <Text>Mortgage Rate: {data.economy.mortgageRate?.toFixed(2)}%</Text>
          <Text>Home Price Index: {data.economy.homePriceIndex?.toFixed(1)}</Text>
          <Text>Price Change (YoY): {data.economy.homePriceChange?.toFixed(1)}%</Text>
        </View>
      )}
    </View>
  );
}
```

---

## 🎯 Best Practices

### Rate Limiting
1. **Cache Results:** Store API responses locally to avoid duplicate calls
2. **Batch Requests:** Load all data at once instead of multiple separate calls
3. **Implement Retry Logic:** Handle rate limit errors gracefully

### Error Handling
```typescript
try {
  const data = await marketDataService.getMarketIntelligence({ address });
  // Use data
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limit exceeded
    console.log('Too many requests, try again later');
  } else {
    // Other error
    console.error('API error:', error);
  }
}
```

### API Key Security
- **Never commit API keys to git**
- Add `.env` to `.gitignore`
- Use environment variables in production
- Rotate keys if exposed

---

## 🔧 Troubleshooting

### "API key not configured" Warning
**Problem:** API returns empty data or warnings about missing keys

**Solution:**
1. Check `app.json` has keys in `expo.extra` section
2. Restart Expo dev server after adding keys
3. Clear Expo cache: `npx expo start -c`

### Geocoding Not Working
**Problem:** Can't convert address to coordinates

**Solution:**
1. Check address format (include city, state, ZIP)
2. Respect 1 req/sec rate limit (already handled)
3. Use specific addresses, not landmarks

### BLS Data Not Available
**Problem:** Employment data returns empty

**Solution:**
1. Verify FIPS code is correct (5 digits)
2. Some counties may not have recent data
3. Check BLS website for data availability

### FRED API Errors
**Problem:** Economic indicators not loading

**Solution:**
1. Verify API key is valid
2. Check series ID is correct (MORTGAGE30US, CSUSHPINSA, etc.)
3. Some series update monthly/quarterly, not daily

---

## 📊 Data Freshness

| API | Update Frequency | Typical Lag |
|-----|------------------|-------------|
| Walk Score | Static (calculated once) | N/A |
| OpenWeatherMap | Real-time | < 10 minutes |
| BLS | Monthly | 1-2 months |
| FRED | Daily to Monthly | Varies by series |
| Geocoding | Static (OpenStreetMap data) | Days to weeks |

---

## 💰 Cost Comparison

### Free Tier Limits
- Walk Score: 5,000 calls/day = ~150,000/month
- OpenWeatherMap: 1,000 calls/day = ~30,000/month
- BLS: 500 calls/day = ~15,000/month
- FRED: 120 requests/minute = ~7,200/hour = ~172,800/day (practical limit)
- Geocoding: ~86,400/day (1/sec) = ~2.5M/month

### Paid Alternatives (for comparison)
- **ATTOM Data API**: 
  - Professional Plan: $499/year (~$42/month) - [Source](https://www.attomdata.com/solutions/property-navigator/pricing/)
  - Enterprise Plan: Custom pricing (contact for quote)
- **Zillow API**: Deprecated (no longer available)
- **Walk Score Premium**: Starting at $115/month - [Source](https://www.walkscore.com/professional/pricing.php)

### Cost Savings
By using these free APIs instead of paid alternatives, you're saving at least **$115+/month** (Walk Score Premium) and potentially **$42+/month** (ATTOM Professional) depending on your needs. The free tier limits are generous enough for most mobile applications, making this a cost-effective solution for market intelligence data.

**Note:** RealtyMole was discontinued on March 1, 2025, and is no longer available as a service option.

---

## 🚀 Next Steps

1. **Get API Keys:** Sign up for Walk Score, OpenWeatherMap, and FRED
2. **Configure App:** Add keys to `app.json`
3. **Test Integration:** Use the `MarketDataCard` component
4. **Customize UI:** Build custom screens with the data
5. **Add Caching:** Implement local storage to reduce API calls
6. **Monitor Usage:** Track API call limits to stay within free tiers

---

## 📚 Additional Resources

### Official Documentation
- **Walk Score API:** https://www.walkscore.com/professional/api.php
- **OpenWeatherMap:** https://openweathermap.org/api
- **BLS API:** https://www.bls.gov/developers/
- **FRED API:** https://fred.stlouisfed.org/docs/api/fred/
- **Nominatim:** https://nominatim.org/release-docs/latest/api/Overview/

### Data Sources
- **FIPS Codes:** https://www.nrcs.usda.gov/wps/portal/nrcs/detail/national/home/?cid=nrcs143_013697
- **BLS Series IDs:** https://www.bls.gov/help/hlpforma.htm#OEUS
- **FRED Series:** https://fred.stlouisfed.org/tags/series

### Support
- Questions? Check the API documentation links above
- Issues? Create an issue in your project repository
- Need help? Consult the community forums for each API

---

## ✅ Summary

You now have **5 powerful free APIs** integrated into your mobile app:

1. ✅ **Walk Score** - Walkability & transportation scores
2. ✅ **OpenWeatherMap** - Weather & climate data
3. ✅ **BLS** - Employment & wage statistics (no key needed!)
4. ✅ **FRED** - Mortgage rates & economic indicators
5. ✅ **Nominatim** - Geocoding (no key needed!)

**Total Cost:** $0/month (100% free)

**Total Value:** $115+/month equivalent (vs. Walk Score Premium at $115/month, plus potential savings on ATTOM Professional at ~$42/month)

Start using these APIs today to provide premium market intelligence to your users without any cost! 🎉
