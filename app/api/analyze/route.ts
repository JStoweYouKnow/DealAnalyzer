import { NextRequest, NextResponse } from "next/server";
import { analyzePropertyRequestSchema } from "../../../shared/schema";
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

    // Parse email content to extract property data
    const propertyData = parseEmailContent(emailContent);

    // Fetch current mortgage rate (fallback to 7% on error)
    const purchasePrice = propertyData.purchase_price || propertyData.purchasePrice || 0;
    const downpayment = purchasePrice * 0.2; // Approximate for rate lookup
    const loanAmount = purchasePrice - downpayment;
    const mortgageRate = await getMortgageRate({
      loan_term: 30,
      loan_amount: loanAmount,
      zip_code: propertyData.zip_code || propertyData.zipCode,
    });

    // Run TypeScript analysis
    const analysisData = analyzeProperty(propertyData, strMetrics, monthlyExpenses, fundingSource, mortgageRate);
    
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
