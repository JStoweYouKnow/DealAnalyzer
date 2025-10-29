/**
 * Service for calculating mortgage payments using API Ninjas
 */

const API_NINJAS_API_KEY = process.env.API_NINJAS_API_KEY || 'U30sqfOKlZDcHzhkBGfSBA==6uHTEcCZeXWi2guq';
const API_NINJAS_BASE_URL = 'https://api.api-ninjas.com/v1/mortgagecalculator';

export interface MortgageCalculatorParams {
  loan_amount: number; // Loan amount in dollars
  interest_rate: number; // Annual interest rate as percentage (e.g., 3.5 for 3.5%)
  duration_years: number; // Loan duration in years (e.g., 30)
}

export interface MortgageCalculatorResponse {
  monthly_payment: number; // Monthly payment amount
  total_interest_paid: number; // Total interest paid over life of loan
  total_paid: number; // Total amount paid (principal + interest)
  payback_period_years?: number; // Years to pay back
  payback_period_months?: number; // Months to pay back
}

/**
 * Calculates mortgage payment details using API Ninjas
 */
export async function calculateMortgage(
  params: MortgageCalculatorParams
): Promise<MortgageCalculatorResponse> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('loan_amount', params.loan_amount.toString());
    queryParams.append('interest_rate', params.interest_rate.toString());
    queryParams.append('duration_years', params.duration_years.toString());

    const url = `${API_NINJAS_BASE_URL}?${queryParams.toString()}`;
    
    console.log('Calculating mortgage payment with API Ninjas...', { loan_amount: params.loan_amount, interest_rate: params.interest_rate, duration_years: params.duration_years });
    
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': API_NINJAS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API Ninjas returned status ${response.status}`);
    }

    const data: MortgageCalculatorResponse = await response.json();
    
    console.log('Mortgage calculation result:', data);
    
    return data;
  } catch (error) {
    console.error('Error calculating mortgage with API Ninjas:', error);
    throw error;
  }
}

/**
 * Calculate mortgage payment manually as fallback
 * Uses standard amortization formula
 */
export function calculateMortgageManual(
  loanAmount: number,
  annualInterestRate: number, // As decimal (e.g., 0.035 for 3.5%)
  durationYears: number
): MortgageCalculatorResponse {
  const monthlyInterestRate = annualInterestRate / 12;
  const numberOfPayments = durationYears * 12;

  let monthlyPayment = 0;
  if (monthlyInterestRate > 0 && loanAmount > 0) {
    monthlyPayment = 
      loanAmount * 
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  } else if (loanAmount > 0 && numberOfPayments > 0) {
    monthlyPayment = loanAmount / numberOfPayments;
  }

  const totalPaid = monthlyPayment * numberOfPayments;
  const totalInterestPaid = totalPaid - loanAmount;

  return {
    monthly_payment: monthlyPayment,
    total_interest_paid: totalInterestPaid,
    total_paid: totalPaid,
    payback_period_years: durationYears,
    payback_period_months: numberOfPayments,
  };
}

