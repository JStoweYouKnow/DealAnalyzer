import { NextRequest, NextResponse } from "next/server";
import { storage } from "@dealanalyzer/storage";
import { rentCastAPI } from "../../../../server/services/rentcast-api";
import { censusAPI } from "../../../../server/services/census-api";
import { attomAPI } from "../../../../server/services/attom-api";

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
        const [rentCastData, censusData, attomProperties] = await Promise.all([
          city && state ? rentCastAPI.getNeighborhoodTrends(city, state).catch((err) => {
            console.log('[Market Trends] RentCast API failed:', err.message);
            return null;
          }) : null,
          zipCode ? censusAPI.getZipCodeData(zipCode).catch((err) => {
            console.log('[Market Trends] Census API failed:', err.message);
            return null;
          }) : null,
          zipCode ? attomAPI.getPropertiesByZipCode(zipCode, 100).catch((err) => {
            console.log('[Market Trends] Attom API failed:', err.message);
            return [];
          }) : [],
        ]);

        console.log(`[Market Trends] API Results - RentCast: ${rentCastData ? 'success' : 'none'}, Census: ${censusData ? 'success' : 'none'}, Attom: ${attomProperties.length} properties`);

        // Calculate market stats from Attom property data
        const attomMarketStats = attomProperties.length > 0
          ? attomAPI.calculateMarketStats(attomProperties)
          : null;

        console.log(`[Market Trends] Fetched ${attomProperties.length} properties from Attom API`);
        if (attomMarketStats) {
          console.log('[Market Trends] Calculated market stats:', attomMarketStats);
        } else if (attomProperties.length > 0) {
          console.warn('[Market Trends] Attom returned properties but market stats calculation failed');
        }

        // Merge data from different sources
        const enrichedTrends = [];

        // Use Attom data as primary source if available
        if (attomMarketStats) {
          const rentCastMatch = Array.isArray(rentCastData) && rentCastData.length > 0
            ? rentCastData.find((item: any) => {
                if (!zipCode) return false;
                const matchZip = item.zipCode ? String(item.zipCode).padStart(5, "0") : undefined;
                return matchZip === zipCode;
              }) || rentCastData[0]
            : null;

          enrichedTrends.push({
            zipCode,
            neighborhood: `${city || ''} ${state || ''}`.trim() || `Zip Code ${zipCode}`,
            averagePrice: rentCastMatch?.averagePrice ?? attomMarketStats.medianSalePrice,
            averageRent: rentCastMatch?.averageRent ?? censusData?.data.medianGrossRent,
            priceChangePercent1Year: rentCastMatch?.priceChangePercent1Year ?? undefined,
            priceChangePercent6Month: rentCastMatch?.priceChangePercent6Month ?? undefined,
            priceChangePercent3Month: rentCastMatch?.priceChangePercent3Month ?? undefined,
            rentChangePercent1Year: rentCastMatch?.rentChangePercent1Year ?? undefined,
            rentChangePercent6Month: rentCastMatch?.rentChangePercent6Month ?? undefined,
            rentChangePercent3Month: rentCastMatch?.rentChangePercent3Month ?? undefined,
            rentYield: rentCastMatch?.rentYield ?? undefined,
            daysOnMarket: rentCastMatch?.daysOnMarket ?? undefined,
            pricePerSqft: attomMarketStats.avgPricePerSqft ?? rentCastMatch?.pricePerSqft,
            totalListings: attomMarketStats.totalProperties,
            lastUpdated: new Date().toISOString(),
            // Market statistics from Attom property data
            marketStats: {
              totalProperties: attomMarketStats.totalProperties,
              medianSalePrice: attomMarketStats.medianSalePrice,
              avgPricePerSqft: attomMarketStats.avgPricePerSqft,
              medianBuildingSize: attomMarketStats.medianBuildingSize,
              avgYearBuilt: attomMarketStats.avgYearBuilt,
              propertyTypes: attomMarketStats.propertyTypes,
              ownerOccupancyRate: attomMarketStats.ownerOccupancyRate,
            },
            // Sample properties (top 10)
            sampleProperties: attomProperties.slice(0, 10).map(p => ({
              address: p.address,
              propertyType: p.propertyType,
              yearBuilt: p.yearBuilt,
              beds: p.beds,
              baths: p.baths,
              buildingSize: p.buildingSize,
              lotSize: p.lotSize,
              lastSalePrice: p.lastSalePrice,
              lastSaleDate: p.lastSaleDate,
              assessedValue: p.assessedValue,
              ownerOccupied: p.ownerOccupied,
            })),
            // Census demographics if available
            demographics: censusData ? {
              population: censusData.data.population,
              medianIncome: censusData.data.medianHouseholdIncome,
              medianAge: censusData.data.medianAge,
              medianHomeValue: censusData.data.medianHomeValue,
              perCapitaIncome: censusData.data.perCapitaIncome,
              medianGrossRent: censusData.data.medianGrossRent,
              totalHousingUnits: censusData.data.totalHousingUnits,
              ownerOccupied: censusData.data.ownerOccupied,
              renterOccupied: censusData.data.renterOccupied,
              unemploymentRate: censusData.data.unemploymentRate,
              educationLevel: censusData.data.educationLevel,
            } : undefined,
          });
        }
        // If we have Attom properties but market stats failed, create basic trend from properties
        else if (attomProperties.length > 0 && !attomMarketStats) {
          console.log('[Market Trends] Creating basic trend from Attom properties without stats');
          // Calculate basic stats manually
          const prices: number[] = attomProperties
            .map(p => p.lastSalePrice)
            .filter((p): p is number => typeof p === 'number' && p > 0);
          const medianPrice = prices.length > 0
            ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)]!
            : undefined;
          
          enrichedTrends.push({
            zipCode,
            neighborhood: `${city || ''} ${state || ''}`.trim() || `Zip Code ${zipCode}`,
            averagePrice: medianPrice,
            totalListings: attomProperties.length,
            lastUpdated: new Date().toISOString(),
            sampleProperties: attomProperties.slice(0, 10).map(p => ({
              address: p.address,
              propertyType: p.propertyType,
              yearBuilt: p.yearBuilt,
              beds: p.beds,
              baths: p.baths,
              buildingSize: p.buildingSize,
              lotSize: p.lotSize,
              lastSalePrice: p.lastSalePrice,
              lastSaleDate: p.lastSaleDate,
              assessedValue: p.assessedValue,
              ownerOccupied: p.ownerOccupied,
            })),
            demographics: censusData ? {
              population: censusData.data.population,
              medianIncome: censusData.data.medianHouseholdIncome,
              medianAge: censusData.data.medianAge,
              medianHomeValue: censusData.data.medianHomeValue,
              perCapitaIncome: censusData.data.perCapitaIncome,
              medianGrossRent: censusData.data.medianGrossRent,
              totalHousingUnits: censusData.data.totalHousingUnits,
              ownerOccupied: censusData.data.ownerOccupied,
              renterOccupied: censusData.data.renterOccupied,
              unemploymentRate: censusData.data.unemploymentRate,
              educationLevel: censusData.data.educationLevel,
            } : undefined,
          });
        }
        // Fall back to RentCast + Census if no Attom data
        else if (rentCastData && rentCastData.length > 0) {
          enrichedTrends.push(...rentCastData.map((trend: any) => ({
            ...trend,
            zipCode: zipCode || trend.zipCode,
            // Add census demographics if available
            demographics: censusData ? {
              population: censusData.data.population,
              medianIncome: censusData.data.medianHouseholdIncome,
              medianAge: censusData.data.medianAge,
              medianHomeValue: censusData.data.medianHomeValue,
              perCapitaIncome: censusData.data.perCapitaIncome,
              medianGrossRent: censusData.data.medianGrossRent,
              totalHousingUnits: censusData.data.totalHousingUnits,
              ownerOccupied: censusData.data.ownerOccupied,
              renterOccupied: censusData.data.renterOccupied,
              unemploymentRate: censusData.data.unemploymentRate,
              educationLevel: censusData.data.educationLevel,
            } : undefined,
          })));
        }
        // Fall back to Census only if no other data
        else if (censusData) {
          enrichedTrends.push({
            zipCode,
            neighborhood: `${city || ''} ${state || ''}`.trim() || `Zip Code ${zipCode}`,
            // Map Census data to market fields for UI display
            averagePrice: censusData.data.medianHomeValue,
            averageRent: censusData.data.medianGrossRent,
            demographics: {
              population: censusData.data.population,
              medianIncome: censusData.data.medianHouseholdIncome,
              medianAge: censusData.data.medianAge,
              medianHomeValue: censusData.data.medianHomeValue,
              perCapitaIncome: censusData.data.perCapitaIncome,
              medianGrossRent: censusData.data.medianGrossRent,
              totalHousingUnits: censusData.data.totalHousingUnits,
              ownerOccupied: censusData.data.ownerOccupied,
              renterOccupied: censusData.data.renterOccupied,
              unemploymentRate: censusData.data.unemploymentRate,
              educationLevel: censusData.data.educationLevel,
            },
          });
        }

        // Fall back to stored data if all APIs fail
        if (enrichedTrends.length === 0) {
          console.log("[Market Trends] No enriched trends from live APIs, trying stored data");
          // If we have zipCode but no city/state, stored data won't help, so return empty
          // Otherwise try to get stored data
          if (city || state) {
            trends = await storage.getNeighborhoodTrends(city || undefined, state || undefined);
          } else {
            console.log("[Market Trends] No city/state provided, cannot query stored data by zipCode");
            trends = [];
          }
        } else {
          trends = enrichedTrends;
        }
      } catch (apiError) {
        console.warn("Live API failed, falling back to stored data:", apiError);
        // If we have zipCode but no city/state, stored data won't help
        if (city || state) {
          trends = await storage.getNeighborhoodTrends(city || undefined, state || undefined);
        } else {
          console.log("[Market Trends] No city/state for fallback, returning empty");
          trends = [];
        }
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

