import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create a new deal analysis
export const createAnalysis = mutation({
  args: {
    property: v.object({
      id: v.optional(v.string()),
      address: v.string(),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
      purchasePrice: v.number(),
      monthlyRent: v.optional(v.number()),
      bedrooms: v.optional(v.number()),
      bathrooms: v.optional(v.number()),
      squareFootage: v.optional(v.number()),
      yearBuilt: v.optional(v.number()),
      propertyType: v.optional(v.union(
        v.literal("single-family"),
        v.literal("multi-family"),
        v.literal("condo"),
        v.literal("townhouse"),
        v.literal("duplex"),
        v.literal("commercial")
      )),
      adr: v.optional(v.number()),
      occupancyRate: v.optional(v.number()),
    }),
    monthlyIncome: v.number(),
    monthlyExpenses: v.number(),
    cashFlow: v.number(),
    cocReturn: v.number(),
    capRate: v.number(),
    totalCashNeeded: v.number(),
    meetsCriteria: v.boolean(),
    criteria: v.object({
      strategy: v.union(
        v.literal("conservative"),
        v.literal("moderate"),
        v.literal("aggressive"),
        v.literal("brrrr")
      ),
      targetCoCReturn: v.number(),
      targetCapRate: v.number(),
      maxLoanToValue: v.number(),
      vacancyRate: v.number(),
      maintenanceRate: v.number(),
      managementRate: v.number(),
      expectedAppreciation: v.number(),
    }),
    aiAnalysis: v.optional(v.object({
      summary: v.string(),
      pros: v.array(v.string()),
      cons: v.array(v.string()),
      riskLevel: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high")
      ),
      recommendedAction: v.union(
        v.literal("buy"),
        v.literal("pass"),
        v.literal("investigate")
      ),
      confidence: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Temporarily use hardcoded userId until auth is fully configured
    const userId = "temp-user-id";
    // const userId = await getAuthUserId(ctx);
    // if (!userId) {
    //   throw new Error("Not authenticated");
    // }
    
    const analysisId = await ctx.db.insert("dealAnalyses", {
      ...args,
      userId,
      analysisDate: Date.now(),
    });

    return analysisId;
  },
});

// Get all deal analyses
export const listAnalyses = query({
  args: {
    meetsCriteria: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let analyses;

    if (args.meetsCriteria !== undefined) {
      analyses = await ctx.db
        .query("dealAnalyses")
        .withIndex("by_meets_criteria", (q) => q.eq("meetsCriteria", args.meetsCriteria!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      analyses = await ctx.db
        .query("dealAnalyses")
        .withIndex("by_analysis_date")
        .order("desc")
        .take(args.limit || 50);
    }

    return analyses;
  },
});

// Get analysis by ID
export const getAnalysis = query({
  args: { id: v.id("dealAnalyses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update analysis
export const updateAnalysis = mutation({
  args: {
    id: v.id("dealAnalyses"),
    updates: v.object({
      property: v.optional(v.any()),
      monthlyIncome: v.optional(v.number()),
      monthlyExpenses: v.optional(v.number()),
      cashFlow: v.optional(v.number()),
      cocReturn: v.optional(v.number()),
      capRate: v.optional(v.number()),
      totalCashNeeded: v.optional(v.number()),
      meetsCriteria: v.optional(v.boolean()),
      criteria: v.optional(v.any()),
      aiAnalysis: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const { id, updates } = args;
    
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Analysis not found");
    }

    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

// Delete analysis
export const deleteAnalysis = mutation({
  args: { id: v.id("dealAnalyses") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Analysis not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Create photo analysis
export const createPhotoAnalysis = mutation({
  args: {
    propertyId: v.string(),
    photoUrl: v.string(),
    aiScore: v.optional(v.number()),
    aiCategory: v.optional(v.union(
      v.literal("excellent"),
      v.literal("good"),
      v.literal("fair"),
      v.literal("poor")
    )),
    aiReasoning: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    issues: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const photoAnalysisId = await ctx.db.insert("photoAnalyses", {
      ...args,
      analysisDate: Date.now(),
    });

    return photoAnalysisId;
  },
});

// Get photo analyses for a property
export const getPhotoAnalyses = query({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("photoAnalyses")
      .withIndex("by_property_id", (q) => q.eq("propertyId", args.propertyId))
      .order("desc")
      .collect();
  },
});

// Update photo analysis
export const updatePhotoAnalysis = mutation({
  args: {
    id: v.id("photoAnalyses"),
    updates: v.object({
      aiScore: v.optional(v.number()),
      aiCategory: v.optional(v.union(
        v.literal("excellent"),
        v.literal("good"),
        v.literal("fair"),
        v.literal("poor")
      )),
      aiReasoning: v.optional(v.string()),
      features: v.optional(v.array(v.string())),
      issues: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const { id, updates } = args;
    
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Photo analysis not found");
    }

    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

// Create property comparison
export const createComparison = mutation({
  args: {
    name: v.string(),
    propertyIds: v.array(v.id("dealAnalyses")),
  },
  handler: async (ctx, args) => {
    const comparisonId = await ctx.db.insert("propertyComparisons", {
      name: args.name,
      propertyIds: args.propertyIds,
      createdAt: Date.now(),
    });

    return comparisonId;
  },
});

// Get property comparisons
export const getComparisons = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("propertyComparisons")
      .withIndex("by_created_at")
      .order("desc")
      .take(args.limit || 20);
  },
});

// Search analyses by address
export const searchByAddress = query({
  args: { 
    address: v.string(),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query("dealAnalyses")
      .withIndex("by_address", (q) => q.eq("property.address", args.address))
      .take(args.limit || 10);

    return analyses;
  },
});
