import type { NeighborhoodTrend, ComparableSale, MarketHeatMapData } from '@shared/schema.ts';

interface RentCastPropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  yearBuilt: number;
  lastSaleDate: string;
  lastSalePrice: number;
  rentEstimate: number;
  valueEstimate: number;
}

interface RentCastMarketStats {
  zipCode: string;
  city: string;
  state: string;
  averageRent: number;
  averageValue: number;
  priceChangePercent: number;
  rentChangePercent: number;
  daysOnMarket: number;
  totalListings: number;
}

export class RentCastAPIService {
  private baseUrl = 'https://api.rentcast.io/v1';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RENTCAST_API_KEY || '';
    if (!this.apiKey) {
      console.warn('RentCast API key not found. Using fallback data.');
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('RentCast API key not configured');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`RentCast API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('RentCast API request failed:', error);
      throw error;
    }
  }

  async getNeighborhoodTrends(city: string, state: string, limit: number = 10): Promise<NeighborhoodTrend[]> {
    try {
      // Get market statistics for the area
      const marketData = await this.makeRequest('/markets/stats', {
        city,
        state,
        propertyType: 'Single Family',
        limit
      });

      if (!marketData || !Array.isArray(marketData)) {
        console.warn('No market data returned from RentCast');
        return [];
      }

      return marketData.map((area: any) => ({
        id: `rentcast-${area.zipCode || Math.random().toString(36).substr(2, 9)}`,
        neighborhood: area.neighborhood || `${area.city} Area`,
        city: area.city || city,
        state: area.state || state,
        zipCode: area.zipCode,
        averagePrice: area.averageValue || 0,
        priceChangePercent3Month: area.priceChange3Month || 0,
        priceChangePercent6Month: area.priceChange6Month || 0,
        priceChangePercent1Year: area.priceChangePercent || 0,
        averageRent: area.averageRent || 0,
        rentChangePercent3Month: area.rentChange3Month || 0,
        rentChangePercent6Month: area.rentChange6Month || 0,
        rentChangePercent1Year: area.rentChangePercent || 0,
        daysOnMarket: area.daysOnMarket || 30,
        pricePerSqft: area.pricePerSqft || 0,
        rentYield: area.averageRent && area.averageValue ? (area.averageRent * 12) / area.averageValue : 0,
        marketHeat: this.calculateMarketHeat(area.priceChangePercent || 0, area.daysOnMarket || 30),
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Failed to fetch neighborhood trends from RentCast:', error);
      return [];
    }
  }

  async getComparableSales(address: string, radius: number = 1, limit: number = 10): Promise<ComparableSale[]> {
    try {
      // Get comparable properties near the given address
      const comps = await this.makeRequest('/properties/comps', {
        address,
        radius: `${radius}mi`,
        limit,
        propertyType: 'Single Family'
      });

      if (!comps || !Array.isArray(comps)) {
        console.warn('No comparable sales returned from RentCast');
        return [];
      }

      return comps.map((comp: any) => ({
        id: `rentcast-comp-${comp.id || Math.random().toString(36).substr(2, 9)}`,
        address: comp.address || 'Address not available',
        city: comp.city || '',
        state: comp.state || '',
        zipCode: comp.zipCode || '',
        salePrice: comp.lastSalePrice || 0,
        pricePerSqft: comp.squareFootage ? Math.round(comp.lastSalePrice / comp.squareFootage) : 0,
        bedrooms: comp.bedrooms || 0,
        bathrooms: comp.bathrooms || 0,
        squareFootage: comp.squareFootage || 0,
        yearBuilt: comp.yearBuilt || 0,
        propertyType: this.normalizePropertyType(comp.propertyType),
        saleDate: comp.lastSaleDate ? new Date(comp.lastSaleDate) : new Date(),
        distance: comp.distance || 0,
        createdAt: new Date()
      }));
    } catch (error) {
      console.error('Failed to fetch comparable sales from RentCast:', error);
      return [];
    }
  }

  async getMarketHeatMapData(zipCodes: string[]): Promise<MarketHeatMapData[]> {
    try {
      const heatMapData: MarketHeatMapData[] = [];

      // Process zip codes in batches to avoid rate limiting
      for (const zipCode of zipCodes.slice(0, 20)) { // Limit to 20 to stay within free tier
        try {
          const marketStats = await this.makeRequest('/markets/stats', {
            zipCode,
            propertyType: 'Single Family'
          });

          if (marketStats && marketStats.length > 0) {
            const stats = marketStats[0];
            const coords = await this.getZipCodeCoordinates(zipCode);
            
            heatMapData.push({
              id: `rentcast-heat-${zipCode}`,
              zipCode,
              city: stats.city || '',
              state: stats.state || '',
              latitude: coords.latitude,
              longitude: coords.longitude,
              averagePrice: stats.averageValue || 0,
              priceChangePercent: stats.priceChangePercent || 0,
              averageRent: stats.averageRent || 0,
              rentChangePercent: stats.rentChangePercent || 0,
              dealVolume: stats.totalListings || 0,
              investmentScore: this.calculateInvestmentScore(stats),
              heatLevel: this.mapToHeatMapLevel(this.calculateMarketHeat(stats.priceChangePercent || 0, stats.daysOnMarket || 30)),
              lastUpdated: new Date()
            });
          }
        } catch (zipError) {
          console.warn(`Failed to fetch data for zip code ${zipCode}:`, zipError);
          continue;
        }
      }

      return heatMapData;
    } catch (error) {
      console.error('Failed to fetch market heat map data from RentCast:', error);
      return [];
    }
  }

  private async getZipCodeCoordinates(zipCode: string): Promise<{ latitude: number; longitude: number }> {
    // Fallback coordinates for major US zip codes - in a real implementation you'd use a geocoding service
    const fallbackCoords: Record<string, { latitude: number; longitude: number }> = {
      '90210': { latitude: 34.0901, longitude: -118.4065 },
      '78701': { latitude: 30.2672, longitude: -97.7431 },
      '33139': { latitude: 25.7617, longitude: -80.1918 },
      '10001': { latitude: 40.7589, longitude: -73.9851 },
      '94110': { latitude: 37.7478, longitude: -122.4148 }
    };
    
    return fallbackCoords[zipCode] || { latitude: 39.8283, longitude: -98.5795 }; // US center
  }

  private calculateMarketHeat(priceChangePercent: number, daysOnMarket: number): 'hot' | 'warm' | 'balanced' | 'cool' | 'cold' {
    const score = (priceChangePercent * 2) - (daysOnMarket / 10);
    
    if (score > 8) return 'hot';
    if (score > 3) return 'warm';
    if (score > -3) return 'balanced';
    if (score > -8) return 'cool';
    return 'cold';
  }

  private calculateInvestmentScore(stats: any): number {
    let score = 50; // Base score
    
    // Price appreciation factor
    score += (stats.priceChangePercent || 0) * 2;
    
    // Market activity factor
    score += Math.min((stats.totalListings || 0) / 10, 20);
    
    // Time on market factor (lower is better)
    score -= Math.max((stats.daysOnMarket || 30) - 30, 0) / 2;
    
    // Rent yield factor
    if (stats.averageRent && stats.averageValue) {
      const rentYield = (stats.averageRent * 12) / stats.averageValue;
      score += rentYield * 1000; // Scale up the yield impact
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private mapToHeatMapLevel(marketHeat: 'hot' | 'warm' | 'balanced' | 'cool' | 'cold'): 'very_hot' | 'hot' | 'warm' | 'balanced' | 'cool' {
    // Map neighborhood trend heat levels to heat map levels
    if (marketHeat === 'hot') return 'very_hot';
    if (marketHeat === 'warm') return 'hot';
    if (marketHeat === 'balanced') return 'warm';
    if (marketHeat === 'cool') return 'balanced';
    return 'cool'; // 'cold' maps to 'cool'
  }

  private normalizePropertyType(type: string): 'single-family' | 'multi-family' | 'condo' | 'townhouse' | 'other' {
    const lowerType = type?.toLowerCase() || '';
    
    if (lowerType.includes('single') || lowerType.includes('detached')) return 'single-family';
    if (lowerType.includes('multi') || lowerType.includes('duplex') || lowerType.includes('triplex')) return 'multi-family';
    if (lowerType.includes('condo') || lowerType.includes('condominium')) return 'condo';
    if (lowerType.includes('town') || lowerType.includes('row')) return 'townhouse';
    
    return 'other';
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/properties/search', { limit: 1 });
      return true;
    } catch (error) {
      console.error('RentCast API connection test failed:', error);
      return false;
    }
  }
}

export const rentCastAPI = new RentCastAPIService();