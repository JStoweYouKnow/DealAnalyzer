import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../../server/storage';
import { createHash, createVerify } from 'crypto';
import OpenAI from 'openai';
import { createSafeEmailLog } from '../../lib/pii-redaction';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Wraps a promise with a timeout using Promise.race
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Error message to throw on timeout
 * @returns The result of the promise if it completes before timeout
 * @throws Error with the provided errorMessage if timeout is reached
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

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
 *
 * Security: Verifies SendGrid webhook signature (ECDSA) and timestamp freshness
 * to prevent spoofing and replay attacks.
 */
export async function POST(request: NextRequest) {
  try {
    // Read raw body as ArrayBuffer for signature verification
    // We need to read the raw body before parsing form data
    const rawBody = await request.arrayBuffer();
    const rawBodyBuffer = Buffer.from(rawBody);
    
    // Get headers for signature verification
    const signature = request.headers.get('X-Twilio-Email-Event-Webhook-Signature');
    const timestamp = request.headers.get('X-Twilio-Email-Event-Webhook-Timestamp');
    
    // Verify SendGrid webhook signature before processing
    const verificationResult = verifySendGridWebhookSignature(
      rawBodyBuffer,
      signature,
      timestamp
    );
    
    if (!verificationResult.valid) {
      console.error('SendGrid webhook verification failed:', {
        error: verificationResult.error,
        hasSignature: !!signature,
        hasTimestamp: !!timestamp,
      });
      return NextResponse.json(
        { success: false, error: 'Webhook verification failed' },
        { status: 403 }
      );
    }

    // After successful verification, parse form data from the raw body
    // Create a new Request object with the raw body to parse formData
    const contentType = request.headers.get('content-type') || '';
    let formData: FormData;
    try {
      formData = await parseFormDataFromBuffer(rawBodyBuffer, contentType);
    } catch (parseError) {
      console.error('Error parsing form data after verification:', parseError);
      return NextResponse.json(
        { success: false, error: 'Failed to parse form data' },
        { status: 400 }
      );
    }

    const to = formData.get('to') as string;
    const from = formData.get('from') as string;
    const subject = formData.get('subject') as string;
    const text = formData.get('text') as string;
    const html = formData.get('html') as string;

    // Log with PII-safe redaction (no raw email addresses or subjects in logs)
    const safeLog = createSafeEmailLog({ to, from, subject });
    console.log('Received email webhook:', safeLog);

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
    const contentHash = hashEmailPayload(from, subject, emailContent);

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

    // Extract property information using OpenAI with timeout
    const extractedProperty = await withTimeout(
      extractPropertyFromEmail(subject, emailContent),
      25000, // 25 seconds
      'Extraction timeout'
    );

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

function hashEmailPayload(from: string, subject: string, emailContent: string): string {
  const hash = createHash('sha256');
  const chunkSize = 64 * 1024; // 64KB chunks to avoid large memory usage
  const normalizedContent = normalizeEmailContent(emailContent);

  hash.update(from || '');
  hash.update('\n');
  hash.update(subject || '');
  hash.update('\n');

  for (let i = 0; i < normalizedContent.length; i += chunkSize) {
    hash.update(normalizedContent.slice(i, i + chunkSize));
  }

  return hash.digest('hex');
}

function normalizeEmailContent(content: string): string {
  if (!content) {
    return '';
  }

  return content
    .replace(/\r\n/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
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
 * Parse FormData from a buffer with the given content type
 * Creates a new Request object from the buffer and parses formData from it
 */
async function parseFormDataFromBuffer(
  buffer: Buffer,
  contentType: string
): Promise<FormData> {
  // Create a new Request object from the buffer
  // Convert Buffer to Uint8Array for Request body
  // This allows us to use the native FormData parser
  const request = new Request('http://localhost', {
    method: 'POST',
    headers: {
      'content-type': contentType,
    },
    body: new Uint8Array(buffer),
  });
  
  return await request.formData();
}

/**
 * Verify SendGrid webhook signature using ECDSA
 * 
 * SendGrid signs webhook requests with ECDSA. The signature is verified by:
 * 1. Reconstructing the signed payload (timestamp + raw body)
 * 2. Verifying the ECDSA signature against the public key
 * 3. Checking timestamp freshness (within 5 minutes) to prevent replay attacks
 * 
 * According to SendGrid docs:
 * - Signature is computed over: timestamp + raw body (as binary string)
 * - Signature is base64-encoded
 * - Uses ECDSA with secp256r1 (prime256v1) curve
 * - Public key is provided in PEM format
 * 
 * @param rawBodyBuffer The raw request body as a Buffer
 * @param signature The signature from X-Twilio-Email-Event-Webhook-Signature header
 * @param timestamp The timestamp from X-Twilio-Email-Event-Webhook-Timestamp header
 * @returns Verification result with valid flag and optional error message
 */
function verifySendGridWebhookSignature(
  rawBodyBuffer: Buffer,
  signature: string | null,
  timestamp: string | null
): { valid: boolean; error?: string } {
  // Get webhook public key from environment
  const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
  
  // If public key is not configured, skip verification in development
  // In production, this should always be set
  if (!publicKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  SENDGRID_WEBHOOK_PUBLIC_KEY not set - webhook verification disabled');
      return { valid: false, error: 'Webhook verification not configured' };
    }
    // In development, allow requests without verification
    console.warn('⚠️  SENDGRID_WEBHOOK_PUBLIC_KEY not set - skipping verification (dev mode)');
    return { valid: true };
  }

  // Validate that signature and timestamp headers are present
  if (!signature || !timestamp) {
    console.error('Missing webhook headers:', { 
      hasSignature: !!signature, 
      hasTimestamp: !!timestamp 
    });
    return { valid: false, error: 'Missing signature or timestamp headers' };
  }

  // Check timestamp freshness (prevent replay attacks)
  // SendGrid timestamps are in seconds since epoch
  const requestTimestamp = parseInt(timestamp, 10);
  if (isNaN(requestTimestamp)) {
    return { valid: false, error: 'Invalid timestamp format' };
  }
  
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const timestampAge = currentTimestamp - requestTimestamp;
  
  // Reject requests older than 5 minutes
  const MAX_AGE_SECONDS = 5 * 60; // 5 minutes
  if (timestampAge > MAX_AGE_SECONDS) {
    return {
      valid: false,
      error: `Timestamp too old (age: ${timestampAge}s, max: ${MAX_AGE_SECONDS}s)`,
    };
  }
  
  // Reject requests with negative age (clock skew or future timestamps)
  if (timestampAge < 0) {
    const futureOffset = Math.abs(timestampAge);
    // Allow small clock skew (up to 5 minutes in the future)
    if (futureOffset > MAX_AGE_SECONDS) {
      return {
        valid: false,
        error: `Timestamp is too far in the future (offset: ${futureOffset}s, max: ${MAX_AGE_SECONDS}s)`,
      };
    }
  }

  try {
    // Reconstruct the payload: timestamp + raw body (as binary string)
    // SendGrid signs the concatenation of timestamp and raw body
    const payload = timestamp + rawBodyBuffer.toString('binary');
    
    // The signature from SendGrid is base64-encoded
    const signatureBuffer = Buffer.from(signature, 'base64');
    
    // The public key should be in PEM format
    // SendGrid provides public keys in PEM format
    let publicKeyPem = publicKey.trim();
    if (!publicKeyPem.includes('-----BEGIN')) {
      // If the key doesn't have PEM headers, format it as PEM
      // SendGrid typically provides keys in PEM format, but handle both cases
      publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyPem}\n-----END PUBLIC KEY-----`;
    }
    
    // Verify ECDSA signature using crypto.verify
    // SendGrid uses ECDSA with secp256r1 (prime256v1) curve
    // createVerify hashes the data with SHA256 and then verifies the signature
    const verifyInstance = createVerify('SHA256');
    verifyInstance.update(payload, 'binary');
    
    const isValid = verifyInstance.verify(publicKeyPem, signatureBuffer);
    
    if (!isValid) {
      console.error('ECDSA signature verification failed', {
        timestamp,
        bodyLength: rawBodyBuffer.length,
        signatureLength: signatureBuffer.length,
      });
      return { valid: false, error: 'ECDSA signature verification failed' };
    }
    
    console.log('SendGrid webhook signature verified successfully');
    return { valid: true };
  } catch (error) {
    console.error('Error verifying SendGrid webhook signature:', error);
    return {
      valid: false,
      error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
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
