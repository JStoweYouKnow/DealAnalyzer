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
    
    // Address extraction (enhanced patterns for real estate emails)
    const addressPatterns = [
      // Direct address patterns with street types
      /(\d+\s+[A-Za-z\s.'-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Way|Circle|Cir|Court|Ct|Boulevard|Blvd|Place|Pl|Terrace|Ter|Trail|Trl|Parkway|Pkwy|Square|Sq)(?:\s+[A-Za-z0-9]*)?)/gi,
      // Address with "located at" or similar
      /(?:address|located at|property at|listing at)[:\s]*([^,\n]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Way|Circle|Cir|Court|Ct|Boulevard|Blvd|Place|Pl|Terrace|Ter|Trail|Trl|Parkway|Pkwy)[^,\n]*)/i,
      // For emails that have address on its own line
      /^(\d+\s+[A-Za-z\s.'-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Way|Circle|Cir|Court|Ct|Boulevard|Blvd|Place|Pl|Terrace|Ter|Trail|Trl|Parkway|Pkwy))/m,
      // Address patterns common in Zillow/Redfin emails
      /(\d+\s+[A-Za-z\s.'-]+(?:St|Ave|Rd|Dr|Ln|Way|Cir|Ct|Blvd|Pl|Ter|Trl|Pkwy))\s*[,\n]/i,
    ];
    
    let address = '';
    for (const pattern of addressPatterns) {
      const matches = combined.match(pattern);
      if (matches) {
        // Get the captured group or the first match
        address = (matches[1] || matches[0])?.trim();
        if (address && address.length > 5 && address.length < 100) {
          // Clean up the address
          address = address.replace(/^\s*-+\s*|\s*-+\s*$/g, ''); // Remove leading/trailing dashes
          address = address.replace(/[,\n].*$/, ''); // Remove everything after comma or newline
          break;
        }
      }
    }

    // Price extraction (enhanced)
    const pricePatterns = [
      /\$[\d,]+/g,
      /price[:\s]*\$?[\d,]+/gi,
      /listed at[:\s]*\$?[\d,]+/gi,
      /asking[:\s]*\$?[\d,]+/gi,
    ];
    
    let price = 0;
    for (const pattern of pricePatterns) {
      const matches = combined.match(pattern);
      if (matches) {
        const priceStr = matches[0].replace(/[^\d]/g, '');
        const parsedPrice = parseInt(priceStr);
        if (parsedPrice > 10000) { // Reasonable house price minimum
          price = parsedPrice;
          break;
        }
      }
    }

    // Bedrooms extraction
    const bedroomMatch = combined.match(/(\d+)\s*(?:bed|bedroom|br)/i);
    const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : undefined;

    // Bathrooms extraction
    const bathroomMatch = combined.match(/(\d+(?:\.\d+)?)\s*(?:bath|bathroom|ba)/i);
    const bathrooms = bathroomMatch ? parseFloat(bathroomMatch[1]) : undefined;

    // Square footage extraction
    const sqftMatch = combined.match(/(\d{1,5})\s*(?:sq\.?\s*ft|square\s*feet|sqft)/i);
    const sqft = sqftMatch ? parseInt(sqftMatch[1]) : undefined;

    // City and state extraction (enhanced patterns)
    const cityStatePatterns = [
      // Standard format: City, ST
      /([A-Za-z\s]+),\s*([A-Z]{2})(?:\s|$)/,
      // Sometimes in emails: Address, City, ST ZIP
      /,\s*([A-Za-z\s]+),\s*([A-Z]{2})\s*\d{5}/,
      // After address line
      /(?:^|\n)([A-Za-z\s]+),\s*([A-Z]{2})(?:\s*\d{5})?/m,
    ];
    
    let city = '';
    let state = '';
    for (const pattern of cityStatePatterns) {
      const match = combined.match(pattern);
      if (match && match[1] && match[2]) {
        city = match[1].trim();
        state = match[2].trim();
        // Validate that city doesn't contain numbers or weird characters
        if (!/\d/.test(city) && city.length > 2 && city.length < 30) {
          break;
        }
      }
    }

    return {
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      price: price || undefined,
      bedrooms,
      bathrooms,
      sqft,
    };
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