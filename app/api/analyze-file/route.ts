import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import fs from "fs";
import { parseFileContent } from "../../lib/file-parser";
import { analyzeProperty } from "../../lib/property-analyzer";
import { storage } from "../../../server/storage";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Save file to temp directory
    const tempDir = join(process.cwd(), 'temp_uploads');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    tempFilePath = join(tempDir, `${Date.now()}_${file.name}`);
    
    await writeFile(tempFilePath, buffer);

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

    // Read and parse file content
    const fileContent = await fs.promises.readFile(tempFilePath, 'utf-8');
    console.log(`Running TypeScript file analysis for: ${originalName}, extension: ${fileExtension}`);
    
    // Parse file content
    const propertyData = await parseFileContent(fileContent, fileExtension, strMetrics, monthlyExpenses);
    
    // Run analysis
    const analysisData = analyzeProperty(propertyData, strMetrics, monthlyExpenses);
    
    console.log("Analysis result: Success");
    
    // Clean up uploaded file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (e) {
        console.warn("Failed to clean up uploaded file:", e);
      }
    }

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
    
    // Clean up uploaded file on error too
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (e) {
        console.error("Error deleting uploaded file on error:", e);
      }
    }
    
    return NextResponse.json(
      { success: false, error: "Internal server error during file analysis" },
      { status: 500 }
    );
  }
}
