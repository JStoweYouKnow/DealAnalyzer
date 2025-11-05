import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../server/storage";
import { generateReportBuffer } from "../../../server/report-generator";
import { FUNDING_SOURCE_DOWN_PAYMENTS } from "../../../shared/schema";

/**
 * Normalizes an object's keys from snake_case to camelCase.
 * External sources (e.g., email parsers, API responses) may provide data in snake_case,
 * so we normalize to camelCase at the data parsing boundary for consistency.
 */
function normalizeKeysToCamelCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeKeysToCamelCase(item));
  }
  
  const normalized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Convert snake_case to camelCase (e.g., "funding_source" -> "fundingSource")
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    normalized[camelKey] = normalizeKeysToCamelCase(value);
  }
  
  return normalized;
}

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
          } else if (emailDeal.extractedProperty || emailDeal.emailContent) {
            // Create a basic analysis from the email deal data
            try {
              console.log(`Creating analysis from email deal ${dealId}`);
              
              const propertyData = parseEmailContent(emailDeal.emailContent || '');
              
              // Merge extracted property data with normalization
              // Normalize snake_case keys to camelCase because external sources may provide snake_case
              // Merge uses parsed data first, then extractedProperty overrides (Object.assign applies left-to-right, so normalizedExtracted passed after propertyData will override parsed values; the last argument wins)
              if (emailDeal.extractedProperty) {
                const normalizedExtracted = normalizeKeysToCamelCase(emailDeal.extractedProperty);
                Object.assign(propertyData, normalizedExtracted);
              }
              
              // Validate essential fields after merging
              // Check both parsed data (propertyData) and extractedProperty fallbacks
              const purchasePrice = propertyData.purchasePrice || propertyData.price || emailDeal.extractedProperty?.price || 0;
              const adr = propertyData.adr || emailDeal.extractedProperty?.adr || 0;
              let occupancyRate = propertyData.occupancyRate || emailDeal.extractedProperty?.occupancyRate;
              
              // Normalize occupancyRate if it's a percentage (e.g., 85 instead of 0.85)
              if (occupancyRate !== undefined && occupancyRate !== null && occupancyRate > 1) {
                occupancyRate = occupancyRate / 100;
              }
              
              // Validate all essential fields are present and non-zero/valid
              const missingFields: string[] = [];
              
              if (!purchasePrice || purchasePrice === 0 || isNaN(Number(purchasePrice))) {
                missingFields.push(`purchasePrice/price (value: ${purchasePrice})`);
              }
              
              if (!adr || adr === 0 || isNaN(Number(adr))) {
                missingFields.push(`ADR (value: ${adr})`);
              }
              
              if (occupancyRate === undefined || occupancyRate === null || occupancyRate === 0 || isNaN(Number(occupancyRate))) {
                missingFields.push(`occupancyRate (value: ${occupancyRate})`);
              }
              
              // If any essential fields are missing, log warning and skip this deal
              if (missingFields.length > 0) {
                console.warn(`Skipping deal ${dealId}: missing or invalid essential fields - ${missingFields.join(', ')}`);
                continue;
              }
              
              // Prepare STR metrics
              // Build strMetrics by conditionally adding only defined properties
              const strMetricsObj: any = {};
              if (adr !== undefined && adr > 0) {
                strMetricsObj.adr = adr;
              }
              if (occupancyRate !== undefined && occupancyRate > 0) {
                strMetricsObj.occupancyRate = occupancyRate;
              }
              if (emailDeal.extractedProperty?.monthlyRent !== undefined) {
                strMetricsObj.monthlyRent = emailDeal.extractedProperty.monthlyRent;
              }
              
              const strMetrics = Object.keys(strMetricsObj).length > 0 ? strMetricsObj : undefined;
              
              // Fetch mortgage rate
              
              // fundingSource is in propertyData after merge (normalized to camelCase), or default to 'conventional'
              const propertyFundingSource = propertyData.fundingSource || 'conventional';
              // Use funding source to determine down payment percentage (same logic as in analyzeProperty)
              const downpaymentPercentage = FUNDING_SOURCE_DOWN_PAYMENTS[propertyFundingSource as keyof typeof FUNDING_SOURCE_DOWN_PAYMENTS] ?? 0.20;
              const downpayment = purchasePrice * downpaymentPercentage;
              const loanAmount = purchasePrice - downpayment;
              
              let mortgageRate: number;
              try {
                mortgageRate = await getMortgageRate({
                  loan_term: 30,
                  loan_amount: loanAmount,
                  zip_code: propertyData.zipCode,
                });
              } catch (rateError) {
                console.warn(`Failed to fetch mortgage rate for deal ${dealId}, using default:`, rateError);
                mortgageRate = 0.07; // Default to 7%
              }
              
              // Create analysis
              const analysis = analyzeProperty(propertyData, strMetrics, undefined, propertyFundingSource, mortgageRate);
              
              // Add deal identifier
              analysis.propertyId = dealId;
              analyses.push(analysis);
              console.log(`Successfully created analysis for deal ${dealId}`);
            } catch (analysisError) {
              console.error(`Error creating analysis for deal ${dealId}:`, analysisError);
              // Continue with other deals instead of failing completely
              // This allows partial success if some deals can be analyzed
            }
          } else {
            console.warn(`Deal ${dealId} has no analysis, extractedProperty, or emailContent - skipping`);
          }
        } else {
          console.warn(`Email deal ${dealId} not found`);
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
      // Double-check the content type matches what was requested
      if (result.contentType !== 'application/pdf') {
        console.error("Content type mismatch: requested PDF but got", result.contentType);
        return NextResponse.json(
          { success: false, error: `Expected PDF but got ${result.contentType}` },
          { status: 500 }
        );
      }
      
      const pdfHeader = result.buffer.slice(0, 4).toString('ascii');
      if (pdfHeader !== '%PDF') {
        console.error("Invalid PDF buffer, header:", pdfHeader, "buffer length:", result.buffer.length);
        // Log first 100 bytes for debugging
        console.error("First 100 bytes:", result.buffer.slice(0, 100).toString('hex'));
        return NextResponse.json(
          { success: false, error: `Generated PDF is invalid: expected '%PDF' header but got '${pdfHeader}'` },
          { status: 500 }
        );
      }
    }
    
    return new NextResponse(new Uint8Array(result.buffer), {
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

