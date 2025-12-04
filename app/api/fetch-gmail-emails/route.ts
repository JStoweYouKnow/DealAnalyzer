import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { emailMonitoringService } from "../../../server/email-service";
import { logger } from "@/lib/logger";

/**
 * Manually fetch emails from Gmail
 * This endpoint triggers a one-time fetch of emails from the user's connected Gmail account
 */
export async function POST(request: NextRequest) {
  try {
    // Get userId from Clerk auth
    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized: No userId from Clerk auth");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    logger.info("Manual Gmail fetch triggered", { userId: userId.substring(0, 20) });

    // Fetch emails from Gmail
    const result = await emailMonitoringService.fetchRecentEmails(userId);

    logger.info("Gmail fetch completed", {
      userId: userId.substring(0, 20),
      emailCount: result.emailCount,
      newDeals: result.newDeals,
    });

    return NextResponse.json({
      success: true,
      message: `Fetched ${result.emailCount} emails, created ${result.newDeals} new deals`,
      emailCount: result.emailCount,
      newDeals: result.newDeals,
    });
  } catch (error: any) {
    logger.error("Error fetching Gmail emails", error instanceof Error ? error : undefined, {
      errorMessage: error.message || 'Unknown error',
    });

    // Check for specific error types
    if (error.message?.includes('not connected') || error.message?.includes('No Gmail tokens')) {
      return NextResponse.json(
        { error: "Gmail not connected. Please connect your Gmail account first." },
        { status: 400 }
      );
    }

    if (error.message?.includes('invalid_grant') || error.message?.includes('Token has been expired')) {
      return NextResponse.json(
        { error: "Gmail authorization expired. Please reconnect your Gmail account." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: `Failed to fetch emails: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'fetch-gmail-emails',
    message: 'Gmail fetch endpoint is active. Use POST to trigger a fetch.',
  });
}
