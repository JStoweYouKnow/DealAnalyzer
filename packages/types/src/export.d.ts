import { z } from "zod";
export declare const biggerPocketsImportSchema: z.ZodObject<{
    propertyAddress: z.ZodString;
    propertyCity: z.ZodString;
    propertyState: z.ZodString;
    propertyZip: z.ZodOptional<z.ZodString>;
    propertyType: z.ZodString;
    propertyBedrooms: z.ZodOptional<z.ZodNumber>;
    propertyBathrooms: z.ZodOptional<z.ZodNumber>;
    propertySquareFootage: z.ZodOptional<z.ZodNumber>;
    propertyYearBuilt: z.ZodOptional<z.ZodNumber>;
    purchasePrice: z.ZodNumber;
    closingCosts: z.ZodOptional<z.ZodNumber>;
    downPayment: z.ZodOptional<z.ZodNumber>;
    downPaymentPercentage: z.ZodOptional<z.ZodNumber>;
    loanAmount: z.ZodOptional<z.ZodNumber>;
    interestRate: z.ZodOptional<z.ZodNumber>;
    loanTerm: z.ZodOptional<z.ZodNumber>;
    monthlyRent: z.ZodNumber;
    otherMonthlyIncome: z.ZodOptional<z.ZodNumber>;
    monthlyTaxes: z.ZodOptional<z.ZodNumber>;
    monthlyInsurance: z.ZodOptional<z.ZodNumber>;
    monthlyUtilities: z.ZodOptional<z.ZodNumber>;
    monthlyMaintenance: z.ZodOptional<z.ZodNumber>;
    monthlyManagement: z.ZodOptional<z.ZodNumber>;
    monthlyHOA: z.ZodOptional<z.ZodNumber>;
    monthlyCapEx: z.ZodOptional<z.ZodNumber>;
    monthlyVacancy: z.ZodOptional<z.ZodNumber>;
    otherMonthlyExpenses: z.ZodOptional<z.ZodNumber>;
    appreciationRate: z.ZodOptional<z.ZodNumber>;
    incomeGrowthRate: z.ZodOptional<z.ZodNumber>;
    expenseGrowthRate: z.ZodOptional<z.ZodNumber>;
    salesExpensePercentage: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    source: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    propertyType: string;
    purchasePrice: number;
    monthlyRent: number;
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    source: string;
    loanAmount?: number | undefined;
    propertyZip?: string | undefined;
    propertyBedrooms?: number | undefined;
    propertyBathrooms?: number | undefined;
    propertySquareFootage?: number | undefined;
    propertyYearBuilt?: number | undefined;
    closingCosts?: number | undefined;
    downPayment?: number | undefined;
    downPaymentPercentage?: number | undefined;
    interestRate?: number | undefined;
    loanTerm?: number | undefined;
    otherMonthlyIncome?: number | undefined;
    monthlyTaxes?: number | undefined;
    monthlyInsurance?: number | undefined;
    monthlyUtilities?: number | undefined;
    monthlyMaintenance?: number | undefined;
    monthlyManagement?: number | undefined;
    monthlyHOA?: number | undefined;
    monthlyCapEx?: number | undefined;
    monthlyVacancy?: number | undefined;
    otherMonthlyExpenses?: number | undefined;
    appreciationRate?: number | undefined;
    incomeGrowthRate?: number | undefined;
    expenseGrowthRate?: number | undefined;
    salesExpensePercentage?: number | undefined;
    notes?: string | undefined;
}, {
    propertyType: string;
    purchasePrice: number;
    monthlyRent: number;
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    loanAmount?: number | undefined;
    propertyZip?: string | undefined;
    propertyBedrooms?: number | undefined;
    propertyBathrooms?: number | undefined;
    propertySquareFootage?: number | undefined;
    propertyYearBuilt?: number | undefined;
    closingCosts?: number | undefined;
    downPayment?: number | undefined;
    downPaymentPercentage?: number | undefined;
    interestRate?: number | undefined;
    loanTerm?: number | undefined;
    otherMonthlyIncome?: number | undefined;
    monthlyTaxes?: number | undefined;
    monthlyInsurance?: number | undefined;
    monthlyUtilities?: number | undefined;
    monthlyMaintenance?: number | undefined;
    monthlyManagement?: number | undefined;
    monthlyHOA?: number | undefined;
    monthlyCapEx?: number | undefined;
    monthlyVacancy?: number | undefined;
    otherMonthlyExpenses?: number | undefined;
    appreciationRate?: number | undefined;
    incomeGrowthRate?: number | undefined;
    expenseGrowthRate?: number | undefined;
    salesExpensePercentage?: number | undefined;
    notes?: string | undefined;
    source?: string | undefined;
}>;
export declare const excelExportRequestSchema: z.ZodObject<{
    propertyIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeTemplate: z.ZodDefault<z.ZodBoolean>;
    templateType: z.ZodDefault<z.ZodEnum<["biggerpockets", "detailed", "summary"]>>;
    includeCharts: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    includeTemplate: boolean;
    templateType: "summary" | "biggerpockets" | "detailed";
    includeCharts: boolean;
    propertyIds?: string[] | undefined;
}, {
    propertyIds?: string[] | undefined;
    includeTemplate?: boolean | undefined;
    templateType?: "summary" | "biggerpockets" | "detailed" | undefined;
    includeCharts?: boolean | undefined;
}>;
export declare const csvExportRequestSchema: z.ZodObject<{
    propertyIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeHeaders: z.ZodDefault<z.ZodBoolean>;
    format: z.ZodDefault<z.ZodEnum<["biggerpockets", "standard"]>>;
}, "strip", z.ZodTypeAny, {
    includeHeaders: boolean;
    format: "biggerpockets" | "standard";
    propertyIds?: string[] | undefined;
}, {
    propertyIds?: string[] | undefined;
    includeHeaders?: boolean | undefined;
    format?: "biggerpockets" | "standard" | undefined;
}>;
export declare const importResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    imported: z.ZodNumber;
    skipped: z.ZodNumber;
    errors: z.ZodArray<z.ZodObject<{
        row: z.ZodNumber;
        error: z.ZodString;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        error: string;
        row: number;
        data?: Record<string, any> | undefined;
    }, {
        error: string;
        row: number;
        data?: Record<string, any> | undefined;
    }>, "many">;
    properties: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        address: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        propertyType: z.ZodString;
        purchasePrice: z.ZodNumber;
        monthlyRent: z.ZodNumber;
        bedrooms: z.ZodNumber;
        bathrooms: z.ZodNumber;
        squareFootage: z.ZodNumber;
        lotSize: z.ZodOptional<z.ZodNumber>;
        yearBuilt: z.ZodNumber;
        description: z.ZodString;
        listingUrl: z.ZodString;
        imageUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        sourceLinks: z.ZodOptional<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            type: z.ZodEnum<["listing", "company", "external", "other"]>;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }, {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }>, "many">>;
        fundingSource: z.ZodDefault<z.ZodOptional<z.ZodEnum<["conventional", "fha", "va", "dscr", "cash"]>>>;
        adr: z.ZodOptional<z.ZodNumber>;
        occupancyRate: z.ZodOptional<z.ZodNumber>;
        monthlyExpenses: z.ZodOptional<z.ZodObject<{
            propertyTaxes: z.ZodOptional<z.ZodNumber>;
            insurance: z.ZodOptional<z.ZodNumber>;
            utilities: z.ZodOptional<z.ZodNumber>;
            management: z.ZodOptional<z.ZodNumber>;
            maintenance: z.ZodOptional<z.ZodNumber>;
            cleaning: z.ZodOptional<z.ZodNumber>;
            supplies: z.ZodOptional<z.ZodNumber>;
            other: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        }, {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    }, {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    imported: number;
    skipped: number;
    errors: {
        error: string;
        row: number;
        data?: Record<string, any> | undefined;
    }[];
    properties?: {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    }[] | undefined;
}, {
    success: boolean;
    imported: number;
    skipped: number;
    errors: {
        error: string;
        row: number;
        data?: Record<string, any> | undefined;
    }[];
    properties?: {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    }[] | undefined;
}>;
export declare const apiIntegrationSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodString;
    baseUrl: z.ZodString;
    authType: z.ZodEnum<["api_key", "oauth", "basic", "bearer"]>;
    authConfig: z.ZodRecord<z.ZodString, z.ZodAny>;
    endpoints: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
        path: z.ZodString;
        description: z.ZodString;
        parameters: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodEnum<["query", "body", "header"]>;
            required: z.ZodBoolean;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }, {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        description: string;
        name: string;
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        parameters: {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }[];
    }, {
        description: string;
        name: string;
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        parameters: {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }[];
    }>, "many">;
    rateLimits: z.ZodOptional<z.ZodObject<{
        requestsPerMinute: z.ZodNumber;
        requestsPerHour: z.ZodNumber;
        requestsPerDay: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    }, {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    }>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    lastUsed: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    description: string;
    createdAt: Date;
    name: string;
    baseUrl: string;
    authType: "api_key" | "oauth" | "basic" | "bearer";
    authConfig: Record<string, any>;
    endpoints: {
        description: string;
        name: string;
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        parameters: {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }[];
    }[];
    isActive: boolean;
    id?: string | undefined;
    lastUsed?: Date | undefined;
    rateLimits?: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    } | undefined;
}, {
    description: string;
    createdAt: Date;
    name: string;
    baseUrl: string;
    authType: "api_key" | "oauth" | "basic" | "bearer";
    authConfig: Record<string, any>;
    endpoints: {
        description: string;
        name: string;
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        parameters: {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }[];
    }[];
    id?: string | undefined;
    lastUsed?: Date | undefined;
    rateLimits?: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    } | undefined;
    isActive?: boolean | undefined;
}>;
export declare const insertApiIntegrationSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodString;
    baseUrl: z.ZodString;
    authType: z.ZodEnum<["api_key", "oauth", "basic", "bearer"]>;
    authConfig: z.ZodRecord<z.ZodString, z.ZodAny>;
    endpoints: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
        path: z.ZodString;
        description: z.ZodString;
        parameters: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodEnum<["query", "body", "header"]>;
            required: z.ZodBoolean;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }, {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        description: string;
        name: string;
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        parameters: {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }[];
    }, {
        description: string;
        name: string;
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        parameters: {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }[];
    }>, "many">;
    rateLimits: z.ZodOptional<z.ZodObject<{
        requestsPerMinute: z.ZodNumber;
        requestsPerHour: z.ZodNumber;
        requestsPerDay: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    }, {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    }>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    lastUsed: z.ZodOptional<z.ZodDate>;
}, "id" | "createdAt" | "lastUsed">, "strip", z.ZodTypeAny, {
    description: string;
    name: string;
    baseUrl: string;
    authType: "api_key" | "oauth" | "basic" | "bearer";
    authConfig: Record<string, any>;
    endpoints: {
        description: string;
        name: string;
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        parameters: {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }[];
    }[];
    isActive: boolean;
    rateLimits?: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    } | undefined;
}, {
    description: string;
    name: string;
    baseUrl: string;
    authType: "api_key" | "oauth" | "basic" | "bearer";
    authConfig: Record<string, any>;
    endpoints: {
        description: string;
        name: string;
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        parameters: {
            description: string;
            name: string;
            required: boolean;
            type: "query" | "body" | "header";
        }[];
    }[];
    rateLimits?: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    } | undefined;
    isActive?: boolean | undefined;
}>;
export type BiggerPocketsImport = z.infer<typeof biggerPocketsImportSchema>;
export type ExcelExportRequest = z.infer<typeof excelExportRequestSchema>;
export type CsvExportRequest = z.infer<typeof csvExportRequestSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
export type ApiIntegration = z.infer<typeof apiIntegrationSchema>;
export type InsertApiIntegration = z.infer<typeof insertApiIntegrationSchema>;
//# sourceMappingURL=export.d.ts.map