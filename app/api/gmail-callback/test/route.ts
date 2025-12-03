import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint to verify the callback route is accessible
 * Call this from your browser or curl to verify the route works
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Gmail callback route is accessible!",
    timestamp: new Date().toISOString(),
    url: request.url,
    host: request.headers.get('host'),
    protocol: request.headers.get('x-forwarded-proto') || 'https',
    expectedCallbackUrl: `https://${request.headers.get('host') || 'comfortfinder.projcomfort.com'}/api/gmail-callback`,
  });
}

