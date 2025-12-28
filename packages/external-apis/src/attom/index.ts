/**
 * Attom Data API Service
 *
 * Provides property data, sales history, valuations, and market trends
 * Free Tier: 1,000 requests/month
 *
 * API Documentation: https://api.developer.attomdata.com/docs
 */

import NodeCache from 'node-cache';

// Cache responses for 24 hours to save API quota
const cache = new NodeCache({ stdTTL: 86400 });

const ATTOM_API_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

interface AttomPropertyDetail {
  address?: {
    line1?: string;
    line2?: string;
    locality?: string;
    countrySubd?: string;
    postal1?: string;
  };
  lot?: {
    lotsize1?: number;
    lotsize2?: number;
  };
  area?: {
    blockNum?: string;
    lotNum?: string;
  };
  summary?: {
    propclass?: string;
    propsubtype?: string;
    proptype?: string;
    yearbuilt?: number;
    propLandUse?: string;
    depth?: number;
    frontage?: number;
  };
  building?: {
    size?: {
      bldgsize?: number;
      universalsize?: number;
    };
    rooms?: {
      beds?: number;
      bathstotal?: number;
      bathsfull?: number;
      bathshalf?: number;
    };
    construction?: {
      foundationtype?: string;
      roofcover?: string;
    };
  };
  utilities?: {
    heatingtype?: string;
    coolingtype?: string;
  };
}

interface AttomSale {
  amount?: {
    saleamt?: number;
    salerecdate?: string;
  };
  calculation?: {
    priceperbed?: number;
    priceperbath?: number;
    pricepersize?: number;
  };
}

interface AttomAVMResponse {
  property?: Array<{
    address?: {
      line1?: string;
      line2?: string;
    };
    vintage?: {
      lastModified?: string;
      pubDate?: string;
    };
    avm?: {
      amount?: {
        value?: number;
      };
      eventDate?: string;
      ratio?: {
        high?: number;
        low?: number;
      };
    };
  }>;
}

interface AttomSalesTrendResponse {
  trends?: Array<{
    zipcode?: string;
    month?: string;
    medianPrice?: number;
    medianPriceChange?: number;
    averageDaysOnMarket?: number;
    salesVolume?: number;
  }>;
}

interface AttomBasicProfileResponse {
  status?: {
    code: number;
    msg: string;
    total: number;
    page: number;
    pagesize: number;
  };
  property?: Array<{
    identifier?: {
      Id?: number;
      attomId?: number;
      apn?: string;
      fips?: string;
    };
    address?: {
      country?: string;
      countrySubd?: string;
      line1?: string;
      line2?: string;
      locality?: string;
      postal1?: string;
      oneLine?: string;
    };
    location?: {
      latitude?: string;
      longitude?: string;
      accuracy?: string;
    };
    lot?: {
      lotSize1?: number;
      lotSize2?: number;
      depth?: number;
      frontage?: number;
      zoningType?: string;
    };
    area?: {
      countrySecSubd?: string;
      subdName?: string;
    };
    summary?: {
      propClass?: string;
      propSubType?: string;
      propType?: string;
      yearBuilt?: number;
      propLandUse?: string;
      absenteeInd?: string;
      propertyType?: string;
    };
    building?: {
      size?: {
        bldgSize?: number;
        livingSize?: number;
        grossSize?: number;
      };
      rooms?: {
        beds?: number;
        bathstotal?: number;
        bathsfull?: number;
        bathshalf?: number;
      };
      construction?: {
        condition?: string;
        foundationtype?: string;
      };
      parking?: {
        prkgSize?: number;
        prkgType?: string;
      };
      interior?: {
        fplcCount?: number;
        storyDesc?: string;
      };
    };
    utilities?: {
      heatingType?: string;
      coolingtype?: string;
    };
    sale?: {
      saleSearchDate?: string;
      saleTransDate?: string;
      saleAmountData?: {
        saleAmt?: number;
        saleRecDate?: string;
        saleTransType?: string;
        saleDocNum?: string;
      };
    };
    assessment?: {
      assessed?: {
        assdTtlValue?: number;
        assdLandValue?: number;
        assdImpValue?: number;
      };
      market?: {
        mktTtlValue?: number;
        mktLandValue?: number;
        mktImpValue?: number;
      };
      tax?: {
        taxAmt?: number;
        taxYear?: number;
      };
    };
  }>;
}

interface ProcessedProperty {
  attomId: number;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
  propertyType?: string;
  yearBuilt?: number;
  lotSize?: number;
  buildingSize?: number;
  beds?: number;
  baths?: number;
  lastSaleDate?: string;
  lastSalePrice?: number;
  assessedValue?: number;
  taxAmount?: number;
  ownerOccupied?: boolean;
}

export class AttomAPIService {
  private apiKey: string;

  constructor() {
    if (!process.env.ATTOM_API_KEY) {
      console.warn('ATTOM_API_KEY not configured. Attom API features will not be available.');
      this.apiKey = '';
    } else {
      this.apiKey = process.env.ATTOM_API_KEY;
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    if (!this.apiKey) {
      console.warn('Attom API key not configured');
      return null;
    }

    // Create cache key from endpoint and params
    const cacheKey = `attom_${endpoint}_${JSON.stringify(params)}`;
    const cached = cache.get<T>(cacheKey);
    if (cached) {
      console.log(`[Attom API] Cache hit for ${endpoint}`);
      return cached;
    }

    const url = new URL(`${ATTOM_API_BASE}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      console.log(`[Attom API] Fetching ${endpoint}`);
      const response = await fetch(url.toString(), {
        headers: {
          'apikey': this.apiKey,
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Attom API] Error ${response.status}: ${errorText}`);
        return null;
      }

      const data = await response.json() as T;

      // Cache the response
      cache.set(cacheKey, data);
      console.log(`[Attom API] Success for ${endpoint}`);

      return data;
    } catch (error) {
      console.error('[Attom API] Request failed:', error);
      return null;
    }
  }

  /**
   * Get detailed property information
   */
  async getPropertyDetail(address: string): Promise<AttomPropertyDetail | null> {
    const response = await this.makeRequest<{ property: AttomPropertyDetail[] }>('/property/detail', {
      address: address,
    });
    return response?.property?.[0] || null;
  }

  /**
   * Get property sales history
   */
  async getPropertySalesHistory(address: string): Promise<AttomSale[] | null> {
    const response = await this.makeRequest<{ property: Array<{ sale: AttomSale[] }> }>('/property/sale', {
      address: address,
    });
    return response?.property?.[0]?.sale || null;
  }

  /**
   * Get automated valuation model (AVM) estimate
   */
  async getPropertyValuation(address: string): Promise<number | null> {
    const response = await this.makeRequest<AttomAVMResponse>('/avm', {
      address: address,
    });
    return response?.property?.[0]?.avm?.amount?.value || null;
  }

  /**
   * Get geographic ID for a zip code (required for sales trends)
   */
  async getGeoId(zipCode: string): Promise<string | null> {
    const response = await this.makeRequest<any>('/area/full', {
      postalcode: zipCode,
    });

    // Try to extract GeoIDV4 from the response
    const geoId = response?.area?.[0]?.geoIdV4?.ZI ||
                  response?.area?.[0]?.geoIdV4 ||
                  response?.area?.[0]?.geoid;

    return geoId || null;
  }

  /**
   * Get basic property profiles for a zip code
   */
  async getPropertiesByZipCode(zipCode: string, pageSize: number = 100): Promise<ProcessedProperty[]> {
    const response = await this.makeRequest<AttomBasicProfileResponse>('/property/basicprofile', {
      postalcode: zipCode,
      pagesize: pageSize.toString(),
    });

    if (!response?.property || response.property.length === 0) {
      return [];
    }

    return response.property.map(prop => this.processProperty(prop));
  }

  /**
   * Process raw property data into a cleaner format
   */
  private processProperty(prop: NonNullable<AttomBasicProfileResponse['property']>[0]): ProcessedProperty {
    return {
      attomId: prop.identifier?.attomId || prop.identifier?.Id || 0,
      address: prop.address?.oneLine || prop.address?.line1 || 'Unknown',
      city: prop.address?.locality,
      state: prop.address?.countrySubd,
      zipCode: prop.address?.postal1,
      latitude: prop.location?.latitude,
      longitude: prop.location?.longitude,
      propertyType: prop.summary?.propertyType || prop.summary?.propClass,
      yearBuilt: prop.summary?.yearBuilt,
      lotSize: prop.lot?.lotSize2 || prop.lot?.lotSize1,
      buildingSize: prop.building?.size?.livingSize || prop.building?.size?.bldgSize,
      beds: prop.building?.rooms?.beds,
      baths: prop.building?.rooms?.bathstotal,
      lastSaleDate: prop.sale?.saleAmountData?.saleRecDate || prop.sale?.saleTransDate,
      lastSalePrice: prop.sale?.saleAmountData?.saleAmt,
      assessedValue: prop.assessment?.assessed?.assdTtlValue || prop.assessment?.market?.mktTtlValue,
      taxAmount: prop.assessment?.tax?.taxAmt,
      ownerOccupied: prop.summary?.absenteeInd === 'OWNER OCCUPIED',
    };
  }

  /**
   * Calculate market statistics from property data
   */
  calculateMarketStats(properties: ProcessedProperty[]) {
    if (properties.length === 0) {
      return null;
    }

    // Filter properties with valid data
    const propertiesWithSales = properties.filter(p => p.lastSalePrice && p.lastSalePrice > 0);
    const propertiesWithSize = properties.filter(p => p.buildingSize && p.buildingSize > 0);
    const propertiesWithSalesAndSize = properties.filter(
      p => p.lastSalePrice && p.lastSalePrice > 0 && p.buildingSize && p.buildingSize > 0
    );

    // Calculate median sale price
    const salePrices = propertiesWithSales.map(p => p.lastSalePrice!).sort((a, b) => a - b);
    const medianSalePrice = salePrices.length > 0
      ? salePrices[Math.floor(salePrices.length / 2)]
      : undefined;

    // Calculate average price per sqft
    const pricesPerSqft = propertiesWithSalesAndSize.map(p => p.lastSalePrice! / p.buildingSize!);
    const avgPricePerSqft = pricesPerSqft.length > 0
      ? pricesPerSqft.reduce((a, b) => a + b, 0) / pricesPerSqft.length
      : undefined;

    // Calculate median building size
    const buildingSizes = propertiesWithSize.map(p => p.buildingSize!).sort((a, b) => a - b);
    const medianBuildingSize = buildingSizes.length > 0
      ? buildingSizes[Math.floor(buildingSizes.length / 2)]
      : undefined;

    // Calculate average year built
    const yearsBuilt = properties.filter(p => p.yearBuilt).map(p => p.yearBuilt!);
    const avgYearBuilt = yearsBuilt.length > 0
      ? Math.round(yearsBuilt.reduce((a, b) => a + b, 0) / yearsBuilt.length)
      : undefined;

    // Property type distribution
    const propertyTypes: Record<string, number> = {};
    properties.forEach(p => {
      if (p.propertyType) {
        propertyTypes[p.propertyType] = (propertyTypes[p.propertyType] || 0) + 1;
      }
    });

    // Owner occupancy rate
    const ownerOccupiedCount = properties.filter(p => p.ownerOccupied).length;
    const ownerOccupancyRate = properties.length > 0
      ? (ownerOccupiedCount / properties.length) * 100
      : undefined;

    return {
      totalProperties: properties.length,
      medianSalePrice,
      avgPricePerSqft,
      medianBuildingSize,
      avgYearBuilt,
      propertyTypes,
      ownerOccupancyRate,
      propertiesWithSaleData: propertiesWithSales.length,
    };
  }

  /**
   * Get sales trends for a zip code
   * Note: Sales trends endpoint may not be available in free tier
   * Returns null gracefully if not available
   */
  async getSalesTrends(zipCode: string): Promise<AttomSalesTrendResponse['trends'] | null> {
    console.log(`[Attom API] Sales trends endpoint not available in free tier for zip ${zipCode}`);
    return null;

    // The sales trend endpoint requires a paid tier or specific API access
    // Keeping this code commented for future reference if upgraded to paid tier:
    /*
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const startMonth = currentMonth > 6 ? currentMonth - 6 : 1;
    const startYear = currentMonth > 6 ? currentYear : currentYear - 1;

    const response = await this.makeRequest<any>('/transaction/salestrend', {
      postalcode: zipCode,
      interval: 'monthly',
      startyear: startYear.toString(),
      startmonth: startMonth.toString(),
      endyear: currentYear.toString(),
      endmonth: currentMonth.toString(),
    });

    return response?.trends || null;
    */
  }

  /**
   * Get comparable sales within radius
   */
  async getComparableSales(address: string, radius: number = 2): Promise<any[] | null> {
    // Note: Attom has a specialized endpoint for this, adjust based on their API docs
    const response = await this.makeRequest<any>('/property/sale', {
      address: address,
      radius: radius.toString(),
    });
    return response?.property || null;
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const attomAPI = new AttomAPIService();
