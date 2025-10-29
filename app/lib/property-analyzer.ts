// TypeScript property analyzer to replace Python backend for Vercel deployment
import type { Property, FundingSource } from "../../shared/schema";
import { FUNDING_SOURCE_DOWN_PAYMENTS } from "../../shared/schema";

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
  monthlyExpenses?: any,
  fundingSource?: FundingSource,
  mortgageRate?: number // Annual interest rate as decimal (e.g., 0.07 for 7%)
): PropertyAnalysis {
  const criteria = loadInvestmentCriteria();

  // Use provided data or default values
  const purchasePrice = propertyData.purchase_price || propertyData.purchasePrice || 0;

  // Get funding source (from parameter, property data, or default to 'conventional')
  const propertyFundingSource: FundingSource = fundingSource || propertyData.funding_source || propertyData.fundingSource || 'conventional';
  
  // Calculate monthly rent: if STR metrics are provided, calculate from ADR and occupancy
  let monthlyRent = strMetrics?.monthlyRent || propertyData.monthly_rent || propertyData.monthlyRent || 0;
  
  // Normalize occupancy rate from strMetrics (convert percentage to decimal if needed)
  let strOccupancyRate = strMetrics?.occupancyRate;
  if (strOccupancyRate !== undefined && strOccupancyRate > 1) {
    strOccupancyRate = strOccupancyRate / 100;
  }
  
  const hasSTRData = strMetrics?.adr && strOccupancyRate;
  
  // If STR data is available, calculate monthly income from ADR and occupancy
  if (hasSTRData && (!monthlyRent || monthlyRent === 0)) {
    monthlyRent = (strMetrics.adr! * 30 * (strOccupancyRate || 0));
  }
  
  // Also use ADR and occupancy from propertyData if available
  const adr = strMetrics?.adr || propertyData.adr || 0;
  // Use normalized strOccupancyRate if available, otherwise get from propertyData
  let occupancyRate = strOccupancyRate !== undefined ? strOccupancyRate : (propertyData.occupancyRate || propertyData.occupancy_rate || 0);
  
  // Convert occupancy rate from percentage to decimal if needed (if from propertyData)
  if (occupancyRate > 1) {
    occupancyRate = occupancyRate / 100;
  }
  
  if (adr > 0 && occupancyRate > 0 && (!monthlyRent || monthlyRent === 0)) {
    monthlyRent = adr * 30 * occupancyRate;
  }

  // Financial Calculations
  // Use funding source to determine down payment percentage
  const downpaymentPercentage = FUNDING_SOURCE_DOWN_PAYMENTS[propertyFundingSource];
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
  // For cash purchases, there is no mortgage payment
  let monthlyMortgagePayment = 0;
  if (propertyFundingSource === 'cash') {
    monthlyMortgagePayment = 0;
  } else {
    const loanAmount = purchasePrice - calculatedDownpayment;
    // Use provided mortgage rate or default to 7% (0.07)
    const annualInterestRate = mortgageRate ?? 0.07;
    const monthlyInterestRate = annualInterestRate / 12;
    const numberOfPayments = 30 * 12;

    if (monthlyInterestRate > 0 && loanAmount > 0) {
      monthlyMortgagePayment = loanAmount * (monthlyInterestRate * (1 + monthlyInterestRate)**numberOfPayments) / ((1 + monthlyInterestRate)**numberOfPayments - 1);
    } else if (loanAmount > 0 && numberOfPayments > 0) {
      monthlyMortgagePayment = loanAmount / numberOfPayments;
    }
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

  // STR (Short-Term Rental) Calculations
  let projectedAnnualRevenue: number | undefined = undefined;
  let projectedGrossYield: number | undefined = undefined;
  let strNetIncome: number | undefined = undefined;
  let strMeetsCriteria: boolean | undefined = undefined;
  
  if (adr > 0 && occupancyRate > 0) {
    // Calculate projected annual revenue from ADR and occupancy
    projectedAnnualRevenue = adr * 30 * 12 * occupancyRate;
    
    // Calculate projected gross yield (annual revenue / purchase price)
    projectedGrossYield = purchasePrice > 0 ? projectedAnnualRevenue / purchasePrice : 0;
    
    // Calculate STR net income (monthly revenue - monthly expenses)
    strNetIncome = (projectedAnnualRevenue / 12) - totalMonthlyExpenses;
    
    // Check STR criteria
    strMeetsCriteria = true;
    if (criteria.str_adr_minimum && adr < criteria.str_adr_minimum) {
      strMeetsCriteria = false;
    }
    if (criteria.str_occupancy_rate_minimum && occupancyRate < criteria.str_occupancy_rate_minimum) {
      strMeetsCriteria = false;
    }
    if (criteria.str_gross_yield_minimum && projectedGrossYield < criteria.str_gross_yield_minimum) {
      strMeetsCriteria = false;
    }
    if (criteria.str_annual_revenue_minimum && projectedAnnualRevenue < criteria.str_annual_revenue_minimum) {
      strMeetsCriteria = false;
    }
  }

  // Determine if meets criteria
  // Base criteria check
  let meetsCriteria = (
    purchasePrice <= criteria.max_purchase_price &&
    passes1PercentRule &&
    cashFlowPositive &&
    cocMeetsMinimum &&
    capMeetsMinimum
  );
  
  // If STR data is available, also check STR criteria
  if (strMeetsCriteria !== undefined) {
    meetsCriteria = meetsCriteria && strMeetsCriteria;
  }

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
      adr: adr || strMetrics?.adr || propertyData.adr,
      occupancyRate: occupancyRate || strMetrics?.occupancyRate || propertyData.occupancyRate || propertyData.occupancy_rate,
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
    projectedAnnualRevenue,
    projectedGrossYield,
    totalMonthlyExpenses,
    strNetIncome,
    strMeetsCriteria,
    meetsCriteria,
  };
}

