import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";
import { rentCastAPI } from "../../../../server/services/rentcast-api";
import { attomAPI } from "../../../../server/services/attom-api";
import type { ComparableSale } from "@shared/schema";

// Enable Edge Runtime for GET requests (ultra-fast, <100ms globally)
export const runtime = 'edge';

type CacheEntry = {
  expires: number;
  data: ComparableSale[];
};

const compCache = new Map<string, CacheEntry>();

function getCachedComparables(key: string): ComparableSale[] | null {
  const entry = compCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    compCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedComparables(key: string, data: ComparableSale[]) {
  compCache.set(key, {
    data,
    expires: Date.now() + 30 * 60 * 1000,
  });
}

function mapAttomComparable(raw: any): ComparableSale | null {
  const addressLine = raw?.address?.oneLine || raw?.address?.line1;
  const city = raw?.address?.locality;
  const state = raw?.address?.countrySubd;
  const zipCode = raw?.address?.postal1;
  const saleAmt = raw?.sale?.saleAmountData?.saleAmt || raw?.sale?.amount?.saleamt;
  const saleDate = raw?.sale?.saleAmountData?.saleRecDate || raw?.sale?.amount?.salerecdate;
  const bedrooms = raw?.building?.rooms?.beds;
  const bathrooms = raw?.building?.rooms?.bathstotal;
  const sqft = raw?.building?.size?.livingSize || raw?.building?.size?.bldgSize || raw?.building?.size?.universalsize;
  const yearBuilt = raw?.summary?.yearBuilt;
  const propertyType = raw?.summary?.propertyType || raw?.summary?.propClass || 'Unknown';
  const lotSize = raw?.lot?.lotSize2 || raw?.lot?.lotSize1;

  if (!addressLine || !city || !state || !zipCode || !saleAmt || !saleDate || !bedrooms || !bathrooms || !sqft || !yearBuilt) {
    return null;
  }

  const pricePerSqft = sqft > 0 ? saleAmt / sqft : 0;

  return {
    id: raw?.identifier?.attomId ? String(raw.identifier.attomId) : undefined,
    address: addressLine,
    city,
    state,
    zipCode,
    salePrice: saleAmt,
    saleDate: new Date(saleDate),
    bedrooms,
    bathrooms,
    squareFootage: sqft,
    lotSize: lotSize || undefined,
    yearBuilt,
    propertyType,
    pricePerSqft,
    distance: raw?.calculation?.distance || 0,
    createdAt: new Date(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const radius = searchParams.get('radius');
    const live = searchParams.get('live');
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }
    
    let sales;
    
    // Try to get live data first if requested
    if (live === 'true') {
      try {
        const cacheKey = `attom_comps_${address}_${radius || 1}`;
        const cached = getCachedComparables(cacheKey);
        if (cached) {
          sales = cached;
        } else if (attomAPI.isConfigured()) {
          const attomResponse = await attomAPI.getComparableSales(
            address as string,
            radius ? Number(radius) : 1
          );
          if (attomResponse && attomResponse.length > 0) {
            const mapped = attomResponse
              .map(mapAttomComparable)
              .filter((item): item is ComparableSale => Boolean(item));
            if (mapped.length > 0) {
              sales = mapped;
              setCachedComparables(cacheKey, mapped);
            }
          }
        }

        if (!sales || sales.length === 0) {
          sales = await rentCastAPI.getComparableSales(
            address as string,
            radius ? Number(radius) : 1
          );
        }

        if (!sales || sales.length === 0) {
          // Fall back to stored data if API returns no results
          sales = await storage.getComparableSales(
            address as string,
            radius ? Number(radius) : undefined
          );
        }
      } catch (apiError) {
        console.warn("RentCast API failed, falling back to stored data:", apiError);
        sales = await storage.getComparableSales(
          address as string,
          radius ? Number(radius) : undefined
        );
      }
    } else {
      // Use stored data by default
      sales = await storage.getComparableSales(
        address as string,
        radius ? Number(radius) : undefined
      );
    }
    
    return NextResponse.json(
      { success: true, data: sales },
      {
        headers: {
          // Cache for 1 hour on CDN, allow stale for 2 hours while revalidating
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'CDN-Cache-Control': 'public, s-maxage=3600',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching comparable sales:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comparable sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sale = await storage.createComparableSale(body);
    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    console.error("Error creating comparable sale:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comparable sale" },
      { status: 400 }
    );
  }
}

