import { NextRequest, NextResponse } from "next/server";
import { parseFileContent } from "../../lib/file-parser";
import { analyzeProperty } from "../../lib/property-analyzer";
import { storage } from "../../../server/storage";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";
import { getMortgageRate } from "../../../server/mortgage-rate-service";
import { loadInvestmentCriteria } from "../../../server/services/criteria-service";
import { FUNDING_SOURCE_DOWN_PAYMENTS } from "../../../shared/schema";
import { extractTextFromPDF } from "../../lib/pdf-extractor";

export async function POST(request: NextRequest) {
  try {
    console.log('=== Analyze File API Called ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const formData = await request.formData();
    console.log('FormData received, entries:', Array.from(formData.keys()));
    
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file found in formData');
      return NextResponse.json(
        { success: false, error: "No file uploaded. Please select a file and try again." },
        { status: 400 }
      );
    }
    
    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Get file extension first to determine how to read it
    const originalName = file.name;
    const fileExtension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
    
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
    let fileContent: string;
    try {
      if (fileExtension === '.pdf') {
        console.log(`Extracting text from PDF file: ${originalName}, size: ${file.size} bytes`);
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

    console.log(`Running TypeScript file analysis for: ${originalName}, extension: ${fileExtension}`);

    // Parse file content
    const propertyData = await parseFileContent(fileContent, fileExtension, strMetrics, monthlyExpenses);
    
    // Log parsed data for debugging
    console.log('Parsed property data:', {
      address: propertyData.address,
      purchase_price: propertyData.purchase_price || propertyData.purchasePrice,
      monthly_rent: propertyData.monthly_rent || propertyData.monthlyRent,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
    });

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
}
