import { type Property, type DealAnalysis, type InsertProperty, type InsertDealAnalysis, type PropertyComparison, type EmailDeal, type NeighborhoodTrend, type ComparableSale, type MarketHeatMapData, type SavedFilter, type NaturalLanguageSearch, type PropertyClassification, type InsertNeighborhoodTrend, type InsertComparableSale, type InsertMarketHeatMapData, type InsertSavedFilter, type InsertNaturalLanguageSearch, type InsertPropertyClassification } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Property methods
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Deal analysis methods
  getDealAnalysis(id: string): Promise<DealAnalysis | undefined>;
  createDealAnalysis(analysis: InsertDealAnalysis): Promise<DealAnalysis>;
  updateDealAnalysis(id: string, analysis: InsertDealAnalysis): Promise<DealAnalysis | undefined>;
  findAnalysisByPropertyAddress(address: string): Promise<DealAnalysis | undefined>;
  getAnalysisHistory(): Promise<DealAnalysis[]>;
  
  // Email deal methods
  getEmailDeals(): Promise<EmailDeal[]>;
  getEmailDeal(id: string): Promise<EmailDeal | undefined>;
  createEmailDeal(deal: Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDeal>;
  updateEmailDeal(id: string, updates: Partial<Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>>): Promise<EmailDeal | undefined>;
  deleteEmailDeal(id: string): Promise<boolean>;
  findEmailDealByContentHash(contentHash: string): Promise<EmailDeal | undefined>;
  
  // Comparison methods
  createComparison(propertyIds: string[], name?: string): Promise<PropertyComparison | null>;
  getComparison(id: string): Promise<PropertyComparison | undefined>;
  getComparisons(): Promise<PropertyComparison[]>;
  deleteComparison(id: string): Promise<boolean>;
  
  // Market Intelligence methods
  getNeighborhoodTrends(city?: string, state?: string): Promise<NeighborhoodTrend[]>;
  getNeighborhoodTrend(id: string): Promise<NeighborhoodTrend | undefined>;
  createNeighborhoodTrend(trend: InsertNeighborhoodTrend): Promise<NeighborhoodTrend>;
  updateNeighborhoodTrend(id: string, updates: Partial<InsertNeighborhoodTrend>): Promise<NeighborhoodTrend | undefined>;
  
  getComparableSales(address: string, radius?: number): Promise<ComparableSale[]>;
  getComparableSale(id: string): Promise<ComparableSale | undefined>;
  createComparableSale(sale: InsertComparableSale): Promise<ComparableSale>;
  
  getMarketHeatMapData(bounds?: { north: number; south: number; east: number; west: number }): Promise<MarketHeatMapData[]>;
  getMarketHeatMapDataByZip(zipCode: string): Promise<MarketHeatMapData | undefined>;
  createMarketHeatMapData(data: InsertMarketHeatMapData): Promise<MarketHeatMapData>;
  updateMarketHeatMapData(id: string, updates: Partial<InsertMarketHeatMapData>): Promise<MarketHeatMapData | undefined>;
  
  // Advanced Filtering & Search methods
  getSavedFilters(): Promise<SavedFilter[]>;
  getSavedFilter(id: string): Promise<SavedFilter | undefined>;
  createSavedFilter(filter: InsertSavedFilter): Promise<SavedFilter>;
  updateSavedFilter(id: string, updates: Partial<InsertSavedFilter>): Promise<SavedFilter | undefined>;
  deleteSavedFilter(id: string): Promise<boolean>;
  incrementFilterUsage(id: string): Promise<void>;
  
  searchNaturalLanguage(query: string): Promise<NaturalLanguageSearch>;
  getSearchHistory(): Promise<NaturalLanguageSearch[]>;
  
  getPropertyClassification(propertyId: string): Promise<PropertyClassification | undefined>;
  createPropertyClassification(classification: InsertPropertyClassification): Promise<PropertyClassification>;
  updatePropertyClassification(propertyId: string, updates: Partial<InsertPropertyClassification>): Promise<PropertyClassification | undefined>;
  
  // Advanced property search with filters
  searchProperties(filters: any): Promise<DealAnalysis[]>;
}

export class MemStorage implements IStorage {
  private properties: Map<string, Property>;
  private dealAnalyses: Map<string, DealAnalysis>;
  private comparisons: Map<string, PropertyComparison>;
  private emailDeals: Map<string, EmailDeal>;
  private neighborhoodTrends: Map<string, NeighborhoodTrend>;
  private comparableSales: Map<string, ComparableSale>;
  private marketHeatMapData: Map<string, MarketHeatMapData>;
  private savedFilters: Map<string, SavedFilter>;
  private searchHistory: Map<string, NaturalLanguageSearch>;
  private propertyClassifications: Map<string, PropertyClassification>;

  constructor() {
    this.properties = new Map();
    this.dealAnalyses = new Map();
    this.comparisons = new Map();
    this.emailDeals = new Map();
    this.neighborhoodTrends = new Map();
    this.comparableSales = new Map();
    this.marketHeatMapData = new Map();
    this.savedFilters = new Map();
    this.searchHistory = new Map();
    this.propertyClassifications = new Map();
    
    // Initialize with some default system filters
    this.initializeSystemFilters();
  }

  async getProperty(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = randomUUID();
    const property: Property = { ...insertProperty, id };
    this.properties.set(id, property);
    return property;
  }

  async getDealAnalysis(id: string): Promise<DealAnalysis | undefined> {
    return this.dealAnalyses.get(id);
  }

  async createDealAnalysis(insertAnalysis: InsertDealAnalysis): Promise<DealAnalysis> {
    const id = randomUUID();
    const analysis: DealAnalysis = { 
      ...insertAnalysis, 
      id,
      analysisDate: new Date()
    };
    this.dealAnalyses.set(id, analysis);
    return analysis;
  }

  async updateDealAnalysis(id: string, insertAnalysis: InsertDealAnalysis): Promise<DealAnalysis | undefined> {
    const existingAnalysis = this.dealAnalyses.get(id);
    if (!existingAnalysis) {
      return undefined;
    }
    
    const updatedAnalysis: DealAnalysis = { 
      ...insertAnalysis, 
      id: existingAnalysis.id, // Keep the same ID
      analysisDate: new Date() // Update the timestamp
    };
    this.dealAnalyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  }

  async findAnalysisByPropertyAddress(address: string): Promise<DealAnalysis | undefined> {
    const analyses = Array.from(this.dealAnalyses.values());
    return analyses.find(analysis => analysis.property.address === address);
  }

  async getAnalysisHistory(): Promise<DealAnalysis[]> {
    return Array.from(this.dealAnalyses.values())
      .sort((a, b) => (b.analysisDate?.getTime() || 0) - (a.analysisDate?.getTime() || 0));
  }

  async createComparison(propertyIds: string[], name?: string): Promise<PropertyComparison | null> {
    // Get the deal analyses for the provided property IDs
    const properties: DealAnalysis[] = [];
    for (const propertyId of propertyIds) {
      const analysis = this.dealAnalyses.get(propertyId);
      if (analysis) {
        properties.push(analysis);
      }
    }

    if (properties.length < 2) {
      return null; // Need at least 2 properties to compare
    }

    const id = randomUUID();
    const comparison: PropertyComparison = {
      id,
      name: name || `Comparison ${new Date().toLocaleDateString()}`,
      properties,
      createdAt: new Date()
    };

    this.comparisons.set(id, comparison);
    return comparison;
  }

  async getComparison(id: string): Promise<PropertyComparison | undefined> {
    return this.comparisons.get(id);
  }

  async getComparisons(): Promise<PropertyComparison[]> {
    return Array.from(this.comparisons.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async deleteComparison(id: string): Promise<boolean> {
    return this.comparisons.delete(id);
  }

  // Email deal methods implementation
  async getEmailDeals(): Promise<EmailDeal[]> {
    return Array.from(this.emailDeals.values())
      .sort((a, b) => b.receivedDate.getTime() - a.receivedDate.getTime());
  }

  async getEmailDeal(id: string): Promise<EmailDeal | undefined> {
    return this.emailDeals.get(id);
  }

  async createEmailDeal(deal: Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDeal> {
    const id = randomUUID();
    const now = new Date();
    const emailDeal: EmailDeal = {
      ...deal,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.emailDeals.set(id, emailDeal);
    return emailDeal;
  }

  async updateEmailDeal(id: string, updates: Partial<Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>>): Promise<EmailDeal | undefined> {
    const existingDeal = this.emailDeals.get(id);
    if (!existingDeal) {
      return undefined;
    }

    const updatedDeal: EmailDeal = {
      ...existingDeal,
      ...updates,
      id: existingDeal.id, // Keep the same ID
      createdAt: existingDeal.createdAt, // Keep original creation time
      updatedAt: new Date(), // Update the timestamp
    };
    this.emailDeals.set(id, updatedDeal);
    return updatedDeal;
  }

  async deleteEmailDeal(id: string): Promise<boolean> {
    return this.emailDeals.delete(id);
  }

  async findEmailDealByContentHash(contentHash: string): Promise<EmailDeal | undefined> {
    const deals = Array.from(this.emailDeals.values());
    return deals.find(deal => deal.contentHash === contentHash);
  }

  // Market Intelligence methods implementation
  async getNeighborhoodTrends(city?: string, state?: string): Promise<NeighborhoodTrend[]> {
    const trends = Array.from(this.neighborhoodTrends.values());
    return trends.filter(trend => {
      if (city && trend.city.toLowerCase() !== city.toLowerCase()) return false;
      if (state && trend.state.toLowerCase() !== state.toLowerCase()) return false;
      return true;
    }).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  async getNeighborhoodTrend(id: string): Promise<NeighborhoodTrend | undefined> {
    return this.neighborhoodTrends.get(id);
  }

  async createNeighborhoodTrend(trend: InsertNeighborhoodTrend): Promise<NeighborhoodTrend> {
    const id = randomUUID();
    const neighborhoodTrend: NeighborhoodTrend = { 
      ...trend, 
      id,
      lastUpdated: new Date()
    };
    this.neighborhoodTrends.set(id, neighborhoodTrend);
    return neighborhoodTrend;
  }

  async updateNeighborhoodTrend(id: string, updates: Partial<InsertNeighborhoodTrend>): Promise<NeighborhoodTrend | undefined> {
    const existing = this.neighborhoodTrends.get(id);
    if (!existing) return undefined;
    
    const updated: NeighborhoodTrend = {
      ...existing,
      ...updates,
      id,
      lastUpdated: new Date()
    };
    this.neighborhoodTrends.set(id, updated);
    return updated;
  }

  async getComparableSales(address: string, radius: number = 1): Promise<ComparableSale[]> {
    // For now, return all sales - in real implementation, would use geolocation
    const sales = Array.from(this.comparableSales.values());
    return sales.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
  }

  async getComparableSale(id: string): Promise<ComparableSale | undefined> {
    return this.comparableSales.get(id);
  }

  async createComparableSale(sale: InsertComparableSale): Promise<ComparableSale> {
    const id = randomUUID();
    const comparableSale: ComparableSale = { 
      ...sale, 
      id,
      createdAt: new Date()
    };
    this.comparableSales.set(id, comparableSale);
    return comparableSale;
  }

  async getMarketHeatMapData(bounds?: { north: number; south: number; east: number; west: number }): Promise<MarketHeatMapData[]> {
    const data = Array.from(this.marketHeatMapData.values());
    // For now, return all data - in real implementation, would filter by bounds
    return data.sort((a, b) => b.investmentScore - a.investmentScore);
  }

  async getMarketHeatMapDataByZip(zipCode: string): Promise<MarketHeatMapData | undefined> {
    const data = Array.from(this.marketHeatMapData.values());
    return data.find(item => item.zipCode === zipCode);
  }

  async createMarketHeatMapData(data: InsertMarketHeatMapData): Promise<MarketHeatMapData> {
    const id = randomUUID();
    const heatMapData: MarketHeatMapData = { 
      ...data, 
      id,
      lastUpdated: new Date()
    };
    this.marketHeatMapData.set(id, heatMapData);
    return heatMapData;
  }

  async updateMarketHeatMapData(id: string, updates: Partial<InsertMarketHeatMapData>): Promise<MarketHeatMapData | undefined> {
    const existing = this.marketHeatMapData.get(id);
    if (!existing) return undefined;
    
    const updated: MarketHeatMapData = {
      ...existing,
      ...updates,
      id,
      lastUpdated: new Date()
    };
    this.marketHeatMapData.set(id, updated);
    return updated;
  }

  // Advanced Filtering & Search methods implementation
  async getSavedFilters(): Promise<SavedFilter[]> {
    return Array.from(this.savedFilters.values())
      .sort((a, b) => b.usageCount - a.usageCount || b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getSavedFilter(id: string): Promise<SavedFilter | undefined> {
    return this.savedFilters.get(id);
  }

  async createSavedFilter(filter: InsertSavedFilter): Promise<SavedFilter> {
    const id = randomUUID();
    const now = new Date();
    const savedFilter: SavedFilter = { 
      ...filter, 
      id,
      usageCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.savedFilters.set(id, savedFilter);
    return savedFilter;
  }

  async updateSavedFilter(id: string, updates: Partial<InsertSavedFilter>): Promise<SavedFilter | undefined> {
    const existing = this.savedFilters.get(id);
    if (!existing) return undefined;
    
    const updated: SavedFilter = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date()
    };
    this.savedFilters.set(id, updated);
    return updated;
  }

  async deleteSavedFilter(id: string): Promise<boolean> {
    return this.savedFilters.delete(id);
  }

  async incrementFilterUsage(id: string): Promise<void> {
    const filter = this.savedFilters.get(id);
    if (filter) {
      filter.usageCount++;
      filter.updatedAt = new Date();
      this.savedFilters.set(id, filter);
    }
  }

  async searchNaturalLanguage(query: string): Promise<NaturalLanguageSearch> {
    const parsedCriteria = this.parseNaturalLanguageQuery(query);
    const results = await this.searchProperties(parsedCriteria);
    
    const id = randomUUID();
    const search: NaturalLanguageSearch = {
      id,
      query,
      parsedCriteria,
      resultCount: results.length,
      searchDate: new Date()
    };
    
    this.searchHistory.set(id, search);
    return search;
  }

  async getSearchHistory(): Promise<NaturalLanguageSearch[]> {
    return Array.from(this.searchHistory.values())
      .sort((a, b) => b.searchDate.getTime() - a.searchDate.getTime())
      .slice(0, 50); // Keep last 50 searches
  }

  async getPropertyClassification(propertyId: string): Promise<PropertyClassification | undefined> {
    return this.propertyClassifications.get(propertyId);
  }

  async createPropertyClassification(classification: InsertPropertyClassification): Promise<PropertyClassification> {
    const propertyClassification: PropertyClassification = { 
      ...classification, 
      lastUpdated: new Date()
    };
    this.propertyClassifications.set(classification.propertyId, propertyClassification);
    return propertyClassification;
  }

  async updatePropertyClassification(propertyId: string, updates: Partial<InsertPropertyClassification>): Promise<PropertyClassification | undefined> {
    const existing = this.propertyClassifications.get(propertyId);
    if (!existing) return undefined;
    
    const updated: PropertyClassification = {
      ...existing,
      ...updates,
      propertyId,
      lastUpdated: new Date()
    };
    this.propertyClassifications.set(propertyId, updated);
    return updated;
  }

  async searchProperties(filters: any): Promise<DealAnalysis[]> {
    const analyses = Array.from(this.dealAnalyses.values());
    
    return analyses.filter(analysis => {
      const property = analysis.property;
      
      // Price filters
      if (filters.priceMin && property.purchasePrice < filters.priceMin) return false;
      if (filters.priceMax && property.purchasePrice > filters.priceMax) return false;
      
      // Bedroom/bathroom filters
      if (filters.bedroomsMin && property.bedrooms < filters.bedroomsMin) return false;
      if (filters.bedroomsMax && property.bedrooms > filters.bedroomsMax) return false;
      if (filters.bathroomsMin && property.bathrooms < filters.bathroomsMin) return false;
      if (filters.bathroomsMax && property.bathrooms > filters.bathroomsMax) return false;
      
      // Square footage filters
      if (filters.sqftMin && property.squareFootage < filters.sqftMin) return false;
      if (filters.sqftMax && property.squareFootage > filters.sqftMax) return false;
      
      // Financial filters
      if (filters.cocReturnMin && analysis.cocReturn < filters.cocReturnMin) return false;
      if (filters.cocReturnMax && analysis.cocReturn > filters.cocReturnMax) return false;
      if (filters.capRateMin && analysis.capRate < filters.capRateMin) return false;
      if (filters.capRateMax && analysis.capRate > filters.capRateMax) return false;
      if (filters.cashFlowMin && analysis.cashFlow < filters.cashFlowMin) return false;
      
      // Location filters
      if (filters.cities && filters.cities.length > 0) {
        if (!filters.cities.some((city: string) => property.city.toLowerCase().includes(city.toLowerCase()))) return false;
      }
      if (filters.states && filters.states.length > 0) {
        if (!filters.states.some((state: string) => property.state.toLowerCase().includes(state.toLowerCase()))) return false;
      }
      
      // Property type filters
      if (filters.propertyTypes && filters.propertyTypes.length > 0) {
        if (!filters.propertyTypes.includes(property.propertyType)) return false;
      }
      
      // Criteria compliance filter
      if (filters.meetsCriteria !== undefined && analysis.meetsCriteria !== filters.meetsCriteria) return false;
      
      // Investment grade filter
      if (filters.investmentGrade && filters.investmentGrade.length > 0) {
        const classification = this.propertyClassifications.get(property.id!);
        if (!classification || !filters.investmentGrade.includes(classification.investmentGrade)) return false;
      }
      
      return true;
    });
  }

  private parseNaturalLanguageQuery(query: string): any {
    const criteria: any = {};
    const lowerQuery = query.toLowerCase();
    
    // Extract bedrooms
    const bedroomMatch = lowerQuery.match(/(\d+)\s*(?:bed|bedroom|br)/);
    if (bedroomMatch) {
      criteria.bedrooms = parseInt(bedroomMatch[1]);
    }
    
    // Extract bathrooms  
    const bathroomMatch = lowerQuery.match(/(\d+)\s*(?:bath|bathroom|ba)/);
    if (bathroomMatch) {
      criteria.bathrooms = parseInt(bathroomMatch[1]);
    }
    
    // Extract price under/below
    const priceUnderMatch = lowerQuery.match(/(?:under|below|less than|<)\s*\$?(\d+(?:,\d{3})*(?:k|m)?)/);
    if (priceUnderMatch) {
      let price = priceUnderMatch[1].replace(/,/g, '');
      if (price.endsWith('k')) {
        price = price.slice(0, -1) + '000';
      } else if (price.endsWith('m')) {
        price = price.slice(0, -1) + '000000';
      }
      criteria.priceMax = parseInt(price);
    }
    
    // Extract price over/above
    const priceOverMatch = lowerQuery.match(/(?:over|above|more than|>)\s*\$?(\d+(?:,\d{3})*(?:k|m)?)/);
    if (priceOverMatch) {
      let price = priceOverMatch[1].replace(/,/g, '');
      if (price.endsWith('k')) {
        price = price.slice(0, -1) + '000';
      } else if (price.endsWith('m')) {
        price = price.slice(0, -1) + '000000';
      }
      criteria.priceMin = parseInt(price);
    }
    
    // Extract location (city names)
    const locationMatch = lowerQuery.match(/(?:in|near|around)\s+([a-z\s]+)(?:\s|$)/);
    if (locationMatch) {
      criteria.location = locationMatch[1].trim();
      criteria.cities = [locationMatch[1].trim()];
    }
    
    // Extract property type
    if (lowerQuery.includes('single family') || lowerQuery.includes('sfh')) {
      criteria.propertyType = 'single-family';
    } else if (lowerQuery.includes('condo') || lowerQuery.includes('condominium')) {
      criteria.propertyType = 'condo';
    } else if (lowerQuery.includes('townhouse') || lowerQuery.includes('townhome')) {
      criteria.propertyType = 'townhouse';
    } else if (lowerQuery.includes('duplex')) {
      criteria.propertyType = 'duplex';
    } else if (lowerQuery.includes('multi family') || lowerQuery.includes('multifamily')) {
      criteria.propertyType = 'multi-family';
    }
    
    return criteria;
  }

  private initializeSystemFilters(): void {
    const systemFilters = [
      {
        name: "High Cash Flow",
        description: "Properties with positive cash flow over $500/month",
        filterCriteria: {
          cashFlowMin: 500,
          meetsCriteria: true
        },
        isSystem: true
      },
      {
        name: "Fixer Uppers",
        description: "Older properties with high potential returns",
        filterCriteria: {
          cocReturnMin: 0.15, // 15%+ COC return
          capRateMin: 0.08    // 8%+ cap rate
        },
        isSystem: true
      },
      {
        name: "Turnkey Properties",
        description: "Properties meeting all investment criteria",
        filterCriteria: {
          meetsCriteria: true,
          investmentGrade: ['A', 'B']
        },
        isSystem: true
      },
      {
        name: "Budget Friendly",
        description: "Properties under $200k",
        filterCriteria: {
          priceMax: 200000
        },
        isSystem: true
      },
      {
        name: "Premium Investments",
        description: "High-grade properties in desirable areas",
        filterCriteria: {
          priceMin: 300000,
          investmentGrade: ['A'],
          meetsCriteria: true
        },
        isSystem: true
      }
    ];

    systemFilters.forEach(filter => {
      const id = randomUUID();
      const now = new Date();
      const savedFilter: SavedFilter = {
        ...filter,
        id,
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      };
      this.savedFilters.set(id, savedFilter);
    });
  }
}

export const storage = new MemStorage();
