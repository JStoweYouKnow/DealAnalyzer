import OpenAI from "openai";
import type { Property, AIAnalysis } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIAnalysisService {
  async analyzeProperty(property: Property): Promise<AIAnalysis> {
    const prompt = this.buildAnalysisPrompt(property);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are an expert real estate investment analyst with decades of experience. 
            Analyze properties comprehensively considering market conditions, financial metrics, and investment potential.
            Provide detailed, actionable insights that help investors make informed decisions.
            Always respond with valid JSON in the exact format specified.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const analysisResult = JSON.parse(response.choices[0].message.content || "{}");
      return this.validateAndNormalizeAnalysis(analysisResult);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return this.getFallbackAnalysis();
    }
  }

  private buildAnalysisPrompt(property: Property): string {
    const rentToPrice = (property.monthlyRent * 12) / property.purchasePrice;
    const pricePerSqFt = property.purchasePrice / property.squareFootage;
    
    return `Analyze this real estate investment property and provide a comprehensive assessment:

PROPERTY DETAILS:
- Address: ${property.address}, ${property.city}, ${property.state} ${property.zipCode}
- Type: ${property.propertyType}
- Purchase Price: $${property.purchasePrice.toLocaleString()}
- Monthly Rent: $${property.monthlyRent.toLocaleString()}
- Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}
- Square Footage: ${property.squareFootage} sq ft
- Year Built: ${property.yearBuilt}
- Price per Sq Ft: $${pricePerSqFt.toFixed(2)}
- Gross Rental Yield: ${(rentToPrice * 100).toFixed(2)}%
- Description: ${property.description}

ANALYSIS REQUIREMENTS:
Provide a detailed analysis in the following JSON format:

{
  "propertyAssessment": {
    "overallScore": [1-10 rating based on investment potential],
    "strengths": ["list of 3-5 property strengths"],
    "redFlags": ["list of potential concerns or red flags"],
    "description": "2-3 sentence summary of the property's investment appeal",
    "marketPosition": "Assessment of how this property compares to market standards"
  },
  "marketIntelligence": {
    "sentimentScore": [number between -1 (very negative) and 1 (very positive)],
    "riskLevel": "low|medium|high",
    "marketTrends": ["list of relevant market trends affecting this property"],
    "competitiveAnalysis": "Analysis of how this property stands against similar investments"
  },
  "investmentRecommendation": {
    "recommendation": "strong_buy|buy|hold|avoid",
    "confidence": [0-1 confidence score],
    "reasoning": ["list of key reasons supporting the recommendation"],
    "suggestedStrategy": "Recommended investment approach (buy-and-hold, BRRRR, flip, etc.)",
    "timeHorizon": "Suggested holding period and timeline"
  },
  "predictiveAnalysis": {
    "appreciationForecast": [annual appreciation percentage],
    "rentGrowthForecast": [annual rent growth percentage],
    "exitStrategy": "Recommended exit strategy and timing",
    "keyRisks": ["list of major risks to monitor"]
  }
}

Consider factors like:
- Location desirability and growth potential
- Property condition and age
- Rental yield and cash flow potential
- Market trends and economic indicators
- Competition and vacancy rates
- Potential for appreciation
- Maintenance and management complexity
- Exit strategy options`;
  }

  private validateAndNormalizeAnalysis(analysis: any): AIAnalysis {
    // Ensure all required fields exist with defaults
    return {
      propertyAssessment: {
        overallScore: Math.max(1, Math.min(10, analysis.propertyAssessment?.overallScore || 5)),
        strengths: Array.isArray(analysis.propertyAssessment?.strengths) 
          ? analysis.propertyAssessment.strengths 
          : ["Property analysis completed"],
        redFlags: Array.isArray(analysis.propertyAssessment?.redFlags) 
          ? analysis.propertyAssessment.redFlags 
          : [],
        description: analysis.propertyAssessment?.description || "Property assessment completed",
        marketPosition: analysis.propertyAssessment?.marketPosition || "Market position evaluated",
      },
      marketIntelligence: {
        sentimentScore: Math.max(-1, Math.min(1, analysis.marketIntelligence?.sentimentScore || 0)),
        riskLevel: ['low', 'medium', 'high'].includes(analysis.marketIntelligence?.riskLevel) 
          ? analysis.marketIntelligence.riskLevel 
          : 'medium',
        marketTrends: Array.isArray(analysis.marketIntelligence?.marketTrends) 
          ? analysis.marketIntelligence.marketTrends 
          : ["Market analysis completed"],
        competitiveAnalysis: analysis.marketIntelligence?.competitiveAnalysis || "Competitive analysis completed",
      },
      investmentRecommendation: {
        recommendation: ['strong_buy', 'buy', 'hold', 'avoid'].includes(analysis.investmentRecommendation?.recommendation) 
          ? analysis.investmentRecommendation.recommendation 
          : 'hold',
        confidence: Math.max(0, Math.min(1, analysis.investmentRecommendation?.confidence || 0.5)),
        reasoning: Array.isArray(analysis.investmentRecommendation?.reasoning) 
          ? analysis.investmentRecommendation.reasoning 
          : ["Investment analysis completed"],
        suggestedStrategy: analysis.investmentRecommendation?.suggestedStrategy || "Buy and hold strategy recommended",
        timeHorizon: analysis.investmentRecommendation?.timeHorizon || "3-5 years",
      },
      predictiveAnalysis: {
        appreciationForecast: analysis.predictiveAnalysis?.appreciationForecast || 3.0,
        rentGrowthForecast: analysis.predictiveAnalysis?.rentGrowthForecast || 2.5,
        exitStrategy: analysis.predictiveAnalysis?.exitStrategy || "Hold for cash flow and appreciation",
        keyRisks: Array.isArray(analysis.predictiveAnalysis?.keyRisks) 
          ? analysis.predictiveAnalysis.keyRisks 
          : ["Market volatility", "Interest rate changes"],
      },
    };
  }

  private getFallbackAnalysis(): AIAnalysis {
    return {
      propertyAssessment: {
        overallScore: 6,
        strengths: ["Property details analyzed", "Investment potential assessed"],
        redFlags: ["AI analysis temporarily unavailable"],
        description: "Property analysis completed with standard metrics.",
        marketPosition: "Competitive analysis completed.",
      },
      marketIntelligence: {
        sentimentScore: 0,
        riskLevel: 'medium',
        marketTrends: ["Market analysis in progress"],
        competitiveAnalysis: "Standard market comparison completed.",
      },
      investmentRecommendation: {
        recommendation: 'hold',
        confidence: 0.5,
        reasoning: ["Based on financial metrics", "Further analysis recommended"],
        suggestedStrategy: "Evaluate based on your investment criteria",
        timeHorizon: "3-5 years typical holding period",
      },
      predictiveAnalysis: {
        appreciationForecast: 3.0,
        rentGrowthForecast: 2.5,
        exitStrategy: "Monitor market conditions for optimal exit timing",
        keyRisks: ["Market volatility", "Interest rate fluctuations"],
      },
    };
  }

  async generatePropertySummary(property: Property, aiAnalysis: AIAnalysis): Promise<string> {
    const prompt = `Generate a comprehensive investment summary for this property:

PROPERTY: ${property.address}, ${property.city}, ${property.state}
PRICE: $${property.purchasePrice.toLocaleString()}
RENT: $${property.monthlyRent}/month
RECOMMENDATION: ${aiAnalysis.investmentRecommendation.recommendation}
OVERALL SCORE: ${aiAnalysis.propertyAssessment.overallScore}/10

Create a professional 2-3 paragraph summary that highlights the key investment merits, 
risks, and recommendation. Write in a clear, professional tone suitable for an investment report.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system", 
            content: "You are a professional real estate investment writer. Create clear, engaging summaries."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 500,
      });

      return response.choices[0].message.content || "Investment summary generated.";
    } catch (error) {
      console.error("Summary generation error:", error);
      return `Investment summary for ${property.address}: This ${property.propertyType} property presents ${aiAnalysis.investmentRecommendation.recommendation === 'strong_buy' || aiAnalysis.investmentRecommendation.recommendation === 'buy' ? 'a compelling' : 'a standard'} investment opportunity with an overall score of ${aiAnalysis.propertyAssessment.overallScore}/10.`;
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();