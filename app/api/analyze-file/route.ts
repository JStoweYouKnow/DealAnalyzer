import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import fs from "fs";
import { runPythonFileAnalysis } from "../../lib/python-helpers";
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

    // Run Python file analysis
    console.log(`Running Python file analysis for: ${tempFilePath}, extension: ${fileExtension}`);
    const analysisResult = await runPythonFileAnalysis(tempFilePath, fileExtension, strMetrics, monthlyExpenses);
    
    console.log("Analysis result:", analysisResult.success ? "Success" : "Failed", analysisResult.error);
    
    // Clean up uploaded file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (e) {
        console.warn("Failed to clean up uploaded file:", e);
      }
    }
    
    if (!analysisResult.success) {
      console.error("File analysis failed:", analysisResult.error);
      return NextResponse.json(
        { success: false, error: analysisResult.error || "File analysis failed" },
        { status: 400 }
      );
    }

    // Run AI analysis if available
    let analysisWithAI = analysisResult.data!;
    try {
      if (process.env.OPENAI_API_KEY) {
        const aiAnalysis = await coreAiService.analyzeProperty(analysisResult.data!.property);
        analysisWithAI = {
          ...analysisResult.data!,
          aiAnalysis
        };
      }
    } catch (error) {
      console.warn("AI analysis failed, continuing without AI insights:", error);
    }

    // Store the analysis in memory
    const storedAnalysis = await storage.createDealAnalysis(analysisWithAI);

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
