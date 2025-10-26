import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../server/storage";
import { runPythonAnalysis } from "../../lib/python-helpers";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";

export async function POST(request: NextRequest) {
  try {
    const { dealId, emailContent } = await request.json();
    
    if (!dealId || !emailContent) {
      return NextResponse.json(
        { success: false, error: "Deal ID and email content are required" },
        { status: 400 }
      );
    }

    // Get the email deal
    const emailDeal = await storage.getEmailDeal(dealId);
    if (!emailDeal) {
      return NextResponse.json(
        { success: false, error: "Email deal not found" },
        { status: 404 }
      );
    }

    // Run Python analysis on the email content
    const analysisResult = await runPythonAnalysis(emailContent);
    
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

    // Store the analysis
    const storedAnalysis = await storage.createDealAnalysis(analysisWithAI);

    // Update the email deal with the analysis
    await storage.updateEmailDeal(dealId, {
      analysis: storedAnalysis,
      status: 'analyzed'
    });

    return NextResponse.json({
      success: true,
      data: storedAnalysis
    });
  } catch (error) {
    console.error("Error analyzing email deal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze email deal" },
      { status: 500 }
    );
  }
}

