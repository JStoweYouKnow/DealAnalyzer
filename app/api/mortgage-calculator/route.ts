import { NextRequest, NextResponse } from "next/server";
import { calculateMortgage, calculateMortgageManual, type MortgageCalculatorParams } from "../../../server/mortgage-calculator-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loan_amount, interest_rate, duration_years } = body;

    // Validate required parameters
    if (!loan_amount || loan_amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Loan amount is required and must be greater than 0" },
        { status: 400 }
      );
    }

    if (!interest_rate || interest_rate < 0) {
      return NextResponse.json(
        { success: false, error: "Interest rate is required and must be 0 or greater" },
        { status: 400 }
      );
    }

    if (!duration_years || duration_years <= 0) {
      return NextResponse.json(
        { success: false, error: "Duration in years is required and must be greater than 0" },
        { status: 400 }
      );
    }

    const params: MortgageCalculatorParams = {
      loan_amount: Number(loan_amount),
      interest_rate: Number(interest_rate), // API expects percentage (e.g., 3.5 for 3.5%)
      duration_years: Number(duration_years),
    };

    try {
      // Try to fetch from API Ninjas
      const result = await calculateMortgage(params);
      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.warn("API Ninjas mortgage calculator failed, using manual calculation:", error);
      // Fallback to manual calculation
      const interestRateDecimal = params.interest_rate / 100; // Convert percentage to decimal
      const result = calculateMortgageManual(
        params.loan_amount,
        interestRateDecimal,
        params.duration_years
      );
      return NextResponse.json({
        success: true,
        data: result,
        fallback: true // Indicate this was a fallback calculation
      });
    }
  } catch (error) {
    console.error("Error in mortgage calculator endpoint:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to calculate mortgage: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

