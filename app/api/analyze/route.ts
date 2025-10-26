import { NextRequest, NextResponse } from "next/server";
import { analyzePropertyRequestSchema } from "../../../shared/schema";
import { runPythonAnalysis } from "../../lib/python-helpers";
import { storage } from "../../../server/storage";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = analyzePropertyRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request: " + validation.error.errors.map(e => e.message).join(", ")
        },
        { status: 400 }
      );
    }

    const { emailContent, strMetrics, monthlyExpenses } = validation.data;
    
    // Run Python analysis
    const analysisResult = await runPythonAnalysis(emailContent, strMetrics, monthlyExpenses);
    
    if (!analysisResult.success) {
      return NextResponse.json(
        { success: false, error: analysisResult.error || "Analysis failed" },
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
    console.error("Error in analyze endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during analysis" },
      { status: 500 }
    );
  }
}
