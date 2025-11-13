import { NextRequest, NextResponse } from 'next/server';
import { openWeatherMapAPI } from '../../../../server/services/openweathermap-api';
import { blsAPI } from '../../../../server/services/bls-api';
import { fredAPI } from '../../../../server/services/fred-api';
import { geocodingService } from '../../../../server/services/geocoding-service';

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address?: string;
}

/**
 * GET /api/market/free-data
 *
 * Get comprehensive free market data from public APIs:
 * - OpenWeatherMap: Current weather
 * - BLS: Employment/unemployment data
 * - FRED: Economic indicators (mortgage rates, home price index)
 *
 * Query params:
 * - address: Full address (will be geocoded)
 * - lat: Latitude (optional, if address not provided)
 * - lon: Longitude (optional, if address not provided)
 * - countyFips: County FIPS code for employment data (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const countyFips = searchParams.get('countyFips');

    let lat: number | undefined;
    let lon: number | undefined;
    let geoData: GeocodeResult | null = null;

    // Step 1: Get coordinates
    if (address) {
      // Geocode the address
      geoData = await geocodingService.geocodeAddress(address);
      if (geoData) {
        lat = geoData.lat;
        lon = geoData.lng;
      }
    } else if (latParam && lonParam) {
      // Use provided coordinates - validate that parseFloat returns finite numbers
      const parsedLat = parseFloat(latParam);
      const parsedLon = parseFloat(lonParam);
      if (Number.isFinite(parsedLat) && Number.isFinite(parsedLon)) {
        lat = parsedLat;
        lon = parsedLon;
      }
    }

    if (typeof lat !== 'number' || !Number.isFinite(lat) || typeof lon !== 'number' || !Number.isFinite(lon)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to determine location. Provide either an address or lat/lon coordinates.',
        },
        { status: 400 }
      );
    }

    // Step 2: Fetch all data in parallel
    const [weatherData, economicData, employmentData] = await Promise.all([
      openWeatherMapAPI.getCurrentWeather({ lat, lon }),
      fredAPI.getAllIndicators(),
      countyFips ? blsAPI.getUnemploymentRate(countyFips) : Promise.resolve({}),
    ]);

    // Step 3: Return combined data
    return NextResponse.json({
      success: true,
      data: {
        location: {
          lat,
          lon,
          address: geoData?.formatted_address || address || `${lat},${lon}`,
        },
        weather: {
          temp: weatherData.temp,
          feelsLike: weatherData.feelsLike,
          humidity: weatherData.humidity,
          description: weatherData.description,
          icon: weatherData.icon,
          windSpeed: weatherData.windSpeed,
        },
        employment: countyFips
          ? {
              unemploymentRate: employmentData.unemploymentRate,
              employed: employmentData.employed,
              unemployed: employmentData.unemployed,
              laborForce: employmentData.laborForce,
              year: employmentData.year,
              period: employmentData.periodName,
            }
          : undefined,
        economy: {
          mortgageRate: {
            rate: economicData.mortgageRate?.rate,
            date: economicData.mortgageRate?.date,
          },
          homePriceIndex: {
            index: economicData.homePriceIndex?.index,
            date: economicData.homePriceIndex?.date,
            change1Year: economicData.homePriceIndex?.change1Year,
            change6Month: economicData.homePriceIndex?.change6Month,
          },
          housingStarts: {
            starts: economicData.housingStarts?.starts,
            date: economicData.housingStarts?.date,
            change1Year: economicData.housingStarts?.change1Year,
          },
          monthsSupply: {
            supply: economicData.monthsSupply?.supply,
            date: economicData.monthsSupply?.date,
          },
        },
      },
    });
  } catch (error) {
    console.error('Free market data API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch free market data',
      },
      { status: 500 }
    );
  }
}
