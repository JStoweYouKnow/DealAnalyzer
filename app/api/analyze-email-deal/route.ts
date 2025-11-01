import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../server/storage";
import { parseEmailContent, analyzeProperty } from "../../lib/property-analyzer";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";
import { getMortgageRate } from "../../../server/mortgage-rate-service";
import { loadInvestmentCriteria } from "../../../server/services/criteria-service";
import { FUNDING_SOURCE_DOWN_PAYMENTS } from "../../../shared/schema";

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
    // fundingSource is in propertyData after merge, or default to 'conventional'
    const propertyFundingSource = propertyData.fundingSource || propertyData.funding_source || 'conventional';
    // Use funding source to determine down payment percentage (same logic as in analyzeProperty)
    // Validate that propertyFundingSource exists as a key in FUNDING_SOURCE_DOWN_PAYMENTS
    const isValidFundingSource = propertyFundingSource in FUNDING_SOURCE_DOWN_PAYMENTS;
    const validatedFundingSource = isValidFundingSource ? propertyFundingSource : 'conventional';
    const downpaymentPercentage = FUNDING_SOURCE_DOWN_PAYMENTS[validatedFundingSource as keyof typeof FUNDING_SOURCE_DOWN_PAYMENTS] ?? 0.20;
    const downpayment = purchasePrice * downpaymentPercentage;
    const loanAmount = purchasePrice - downpayment;
    
    // Fetch mortgage rate with error handling
    let mortgageRate: number;
    try {
      const zipCode = propertyData.zip_code || propertyData.zipCode;
      if (zipCode) {
        mortgageRate = await getMortgageRate({
          loan_term: 30,
          loan_amount: loanAmount,
          zip_code: zipCode,
        });
      } else {
        console.warn('No zip code found in property data, using default mortgage rate of 7%');
        mortgageRate = 0.07;
      }
    } catch (error) {
      console.error('Error fetching mortgage rate, falling back to 7%:', error);
      mortgageRate = 0.07;
    }

    // Fetch current investment criteria
    const criteria = await loadInvestmentCriteria();
    
    const analysisData = analyzeProperty(propertyData, strMetrics, undefined, validatedFundingSource as any, mortgageRate, undefined, criteria);

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

