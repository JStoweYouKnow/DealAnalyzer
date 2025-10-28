import { NextRequest, NextResponse } from "next/server";
import { parseFileContent } from "../../lib/file-parser";
import { analyzeProperty } from "../../lib/property-analyzer";
import { storage } from "../../../server/storage";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Read file content directly into memory (no temp files needed for Vercel)
    const fileContent = await file.text();

    // Parse additional form data
    let strMetrics, monthlyExpenses;
    try {
      if (formData.get('strMetrics')) {
        strMetrics = JSON.parse(formData.get('strMetrics') as string);
      }
      if (formData.get('monthlyExpenses')) {
        monthlyExpenses = JSON.parse(formData.get('monthlyExpenses') as string);
      }
    } catch (e) {
      console.warn("Failed to parse form data:", e);
    }

    // Get file extension
    const originalName = file.name;
    const fileExtension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();

    console.log(`Running TypeScript file analysis for: ${originalName}, extension: ${fileExtension}`);
    
    // Parse file content
    const propertyData = await parseFileContent(fileContent, fileExtension, strMetrics, monthlyExpenses);
    
    // Run analysis
    const analysisData = analyzeProperty(propertyData, strMetrics, monthlyExpenses);
    
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
