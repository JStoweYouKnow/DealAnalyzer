import { type Property, type DealAnalysis, type InsertProperty, type InsertDealAnalysis, type PropertyComparison, type EmailDeal, type NeighborhoodTrend, type ComparableSale, type MarketHeatMapData, type SavedFilter, type NaturalLanguageSearch, type PropertyClassification, type SmartPropertyRecommendation, type RentPricingRecommendation, type InvestmentTimingAdvice, type AnalysisTemplate, type ApiIntegration, type PhotoAnalysis, type InsertPhotoAnalysis, type InsertNeighborhoodTrend, type InsertComparableSale, type InsertMarketHeatMapData, type InsertSavedFilter, type InsertNaturalLanguageSearch, type InsertPropertyClassification, type InsertSmartPropertyRecommendation, type InsertRentPricingRecommendation, type InsertInvestmentTimingAdvice, type InsertAnalysisTemplate, type InsertApiIntegration } from "@shared/schema";
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
  createEmailDeal(deal: Omit<EmailDeal, 'createdAt' | 'updatedAt'> | Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDeal>;
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
  
  // AI Recommendations methods
  getSmartPropertyRecommendations(sourcePropertyId: string): Promise<SmartPropertyRecommendation[]>;
  createSmartPropertyRecommendation(recommendation: InsertSmartPropertyRecommendation): Promise<SmartPropertyRecommendation>;
  
  getRentPricingRecommendation(propertyId: string): Promise<RentPricingRecommendation | undefined>;
  createRentPricingRecommendation(recommendation: InsertRentPricingRecommendation): Promise<RentPricingRecommendation>;
  updateRentPricingRecommendation(id: string, updates: Partial<InsertRentPricingRecommendation>): Promise<RentPricingRecommendation | undefined>;
  
  getInvestmentTimingAdvice(propertyId: string): Promise<InvestmentTimingAdvice | undefined>;
  createInvestmentTimingAdvice(advice: InsertInvestmentTimingAdvice): Promise<InvestmentTimingAdvice>;
  updateInvestmentTimingAdvice(id: string, updates: Partial<InsertInvestmentTimingAdvice>): Promise<InvestmentTimingAdvice | undefined>;
  
  // Templates & Presets methods
  getAnalysisTemplates(): Promise<AnalysisTemplate[]>;
  getAnalysisTemplate(id: string): Promise<AnalysisTemplate | undefined>;
  createAnalysisTemplate(template: InsertAnalysisTemplate): Promise<AnalysisTemplate>;
  updateAnalysisTemplate(id: string, updates: Partial<InsertAnalysisTemplate>): Promise<AnalysisTemplate | undefined>;
  deleteAnalysisTemplate(id: string): Promise<boolean>;
  getDefaultTemplates(): Promise<AnalysisTemplate[]>;

  // API Integration management
  createApiIntegration(integration: InsertApiIntegration): Promise<ApiIntegration>;
  getUserApiIntegrations(userId: string): Promise<ApiIntegration[]>;
  getApiIntegration(id: string): Promise<ApiIntegration | undefined>;
  updateApiIntegration(id: string, updates: Partial<InsertApiIntegration>): Promise<ApiIntegration | undefined>;
  deleteApiIntegration(id: string): Promise<boolean>;

  // Photo Analysis methods
  getPhotoAnalyses(propertyId: string): Promise<PhotoAnalysis[]>;
  getPhotoAnalysis(id: string): Promise<PhotoAnalysis | undefined>;
  createPhotoAnalysis(analysis: InsertPhotoAnalysis): Promise<PhotoAnalysis>;
  deletePhotoAnalysis(id: string): Promise<boolean>;
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
  private smartPropertyRecommendations: Map<string, SmartPropertyRecommendation>;
  private rentPricingRecommendations: Map<string, RentPricingRecommendation>;
  private investmentTimingAdvice: Map<string, InvestmentTimingAdvice>;
  private analysisTemplates: Map<string, AnalysisTemplate>;
  private apiIntegrations: Map<string, ApiIntegration>;
  private photoAnalyses: Map<string, PhotoAnalysis>;

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
    this.smartPropertyRecommendations = new Map();
    this.rentPricingRecommendations = new Map();
    this.investmentTimingAdvice = new Map();
    this.analysisTemplates = new Map();
    this.apiIntegrations = new Map();
    this.photoAnalyses = new Map();
    
    // Initialize with some default system filters, templates, and market data
    this.initializeSystemFilters();
    this.initializeDefaultTemplates();
    this.initializeMarketIntelligenceData();
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

  async createEmailDeal(deal: Omit<EmailDeal, 'createdAt' | 'updatedAt'> | Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDeal> {
    // Use the provided ID if it exists (for email deals from Gmail), otherwise generate a UUID
    const id = 'id' in deal ? deal.id : randomUUID();
    
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

  // AI Recommendations methods
  async getSmartPropertyRecommendations(sourcePropertyId: string): Promise<SmartPropertyRecommendation[]> {
    return Array.from(this.smartPropertyRecommendations.values())
      .filter(rec => rec.sourcePropertyId === sourcePropertyId);
  }

  async createSmartPropertyRecommendation(recommendation: InsertSmartPropertyRecommendation): Promise<SmartPropertyRecommendation> {
    const id = randomUUID();
    const now = new Date();
    const rec: SmartPropertyRecommendation = {
      ...recommendation,
      id,
      createdAt: now
    };
    this.smartPropertyRecommendations.set(id, rec);
    return rec;
  }

  async getRentPricingRecommendation(propertyId: string): Promise<RentPricingRecommendation | undefined> {
    return Array.from(this.rentPricingRecommendations.values())
      .find(rec => rec.propertyId === propertyId && rec.validUntil > new Date());
  }

  async createRentPricingRecommendation(recommendation: InsertRentPricingRecommendation): Promise<RentPricingRecommendation> {
    const id = randomUUID();
    const now = new Date();
    const rec: RentPricingRecommendation = {
      ...recommendation,
      id,
      createdAt: now
    };
    this.rentPricingRecommendations.set(id, rec);
    return rec;
  }

  async updateRentPricingRecommendation(id: string, updates: Partial<InsertRentPricingRecommendation>): Promise<RentPricingRecommendation | undefined> {
    const existing = this.rentPricingRecommendations.get(id);
    if (!existing) return undefined;
    
    const updated: RentPricingRecommendation = { ...existing, ...updates };
    this.rentPricingRecommendations.set(id, updated);
    return updated;
  }

  async getInvestmentTimingAdvice(propertyId: string): Promise<InvestmentTimingAdvice | undefined> {
    return Array.from(this.investmentTimingAdvice.values())
      .find(advice => advice.propertyId === propertyId && advice.expiresAt > new Date());
  }

  async createInvestmentTimingAdvice(advice: InsertInvestmentTimingAdvice): Promise<InvestmentTimingAdvice> {
    const id = randomUUID();
    const now = new Date();
    const timing: InvestmentTimingAdvice = {
      ...advice,
      id,
      createdAt: now
    };
    this.investmentTimingAdvice.set(id, timing);
    return timing;
  }

  async updateInvestmentTimingAdvice(id: string, updates: Partial<InsertInvestmentTimingAdvice>): Promise<InvestmentTimingAdvice | undefined> {
    const existing = this.investmentTimingAdvice.get(id);
    if (!existing) return undefined;
    
    const updated: InvestmentTimingAdvice = { ...existing, ...updates };
    this.investmentTimingAdvice.set(id, updated);
    return updated;
  }

  // Templates & Presets methods
  async getAnalysisTemplates(): Promise<AnalysisTemplate[]> {
    return Array.from(this.analysisTemplates.values());
  }

  async getAnalysisTemplate(id: string): Promise<AnalysisTemplate | undefined> {
    return this.analysisTemplates.get(id);
  }

  async createAnalysisTemplate(template: InsertAnalysisTemplate): Promise<AnalysisTemplate> {
    const id = randomUUID();
    const now = new Date();
    const temp: AnalysisTemplate = {
      ...template,
      id,
      createdAt: now
    };
    this.analysisTemplates.set(id, temp);
    return temp;
  }

  async updateAnalysisTemplate(id: string, updates: Partial<InsertAnalysisTemplate>): Promise<AnalysisTemplate | undefined> {
    const existing = this.analysisTemplates.get(id);
    if (!existing) return undefined;
    
    const updated: AnalysisTemplate = { ...existing, ...updates };
    this.analysisTemplates.set(id, updated);
    return updated;
  }

  async deleteAnalysisTemplate(id: string): Promise<boolean> {
    return this.analysisTemplates.delete(id);
  }

  async getDefaultTemplates(): Promise<AnalysisTemplate[]> {
    return Array.from(this.analysisTemplates.values()).filter(template => template.isDefault);
  }

  private initializeMarketIntelligenceData() {
    // Initialize neighborhood trends with realistic sample data
    const neighborhoodTrendsData = [
      {
        neighborhood: "Downtown",
        city: "Los Angeles",
        state: "California",
        averagePrice: 850000,
        priceChangePercent3Month: 2.1,
        priceChangePercent6Month: 5.3,
        priceChangePercent1Year: 8.5,
        averageRent: 3200,
        rentChangePercent3Month: 3.8,
        rentChangePercent6Month: 8.1,
        rentChangePercent1Year: 12.3,
        daysOnMarket: 25,
        pricePerSqft: 650,
        rentYield: 0.045,
        marketHeat: "hot" as const
      },
      {
        neighborhood: "Westside",
        city: "Austin",
        state: "Texas", 
        averagePrice: 485000,
        priceChangePercent3Month: 4.2,
        priceChangePercent6Month: 9.8,
        priceChangePercent1Year: 15.2,
        averageRent: 2100,
        rentChangePercent3Month: 5.1,
        rentChangePercent6Month: 11.3,
        rentChangePercent1Year: 18.7,
        daysOnMarket: 18,
        pricePerSqft: 425,
        rentYield: 0.052,
        marketHeat: "hot" as const
      },
      {
        neighborhood: "South Beach",
        city: "Miami",
        state: "Florida",
        averagePrice: 620000,
        priceChangePercent3Month: 1.8,
        priceChangePercent6Month: 4.2,
        priceChangePercent1Year: 6.8,
        averageRent: 2800,
        rentChangePercent3Month: 2.3,
        rentChangePercent6Month: 5.8,
        rentChangePercent1Year: 9.4,
        daysOnMarket: 35,
        pricePerSqft: 580,
        rentYield: 0.054,
        marketHeat: "warm" as const
      },
      {
        neighborhood: "Brooklyn Heights",
        city: "New York",
        state: "New York",
        averagePrice: 1200000,
        priceChangePercent3Month: 0.8,
        priceChangePercent6Month: 2.1,
        priceChangePercent1Year: 3.2,
        averageRent: 4500,
        rentChangePercent3Month: 1.2,
        rentChangePercent6Month: 3.1,
        rentChangePercent1Year: 5.1,
        daysOnMarket: 45,
        pricePerSqft: 950,
        rentYield: 0.045,
        marketHeat: "balanced" as const
      },
      {
        neighborhood: "Mission District",
        city: "San Francisco",
        state: "California",
        averagePrice: 1100000,
        priceChangePercent3Month: 0.5,
        priceChangePercent6Month: 1.3,
        priceChangePercent1Year: 2.1,
        averageRent: 3800,
        rentChangePercent3Month: 0.9,
        rentChangePercent6Month: 2.2,
        rentChangePercent1Year: 3.8,
        daysOnMarket: 55,
        pricePerSqft: 850,
        rentYield: 0.041,
        marketHeat: "cool" as const
      },
      {
        neighborhood: "The Gulch",
        city: "Nashville",
        state: "Tennessee",
        averagePrice: 425000,
        priceChangePercent3Month: 3.5,
        priceChangePercent6Month: 7.8,
        priceChangePercent1Year: 11.8,
        averageRent: 1950,
        rentChangePercent3Month: 4.1,
        rentChangePercent6Month: 9.2,
        rentChangePercent1Year: 14.2,
        daysOnMarket: 22,
        pricePerSqft: 380,
        rentYield: 0.055,
        marketHeat: "hot" as const
      }
    ];

    neighborhoodTrendsData.forEach(data => {
      const id = randomUUID();
      const trend: NeighborhoodTrend = {
        ...data,
        id,
        lastUpdated: new Date()
      };
      this.neighborhoodTrends.set(id, trend);
    });

    // Initialize comparable sales with realistic sample data
    const comparableSalesData = [
      {
        address: "123 Main St",
        city: "Los Angeles",
        state: "California",
        zipCode: "90210",
        salePrice: 825000,
        pricePerSqft: 645,
        bedrooms: 3,
        bathrooms: 2.5,
        squareFootage: 1280,
        yearBuilt: 2018,
        propertyType: "single-family",
        saleDate: new Date(2024, 7, 15),
        distance: 0.3
      },
      {
        address: "456 Oak Ave",
        city: "Austin",
        state: "Texas",
        zipCode: "78701",
        salePrice: 495000,
        pricePerSqft: 432,
        bedrooms: 2,
        bathrooms: 2,
        squareFootage: 1146,
        yearBuilt: 2020,
        propertyType: "townhouse",
        saleDate: new Date(2024, 8, 3),
        distance: 0.8
      },
      {
        address: "789 Pine Dr",
        city: "Miami",
        state: "Florida",
        zipCode: "33139",
        salePrice: 635000,
        pricePerSqft: 590,
        bedrooms: 2,
        bathrooms: 2,
        squareFootage: 1076,
        yearBuilt: 2019,
        propertyType: "condo",
        saleDate: new Date(2024, 6, 22),
        distance: 1.2
      },
      {
        address: "321 Elm St",
        city: "New York",
        state: "New York",
        zipCode: "10001",
        salePrice: 1150000,
        pricePerSqft: 920,
        bedrooms: 1,
        bathrooms: 1,
        squareFootage: 1250,
        yearBuilt: 2015,
        propertyType: "condo",
        saleDate: new Date(2024, 5, 10),
        distance: 0.5
      },
      {
        address: "654 Birch Ln",
        city: "San Francisco",
        state: "California",
        zipCode: "94110",
        salePrice: 1080000,
        pricePerSqft: 810,
        bedrooms: 2,
        bathrooms: 1,
        squareFootage: 1333,
        yearBuilt: 1985,
        propertyType: "single-family",
        saleDate: new Date(2024, 4, 28),
        distance: 0.7
      },
      {
        address: "987 Cedar Way",
        city: "Nashville",
        state: "Tennessee",
        zipCode: "37203",
        salePrice: 445000,
        pricePerSqft: 385,
        bedrooms: 3,
        bathrooms: 2.5,
        squareFootage: 1156,
        yearBuilt: 2021,
        propertyType: "townhouse",
        saleDate: new Date(2024, 8, 18),
        distance: 1.1
      }
    ];

    comparableSalesData.forEach(data => {
      const id = randomUUID();
      const sale: ComparableSale = {
        ...data,
        id,
        createdAt: new Date()
      };
      this.comparableSales.set(id, sale);
    });

    // Initialize market heat map data with realistic sample data
    const heatMapData = [
      {
        zipCode: "90210",
        city: "Beverly Hills",
        state: "California",
        latitude: 34.0901,
        longitude: -118.4065,
        heatLevel: "very_hot" as const,
        averagePrice: 2100000,
        priceChangePercent: 12.5,
        averageRent: 8500,
        rentChangePercent: 15.2,
        investmentScore: 89,
        dealVolume: 45
      },
      {
        zipCode: "78701",
        city: "Austin",
        state: "Texas",
        latitude: 30.2672,
        longitude: -97.7431,
        heatLevel: "very_hot" as const,
        averagePrice: 650000,
        priceChangePercent: 18.3,
        averageRent: 2800,
        rentChangePercent: 22.1,
        investmentScore: 94,
        dealVolume: 78
      },
      {
        zipCode: "33139",
        city: "Miami Beach",
        state: "Florida",
        latitude: 25.7617,
        longitude: -80.1918,
        heatLevel: "hot" as const,
        averagePrice: 850000,
        priceChangePercent: 9.7,
        averageRent: 3900,
        rentChangePercent: 11.4,
        investmentScore: 82,
        dealVolume: 52
      },
      {
        zipCode: "10001",
        city: "New York",
        state: "New York",
        latitude: 40.7589,
        longitude: -73.9851,
        heatLevel: "warm" as const,
        averagePrice: 1450000,
        priceChangePercent: 4.2,
        averageRent: 5200,
        rentChangePercent: 6.8,
        investmentScore: 75,
        dealVolume: 38
      },
      {
        zipCode: "94110",
        city: "San Francisco",
        state: "California",
        latitude: 37.7478,
        longitude: -122.4148,
        heatLevel: "balanced" as const,
        averagePrice: 1320000,
        priceChangePercent: 2.8,
        averageRent: 4100,
        rentChangePercent: 3.9,
        investmentScore: 68,
        dealVolume: 29
      },
      {
        zipCode: "37203",
        city: "Nashville",
        state: "Tennessee",
        latitude: 36.1467,
        longitude: -86.8073,
        heatLevel: "hot" as const,
        averagePrice: 525000,
        priceChangePercent: 14.6,
        averageRent: 2200,
        rentChangePercent: 16.8,
        investmentScore: 87,
        dealVolume: 63
      },
      {
        zipCode: "85001",
        city: "Phoenix",
        state: "Arizona",
        latitude: 33.4484,
        longitude: -112.0740,
        heatLevel: "hot" as const,
        averagePrice: 425000,
        priceChangePercent: 11.2,
        averageRent: 1800,
        rentChangePercent: 13.5,
        investmentScore: 79,
        dealVolume: 56
      },
      {
        zipCode: "30309",
        city: "Atlanta",
        state: "Georgia",
        latitude: 33.7730,
        longitude: -84.3776,
        heatLevel: "warm" as const,
        averagePrice: 385000,
        priceChangePercent: 8.9,
        averageRent: 1650,
        rentChangePercent: 10.2,
        investmentScore: 73,
        dealVolume: 41
      },
      {
        zipCode: "80202",
        city: "Denver",
        state: "Colorado",
        latitude: 39.7392,
        longitude: -104.9903,
        heatLevel: "hot" as const,
        averagePrice: 575000,
        priceChangePercent: 10.8,
        averageRent: 2350,
        rentChangePercent: 12.9,
        investmentScore: 81,
        dealVolume: 47
      },
      {
        zipCode: "02101",
        city: "Boston",
        state: "Massachusetts",
        latitude: 42.3601,
        longitude: -71.0589,
        heatLevel: "balanced" as const,
        averagePrice: 875000,
        priceChangePercent: 5.1,
        averageRent: 3100,
        rentChangePercent: 7.3,
        investmentScore: 71,
        dealVolume: 34
      }
    ];

    heatMapData.forEach(data => {
      const id = randomUUID();
      const heatMap: MarketHeatMapData = {
        ...data,
        id,
        lastUpdated: new Date()
      };
      this.marketHeatMapData.set(id, heatMap);
    });
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates = [
      {
        name: "Conservative Single Family",
        description: "Conservative analysis for single family rental properties",
        propertyType: "single-family",
        criteriaPreset: {
          strategy: 'conservative' as const,
          targetCoCReturn: 8.0,
          targetCapRate: 7.0,
          maxLoanToValue: 80.0,
          vacancyRate: 8.0,
          maintenanceRate: 5.0,
          managementRate: 8.0,
          expectedAppreciation: 3.0,
        },
        scenarios: {
          bestCase: { rentIncrease: 5.0, appreciation: 5.0, vacancy: 3.0, maintenance: 3.0 },
          realistic: { rentIncrease: 3.0, appreciation: 3.0, vacancy: 8.0, maintenance: 5.0 },
          worstCase: { rentIncrease: 1.0, appreciation: 1.0, vacancy: 15.0, maintenance: 8.0 },
        },
        isDefault: true,
      },
      {
        name: "Aggressive Multi-Family",
        description: "Aggressive growth strategy for multi-family properties",
        propertyType: "multi-family",
        criteriaPreset: {
          strategy: 'aggressive' as const,
          targetCoCReturn: 12.0,
          targetCapRate: 9.0,
          maxLoanToValue: 85.0,
          vacancyRate: 10.0,
          maintenanceRate: 6.0,
          managementRate: 10.0,
          expectedAppreciation: 4.0,
        },
        scenarios: {
          bestCase: { rentIncrease: 8.0, appreciation: 7.0, vacancy: 5.0, maintenance: 4.0 },
          realistic: { rentIncrease: 4.0, appreciation: 4.0, vacancy: 10.0, maintenance: 6.0 },
          worstCase: { rentIncrease: 2.0, appreciation: 2.0, vacancy: 20.0, maintenance: 10.0 },
        },
        isDefault: true,
      },
      {
        name: "BRRRR Strategy",
        description: "Buy-Rehab-Rent-Refinance-Repeat strategy template",
        propertyType: "single-family",
        criteriaPreset: {
          strategy: 'brrrr' as const,
          targetCoCReturn: 15.0,
          targetCapRate: 10.0,
          maxLoanToValue: 75.0,
          vacancyRate: 6.0,
          maintenanceRate: 4.0,
          managementRate: 6.0,
          expectedAppreciation: 5.0,
        },
        scenarios: {
          bestCase: { rentIncrease: 10.0, appreciation: 8.0, vacancy: 2.0, maintenance: 2.0 },
          realistic: { rentIncrease: 5.0, appreciation: 5.0, vacancy: 6.0, maintenance: 4.0 },
          worstCase: { rentIncrease: 3.0, appreciation: 3.0, vacancy: 12.0, maintenance: 8.0 },
        },
        isDefault: true,
      }
    ];

    defaultTemplates.forEach(template => {
      const id = randomUUID();
      const now = new Date();
      const analysisTemplate: AnalysisTemplate = {
        ...template,
        id,
        createdAt: now
      };
      this.analysisTemplates.set(id, analysisTemplate);
    });
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
          investmentGrade: ['A', 'B'] as ('A' | 'B' | 'C' | 'D')[]
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
          investmentGrade: ['A'] as ('A' | 'B' | 'C' | 'D')[],
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

  // API Integration methods implementation
  async createApiIntegration(integration: InsertApiIntegration): Promise<ApiIntegration> {
    const id = randomUUID();
    const now = new Date();
    const apiIntegration: ApiIntegration = {
      ...integration,
      id,
      createdAt: now,
      lastUsed: undefined
    };
    this.apiIntegrations.set(id, apiIntegration);
    return apiIntegration;
  }

  async getUserApiIntegrations(userId: string): Promise<ApiIntegration[]> {
    // For now, return all integrations since we don't have user separation in mem storage
    // In a real implementation, you'd filter by userId
    return Array.from(this.apiIntegrations.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getApiIntegration(id: string): Promise<ApiIntegration | undefined> {
    return this.apiIntegrations.get(id);
  }

  async updateApiIntegration(id: string, updates: Partial<InsertApiIntegration>): Promise<ApiIntegration | undefined> {
    const existing = this.apiIntegrations.get(id);
    if (!existing) return undefined;

    const updated: ApiIntegration = {
      ...existing,
      ...updates,
      id, // Keep the same ID
      createdAt: existing.createdAt, // Keep original creation time
    };
    this.apiIntegrations.set(id, updated);
    return updated;
  }

  async deleteApiIntegration(id: string): Promise<boolean> {
    return this.apiIntegrations.delete(id);
  }

  // Photo Analysis methods
  async getPhotoAnalyses(propertyId: string): Promise<PhotoAnalysis[]> {
    const analyses: PhotoAnalysis[] = [];
    this.photoAnalyses.forEach((analysis) => {
      if (analysis.propertyId === propertyId) {
        analyses.push(analysis);
      }
    });
    return analyses.sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime());
  }

  async getPhotoAnalysis(id: string): Promise<PhotoAnalysis | undefined> {
    return this.photoAnalyses.get(id);
  }

  async createPhotoAnalysis(analysis: InsertPhotoAnalysis): Promise<PhotoAnalysis> {
    const id = randomUUID();
    const photoAnalysis: PhotoAnalysis = {
      id,
      ...analysis,
    };
    this.photoAnalyses.set(id, photoAnalysis);
    return photoAnalysis;
  }

  async deletePhotoAnalysis(id: string): Promise<boolean> {
    return this.photoAnalyses.delete(id);
  }
}

// Import Convex storage
import { convexStorage } from "./convex-storage";

// Singleton pattern to ensure storage persists across requests and HMR reloads
// Use globalThis to persist across Next.js hot module replacement
const globalForStorage = globalThis as unknown as {
  storageInstance: MemStorage | undefined;
  useConvex: boolean;
};

export const storage = (() => {
  // Check if we should use Convex (when NEXT_PUBLIC_CONVEX_URL is set)
  const useConvex = !!process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (useConvex) {
    try {
      console.log('Attempting to use Convex storage backend');
      // Return a wrapper that implements IStorage interface but uses Convex
      return createConvexStorageWrapper();
    } catch (error) {
      console.warn('Convex storage not available, falling back to in-memory storage:', error instanceof Error ? error.message : 'Unknown error');
      // Fall through to in-memory storage
    }
  }
  
  // Fallback to in-memory storage
  if (!globalForStorage.storageInstance) {
    console.log('Creating new MemStorage instance (fallback)');
    globalForStorage.storageInstance = new MemStorage();
  }
  return globalForStorage.storageInstance;
})();

// Create a wrapper that implements IStorage interface using Convex
function createConvexStorageWrapper(): IStorage {
  return {
    // Email deal methods - delegate to Convex
    async getEmailDeals() {
      return await convexStorage.getEmailDeals();
    },
    
    async getEmailDeal(id: string) {
      const result = await convexStorage.getEmailDeal(id);
      return result ?? undefined;
    },
    
    async createEmailDeal(deal: any) {
      return await convexStorage.createEmailDeal(deal);
    },
    
    async updateEmailDeal(id: string, updates: any) {
      const result = await convexStorage.updateEmailDeal(id, updates);
      return result || undefined;
    },
    
    async deleteEmailDeal(id: string) {
      try {
        await convexStorage.deleteEmailDeal(id);
        return true;
      } catch {
        return false;
      }
    },
    
    async findEmailDealByContentHash(contentHash: string) {
      const result = await convexStorage.findEmailDealByContentHash(contentHash);
      return result ?? undefined;
    },

    // For now, delegate other methods to a fallback MemStorage instance
    // TODO: Implement these in Convex as needed
    ...createFallbackMethods()
  };
}

// Create fallback methods for features not yet implemented in Convex
function createFallbackMethods() {
  const fallbackStorage = new MemStorage();
  
  return {
    // Property methods
    getProperty: fallbackStorage.getProperty.bind(fallbackStorage),
    createProperty: fallbackStorage.createProperty.bind(fallbackStorage),
    
    // Deal analysis methods  
    getDealAnalysis: fallbackStorage.getDealAnalysis.bind(fallbackStorage),
    createDealAnalysis: fallbackStorage.createDealAnalysis.bind(fallbackStorage),
    updateDealAnalysis: fallbackStorage.updateDealAnalysis.bind(fallbackStorage),
    findAnalysisByPropertyAddress: fallbackStorage.findAnalysisByPropertyAddress.bind(fallbackStorage),
    getAnalysisHistory: fallbackStorage.getAnalysisHistory.bind(fallbackStorage),
    
    // Comparison methods
    createComparison: fallbackStorage.createComparison.bind(fallbackStorage),
    getComparison: fallbackStorage.getComparison.bind(fallbackStorage),
    getComparisons: fallbackStorage.getComparisons.bind(fallbackStorage),
    deleteComparison: fallbackStorage.deleteComparison.bind(fallbackStorage),
    
    // Market Intelligence methods
    getNeighborhoodTrends: fallbackStorage.getNeighborhoodTrends.bind(fallbackStorage),
    getNeighborhoodTrend: fallbackStorage.getNeighborhoodTrend.bind(fallbackStorage),
    createNeighborhoodTrend: fallbackStorage.createNeighborhoodTrend.bind(fallbackStorage),
    updateNeighborhoodTrend: fallbackStorage.updateNeighborhoodTrend.bind(fallbackStorage),
    getComparableSales: fallbackStorage.getComparableSales.bind(fallbackStorage),
    getComparableSale: fallbackStorage.getComparableSale.bind(fallbackStorage),
    createComparableSale: fallbackStorage.createComparableSale.bind(fallbackStorage),
    getMarketHeatMapData: fallbackStorage.getMarketHeatMapData.bind(fallbackStorage),
    getMarketHeatMapDataByZip: fallbackStorage.getMarketHeatMapDataByZip.bind(fallbackStorage),
    createMarketHeatMapData: fallbackStorage.createMarketHeatMapData.bind(fallbackStorage),
    updateMarketHeatMapData: fallbackStorage.updateMarketHeatMapData.bind(fallbackStorage),
    
    // Advanced Filtering & Search methods
    getSavedFilters: fallbackStorage.getSavedFilters.bind(fallbackStorage),
    getSavedFilter: fallbackStorage.getSavedFilter.bind(fallbackStorage),
    createSavedFilter: fallbackStorage.createSavedFilter.bind(fallbackStorage),
    updateSavedFilter: fallbackStorage.updateSavedFilter.bind(fallbackStorage),
    deleteSavedFilter: fallbackStorage.deleteSavedFilter.bind(fallbackStorage),
    incrementFilterUsage: fallbackStorage.incrementFilterUsage.bind(fallbackStorage),
    searchNaturalLanguage: fallbackStorage.searchNaturalLanguage.bind(fallbackStorage),
    getSearchHistory: fallbackStorage.getSearchHistory.bind(fallbackStorage),
    getPropertyClassification: fallbackStorage.getPropertyClassification.bind(fallbackStorage),
    createPropertyClassification: fallbackStorage.createPropertyClassification.bind(fallbackStorage),
    updatePropertyClassification: fallbackStorage.updatePropertyClassification.bind(fallbackStorage),
    searchProperties: fallbackStorage.searchProperties.bind(fallbackStorage),
    
    // AI Recommendations methods
    getSmartPropertyRecommendations: fallbackStorage.getSmartPropertyRecommendations.bind(fallbackStorage),
    createSmartPropertyRecommendation: fallbackStorage.createSmartPropertyRecommendation.bind(fallbackStorage),
    getRentPricingRecommendation: fallbackStorage.getRentPricingRecommendation.bind(fallbackStorage),
    createRentPricingRecommendation: fallbackStorage.createRentPricingRecommendation.bind(fallbackStorage),
    updateRentPricingRecommendation: fallbackStorage.updateRentPricingRecommendation.bind(fallbackStorage),
    getInvestmentTimingAdvice: fallbackStorage.getInvestmentTimingAdvice.bind(fallbackStorage),
    createInvestmentTimingAdvice: fallbackStorage.createInvestmentTimingAdvice.bind(fallbackStorage),
    updateInvestmentTimingAdvice: fallbackStorage.updateInvestmentTimingAdvice.bind(fallbackStorage),
    
    // Templates & Presets methods
    getAnalysisTemplates: fallbackStorage.getAnalysisTemplates.bind(fallbackStorage),
    getAnalysisTemplate: fallbackStorage.getAnalysisTemplate.bind(fallbackStorage),
    createAnalysisTemplate: fallbackStorage.createAnalysisTemplate.bind(fallbackStorage),
    updateAnalysisTemplate: fallbackStorage.updateAnalysisTemplate.bind(fallbackStorage),
    deleteAnalysisTemplate: fallbackStorage.deleteAnalysisTemplate.bind(fallbackStorage),
    getDefaultTemplates: fallbackStorage.getDefaultTemplates.bind(fallbackStorage),
    
    // API Integration methods
    createApiIntegration: fallbackStorage.createApiIntegration.bind(fallbackStorage),
    getUserApiIntegrations: fallbackStorage.getUserApiIntegrations.bind(fallbackStorage),
    getApiIntegration: fallbackStorage.getApiIntegration.bind(fallbackStorage),
    updateApiIntegration: fallbackStorage.updateApiIntegration.bind(fallbackStorage),
    deleteApiIntegration: fallbackStorage.deleteApiIntegration.bind(fallbackStorage),
    
    // Photo Analysis methods
    getPhotoAnalyses: fallbackStorage.getPhotoAnalyses.bind(fallbackStorage),
    getPhotoAnalysis: fallbackStorage.getPhotoAnalysis.bind(fallbackStorage),
    createPhotoAnalysis: fallbackStorage.createPhotoAnalysis.bind(fallbackStorage),
    deletePhotoAnalysis: fallbackStorage.deletePhotoAnalysis.bind(fallbackStorage),
  };
}
