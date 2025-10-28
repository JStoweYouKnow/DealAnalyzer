// TypeScript property analyzer to replace Python backend for Vercel deployment
import type { Property } from "../../shared/schema";

export interface PropertyAnalysis {
  propertyId: string;
  property: {
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    propertyType?: string;
    purchasePrice: number;
    monthlyRent: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    yearBuilt?: number;
    description?: string;
    listingUrl?: string;
    adr?: number;
    occupancyRate?: number;
  };
  calculatedDownpayment: number;
  calculatedClosingCosts: number;
  calculatedInitialFixedCosts: number;
  estimatedMaintenanceReserve: number;
  totalCashNeeded: number;
  passes1PercentRule: boolean;
  cashFlow: number;
  cashFlowPositive: boolean;
  cocReturn: number;
  cocMeetsBenchmark: boolean;
  cocMeetsMinimum: boolean;
  capRate: number;
  capMeetsBenchmark: boolean;
  capMeetsMinimum: boolean;
  projectedAnnualRevenue?: number;
  projectedGrossYield?: number;
  totalMonthlyExpenses?: number;
  strNetIncome?: number;
  strMeetsCriteria?: boolean;
  meetsCriteria: boolean;
}

// Load investment criteria
export function loadInvestmentCriteria() {
  return {
    property_types: ["single-family", "multi-family"],
    location: "California",
    max_purchase_price: 300000,
    downpayment_percentage_min: 0.2,
    downpayment_percentage_max: 0.25,
    closing_costs_percentage_min: 0.05,
    closing_costs_percentage_max: 0.07,
    initial_fixed_costs_percentage: 0.01,
    maintenance_reserve_percentage: 0.05,
    coc_benchmark_min: 0.15,
    coc_benchmark_max: 0.15,
    coc_minimum_min: 0.08,
    coc_minimum_max: 0.15,
    cap_benchmark_min: 0.12,
    cap_benchmark_max: 0.12,
    cap_minimum: 0.04,
    str_adr_minimum: 100,
    str_occupancy_rate_minimum: 0.65,
    str_gross_yield_minimum: 0.12,
    str_annual_revenue_minimum: 30000,
  };
}

// Parse email content to extract property details
export function parseEmailContent(emailContent: string): any {
  const property: any = {
    address: "",
    city: "Unknown",
    state: "Unknown",
    zipCode: "00000",
    propertyType: "N/A",
    purchasePrice: 0,
    monthlyRent: 0,
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: 0,
    yearBuilt: 0,
    description: "",
    listingUrl: "N/A",
  };

  // Extract address
  const addressMatch = emailContent.match(/\b(\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Place|Pl)[,\s]*[A-Z][a-z]+[\s,]*[A-Z][a-z]+)?/);
  if (addressMatch) {
    property.address = addressMatch[0].trim();
  }

  // Extract price
  const priceMatch = emailContent.match(/\$\s*([0-9,]+)/);
  if (priceMatch) {
    property.purchasePrice = parseInt(priceMatch[1].replace(/,/g, ""));
  }

  // Extract rent
  const rentMatch = emailContent.match(/rent[:\$]?\s*\$?([0-9,]+)/i);
  if (rentMatch) {
    property.monthlyRent = parseInt(rentMatch[1].replace(/,/g, ""));
  }

  // Extract bedrooms
  const bedMatch = emailContent.match(/(\d+)\s*(?:bed|bedroom|br|bedrooms)/i);
  if (bedMatch) {
    property.bedrooms = parseInt(bedMatch[1]);
  }

  // Extract bathrooms
  const bathMatch = emailContent.match(/(\d+(?:\.\d+)?)\s*(?:bath|bathroom|ba|bathrooms)/i);
  if (bathMatch) {
    property.bathrooms = parseFloat(bathMatch[1]);
  }

  // Extract square footage
  const sqftMatch = emailContent.match(/(\d+)\s*(?:sq\.?\s*ft\.?|square\s*feet)/i);
  if (sqftMatch) {
    property.squareFootage = parseInt(sqftMatch[1]);
  }

  return property;
}

// Main analysis function
export function analyzeProperty(
  propertyData: any,
  strMetrics?: { adr?: number; occupancyRate?: number; monthlyRent?: number },
  monthlyExpenses?: any
): PropertyAnalysis {
  const criteria = loadInvestmentCriteria();

  // Use provided data or default values
  const purchasePrice = propertyData.purchase_price || propertyData.purchasePrice || 0;
  const monthlyRent = strMetrics?.monthlyRent || propertyData.monthly_rent || propertyData.monthlyRent || 0;

  // Financial Calculations
  const downpaymentPercentage = criteria.downpayment_percentage_min;
  const closingCostsPercentage = (criteria.closing_costs_percentage_min + criteria.closing_costs_percentage_max) / 2;
  const initialFixedCostsPercentage = criteria.initial_fixed_costs_percentage;
  const maintenanceReservePercentage = criteria.maintenance_reserve_percentage;

  const calculatedDownpayment = purchasePrice * downpaymentPercentage;
  const calculatedClosingCosts = purchasePrice * closingCostsPercentage;
  const calculatedInitialFixedCosts = purchasePrice * initialFixedCostsPercentage;
  const estimatedMaintenanceReserve = monthlyRent * maintenanceReservePercentage;

  const totalCashNeeded = calculatedDownpayment + calculatedClosingCosts + calculatedInitialFixedCosts;

  // 1% Rule Check
  const passes1PercentRule = monthlyRent >= (purchasePrice * 0.01);

  // Calculate estimated monthly mortgage payment (Principal & Interest)
  const loanAmount = purchasePrice - calculatedDownpayment;
  const annualInterestRate = 0.07;
  const monthlyInterestRate = annualInterestRate / 12;
  const numberOfPayments = 30 * 12;

  let monthlyMortgagePayment = 0;
  if (monthlyInterestRate > 0) {
    monthlyMortgagePayment = loanAmount * (monthlyInterestRate * (1 + monthlyInterestRate)**numberOfPayments) / ((1 + monthlyInterestRate)**numberOfPayments - 1);
  } else {
    monthlyMortgagePayment = loanAmount / numberOfPayments;
  }

  // Estimated Monthly Expenses
  const estimatedPropertyTax = purchasePrice * 0.012 / 12; // 1.2% annually
  const estimatedInsurance = 100.0;
  const estimatedVacancy = monthlyRent * 0.05; // 5% of gross rents
  const estimatedPropertyManagement = monthlyRent * 0.10; // 10% of gross rents

  const totalMonthlyExpenses = (
    monthlyMortgagePayment +
    estimatedPropertyTax +
    estimatedInsurance +
    estimatedVacancy +
    estimatedMaintenanceReserve +
    estimatedPropertyManagement
  );

  const cashFlow = monthlyRent - totalMonthlyExpenses;
  const cashFlowPositive = cashFlow >= 0;

  // Cash-on-Cash Return
  const annualCashFlow = cashFlow * 12;
  const cocReturn = totalCashNeeded > 0 ? annualCashFlow / totalCashNeeded : 0;
  const cocMeetsBenchmark = cocReturn >= criteria.coc_benchmark_min;
  const cocMeetsMinimum = cocReturn >= criteria.coc_minimum_min;

  // Cap Rate
  const netOperatingIncome = monthlyRent * 12;
  const capRate = purchasePrice > 0 ? netOperatingIncome / purchasePrice : 0;
  const capMeetsBenchmark = capRate >= criteria.cap_benchmark_min;
  const capMeetsMinimum = capRate >= criteria.cap_minimum;

  // Determine if meets criteria
  const meetsCriteria = cocMeetsBenchmark && capMeetsBenchmark && cashFlowPositive;

  return {
    propertyId: propertyData.id || `temp-${Date.now()}`,
    property: {
      address: propertyData.address || "",
      city: propertyData.city,
      state: propertyData.state,
      zipCode: propertyData.zip_code || propertyData.zipCode,
      propertyType: propertyData.property_type || propertyData.propertyType,
      purchasePrice,
      monthlyRent,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      squareFootage: propertyData.square_footage || propertyData.squareFootage,
      yearBuilt: propertyData.year_built || propertyData.yearBuilt,
      description: propertyData.description,
      listingUrl: propertyData.listing_url || propertyData.listingUrl,
      adr: strMetrics?.adr,
      occupancyRate: strMetrics?.occupancyRate,
    },
    calculatedDownpayment,
    calculatedClosingCosts,
    calculatedInitialFixedCosts,
    estimatedMaintenanceReserve,
    totalCashNeeded,
    passes1PercentRule,
    cashFlow,
    cashFlowPositive,
    cocReturn,
    cocMeetsBenchmark,
    cocMeetsMinimum,
    capRate,
    capMeetsBenchmark,
    capMeetsMinimum,
    projectedAnnualRevenue: undefined,
    projectedGrossYield: undefined,
    totalMonthlyExpenses,
    strNetIncome: undefined,
    strMeetsCriteria: undefined,
    meetsCriteria,
  };
}

