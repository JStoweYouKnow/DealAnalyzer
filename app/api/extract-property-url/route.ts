import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withRateLimit, expensiveRateLimit } from '../../lib/rate-limit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  return withRateLimit(request, expensiveRateLimit, async (req) => {
  try {
    const { url } = await req.json();

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

    // Truncate HTML to avoid token limits (keep first 50k characters)
    const truncatedHtml = html.substring(0, 50000);

    // Use OpenAI to extract property information
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
  "purchasePrice": number (sale price or asking price),
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
    } catch (error) {
      console.error('Failed to parse OpenAI JSON response:', extractedText);
      return NextResponse.json(
        { success: false, error: 'Failed to parse property data', raw: extractedText },
        { status: 500 }
      );
    }

    // Add the original URL
    propertyData.listingUrl = url;

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
