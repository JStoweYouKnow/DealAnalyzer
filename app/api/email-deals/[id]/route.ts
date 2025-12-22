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

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const emailDeal = await storage.getEmailDeal(id);

    if (!emailDeal) {
      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(emailDeal);
  } catch (error) {
    console.error("Error getting email deal:", error);
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
    const existingDeal = await storage.getEmailDeal(id);
    if (!existingDeal) {
      // Debug: Let's see what email deals exist
      const allDeals = await storage.getEmailDeals();
      console.log(`PUT /api/email-deals/${id} - Deal not found!`);
      console.log(`Total deals in storage: ${allDeals.length}`);
      console.log('Available email deal IDs:', allDeals.slice(0, 5).map(d => `${d.id} (${d.subject?.substring(0, 30)}...)`));

      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }

    // Update the email deal
    const updatedDeal = await storage.updateEmailDeal(id, updates);

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
    const existingDeal = await storage.getEmailDeal(id);
    if (!existingDeal) {
      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }

    await storage.deleteEmailDeal(id);

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
