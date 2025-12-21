import { google } from 'googleapis';
import type { DealAnalysis } from '@shared/schema';
import { aiQualityScoringService } from './ai-scoring-service';

// Lazy import Convex client for token persistence
let convexClient: any = null;
let convexApi: any = null;

async function initializeConvexForTokens() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return false;
  }

  try {
    if (!convexClient) {
      const { ConvexHttpClient } = await import('convex/browser');
      convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    }

    if (!convexApi) {
      const apiModule = await import('../convex/_generated/api');
      convexApi = apiModule.api;
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize Convex for token persistence:', error);
    return false;
  }
}

async function persistTokens(
  userId: string,
  accessToken: string,
  refreshToken: string | undefined,
  scope: string | undefined,
  expiryDate: number | undefined,
  tokenType: string | undefined
) {
  try {
    const initialized = await initializeConvexForTokens();
    if (!initialized || !convexClient || !convexApi) {
      console.error('Convex not available for token persistence');
      return;
    }

    // Only persist if we have both access token and refresh token
    // If refresh token is not provided, we keep the existing one
    if (!accessToken) {
      console.warn('Attempted to persist tokens without access token');
      return;
    }

    // If refresh token is not provided in the new tokens, we need to fetch the existing one
    // For now, we'll require refreshToken to be passed
    if (!refreshToken) {
      console.warn('Refresh token not provided in token update, skipping persistence');
      return;
    }

    await convexClient.mutation(convexApi.userOAuthTokens.upsertTokens, {
      userId,
      accessToken,
      refreshToken,
      scope,
      expiryDate,
      tokenType: tokenType || 'Bearer',
    });

    console.log(`Tokens persisted successfully for user ${userId.substring(0, 8)}...`);
  } catch (error) {
    console.error('Error persisting tokens to database:', error);
    // Don't throw - token refresh should continue even if persistence fails
  }
}

export interface EmailDeal {
  id: string;
  subject: string;
  sender: string;
  receivedDate: Date;
  emailContent: string;
  extractedProperty?: {
    address?: string;
    city?: string;
    state?: string;
    price?: number;
    monthlyRent?: number;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    // Short-term rental metrics
    adr?: number; // Average Daily Rate
    occupancyRate?: number; // As decimal (0.75 = 75%)
    imageUrls?: string[];
    sourceLinks?: Array<{
      url: string;
      type: 'listing' | 'company' | 'external' | 'other';
      description?: string;
      aiScore?: number;
      aiCategory?: 'excellent' | 'good' | 'fair' | 'poor';
      aiReasoning?: string;
    }>;
    imageScores?: Array<{
      url: string;
      aiScore?: number;
      aiCategory?: 'excellent' | 'good' | 'fair' | 'poor';
      aiReasoning?: string;
    }>;
  };
  status: 'new' | 'reviewed' | 'analyzed' | 'archived';
  analysis?: DealAnalysis;
}

export class EmailMonitoringService {
  private gmail: any;
  
  constructor() {
    // Initialize Gmail API client
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  // Set up OAuth credentials
  // onTokenRefresh: Optional callback that receives refreshed tokens and returns a Promise
  // This allows the caller to update cookies or other storage without race conditions
  async setCredentials(
    accessToken: string, 
    refreshToken: string, 
    userId?: string, 
    scope?: string, 
    expiryDate?: number, 
    tokenType?: string,
    onTokenRefresh?: (tokens: { access_token: string; refresh_token?: string; scope?: string; expiry_date?: number; token_type?: string }) => Promise<void>
  ) {
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    
    // Store the current refresh token so we can preserve it if not updated
    let currentRefreshToken = refreshToken;
    let currentScope: string | undefined = scope;
    let currentExpiryDate: number | undefined = expiryDate;
    let currentTokenType: string | undefined = tokenType;
    
    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    // Persist initial tokens if userId is provided
    if (userId && accessToken && refreshToken) {
      try {
        await persistTokens(
          userId,
          accessToken,
          refreshToken,
          currentScope,
          currentExpiryDate,
          currentTokenType
        );
      } catch (error) {
        console.error('Error persisting initial tokens:', error);
        // Continue even if initial persistence fails
      }
    }
    
    // Configure automatic token refresh
    if (userId) {
      auth.on('tokens', async (tokens) => {
        try {
          // Update current refresh token if a new one is provided
          if (tokens.refresh_token) {
            currentRefreshToken = tokens.refresh_token;
            console.log('New refresh token received for user');
          }
          
          // Update scope if provided
          if (tokens.scope) {
            currentScope = tokens.scope;
          }
          
          // Update expiry date if provided
          if (tokens.expiry_date) {
            currentExpiryDate = tokens.expiry_date;
          }
          
          // Update token type if provided
          if (tokens.token_type) {
            currentTokenType = tokens.token_type;
          }
          
          // Always persist when access token is refreshed
          // Use the current refresh token (which may have been updated above)
          if (tokens.access_token && currentRefreshToken) {
            // Persist to database
            await persistTokens(
              userId,
              tokens.access_token,
              currentRefreshToken,
              currentScope,
              currentExpiryDate,
              currentTokenType
            );
            console.log('Access token refreshed and persisted for user');
            
            // Call the onTokenRefresh callback if provided (e.g., to update cookies)
            // This allows the caller to update cookies or other storage
            if (onTokenRefresh) {
              try {
                await onTokenRefresh({
                  access_token: tokens.access_token,
                  refresh_token: currentRefreshToken,
                  scope: currentScope,
                  expiry_date: currentExpiryDate,
                  token_type: currentTokenType
                });
              } catch (error) {
                console.error('Error in onTokenRefresh callback:', error);
                // Don't throw - token refresh should continue even if callback fails
              }
            }
          }
        } catch (error) {
          console.error('Error handling token refresh event:', error);
          // Don't throw - we want token refresh to continue even if persistence fails
        }
      });
    } else {
      // Log warning if userId is not provided
      console.warn('setCredentials called without userId - tokens will not be persisted');
    }
    
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  // Get authorization URL for Gmail access
  getAuthUrl(): string {
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

    return auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'select_account', // Force account selection every time
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code: string) {
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    const { tokens } = await auth.getToken(code);
    return tokens;
  }

  // Search for real estate related emails
  async searchRealEstateEmails(maxResults: number = 50): Promise<EmailDeal[]> {
    try {
      // Search query specifically for trusted real estate platforms, excluding meetups and zoom
      const query = 'from:(zillow.com OR redfin.com OR realtor.com OR mls.com OR homes.com OR trulia.com OR hotpads.com OR apartments.com OR rent.com OR loopnet.com OR crexi.com OR rocketmortgage.com OR quickenloans.com OR compass.com OR coldwellbanker.com OR remax.com OR kw.com OR century21.com OR sothebysrealty.com OR bhhsnymetro.com OR "MLS" OR "Multiple Listing Service") -from:(meetup.com OR eventbrite.com OR zoom.us) -subject:(meetup OR "meet up" OR networking OR event OR "real estate meetup" OR "investor meetup" OR zoom OR "zoom meeting")';

      console.log(`Searching Gmail with query: ${query.substring(0, 100)}...`);
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      const messages = response.data.messages || [];
      console.log(`Gmail API returned ${messages.length} messages matching the search query`);
      const emailDeals: EmailDeal[] = [];
      let filteredCount = 0;

      // Process emails in parallel batches of 10 for better performance
      // Skip AI scoring during initial sync for faster processing
      const BATCH_SIZE = 10;
      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(messages.length / BATCH_SIZE)} (${batch.length} emails)`);

        const batchResults = await Promise.allSettled(
          batch.map(message => this.getEmailDetails(message.id, true)) // Skip AI scoring for speed
        );

        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          const message = batch[j];

          if (result.status === 'fulfilled' && result.value) {
            console.log(`✓ Email ${message.id} passed filters: "${result.value.subject.substring(0, 50)}..."`);
            emailDeals.push(result.value);
          } else if (result.status === 'fulfilled' && !result.value) {
            filteredCount++;
            console.log(`✗ Email ${message.id} filtered out by isRealEstateEmail check`);
          } else if (result.status === 'rejected') {
            console.error(`Error processing email ${message.id}:`, result.reason);
          }
        }
      }

      console.log(`Final result: ${emailDeals.length} emails passed filters, ${filteredCount} were filtered out`);
      return emailDeals;
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  /**
   * Fetch recent emails from Gmail and store them in the database
   * This method loads OAuth tokens for the user, fetches emails, and stores new ones
   *
   * Performance optimizations:
   * - Processes emails in parallel batches of 10
   * - Skips AI scoring during initial sync for faster processing (< 15 seconds)
   * - AI scoring happens asynchronously in the background after sync completes
   * - Default limit of 25 emails to avoid timeouts
   */
  async fetchRecentEmails(userId: string, maxResults: number = 25): Promise<{ emailCount: number; newDeals: number }> {
    try {
      console.log(`[Gmail Fetch] Starting email fetch for user ${userId.substring(0, 20)}...`);

      // Load OAuth tokens for this user from database
      const hasTokens = await this.loadUserTokensFromDatabase(userId);

      if (!hasTokens) {
        throw new Error('Gmail not connected. No OAuth tokens found for this user.');
      }

      console.log(`[Gmail Fetch] Tokens loaded, searching for real estate emails...`);

      // Search for real estate emails using the Gmail API
      const emailDeals = await this.searchRealEstateEmails(maxResults);

      console.log(`[Gmail Fetch] Found ${emailDeals.length} emails from Gmail API`);

      // Store emails in database (skip duplicates)
      let newDealsCreated = 0;

      // Import storage dynamically to avoid circular dependencies
      const { storage } = await import('./storage');

      for (const emailDeal of emailDeals) {
        try {
          // Generate content hash for deduplication
          const contentHash = this.generateContentHash(
            emailDeal.subject,
            emailDeal.sender,
            emailDeal.emailContent
          );

          // Check if this email already exists
          const existingDeal = await storage.findEmailDealByContentHash(contentHash, userId);

          if (!existingDeal) {
            // Create new deal
            await storage.createEmailDeal({
              ...emailDeal,
              userId,
              contentHash,
              status: emailDeal.status || 'new',
            });
            newDealsCreated++;
            console.log(`[Gmail Fetch] Created new deal: ${emailDeal.subject.substring(0, 50)}...`);
          } else {
            console.log(`[Gmail Fetch] Skipped duplicate: ${emailDeal.subject.substring(0, 50)}...`);
          }
        } catch (error) {
          console.error(`[Gmail Fetch] Error storing email deal:`, error);
          // Continue with next email even if one fails
        }
      }

      console.log(`[Gmail Fetch] Complete: ${newDealsCreated} new deals created out of ${emailDeals.length} emails`);

      // Trigger background AI scoring asynchronously (don't await)
      if (emailDeals.length > 0) {
        this.scoreEmailsInBackground(userId, emailDeals.map(e => e.id)).catch(err => {
          console.error('[Background Scoring] Failed:', err);
        });
      }

      return {
        emailCount: emailDeals.length,
        newDeals: newDealsCreated,
      };
    } catch (error) {
      console.error('[Gmail Fetch] Error fetching emails:', error);
      throw error;
    }
  }

  /**
   * Score emails in the background with AI
   * This runs asynchronously after the initial sync to add AI quality scores
   * without blocking the sync response
   */
  private async scoreEmailsInBackground(userId: string, emailIds: string[]): Promise<void> {
    try {
      console.log(`[Background Scoring] Starting AI scoring for ${emailIds.length} emails...`);

      // Initialize Convex directly to avoid request context issues
      if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
        console.warn('[Background Scoring] NEXT_PUBLIC_CONVEX_URL not configured');
        return;
      }

      const initialized = await initializeConvexForTokens();
      if (!initialized || !convexClient || !convexApi) {
        console.warn('[Background Scoring] Failed to initialize Convex');
        return;
      }

      // Process in batches of 5 to avoid overwhelming the AI API
      const BATCH_SIZE = 5;
      let scoredCount = 0;

      for (let i = 0; i < emailIds.length; i += BATCH_SIZE) {
        const batch = emailIds.slice(i, i + BATCH_SIZE);
        console.log(`[Background Scoring] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(emailIds.length / BATCH_SIZE)}`);

        await Promise.allSettled(
          batch.map(async (gmailId) => {
            try {
              // Get the email deal directly from Convex
              const emailDeal = await convexClient.query(convexApi.emailDeals.getByGmailId, { gmailId });

              if (!emailDeal || emailDeal.userId !== userId || !emailDeal.extractedProperty) {
                return;
              }

              const property = emailDeal.extractedProperty;
              const sourceLinks = property.sourceLinks || [];
              const imageUrls = property.imageUrls || [];

              // Skip if no links or images to score
              if (sourceLinks.length === 0 && imageUrls.length === 0) {
                return;
              }

              // Prepare context for scoring
              const propertyContext = `${property.address || ''} ${property.city || ''} ${property.state || ''} - ${property.bedrooms || '?'}BR/${property.bathrooms || '?'}BA`.trim();

              // Limit links for scoring
              const listingLinks = sourceLinks.filter((link: any) => link.type === 'listing');
              const otherLinks = sourceLinks.filter((link: any) => link.type !== 'listing');
              const limitedSourceLinks = [...listingLinks.slice(0, 2), ...otherLinks.slice(0, 1)];

              // Score links and images in parallel
              const [linkScores, imgScores] = await Promise.all([
                limitedSourceLinks.length > 0 ? aiQualityScoringService.scoreLinks(limitedSourceLinks) : Promise.resolve([]),
                imageUrls.length > 0 ? aiQualityScoringService.scoreImages(imageUrls.slice(0, 1), propertyContext) : Promise.resolve([])
              ]);

              // Build updated property with scores
              const scoredSourceLinks = limitedSourceLinks.map((link: any, index: number) => ({
                ...link,
                aiScore: linkScores[index]?.score,
                aiCategory: linkScores[index]?.category,
                aiReasoning: linkScores[index]?.reasoning
              }));

              const imageScores = imageUrls.slice(0, 1).map((url: string, index: number) => ({
                url,
                aiScore: imgScores[index]?.score,
                aiCategory: imgScores[index]?.category,
                aiReasoning: imgScores[index]?.reasoning
              }));

              // Update the email deal directly via Convex mutation
              await convexClient.mutation(convexApi.emailDeals.update, {
                id: emailDeal._id,
                extractedProperty: {
                  ...property,
                  sourceLinks: [
                    ...scoredSourceLinks,
                    ...sourceLinks.slice(limitedSourceLinks.length)
                  ],
                  imageUrls: imageScores.length > 0 ?
                    [...imageScores.map((s: any) => s.url), ...imageUrls.slice(1)] :
                    imageUrls
                }
              });

              scoredCount++;
              console.log(`[Background Scoring] ✓ Scored email ${gmailId.substring(0, 20)}`);
            } catch (error) {
              console.error(`[Background Scoring] Failed to score email ${gmailId}:`, error);
            }
          })
        );
      }

      console.log(`[Background Scoring] Complete: Scored ${scoredCount}/${emailIds.length} emails`);
    } catch (error) {
      console.error('[Background Scoring] Error:', error);
      // Don't throw - this is a background process
    }
  }

  /**
   * Load OAuth tokens for a user from the database
   * Returns true if tokens were loaded successfully
   */
  private async loadUserTokensFromDatabase(userId: string): Promise<boolean> {
    try {
      if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
        console.error('[Gmail Fetch] NEXT_PUBLIC_CONVEX_URL not configured');
        return false;
      }

      const initialized = await initializeConvexForTokens();
      if (!initialized || !convexClient || !convexApi) {
        console.error('[Gmail Fetch] Failed to initialize Convex');
        return false;
      }

      // Retrieve tokens from database
      const dbTokens = await convexClient.action(
        convexApi.userOAuthTokens.retrieveTokensForServer,
        { userId }
      );

      if (!dbTokens || !dbTokens.accessToken) {
        console.error('[Gmail Fetch] No Gmail tokens found for user');
        return false;
      }

      // Set credentials in Gmail API client
      await this.setCredentials(
        dbTokens.accessToken,
        dbTokens.refreshToken,
        dbTokens.expiryDate,
        userId
      );

      console.log(`[Gmail Fetch] Successfully loaded tokens for user ${userId.substring(0, 20)}`);
      return true;
    } catch (error) {
      console.error('[Gmail Fetch] Error loading user tokens:', error);
      return false;
    }
  }

  // Get detailed email information
  private async getEmailDetails(messageId: string, skipAIScoring: boolean = false): Promise<EmailDeal | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;
      const headers = message.payload.headers;
      
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const sender = headers.find((h: any) => h.name === 'From')?.value || '';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';
      
      // Extract email body
      let emailContent = '';
      if (message.payload.body?.data) {
        emailContent = Buffer.from(message.payload.body.data, 'base64').toString();
      } else if (message.payload.parts) {
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            if (part.body?.data) {
              emailContent += Buffer.from(part.body.data, 'base64').toString();
            }
          }
        }
      }

      // Only process if it's from a trusted real estate source
      if (!this.isRealEstateEmail(subject, emailContent, sender)) {
        return null;
      }

      // Parse property information from email content
      const extractedProperty = await this.parsePropertyInfo(emailContent, subject);

      return {
        id: messageId,
        subject,
        sender,
        receivedDate: new Date(date),
        emailContent,
        extractedProperty,
        status: 'new' as const
      };
    } catch (error) {
      console.error('Error getting email details:', error);
      return null;
    }
  }

  // Enhanced property information parsing
  private async parsePropertyInfo(content: string, subject: string): Promise<EmailDeal['extractedProperty']> {
    const combined = `${subject} ${content}`;
    console.log('Parsing property info from:', combined.substring(0, 500));
    
    // Address extraction (more restrictive patterns to avoid false matches)
    const addressPatterns = [
      // Match full address format: "123 Main Street" but not phrases containing these words
      /\b(\d+\s+[A-Za-z][A-Za-z\s.'-]*[A-Za-z]\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Way|Circle|Cir|Court|Ct|Boulevard|Blvd|Place|Pl))\b/gi,
      // More restrictive - require word boundaries and proper capitalization
      /\b(\d+\s+[A-Z][a-zA-Z\s.'-]*\s+(?:St|Ave|Rd|Dr|Ln|Way|Blvd))\b/g,
    ];
    
    let address = '';
    for (const pattern of addressPatterns) {
      const matches = Array.from(combined.matchAll(pattern));
      console.log(`Pattern ${pattern} found matches:`, matches.map(m => m[1] || m[0]));
      
      if (matches.length > 0) {
        // Take the first valid match - add more validation
        for (const match of matches) {
          const candidate = (match[1] || match[0])?.trim();
          if (candidate && 
              candidate.length > 8 && 
              candidate.length < 80 &&
              !candidate.toLowerCase().includes('credit score') &&
              !candidate.toLowerCase().includes('minutes') &&
              !candidate.toLowerCase().includes('impact') &&
              !/^\d+\s+\w+\s+with\s/.test(candidate.toLowerCase())) {
            address = candidate;
            console.log('Selected address:', address);
            break;
          }
        }
        if (address) break;
      }
    }

    // Price extraction (enhanced)
    const pricePatterns = [
      /\$\s*([\d,]+)/g,
      /price[:\s]*\$?([\d,]+)/gi,
      /listed at[:\s]*\$?([\d,]+)/gi,
      /asking[:\s]*\$?([\d,]+)/gi,
      /purchase price[:\s]*\$?([\d,]+)/gi,
      /list price[:\s]*\$?([\d,]+)/gi,
    ];
    
    let price = 0;
    for (const pattern of pricePatterns) {
      const matches = Array.from(combined.matchAll(pattern));
      if (matches.length > 0) {
        for (const match of matches) {
          const priceStr = (match[1] || match[0]).replace(/[^\d]/g, '');
          const parsedPrice = parseInt(priceStr);
          if (parsedPrice > 10000) { // Reasonable house price minimum
            price = parsedPrice;
            break;
          }
        }
        if (price > 0) break;
      }
    }

    // Bedrooms extraction
    const bedroomPatterns = [
      /(\d+)\s*(?:bed|bedroom|bd|br)(?:room)?s?/gi,
      /bedrooms?[:\s]*(\d+)/gi,
      /(\d+)\s*bed/gi,
    ];
    
    let bedrooms: number | undefined;
    for (const pattern of bedroomPatterns) {
      const matches = Array.from(combined.matchAll(pattern));
      if (matches.length > 0) {
        const bedroomCount = parseInt(matches[0][1]);
        if (bedroomCount > 0 && bedroomCount <= 20) { // Reasonable bedroom range
          bedrooms = bedroomCount;
          break;
        }
      }
    }

    // Bathrooms extraction  
    const bathroomPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:bath|bathroom|ba)(?:room)?s?/gi,
      /bathrooms?[:\s]*(\d+(?:\.\d+)?)/gi,
      /(\d+(?:\.\d+)?)\s*ba\b/gi,
    ];
    
    let bathrooms: number | undefined;
    for (const pattern of bathroomPatterns) {
      const matches = Array.from(combined.matchAll(pattern));
      if (matches.length > 0) {
        const bathroomCount = parseFloat(matches[0][1]);
        if (bathroomCount > 0 && bathroomCount <= 20) { // Reasonable bathroom range
          bathrooms = bathroomCount;
          break;
        }
      }
    }

    // Square footage extraction
    const sqftPatterns = [
      /([\d,]+)\s*sqft/gi,
      /([\d,]+)\s*sq\.?\s*ft\.?\b/gi,  
      /([\d,]+)\s*square\s*feet/gi,
      /square feet[:\s]*([\d,]+)/gi,
      /size[:\s]*([\d,]+)/gi,
    ];
    
    let sqft: number | undefined;
    for (const pattern of sqftPatterns) {
      const matches = Array.from(combined.matchAll(pattern));
      if (matches.length > 0) {
        const sqftValue = parseInt(matches[0][1].replace(/,/g, ''));
        if (sqftValue > 100 && sqftValue < 50000) { // Reasonable sqft range
          sqft = sqftValue;
          break;
        }
      }
    }

    // City and state extraction - simplified and more reliable
    const cityStatePattern = /([A-Za-z\s]+),\s*([A-Z]{2})\b/g;
    const cityStateMatches = Array.from(combined.matchAll(cityStatePattern));
    console.log('City/State matches:', cityStateMatches.map(m => `${m[1]}, ${m[2]}`));
    
    let city = '';
    let state = '';
    if (cityStateMatches.length > 0) {
      // Take the first reasonable match
      for (const match of cityStateMatches) {
        const candidateCity = match[1]?.trim();
        const candidateState = match[2]?.trim();
        if (candidateCity && candidateState && 
            candidateCity.length > 2 && candidateCity.length < 30 && 
            !/\d/.test(candidateCity)) {
          city = candidateCity;
          state = candidateState;
          console.log('Selected city/state:', city, state);
          break;
        }
      }
    }

    // Image URL extraction - more selective to avoid tracking pixels and unwanted images
    const imagePatterns = [
      // Only high-quality property images, not tracking pixels or small images
      /https?:\/\/[^\s]*\.(?:jpg|jpeg|png|webp)(?:\?[^\s]*)?/gi,
    ];

    const imageUrls: string[] = [];
    const unwantedImageKeywords = [
      'pixel', 'track', '1x1', 'beacon', 'analytics', 'utm_', 'click', 
      'logo', 'banner', 'header', 'footer', 'icon', 'button', 'email',
      'signature', 'social', 'facebook', 'twitter', 'instagram', 'linkedin',
      '16x16', '32x32', '64x64', '100x100', 'tiny', 'small'
    ];

    for (const pattern of imagePatterns) {
      const matches = Array.from(combined.matchAll(pattern));
      for (const match of matches) {
        const url = match[0];
        if (url && url.startsWith('http') && !imageUrls.includes(url)) {
          // Skip unwanted images
          const urlLower = url.toLowerCase();
          const isUnwanted = unwantedImageKeywords.some(keyword => urlLower.includes(keyword));
          
          // Also skip very small images (likely tracking pixels)
          const hasSmallDimensions = /\d+x\d+/.test(urlLower) && 
            (/[12]?\d{1,2}x[12]?\d{1,2}/.test(urlLower) || /\b(?:16|32|64|100)x(?:16|32|64|100)\b/.test(urlLower));
          
          if (!isUnwanted && !hasSmallDimensions) {
            imageUrls.push(url);
          }
        }
      }
    }

    // Source links extraction - more precise filtering for actual property listings
    const linkPatterns = [
      /https?:\/\/[^\s<>"']+/gi,
    ];

    const sourceLinks: Array<{url: string, type: 'listing' | 'company' | 'external' | 'other', description?: string}> = [];
    const foundUrls = new Set<string>();

    // More comprehensive unwanted keywords
    const unwantedKeywords = [
      'unsubscribe', 'preferences', 'privacy', 'feedback', 'nmlsconsumer',
      'terms', 'policy', 'manage', 'notification', 'email', 'optout', 
      'unsub', 'settings', 'track', 'click', 'pixel', 'analytics',
      'campaign', 'utm_', 'redirect', 'mail.', 'token=', 'rtoken=',
      'mlsid', 'gclid', 'fbclid', 'source=', 'medium=', 'content=',
      'trk_', 'cid=', 'sid=', '_ga=', 'ref=', 'from=email'
    ];

    // Property listing indicators - more specific patterns
    const listingIndicators = [
      '/homedetails/', '/property-overview/', '/homes/', '/listing/',
      '/details/', '/property/', '/home/', '/house/', '/condo/',
      'mls', 'mlsid', 'listingid', 'propertyid'
    ];

    for (const pattern of linkPatterns) {
      const matches = Array.from(combined.matchAll(pattern));
      for (const match of matches) {
        let url = match[0];
        if (url && url.startsWith('http') && !foundUrls.has(url)) {
          foundUrls.add(url);
          
          const urlLower = url.toLowerCase();
          
          // Skip unwanted links
          if (unwantedKeywords.some(keyword => urlLower.includes(keyword))) {
            continue;
          }
          
          // Clean up URL by removing trailing punctuation
          url = url.replace(/[.,;!?)]+$/, '');
          
          let linkType: 'listing' | 'company' | 'external' | 'other' = 'other';
          let description: string | undefined;
          
          // Check for actual property listing URLs
          if (['zillow.com', 'redfin.com', 'realtor.com'].some(domain => urlLower.includes(domain))) {
            // Look for specific listing URL patterns
            if (listingIndicators.some(indicator => urlLower.includes(indicator))) {
              linkType = 'listing';
              description = 'Property listing';
            } else {
              continue; // Skip non-listing pages from these domains
            }
          } else if (['trulia.com', 'homes.com', 'movoto.com', 'rent.com'].some(domain => urlLower.includes(domain))) {
            if (listingIndicators.some(indicator => urlLower.includes(indicator))) {
              linkType = 'listing';
              description = 'Property listing';
            } else {
              continue;
            }
          } else if (['mls.com', 'mlslistings.com'].some(domain => urlLower.includes(domain))) {
            linkType = 'listing';
            description = 'MLS listing';
          } else {
            // Skip other domains unless they clearly contain property listings
            continue;
          }
          
          sourceLinks.push({ url, type: linkType, description });
          
          // Only keep the first 2 actual listing links
          if (sourceLinks.filter(link => link.type === 'listing').length >= 2) {
            break;
          }
        }
      }
    }

    // Prioritize listing links and limit total
    const listingLinks = sourceLinks.filter(link => link.type === 'listing');
    const otherLinks = sourceLinks.filter(link => link.type !== 'listing');
    const limitedSourceLinks = [...listingLinks.slice(0, 2), ...otherLinks.slice(0, 1)];

    // Apply AI scoring to links and images (skip if requested for faster sync)
    let scoredSourceLinks = limitedSourceLinks;
    let imageScores: Array<{url: string, aiScore?: number, aiCategory?: 'excellent' | 'good' | 'fair' | 'poor', aiReasoning?: string}> = [];

    if (!skipAIScoring && (limitedSourceLinks.length > 0 || imageUrls.length > 0)) {
      try {
        const propertyContext = `${address || ''} ${city || ''} ${state || ''} - ${bedrooms || '?'}BR/${bathrooms || '?'}BA`.trim();

        // Score links and images in parallel
        const [linkScores, imgScores] = await Promise.all([
          limitedSourceLinks.length > 0 ? aiQualityScoringService.scoreLinks(limitedSourceLinks) : Promise.resolve([]),
          imageUrls.length > 0 ? aiQualityScoringService.scoreImages(imageUrls.slice(0, 1), propertyContext) : Promise.resolve([])
        ]);

        // Add AI scores to source links
        scoredSourceLinks = limitedSourceLinks.map((link, index) => ({
          ...link,
          aiScore: linkScores[index]?.score,
          aiCategory: linkScores[index]?.category,
          aiReasoning: linkScores[index]?.reasoning
        }));

        // Create image scores array
        imageScores = imageUrls.slice(0, 1).map((url, index) => ({
          url,
          aiScore: imgScores[index]?.score,
          aiCategory: imgScores[index]?.category,
          aiReasoning: imgScores[index]?.reasoning
        }));

        console.log('AI Scoring completed:', {
          linkScores: linkScores.map(s => ({ score: s.score, category: s.category })),
          imageScores: imgScores.map(s => ({ score: s.score, category: s.category }))
        });

      } catch (error) {
        console.error('AI scoring failed, proceeding without scores:', error);
      }
    } else if (skipAIScoring) {
      console.log('AI Scoring skipped for faster sync');
    }

    const result = {
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      price: price || undefined,
      bedrooms,
      bathrooms,
      sqft,
      imageUrls: imageUrls.length > 0 ? imageUrls.slice(0, 1) : undefined, // Limit to 1 image
      sourceLinks: scoredSourceLinks.length > 0 ? scoredSourceLinks : undefined,
      imageScores: imageScores.length > 0 ? imageScores : undefined,
    };
    
    console.log('Final parsed property with AI scores:', result);
    return result;
  }

  // Filter emails that likely contain property listings from trusted sources
  isRealEstateEmail(subject: string, content: string, sender: string): boolean {
    const trustedDomains = [
      'zillow.com', 'redfin.com', 'realtor.com', 'mls.com', 'homes.com',
      'trulia.com', 'hotpads.com', 'apartments.com', 'rent.com', 'loopnet.com',
      'crexi.com', 'compass.com', 'coldwellbanker.com', 'remax.com', 'kw.com',
      'century21.com', 'sothebysrealty.com', 'rocketmortgage.com', 'quickenloans.com'
    ];

    // Exclude meetup, event, and zoom-related emails (be specific to avoid false positives)
    const meetupExclusions = [
      'meetup', 'meet up', 'networking event', 'webinar', 'workshop',
      'seminar', 'conference', 'gathering', 'rsvp', 'attending', 'join us for',
      'real estate meetup', 'investor meetup', 'rei meetup', 'investment club',
      'zoom.us', 'zoom meeting', 'zoom link', 'join zoom', 'zoom call',
      'microsoft teams', 'teams meeting', 'google meet', 'meet.google.com'
    ];

    const combined = `${subject} ${content}`.toLowerCase();
    const senderLower = sender.toLowerCase();

    console.log(`\n=== Filtering Email ===`);
    console.log(`Subject: ${subject.substring(0, 80)}`);
    console.log(`Sender: ${sender}`);

    // Exclude meetup platforms and content
    if (senderLower.includes('meetup.com') || senderLower.includes('eventbrite.com')) {
      console.log(`❌ Rejected: Meetup/Eventbrite platform`);
      return false;
    }

    // Exclude emails with meetup keywords
    const hasMeetupContent = meetupExclusions.some(keyword =>
      combined.includes(keyword) || senderLower.includes(keyword)
    );
    if (hasMeetupContent) {
      const matchedKeyword = meetupExclusions.find(keyword =>
        combined.includes(keyword) || senderLower.includes(keyword)
      );
      console.log(`❌ Rejected: Contains meetup keyword "${matchedKeyword}"`);
      return false;
    }

    const isDomainTrusted = trustedDomains.some(domain => senderLower.includes(domain));
    console.log(`Trusted domain check: ${isDomainTrusted}`);

    // Accept ALL emails from trusted real estate domains
    // The Gmail search query already filters for these specific domains,
    // and we've already excluded meetup/event content, so we can trust the rest
    if (isDomainTrusted) {
      console.log(`✅ Accepted: Email from trusted real estate domain`);
      return true;
    }

    console.log(`❌ Rejected: Not from trusted domain`);
    return false;
  }

  // Generate a hash for duplicate detection
  generateContentHash(subject: string, sender: string, content: string): string {
    // Create a simple hash based on key content elements
    const normalized = `${subject.toLowerCase().trim()}_${sender.toLowerCase().trim()}_${content.substring(0, 500).toLowerCase().trim()}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

export const emailMonitoringService = new EmailMonitoringService();