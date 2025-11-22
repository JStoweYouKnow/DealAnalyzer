import { NextRequest, NextResponse } from "next/server";
import { analyzePropertyRequestSchema, FUNDING_SOURCE_DOWN_PAYMENTS } from "../../../shared/schema";
import { parseEmailContent, analyzeProperty } from "../../lib/property-analyzer";
import { storage } from "../../../server/storage";
import { getAiService } from "../../lib/lazy-load";
import { getMortgageRate } from "../../../server/mortgage-rate-service";
import { loadInvestmentCriteria, DEFAULT_CRITERIA } from "../../../server/services/criteria-service";
import { withRateLimit, expensiveRateLimit } from "../../lib/rate-limit";
import { runInParallel, apiLimit, heavyLimit } from "../../lib/parallel-utils";
import { sendNotificationIfEnabled } from "../../../server/services/notification-helper";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  return withRateLimit(request, expensiveRateLimit, async (req) => {
  try {
    const body = await req.json();
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

    const { emailContent, strMetrics, monthlyExpenses, fundingSource, mortgageValues } = validation.data;

    // Parse email content to extract property data
    const propertyData = parseEmailContent(emailContent);

    // Use funding source to determine down payment percentage (same logic as in analyzeProperty)
    let propertyFundingSource = fundingSource || propertyData.funding_source || propertyData.fundingSource || 'conventional';
    // Validate that propertyFundingSource exists as a key in FUNDING_SOURCE_DOWN_PAYMENTS
    if (!Object.prototype.hasOwnProperty.call(FUNDING_SOURCE_DOWN_PAYMENTS, propertyFundingSource)) {
      propertyFundingSource = 'conventional';
    }
    
    const purchasePrice = propertyData.purchase_price || propertyData.purchasePrice || 0;
    const downpaymentPercentage = FUNDING_SOURCE_DOWN_PAYMENTS[propertyFundingSource as keyof typeof FUNDING_SOURCE_DOWN_PAYMENTS] || 0.20;
    const downpayment = purchasePrice * downpaymentPercentage;
    const loanAmount = purchasePrice - downpayment;
    
    // Use mortgage calculator values if provided, otherwise fetch mortgage rate and criteria in parallel
    // Note: mortgageRate should be passed directly as a decimal if provided
    // MortgageValues no longer includes interestRate - use monthlyPayment directly
    let mortgageRate: number | undefined;
    let criteria;
    
    if (mortgageValues) {
      logger.debug('Using mortgage calculator values', {
        loanAmount: mortgageValues.loanAmount,
        loanTermYears: mortgageValues.loanTermYears,
        monthlyPayment: mortgageValues.monthlyPayment,
      });
      // mortgageRate will be undefined when mortgageValues is provided,
      // and analyzeProperty will use mortgageValues.monthlyPayment directly
      
      // Only fetch criteria in parallel
      criteria = await apiLimit(() => loadInvestmentCriteria().catch(() => DEFAULT_CRITERIA));
    } else {
      // Fetch mortgage rate and criteria in parallel (they're independent)
      const zipCode = propertyData.zip_code || propertyData.zipCode;
      
      const { mortgageRate: fetchedRate, criteria: fetchedCriteria } = await runInParallel({
        mortgageRate: zipCode && loanAmount > 0
          ? apiLimit(() => getMortgageRate({
              loan_term: 30,
              loan_amount: loanAmount,
              zip_code: zipCode,
            }).catch(() => 0.07)) // Fallback to 7% on error
          : Promise.resolve(0.07),
        criteria: apiLimit(() => loadInvestmentCriteria().catch(() => DEFAULT_CRITERIA)),
      });
      
      mortgageRate = fetchedRate;
      criteria = fetchedCriteria;
    }
    
    logger.debug('Using criteria for analysis', {
      maxPurchasePrice: criteria.max_purchase_price,
      cocMinimum: criteria.coc_minimum_min,
      capMinimum: criteria.cap_minimum,
    });

    // Run TypeScript analysis with optional mortgage values and criteria
    const analysisData = analyzeProperty(propertyData, strMetrics, monthlyExpenses, propertyFundingSource, mortgageRate, mortgageValues, criteria);
    
    logger.info('Property analysis completed', {
      meetsCriteria: analysisData.meetsCriteria,
      cocReturn: analysisData.cocReturn,
      capRate: analysisData.capRate,
      cashFlow: analysisData.cashFlow,
      totalMonthlyExpenses: analysisData.totalMonthlyExpenses,
      address: analysisData.property?.address,
    });
    
    // Run AI analysis if available (lazy loaded for better initial performance)
    let analysisWithAI = analysisData;
    try {
      if (process.env.OPENAI_API_KEY) {
        // Lazy load AI service only when needed
        const { aiAnalysisService: coreAiService } = await getAiService();
        // Use heavyLimit for AI operations (they're expensive)
        const aiAnalysis = await heavyLimit(() => coreAiService.analyzeProperty(analysisData.property as any));
        analysisWithAI = {
          ...analysisData,
          aiAnalysis
        } as any;
      }
    } catch (error) {
      logger.warn("AI analysis failed, continuing without AI insights", error instanceof Error ? error : undefined);
    }

    // Store the analysis in memory
    const storedAnalysis = await storage.createDealAnalysis(analysisWithAI as any);

    // Send email notifications if enabled
    try {
      const { auth } = await import("@clerk/nextjs/server");
      const authResult = await auth();
      const userId = authResult?.userId;

      if (userId) {
        const notificationLogger = logger.withContext({ userId });
        
        // Get user email from Clerk as fallback
        let userEmail: string | undefined;
        try {
          const { currentUser } = await import("@clerk/nextjs/server");
          const user = await currentUser();
          userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
        } catch (error) {
          // Ignore - will use preferences email only
        }

        // Send analysis complete notification
        await sendNotificationIfEnabled(
          userId,
          'analysis_complete',
          {
            subject: 'Property Analysis Complete',
            data: {
              id: storedAnalysis.id,
              address: analysisData.property.address,
              meetsCriteria: analysisData.meetsCriteria,
            },
          },
          userEmail
        );

        // Send criteria match notification if property meets criteria
        if (analysisData.meetsCriteria) {
          notificationLogger.info('Property meets criteria, sending notification', {
            analysisId: storedAnalysis.id,
            address: analysisData.property.address,
          });
          
          await sendNotificationIfEnabled(
            userId,
            'criteria_match',
            {
              subject: 'Property Meets Your Investment Criteria!',
              data: {
                id: storedAnalysis.id,
                address: analysisData.property.address,
                cocReturn: analysisData.cocReturn,
                capRate: analysisData.capRate,
              },
            },
            userEmail
          );
        }
      }
    } catch (error) {
      // Don't fail the request if notifications fail
      logger.error('Failed to send analysis notifications', error instanceof Error ? error : undefined);
    }

    return NextResponse.json({
      success: true,
      data: storedAnalysis
    });
  } catch (error) {
    logger.error("Error in analyze endpoint", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { success: false, error: "Internal server error during analysis" },
      { status: 500 }
    );
  }
  });
}
