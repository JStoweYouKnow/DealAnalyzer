import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../server/storage";
import { generateReportBuffer } from "../../../server/report-generator";

export async function POST(request: NextRequest) {
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
    console.log("Looking for analyses with IDs:", analysisIds);
    for (const id of analysisIds) {
      console.log(`Looking for analysis with ID: ${id}`);
      const analysis = await storage.getDealAnalysis(id);
      console.log(`Analysis ${id} found:`, !!analysis);
      if (analysis) {
        analyses.push(analysis);
      }
    }
    console.log(`Found ${analyses.length} analyses out of ${analysisIds.length} requested`);

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

    // Generate the report buffer (no file system needed)
    const result = await generateReportBuffer(reportData, options);
    
    return new NextResponse(result.buffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Type': result.contentType,
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

