import { NextRequest, NextResponse } from "next/server";
import { parseFileContent } from "../../lib/file-parser";
import { analyzeProperty } from "../../lib/property-analyzer";
import { storage } from "../../../server/storage";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";
import { getMortgageRate } from "../../../server/mortgage-rate-service";
import { FUNDING_SOURCE_DOWN_PAYMENTS } from "../../../shared/schema";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Read file content directly into memory (no temp files needed for Vercel)
    const fileContent = await file.text();

    // Parse additional form data
    let strMetrics, monthlyExpenses, mortgageValues;
    let fundingSource: 'conventional' | 'fha' | 'va' | 'dscr' | 'cash' | undefined = undefined;
    try {
      if (formData.get('strMetrics')) {
        strMetrics = JSON.parse(formData.get('strMetrics') as string);
      }
      if (formData.get('monthlyExpenses')) {
        monthlyExpenses = JSON.parse(formData.get('monthlyExpenses') as string);
      }
      if (formData.get('mortgageValues')) {
        mortgageValues = JSON.parse(formData.get('mortgageValues') as string);
      }
      const fundingSourceStr = formData.get('fundingSource') as string | null;
      if (fundingSourceStr && ['conventional', 'fha', 'va', 'dscr', 'cash'].includes(fundingSourceStr)) {
        fundingSource = fundingSourceStr as 'conventional' | 'fha' | 'va' | 'dscr' | 'cash';
      }
    } catch (e) {
      console.warn("Failed to parse form data:", e);
    }

    // Get file extension
    const originalName = file.name;
    const fileExtension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();

    console.log(`Running TypeScript file analysis for: ${originalName}, extension: ${fileExtension}`);

    // Parse file content
    const propertyData = await parseFileContent(fileContent, fileExtension, strMetrics, monthlyExpenses);

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

    // Run analysis with optional mortgage values
    const analysisData = analyzeProperty(
      propertyData, 
      strMetrics, 
      monthlyExpenses, 
      propertyFundingSource, 
      mortgageRate,
      mortgageValues // Pass mortgage calculator values
    );
    
    console.log("Analysis result: Success");

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
    console.error("Error in analyze-file endpoint:", error);
    
    return NextResponse.json(
      { success: false, error: `Internal server error during file analysis: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
