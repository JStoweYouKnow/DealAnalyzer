import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { storage } from "../../../server/storage";
import { aiAnalysisService as photoAnalysisService } from "../../../server/services/ai-analysis-service";
import fs from "fs";
import { withRateLimit, expensiveRateLimit } from "../../lib/rate-limit";

export async function POST(request: NextRequest) {
  return withRateLimit(request, expensiveRateLimit, async (req) => {
  let uploadedFiles: string[] = [];
  
  try {
    const formData = await request.formData();
    const photos = formData.getAll('photos') as File[];
    const propertyId = formData.get('propertyId') as string;
    const propertyType = formData.get('propertyType') as string;
    const propertyDescription = formData.get('propertyDescription') as string;
    
    if (!photos || photos.length === 0) {
      return NextResponse.json(
        { success: false, error: "No photos provided" },
        { status: 400 }
      );
    }

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "Property ID is required" },
        { status: 400 }
      );
    }

    const analyses = [];
    const tempDir = join(process.cwd(), 'temp_uploads', 'photos');
    
    // Ensure directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    for (const photo of photos) {
      try {
        // Save file temporarily
        const buffer = Buffer.from(await photo.arrayBuffer());
        const tempPath = join(tempDir, `${Date.now()}_${photo.name}`);
        await writeFile(tempPath, buffer);
        uploadedFiles.push(tempPath);
        
        // Read file and convert to base64
        const imageBuffer = fs.readFileSync(tempPath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = photo.type;
        
        // Analyze with OpenAI Vision
        const analysis = await photoAnalysisService.analyzePropertyPhoto({
          image: `data:${mimeType};base64,${base64Image}`,
          filename: photo.name,
          propertyType: propertyType || 'unknown',
          propertyDescription: propertyDescription
        });
        
        // Store photo analysis
        const photoAnalysis = await storage.createPhotoAnalysis({
          propertyId: propertyId,
          filename: photo.name,
          url: `/uploads/${photo.name}`,
          ...analysis,
          analysisDate: new Date().toISOString()
        });
        
        analyses.push(photoAnalysis);
        
        // Clean up uploaded file
        await unlink(tempPath);
        uploadedFiles = uploadedFiles.filter(f => f !== tempPath);
      } catch (error) {
        console.error(`Error analyzing photo ${photo.name}:`, error);
      }
    }
    
    return NextResponse.json({ success: true, data: analyses });
  } catch (error) {
    console.error("Error analyzing property photos:", error);
    
    // Clean up any remaining files
    for (const file of uploadedFiles) {
      try {
        await unlink(file);
      } catch (e) {
        console.warn('Failed to clean up file:', file);
      }
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to analyze property photos" },
      { status: 500 }
    );
  }
  });
}

