import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface LinkQualityScore {
  score: number; // 0-10
  confidence: number; // 0-1
  reasoning: string;
  category: 'excellent' | 'good' | 'fair' | 'poor';
  isPropertyListing: boolean;
  trustworthiness: number; // 0-1
}

export interface ImageQualityScore {
  score: number; // 0-10
  confidence: number; // 0-1
  reasoning: string;
  category: 'excellent' | 'good' | 'fair' | 'poor';
  isPropertyPhoto: boolean;
  visualQuality: number; // 0-1
}

export class AIQualityScoringService {

  async scoreLinks(links: Array<{url: string, type: string, description?: string}>): Promise<LinkQualityScore[]> {
    if (!links || links.length === 0) return [];
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4", // the newest OpenAI model is "gpt-4" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert real estate link quality assessor. Analyze URLs to determine their value for property investors.

Scoring criteria (0-10):
- 10: Direct property listing with photos, details, pricing
- 8-9: High-quality property listing, MLS data, agent contact
- 6-7: Property-related but limited info, company pages
- 4-5: Generic real estate content, outdated listings
- 2-3: Low-quality, spam, or irrelevant content
- 0-1: Broken links, scam sites, tracking URLs

Consider:
- Domain reputation (Zillow, Redfin = high trust)
- URL structure (specific property IDs = good)
- Link freshness indicators
- Property investment relevance

Respond with JSON array containing score, confidence, reasoning, category, isPropertyListing, trustworthiness for each link.`
          },
          {
            role: "user",
            content: `Analyze these real estate links for quality and investment relevance:

${links.map((link, i) => `${i + 1}. URL: ${link.url}\n   Type: ${link.type}\n   Description: ${link.description || 'N/A'}`).join('\n\n')}

Provide quality scores focusing on property investment value.`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"scores": []}');
      
      return result.scores?.map((score: any, index: number) => ({
        score: Math.max(0, Math.min(10, score.score || 0)),
        confidence: Math.max(0, Math.min(1, score.confidence || 0.5)),
        reasoning: score.reasoning || 'No reasoning provided',
        category: this.determineCategory(score.score || 0),
        isPropertyListing: score.isPropertyListing || false,
        trustworthiness: Math.max(0, Math.min(1, score.trustworthiness || 0.5))
      })) || [];

    } catch (error) {
      console.error('Error scoring links:', error);
      // Return default scores if AI fails
      return links.map(() => ({
        score: 5,
        confidence: 0.3,
        reasoning: 'AI scoring unavailable, using default score',
        category: 'fair' as const,
        isPropertyListing: false,
        trustworthiness: 0.5
      }));
    }
  }

  async scoreImages(imageUrls: string[], propertyContext?: string): Promise<ImageQualityScore[]> {
    if (!imageUrls || imageUrls.length === 0) return [];

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4", // the newest OpenAI model is "gpt-4" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert real estate image quality assessor. Analyze image URLs to determine their value for property investment analysis.

Scoring criteria (0-10):
- 10: High-res exterior/interior property photos showing key features
- 8-9: Good quality property photos with clear details
- 6-7: Decent property images, some marketing photos
- 4-5: Low-quality property photos, generic stock images
- 2-3: Poor quality, heavily watermarked, or unclear images
- 0-1: Tracking pixels, logos, non-property images

Consider:
- URL indicators of image quality (high-res, property-specific)
- File size hints from URL parameters
- Domain reputation for property photos
- Relevance to property investment decisions

Property context: ${propertyContext || 'General real estate property'}

Respond with JSON array containing score, confidence, reasoning, category, isPropertyPhoto, visualQuality for each image.`
          },
          {
            role: "user", 
            content: `Analyze these property image URLs for quality and investment relevance:

${imageUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

Focus on images that help investors evaluate property condition, features, and market appeal.`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"scores": []}');
      
      return result.scores?.map((score: any, index: number) => ({
        score: Math.max(0, Math.min(10, score.score || 0)),
        confidence: Math.max(0, Math.min(1, score.confidence || 0.5)),
        reasoning: score.reasoning || 'No reasoning provided',
        category: this.determineCategory(score.score || 0),
        isPropertyPhoto: score.isPropertyPhoto || false,
        visualQuality: Math.max(0, Math.min(1, score.visualQuality || 0.5))
      })) || [];

    } catch (error) {
      console.error('Error scoring images:', error);
      // Return default scores if AI fails
      return imageUrls.map(() => ({
        score: 5,
        confidence: 0.3,
        reasoning: 'AI scoring unavailable, using default score',
        category: 'fair' as const,
        isPropertyPhoto: true,
        visualQuality: 0.5
      }));
    }
  }

  private determineCategory(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    if (score >= 4) return 'fair';
    return 'poor';
  }

  // Quick scoring method for real-time filtering
  async quickScoreContent(links: Array<{url: string, type: string}>, images: string[]): Promise<{
    topLinks: Array<{url: string, score: number}>;
    topImages: Array<{url: string, score: number}>;
    avgLinkScore: number;
    avgImageScore: number;
  }> {
    try {
      const [linkScores, imageScores] = await Promise.all([
        this.scoreLinks(links),
        this.scoreImages(images)
      ]);

      const topLinks = links
        .map((link, i) => ({ url: link.url, score: linkScores[i]?.score || 5 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const topImages = images
        .map((url, i) => ({ url, score: imageScores[i]?.score || 5 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      const avgLinkScore = linkScores.length > 0 
        ? linkScores.reduce((sum, s) => sum + s.score, 0) / linkScores.length 
        : 0;

      const avgImageScore = imageScores.length > 0 
        ? imageScores.reduce((sum, s) => sum + s.score, 0) / imageScores.length 
        : 0;

      return { topLinks, topImages, avgLinkScore, avgImageScore };

    } catch (error) {
      console.error('Error in quick scoring:', error);
      return {
        topLinks: links.slice(0, 3).map(link => ({ url: link.url, score: 5 })),
        topImages: images.slice(0, 2).map(url => ({ url, score: 5 })),
        avgLinkScore: 5,
        avgImageScore: 5
      };
    }
  }
}

export const aiQualityScoringService = new AIQualityScoringService();