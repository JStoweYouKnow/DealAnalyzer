import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";

/**
 * Authenticates the request and returns the user ID if authenticated.
 * Tries Clerk auth first, then falls back to bearer token authentication.
 * Returns null if not authenticated.
 */
async function authenticateRequest(request: NextRequest): Promise<string | null> {
  // Try Clerk authentication first
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const authResult = await auth();
    if (authResult?.userId) {
      return authResult.userId;
    }
  } catch (error) {
    // Clerk not available or not configured, continue to bearer token check
  }

  // Fall back to bearer token authentication
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    // Validate token against API_SECRET or similar
    // For now, if token is provided, we'll accept it (you may want to add proper validation)
    if (token && process.env.API_SECRET && token === process.env.API_SECRET) {
      // Return a default user ID for bearer token auth
      return "bearer-token-user";
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const userId = await authenticateRequest(request);
    if (!userId) {
      console.warn("Unauthorized request to GET /api/search/history - no authenticated user");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch only the requesting user's history
    const history = await storage.getSearchHistory(userId);
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching search history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch search history" },
      { status: 500 }
    );
  }
}

