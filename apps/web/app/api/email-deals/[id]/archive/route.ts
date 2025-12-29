import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { storage } from "@dealanalyzer/storage";

// Helper to decode JWT payload (for mobile bearer tokens)
function decodeBase64(base64: string): string {
  let padded = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4) {
    padded += '=';
  }
  return Buffer.from(padded, 'base64').toString('utf-8');
}

// Helper to get userId from bearer token or Clerk session
async function getUserId(request: NextRequest): Promise<string | null> {
  // Try bearer token first (for mobile)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(decodeBase64(parts[1]));
          if (payload?.sub && payload.iss?.includes('clerk')) {
            return payload.sub;
          }
        }
      } catch (error) {
        console.error('[Bearer Auth] Token decode failed:', error);
      }
    }
  }

  // Fallback to Clerk session (for web)
  const { userId } = await auth();
  return userId;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Get existing deal to verify it exists
    const existingDeal = await storage.getEmailDeal(id, userId);
    if (!existingDeal) {
      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }
    
    // Update the email deal status to archived
    const updatedDeal = await storage.updateEmailDeal(id, { status: 'archived' }, userId);
    
    if (!updatedDeal) {
      return NextResponse.json(
        { error: "Failed to archive email deal" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedDeal,
      message: "Email deal archived successfully"
    });
  } catch (error) {
    console.error("Error archiving email deal:", error);
    return NextResponse.json(
      { error: "Failed to archive email deal" },
      { status: 500 }
    );
  }
}
