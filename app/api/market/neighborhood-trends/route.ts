import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";
import { rentCastAPI } from "../../../../server/services/rentcast-api";
import { attomAPI } from "../../../../server/services/attom-api";
import { censusAPI } from "../../../../server/services/census-api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const zipCode = searchParams.get('zipCode');
    const live = searchParams.get('live');

    let trends;

    // Try to get live data first if requested
    if (live === 'true') {
      try {
        // Combine data from multiple sources for richer insights
        const [rentCastData, censusData, attomData] = await Promise.all([
          city && state ? rentCastAPI.getNeighborhoodTrends(city, state).catch(() => null) : null,
          zipCode ? censusAPI.getZipCodeData(zipCode).catch(() => null) : null,
          zipCode ? attomAPI.getSalesTrends(zipCode).catch(() => null) : null,
        ]);

        // Merge data from different sources
        const enrichedTrends = [];

        if (attomData && attomData.length > 0) {
          // Use Attom data as primary source for market trends
          enrichedTrends.push(...attomData.map((trend: any) => ({
            zipCode: trend.zipcode || zipCode,
            neighborhood: `${city || ''} ${state || ''}`.trim() || undefined,
            month: trend.month,
            medianPrice: trend.medianPrice,
            priceChange: trend.medianPriceChange,
            averageDaysOnMarket: trend.averageDaysOnMarket,
            salesVolume: trend.salesVolume,
            // Add census demographics if available
            demographics: censusData ? {
              population: censusData.data.population,
              medianIncome: censusData.data.medianHouseholdIncome,
              medianAge: censusData.data.medianAge,
              medianHomeValue: censusData.data.medianHomeValue,
            } : undefined,
          })));
        }

        // Fall back to RentCast if Attom didn't return data
        if (enrichedTrends.length === 0 && rentCastData) {
          enrichedTrends.push(...rentCastData);
        }

        // Fall back to stored data if all APIs fail
        if (enrichedTrends.length === 0) {
          trends = await storage.getNeighborhoodTrends(city || undefined, state || undefined);
        } else {
          trends = enrichedTrends;
        }
      } catch (apiError) {
        console.warn("Live API failed, falling back to stored data:", apiError);
        trends = await storage.getNeighborhoodTrends(city || undefined, state || undefined);
      }
    } else {
      // Use stored data by default
      trends = await storage.getNeighborhoodTrends(
        city as string | undefined,
        state as string | undefined
      );
    }

    return NextResponse.json({ success: true, data: trends });
  } catch (error) {
    console.error("Error fetching neighborhood trends:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch neighborhood trends" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trend = await storage.createNeighborhoodTrend(body);
    return NextResponse.json({ success: true, data: trend });
  } catch (error) {
    console.error("Error creating neighborhood trend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create neighborhood trend" },
      { status: 400 }
    );
  }
}

