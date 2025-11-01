import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../server/storage";
import { generateReportBuffer } from "../../../server/report-generator";
import { FUNDING_SOURCE_DOWN_PAYMENTS } from "../../../shared/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisIds, dealIds, format, title, includeComparison } = body;
    
    if ((!analysisIds || !Array.isArray(analysisIds) || analysisIds.length === 0) &&
        (!dealIds || !Array.isArray(dealIds) || dealIds.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Analysis IDs or Deal IDs are required" },
        { status: 400 }
      );
    }

    if (!format || !['pdf', 'csv'].includes(format)) {
      return NextResponse.json(
        { success: false, error: "Valid format (pdf or csv) is required" },
        { status: 400 }
      );
    }

    // Get analyses from storage
    const analyses: any[] = [];
    
    // Handle analysis IDs
    if (analysisIds && Array.isArray(analysisIds) && analysisIds.length > 0) {
      console.log("Looking for analyses with IDs:", analysisIds);
      for (const id of analysisIds) {
        console.log(`Looking for analysis with ID: ${id}`);
        const analysis = await storage.getDealAnalysis(id);
        console.log(`Analysis ${id} found:`, !!analysis);
        if (analysis) {
          analyses.push(analysis);
        }
      }
    }
    
    // Handle deal IDs - convert email deals to analysis format
    if (dealIds && Array.isArray(dealIds) && dealIds.length > 0) {
      console.log("Looking for email deals with IDs:", dealIds);
      const { parseEmailContent, analyzeProperty } = await import("../../lib/property-analyzer");
      const { getMortgageRate } = await import("../../../server/mortgage-rate-service");
      
      for (const dealId of dealIds) {
        console.log(`Looking for email deal with ID: ${dealId}`);
        const emailDeal = await storage.getEmailDeal(dealId);
        
        if (emailDeal) {
          // If deal has an analysis, use it
          if (emailDeal.analysis) {
            analyses.push(emailDeal.analysis);
          } else if (emailDeal.extractedProperty) {
            // Create a basic analysis from the email deal data
            console.log(`Creating analysis from email deal ${dealId}`);
            
            const propertyData = parseEmailContent(emailDeal.emailContent);
            
            // Merge extracted property data
            if (emailDeal.extractedProperty) {
              Object.assign(propertyData, emailDeal.extractedProperty);
            }
            
            // Prepare STR metrics
            let occupancyRate = emailDeal.extractedProperty?.occupancyRate;
            if (occupancyRate !== undefined && occupancyRate > 1) {
              occupancyRate = occupancyRate / 100;
            }
            
            const strMetrics = emailDeal.extractedProperty?.adr || occupancyRate
              ? {
                  adr: emailDeal.extractedProperty?.adr,
                  occupancyRate: occupancyRate,
                  monthlyRent: emailDeal.extractedProperty?.monthlyRent
                }
              : undefined;
            
            // Fetch mortgage rate
            const purchasePrice = propertyData.purchase_price || propertyData.purchasePrice || emailDeal.extractedProperty?.price || 0;
            // fundingSource is in propertyData after merge, or default to 'conventional'
            let propertyFundingSource = propertyData.fundingSource || propertyData.funding_source || 'conventional';
            // Validate that propertyFundingSource exists as a key in FUNDING_SOURCE_DOWN_PAYMENTS
            if (!Object.prototype.hasOwnProperty.call(FUNDING_SOURCE_DOWN_PAYMENTS, propertyFundingSource)) {
              propertyFundingSource = 'conventional';
            }
            // Use funding source to determine down payment percentage (same logic as in analyzeProperty)
            const downpaymentPercentage = FUNDING_SOURCE_DOWN_PAYMENTS[propertyFundingSource as keyof typeof FUNDING_SOURCE_DOWN_PAYMENTS] || 0.20;
            const downpayment = purchasePrice * downpaymentPercentage;
            const loanAmount = purchasePrice - downpayment;
            const mortgageRate = await getMortgageRate({
              loan_term: 30,
              loan_amount: loanAmount,
              zip_code: propertyData.zip_code || propertyData.zipCode,
            });
            
            // Create analysis
            const analysis = analyzeProperty(propertyData, strMetrics, undefined, propertyFundingSource, mortgageRate);
            
            // Add deal identifier
            analysis.propertyId = dealId;
            analyses.push(analysis);
          }
        }
      }
    }
    
    console.log(`Found ${analyses.length} analyses out of ${(analysisIds?.length || 0) + (dealIds?.length || 0)} requested`);

    if (analyses.length === 0) {
      return NextResponse.json(
        { success: false, error: "No analyses or deals found for the provided IDs" },
        { status: 404 }
      );
    }

    const reportData = {
      analyses
    };

    const options = {
      format: format as 'pdf' | 'csv',
      title: title || `Property Analysis Report`,
      includeComparison
    };

    // Generate the report buffer (no file system needed)
    console.log("Generating report with format:", options.format);
    const result = await generateReportBuffer(reportData, options);
    console.log("Report generated, buffer size:", result.buffer.length);
    
    // Validate buffer is not empty
    if (!result.buffer || result.buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Generated report is empty" },
        { status: 500 }
      );
    }
    
    // Validate PDF buffer starts with PDF magic bytes
    if (options.format === 'pdf') {
      const pdfHeader = result.buffer.slice(0, 4).toString('ascii');
      if (pdfHeader !== '%PDF') {
        console.error("Invalid PDF buffer, header:", pdfHeader);
        return NextResponse.json(
          { success: false, error: "Generated PDF is invalid" },
          { status: 500 }
        );
      }
    }
    
    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Type': result.contentType,
        'Content-Length': result.buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);
    
    return NextResponse.json(
      { success: false, error: `Failed to generate report: ${errorMessage}` },
      { status: 500 }
    );
  }
}

