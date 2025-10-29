import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../server/storage";
import { parseEmailContent, analyzeProperty } from "../../lib/property-analyzer";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";
import { getMortgageRate } from "../../../server/mortgage-rate-service";

export async function POST(request: NextRequest) {
  try {
    const { dealId, emailContent } = await request.json();
    
    if (!dealId || !emailContent) {
      return NextResponse.json(
        { success: false, error: "Deal ID and email content are required" },
        { status: 400 }
      );
    }

    // Get the email deal
    const emailDeal = await storage.getEmailDeal(dealId);
    if (!emailDeal) {
      return NextResponse.json(
        { success: false, error: "Email deal not found" },
        { status: 404 }
      );
    }

    // Parse and analyze the email content using TypeScript
    const propertyData = parseEmailContent(emailContent);
    
    // Merge extracted property data from emailDeal
    if (emailDeal.extractedProperty) {
      Object.assign(propertyData, emailDeal.extractedProperty);
    }
    
    // Prepare STR metrics if available
    // Convert occupancy rate from percentage (0-100) to decimal (0-1) if needed
    let occupancyRate = emailDeal.extractedProperty?.occupancyRate;
    if (occupancyRate !== undefined && occupancyRate > 1) {
      // If it's stored as percentage (e.g., 74), convert to decimal (0.74)
      occupancyRate = occupancyRate / 100;
    }
    
    const strMetrics = emailDeal.extractedProperty?.adr || occupancyRate
      ? {
          adr: emailDeal.extractedProperty?.adr,
          occupancyRate: occupancyRate,
          monthlyRent: emailDeal.extractedProperty?.monthlyRent
        }
      : undefined;
    
    // Fetch current mortgage rate (fallback to 7% on error)
    const purchasePrice = propertyData.purchase_price || propertyData.purchasePrice || emailDeal.extractedProperty?.price || 0;
    const fundingSource = emailDeal.extractedProperty?.fundingSource || 'conventional';
    const downpayment = purchasePrice * 0.2; // Approximate for rate lookup
    const loanAmount = purchasePrice - downpayment;
    const mortgageRate = await getMortgageRate({
      loan_term: 30,
      loan_amount: loanAmount,
      zip_code: propertyData.zip_code || propertyData.zipCode || emailDeal.extractedProperty?.zipCode,
    });

    const analysisData = analyzeProperty(propertyData, strMetrics, undefined, fundingSource, mortgageRate);

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

    // Store the analysis
    const storedAnalysis = await storage.createDealAnalysis(analysisWithAI as any);

    // Update the email deal with the analysis
    await storage.updateEmailDeal(dealId, {
      analysis: storedAnalysis as any,
      status: 'analyzed'
    } as any);

    return NextResponse.json({
      success: true,
      data: storedAnalysis
    });
  } catch (error) {
    console.error("Error analyzing email deal:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { success: false, error: `Failed to analyze email deal: ${errorMessage}` },
      { status: 500 }
    );
  }
}

