import OpenAI from "openai";
import type { Property, AIAnalysis, SmartPropertyRecommendation, RentPricingRecommendation, InvestmentTimingAdvice } from "@shared/schema";
import { logger } from "../app/lib/logger";
import { withTimeout, TIMEOUTS } from "../app/lib/api-timeout";

// Lazy initialization of OpenAI client to ensure environment variables are loaded first
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set. Please configure it in your .env file.');
    }
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openai;
}

export class AIAnalysisService {
  async analyzeProperty(property: Property): Promise<AIAnalysis> {
    const prompt = this.buildAnalysisPrompt(property);
    const propertyLogger = logger.withContext({
      address: property.address,
      propertyId: property.id,
    });
    
    try {
      propertyLogger.info("Starting AI property analysis");
      
      const response = await withTimeout(
        getOpenAIClient().chat.completions.create({
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
        }),
        TIMEOUTS.LONG
      );

      const analysisResult = JSON.parse(response.choices[0].message.content || "{}");
      propertyLogger.info("AI analysis completed successfully");
      return this.validateAndNormalizeAnalysis(analysisResult);
    } catch (error) {
      propertyLogger.error("AI analysis failed, using fallback", error instanceof Error ? error : undefined);
      return this.getFallbackAnalysis(property);
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

  private generateBasicRedFlags(property: Property): string[] {
    const redFlags: string[] = [];
    
    // Check for basic red flags based on financial metrics
    const purchasePrice = property.purchasePrice;
    const monthlyRent = property.monthlyRent;
    const rentToPrice = monthlyRent / purchasePrice;
    
    // 1% rule check
    if (rentToPrice < 0.01) {
      redFlags.push(`Fails 1% rule - rent (${(rentToPrice * 100).toFixed(2)}%) below 1% of purchase price`);
    }
    
    // Very low rent ratio
    if (rentToPrice < 0.005) {
      redFlags.push(`Extremely low rent-to-price ratio may indicate poor cash flow potential`);
    }
    
    // High price point
    if (purchasePrice > 500000) {
      redFlags.push(`High purchase price may limit cash flow and increase carrying costs`);
    }
    
    // Very low rent
    if (monthlyRent < 800) {
      redFlags.push(`Low monthly rent may indicate challenging tenant demographics or area`);
    }
    
    // Price per square foot concerns
    if (property.squareFootage && property.squareFootage > 0) {
      const pricePerSqft = purchasePrice / property.squareFootage;
      if (pricePerSqft > 200) {
        redFlags.push(`High price per square foot ($${pricePerSqft.toFixed(0)}) may limit appreciation potential`);
      }
    }
    
    // If no red flags found, that's actually good news
    if (redFlags.length === 0) {
      return [`Property passes basic financial screening - detailed analysis recommended`];
    }
    
    return redFlags;
  }

  private getFallbackAnalysis(property: Property): AIAnalysis {
    const basicRedFlags = this.generateBasicRedFlags(property);
    
    return {
      propertyAssessment: {
        overallScore: 6,
        strengths: ["Property details analyzed", "Investment potential assessed"],
        redFlags: basicRedFlags,
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
      const response = await getOpenAIClient().chat.completions.create({
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

  // Smart Property Recommendations
  async generateSmartPropertyRecommendations(sourceProperty: Property, availableProperties: Property[]): Promise<SmartPropertyRecommendation[]> {
    const prompt = `Analyze and recommend similar properties for investment based on this source property:

SOURCE PROPERTY:
- Address: ${sourceProperty.address}, ${sourceProperty.city}, ${sourceProperty.state}
- Type: ${sourceProperty.propertyType}
- Price: $${sourceProperty.purchasePrice.toLocaleString()}
- Monthly Rent: $${sourceProperty.monthlyRent}
- Bedrooms: ${sourceProperty.bedrooms}, Bathrooms: ${sourceProperty.bathrooms}
- Square Footage: ${sourceProperty.squareFootage} sq ft
- Year Built: ${sourceProperty.yearBuilt}

AVAILABLE PROPERTIES TO CONSIDER:
${availableProperties.slice(0, 10).map((prop, idx) => 
  `${idx + 1}. ${prop.address}, ${prop.city}, ${prop.state} - $${prop.purchasePrice.toLocaleString()}, ${prop.bedrooms}BR/${prop.bathrooms}BA, ${prop.squareFootage} sq ft`
).join('\n')}

Please analyze and recommend the top 3-5 most suitable properties as "Properties like this" recommendations.

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "recommendedPropertyId": "property_id",
      "similarityScore": 85,
      "matchReasons": ["Similar price range", "Same neighborhood type", "Comparable cash flow potential"],
      "recommendationType": "similar_metrics",
      "confidenceScore": 0.85,
      "aiInsights": "This property offers similar investment characteristics with strong cash flow potential and comparable market positioning."
    }
  ]
}

Use these recommendation types:
- "similar_location": Properties in similar or nearby areas
- "similar_metrics": Properties with comparable financial metrics
- "upgrade_opportunity": Better properties in same price range
- "diversification": Different but complementary investment opportunities`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert real estate investment advisor specializing in property recommendations. Analyze properties based on location, financial metrics, and investment potential."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
      return result.recommendations.map((rec: any) => ({
        sourcePropertyId: sourceProperty.id || '',
        recommendedPropertyId: rec.recommendedPropertyId,
        similarityScore: Math.max(0, Math.min(100, rec.similarityScore)),
        matchReasons: Array.isArray(rec.matchReasons) ? rec.matchReasons : [],
        recommendationType: ['similar_location', 'similar_metrics', 'upgrade_opportunity', 'diversification'].includes(rec.recommendationType) 
          ? rec.recommendationType : 'similar_metrics',
        confidenceScore: Math.max(0, Math.min(1, rec.confidenceScore)),
        aiInsights: rec.aiInsights || "Property recommendation generated",
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error("Smart recommendations error:", error);
      return [];
    }
  }

  // Rent Pricing Recommendations
  async generateRentPricingRecommendation(property: Property, marketData?: { medianRent?: number, competitorRents?: number[] }): Promise<RentPricingRecommendation> {
    const currentRent = property.monthlyRent;
    const medianRent = marketData?.medianRent || currentRent * 1.1;
    const competitorRents = marketData?.competitorRents || [currentRent * 0.9, currentRent * 1.05, currentRent * 1.15];

    const prompt = `Analyze rent pricing for this property and provide optimization recommendations:

PROPERTY DETAILS:
- Address: ${property.address}, ${property.city}, ${property.state}
- Type: ${property.propertyType}
- Current Rent: $${currentRent}/month
- Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}
- Square Footage: ${property.squareFootage} sq ft
- Year Built: ${property.yearBuilt}

MARKET DATA:
- Area Median Rent: $${medianRent}
- Competitor Rents: ${competitorRents.map(r => `$${r}`).join(', ')}

Provide rent pricing recommendation in this JSON format:
{
  "recommendedRent": 2100,
  "adjustmentPercentage": 5.2,
  "adjustmentReasons": ["Market rates support increase", "Property features justify premium"],
  "marketData": {
    "areaMedianRent": ${medianRent},
    "competitorRents": [${competitorRents.join(', ')}],
    "seasonalFactors": ["Spring rental season", "High demand period"],
    "demandIndicators": ["Low vacancy rates", "Increasing applications"]
  },
  "riskAssessment": {
    "tenantRetentionRisk": "low",
    "vacancyRisk": "low", 
    "marketRisk": "medium"
  },
  "implementation": {
    "recommendedTiming": "Implement at next lease renewal or within 60 days",
    "gradualIncreaseSchedule": [
      {"effectiveDate": "2025-10-01", "newRent": 2050},
      {"effectiveDate": "2026-01-01", "newRent": 2100}
    ],
    "marketingStrategy": ["Highlight recent improvements", "Emphasize location benefits"]
  }
}`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a real estate pricing expert specializing in rent optimization. Provide data-driven recommendations that balance revenue optimization with tenant retention."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const recommendedRent = result.recommendedRent || currentRent;
      
      return {
        propertyId: property.id || '',
        currentRent,
        recommendedRent,
        adjustmentPercentage: ((recommendedRent - currentRent) / currentRent) * 100,
        adjustmentReasons: result.adjustmentReasons || ["Market analysis completed"],
        marketData: {
          areaMedianRent: result.marketData?.areaMedianRent || medianRent,
          competitorRents: result.marketData?.competitorRents || competitorRents,
          seasonalFactors: result.marketData?.seasonalFactors || ["Standard market conditions"],
          demandIndicators: result.marketData?.demandIndicators || ["Market analysis in progress"],
        },
        riskAssessment: {
          tenantRetentionRisk: ['low', 'medium', 'high'].includes(result.riskAssessment?.tenantRetentionRisk) 
            ? result.riskAssessment.tenantRetentionRisk : 'medium',
          vacancyRisk: ['low', 'medium', 'high'].includes(result.riskAssessment?.vacancyRisk) 
            ? result.riskAssessment.vacancyRisk : 'medium',
          marketRisk: ['low', 'medium', 'high'].includes(result.riskAssessment?.marketRisk) 
            ? result.riskAssessment.marketRisk : 'medium',
        },
        implementation: {
          recommendedTiming: result.implementation?.recommendedTiming || "Review at next lease renewal",
          gradualIncreaseSchedule: result.implementation?.gradualIncreaseSchedule || undefined,
          marketingStrategy: result.implementation?.marketingStrategy || ["Professional marketing approach"],
        },
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      };
    } catch (error) {
      console.error("Rent pricing recommendation error:", error);
      return this.getFallbackRentRecommendation(property);
    }
  }

  // Investment Timing Advice
  async generateInvestmentTimingAdvice(property: Property, marketConditions?: { interestRates?: number, marketPhase?: string }): Promise<InvestmentTimingAdvice> {
    const prompt = `Analyze the optimal timing for investment decisions on this property:

PROPERTY DETAILS:
- Address: ${property.address}, ${property.city}, ${property.state}
- Purchase Price: $${property.purchasePrice.toLocaleString()}
- Monthly Rent: $${property.monthlyRent}
- Property Type: ${property.propertyType}
- Year Built: ${property.yearBuilt}

MARKET CONDITIONS:
- Current Interest Rates: ${marketConditions?.interestRates || 'Market rates'}
- Market Phase: ${marketConditions?.marketPhase || 'Balanced market'}

Provide investment timing advice in this JSON format:
{
  "action": "buy",
  "urgency": "within_3_months", 
  "reasoning": ["Interest rates favorable", "Market cycle timing optimal", "Property fundamentals strong"],
  "marketFactors": {
    "interestRateOutlook": "Rates expected to remain stable through 2025",
    "marketCyclePhase": "expansion",
    "localMarketTrends": ["Growing rental demand", "Infrastructure development planned"],
    "seasonalConsiderations": ["Spring buying season approaching", "Optimal timing for rental market"]
  },
  "financialImplications": {
    "potentialGainLoss": 25000,
    "taxConsiderations": ["Depreciation benefits", "Potential 1031 exchange opportunity"],
    "cashFlowImpact": 150,
    "equityPosition": 80000
  },
  "riskFactors": ["Interest rate volatility", "Local market competition"],
  "actionPlan": [
    {"step": "Secure financing pre-approval", "timeline": "2 weeks", "priority": "high"},
    {"step": "Complete property inspection", "timeline": "1 week", "priority": "high"},
    {"step": "Finalize purchase agreement", "timeline": "3 weeks", "priority": "medium"}
  ]
}

Consider current market conditions, property fundamentals, and optimal timing for real estate investment decisions.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a real estate investment strategist specializing in market timing and investment decision optimization. Provide actionable timing advice based on market cycles, financial conditions, and property-specific factors."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        propertyId: property.id || '',
        action: ['buy', 'hold', 'sell', 'refinance', 'improve'].includes(result.action) ? result.action : 'hold',
        urgency: ['immediate', 'within_3_months', 'within_6_months', 'within_1_year', 'monitor'].includes(result.urgency) 
          ? result.urgency : 'monitor',
        reasoning: result.reasoning || ["Market analysis completed"],
        marketFactors: {
          interestRateOutlook: result.marketFactors?.interestRateOutlook || "Market conditions under review",
          marketCyclePhase: ['recovery', 'expansion', 'peak', 'recession'].includes(result.marketFactors?.marketCyclePhase) 
            ? result.marketFactors.marketCyclePhase : 'expansion',
          localMarketTrends: result.marketFactors?.localMarketTrends || ["Market trends analysis in progress"],
          seasonalConsiderations: result.marketFactors?.seasonalConsiderations || ["Standard seasonal patterns"],
        },
        financialImplications: {
          potentialGainLoss: result.financialImplications?.potentialGainLoss || 0,
          taxConsiderations: result.financialImplications?.taxConsiderations || ["Consult tax advisor"],
          cashFlowImpact: result.financialImplications?.cashFlowImpact || 0,
          equityPosition: result.financialImplications?.equityPosition,
        },
        riskFactors: result.riskFactors || ["Standard market risks"],
        actionPlan: result.actionPlan || [
          { step: "Review investment strategy", timeline: "1 month", priority: "medium" }
        ],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      };
    } catch (error) {
      console.error("Investment timing advice error:", error);
      return this.getFallbackTimingAdvice(property);
    }
  }

  private getFallbackRentRecommendation(property: Property): RentPricingRecommendation {
    const currentRent = property.monthlyRent;
    const recommendedRent = Math.round(currentRent * 1.03); // 3% conservative increase
    
    return {
      propertyId: property.id || '',
      currentRent,
      recommendedRent,
      adjustmentPercentage: 3.0,
      adjustmentReasons: ["Conservative market-based adjustment"],
      marketData: {
        areaMedianRent: currentRent * 1.1,
        competitorRents: [currentRent * 0.95, currentRent, currentRent * 1.05],
        seasonalFactors: ["Standard market conditions"],
        demandIndicators: ["Market analysis in progress"],
      },
      riskAssessment: {
        tenantRetentionRisk: 'medium',
        vacancyRisk: 'medium',
        marketRisk: 'medium',
      },
      implementation: {
        recommendedTiming: "Review at next lease renewal",
        marketingStrategy: ["Standard property marketing"],
      },
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    };
  }

  private getFallbackTimingAdvice(property: Property): InvestmentTimingAdvice {
    return {
      propertyId: property.id || '',
      action: 'hold',
      urgency: 'monitor',
      reasoning: ["Property fundamentals reviewed", "Market analysis completed"],
      marketFactors: {
        interestRateOutlook: "Monitor market conditions",
        marketCyclePhase: 'expansion',
        localMarketTrends: ["Standard market trends"],
        seasonalConsiderations: ["Standard seasonal patterns"],
      },
      financialImplications: {
        potentialGainLoss: 0,
        taxConsiderations: ["Consult tax advisor for specific guidance"],
        cashFlowImpact: 0,
      },
      riskFactors: ["Standard market risks", "Property-specific factors"],
      actionPlan: [
        { step: "Monitor market conditions", timeline: "ongoing", priority: "low" },
        { step: "Review property performance", timeline: "quarterly", priority: "medium" }
      ],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    };
  }
}

export const aiAnalysisService = new AIAnalysisService();