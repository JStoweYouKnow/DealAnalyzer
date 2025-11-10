import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../server/storage";
import { parseEmailContent, analyzeProperty } from "../../lib/property-analyzer";
import { loadInvestmentCriteria } from "../../../server/services/criteria-service";
import { FUNDING_SOURCE_DOWN_PAYMENTS } from "../../../shared/schema";
import { withRateLimit, expensiveRateLimit } from "../../lib/rate-limit";

export async function POST(request: NextRequest) {
  return withRateLimit(request, expensiveRateLimit, async (req) => {
  try {
    const { dealId, emailContent, fundingSource, mortgageValues } = await request.json();
    
    if (!dealId || !emailContent) {
      return NextResponse.json(
        { success: false, error: "Deal ID and email content are required" },
        { status: 400 }
      );
    }

    // Get the email deal
    console.log(`[analyze-email-deal] Looking for email deal with ID: ${dealId}`);
    const emailDeal = await storage.getEmailDeal(dealId);
    if (!emailDeal) {
      // Log available deals for debugging (limit to first 10 to avoid spam)
      try {
        const allDeals = await storage.getEmailDeals();
        console.log(`[analyze-email-deal] Total deals in storage: ${allDeals.length}`);
        console.log(`[analyze-email-deal] Available deal IDs (first 10):`, allDeals.slice(0, 10).map(d => d.id));
      } catch (err) {
        console.error('[analyze-email-deal] Error fetching deals list:', err);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Email deal not found with ID: ${dealId}`,
          suggestion: "Please refresh the deals list and try again. The deal may have been deleted or the ID may be incorrect."
        },
        { status: 404 }
      );
    }
    console.log(`[analyze-email-deal] Found email deal: ${emailDeal.id}`);

    // Parse and analyze the email content using TypeScript
    const propertyData = parseEmailContent(emailContent);
    
    // Merge extracted property data from emailDeal
    if (emailDeal.extractedProperty) {
      Object.assign(propertyData, emailDeal.extractedProperty);
    }
    
    // Ensure purchasePrice is set in propertyData (extractedProperty may have 'price' instead of 'purchasePrice')
    // This handles the case where extractedProperty has 'price' but analyzeProperty expects 'purchasePrice'
    const purchasePrice = propertyData.purchase_price || propertyData.purchasePrice || propertyData.price || emailDeal.extractedProperty?.price || 0;
    if (purchasePrice > 0) {
      propertyData.purchasePrice = purchasePrice;
      propertyData.purchase_price = purchasePrice;
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
    
    // Use funding source to determine down payment percentage (same logic as in analyzeProperty)
    // Use fundingSource from request, or from propertyData, or default to 'conventional'
    let propertyFundingSource = fundingSource || propertyData.funding_source || propertyData.fundingSource || 'conventional';
    // Validate that propertyFundingSource exists as a key in FUNDING_SOURCE_DOWN_PAYMENTS
    if (!Object.prototype.hasOwnProperty.call(FUNDING_SOURCE_DOWN_PAYMENTS, propertyFundingSource)) {
      propertyFundingSource = 'conventional';
    }
    
    // Use mortgage calculator values if provided, otherwise fetch mortgage rate
    // Note: mortgageRate should be passed directly as a decimal if provided
    // MortgageValues no longer includes interestRate - use monthlyPayment directly
    let mortgageRate: number | undefined;
    if (mortgageValues) {
      console.log('Using mortgage calculator values:', {
        loanAmount: mortgageValues.loanAmount,
        loanTermYears: mortgageValues.loanTermYears,
        monthlyPayment: mortgageValues.monthlyPayment
      });
      // mortgageRate will be undefined when mortgageValues is provided,
      // and analyzeProperty will use mortgageValues.monthlyPayment directly
    } else {
      // Fetch current mortgage rate (fallback to 7% on error)
      // Use the purchasePrice we extracted and set above (already defined above)
      const downpaymentPercentage = FUNDING_SOURCE_DOWN_PAYMENTS[propertyFundingSource as keyof typeof FUNDING_SOURCE_DOWN_PAYMENTS] || 0.20;
      const downpayment = purchasePrice * downpaymentPercentage;
      const loanAmount = purchasePrice - downpayment;
      
      // Fetch mortgage rate with error handling (lazy import to avoid build-time evaluation)
      try {
        const zipCode = propertyData.zip_code || propertyData.zipCode;
        if (zipCode) {
          const { getMortgageRate } = await import("../../../server/mortgage-rate-service");
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
    }

    // Fetch current investment criteria
    const criteria = await loadInvestmentCriteria();
    
    // Run TypeScript analysis with optional mortgage values and criteria
    const analysisData = analyzeProperty(propertyData, strMetrics, undefined, propertyFundingSource as any, mortgageRate, mortgageValues, criteria);

    // Run AI analysis if available (lazy import to avoid build-time evaluation)
    let analysisWithAI = analysisData;
    try {
      if (process.env.OPENAI_API_KEY) {
        const { aiAnalysisService: coreAiService } = await import("../../../server/ai-service");
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
  });
}

