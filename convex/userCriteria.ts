"use node";

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { CriteriaResponse } from "../shared/schema";

// Default criteria (same as in criteria-service.ts)
const DEFAULT_CRITERIA = {
  property_types: ["Single Family", "Multi-Family", "Condo"],
  location: "Any",
  max_purchase_price: 500000,
  downpayment_percentage_min: 0.20,
  downpayment_percentage_max: 0.25,
  closing_costs_percentage_min: 0.02,
  closing_costs_percentage_max: 0.05,
  initial_fixed_costs_percentage: 0.01,
  maintenance_reserve_percentage: 0.10,
  coc_benchmark_min: 0.08,
  coc_benchmark_max: 0.30,
  coc_minimum_min: 0.06,
  coc_minimum_max: 0.15,
  cap_benchmark_min: 0.05,
  cap_benchmark_max: 0.15,
  cap_minimum: 0.04,
  str_adr_minimum: 100,
  str_occupancy_rate_minimum: 0.60,
  str_gross_yield_minimum: 0.08,
  str_annual_revenue_minimum: 20000,
} as const;

export const getCriteria = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userCriteria = await ctx.db
      .query("userCriteria")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!userCriteria) {
      // Return default criteria if user hasn't set custom criteria
      return null;
    }

    // Convert to CriteriaResponse format
    return {
      property_types: DEFAULT_CRITERIA.property_types,
      location: DEFAULT_CRITERIA.location,
      max_purchase_price: userCriteria.max_purchase_price,
      downpayment_percentage_min: DEFAULT_CRITERIA.downpayment_percentage_min,
      downpayment_percentage_max: DEFAULT_CRITERIA.downpayment_percentage_max,
      closing_costs_percentage_min: DEFAULT_CRITERIA.closing_costs_percentage_min,
      closing_costs_percentage_max: DEFAULT_CRITERIA.closing_costs_percentage_max,
      initial_fixed_costs_percentage: DEFAULT_CRITERIA.initial_fixed_costs_percentage,
      maintenance_reserve_percentage: DEFAULT_CRITERIA.maintenance_reserve_percentage,
      coc_minimum_min: userCriteria.coc_minimum_min,
      coc_minimum_max: userCriteria.coc_minimum_max,
      coc_benchmark_min: userCriteria.coc_benchmark_min,
      coc_benchmark_max: userCriteria.coc_benchmark_max,
      cap_minimum: userCriteria.cap_minimum,
      cap_benchmark_min: userCriteria.cap_benchmark_min,
      cap_benchmark_max: userCriteria.cap_benchmark_max,
      str_adr_minimum: DEFAULT_CRITERIA.str_adr_minimum,
      str_occupancy_rate_minimum: DEFAULT_CRITERIA.str_occupancy_rate_minimum,
      str_gross_yield_minimum: DEFAULT_CRITERIA.str_gross_yield_minimum,
      str_annual_revenue_minimum: DEFAULT_CRITERIA.str_annual_revenue_minimum,
    } as CriteriaResponse;
  },
});

export const updateCriteria = mutation({
  args: {
    userId: v.string(),
    max_purchase_price: v.number(),
    coc_minimum_min: v.number(),
    coc_minimum_max: v.number(),
    coc_benchmark_min: v.number(),
    coc_benchmark_max: v.number(),
    cap_minimum: v.number(),
    cap_benchmark_min: v.number(),
    cap_benchmark_max: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userCriteria")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing criteria
      await ctx.db.patch(existing._id, {
        max_purchase_price: args.max_purchase_price,
        coc_minimum_min: args.coc_minimum_min,
        coc_minimum_max: args.coc_minimum_max,
        coc_benchmark_min: args.coc_benchmark_min,
        coc_benchmark_max: args.coc_benchmark_max,
        cap_minimum: args.cap_minimum,
        cap_benchmark_min: args.cap_benchmark_min,
        cap_benchmark_max: args.cap_benchmark_max,
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    } else {
      // Create new criteria
      const id = await ctx.db.insert("userCriteria", {
        userId: args.userId,
        max_purchase_price: args.max_purchase_price,
        coc_minimum_min: args.coc_minimum_min,
        coc_minimum_max: args.coc_minimum_max,
        coc_benchmark_min: args.coc_benchmark_min,
        coc_benchmark_max: args.coc_benchmark_max,
        cap_minimum: args.cap_minimum,
        cap_benchmark_min: args.cap_benchmark_min,
        cap_benchmark_max: args.cap_benchmark_max,
        updatedAt: now,
      });
      return await ctx.db.get(id);
    }
  },
});

