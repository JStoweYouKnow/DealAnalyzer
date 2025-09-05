import { google } from 'googleapis';
import type { DealAnalysis } from '@shared/schema';

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
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
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
  async setCredentials(accessToken: string, refreshToken: string) {
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    
    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
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
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      const messages = response.data.messages || [];
      const emailDeals: EmailDeal[] = [];

      for (const message of messages) {
        try {
          const email = await this.getEmailDetails(message.id);
          if (email) {
            emailDeals.push(email);
          }
        } catch (error) {
          console.error(`Error processing email ${message.id}:`, error);
        }
      }

      return emailDeals;
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  // Get detailed email information
  private async getEmailDetails(messageId: string): Promise<EmailDeal | null> {
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
      const extractedProperty = this.parsePropertyInfo(emailContent, subject);

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
  private parsePropertyInfo(content: string, subject: string): EmailDeal['extractedProperty'] {
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
      /(\d{1,5})\s*(?:sq\.?\s*ft|square\s*feet|sqft)/gi,
      /square feet[:\s]*(\d{1,5})/gi,
      /(\d{1,5})\s*sq\.\s*ft/gi,
      /size[:\s]*(\d{1,5})\s*sq/gi,
    ];
    
    let sqft: number | undefined;
    for (const pattern of sqftPatterns) {
      const matches = Array.from(combined.matchAll(pattern));
      if (matches.length > 0) {
        const sqftValue = parseInt(matches[0][1]);
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

    // Image URL extraction
    const imagePatterns = [
      /https?:\/\/[^\s]*\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^\s]*)?/gi,
      /https?:\/\/[^\s]*images?[^\s]*\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^\s]*)?/gi,
      /https?:\/\/[^\s]*photo[^\s]*\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^\s]*)?/gi,
      /https?:\/\/[^\s]*image[^\s]*/gi,
      /src=["']([^"']*\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^"']*)?)['"]/gi,
    ];

    const imageUrls: string[] = [];
    for (const pattern of imagePatterns) {
      const matches = Array.from(combined.matchAll(pattern));
      for (const match of matches) {
        const url = match[0] || match[1];
        if (url && url.startsWith('http') && !imageUrls.includes(url)) {
          imageUrls.push(url);
        }
      }
    }

    // Source links extraction
    const linkPatterns = [
      /https?:\/\/[^\s]+/gi,
    ];

    const sourceLinks: Array<{url: string, type: 'listing' | 'company' | 'external' | 'other', description?: string}> = [];
    const foundUrls = new Set<string>();

    // Define unwanted keywords to filter out
    const unwantedKeywords = [
      'unsubscribe', 'preferences', 'privacy', 'feedback', 'nmlsconsumer',
      'terms', 'policy', 'manage', 'notification', 'email', 'optout', 
      'unsub', 'settings', 'track', 'click', 'pixel', 'analytics',
      'campaign', 'utm_', 'redirect', 'mail.', 'token=', 'rtoken='
    ];

    for (const pattern of linkPatterns) {
      const matches = Array.from(combined.matchAll(pattern));
      for (const match of matches) {
        const url = match[0];
        if (url && url.startsWith('http') && !foundUrls.has(url)) {
          foundUrls.add(url);
          
          // Skip unwanted links
          if (unwantedKeywords.some(keyword => url.toLowerCase().includes(keyword))) {
            continue;
          }
          
          // Categorize link type
          let linkType: 'listing' | 'company' | 'external' | 'other' = 'other';
          let description: string | undefined;
          
          if (['zillow', 'realtor', 'redfin', 'mls'].some(domain => url.toLowerCase().includes(domain))) {
            // Only include if it looks like a property listing, not tracking
            if (!['click', 'track', 'email', 'campaign'].some(track => url.toLowerCase().includes(track))) {
              linkType = 'listing';
              description = 'Property listing';
            } else {
              continue; // Skip tracking links
            }
          } else if (['trulia', 'homes.com', 'movoto'].some(domain => url.toLowerCase().includes(domain))) {
            if (!['click', 'track', 'email', 'campaign'].some(track => url.toLowerCase().includes(track))) {
              linkType = 'listing';
              description = 'Property listing';
            } else {
              continue;
            }
          } else if (['company', 'agent', 'broker', 'realty'].some(keyword => url.toLowerCase().includes(keyword))) {
            linkType = 'company';
            description = 'Real estate company';
          } else {
            // Only include external links if they seem property-related
            if (['property', 'home', 'house', 'listing'].some(keyword => url.toLowerCase().includes(keyword))) {
              linkType = 'external';
            } else {
              continue; // Skip other external links
            }
          }
          
          sourceLinks.push({ url, type: linkType, description });
        }
      }
    }

    // Limit to most relevant links (top 3)
    const limitedSourceLinks = sourceLinks.slice(0, 3);

    const result = {
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      price: price || undefined,
      bedrooms,
      bathrooms,
      sqft,
      imageUrls: imageUrls.length > 0 ? imageUrls.slice(0, 3) : undefined,
      sourceLinks: limitedSourceLinks.length > 0 ? limitedSourceLinks : undefined,
    };
    
    console.log('Final parsed property with images/links:', result);
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

    // Exclude meetup, event, and zoom-related emails
    const meetupExclusions = [
      'meetup', 'meet up', 'networking', 'event', 'webinar', 'workshop', 
      'seminar', 'conference', 'gathering', 'rsvp', 'attending', 'join us',
      'real estate meetup', 'investor meetup', 'rei meetup', 'investment club',
      'zoom.us', 'zoom meeting', 'zoom link', 'join zoom', 'zoom call',
      'microsoft teams', 'teams meeting', 'google meet', 'meet.google.com'
    ];

    const combined = `${subject} ${content}`.toLowerCase();
    const senderLower = sender.toLowerCase();
    
    // Exclude meetup platforms and content
    if (senderLower.includes('meetup.com') || senderLower.includes('eventbrite.com')) {
      return false;
    }
    
    // Exclude emails with meetup keywords
    const hasMeetupContent = meetupExclusions.some(keyword => 
      combined.includes(keyword) || senderLower.includes(keyword)
    );
    if (hasMeetupContent) {
      return false;
    }

    const isDomainTrusted = trustedDomains.some(domain => senderLower.includes(domain));
    
    // If from trusted domain, check for real estate content
    if (isDomainTrusted) {
      const realEstateKeywords = [
        'listing', 'property', 'for sale', 'new listing', 'price', 'bedroom', 
        'bathroom', 'sqft', 'square feet', 'home', 'house', 'condo', 'townhome'
      ];
      
      return realEstateKeywords.some(keyword => combined.includes(keyword));
    }
    
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