import { NextRequest, NextResponse } from "next/server";
import { analyzePropertyRequestSchema, FUNDING_SOURCE_DOWN_PAYMENTS } from "../../../shared/schema";
import { parseEmailContent, analyzeProperty } from "../../lib/property-analyzer";
import { storage } from "../../../server/storage";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";
import { getMortgageRate } from "../../../server/mortgage-rate-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = analyzePropertyRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request: " + validation.error.errors.map(e => e.message).join(", ")
        },
        { status: 400 }
      );
    }

    const { emailContent, strMetrics, monthlyExpenses, fundingSource } = validation.data;
    
    // Parse mortgage values if provided (not in schema yet, so check body directly)
    const mortgageValues = (body as any).mortgageValues;

    // Parse email content to extract property data
    const propertyData = parseEmailContent(emailContent);

    // Use funding source to determine down payment percentage (same logic as in analyzeProperty)
    const propertyFundingSource = fundingSource || propertyData.funding_source || propertyData.fundingSource || 'conventional';
    
    // Use mortgage calculator values if provided, otherwise fetch mortgage rate
    let mortgageRate: number | undefined;
    if (mortgageValues) {
      // Convert interest rate from percentage to decimal
      mortgageRate = mortgageValues.interestRate / 100;
      console.log('Using mortgage calculator values:', {
        loanAmount: mortgageValues.loanAmount,
        interestRate: mortgageRate,
        loanTermYears: mortgageValues.loanTermYears,
        monthlyPayment: mortgageValues.monthlyPayment
      });
    } else {
      // Fetch current mortgage rate (fallback to 7% on error)
      const purchasePrice = propertyData.purchase_price || propertyData.purchasePrice || 0;
      const downpaymentPercentage = FUNDING_SOURCE_DOWN_PAYMENTS[propertyFundingSource as keyof typeof FUNDING_SOURCE_DOWN_PAYMENTS];
      const downpayment = purchasePrice * downpaymentPercentage;
      const loanAmount = purchasePrice - downpayment;
      mortgageRate = await getMortgageRate({
        loan_term: 30,
        loan_amount: loanAmount,
        zip_code: propertyData.zip_code || propertyData.zipCode,
      });
    }

    // Run TypeScript analysis with optional mortgage values
    const analysisData = analyzeProperty(propertyData, strMetrics, monthlyExpenses, propertyFundingSource, mortgageRate, mortgageValues);
    
    // Run AI analysis if available
    let analysisWithAI = analysisData;
    try {
      if (process.env.OPENAI_API_KEY) {
        const aiAnalysis = await coreAiService.analyzeProperty(analysisData.property as any);
        analysisWithAI = {
          ...analysisData,
          aiAnalysis
        } as any;
      }
    } catch (error) {
      console.warn("AI analysis failed, continuing without AI insights:", error);
    }

    // Store the analysis in memory
    const storedAnalysis = await storage.createDealAnalysis(analysisWithAI as any);

    return NextResponse.json({
      success: true,
      data: storedAnalysis
    });
  } catch (error) {
    console.error("Error in analyze endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during analysis" },
      { status: 500 }
    );
  }
}
