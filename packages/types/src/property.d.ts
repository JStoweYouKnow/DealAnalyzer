import { z } from "zod";
export declare const fundingSourceSchema: z.ZodEnum<["conventional", "fha", "va", "dscr", "cash"]>;
export type FundingSource = z.infer<typeof fundingSourceSchema>;
export declare const FUNDING_SOURCE_DOWN_PAYMENTS: Record<FundingSource, number>;
export declare const propertySchema: z.ZodObject<{
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
}>;
export declare const mortgageValuesSchema: z.ZodObject<{
    loanAmount: z.ZodNumber;
    loanTermYears: z.ZodNumber;
    monthlyPayment: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    loanAmount: number;
    loanTermYears: number;
    monthlyPayment: number;
}, {
    loanAmount: number;
    loanTermYears: number;
    monthlyPayment: number;
}>;
export declare const insertPropertySchema: z.ZodObject<Omit<{
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
}, "id">, "strip", z.ZodTypeAny, {
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
}>;
export type Property = z.infer<typeof propertySchema>;
export type MortgageValues = z.infer<typeof mortgageValuesSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
//# sourceMappingURL=property.d.ts.map