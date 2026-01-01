import { z } from "zod";

// Funding source types with associated down payment percentages
export const fundingSourceSchema = z.enum(['conventional', 'fha', 'va', 'dscr', 'cash']);
export type FundingSource = z.infer<typeof fundingSourceSchema>;

export const FUNDING_SOURCE_DOWN_PAYMENTS: Record<FundingSource, number> = {
  conventional: 0.05,  // 5%
  fha: 0.035,          // 3.5%
  va: 0.00,            // 0%
  dscr: 0.20,          // 20%
  cash: 0.00,          // 0% (no mortgage)
};

// Property data schema
export const propertySchema = z.object({
  id: z.string().optional(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  propertyType: z.string(),
  purchasePrice: z.number(),
  monthlyRent: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  squareFootage: z.number(),
  lotSize: z.number().optional(), // Lot size in square feet
  yearBuilt: z.number(),
  description: z.string(),
  listingUrl: z.string(),
  imageUrls: z.array(z.string()).optional(),
  sourceLinks: z.array(z.object({
    url: z.string(),
    type: z.enum(['listing', 'company', 'external', 'other']),
    description: z.string().optional(),
  })).optional(),
  // Funding source
  fundingSource: fundingSourceSchema.optional().default('conventional'),
  // Short-term rental metrics
  adr: z.number().optional(), // Average Daily Rate
  occupancyRate: z.number().optional(), // As decimal (0.75 = 75%)
  // User-inputtable monthly expenses
  monthlyExpenses: z.object({
    propertyTaxes: z.number().optional(),
    insurance: z.number().optional(),
    utilities: z.number().optional(),
    management: z.number().optional(),
    maintenance: z.number().optional(),
    cleaning: z.number().optional(),
    supplies: z.number().optional(),
    other: z.number().optional(),
  }).optional(),
});

// Mortgage values schema for mortgage calculator input
export const mortgageValuesSchema = z.object({
  loanAmount: z.coerce.number().positive("Loan amount must be positive").finite("Loan amount must be a finite number"),
  loanTermYears: z.coerce.number().positive("Loan term must be positive").int("Loan term must be an integer").finite("Loan term must be a finite number"),
  monthlyPayment: z.coerce.number().positive("Monthly payment must be positive").finite("Monthly payment must be a finite number"),
});

// Insert schemas
export const insertPropertySchema = propertySchema.omit({ id: true });

// Export types
export type Property = z.infer<typeof propertySchema>;
export type MortgageValues = z.infer<typeof mortgageValuesSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
