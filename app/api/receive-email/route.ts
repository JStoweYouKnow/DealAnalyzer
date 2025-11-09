import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../../server/storage';
import { createHash } from 'crypto';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Webhook endpoint for receiving emails from SendGrid Inbound Parse
 *
 * SendGrid sends a POST request with form-data containing:
 * - to: recipient email (e.g., deals+user123@yourdomain.com)
 * - from: sender email
 * - subject: email subject
 * - text: plain text body
 * - html: HTML body
 * - envelope: JSON string with from/to info
 * - headers: email headers
 * - attachments: number of attachments
 * - attachment-info: JSON with attachment metadata
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data from SendGrid
    const formData = await request.formData();

    const to = formData.get('to') as string;
    const from = formData.get('from') as string;
    const subject = formData.get('subject') as string;
    const text = formData.get('text') as string;
    const html = formData.get('html') as string;

    console.log('Received email webhook:', { to, from, subject });

    // Validate required fields
    if (!to || !from || !subject) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (to, from, subject)' },
        { status: 400 }
      );
    }

    // Extract user ID from email address (e.g., deals+user123@domain.com -> user123)
    const userId = extractUserIdFromEmail(to);

    // Use HTML content if available, otherwise plain text
    const emailContent = html || text || '';

    // Create content hash for deduplication
    const contentHash = createHash('sha256')
      .update(`${from}${subject}${emailContent.substring(0, 1000)}`)
      .digest('hex');

    // Check if we've already processed this email
    const existingDeal = await storage.findEmailDealByContentHash(contentHash);
    if (existingDeal) {
      console.log('Email already processed:', contentHash);
      return NextResponse.json({
        success: true,
        message: 'Email already processed',
        dealId: existingDeal.id,
      });
    }

    // Extract property information using OpenAI
    const extractedProperty = await extractPropertyFromEmail(subject, emailContent);

    // Create email deal
    const emailDeal = await storage.createEmailDeal({
      subject,
      sender: from,
      receivedDate: new Date(),
      emailContent,
      extractedProperty,
      status: 'new',
      userId: userId || undefined,
      contentHash,
    });

    console.log('Created email deal:', emailDeal.id);

    return NextResponse.json({
      success: true,
      message: 'Email processed successfully',
      dealId: emailDeal.id,
    });
  } catch (error: any) {
    console.error('Error processing email webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process email' },
      { status: 500 }
    );
  }
}

/**
 * Extract user ID from email address
 * Supports formats like:
 * - deals+user123@domain.com -> user123
 * - deals-user123@domain.com -> user123
 * - deals@domain.com -> null
 */
function extractUserIdFromEmail(email: string): string | null {
  const match = email.match(/deals[+\-]([^@]+)@/);
  return match ? match[1] : null;
}

/**
 * Use OpenAI to extract property information from email content
 */
async function extractPropertyFromEmail(subject: string, emailContent: string): Promise<any> {
  try {
    // Truncate email content to avoid token limits
    const truncatedContent = emailContent.substring(0, 10000);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a real estate deal analyzer. Extract property information from email content.

Return ONLY a valid JSON object with these fields (use null for missing values):
{
  "address": "full street address if available",
  "city": "city name",
  "state": "state name or abbreviation",
  "price": number (purchase price or asking price),
  "monthlyRent": number (monthly rent if mentioned),
  "bedrooms": number,
  "bathrooms": number,
  "sqft": number (square footage),
  "adr": number (Average Daily Rate for short-term rentals),
  "occupancyRate": number (occupancy rate as decimal, e.g. 0.75 for 75%),
  "imageUrls": ["array", "of", "image", "urls"],
  "sourceLinks": [
    {
      "url": "https://...",
      "type": "listing|company|external|other",
      "description": "brief description"
    }
  ]
}

Extract all images and links from the email. For links, identify if they are:
- "listing": Direct property listing pages
- "company": Company/agent websites
- "external": Third-party sites
- "other": Unknown links`,
        },
        {
          role: 'user',
          content: `Extract property information from this email:\n\nSubject: ${subject}\n\nContent:\n${truncatedContent}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const extractedText = completion.choices[0]?.message?.content?.trim();
    if (!extractedText) {
      return {};
    }

    // Remove markdown code blocks if present
    const jsonText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const propertyData = JSON.parse(jsonText);

    return propertyData;
  } catch (error) {
    console.error('Error extracting property from email:', error);
    // Return empty object if extraction fails
    return {};
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'receive-email',
    message: 'Email webhook endpoint is active',
  });
}
