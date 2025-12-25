import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";
import { auth } from "@clerk/nextjs/server";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId(request);

    console.log(`[GET /api/email-deals/${id}] Request received`);
    console.log(`[GET /api/email-deals/${id}] User ID: ${userId?.substring(0, 8)}...`);
    console.log(`[GET /api/email-deals/${id}] Deal ID: ${id}`);
    console.log(`[GET /api/email-deals/${id}] Deal ID format: ${id.startsWith('k') ? 'Convex ID' : 'Gmail ID'}`);

    if (!userId) {
      console.error(`[GET /api/email-deals/${id}] ❌ Unauthorized - no user ID`);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const emailDeal = await storage.getEmailDeal(id, userId);

    if (!emailDeal) {
      console.error(`[GET /api/email-deals/${id}] ❌ Deal not found`);
      // Log available deals for debugging
      try {
        const allDeals = await storage.getEmailDeals(userId);
        console.error(`[GET /api/email-deals/${id}] Total deals for user: ${allDeals.length}`);
        if (allDeals.length > 0) {
          console.error(`[GET /api/email-deals/${id}] Available deal IDs (first 10):`, 
            allDeals.slice(0, 10).map(d => ({
              id: d.id,
              idType: d.id.startsWith('k') ? 'Convex' : 'Gmail',
              subject: d.subject?.substring(0, 30) + '...',
            }))
          );
        }
      } catch (err: any) {
        console.error(`[GET /api/email-deals/${id}] Error fetching deals list:`, err?.message);
      }
      
      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }

    console.log(`[GET /api/email-deals/${id}] ✅ Deal found: ${emailDeal.id}`);
    return NextResponse.json(emailDeal);
  } catch (error) {
    console.error(`[GET /api/email-deals/${id}] ❌ Error:`, error);
    return NextResponse.json(
      { error: "Failed to get email deal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const updates = await request.json();

    // Get existing deal to verify it exists
    const existingDeal = await storage.getEmailDeal(id, userId);
    if (!existingDeal) {
      // Debug: Let's see what email deals exist
      const allDeals = await storage.getEmailDeals(userId);
      console.log(`PUT /api/email-deals/${id} - Deal not found!`);
      console.log(`Total deals in storage: ${allDeals.length}`);
      console.log('Available email deal IDs:', allDeals.slice(0, 5).map(d => `${d.id} (${d.subject?.substring(0, 30)}...)`));

      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }

    // Update the email deal
    const updatedDeal = await storage.updateEmailDeal(id, updates, userId);

    return NextResponse.json({
      success: true,
      data: updatedDeal
    });
  } catch (error) {
    console.error("Error updating email deal:", error);
    return NextResponse.json(
      { error: "Failed to update email deal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify deal exists before deleting
    const existingDeal = await storage.getEmailDeal(id, userId);
    if (!existingDeal) {
      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }

    await storage.deleteEmailDeal(id, userId);

    return NextResponse.json({
      success: true,
      message: "Email deal deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting email deal:", error);
    return NextResponse.json(
      { error: "Failed to delete email deal" },
      { status: 500 }
    );
  }
}
