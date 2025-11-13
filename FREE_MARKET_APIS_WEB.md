# Free Market Data APIs - Web App Integration

Your DealAnalyzer web app now includes server-side integration with **4 free public APIs** that provide comprehensive market intelligence data at no cost.

## 📊 Integrated APIs

| API | Free Tier | Requires Key | Data Provided | Status |
|-----|-----------|--------------|---------------|--------|
| **OpenWeatherMap** | 1,000 calls/day | ✅ Yes | Current Weather, Climate Data | ✅ Integrated |
| **Bureau of Labor Statistics (BLS)** | 500 calls/day | ❌ No* | Employment, Unemployment, Wages | ✅ Integrated |
| **Federal Reserve (FRED)** | Unlimited | ✅ Yes | Mortgage Rates, Home Price Index, Economic Indicators | ✅ Integrated |
| **Nominatim (OpenStreetMap)** | 1 req/sec | ❌ No | Geocoding (Address → Coordinates) | ✅ Already integrated |
| ~~Walk Score~~ | 5,000 calls/day | ❌ Excluded | Walkability Scores | ⚠️ Excluded (domain verification required) |

_*BLS API key is optional but recommended - increases daily limit from 25 to 500 calls_

---

## 🚀 Quick Setup

### Step 1: Get Your API Keys (5 minutes)

#### OpenWeatherMap API (Required for Weather Data)
1. Visit: https://openweathermap.org/api
2. Sign up for a free account
3. Go to "API keys" section
4. Copy your API key
5. **Free tier:** 1,000 calls/day, 60 calls/minute

#### Federal Reserve Economic Data (FRED) API (Required for Economic Indicators)
1. Visit: https://fred.stlouisfed.org/docs/api/api_key.html
2. Create a free account
3. Request an API key
4. **Free tier:** Unlimited calls

#### Bureau of Labor Statistics (BLS) API (Optional)
1. Visit: https://www.bls.gov/developers/api_signature_v2.htm
2. Register for a free API key (optional, but recommended)
3. **Without key:** 25 queries/day
4. **With key:** 500 queries/day

### Step 2: Add API Keys to Environment Variables

Add these to your `.env` file (or `.env.local` for Next.js):

```bash
# FREE Market Data APIs
OPENWEATHERMAP_API_KEY=your_openweathermap_key_here
FRED_API_KEY=your_fred_api_key_here
BLS_API_KEY=your_bls_key_here  # Optional
```

### Step 3: Restart Your Development Server

```bash
npm run dev
```

---

## 📁 Files Created

### Server Services (Backend)
- **[server/services/openweathermap-api.ts](server/services/openweathermap-api.ts)** - Weather data service
- **[server/services/bls-api.ts](server/services/bls-api.ts)** - Employment/unemployment statistics
- **[server/services/fred-api.ts](server/services/fred-api.ts)** - Economic indicators (mortgage rates, home price index)

### API Routes
- **[app/api/market/free-data/route.ts](app/api/market/free-data/route.ts)** - Combined endpoint for all free market data

### Configuration
- **[.env.example](.env.example)** - Updated with new API key placeholders

---

## 🔌 API Endpoint

### GET /api/market/free-data

Fetch comprehensive free market data for a location.

**Query Parameters:**
- `address` (string, optional): Full address to analyze
- `lat` (number, optional): Latitude (if address not provided)
- `lon` (number, optional): Longitude (if address not provided)
- `countyFips` (string, optional): 5-digit FIPS code for employment data

**Example Request:**
```typescript
// Using address
const response = await fetch(
  '/api/market/free-data?address=123 Main St, Dallas, TX 75201&countyFips=48113'
);

// Using coordinates
const response = await fetch(
  '/api/market/free-data?lat=32.7767&lon=-96.7970&countyFips=48113'
);

const data = await response.json();
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "location": {
      "lat": 32.7767,
      "lon": -96.797,
      "address": "Dallas, TX 75201, USA"
    },
    "weather": {
      "temp": 78,
      "feelsLike": 82,
      "humidity": 65,
      "description": "partly cloudy",
      "icon": "02d",
      "windSpeed": 10.5
    },
    "employment": {
      "unemploymentRate": 3.8,
      "employed": 1250000,
      "unemployed": 48000,
      "laborForce": 1298000,
      "year": 2025,
      "period": "October 2025"
    },
    "economy": {
      "mortgageRate": {
        "rate": 6.5,
        "date": "2025-11-07"
      },
      "homePriceIndex": {
        "index": 315.2,
        "date": "2025-09-01",
        "change1Year": 5.8,
        "change6Month": 2.3
      },
      "housingStarts": {
        "starts": 1450,
        "date": "2025-10-01",
        "change1Year": -2.1
      },
      "monthsSupply": {
        "supply": 3.2,
        "date": "2025-10-01"
      }
    }
  }
}
```

---

## 💻 Frontend Integration Examples

### Example 1: Fetch Market Data in a React Component

```typescript
'use client';

import { useState, useEffect } from 'react';

export function MarketDataDisplay({ address }: { address: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(
        `/api/market/free-data?address=${encodeURIComponent(address)}&countyFips=48113`
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    }

    fetchData();
  }, [address]);

  if (loading) return <div>Loading market data...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div>
      <h2>Free Market Intelligence</h2>

      {/* Weather */}
      {data.weather?.temp && (
        <div>
          <h3>Current Weather</h3>
          <p>Temperature: {Math.round(data.weather.temp)}°F</p>
          <p>Feels Like: {Math.round(data.weather.feelsLike)}°F</p>
          <p>Conditions: {data.weather.description}</p>
          <p>Humidity: {data.weather.humidity}%</p>
        </div>
      )}

      {/* Employment */}
      {data.employment?.unemploymentRate && (
        <div>
          <h3>Employment Statistics</h3>
          <p>Unemployment Rate: {data.employment.unemploymentRate.toFixed(1)}%</p>
          <p>Labor Force: {data.employment.laborForce?.toLocaleString()}</p>
          <p>As of: {data.employment.period}</p>
        </div>
      )}

      {/* Economic Indicators */}
      {data.economy && (
        <div>
          <h3>Economic Indicators</h3>

          {data.economy.mortgageRate?.rate && (
            <p>30-Year Mortgage Rate: {data.economy.mortgageRate.rate.toFixed(2)}%</p>
          )}

          {data.economy.homePriceIndex?.index && (
            <>
              <p>Home Price Index: {data.economy.homePriceIndex.index.toFixed(1)}</p>
              {data.economy.homePriceIndex.change1Year && (
                <p>
                  YoY Change:
                  <span style={{ color: data.economy.homePriceIndex.change1Year > 0 ? 'green' : 'red' }}>
                    {data.economy.homePriceIndex.change1Year > 0 ? '+' : ''}
                    {data.economy.homePriceIndex.change1Year.toFixed(1)}%
                  </span>
                </p>
              )}
            </>
          )}

          {data.economy.housingStarts?.starts && (
            <p>Housing Starts: {data.economy.housingStarts.starts.toLocaleString()} (thousands)</p>
          )}

          {data.economy.monthsSupply?.supply && (
            <p>Months Supply: {data.economy.monthsSupply.supply.toFixed(1)} months</p>
          )}
        </div>
      )}
    </div>
  );
}
```

### Example 2: Add to Market Intelligence Page

Update your `app/components/market-intelligence.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';

// Inside your MarketIntelligence component
const { data: freeMarketData } = useQuery({
  queryKey: ['free-market-data', zipCode],
  queryFn: async () => {
    if (!zipCode) return null;
    const response = await fetch(
      `/api/market/free-data?address=${zipCode}&countyFips=${getFipsForZip(zipCode)}`
    );
    return response.json();
  },
  enabled: !!zipCode,
});

// Add to your UI
{freeMarketData?.data && (
  <Card>
    <CardHeader>
      <CardTitle>Economic Indicators (National)</CardTitle>
    </CardHeader>
    <CardContent>
      {freeMarketData.data.economy?.mortgageRate?.rate && (
        <div>
          <p className="text-sm text-muted-foreground">30-Year Mortgage Rate</p>
          <p className="text-2xl font-bold">
            {freeMarketData.data.economy.mortgageRate.rate.toFixed(2)}%
          </p>
        </div>
      )}

      {freeMarketData.data.economy?.homePriceIndex?.index && (
        <div>
          <p className="text-sm text-muted-foreground">S&P/Case-Shiller Index</p>
          <p className="text-2xl font-bold">
            {freeMarketData.data.economy.homePriceIndex.index.toFixed(1)}
          </p>
          {freeMarketData.data.economy.homePriceIndex.change1Year && (
            <p className={`text-sm ${freeMarketData.data.economy.homePriceIndex.change1Year > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {freeMarketData.data.economy.homePriceIndex.change1Year > 0 ? '+' : ''}
              {freeMarketData.data.economy.homePriceIndex.change1Year.toFixed(1)}% YoY
            </p>
          )}
        </div>
      )}
    </CardContent>
  </Card>
)}
```

---

## 📋 Finding County FIPS Codes

Employment data from BLS requires 5-digit county FIPS codes.

**Format:** `SSCCC`
- `SS` = 2-digit state FIPS code
- `CCC` = 3-digit county FIPS code

**Examples:**
- Dallas County, TX: `48113`
- Los Angeles County, CA: `06037`
- Cook County, IL: `17031`

**Find FIPS Codes:**
1. Search: "county FIPS code [county name] [state]"
2. Official lookup: https://www.nrcs.usda.gov/wps/portal/nrcs/detail/national/home/?cid=nrcs143_013697
3. Create a mapping table in your app for common counties

---

## 🎯 Use Cases

### 1. Property Analysis Screen
Show local weather and employment data alongside property metrics:
- Current temperature affects showing conditions
- Unemployment rate indicates economic health
- Mortgage rates affect buyer affordability

### 2. Market Intelligence Dashboard
Display national economic indicators:
- Track mortgage rate trends
- Monitor home price index changes
- Analyze housing supply (months' supply)

### 3. Deal Comparison Tool
Compare locations using weather and employment data:
- Climate comparison (avg temp, humidity)
- Job market strength (unemployment rate)
- Economic growth indicators

### 4. Email Digest
Include market updates in weekly digest:
- Current mortgage rates
- Home price trends
- Economic outlook

---

## 📊 Data You Can Access

### OpenWeatherMap API

**Current Weather:**
- Temperature (°F)
- Feels-like temperature
- Min/max temperature
- Humidity (%)
- Wind speed (mph)
- Weather description
- Cloud coverage
- Visibility

**Future Enhancement:**
- 5-day forecast (already implemented in service)
- Climate statistics (requires premium tier)

### Bureau of Labor Statistics (BLS) API

**Unemployment Data (by County):**
- Unemployment rate (%)
- Number of employed
- Number of unemployed
- Total labor force
- Historical data (year, period)

**Wage Data (by Area):**
- Average weekly wage
- By quarter
- By industry (future)

### Federal Reserve Economic Data (FRED) API

**National Indicators:**
- 30-year fixed mortgage rate
- S&P/Case-Shiller Home Price Index
- Housing starts (thousands of units)
- Months' supply of housing inventory

**Calculated Metrics:**
- Year-over-year changes
- 6-month changes
- Historical trends

---

## 🔧 Advanced Usage

### Caching Recommendations

The free APIs have reasonable rate limits, but you should cache results:

```typescript
// Example: Cache for 1 hour
import { kv } from '@vercel/kv';

async function getCachedFreeMarketData(address: string) {
  const cacheKey = `free-market:${address}`;

  // Try cache first
  const cached = await kv.get(cacheKey);
  if (cached) return cached;

  // Fetch fresh data
  const response = await fetch(`/api/market/free-data?address=${address}`);
  const data = await response.json();

  // Cache for 1 hour
  await kv.set(cacheKey, data, { ex: 3600 });

  return data;
}
```

### Error Handling

```typescript
try {
  const response = await fetch('/api/market/free-data?address=...');
  const result = await response.json();

  if (!result.success) {
    console.error('API error:', result.error);
    // Show fallback UI
  }
} catch (error) {
  console.error('Network error:', error);
  // Show error message to user
}
```

### Rate Limit Monitoring

Add logging to track API usage:

```typescript
// In your API route
console.log('[Free Market Data] Request:', {
  address,
  timestamp: new Date().toISOString(),
  // Track daily count in Redis or logs
});
```

---

## 🚫 Why Walk Score Was Excluded

Walk Score API requires domain verification:
- Email domain must match website domain
- Not compatible with personal/development email addresses
- Requires business verification

**Alternatives for Walkability Data:**
- Use Google Places API for nearby amenities
- Calculate transit access using Google Maps Directions API
- Provide manual walkability rating based on neighborhood type

---

## 💰 Cost Comparison

### Your Free Setup
- OpenWeatherMap: **FREE** (1,000 calls/day)
- BLS: **FREE** (500 calls/day with key)
- FRED: **FREE** (unlimited)
- Nominatim: **FREE** (1 req/sec)
- **Total: $0/month**

### Paid Alternatives
- Weather APIs: $50-$200/month
- Employment Data: $100-$500/month
- Economic Data: $50-$300/month
- **Total: $200-$1,000+/month**

### Cost Savings
By using these free APIs, you're saving **$200-$1,000+/month**!

---

## ✅ Summary

You've successfully integrated **4 powerful free APIs** into your web app:

1. ✅ **OpenWeatherMap** - Weather & climate data
2. ✅ **BLS** - Employment & wage statistics (no key needed!)
3. ✅ **FRED** - Mortgage rates & economic indicators
4. ✅ **Nominatim** - Geocoding (already integrated)

**Setup Time:** ~10 minutes
**Monthly Cost:** $0
**Value Equivalent:** $200-$1,000+/month

Start using these APIs today to provide premium market intelligence to your users completely free! 🎉

---

## 📚 Additional Resources

### Official Documentation
- **OpenWeatherMap:** https://openweathermap.org/api
- **BLS API:** https://www.bls.gov/developers/
- **FRED API:** https://fred.stlouisfed.org/docs/api/fred/
- **Nominatim:** https://nominatim.org/release-docs/latest/api/Overview/

### Code Examples
- Server services: [server/services/](server/services/)
- API routes: [app/api/market/free-data/](app/api/market/free-data/)
- Mobile integration: [mobile/FREE_MARKET_APIS_SETUP.md](mobile/FREE_MARKET_APIS_SETUP.md)

### Support
- Questions? Check API documentation
- Issues? Review error logs in Vercel/console
- Need help? Contact API providers' support
