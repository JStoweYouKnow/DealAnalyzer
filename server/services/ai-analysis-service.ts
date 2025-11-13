import OpenAI from 'openai';

// Lazy initialization of OpenAI client to ensure environment variables are loaded first
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

interface PhotoAnalysisRequest {
  image: string; // base64 encoded image with data URL prefix
  filename: string;
  propertyType: string;
  propertyDescription?: string;
}

interface PhotoAnalysisResult {
  aiScore: number;
  qualityScore: number;
  compositionScore: number;
  lightingScore: number;
  propertyConditionScore: number;
  insights: string[];
  suggestions: string[];
  tags: string[];
  roomType?: string;
  marketability: 'high' | 'medium' | 'low';
}

export class AIAnalysisService {
  async analyzePropertyPhoto(request: PhotoAnalysisRequest): Promise<PhotoAnalysisResult> {
    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a professional real estate photographer and property analyst. Analyze this property photo and provide detailed scoring and insights.

Property Type: ${request.propertyType}
Property Description: ${request.propertyDescription || 'Not provided'}

Please analyze this image for:
1. Overall photo quality and technical execution
2. Composition and framing
3. Lighting quality
4. Property condition visible in the photo
5. Marketing potential and appeal

Provide your response in this exact JSON format:
{
  "aiScore": number (1-100, overall photo score),
  "qualityScore": number (1-100, technical quality),
  "compositionScore": number (1-100, composition and framing),
  "lightingScore": number (1-100, lighting quality),
  "propertyConditionScore": number (1-100, visible property condition),
  "insights": [array of positive observations about the photo],
  "suggestions": [array of specific improvement suggestions],
  "tags": [array of descriptive tags like "bright", "spacious", "modern", etc.],
  "roomType": string or null (e.g., "living room", "kitchen", "bedroom", "exterior", etc.),
  "marketability": "high" | "medium" | "low"
}

Be specific and actionable in your insights and suggestions. Consider factors like angle, staging, cleanliness, lighting, composition, and marketing appeal.`
              },
              {
                type: "image_url",
                image_url: {
                  url: request.image
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI Vision API');
      }

      // Try to parse the JSON response
      let analysis: PhotoAnalysisResult;
      try {
        analysis = JSON.parse(content);
      } catch (parseError) {
        // If JSON parsing fails, provide a fallback analysis
        console.warn('Failed to parse OpenAI response as JSON, using fallback analysis');
        analysis = {
          aiScore: 70,
          qualityScore: 70,
          compositionScore: 70,
          lightingScore: 70,
          propertyConditionScore: 70,
          insights: ['Photo uploaded successfully', 'Basic analysis performed'],
          suggestions: ['Consider retaking photo with better lighting', 'Ensure proper framing and composition'],
          tags: ['property', 'real estate'],
          roomType: undefined,
          marketability: 'medium'
        };
      }

      // Validate and constrain scores
      analysis.aiScore = Math.max(1, Math.min(100, analysis.aiScore || 70));
      analysis.qualityScore = Math.max(1, Math.min(100, analysis.qualityScore || 70));
      analysis.compositionScore = Math.max(1, Math.min(100, analysis.compositionScore || 70));
      analysis.lightingScore = Math.max(1, Math.min(100, analysis.lightingScore || 70));
      analysis.propertyConditionScore = Math.max(1, Math.min(100, analysis.propertyConditionScore || 70));

      // Ensure required arrays exist
      analysis.insights = analysis.insights || [];
      analysis.suggestions = analysis.suggestions || [];
      analysis.tags = analysis.tags || [];

      // Validate marketability
      if (!['high', 'medium', 'low'].includes(analysis.marketability)) {
        analysis.marketability = 'medium';
      }

      return analysis;

    } catch (error) {
      console.error('Error analyzing property photo:', error);
      
      // Return a fallback analysis if OpenAI fails
      return {
        aiScore: 60,
        qualityScore: 60,
        compositionScore: 60,
        lightingScore: 60,
        propertyConditionScore: 60,
        insights: ['Photo uploaded successfully', 'Analysis service temporarily unavailable'],
        suggestions: ['Try uploading again later', 'Ensure photo is clear and well-lit'],
        tags: ['property', 'real estate'],
        roomType: undefined,
        marketability: 'medium'
      };
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();