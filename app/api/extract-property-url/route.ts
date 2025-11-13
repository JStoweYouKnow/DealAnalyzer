import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withRateLimit, expensiveRateLimit } from '../../lib/rate-limit';

// Lazy initialization of OpenAI client to ensure env vars are loaded
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({
      apiKey,
    });
  }
  return openaiClient;
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, expensiveRateLimit, async (req) => {
  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }
    
    const { url } = requestBody;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Truncate HTML to avoid token limits (keep first 100k characters to capture more price data)
    const truncatedHtml = html.substring(0, 100000);

    // Use OpenAI to extract property information
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a property data extraction assistant. Extract property listing information from HTML and return it as JSON.

Return ONLY a valid JSON object with these fields (use null for missing values):
{
  "address": "full street address",
  "city": "city name",
  "state": "state abbreviation (2 letters)",
  "zipCode": "zip code",
  "purchasePrice": number (REQUIRED - extract sale price, asking price, list price, or price - look for labels like "Price", "List Price", "Sale Price", "Asking Price", "$XXX,XXX"),
  "bedrooms": number,
  "bathrooms": number,
  "squareFootage": number (living area in sqft),
  "lotSize": number (lot size in sqft),
  "yearBuilt": number,
  "propertyType": "single-family|multi-family|condo|townhouse|duplex|other",
  "monthlyRent": number (if available, estimated market rent),
  "hoa": number (monthly HOA fee if applicable),
  "propertyTaxes": number (annual property taxes if available),
  "description": "brief property description",
  "listingUrl": "original URL",
  "source": "website name (zillow, redfin, realtor.com, etc)"
}

CRITICAL: The purchasePrice field is REQUIRED. Extract the ACTUAL LISTING/ASKING PRICE, NOT estimated values.

PRICE EXTRACTION RULES:
1. PRIORITY: Look for the actual listing/asking price, NOT estimates:
   - "Price", "List Price", "Listing Price", "Asking Price", "Sale Price", "For Sale"
   - Schema.org "offers" with "price" property
   - Meta tags with "price" or "list-price"
   - Class names containing "list-price", "asking-price", "sale-price"

2. IGNORE these prices (do NOT use them):
   - "Redfin Estimate", "RedfinEstimate", "Estimate", "Estimated Value"
   - "Zestimate", "Zillow Estimate"
   - "Price History", "Price Range", "Price per sqft"
   - "Comparable Sales", "Similar Homes"
   - Any price labeled as "estimate", "estimated", "est.", "est"
   - Prices in price history sections
   - Prices in comparable sales sections

3. If multiple prices are found:
   - Use the price that is clearly labeled as the listing/asking price
   - If no clear label, use the most prominent price in the main listing section
   - Prefer prices near the address or in the main property details section
   - Avoid prices in sidebars, footers, or "About this home" sections

4. Format conversion:
   - Convert "$XXX,XXX" or "$X.XX million" to plain numbers
   - Remove commas, dollar signs, and "million" modifiers
   - Example: "$1.5 million" = 1500000, "$369,500" = 369500

5. For Redfin specifically:
   - Look for the large price display near the top of the listing
   - Ignore "Redfin Estimate" which is usually shown separately
   - The listing price is typically the primary, largest price shown

Important: Return ONLY the JSON object, no additional text or markdown.`,
        },
        {
          role: 'user',
          content: `Extract property information from this HTML:\n\nURL: ${url}\n\nHTML:\n${truncatedHtml}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const extractedText = completion.choices[0]?.message?.content?.trim();

    if (!extractedText) {
      return NextResponse.json(
        { success: false, error: 'Failed to extract property data from OpenAI response' },
        { status: 500 }
      );
    }

    // Parse the JSON response from OpenAI
    let propertyData;
    try {
      // Remove markdown code blocks if present
      const jsonText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      propertyData = JSON.parse(jsonText);

      // Log the extracted data for debugging
      console.log('Extracted property data from URL:', {
        url,
        purchasePrice: propertyData.purchasePrice,
        address: propertyData.address,
        source: propertyData.source,
      });
    } catch (error) {
      console.error('Failed to parse OpenAI JSON response:', extractedText);
      return NextResponse.json(
        { success: false, error: 'Failed to parse property data', raw: extractedText },
        { status: 500 }
      );
    }

    // Add the original URL
    propertyData.listingUrl = url;

    // Validate and coerce purchase price to number
    // Handle string values from OpenAI response
    let purchasePrice: number;
    if (typeof propertyData.purchasePrice === 'string') {
      // Remove commas and dollar signs, then parse
      const cleanedPrice = propertyData.purchasePrice.replace(/[,$]/g, '');
      purchasePrice = parseFloat(cleanedPrice);
    } else {
      purchasePrice = Number(propertyData.purchasePrice);
    }

    // Post-processing: Check if the extracted price might be an estimate
    // This is a safety check in case the AI model picks up an estimate instead of listing price
    const htmlLower = html.toLowerCase();
    
    // Check if the extracted price appears near estimate-related terms
    const priceIndex = htmlLower.indexOf(purchasePrice.toString());
    if (priceIndex > 0) {
      const contextBefore = htmlLower.substring(Math.max(0, priceIndex - 200), priceIndex);
      const contextAfter = htmlLower.substring(priceIndex, Math.min(html.length, priceIndex + 200));
      const context = contextBefore + contextAfter;
      
      // If price appears near estimate terms, try to find the actual listing price
      const estimateTerms = ['redfin estimate', 'redfinestimate', 'estimate', 'estimated value', 'zestimate'];
      const isNearEstimate = estimateTerms.some(term => context.includes(term));
      
      if (isNearEstimate) {
        // Look for the actual listing price in the HTML
        // Common patterns for listing prices
        const listingPricePatterns = [
          /<[^>]*class="[^"]*price[^"]*"[^>]*>[\s$]*([\d,]+)/i,
          /list[_\s-]?price[:\s]*\$?\s*([\d,]+)/i,
          /asking[_\s-]?price[:\s]*\$?\s*([\d,]+)/i,
          /for[_\s-]?sale[:\s]*\$?\s*([\d,]+)/i,
        ];
        
        // Also check for schema.org structured data (most reliable)
        const schemaMatches = [
          ...html.matchAll(/"@type"\s*:\s*"Offer"[^}]*"price"\s*:\s*"?([\d,]+)"?/gi),
          ...html.matchAll(/"price"\s*:\s*"?([\d,]+)"?/gi),
        ];
        
        let alternativePrice: number | null = null;
        
        // Check schema.org prices first (most reliable)
        for (const match of schemaMatches) {
          const foundPrice = parseFloat(match[1]?.replace(/[,$]/g, '') || '0');
          if (foundPrice > 0 && foundPrice > 10000 && foundPrice !== purchasePrice) {
            // Prefer a price that's different from the estimate
            if (!alternativePrice || (foundPrice < purchasePrice && foundPrice > alternativePrice)) {
              alternativePrice = foundPrice;
            }
          }
        }
        
        // Try regex patterns
        if (!alternativePrice) {
          for (const pattern of listingPricePatterns) {
            const matches = html.matchAll(pattern);
            for (const match of matches) {
              const foundPrice = parseFloat(match[1]?.replace(/[,$]/g, '') || '0');
              if (foundPrice > 0 && foundPrice > 10000 && foundPrice !== purchasePrice) {
                if (!alternativePrice || (foundPrice < purchasePrice && foundPrice > alternativePrice)) {
                  alternativePrice = foundPrice;
                }
              }
            }
          }
        }
        
        // If we found an alternative price that's different, use it
        // (estimates are often different from listing prices)
        if (alternativePrice && alternativePrice !== purchasePrice && alternativePrice > 10000) {
          console.log('Price correction: Found alternative listing price (estimate detected)', {
            original: purchasePrice,
            corrected: alternativePrice,
            url,
          });
          purchasePrice = alternativePrice;
        }
      }
    }

    // Validate that we have a valid purchase price (not falsy, not NaN, and > 0)
    if (!purchasePrice || isNaN(purchasePrice) || purchasePrice <= 0) {
      console.warn('Warning: No valid purchase price extracted from URL:', {
        url,
        extractedPrice: propertyData.purchasePrice,
        coercedPrice: purchasePrice,
        rawResponse: extractedText.substring(0, 500),
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Could not find a purchase price in the listing. The page may require JavaScript to load pricing data, or the listing may be expired.',
          hint: 'Try uploading a property details file instead, or manually enter the price after uploading.',
          partialData: propertyData,
        },
        { status: 400 }
      );
    }

    // Update propertyData with the coerced numeric value
    propertyData.purchasePrice = purchasePrice;

    return NextResponse.json({
      success: true,
      data: propertyData,
    });

  } catch (error: any) {
    console.error('Error extracting property from URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to extract property data from URL'
      },
      { status: 500 }
    );
  }
  });
}
