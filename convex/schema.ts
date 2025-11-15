import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
// import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Include auth tables for user management (will add later)
  // ...authTables,
  
  messages: defineTable({
    author: v.string(),
    body: v.string(),
    createdAt: v.number(),
  })
    .index("by_author", ["author"]),
  
  emailDeals: defineTable({
    // User who owns this email deal
    userId: v.string(),
    // Gmail message ID (preserved from original)
    gmailId: v.string(),
    subject: v.string(),
    sender: v.string(),
    receivedDate: v.number(), // timestamp
    emailContent: v.string(),
    contentHash: v.optional(v.string()),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("analyzed"),
      v.literal("archived"),
      v.literal("pending"),
      v.literal("interested"),
      v.literal("not_interested")
    ),
    
    // Extracted property information
    extractedProperty: v.optional(v.object({
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      price: v.optional(v.number()),
      monthlyRent: v.optional(v.number()),
      bedrooms: v.optional(v.number()),
      bathrooms: v.optional(v.number()),
      sqft: v.optional(v.number()),
      
      // Short-term rental metrics
      adr: v.optional(v.number()), // Average Daily Rate
      occupancyRate: v.optional(v.number()), // As decimal (0.75 = 75%)
      
      imageUrls: v.optional(v.array(v.string())),
      sourceLinks: v.optional(v.array(v.object({
        url: v.string(),
        type: v.union(
          v.literal("listing"),
          v.literal("company"),
          v.literal("external"),
          v.literal("other")
        ),
        description: v.optional(v.string()),
        aiScore: v.optional(v.number()),
        aiCategory: v.optional(v.union(
          v.literal("excellent"),
          v.literal("good"),
          v.literal("fair"),
          v.literal("poor")
        )),
        aiReasoning: v.optional(v.string()),
      }))),
      imageScores: v.optional(v.array(v.object({
        url: v.string(),
        aiScore: v.optional(v.number()),
        aiCategory: v.optional(v.union(
          v.literal("excellent"),
          v.literal("good"),
          v.literal("fair"),
          v.literal("poor")
        )),
        aiReasoning: v.optional(v.string()),
      }))),
    })),
    
    // Analysis reference
    analysisId: v.optional(v.id("dealAnalyses")),
  })
    .index("by_user_id", ["userId"])
    .index("by_gmail_id", ["gmailId"])
    .index("by_content_hash", ["contentHash"])
    .index("by_status", ["status"])
    .index("by_received_date", ["receivedDate"]),

  dealAnalyses: defineTable({
    // User who owns this analysis
    userId: v.string(),
    // Property information
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
      
      // STR metrics
      adr: v.optional(v.number()),
      occupancyRate: v.optional(v.number()),
    }),
    
    // Financial analysis
    monthlyIncome: v.number(),
    monthlyExpenses: v.number(),
    cashFlow: v.number(),
    cocReturn: v.number(), // Cash-on-cash return
    capRate: v.number(), // Capitalization rate
    totalCashNeeded: v.number(),
    meetsCriteria: v.boolean(),
    
    // Investment criteria used
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
    
    // AI Analysis (optional)
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
      confidence: v.number(), // 0-1
    })),
    
    analysisDate: v.number(), // timestamp
  })
    .index("by_user_id", ["userId"])
    .index("by_address", ["property.address"])
    .index("by_analysis_date", ["analysisDate"])
    .index("by_meets_criteria", ["meetsCriteria"])
    .index("by_cash_flow", ["cashFlow"])
    .index("by_coc_return", ["cocReturn"]),

  properties: defineTable({
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
  })
    .index("by_address", ["address"])
    .index("by_city_state", ["city", "state"]),

  propertyComparisons: defineTable({
    name: v.string(),
    propertyIds: v.array(v.id("dealAnalyses")),
    createdAt: v.number(),
  })
    .index("by_created_at", ["createdAt"]),

  neighborhoodTrends: defineTable({
    neighborhood: v.string(),
    city: v.string(),
    state: v.string(),
    averagePrice: v.number(),
    priceChangePercent3Month: v.number(),
    priceChangePercent6Month: v.number(),
    priceChangePercent1Year: v.number(),
    averageRent: v.number(),
    rentChangePercent3Month: v.number(),
    rentChangePercent6Month: v.number(),
    rentChangePercent1Year: v.number(),
    daysOnMarket: v.number(),
    pricePerSqft: v.number(),
    rentYield: v.number(),
    marketHeat: v.union(
      v.literal("hot"),
      v.literal("warm"),
      v.literal("balanced"),
      v.literal("cool")
    ),
    lastUpdated: v.number(),
  })
    .index("by_city_state", ["city", "state"])
    .index("by_last_updated", ["lastUpdated"]),

  comparableSales: defineTable({
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    salePrice: v.number(),
    pricePerSqft: v.number(),
    bedrooms: v.number(),
    bathrooms: v.number(),
    squareFootage: v.number(),
    yearBuilt: v.optional(v.number()),
    propertyType: v.string(),
    saleDate: v.number(),
    distance: v.optional(v.number()), // miles from subject property
    createdAt: v.number(),
  })
    .index("by_city_state", ["city", "state"])
    .index("by_sale_date", ["saleDate"]),

  marketHeatMapData: defineTable({
    zipCode: v.string(),
    city: v.string(),
    state: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    heatLevel: v.union(
      v.literal("very_hot"),
      v.literal("hot"),
      v.literal("warm"),
      v.literal("balanced"),
      v.literal("cool")
    ),
    averagePrice: v.number(),
    priceChangePercent: v.number(),
    averageRent: v.number(),
    rentChangePercent: v.number(),
    investmentScore: v.number(), // 0-100
    dealVolume: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_zip_code", ["zipCode"])
    .index("by_city_state", ["city", "state"])
    .index("by_investment_score", ["investmentScore"]),

  savedFilters: defineTable({
    name: v.string(),
    description: v.string(),
    filterCriteria: v.any(), // JSON object with filter parameters
    isSystem: v.optional(v.boolean()),
    usageCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_usage_count", ["usageCount"])
    .index("by_created_at", ["createdAt"]),

  searchHistory: defineTable({
    query: v.string(),
    parsedCriteria: v.any(), // JSON object
    resultCount: v.number(),
    searchDate: v.number(),
  })
    .index("by_search_date", ["searchDate"]),

  photoAnalyses: defineTable({
    propertyId: v.string(),
    photoUrl: v.string(),
    analysisDate: v.number(),
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
  })
    .index("by_property_id", ["propertyId"])
    .index("by_analysis_date", ["analysisDate"]),

  userOAuthTokens: defineTable({
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    scope: v.optional(v.string()),
    expiryDate: v.optional(v.number()), // timestamp
    tokenType: v.optional(v.string()),
    updatedAt: v.number(), // timestamp
  })
    .index("by_user_id", ["userId"]),

  emailPreferences: defineTable({
    userId: v.string(),
    notifyOnNewDeals: v.boolean(),
    notifyOnAnalysisComplete: v.boolean(),
    notifyOnCriteriaMatch: v.boolean(),
    notifyOnWeeklySummary: v.boolean(),
    frequency: v.union(
      v.literal("immediate"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    email: v.string(),
  })
    .index("by_user_id", ["userId"]),

  userCriteria: defineTable({
    userId: v.string(),
    max_purchase_price: v.number(),
    coc_minimum_min: v.number(),
    coc_minimum_max: v.number(),
    coc_benchmark_min: v.number(),
    coc_benchmark_max: v.number(),
    cap_minimum: v.number(),
    cap_benchmark_min: v.number(),
    cap_benchmark_max: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"]),
});
