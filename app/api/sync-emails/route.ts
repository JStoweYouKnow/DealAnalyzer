import { NextResponse } from "next/server";
import { emailMonitoringService } from "../../../server/email-service";
import { storage } from "../../../server/storage";
import { cookies } from "next/headers";
import type { EmailMonitoringResponse } from "../../../shared/schema";

export async function POST() {
  try {
    // Check if user has Gmail tokens
    const cookieStore = await cookies();
    const gmailTokensCookie = cookieStore.get('gmailTokens');
    
    if (!gmailTokensCookie) {
      return NextResponse.json(
        { success: false, error: "Gmail not connected. Please connect your Gmail account first." },
        { status: 401 }
      );
    }

    const gmailTokens = JSON.parse(gmailTokensCookie.value);

    // Set credentials for email service
    await emailMonitoringService.setCredentials(
      gmailTokens.access_token,
      gmailTokens.refresh_token
    );

    // Search for real estate emails (limit to 25 to avoid timeouts)
    const emailDeals = await emailMonitoringService.searchRealEstateEmails(25);
    
    // Store new deals in storage, checking for duplicates
    const storedDeals = [];
    console.log(`Syncing ${emailDeals.length} email deals from Gmail`);
    
    for (const deal of emailDeals) {
      console.log(`Processing deal: ${deal.id} - "${deal.subject?.substring(0, 50)}..."`);
      
      // Check if deal already exists by ID
      const existingDeal = await storage.getEmailDeal(deal.id);
      
      // Generate content hash for duplicate detection
      const contentHash = emailMonitoringService.generateContentHash(deal.subject, deal.sender, deal.emailContent);
      const duplicateByHash = await storage.findEmailDealByContentHash(contentHash);
      
      if (!existingDeal && !duplicateByHash) {
        console.log(`Creating new email deal with ID: ${deal.id}`);
        const dealWithHash = { ...deal, contentHash };
        const storedDeal = await storage.createEmailDeal(dealWithHash);
        console.log(`Stored deal with final ID: ${storedDeal.id}`);
        storedDeals.push(storedDeal);
      } else {
        console.log(`Skipping duplicate deal: ${deal.id}`);
      }
    }
    
    console.log(`Successfully stored ${storedDeals.length} new email deals`);

    const response: EmailMonitoringResponse = {
      success: true,
      data: storedDeals
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error syncing emails:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to sync emails: ${errorMessage}` },
      { status: 500 }
    );
  }
}

