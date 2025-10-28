import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../server/storage";
import { generateReport } from "../../../server/report-generator";
import { writeFileSync, unlinkSync } from "fs";

export async function POST(request: NextRequest) {
  let tempReportPath: string | null = null;
  
  try {
    const body = await request.json();
    const { analysisIds, format, title, includeComparison } = body;
    
    if (!analysisIds || !Array.isArray(analysisIds) || analysisIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Analysis IDs are required" },
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
    for (const id of analysisIds) {
      const analysis = await storage.getDealAnalysis(id);
      if (analysis) {
        analyses.push(analysis);
      }
    }

    if (analyses.length === 0) {
      return NextResponse.json(
        { success: false, error: "No analyses found for the provided IDs" },
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

    // Generate the report
    const result = await generateReport(reportData, options);
    tempReportPath = result.filePath;

    // Read file and return as download
    const fileBuffer = writeFileSync as any;
    const fs = await import('fs');
    const fileStream = fs.createReadStream(result.filePath);
    const chunks: any[] = [];
    
    return new NextResponse(fileStream as any, {
      headers: {
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Type': format === 'pdf' ? 'application/pdf' : 'text/csv',
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);
    
    // Clean up file after sending
    if (tempReportPath) {
      try {
        unlinkSync(tempReportPath);
      } catch (e) {
        console.warn('Failed to clean up report file:', e);
      }
    }
    
    return NextResponse.json(
      { success: false, error: `Failed to generate report: ${errorMessage}` },
      { status: 500 }
    );
  }
}

