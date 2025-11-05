import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    
    const { query } = body;
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: "Search query is required" },
        { status: 400 }
      );
    }
    
    const searchResult = await storage.searchNaturalLanguage(query);
    const properties = await storage.searchProperties(searchResult.parsedCriteria);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        search: searchResult,
        results: properties
      }
    });
  } catch (error) {
    console.error("Error performing natural language search:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

