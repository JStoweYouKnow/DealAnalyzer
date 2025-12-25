import { ConvexHttpClient } from "convex/browser";
import { EmailDeal, PhotoAnalysis, DealAnalysis } from "@shared/schema";
import { IStorage } from "./storage";
import { logger } from "../app/lib/logger";

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
    logger.info("Convex API initialized successfully");
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
  getEmailDeals(userId?: string, includeArchived?: boolean): Promise<EmailDeal[]>;
  getEmailDeal(id: string): Promise<EmailDeal | null>;
  createEmailDeal(deal: Omit<EmailDeal, 'createdAt' | 'updatedAt'> | Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDeal>;
  updateEmailDeal(id: string, updates: Partial<EmailDeal>): Promise<EmailDeal>;
  deleteEmailDeal(id: string): Promise<void>;
  findEmailDealByContentHash(contentHash: string, userId?: string): Promise<EmailDeal | null>;
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
  private async getRequestUserId(): Promise<string> {
    // Try to resolve a user-scoped ID from Next.js request context
    try {
      // Prefer Clerk if available
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const clerk = require('@clerk/nextjs/server');
        if (clerk?.auth) {
          const res = await clerk.auth();
          const clerkUserId = res?.userId as string | undefined;
          if (clerkUserId && clerkUserId.trim().length > 0) {
            return clerkUserId;
          }
        }
      } catch {
        // Clerk not available; continue to headers/cookies
      }
      // Use dynamic require to avoid bundling issues in non-Next contexts
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nh = require('next/headers');
      if (nh?.headers) {
        const h = nh.headers();
        const headerUserId = h.get('x-user-id') || h.get('x-user-session-id');
        if (headerUserId && headerUserId.trim().length > 0) {
          return headerUserId;
        }
      }
      if (nh?.cookies) {
        const c = nh.cookies();
        const cookieUser = c.get('dealanalyzer_user_session_id')?.value;
        if (cookieUser && cookieUser.trim().length > 0) {
          return cookieUser;
        }
      }
    } catch {
      // Ignore - not in a Next.js request context
    }
    throw new Error("User context is required but was not found (missing Clerk session, header 'x-user-id', or cookie 'dealanalyzer_user_session_id').");
  }

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
    logger.info("ConvexStorage initialized", {
      urlPrefix: convexUrl.substring(0, 30),
    });
  }

  private async ensureInitialized() {
    const initialized = await this.initPromise;
    if (!initialized || !api) {
      throw new Error("Convex API not available. Using fallback storage.");
    }
  }

  // Email Deals Implementation
  async getEmailDeals(userId?: string, includeArchived: boolean = false): Promise<EmailDeal[]> {
    await this.ensureInitialized();
    // Use passed userId if available, otherwise try to get from request context
    const finalUserId = userId || await this.getRequestUserId();
    
    // Build query args - only include includeArchived if it's true to avoid schema issues
    const queryArgs: any = { userId: finalUserId };
    if (includeArchived) {
      queryArgs.includeArchived = true;
    }
    
    try {
      const deals = await this.convex.query(api.emailDeals.list, queryArgs);
      // Filter out archived deals client-side if not including archived
      // This provides backward compatibility if Convex schema doesn't support includeArchived yet
      const filteredDeals = includeArchived ? deals : deals.filter((deal: any) => deal.status !== 'archived');
      return filteredDeals.map(this.mapConvexEmailDealToEmailDeal);
    } catch (error: any) {
      // If query fails (e.g., Convex schema not updated), try without includeArchived
      if (error.message?.includes('includeArchived') || error.message?.includes('args') || error.message?.includes('Invalid argument')) {
        console.warn('Convex schema may not support includeArchived yet, trying without it and filtering client-side');
        const deals = await this.convex.query(api.emailDeals.list, { 
          userId: finalUserId
        });
        // Filter out archived deals client-side
        const filteredDeals = includeArchived ? deals : deals.filter((deal: any) => deal.status !== 'archived');
        return filteredDeals.map(this.mapConvexEmailDealToEmailDeal);
      }
      throw error;
    }
  }

  async getEmailDeal(id: string, userId?: string): Promise<EmailDeal | null> {
    await this.ensureInitialized();
    const effectiveUserId = userId || await this.getRequestUserId();
    
    console.log('[ConvexStorage] getEmailDeal called:', {
      id,
      idLength: id.length,
      idStartsWithK: id.startsWith('k'),
      effectiveUserId: effectiveUserId?.substring(0, 8) + '...',
      hasUserId: !!userId,
    });

    let deal: any = null;
    let lookupMethod = 'none';

    // Strategy 1: Try by Gmail ID first (for backward compatibility)
    // Gmail IDs are typically hex strings (like "19afb5cbc3b45326")
    if (!id.startsWith('k')) {
      try {
        console.log('[ConvexStorage] Attempting lookup by Gmail ID:', id);
        // Pass userId to filter results - this ensures we only get deals for this user
        deal = await this.convex.query(api.emailDeals.getByGmailId, { 
          gmailId: id,
          userId: effectiveUserId,
        });
        if (deal) {
          lookupMethod = 'gmailId';
          console.log('[ConvexStorage] ✅ Found deal by Gmail ID');
        } else {
          console.log('[ConvexStorage] ⚠️ Deal not found by Gmail ID (with userId filter)');
          // Try without userId filter as fallback (in case userId format differs)
          try {
            deal = await this.convex.query(api.emailDeals.getByGmailId, { gmailId: id });
            if (deal) {
              console.log('[ConvexStorage] ⚠️ Found deal by Gmail ID without userId filter - will check ownership');
              lookupMethod = 'gmailId-no-user-filter';
            }
          } catch (fallbackError) {
            // Ignore fallback errors
          }
        }
      } catch (error: any) {
        console.warn('[ConvexStorage] Error looking up by Gmail ID:', {
          error: error?.message || String(error),
        });
      }
    }

    // Strategy 2: Try by Convex ID if it starts with "k"
    if (!deal && id.startsWith("k")) {
      try {
        console.log('[ConvexStorage] Attempting lookup by Convex ID:', id);
        deal = await this.convex.query(api.emailDeals.getById, { id: id as any });
        if (deal) {
          lookupMethod = 'convexId';
          console.log('[ConvexStorage] ✅ Found deal by Convex ID');
        } else {
          console.log('[ConvexStorage] ⚠️ Deal not found by Convex ID');
        }
      } catch (error: any) {
        console.warn('[ConvexStorage] Error looking up by Convex ID:', {
          error: error?.message || String(error),
        });
      }
    }

    // Strategy 3: If still not found and ID doesn't start with "k", try as Convex ID anyway
    // (in case the ID format changed or was stored differently)
    if (!deal && !id.startsWith('k')) {
      try {
        console.log('[ConvexStorage] Attempting fallback lookup as Convex ID:', id);
        deal = await this.convex.query(api.emailDeals.getById, { id: id as any });
        if (deal) {
          lookupMethod = 'convexId-fallback';
          console.log('[ConvexStorage] ✅ Found deal by Convex ID (fallback)');
        }
      } catch (error: any) {
        // Expected to fail if ID is not a valid Convex ID format
        console.log('[ConvexStorage] Fallback Convex ID lookup failed (expected if not Convex ID)');
      }
    }

    if (!deal) {
      console.warn('[ConvexStorage] ❌ Deal not found with any lookup method');
      console.warn('[ConvexStorage] Tried methods: Gmail ID, Convex ID, Fallback');
      return null;
    }

    console.log('[ConvexStorage] Deal found via:', lookupMethod);
    console.log('[ConvexStorage] Deal userId:', deal.userId?.substring(0, 8) + '...');
    console.log('[ConvexStorage] Effective userId:', effectiveUserId?.substring(0, 8) + '...');

    // Enforce ownership
    if (deal && deal.userId !== effectiveUserId) {
      console.warn('[ConvexStorage] ❌ User ID mismatch - deal belongs to different user');
      console.warn('[ConvexStorage] Deal userId:', deal.userId);
      console.warn('[ConvexStorage] Request userId:', effectiveUserId);
      return null;
    }

    const mappedDeal = deal ? this.mapConvexEmailDealToEmailDeal(deal) : null;
    if (mappedDeal) {
      console.log('[ConvexStorage] ✅ Successfully mapped and returned deal');
      console.log('[ConvexStorage] Mapped deal ID:', mappedDeal.id);
    }
    return mappedDeal;
  }

  async createEmailDeal(deal: Omit<EmailDeal, 'createdAt' | 'updatedAt'> | Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDeal> {
    await this.ensureInitialized();
    const gmailId = 'id' in deal ? deal.id : `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Use userId from deal object if provided (for email sync), otherwise get from request context
    let userId: string;
    if ('userId' in deal && deal.userId) {
      userId = deal.userId;
    } else {
      userId = await this.getRequestUserId();
    }

    const convexDeal = {
      userId,
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

  async updateEmailDeal(id: string, updates: Partial<EmailDeal>, userId?: string): Promise<EmailDeal> {
    // Get the deal first to find the Convex ID
    const existingDeal = await this.getEmailDeal(id, userId);
    if (!existingDeal) {
      throw new Error("Email deal not found");
    }

    // Find the Convex deal to get the internal ID
    const effectiveUserId = userId || await this.getRequestUserId();
    let convexDeal = await this.convex.query(api.emailDeals.getByGmailId, { 
      gmailId: id,
      userId: effectiveUserId,
    });
    if (!convexDeal && id.startsWith("k")) {
      convexDeal = await this.convex.query(api.emailDeals.getById, { id: id as any });
    }
    // Fallback: try without userId filter if not found
    if (!convexDeal && !id.startsWith("k")) {
      convexDeal = await this.convex.query(api.emailDeals.getByGmailId, { gmailId: id });
    }

    // Enforce ownership
    const effectiveUserId = userId || await this.getRequestUserId();
    if (convexDeal && convexDeal.userId !== effectiveUserId) {
      throw new Error("Unauthorized: Cannot update email deal belonging to another user");
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

  async deleteEmailDeal(id: string, userId?: string): Promise<void> {
    // Find the Convex deal to get the internal ID
    const effectiveUserId = userId || await this.getRequestUserId();
    let convexDeal = await this.convex.query(api.emailDeals.getByGmailId, { 
      gmailId: id,
      userId: effectiveUserId,
    });
    if (!convexDeal && id.startsWith("k")) {
      convexDeal = await this.convex.query(api.emailDeals.getById, { id: id as any });
    }
    // Fallback: try without userId filter if not found
    if (!convexDeal && !id.startsWith("k")) {
      convexDeal = await this.convex.query(api.emailDeals.getByGmailId, { gmailId: id });
    }

    if (!convexDeal) {
      throw new Error("Email deal not found");
    }

    // Enforce ownership
    if (convexDeal.userId !== effectiveUserId) {
      throw new Error("Unauthorized: Cannot delete email deal belonging to another user");
    }
    await this.convex.mutation(api.emailDeals.remove, { id: convexDeal._id });
  }

  async findEmailDealByContentHash(contentHash: string, userId?: string): Promise<EmailDeal | null> {
    await this.ensureInitialized();

    // Use provided userId or get from request context
    const effectiveUserId = userId || await this.getRequestUserId();
    const deal = await this.convex.query(api.emailDeals.findByContentHash, { contentHash });

    // Enforce ownership
    if (deal && deal.userId !== effectiveUserId) {
      return null;
    }
    return deal ? this.mapConvexEmailDealToEmailDeal(deal) : null;
  }

  async bulkCreateEmailDeals(deals: Omit<EmailDeal, 'createdAt' | 'updatedAt'>[]): Promise<EmailDeal[]> {
    const userId = await this.getRequestUserId();
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

    const results = await this.convex.mutation(api.emailDeals.bulkCreate, { userId, deals: convexDeals });
    
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
    // Use Gmail ID if available, otherwise fall back to Convex ID
    // This ensures backward compatibility while supporting newer deals
    const dealId = convexDeal.gmailId || convexDeal._id;
    
    if (!convexDeal.gmailId && convexDeal._id) {
      console.log('[ConvexStorage] ⚠️ Deal missing gmailId, using Convex ID:', convexDeal._id);
    }
    
    return {
      id: dealId,
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
    logger.info("Creating new ConvexStorage instance");
    convexStorageInstance = new ConvexStorageImpl();
    return convexStorageInstance;
  } catch (error) {
    convexStorageInitError = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to create ConvexStorage instance", convexStorageInitError, {
      message: convexStorageInitError.message,
    });
    throw convexStorageInitError;
  }
})();
