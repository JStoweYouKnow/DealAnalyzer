import { v } from "convex/values";
import { query } from "./_generated/server";

// Get weekly digest data for a user
export const getWeeklyDigestData = query({
  args: {
    userId: v.string(),
    weeksAgo: v.optional(v.number()), // Default to 1 week
  },
  handler: async (ctx, args) => {
    const weeksAgo = args.weeksAgo || 1;
    const oneWeekAgo = Date.now() - (weeksAgo * 7 * 24 * 60 * 60 * 1000);

    // Get all analyses from the past week
    const allAnalyses = await ctx.db
      .query("dealAnalyses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("analysisDate"), oneWeekAgo))
      .collect();

    // Get analyses that meet criteria
    const passingAnalyses = allAnalyses.filter(a => a.meetsCriteria);

    // Sort by cash flow descending to get top deals
    const sortedAnalyses = [...allAnalyses].sort((a, b) => b.cashFlow - a.cashFlow);
    const topDeals = sortedAnalyses.slice(0, 5); // Top 5 deals

    // Calculate statistics
    const totalAnalyzed = allAnalyses.length;
    const dealsPassingCriteria = passingAnalyses.length;
    const averageCashFlow = totalAnalyzed > 0
      ? allAnalyses.reduce((sum, a) => sum + a.cashFlow, 0) / totalAnalyzed
      : 0;
    const averageCoC = totalAnalyzed > 0
      ? allAnalyses.reduce((sum, a) => sum + a.cocReturn, 0) / totalAnalyzed
      : 0;
    const averageCapRate = totalAnalyzed > 0
      ? allAnalyses.reduce((sum, a) => sum + a.capRate, 0) / totalAnalyzed
      : 0;

    return {
      topDeals: topDeals.map(deal => ({
        _id: deal._id,
        address: deal.property.address,
        price: deal.property.purchasePrice,
        cashFlow: deal.cashFlow,
        cocReturn: deal.cocReturn,
        capRate: deal.capRate,
        meetsCriteria: deal.meetsCriteria,
        analysisDate: deal.analysisDate,
      })),
      stats: {
        totalAnalyzed,
        dealsPassingCriteria,
        averageCashFlow,
        averageCoC,
        averageCapRate,
        passingRate: totalAnalyzed > 0 ? (dealsPassingCriteria / totalAnalyzed) * 100 : 0,
      },
      dateRange: {
        from: oneWeekAgo,
        to: Date.now(),
      },
    };
  },
});

// Get all users who should receive weekly digest
// In production, you'd have a users table with email preferences
export const getUsersForDigest = query({
  args: {},
  handler: async (ctx) => {
    // For now, get unique userIds from dealAnalyses
    // In production, query a users table with email_preferences.weeklyDigest = true
    const allAnalyses = await ctx.db
      .query("dealAnalyses")
      .collect();

    // Get unique userIds
    const userIds = [...new Set(allAnalyses.map(a => a.userId))];

    // In production, you'd fetch actual user records with emails
    // For now, return mock data
    return userIds.map(userId => ({
      userId,
      email: `user-${userId}@example.com`, // Replace with real email lookup
      userName: `User ${userId}`, // Replace with real name lookup
      preferences: {
        weeklyDigest: true,
        timezone: 'America/Los_Angeles',
      },
    }));
  },
});

// Get recent market insights for digest
export const getMarketInsights = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    // Get recent neighborhood trends
    const trends = await ctx.db
      .query("neighborhoodTrends")
      .withIndex("by_last_updated")
      .order("desc")
      .take(limit);

    return trends.map(trend => ({
      city: trend.city,
      state: trend.state,
      medianPrice: trend.averagePrice,
      priceChange: trend.priceChangePercent1Year,
      trend: trend.priceChangePercent1Year > 5 ? 'up' :
             trend.priceChangePercent1Year < -5 ? 'down' : 'stable',
      marketHeat: trend.marketHeat,
    }));
  },
});
