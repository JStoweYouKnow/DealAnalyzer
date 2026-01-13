import { NextRequest, NextResponse } from "next/server";
import { parseFileContent } from "../../lib/file-parser";
import { analyzeProperty } from "../../lib/property-analyzer";
import { storage } from "../../../server/storage";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";
import { getMortgageRate } from "../../../server/mortgage-rate-service";
import { loadInvestmentCriteria } from "../../../server/services/criteria-service";
import { FUNDING_SOURCE_DOWN_PAYMENTS, mortgageValuesSchema } from "@dealanalyzer/types";
import { getPdfExtractor } from "../../lib/lazy-load";
import { withRateLimit, expensiveRateLimit } from "../../lib/rate-limit";

export async function POST(request: NextRequest) {
  return withRateLimit(request, expensiveRateLimit, async (req) => {
  try {
    console.log('=== Analyze File API Called [v2.0] ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Content-Type:', request.headers.get('content-type'));
    
    const formData = await request.formData();
    const formDataKeys = Array.from(formData.keys());
    console.log('FormData received, entries:', formDataKeys);
    console.log('FormData entries details:', formDataKeys.map(key => {
      const value = formData.get(key);
      return {
        key,
        type: typeof value,
        isFile: value instanceof File,
        value: value instanceof File 
          ? `File: ${value.name}, size: ${value.size}` 
          : String(value).substring(0, 200)
      };
    }));
    
    // Log all entries with full details
    console.log('=== Full FormData dump ===');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - name: ${value.name}, size: ${value.size}, type: ${value.type}`);
      } else {
        console.log(`${key}: ${typeof value} - ${String(value).substring(0, 500)}`);
      }
    }
    
    const file = formData.get('file') as File | null;
    const propertyDataJson = formData.get('propertyData') as string | null;
    
    // Debug: Log raw FormData values
    console.log('=== FormData Debug ===');
    console.log('All FormData entries:', Array.from(formData.entries()).map(([key, value]) => ({
      key,
      valueType: typeof value,
      valuePreview: value instanceof File 
        ? `File: ${value.name}, size: ${value.size}` 
        : String(value).substring(0, 200)
    })));
    
    console.log('File check:', { 
      hasFile: !!file, 
      fileType: file?.constructor?.name,
      fileSize: (file as any)?.size,
      hasPropertyData: !!propertyDataJson,
      propertyDataLength: propertyDataJson?.length,
      propertyDataType: typeof propertyDataJson,
      propertyDataValue: propertyDataJson ? propertyDataJson.substring(0, 200) : null
    });
    
    // Allow either file or propertyData (for URL-extracted properties)
    if (!file && !propertyDataJson) {
      console.error('No file or propertyData found in formData. Keys:', formDataKeys);
      console.error('FormData entries:', Array.from(formData.entries()).map(([k, v]) => [k, typeof v, v instanceof File ? 'File' : String(v).substring(0, 50)]));
      return NextResponse.json(
        { success: false, error: "No file uploaded and no property data provided. Please select a file, extract from URL, or provide property data. [v2.0]" },
        { status: 400 }
      );
    }
    
    let fileContent: string = ''; // Initialize to empty string
    let propertyData: any = null;
    let fileExtension: string = '.txt'; // Default extension
    let originalName: string = 'property-data'; // Default name
    
    // If propertyData is provided, use it instead of parsing a file
    if (propertyDataJson) {
      try {
        propertyData = JSON.parse(propertyDataJson);
        console.log('Property data received from URL extraction:', propertyData);
        // Format property data as text content for parsing
        fileContent = `Property Listing:
Address: ${propertyData.address || 'N/A'}
City: ${propertyData.city || 'N/A'}
State: ${propertyData.state || 'N/A'}
Zip Code: ${propertyData.zipCode || 'N/A'}
Purchase Price: $${propertyData.purchasePrice || 'N/A'}
Bedrooms: ${propertyData.bedrooms || 'N/A'}
Bathrooms: ${propertyData.bathrooms || 'N/A'}
Square Footage: ${propertyData.squareFootage || 'N/A'}
Lot Size: ${propertyData.lotSize || 'N/A'}
Year Built: ${propertyData.yearBuilt || 'N/A'}
Property Type: ${propertyData.propertyType || 'N/A'}
Monthly Rent: $${propertyData.monthlyRent || 'N/A'}
HOA: $${propertyData.hoa || 'N/A'}
Property Taxes (Annual): $${propertyData.propertyTaxes || 'N/A'}
Description: ${propertyData.description || 'N/A'}
Listing URL: ${propertyData.listingUrl || propertyData.url || 'N/A'}
Source: ${propertyData.source || 'N/A'}`;
      } catch (parseError) {
        console.error('Failed to parse propertyData JSON:', parseError);
        return NextResponse.json(
          { success: false, error: "Invalid property data format" },
          { status: 400 }
        );
      }
    } else if (file) {
      console.log('File received:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Get file extension first to determine how to read it
      originalName = file.name;
      fileExtension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
      
      // Validate file size (max 50MB)
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { success: false, error: `File size exceeds maximum allowed size of 50MB. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
          { status: 400 }
        );
      }

      // Read file content directly into memory (no temp files needed for Vercel)
      // For PDFs, extract text using PDF.js; for other files, read as text
      try {
        if (fileExtension === '.pdf') {
          console.log(`Extracting text from PDF file: ${originalName}, size: ${file.size} bytes`);
          // Lazy load PDF extractor only when needed
          const { extractTextFromPDF } = await getPdfExtractor();
          fileContent = await extractTextFromPDF(file);
          
          if (!fileContent || fileContent.trim().length === 0) {
            throw new Error('PDF extraction returned empty content. The PDF may be image-based or encrypted.');
          }
          
          console.log(`PDF text extracted successfully - length: ${fileContent.length} characters`);
          console.log(`PDF text preview (first 500 chars): ${fileContent.substring(0, 500)}`);
        } else {
          fileContent = await file.text();
          console.log(`File content length: ${fileContent.length} characters`);
          console.log(`File content preview (first 500 chars): ${fileContent.substring(0, 500)}`);
        }
      } catch (error) {
        console.error('Error reading/extracting file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Full error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to read file: ${errorMessage}`,
          details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        },
        { status: 400 }
      );
      }
    }

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
        const rawMortgageValues = JSON.parse(formData.get('mortgageValues') as string);
        // Validate mortgage values using schema
        const validation = mortgageValuesSchema.safeParse(rawMortgageValues);
        if (!validation.success) {
          return NextResponse.json(
            { 
              success: false, 
              error: "Invalid mortgage values: " + validation.error.errors.map(e => e.message).join(", ")
            },
            { status: 400 }
          );
        }
        mortgageValues = validation.data;
      }
      const fundingSourceStr = formData.get('fundingSource') as string | null;
      if (fundingSourceStr && ['conventional', 'fha', 'va', 'dscr', 'cash'].includes(fundingSourceStr)) {
        fundingSource = fundingSourceStr as 'conventional' | 'fha' | 'va' | 'dscr' | 'cash';
      }
    } catch (e) {
      console.warn("Failed to parse form data:", e);
    }

    // Ensure fileContent is set before parsing
    if (!fileContent) {
      return NextResponse.json(
        { success: false, error: "No file content or property data available to parse" },
        { status: 400 }
      );
    }

    console.log(`Running TypeScript file analysis for: ${originalName}, extension: ${fileExtension}`);

    // Parse file content
    propertyData = await parseFileContent(fileContent, fileExtension, strMetrics, monthlyExpenses);
    
    // Log parsed data for debugging
    console.log('Parsed property data:', {
      address: propertyData.address,
      purchase_price: propertyData.purchase_price || propertyData.purchasePrice,
      monthly_rent: propertyData.monthly_rent || propertyData.monthlyRent,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
    });

    // Use funding source to determine down payment percentage (same logic as in analyzeProperty)
    const propertyFundingSource = fundingSource || 'conventional';
    
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
      // Note: If purchase price is missing but mortgage calculator values are provided,
      // analyzeProperty will calculate purchase price from loan amount as backup logic
      const purchasePrice = propertyData.purchase_price || propertyData.purchasePrice || 0;
      
      // Validate purchasePrice is a positive number (needed to calculate loan amount for mortgage rate)
      if (typeof purchasePrice !== 'number' || !Number.isFinite(purchasePrice) || purchasePrice <= 0) {
        console.error(`Invalid purchase price detected: ${purchasePrice} (type: ${typeof purchasePrice})`);
        return NextResponse.json(
          {
            success: false,
            error: `Invalid purchase price: ${purchasePrice}. The uploaded file must contain a valid purchase price greater than $0. Please check the file content or enter the purchase price manually.`,
            hint: "Make sure your file contains fields like 'Purchase Price', 'Price', 'List Price', or 'Sale Price' with a dollar amount."
          },
          { status: 400 }
        );
      }
      
      // Validate that propertyFundingSource exists as a key in FUNDING_SOURCE_DOWN_PAYMENTS
      const isValidFundingSource = propertyFundingSource in FUNDING_SOURCE_DOWN_PAYMENTS;
      if (!isValidFundingSource) {
        return NextResponse.json(
          { success: false, error: `Invalid funding source: ${propertyFundingSource}. Valid options are: conventional, fha, va, dscr, cash.` },
          { status: 400 }
        );
      }
      
      const validatedFundingSource = propertyFundingSource as keyof typeof FUNDING_SOURCE_DOWN_PAYMENTS;
      const downpaymentPercentage = FUNDING_SOURCE_DOWN_PAYMENTS[validatedFundingSource];
      
      // Ensure downpaymentPercentage is defined (should never be undefined due to validation above, but adding safety check)
      if (downpaymentPercentage === undefined) {
        return NextResponse.json(
          { success: false, error: `Down payment percentage not found for funding source: ${propertyFundingSource}` },
          { status: 500 }
        );
      }
      
      const downpayment = purchasePrice * downpaymentPercentage;
      const loanAmount = purchasePrice - downpayment;
      
      // Fetch mortgage rate with error handling
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
    }

    // Fetch current investment criteria
    const criteria = await loadInvestmentCriteria();
    console.log('Using criteria for analysis:', {
      maxPurchasePrice: criteria.max_purchase_price,
      cocMinimum: criteria.coc_minimum_min,
      capMinimum: criteria.cap_minimum,
    });

    // Run analysis with optional mortgage values and criteria
    const analysisData = analyzeProperty(
      propertyData, 
      strMetrics, 
      monthlyExpenses, 
      propertyFundingSource, 
      mortgageRate,
      mortgageValues, // Pass mortgage calculator values
      criteria // Pass criteria from API
    );
    
    console.log('Analysis Results:', {
      meetsCriteria: analysisData.meetsCriteria,
      cocReturn: analysisData.cocReturn,
      capRate: analysisData.capRate,
      cashFlow: analysisData.cashFlow,
      totalMonthlyExpenses: analysisData.totalMonthlyExpenses,
      calculatedDownpayment: analysisData.calculatedDownpayment,
      monthlyMortgagePayment: analysisData.monthlyMortgagePayment,
    });
    
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
  });
}
