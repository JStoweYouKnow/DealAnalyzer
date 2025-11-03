import { NextRequest, NextResponse } from "next/server";

// Enable Edge Runtime for ultra-fast responses
export const runtime = 'edge';
export const revalidate = 3600; // Cache for 1 hour

// Popular markets for real estate investors
const POPULAR_MARKETS = [
  { city: 'Austin', state: 'TX' },
  { city: 'Dallas', state: 'TX' },
  { city: 'Houston', state: 'TX' },
  { city: 'Phoenix', state: 'AZ' },
  { city: 'Atlanta', state: 'GA' },
  { city: 'Nashville', state: 'TN' },
  { city: 'Tampa', state: 'FL' },
  { city: 'Orlando', state: 'FL' },
  { city: 'Las Vegas', state: 'NV' },
  { city: 'Denver', state: 'CO' },
  { city: 'Charlotte', state: 'NC' },
  { city: 'Raleigh', state: 'NC' },
  { city: 'San Antonio', state: 'TX' },
  { city: 'Fort Worth', state: 'TX' },
];

interface MarketStats {
  city: string;
  state: string;
  medianPrice: number;
  medianRent: number;
  averageCapRate: number;
  marketScore: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

// Fetch real market data from RentCast API with fallback to simulated data
async function getMarketStats(city: string, state: string): Promise<MarketStats> {
  const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;

  // If RentCast API key is available, fetch real data
  if (RENTCAST_API_KEY) {
    try {
      console.log(`[RentCast] Fetching data for ${city}, ${state}`);

      const response = await fetch(
        `https://api.rentcast.io/v1/markets/stats?city=${encodeURIComponent(city)}&state=${state}`,
        {
          headers: {
            'X-Api-Key': RENTCAST_API_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`[RentCast] ✅ Got data for ${city}, ${state}`);

        // Extract and validate medianPrice and medianRent
        const medianPrice = Number(data.medianPrice);
        const medianRent = Number(data.medianRent);

        // Check if values are valid and non-zero before performing divisions
        const isValidPrice = Number.isFinite(medianPrice) && medianPrice > 0;
        const isValidRent = Number.isFinite(medianRent) && medianRent > 0;

        // Calculate market score based on multiple factors with defensive checks
        let priceToRentRatio = 0;
        let capRate = 0;
        let marketScore = 0;

        if (isValidPrice && isValidRent) {
          // Both values are valid, safe to perform divisions
          priceToRentRatio = medianPrice / (medianRent * 12);
          capRate = (medianRent * 12 / medianPrice) * 100;

          // Only calculate marketScore if ratios are finite
          if (Number.isFinite(priceToRentRatio) && Number.isFinite(capRate)) {
            marketScore = Math.min(100, Math.max(0,
              100 - (priceToRentRatio * 5) + (capRate * 10)
            ));
          }
        }
        // If values are invalid, priceToRentRatio, capRate, and marketScore remain 0

        // Calculate trend from history data (saleData.history or rentalData.history)
        let trend: 'up' | 'down' | 'stable' = 'stable';
        
        // Try saleData.history first, then fall back to rentalData.history
        const history = data.saleData?.history ?? data.rentalData?.history;
        
        if (history && Array.isArray(history) && history.length >= 2) {
          const latestIndex = history.length - 1;
          const previousIndex = latestIndex - 1;
          
          // Extract values - handle different possible field names
          const latestValue = history[latestIndex]?.value ?? 
                            history[latestIndex]?.price ?? 
                            history[latestIndex]?.medianPrice ??
                            history[latestIndex];
          const previousValue = history[previousIndex]?.value ?? 
                               history[previousIndex]?.price ?? 
                               history[previousIndex]?.medianPrice ??
                               history[previousIndex];
          
          // Convert to numbers if they're not already
          const latest = typeof latestValue === 'number' ? latestValue : Number(latestValue);
          const previous = typeof previousValue === 'number' ? previousValue : Number(previousValue);
          
          // Calculate percent change if we have valid numbers
          if (Number.isFinite(latest) && Number.isFinite(previous) && previous !== 0) {
            const percentChange = ((latest - previous) / previous) * 100;
            
            // Set trend based on percent change (using a small threshold to avoid floating point issues)
            if (percentChange > 0.01) {
              trend = 'up';
            } else if (percentChange < -0.01) {
              trend = 'down';
            } else {
              trend = 'stable';
            }
          }
        }

        return {
          city,
          state,
          medianPrice: isValidPrice ? medianPrice : 0,
          medianRent: isValidRent ? medianRent : 0,
          averageCapRate: Number.isFinite(capRate) ? capRate : 0,
          marketScore: Math.round(marketScore),
          trend,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        console.warn(`[RentCast] API error ${response.status} for ${city}, ${state}`);
      }
    } catch (error) {
      console.error(`[RentCast] Error fetching data for ${city}, ${state}:`, error);
    }
  }

  // Fallback to simulated data if API is unavailable
  console.log(`[RentCast] Using fallback data for ${city}, ${state}`);
  const hash = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = 300000 + (hash % 300000);
  const baseRent = 1500 + (hash % 1500);

  return {
    city,
    state,
    medianPrice: basePrice,
    medianRent: baseRent,
    averageCapRate: ((baseRent * 12) / basePrice * 100),
    marketScore: 60 + (hash % 40),
    trend: hash % 3 === 0 ? 'up' : hash % 3 === 1 ? 'down' : 'stable',
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    // If specific city requested, return just that city
    if (city && state) {
      const stats = await getMarketStats(city, state);

      return NextResponse.json(
        { success: true, data: stats },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            'CDN-Cache-Control': 'public, s-maxage=3600',
            'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
          },
        }
      );
    }

    // Return all popular markets (fetch in parallel for speed)
    const allStats: MarketStats[] = await Promise.all(
      POPULAR_MARKETS.map(market =>
        getMarketStats(market.city, market.state)
      )
    );

    // Sort by market score descending
    allStats.sort((a, b) => b.marketScore - a.marketScore);

    return NextResponse.json(
      {
        success: true,
        data: allStats,
        metadata: {
          count: allStats.length,
          lastUpdated: new Date().toISOString(),
          cacheHint: 'Cached on Edge for 1 hour',
        }
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'CDN-Cache-Control': 'public, s-maxage=3600',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
        },
      }
    );
  } catch (error) {
    console.error('Edge market stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market stats' },
      { status: 500 }
    );
  }
}
