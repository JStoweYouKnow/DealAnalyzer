import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../server/storage";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";
import { analyzeProperty } from "../../lib/property-analyzer";
import { getMortgageRate } from "../../../server/mortgage-rate-service";
import { loadInvestmentCriteria } from "../../../server/services/criteria-service";
import { FUNDING_SOURCE_DOWN_PAYMENTS, mortgageValuesSchema } from "../../../shared/schema";

export async function POST(request: NextRequest) {
  try {
    const { property, dealId, fundingSource, mortgageValues } = await request.json();
    
    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property data is required" },
        { status: 400 }
      );
    }

    // Validate essential fields
    if (property.monthlyRent !== undefined && property.monthlyRent < 0) {
      return NextResponse.json(
        { success: false, error: "Monthly rent cannot be negative" },
        { status: 400 }
      );
    }

    if (property.adr !== undefined && property.adr < 0) {
      return NextResponse.json(
        { success: false, error: "ADR cannot be negative" },
        { status: 400 }
      );
    }

    if (property.purchasePrice !== undefined && property.purchasePrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Purchase price must be positive" },
        { status: 400 }
      );
    }

    console.log("Updating property with data:", JSON.stringify(property, null, 2));
    
    // Prepare property data for analysis (convert camelCase to snake_case for consistency)
    const propertyData: any = {
      address: property.address || "",
      city: property.city,
      state: property.state,
      zipCode: property.zipCode || property.zip_code,
      property_type: property.propertyType || property.property_type || "single-family",
      purchase_price: property.purchasePrice || property.purchase_price || 0,
      monthly_rent: property.monthlyRent || property.monthly_rent || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      square_footage: property.squareFootage || property.square_footage || 0,
      year_built: property.yearBuilt || property.year_built,
      description: property.description,
      listing_url: property.listingUrl || property.listing_url,
      adr: property.adr || 0,
      occupancyRate: property.occupancyRate || property.occupancy_rate || 0,
    };

    // Prepare STR metrics and monthly expenses if available
    const strMetrics = property.adr || property.occupancyRate ? {
      adr: property.adr,
      occupancyRate: property.occupancyRate,
      monthlyRent: property.monthlyRent || property.monthly_rent
    } : undefined;

    const monthlyExpenses = property.monthlyExpenses;

    // Use funding source from request, property data, or default to 'conventional'
    let propertyFundingSource: 'conventional' | 'fha' | 'va' | 'dscr' | 'cash' = 
      fundingSource || property.fundingSource || property.funding_source || 'conventional';
    
    // Validate funding source
    if (!Object.prototype.hasOwnProperty.call(FUNDING_SOURCE_DOWN_PAYMENTS, propertyFundingSource)) {
      propertyFundingSource = 'conventional';
    }

    // Validate mortgage values if provided
    let validatedMortgageValues = undefined;
    if (mortgageValues) {
      const validation = mortgageValuesSchema.safeParse(mortgageValues);
      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid mortgage values: " + validation.error.errors.map(e => e.message).join(", ")
          },
          { status: 400 }
        );
      }
      validatedMortgageValues = validation.data;
    }

    // Fetch mortgage rate if mortgageValues not provided
    let mortgageRate: number | undefined;
    if (!validatedMortgageValues) {
      const purchasePrice = propertyData.purchase_price || 0;
      if (purchasePrice > 0) {
        const downpaymentPercentage = FUNDING_SOURCE_DOWN_PAYMENTS[propertyFundingSource] || 0.20;
        const downpayment = purchasePrice * downpaymentPercentage;
        const loanAmount = purchasePrice - downpayment;
        
        try {
          const zipCode = propertyData.zipCode;
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
      } else {
        mortgageRate = 0.07; // Default fallback
      }
    }

    // Load investment criteria
    const criteria = await loadInvestmentCriteria();
    console.log('Using criteria for analysis:', {
      maxPurchasePrice: criteria.max_purchase_price,
      cocMinimum: criteria.coc_minimum_min,
      capMinimum: criteria.cap_minimum,
    });

    // Run TypeScript analysis
    const analysisData = analyzeProperty(
      propertyData,
      strMetrics,
      monthlyExpenses,
      propertyFundingSource,
      mortgageRate,
      validatedMortgageValues,
      criteria
    );

    console.log('Update analysis results:', {
      meetsCriteria: analysisData.meetsCriteria,
      cocReturn: analysisData.cocReturn,
      capRate: analysisData.capRate,
      cashFlow: analysisData.cashFlow,
    });

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
      console.warn("AI analysis failed for updated property, continuing without AI insights:", error);
    }

    // Find and update existing analysis
    // Preserve propertyId from existing analysis if available
    let storedAnalysis: any;
    const propertyId = (property as any).propertyId;
    if (property.address || propertyId) {
      let existingAnalysis: any;
      if (propertyId) {
        // Try to find by propertyId first (stored in analysis.propertyId)
        // Need to search all analyses to find one with matching propertyId
        const allAnalyses = await storage.getAnalysisHistory();
        existingAnalysis = allAnalyses.find(a => a.propertyId === propertyId);
        
        // If not found by propertyId, try by analysis ID
        if (!existingAnalysis && propertyId) {
          existingAnalysis = await storage.getDealAnalysis(propertyId);
        }
      }
      
      // If still not found, try by address
      if (!existingAnalysis && property.address) {
        existingAnalysis = await storage.findAnalysisByPropertyAddress(property.address as string);
      }
      
      if (existingAnalysis?.id) {
        // Preserve the original propertyId when updating
        analysisWithAI.propertyId = existingAnalysis.propertyId || analysisWithAI.propertyId;
        storedAnalysis = await storage.updateDealAnalysis(existingAnalysis.id, analysisWithAI);
      } else {
        storedAnalysis = await storage.createDealAnalysis(analysisWithAI);
      }
    } else {
      storedAnalysis = await storage.createDealAnalysis(analysisWithAI);
    }

    // If dealId is provided, update the email deal with the new analysis
    if (dealId) {
      const emailDeal = await storage.getEmailDeal(dealId);
      if (emailDeal) {
        await storage.updateEmailDeal(dealId, {
          analysis: storedAnalysis,
          status: 'analyzed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: storedAnalysis
    });
  } catch (error) {
    console.error("Error in update-property endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during property update" },
      { status: 500 }
    );
  }
}

