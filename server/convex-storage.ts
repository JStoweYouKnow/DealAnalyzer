import { ConvexHttpClient } from "convex/browser";
import { EmailDeal, PhotoAnalysis, DealAnalysis } from "@shared/schema";
import { IStorage } from "./storage";

// Conditional imports for Convex API - only when generated files exist
let api: any = null;

// Use dynamic imports to avoid Webpack resolution issues
let convexInitialized = false;

async function initializeConvex() {
  if (convexInitialized || !process.env.NEXT_PUBLIC_CONVEX_URL) {
    return convexInitialized;
  }

  try {
    // Try importing the generated API file - handle both .js and .ts extensions
    // Using dynamic imports with relative paths that work in both Node.js and Next.js
    let apiModule;
    try {
      apiModule = await import('../convex/_generated/api.js');
    } catch (jsError) {
      // Fallback: try without extension (TypeScript/ESM resolution)
      try {
        apiModule = await import('../convex/_generated/api');
      } catch (tsError) {
        throw new Error(`Convex API not found. JS error: ${jsError}, TS error: ${tsError}`);
      }
    }
    
    if (!apiModule || !apiModule.api) {
      throw new Error('Convex API module loaded but api object is missing');
    }
    
    api = apiModule.api;
    convexInitialized = true;
    console.log("Convex API initialized successfully");
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("Convex generated files not found. Using fallback storage.", errorMessage);
    return false;
  }
}

// Storage interface using Convex
export interface ConvexStorage {
  // Email Deals
  getEmailDeals(): Promise<EmailDeal[]>;
  getEmailDeal(id: string): Promise<EmailDeal | null>;
  createEmailDeal(deal: Omit<EmailDeal, 'createdAt' | 'updatedAt'> | Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDeal>;
  updateEmailDeal(id: string, updates: Partial<EmailDeal>): Promise<EmailDeal>;
  deleteEmailDeal(id: string): Promise<void>;
  findEmailDealByContentHash(contentHash: string): Promise<EmailDeal | null>;
  bulkCreateEmailDeals(deals: Omit<EmailDeal, 'createdAt' | 'updatedAt'>[]): Promise<EmailDeal[]>;

  // Property Analyses
  getPropertyAnalyses(): Promise<DealAnalysis[]>;
  getDealAnalysis(id: string): Promise<DealAnalysis | null>;
  createDealAnalysis(analysis: Omit<DealAnalysis, 'id' | 'createdAt' | 'updatedAt'>): Promise<DealAnalysis>;
  updateDealAnalysis(id: string, updates: Partial<DealAnalysis>): Promise<DealAnalysis>;
  deleteDealAnalysis(id: string): Promise<void>;

  // Photo Analyses
  getPhotoAnalyses(propertyId: string): Promise<PhotoAnalysis[]>;
  createPhotoAnalysis(analysis: Omit<PhotoAnalysis, 'id' | 'createdAt' | 'updatedAt'>): Promise<PhotoAnalysis>;
  updatePhotoAnalysis(id: string, updates: Partial<PhotoAnalysis>): Promise<PhotoAnalysis>;
  deletePhotoAnalysis(id: string): Promise<void>;
}

class ConvexStorageImpl implements ConvexStorage {
  private convex: ConvexHttpClient;
  private initPromise: Promise<boolean>;

  constructor() {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is required for Convex storage");
    }
    
    // Validate URL format
    try {
      new URL(convexUrl);
    } catch {
      throw new Error(`Invalid NEXT_PUBLIC_CONVEX_URL format: ${convexUrl}`);
    }
    
    this.convex = new ConvexHttpClient(convexUrl);
    this.initPromise = initializeConvex();
    console.log(`ConvexStorage initialized with URL: ${convexUrl.substring(0, 30)}...`);
  }

  private async ensureInitialized() {
    const initialized = await this.initPromise;
    if (!initialized || !api) {
      throw new Error("Convex API not available. Using fallback storage.");
    }
  }

  // Email Deals Implementation
  async getEmailDeals(): Promise<EmailDeal[]> {
    await this.ensureInitialized();
    const deals = await this.convex.query(api.emailDeals.list, {});
    return deals.map(this.mapConvexEmailDealToEmailDeal);
  }

  async getEmailDeal(id: string): Promise<EmailDeal | null> {
    await this.ensureInitialized();
    // First try to get by Gmail ID (for backward compatibility)
    let deal = await this.convex.query(api.emailDeals.getByGmailId, { gmailId: id });
    
    // If not found by Gmail ID, try by Convex ID
    if (!deal && id.startsWith("k")) {
      deal = await this.convex.query(api.emailDeals.getById, { id: id as any });
    }

    return deal ? this.mapConvexEmailDealToEmailDeal(deal) : null;
  }

  async createEmailDeal(deal: Omit<EmailDeal, 'createdAt' | 'updatedAt'> | Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDeal> {
    await this.ensureInitialized();
    const gmailId = 'id' in deal ? deal.id : `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const convexDeal = {
      gmailId,
      subject: deal.subject,
      sender: deal.sender,
      receivedDate: new Date(deal.receivedDate).getTime(),
      emailContent: deal.emailContent,
      contentHash: deal.contentHash,
      status: deal.status as any,
      extractedProperty: deal.extractedProperty,
    };

    const dealId = await this.convex.mutation(api.emailDeals.create, convexDeal);
    const createdDeal = await this.convex.query(api.emailDeals.getById, { id: dealId });
    
    if (!createdDeal) {
      throw new Error("Failed to create email deal");
    }

    return this.mapConvexEmailDealToEmailDeal(createdDeal);
  }

  async updateEmailDeal(id: string, updates: Partial<EmailDeal>): Promise<EmailDeal> {
    // Get the deal first to find the Convex ID
    const existingDeal = await this.getEmailDeal(id);
    if (!existingDeal) {
      throw new Error("Email deal not found");
    }

    // Find the Convex deal to get the internal ID
    let convexDeal = await this.convex.query(api.emailDeals.getByGmailId, { gmailId: id });
    if (!convexDeal && id.startsWith("k")) {
      convexDeal = await this.convex.query(api.emailDeals.getById, { id: id as any });
    }

    if (!convexDeal) {
      throw new Error("Email deal not found in Convex");
    }

    const convexUpdates: any = {};
    if (updates.subject !== undefined) convexUpdates.subject = updates.subject;
    if (updates.sender !== undefined) convexUpdates.sender = updates.sender;
    if (updates.emailContent !== undefined) convexUpdates.emailContent = updates.emailContent;
    if (updates.status !== undefined) convexUpdates.status = updates.status;
    if (updates.extractedProperty !== undefined) convexUpdates.extractedProperty = updates.extractedProperty;

    const updatedDeal = await this.convex.mutation(api.emailDeals.update, {
      id: convexDeal._id,
      updates: convexUpdates,
    });

    return this.mapConvexEmailDealToEmailDeal(updatedDeal!);
  }

  async deleteEmailDeal(id: string): Promise<void> {
    // Find the Convex deal to get the internal ID
    let convexDeal = await this.convex.query(api.emailDeals.getByGmailId, { gmailId: id });
    if (!convexDeal && id.startsWith("k")) {
      convexDeal = await this.convex.query(api.emailDeals.getById, { id: id as any });
    }

    if (!convexDeal) {
      throw new Error("Email deal not found");
    }

    await this.convex.mutation(api.emailDeals.remove, { id: convexDeal._id });
  }

  async findEmailDealByContentHash(contentHash: string): Promise<EmailDeal | null> {
    const deal = await this.convex.query(api.emailDeals.findByContentHash, { contentHash });
    return deal ? this.mapConvexEmailDealToEmailDeal(deal) : null;
  }

  async bulkCreateEmailDeals(deals: Omit<EmailDeal, 'createdAt' | 'updatedAt'>[]): Promise<EmailDeal[]> {
    const convexDeals = deals.map(deal => ({
      gmailId: deal.id,
      subject: deal.subject,
      sender: deal.sender,
      receivedDate: new Date(deal.receivedDate).getTime(),
      emailContent: deal.emailContent,
      contentHash: deal.contentHash,
      status: deal.status as any,
      extractedProperty: deal.extractedProperty,
    }));

    const results = await this.convex.mutation(api.emailDeals.bulkCreate, { deals: convexDeals });
    
    // Fetch the created deals
    const createdDeals = [];
    for (const result of results) {
      if (result.created) {
        const deal = await this.convex.query(api.emailDeals.getById, { id: result.id });
        if (deal) {
          createdDeals.push(this.mapConvexEmailDealToEmailDeal(deal));
        }
      }
    }

    return createdDeals;
  }

  // Property Analyses Implementation
  async getPropertyAnalyses(): Promise<DealAnalysis[]> {
    const analyses = await this.convex.query(api.properties.listAnalyses, {});
    return analyses.map(this.mapConvexAnalysisToDealAnalysis);
  }

  async getDealAnalysis(id: string): Promise<DealAnalysis | null> {
    const analysis = await this.convex.query(api.properties.getAnalysis, { id: id as any });
    return analysis ? this.mapConvexAnalysisToDealAnalysis(analysis) : null;
  }

  async createDealAnalysis(analysis: Omit<DealAnalysis, 'id' | 'createdAt' | 'updatedAt'>): Promise<DealAnalysis> {
    const convexAnalysis = {
      property: analysis.property,
      propertyId: analysis.propertyId,
      calculatedDownpayment: analysis.calculatedDownpayment,
      calculatedClosingCosts: analysis.calculatedClosingCosts,
      calculatedInitialFixedCosts: analysis.calculatedInitialFixedCosts,
      estimatedMaintenanceReserve: analysis.estimatedMaintenanceReserve,
      totalCashNeeded: analysis.totalCashNeeded,
      passes1PercentRule: analysis.passes1PercentRule,
      cashFlow: analysis.cashFlow,
      cashFlowPositive: analysis.cashFlowPositive,
      cocReturn: analysis.cocReturn,
      cocMeetsBenchmark: analysis.cocMeetsBenchmark,
      cocMeetsMinimum: analysis.cocMeetsMinimum,
      capRate: analysis.capRate,
      capMeetsBenchmark: analysis.capMeetsBenchmark,
      capMeetsMinimum: analysis.capMeetsMinimum,
      projectedAnnualRevenue: analysis.projectedAnnualRevenue,
      projectedGrossYield: analysis.projectedGrossYield,
      totalMonthlyExpenses: analysis.totalMonthlyExpenses,
      strNetIncome: analysis.strNetIncome,
      strMeetsCriteria: analysis.strMeetsCriteria,
      meetsCriteria: analysis.meetsCriteria,
      aiAnalysis: analysis.aiAnalysis,
    };

    const analysisId = await this.convex.mutation(api.properties.createAnalysis, convexAnalysis);
    const createdAnalysis = await this.convex.query(api.properties.getAnalysis, { id: analysisId });
    
    if (!createdAnalysis) {
      throw new Error("Failed to create property analysis");
    }

    return this.mapConvexAnalysisToDealAnalysis(createdAnalysis);
  }

  async updateDealAnalysis(id: string, updates: Partial<DealAnalysis>): Promise<DealAnalysis> {
    const updatedAnalysis = await this.convex.mutation(api.properties.updateAnalysis, {
      id: id as any,
      updates,
    });

    return this.mapConvexAnalysisToDealAnalysis(updatedAnalysis!);
  }

  async deleteDealAnalysis(id: string): Promise<void> {
    await this.convex.mutation(api.properties.deleteAnalysis, { id: id as any });
  }

  // Photo Analyses Implementation
  async getPhotoAnalyses(propertyId: string): Promise<PhotoAnalysis[]> {
    const analyses = await this.convex.query(api.properties.getPhotoAnalyses, { propertyId });
    return analyses.map(this.mapConvexPhotoAnalysisToPhotoAnalysis);
  }

  async createPhotoAnalysis(analysis: Omit<PhotoAnalysis, 'id' | 'createdAt' | 'updatedAt'>): Promise<PhotoAnalysis> {
    const analysisId = await this.convex.mutation(api.properties.createPhotoAnalysis, {
      propertyId: analysis.propertyId,
      filename: analysis.filename,
      url: analysis.url,
      aiScore: analysis.aiScore,
      qualityScore: analysis.qualityScore,
      compositionScore: analysis.compositionScore,
      lightingScore: analysis.lightingScore,
      propertyConditionScore: analysis.propertyConditionScore,
      insights: analysis.insights,
      suggestions: analysis.suggestions,
      tags: analysis.tags,
      roomType: analysis.roomType,
      marketability: analysis.marketability,
      analysisDate: analysis.analysisDate,
    });

    const createdAnalysis = await this.convex.query(api.properties.getPhotoAnalyses, { propertyId: analysis.propertyId });
    const newAnalysis = createdAnalysis.find((a: any) => a._id === analysisId);
    
    if (!newAnalysis) {
      throw new Error("Failed to create photo analysis");
    }

    return this.mapConvexPhotoAnalysisToPhotoAnalysis(newAnalysis);
  }

  async updatePhotoAnalysis(id: string, updates: Partial<PhotoAnalysis>): Promise<PhotoAnalysis> {
    const updatedAnalysis = await this.convex.mutation(api.properties.updatePhotoAnalysis, {
      id: id as any,
      updates: updates as any,
    });

    return this.mapConvexPhotoAnalysisToPhotoAnalysis(updatedAnalysis!);
  }

  async deletePhotoAnalysis(id: string): Promise<void> {
    // Note: No delete function implemented in Convex properties.ts yet
    throw new Error("Delete photo analysis not implemented");
  }

  // Mapping functions
  private mapConvexEmailDealToEmailDeal(convexDeal: any): EmailDeal {
    return {
      id: convexDeal.gmailId, // Use Gmail ID for backward compatibility
      subject: convexDeal.subject,
      sender: convexDeal.sender,
      receivedDate: new Date(convexDeal.receivedDate),
      emailContent: convexDeal.emailContent,
      contentHash: convexDeal.contentHash,
      status: convexDeal.status,
      extractedProperty: convexDeal.extractedProperty,
      createdAt: new Date(convexDeal._creationTime),
      updatedAt: new Date(convexDeal._creationTime), // Convex doesn't have updatedAt
    };
  }

  private mapConvexAnalysisToDealAnalysis(convexAnalysis: any): DealAnalysis {
    return {
      id: convexAnalysis._id,
      propertyId: convexAnalysis.propertyId,
      property: convexAnalysis.property,
      calculatedDownpayment: convexAnalysis.calculatedDownpayment,
      calculatedClosingCosts: convexAnalysis.calculatedClosingCosts,
      calculatedInitialFixedCosts: convexAnalysis.calculatedInitialFixedCosts,
      estimatedMaintenanceReserve: convexAnalysis.estimatedMaintenanceReserve,
      totalCashNeeded: convexAnalysis.totalCashNeeded,
      passes1PercentRule: convexAnalysis.passes1PercentRule,
      cashFlow: convexAnalysis.cashFlow,
      cashFlowPositive: convexAnalysis.cashFlowPositive,
      cocReturn: convexAnalysis.cocReturn,
      cocMeetsBenchmark: convexAnalysis.cocMeetsBenchmark,
      cocMeetsMinimum: convexAnalysis.cocMeetsMinimum,
      capRate: convexAnalysis.capRate,
      capMeetsBenchmark: convexAnalysis.capMeetsBenchmark,
      capMeetsMinimum: convexAnalysis.capMeetsMinimum,
      projectedAnnualRevenue: convexAnalysis.projectedAnnualRevenue,
      projectedGrossYield: convexAnalysis.projectedGrossYield,
      totalMonthlyExpenses: convexAnalysis.totalMonthlyExpenses,
      strNetIncome: convexAnalysis.strNetIncome,
      strMeetsCriteria: convexAnalysis.strMeetsCriteria,
      meetsCriteria: convexAnalysis.meetsCriteria,
      aiAnalysis: convexAnalysis.aiAnalysis,
      analysisDate: convexAnalysis.analysisDate ? new Date(convexAnalysis.analysisDate) : undefined,
    };
  }

  private mapConvexPhotoAnalysisToPhotoAnalysis(convexAnalysis: any): PhotoAnalysis {
    return {
      id: convexAnalysis._id,
      propertyId: convexAnalysis.propertyId,
      filename: convexAnalysis.filename,
      url: convexAnalysis.url,
      aiScore: convexAnalysis.aiScore,
      qualityScore: convexAnalysis.qualityScore,
      compositionScore: convexAnalysis.compositionScore,
      lightingScore: convexAnalysis.lightingScore,
      propertyConditionScore: convexAnalysis.propertyConditionScore,
      insights: convexAnalysis.insights,
      suggestions: convexAnalysis.suggestions,
      tags: convexAnalysis.tags,
      roomType: convexAnalysis.roomType,
      marketability: convexAnalysis.marketability,
      analysisDate: convexAnalysis.analysisDate,
    };
  }
}

// Create singleton instance with lazy initialization
let convexStorageInstance: ConvexStorage | null = null;
let convexStorageInitError: Error | null = null;

export const convexStorage = (() => {
  if (convexStorageInstance) {
    return convexStorageInstance;
  }
  
  if (convexStorageInitError) {
    throw convexStorageInitError;
  }
  
  try {
    console.log('[ConvexStorage] Creating new ConvexStorage instance');
    convexStorageInstance = new ConvexStorageImpl();
    return convexStorageInstance;
  } catch (error) {
    convexStorageInitError = error instanceof Error ? error : new Error(String(error));
    console.error('[ConvexStorage] Failed to create instance:', convexStorageInitError.message);
    throw convexStorageInitError;
  }
})();
