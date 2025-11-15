import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

async function getConvexClient() {
  const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!CONVEX_URL) {
    return null;
  }

  try {
    const { ConvexHttpClient } = await import('convex/browser');
    const client = new ConvexHttpClient(CONVEX_URL);
    return client;
  } catch (error) {
    console.error('Failed to initialize Convex client:', error);
    return null;
  }
}

async function getConvexApi() {
  try {
    const apiModule = await import('../../../../convex/_generated/api');
    return apiModule.api;
  } catch (error) {
    console.error('Failed to import Convex API:', error);
    return null;
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getConvexClient();
    const api = await getConvexApi();

    if (!client || !api) {
      // Return defaults if Convex is not available
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

    const client = await getConvexClient();
    const api = await getConvexApi();

    if (!client || !api) {
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

