import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create a new email deal
export const create = mutation({
  args: {
    gmailId: v.string(),
    subject: v.string(),
    sender: v.string(),
    receivedDate: v.number(),
    emailContent: v.string(),
    contentHash: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("analyzed"),
      v.literal("archived"),
      v.literal("pending"),
      v.literal("interested"),
      v.literal("not_interested")
    )),
    extractedProperty: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Temporarily use hardcoded userId until auth is fully configured
    const userId = "temp-user-id";
    // const userId = await getAuthUserId(ctx);
    // if (!userId) {
    //   throw new Error("Not authenticated");
    // }

    // Check if email deal already exists by Gmail ID for this user
    const existing = await ctx.db
      .query("emailDeals")
      .withIndex("by_gmail_id", (q) => q.eq("gmailId", args.gmailId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Check for duplicate by content hash if provided for this user
    if (args.contentHash) {
      const duplicate = await ctx.db
        .query("emailDeals")
        .withIndex("by_content_hash", (q) => q.eq("contentHash", args.contentHash))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();

      if (duplicate) {
        return duplicate._id;
      }
    }

    const emailDeal = await ctx.db.insert("emailDeals", {
      userId,
      gmailId: args.gmailId,
      subject: args.subject,
      sender: args.sender,
      receivedDate: args.receivedDate,
      emailContent: args.emailContent,
      contentHash: args.contentHash,
      status: args.status || "new",
      extractedProperty: args.extractedProperty,
    });

    return emailDeal;
  },
});

// Get all email deals for the current user
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("analyzed"),
      v.literal("archived"),
      v.literal("pending"),
      v.literal("interested"),
      v.literal("not_interested")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Temporarily use hardcoded userId until auth is fully configured
    const userId = "temp-user-id";
    // const userId = await getAuthUserId(ctx);
    // if (!userId) {
    //   throw new Error("Not authenticated");
    // }

    let query = ctx.db.query("emailDeals").withIndex("by_user_id", (q) => q.eq("userId", userId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const deals = await query
      .order("desc")
      .take(args.limit || 100);

    return deals;
  },
});

// Get email deal by Gmail ID
export const getByGmailId = query({
  args: { gmailId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailDeals")
      .withIndex("by_gmail_id", (q) => q.eq("gmailId", args.gmailId))
      .first();
  },
});

// Get email deal by ID
export const getById = query({
  args: { id: v.id("emailDeals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update email deal
export const update = mutation({
  args: {
    id: v.id("emailDeals"),
    updates: v.object({
      subject: v.optional(v.string()),
      sender: v.optional(v.string()),
      emailContent: v.optional(v.string()),
      status: v.optional(v.union(
        v.literal("new"),
        v.literal("reviewed"),
        v.literal("analyzed"),
        v.literal("archived"),
        v.literal("pending"),
        v.literal("interested"),
        v.literal("not_interested")
      )),
      extractedProperty: v.optional(v.any()),
      analysisId: v.optional(v.id("dealAnalyses")),
    }),
  },
  handler: async (ctx, args) => {
    const { id, updates } = args;
    
    // Check if email deal exists
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Email deal not found");
    }

    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

// Update email deal status
export const updateStatus = mutation({
  args: {
    id: v.id("emailDeals"),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("analyzed"),
      v.literal("archived"),
      v.literal("pending"),
      v.literal("interested"),
      v.literal("not_interested")
    ),
  },
  handler: async (ctx, args) => {
    const { id, status } = args;
    
    // Check if email deal exists
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Email deal not found");
    }

    await ctx.db.patch(id, { status });
    return await ctx.db.get(id);
  },
});

// Delete email deal
export const remove = mutation({
  args: { id: v.id("emailDeals") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Email deal not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Find email deal by content hash
export const findByContentHash = query({
  args: { contentHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailDeals")
      .withIndex("by_content_hash", (q) => q.eq("contentHash", args.contentHash))
      .first();
  },
});

// Bulk create email deals (for Gmail sync)
export const bulkCreate = mutation({
  args: {
    deals: v.array(v.object({
      gmailId: v.string(),
      subject: v.string(),
      sender: v.string(),
      receivedDate: v.number(),
      emailContent: v.string(),
      contentHash: v.optional(v.string()),
      status: v.optional(v.union(
        v.literal("new"),
        v.literal("reviewed"),
        v.literal("analyzed"),
        v.literal("archived"),
        v.literal("pending"),
        v.literal("interested"),
        v.literal("not_interested")
      )),
      extractedProperty: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    // Temporarily use hardcoded userId until auth is fully configured
    const userId = "temp-user-id";
    // const userId = await getAuthUserId(ctx);
    // if (!userId) {
    //   throw new Error("Not authenticated");
    // }
    
    const results = [];
    
    for (const deal of args.deals) {
      // Check if email deal already exists by Gmail ID
      const existing = await ctx.db
        .query("emailDeals")
        .withIndex("by_gmail_id", (q) => q.eq("gmailId", deal.gmailId))
        .first();

      if (existing) {
        results.push({ gmailId: deal.gmailId, id: existing._id, created: false });
        continue;
      }

      // Check for duplicate by content hash if provided
      if (deal.contentHash) {
        const duplicate = await ctx.db
          .query("emailDeals")
          .withIndex("by_content_hash", (q) => q.eq("contentHash", deal.contentHash))
          .first();

        if (duplicate) {
          results.push({ gmailId: deal.gmailId, id: duplicate._id, created: false });
          continue;
        }
      }

      const emailDealId = await ctx.db.insert("emailDeals", {
        userId,
        gmailId: deal.gmailId,
        subject: deal.subject,
        sender: deal.sender,
        receivedDate: deal.receivedDate,
        emailContent: deal.emailContent,
        contentHash: deal.contentHash,
        status: deal.status || "new",
        extractedProperty: deal.extractedProperty,
      });

      results.push({ gmailId: deal.gmailId, id: emailDealId, created: true });
    }

    return results;
  },
});
