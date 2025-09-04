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
      // Search query specifically for trusted real estate platforms, excluding meetups
      const query = 'from:(zillow.com OR redfin.com OR realtor.com OR mls.com OR homes.com OR trulia.com OR hotpads.com OR apartments.com OR rent.com OR loopnet.com OR crexi.com OR rocketmortgage.com OR quickenloans.com OR compass.com OR coldwellbanker.com OR remax.com OR kw.com OR century21.com OR sothebysrealty.com OR bhhsnymetro.com OR "MLS" OR "Multiple Listing Service") -from:(meetup.com OR eventbrite.com) -subject:(meetup OR "meet up" OR networking OR event OR "real estate meetup" OR "investor meetup")';
      
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
        status: 'new'
      };
    } catch (error) {
      console.error('Error getting email details:', error);
      return null;
    }
  }

  // Enhanced property information parsing
  private parsePropertyInfo(content: string, subject: string): EmailDeal['extractedProperty'] {
    const combined = `${subject} ${content}`.toLowerCase();
    
    // Address extraction (improved patterns)
    const addressPatterns = [
      /(?:address|located at|property at)[:\s]*([^,\n]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|circle|cir|court|ct|boulevard|blvd)[^,\n]*)/i,
      /(\d+\s+[a-zA-Z\s]+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|circle|cir|court|ct|boulevard|blvd))/i,
    ];
    
    let address = '';
    for (const pattern of addressPatterns) {
      const match = combined.match(pattern);
      if (match) {
        address = match[1]?.trim() || match[0]?.trim();
        break;
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

    // City and state extraction
    const cityStateMatch = combined.match(/([a-zA-Z\s]+),\s*([A-Z]{2})/);
    const city = cityStateMatch ? cityStateMatch[1]?.trim() : '';
    const state = cityStateMatch ? cityStateMatch[2]?.trim() : '';

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

    // Exclude meetup and event-related emails
    const meetupExclusions = [
      'meetup', 'meet up', 'networking', 'event', 'webinar', 'workshop', 
      'seminar', 'conference', 'gathering', 'rsvp', 'attending', 'join us',
      'real estate meetup', 'investor meetup', 'rei meetup', 'investment club'
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
}

export const emailMonitoringService = new EmailMonitoringService();