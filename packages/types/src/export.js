import { z } from "zod";
import { propertySchema } from "./property";
// Import/Export & BiggerPockets Integration schemas
export const biggerPocketsImportSchema = z.object({
    // Property Details
    propertyAddress: z.string(),
    propertyCity: z.string(),
    propertyState: z.string(),
    propertyZip: z.string().optional(),
    propertyType: z.string(),
    propertyBedrooms: z.number().optional(),
    propertyBathrooms: z.number().optional(),
    propertySquareFootage: z.number().optional(),
    propertyYearBuilt: z.number().optional(),
    // Purchase Details
    purchasePrice: z.number(),
    closingCosts: z.number().optional(),
    downPayment: z.number().optional(),
    downPaymentPercentage: z.number().optional(),
    loanAmount: z.number().optional(),
    interestRate: z.number().optional(),
    loanTerm: z.number().optional(),
    // Income
    monthlyRent: z.number(),
    otherMonthlyIncome: z.number().optional(),
    // Monthly Expenses
    monthlyTaxes: z.number().optional(),
    monthlyInsurance: z.number().optional(),
    monthlyUtilities: z.number().optional(),
    monthlyMaintenance: z.number().optional(),
    monthlyManagement: z.number().optional(),
    monthlyHOA: z.number().optional(),
    monthlyCapEx: z.number().optional(),
    monthlyVacancy: z.number().optional(),
    otherMonthlyExpenses: z.number().optional(),
    // Analysis Settings
    appreciationRate: z.number().optional(),
    incomeGrowthRate: z.number().optional(),
    expenseGrowthRate: z.number().optional(),
    salesExpensePercentage: z.number().optional(),
    // Additional Data
    notes: z.string().optional(),
    source: z.string().optional().default("BiggerPockets Import"),
});
export const excelExportRequestSchema = z.object({
    propertyIds: z.array(z.string()).optional(),
    includeTemplate: z.boolean().default(true),
    templateType: z.enum(['biggerpockets', 'detailed', 'summary']).default('biggerpockets'),
    includeCharts: z.boolean().default(false),
});
export const csvExportRequestSchema = z.object({
    propertyIds: z.array(z.string()).optional(),
    includeHeaders: z.boolean().default(true),
    format: z.enum(['biggerpockets', 'standard']).default('biggerpockets'),
});
export const importResultSchema = z.object({
    success: z.boolean(),
    imported: z.number(),
    skipped: z.number(),
    errors: z.array(z.object({
        row: z.number(),
        error: z.string(),
        data: z.record(z.any()).optional(),
    })),
    properties: z.array(propertySchema).optional(),
});
export const apiIntegrationSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string(),
    baseUrl: z.string(),
    authType: z.enum(['api_key', 'oauth', 'basic', 'bearer']),
    authConfig: z.record(z.any()),
    endpoints: z.array(z.object({
        name: z.string(),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
        path: z.string(),
        description: z.string(),
        parameters: z.array(z.object({
            name: z.string(),
            type: z.enum(['query', 'body', 'header']),
            required: z.boolean(),
            description: z.string(),
        })),
    })),
    rateLimits: z.object({
        requestsPerMinute: z.number(),
        requestsPerHour: z.number(),
        requestsPerDay: z.number(),
    }).optional(),
    isActive: z.boolean().default(true),
    createdAt: z.date(),
    lastUsed: z.date().optional(),
});
export const insertApiIntegrationSchema = apiIntegrationSchema.omit({ id: true, createdAt: true, lastUsed: true });
