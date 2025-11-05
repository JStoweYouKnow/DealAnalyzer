import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "../../../server/storage";
import { insertAnalysisTemplateSchema } from "@shared/schema";

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
    const templates = await storage.getAnalysisTemplates();
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analysis templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Authenticate the request first, before parsing body
  const userId = await authenticateRequest(request);
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validated = insertAnalysisTemplateSchema.parse(body);
    const template = await storage.createAnalysisTemplate(validated);
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("Error creating template:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        },
        { status: 400 }
      );
    }
    
    // Handle all other errors
    return NextResponse.json(
      { success: false, error: "Failed to create analysis template" },
      { status: 500 }
    );
  }
}

