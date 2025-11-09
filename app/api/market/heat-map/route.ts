import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";
import { rentCastAPI } from "../../../../server/services/rentcast-api";
import { censusAPI } from "../../../../server/services/census-api";
import { attomAPI } from "../../../../server/services/attom-api";
import { fhfaAPI } from "../../../../server/services/fhfa-api";
import NodeCache from "node-cache";

const defaultZipCodes = ['90210', '78701', '33139', '10001', '94110', '37203', '85001', '30309', '80202', '02101'];
const heatCache = new NodeCache({ stdTTL: 60 * 60 });

type HeatLevel = 'very_hot' | 'hot' | 'warm' | 'balanced' | 'cool';

interface HeatEntry {
  id: string;
  zipCode: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  averagePrice: number;
  priceChangePercent: number;
  averageRent: number;
  rentChangePercent: number;
  dealVolume: number;
  investmentScore: number;
  heatLevel: HeatLevel;
  lastUpdated: string;
  marketStats?: any;
  sampleProperties?: any[];
  demographics?: any;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function determineHeatLevel(score: number): HeatLevel {
  if (score >= 80) return 'very_hot';
  if (score >= 65) return 'hot';
  if (score >= 50) return 'warm';
  if (score >= 35) return 'balanced';
  return 'cool';
}

function computeInvestmentScore(metrics: {
  hpiChange?: number;
  medianIncome?: number;
  unemploymentRate?: number;
  ownerOccupancyRate?: number;
  medianSalePrice?: number;
  medianGrossRent?: number;
}): number {
  let score = 55;

  if (typeof metrics.hpiChange === 'number') {
    const bounded = clamp(metrics.hpiChange, -10, 15);
    score += bounded * 1.5;
  }

  if (typeof metrics.medianIncome === 'number') {
    const normalized = clamp(metrics.medianIncome / 1500, -10, 25);
    score += normalized;
  }

  if (typeof metrics.unemploymentRate === 'number') {
    const penalty = clamp(metrics.unemploymentRate - 4.5, -5, 15);
    score -= penalty * 1.5;
  }

  if (typeof metrics.ownerOccupancyRate === 'number') {
    const norm = clamp((metrics.ownerOccupancyRate - 50) / 2, -10, 15);
    score += norm;
  }

  if (typeof metrics.medianSalePrice === 'number') {
    const norm = clamp(Math.log10(metrics.medianSalePrice) * 10 - 30, -10, 15);
    score += norm;
  }

  if (typeof metrics.medianGrossRent === 'number') {
    const norm = clamp((metrics.medianGrossRent - 800) / 30, -10, 10);
    score += norm;
  }

  return clamp(score, 0, 100);
}

function normalizeEducationLevels(
  education: { bachelorsOrHigher?: number; graduateDegree?: number } | undefined,
  population?: number
) {
  if (!education) return undefined;
  const total = population && population > 0 ? population : undefined;
  if (!total) {
    return education;
  }

  const result: Record<string, number> = {};
  if (education.bachelorsOrHigher !== undefined) {
    result["Bachelor's +"] = education.bachelorsOrHigher / total;
  }
  if (education.graduateDegree !== undefined) {
    result["Graduate"] = education.graduateDegree / total;
  }
  return result;
}

async function buildHeatEntry(zip: string): Promise<HeatEntry | null> {
  const cacheKey = `heat_${zip}`;
  const cached = heatCache.get<HeatEntry>(cacheKey);
  if (cached) {
    return cached;
  }

  const [attomProperties, censusData] = await Promise.all([
    attomAPI.isConfigured() ? attomAPI.getPropertiesByZipCode(zip, 150).catch(() => []) : [],
    censusAPI.getZipCodeData(zip).catch(() => null),
  ]);

  if (attomProperties.length === 0 && !censusData) {
    return null;
  }

  const firstProperty = attomProperties[0];
  const state = firstProperty?.state || '';
  const city = firstProperty?.city || '';

  const coordinates = attomProperties
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      lat: parseFloat(p.latitude!),
      lon: parseFloat(p.longitude!),
    }));

  const avgLat = coordinates.length
    ? coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length
    : 0;
  const avgLon = coordinates.length
    ? coordinates.reduce((sum, c) => sum + c.lon, 0) / coordinates.length
    : 0;

  const marketStats = attomProperties.length ? attomAPI.calculateMarketStats(attomProperties) : null;
  const fhfaMetrics = state && fhfaAPI.isConfigured() ? await fhfaAPI.getStateHpi(state).catch(() => null) : null;

  const demographics = censusData
    ? {
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
        educationLevel: normalizeEducationLevels(
          censusData.data.educationLevel,
          censusData.data.population
        ),
      }
    : undefined;

  const investmentScore = computeInvestmentScore({
    hpiChange: fhfaMetrics?.change1YearPercent,
    medianIncome: demographics?.medianIncome,
    unemploymentRate: demographics?.unemploymentRate,
    ownerOccupancyRate: marketStats?.ownerOccupancyRate,
    medianSalePrice: marketStats?.medianSalePrice,
    medianGrossRent: demographics?.medianGrossRent,
  });

  const entry: HeatEntry = {
    id: zip,
    zipCode: zip,
    city: city || demographics?.population ? zip : 'Unknown',
    state: state || 'NA',
    latitude: Number.isFinite(avgLat) ? avgLat : 0,
    longitude: Number.isFinite(avgLon) ? avgLon : 0,
    averagePrice: marketStats?.medianSalePrice ?? 0,
    priceChangePercent: fhfaMetrics?.change1YearPercent ?? 0,
    averageRent: demographics?.medianGrossRent ?? 0,
    rentChangePercent: 0,
    dealVolume: marketStats?.totalProperties ?? attomProperties.length ?? 0,
    investmentScore: Math.round(investmentScore),
    heatLevel: determineHeatLevel(investmentScore),
    lastUpdated: new Date().toISOString(),
    marketStats: marketStats ?? undefined,
    sampleProperties: attomProperties.slice(0, 12),
    demographics,
  };

  heatCache.set(cacheKey, entry);
  return entry;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const north = searchParams.get('north');
    const south = searchParams.get('south');
    const east = searchParams.get('east');
    const west = searchParams.get('west');
    const live = searchParams.get('live');
    const zipParam = searchParams.get('zip');

    const bounds = north && south && east && west ? {
      north: Number(north),
      south: Number(south),
      east: Number(east),
      west: Number(west),
    } : undefined;

    let heatMapData;

    if (live === 'true') {
      try {
        const zips = zipParam
          ? zipParam.split(',').map((z) => z.trim()).filter(Boolean)
          : defaultZipCodes;

        const liveEntries = await Promise.all(zips.map((zip) => buildHeatEntry(zip)));
        heatMapData = liveEntries.filter((entry): entry is HeatEntry => Boolean(entry));

        if (heatMapData.length === 0) {
          heatMapData = await storage.getMarketHeatMapData(bounds);
        }
      } catch (apiError) {
        console.warn("Live market heat aggregation failed, falling back to stored data:", apiError);
        heatMapData = await storage.getMarketHeatMapData(bounds);
      }
    } else {
      heatMapData = await storage.getMarketHeatMapData(bounds);
    }

    return NextResponse.json({ success: true, data: heatMapData });
  } catch (error) {
    console.error("Error fetching heat map data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch heat map data" },
      { status: 500 }
    );
  }
}

