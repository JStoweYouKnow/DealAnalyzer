import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConvexForApiRoute } from "@/lib/convex-client";

async function getConvexClientAndApi() {
  const { client, api: apiModule } = await getConvexForApiRoute('../../../..');
  return { client, api: apiModule?.api || null };
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { client, api } = await getConvexClientAndApi();

    if (!client || !api || !api.userPreferences) {
      // Return defaults if Convex is not available or userPreferences not generated yet
      return NextResponse.json({
        notifyOnNewDeals: false,
        notifyOnAnalysisComplete: false,
        notifyOnCriteriaMatch: true,
        notifyOnWeeklySummary: false,
        frequency: 'immediate',
        email: '',
      });
    }

    const preferences = await client.query(api.userPreferences.getPreferences, { userId });

    return NextResponse.json(preferences || {
      notifyOnNewDeals: false,
      notifyOnAnalysisComplete: false,
      notifyOnCriteriaMatch: true,
      notifyOnWeeklySummary: false,
      frequency: 'immediate',
      email: '',
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { client, api } = await getConvexClientAndApi();

    if (!client || !api || !api.userPreferences) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Validate and save to Convex
    const result = await client.mutation(api.userPreferences.updatePreferences, {
      userId,
      notifyOnNewDeals: body.notifyOnNewDeals,
      notifyOnAnalysisComplete: body.notifyOnAnalysisComplete,
      notifyOnCriteriaMatch: body.notifyOnCriteriaMatch,
      notifyOnWeeklySummary: body.notifyOnWeeklySummary,
      frequency: body.frequency,
      email: body.email,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}

