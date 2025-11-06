// TypeScript property analyzer to replace Python backend for Vercel deployment
import type { Property, FundingSource, MortgageValues } from "../../shared/schema";
import { FUNDING_SOURCE_DOWN_PAYMENTS } from "../../shared/schema";
import { parseEmailContentOptimized } from './optimizations';

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
  monthlyMortgagePayment: number;
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
// Optimized version using pre-compiled regex patterns
export function parseEmailContent(emailContent: string): any {
  return parseEmailContentOptimized(emailContent);
}

// Main analysis function
export function analyzeProperty(
  propertyData: any,
  strMetrics?: { adr?: number; occupancyRate?: number; monthlyRent?: number },
  monthlyExpenses?: any,
  fundingSource?: FundingSource,
  mortgageRate?: number, // Annual interest rate as decimal (e.g., 0.07 for 7%)
  mortgageValues?: MortgageValues, // Mortgage calculator values (loan amount, loan term, monthly payment)
  criteria?: any // Optional criteria - if not provided, uses default
): PropertyAnalysis {
  // Use provided criteria or fall back to default
  const analysisCriteria = criteria || loadInvestmentCriteria();

  // Get funding source (from parameter, property data, or default to 'conventional')
  let propertyFundingSource: FundingSource = fundingSource || propertyData.funding_source || propertyData.fundingSource || 'conventional';
  // Validate that propertyFundingSource exists as a key in FUNDING_SOURCE_DOWN_PAYMENTS
  if (!Object.prototype.hasOwnProperty.call(FUNDING_SOURCE_DOWN_PAYMENTS, propertyFundingSource)) {
    propertyFundingSource = 'conventional';
  }

  // Get down payment percentage from funding source
  const downpaymentPercentage = FUNDING_SOURCE_DOWN_PAYMENTS[propertyFundingSource] || 0.20;

  // Determine purchase price and down payment:
  // PRIMARY: Use purchase price from file/input, calculate down payment from funding source percentage
  // BACKUP: If no purchase price but mortgage loan amount provided, calculate purchase price from loan amount
  let purchasePrice = propertyData.purchase_price || propertyData.purchasePrice || 0;
  let calculatedDownpayment: number;
  
  if (purchasePrice > 0) {
    // PRIMARY LOGIC: Purchase price exists (from file), calculate down payment using funding source percentage
    calculatedDownpayment = purchasePrice * downpaymentPercentage;
    // Logging removed for production performance - use logger.debug() if needed
  } else if (mortgageValues && mortgageValues.loanAmount > 0) {
    // BACKUP LOGIC: No purchase price, but mortgage loan amount provided
    // Calculate purchase price = loan amount / (1 - down payment percentage)
    // Example: If loan is $200k and down payment is 20%, then purchase price = $200k / 0.80 = $250k
    const loanPercentage = 1 - downpaymentPercentage;
    if (loanPercentage > 0) {
      purchasePrice = mortgageValues.loanAmount / loanPercentage;
      calculatedDownpayment = purchasePrice - mortgageValues.loanAmount;
      console.log('BACKUP: Calculated purchase price from mortgage loan amount:', {
        loanAmount: mortgageValues.loanAmount,
        fundingSource: propertyFundingSource,
        downpaymentPercentage,
        calculatedPurchasePrice: purchasePrice,
        calculatedDownpayment
      });
      
      // Update propertyData with calculated purchase price
      propertyData.purchase_price = purchasePrice;
      propertyData.purchasePrice = purchasePrice;
    } else {
      // Fallback if down payment is 100% (cash purchase)
      purchasePrice = mortgageValues.loanAmount;
      calculatedDownpayment = 0;
      console.warn('Cash purchase detected (100% down), using loan amount as purchase price');
    }
  } else {
    // No purchase price and no mortgage values - can't calculate
    purchasePrice = 0;
    calculatedDownpayment = 0;
    console.warn('Warning: No purchase price found and no mortgage values provided. Cannot calculate down payment.');
  }
  
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

  // Financial Calculations (down payment already calculated above)
  
  const closingCostsPercentage = (analysisCriteria.closing_costs_percentage_min + analysisCriteria.closing_costs_percentage_max) / 2;
  const initialFixedCostsPercentage = analysisCriteria.initial_fixed_costs_percentage;
  const maintenanceReservePercentage = analysisCriteria.maintenance_reserve_percentage;
  const calculatedClosingCosts = purchasePrice * closingCostsPercentage;
  const calculatedInitialFixedCosts = purchasePrice * initialFixedCostsPercentage;
  const estimatedMaintenanceReserve = monthlyRent * maintenanceReservePercentage;

  const totalCashNeeded = calculatedDownpayment + calculatedClosingCosts + calculatedInitialFixedCosts;

  // 1% Rule Check
  const passes1PercentRule = monthlyRent >= (purchasePrice * 0.01);

  // Calculate estimated monthly mortgage payment (Principal & Interest)
  // For cash purchases, there is no mortgage payment
  // If mortgage calculator provided monthly payment, use it directly
  let monthlyMortgagePayment = 0;
  if (propertyFundingSource === 'cash') {
    monthlyMortgagePayment = 0;
  } else if (mortgageValues && mortgageValues.monthlyPayment > 0) {
    // Use the monthly payment from mortgage calculator
    monthlyMortgagePayment = mortgageValues.monthlyPayment;
    console.log('Using mortgage calculator monthly payment:', monthlyMortgagePayment);
  } else {
    // Calculate mortgage payment using loan amount and interest rate
    const loanAmount = purchasePrice - calculatedDownpayment;
    // Use provided mortgage rate or default to 7% (0.07)
    const annualInterestRate = mortgageRate ?? 0.07;
    const monthlyInterestRate = annualInterestRate / 12;
    const numberOfPayments = 30 * 12; // Default to 30 years if not provided

    if (monthlyInterestRate > 0 && loanAmount > 0) {
      monthlyMortgagePayment = loanAmount * (monthlyInterestRate * (1 + monthlyInterestRate)**numberOfPayments) / ((1 + monthlyInterestRate)**numberOfPayments - 1);
    } else if (loanAmount > 0 && numberOfPayments > 0) {
      monthlyMortgagePayment = loanAmount / numberOfPayments;
    }
  }

  // Monthly Expenses - use provided values or estimate
  const providedPropertyTax = monthlyExpenses?.propertyTaxes;
  const providedInsurance = monthlyExpenses?.insurance;
  const providedUtilities = monthlyExpenses?.utilities || 0;
  const providedManagement = monthlyExpenses?.management;
  const providedMaintenance = monthlyExpenses?.maintenance;
  const providedCleaning = monthlyExpenses?.cleaning || 0;
  const providedSupplies = monthlyExpenses?.supplies || 0;
  const providedOther = monthlyExpenses?.other || 0;

  // Use provided values or calculate estimates
  const estimatedPropertyTax = providedPropertyTax !== undefined 
    ? providedPropertyTax 
    : purchasePrice * 0.012 / 12; // 1.2% annually default
  const estimatedInsurance = providedInsurance !== undefined 
    ? providedInsurance 
    : 100.0; // Default $100/month
  const estimatedVacancy = monthlyRent * 0.05; // 5% of gross rents
  const estimatedPropertyManagement = providedManagement !== undefined
    ? providedManagement
    : monthlyRent * 0.10; // 10% of gross rents default
  const actualMaintenanceReserve = providedMaintenance !== undefined
    ? providedMaintenance
    : estimatedMaintenanceReserve;

  const totalMonthlyExpenses = (
    monthlyMortgagePayment +
    estimatedPropertyTax +
    estimatedInsurance +
    estimatedVacancy +
    actualMaintenanceReserve +
    estimatedPropertyManagement +
    providedUtilities +
    providedCleaning +
    providedSupplies +
    providedOther
  );

  console.log('Monthly Expenses Calculation:', {
    provided: !!monthlyExpenses,
    mortgage: monthlyMortgagePayment,
    propertyTax: estimatedPropertyTax,
    insurance: estimatedInsurance,
    vacancy: estimatedVacancy,
    maintenance: actualMaintenanceReserve,
    management: estimatedPropertyManagement,
    utilities: providedUtilities,
    cleaning: providedCleaning,
    supplies: providedSupplies,
    other: providedOther,
    total: totalMonthlyExpenses
  });

  const cashFlow = monthlyRent - totalMonthlyExpenses;
  const cashFlowPositive = cashFlow >= 0;

  // Cash-on-Cash Return
  const annualCashFlow = cashFlow * 12;
  const cocReturn = totalCashNeeded > 0 ? annualCashFlow / totalCashNeeded : 0;
  const cocMeetsBenchmark = cocReturn >= analysisCriteria.coc_benchmark_min;
  const cocMeetsMinimum = cocReturn >= analysisCriteria.coc_minimum_min;

  // Cap Rate
  // Calculate annual operating expenses (excluding mortgage/debt service)
  const annualOperatingExpenses = (
    estimatedPropertyTax * 12 +
    estimatedInsurance * 12 +
    estimatedVacancy * 12 +
    actualMaintenanceReserve * 12 +
    estimatedPropertyManagement * 12 +
    providedUtilities * 12 +
    providedCleaning * 12 +
    providedSupplies * 12 +
    providedOther * 12
  );
  const netOperatingIncome = (monthlyRent * 12) - annualOperatingExpenses;
  const capRate = purchasePrice > 0 ? netOperatingIncome / purchasePrice : 0;
  const capMeetsBenchmark = capRate >= analysisCriteria.cap_benchmark_min;
  const capMeetsMinimum = capRate >= analysisCriteria.cap_minimum;

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
    if (analysisCriteria.str_adr_minimum && adr < analysisCriteria.str_adr_minimum) {
      strMeetsCriteria = false;
    }
    if (analysisCriteria.str_occupancy_rate_minimum && occupancyRate < analysisCriteria.str_occupancy_rate_minimum) {
      strMeetsCriteria = false;
    }
    if (analysisCriteria.str_gross_yield_minimum && projectedGrossYield < analysisCriteria.str_gross_yield_minimum) {
      strMeetsCriteria = false;
    }
    if (analysisCriteria.str_annual_revenue_minimum && projectedAnnualRevenue < analysisCriteria.str_annual_revenue_minimum) {
      strMeetsCriteria = false;
    }
  }

  // Determine if meets criteria
  // Base criteria check
  let meetsCriteria = (
    purchasePrice <= analysisCriteria.max_purchase_price &&
    passes1PercentRule &&
    cashFlowPositive &&
    cocMeetsMinimum &&
    capMeetsMinimum
  );

  console.log('Criteria Check:', {
    purchasePrice,
    maxPrice: analysisCriteria.max_purchase_price,
    priceMeets: purchasePrice <= analysisCriteria.max_purchase_price,
    passes1PercentRule,
    cashFlowPositive,
    cocReturn,
    cocMinimum: analysisCriteria.coc_minimum_min,
    cocMeets: cocMeetsMinimum,
    capRate,
    capMinimum: analysisCriteria.cap_minimum,
    capMeets: capMeetsMinimum,
    meetsCriteria
  });
  
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
    monthlyMortgagePayment,
    totalMonthlyExpenses,
    strNetIncome,
    strMeetsCriteria,
    meetsCriteria,
  };
}

