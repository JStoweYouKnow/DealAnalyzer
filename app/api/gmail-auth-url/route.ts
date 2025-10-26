import { NextResponse } from "next/server";
import { emailMonitoringService } from "../../../server/email-service";

export async function GET() {
  try {
    const authUrl = emailMonitoringService.getAuthUrl();
    console.log("Generated auth URL:", authUrl);
    console.log("Redirect URI in use:", process.env.GMAIL_REDIRECT_URI);
    
    return NextResponse.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error("Error getting Gmail auth URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get Gmail authorization URL" },
      { status: 500 }
    );
  }
}

