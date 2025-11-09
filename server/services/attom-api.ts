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
   * Get sales trends for a zip code
   */
  async getSalesTrends(zipCode: string): Promise<AttomSalesTrendResponse['trends'] | null> {
    const response = await this.makeRequest<AttomSalesTrendResponse>('/salestrend', {
      postalcode: zipCode,
    });
    return response?.trends || null;
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
