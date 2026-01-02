import { z } from "zod";
import { dealAnalysisSchema } from "./analysis.js";

// Email Deal schemas
export const emailDealStatus = z.enum(['new', 'reviewed', 'analyzed', 'archived']);

export const emailDealSchema = z.object({
  id: z.string(),
  subject: z.string(),
  sender: z.string(),
  receivedDate: z.date(),
  emailContent: z.string(),
  userId: z.string().optional(), // User ID for email forwarding
  extractedProperty: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    price: z.number().optional(),
    monthlyRent: z.number().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    sqft: z.number().optional(),
    // Short-term rental metrics
    adr: z.number().optional(), // Average Daily Rate
    occupancyRate: z.number().optional(), // As decimal (0.75 = 75%)
    imageUrls: z.array(z.string()).optional(),
    sourceLinks: z.array(z.object({
      url: z.string(),
      type: z.enum(['listing', 'company', 'external', 'other']),
      description: z.string().optional(),
      aiScore: z.number().optional(), // 0-10 AI quality score
      aiCategory: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      aiReasoning: z.string().optional(),
    })).optional(),
    imageScores: z.array(z.object({
      url: z.string(),
      aiScore: z.number().optional(), // 0-10 AI quality score
      aiCategory: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      aiReasoning: z.string().optional(),
    })).optional(),
  }).optional(),
  status: emailDealStatus,
  analysis: dealAnalysisSchema.optional(),
  contentHash: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const emailMonitoringResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(emailDealSchema).optional(),
  error: z.string().optional(),
});

// Export types
export type EmailDeal = z.infer<typeof emailDealSchema>;
export type EmailMonitoringResponse = z.infer<typeof emailMonitoringResponseSchema>;
