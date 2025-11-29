// Ported property analyzer for mobile
import type { FundingSource, MortgageValues } from '../types';

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

const FUNDING_SOURCE_DOWN_PAYMENTS: Record<FundingSource, number> = {
  conventional: 0.2,
  fha: 0.035,
  va: 0.0,
  cash: 1.0,
  hard_money: 0.25,
  other: 0.2,
};

export function loadInvestmentCriteria() {
  return {
    property_types: ['single-family', 'multi-family'],
    location: 'California',
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

export function analyzeProperty(
  propertyData: any,
  strMetrics?: { adr?: number; occupancyRate?: number; monthlyRent?: number },
  monthlyExpenses?: any,
  fundingSource?: FundingSource,
  mortgageValues?: MortgageValues,
  criteria?: any
): PropertyAnalysis {
  const analysisCriteria = criteria || loadInvestmentCriteria();
  
  let propertyFundingSource: FundingSource = 
    fundingSource || propertyData.funding_source || propertyData.fundingSource || 'conventional';
  
  if (!FUNDING_SOURCE_DOWN_PAYMENTS[propertyFundingSource]) {
    propertyFundingSource = 'conventional';
  }

  const purchasePrice = Number(propertyData.purchasePrice || propertyData.purchase_price || 0);
  const downPaymentPercent = FUNDING_SOURCE_DOWN_PAYMENTS[propertyFundingSource];
  const calculatedDownpayment = purchasePrice * downPaymentPercent;
  
  const closingCostsPercent = 0.06; // 6% average
  const calculatedClosingCosts = purchasePrice * closingCostsPercent;
  const calculatedInitialFixedCosts = purchasePrice * 0.01;
  const estimatedMaintenanceReserve = purchasePrice * 0.05;
  const totalCashNeeded = 
    calculatedDownpayment + 
    calculatedClosingCosts + 
    calculatedInitialFixedCosts + 
    estimatedMaintenanceReserve;

  // Calculate monthly rent
  let monthlyRent = Number(propertyData.monthlyRent || propertyData.monthly_rent || 0);
  
  if (strMetrics?.adr && strMetrics?.occupancyRate) {
    monthlyRent = (strMetrics.adr * strMetrics.occupancyRate * 30);
  } else if (strMetrics?.monthlyRent) {
    monthlyRent = strMetrics.monthlyRent;
  }

  // Calculate monthly mortgage payment
  let monthlyMortgagePayment = 0;
  if (mortgageValues) {
    monthlyMortgagePayment = mortgageValues.monthlyPayment;
  } else if (propertyFundingSource !== 'cash') {
    const loanAmount = purchasePrice - calculatedDownpayment;
    const annualRate = propertyData.interestRate || 0.07;
    const monthlyRate = annualRate / 12;
    const numPayments = (propertyData.loanTermYears || 30) * 12;
    
    if (monthlyRate > 0) {
      monthlyMortgagePayment = 
        loanAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    } else {
      monthlyMortgagePayment = loanAmount / numPayments;
    }
  }

  // Calculate monthly expenses
  const totalMonthlyExpenses = 
    (monthlyExpenses?.propertyTaxes || 0) +
    (monthlyExpenses?.insurance || 0) +
    (monthlyExpenses?.utilities || 0) +
    (monthlyExpenses?.management || 0) +
    (monthlyExpenses?.maintenance || 0) +
    (monthlyExpenses?.cleaning || 0) +
    (monthlyExpenses?.supplies || 0) +
    (monthlyExpenses?.other || 0) +
    monthlyMortgagePayment;

  // Calculate cash flow
  const cashFlow = monthlyRent - totalMonthlyExpenses;
  const cashFlowPositive = cashFlow > 0;

  // Calculate cash-on-cash return
  const annualCashFlow = cashFlow * 12;
  const cocReturn = totalCashNeeded > 0 ? annualCashFlow / totalCashNeeded : 0;
  const cocMeetsBenchmark = cocReturn >= (analysisCriteria.coc_benchmark_min || 0.15);
  const cocMeetsMinimum = cocReturn >= (analysisCriteria.coc_minimum_min || 0.08);

  // Calculate cap rate
  const netOperatingIncome = (monthlyRent * 12) - (totalMonthlyExpenses - monthlyMortgagePayment) * 12;
  const capRate = purchasePrice > 0 ? netOperatingIncome / purchasePrice : 0;
  const capMeetsBenchmark = capRate >= (analysisCriteria.cap_benchmark_min || 0.12);
  const capMeetsMinimum = capRate >= (analysisCriteria.cap_minimum || 0.04);

  // 1% Rule
  const passes1PercentRule = monthlyRent >= purchasePrice * 0.01;

  // STR metrics
  let projectedAnnualRevenue: number | undefined;
  let projectedGrossYield: number | undefined;
  let strNetIncome: number | undefined;
  let strMeetsCriteria: boolean | undefined;

  if (strMetrics?.adr && strMetrics?.occupancyRate) {
    projectedAnnualRevenue = strMetrics.adr * strMetrics.occupancyRate * 365;
    projectedGrossYield = purchasePrice > 0 ? projectedAnnualRevenue / purchasePrice : 0;
    strNetIncome = projectedAnnualRevenue - (totalMonthlyExpenses * 12);
    strMeetsCriteria = 
      (strMetrics.adr >= (analysisCriteria.str_adr_minimum || 100)) &&
      (strMetrics.occupancyRate >= (analysisCriteria.str_occupancy_rate_minimum || 0.65)) &&
      (projectedGrossYield >= (analysisCriteria.str_gross_yield_minimum || 0.12)) &&
      (projectedAnnualRevenue >= (analysisCriteria.str_annual_revenue_minimum || 30000));
  }

  // Overall criteria check
  const meetsCriteria = 
    cocMeetsMinimum &&
    capMeetsMinimum &&
    cashFlowPositive &&
    (strMeetsCriteria !== false);

  return {
    propertyId: propertyData.propertyId || `temp-${Date.now()}`,
    property: {
      address: propertyData.address || '',
      city: propertyData.city,
      state: propertyData.state,
      zipCode: propertyData.zipCode || propertyData.zip_code,
      propertyType: propertyData.propertyType || propertyData.property_type,
      purchasePrice,
      monthlyRent,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      squareFootage: propertyData.squareFootage || propertyData.square_footage,
      yearBuilt: propertyData.yearBuilt || propertyData.year_built,
      description: propertyData.description,
      listingUrl: propertyData.listingUrl || propertyData.listing_url,
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
    monthlyMortgagePayment,
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

