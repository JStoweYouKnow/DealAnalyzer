import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { join } from "path";
import fs from "fs";
import { storage } from "../../../server/storage";
import { aiAnalysisService as coreAiService } from "../../../server/ai-service";

export async function POST(request: NextRequest) {
  try {
    const { property, dealId } = await request.json();
    
    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property data is required" },
        { status: 400 }
      );
    }

    // Validate essential fields
    if (property.monthlyRent && property.monthlyRent < 0) {
      return NextResponse.json(
        { success: false, error: "Monthly rent cannot be negative" },
        { status: 400 }
      );
    }

    if (property.adr && property.adr < 0) {
      return NextResponse.json(
        { success: false, error: "ADR cannot be negative" },
        { status: 400 }
      );
    }

    if (property.purchasePrice && property.purchasePrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Purchase price must be positive" },
        { status: 400 }
      );
    }

    // Create minimal property object for analysis
    const analysisProperty = {
      address: property.address,
      purchasePrice: property.purchasePrice,
      monthlyRent: property.monthlyRent,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFootage: property.squareFootage,
      adr: property.adr,
      occupancyRate: property.occupancyRate,
      propertyType: property.propertyType
    };

    console.log("Updating property with data:", JSON.stringify(analysisProperty, null, 2));
    
    // Run Python analysis
    const analysisResult = await new Promise<{ success: boolean; data?: any; error?: string }>((resolve) => {
      const pythonPath = join(process.cwd(), "python_modules");
      const tempDataFile = join(pythonPath, `temp_property_${Date.now()}.json`);
      
      const propertyData = {
        property: {
          address: property.address || "",
          city: property.city || "",
          state: property.state || "",
          zip_code: property.zipCode || "00000",
          property_type: property.propertyType || "single-family",
          purchase_price: property.purchasePrice || property.price || 0,
          monthly_rent: property.monthlyRent || 0,
          adr: property.adr || 0,
          occupancy_rate: property.occupancyRate || 0,
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          square_footage: property.sqft || property.squareFootage || 0,
          lot_size: property.lotSize || 0,
          year_built: property.yearBuilt || 0,
          description: property.description || "",
          listing_url: property.listingUrl || ""
        }
      };
      
      fs.writeFileSync(tempDataFile, JSON.stringify(propertyData));
      
      const python = spawn("python3", [
        join(pythonPath, "main.py"),
        "--property-data",
        tempDataFile,
        "--json"
      ], {
        cwd: pythonPath
      });

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      python.on("close", (code) => {
        try {
          fs.unlinkSync(tempDataFile);
        } catch (e) {
          console.warn("Failed to clean up temp files:", e);
        }

        if (code !== 0) {
          console.error("Python property update failed:", stderr);
          resolve({
            success: false,
            error: "Python analysis failed: " + stderr
          });
          return;
        }

        try {
          console.log("Python update output:", stdout);
          const result = JSON.parse(stdout);
          resolve({
            success: true,
            data: result
          });
        } catch (e) {
          console.error("Failed to parse Python output:", e);
          resolve({
            success: false,
            error: "Failed to parse analysis results"
          });
        }
      });

      python.on("error", (error) => {
        console.error("Failed to start Python process:", error);
        resolve({
          success: false,
          error: "Failed to start analysis process"
        });
      });
    });

    if (!analysisResult.success) {
      return NextResponse.json(
        { success: false, error: analysisResult.error || "Re-analysis failed" },
        { status: 400 }
      );
    }

    // Run AI analysis if available
    let analysisWithAI = analysisResult.data!;
    try {
      if (process.env.OPENAI_API_KEY) {
        const aiAnalysis = await coreAiService.analyzeProperty(analysisResult.data!.property);
        analysisWithAI = {
          ...analysisResult.data!,
          aiAnalysis
        };
      }
    } catch (error) {
      console.warn("AI analysis failed for updated property, continuing without AI insights:", error);
    }

    // Find and update existing analysis
    let storedAnalysis: any;
    if (property.address) {
      const existingAnalysis = await storage.findAnalysisByPropertyAddress(property.address as string);
      
      if (existingAnalysis?.id) {
        storedAnalysis = await storage.updateDealAnalysis(existingAnalysis.id, analysisWithAI);
      } else {
        storedAnalysis = await storage.createDealAnalysis(analysisWithAI);
      }
    } else {
      storedAnalysis = await storage.createDealAnalysis(analysisWithAI);
    }

    // If dealId is provided, update the email deal with the new analysis
    if (dealId) {
      const emailDeal = await storage.getEmailDeal(dealId);
      if (emailDeal) {
        await storage.updateEmailDeal(dealId, {
          analysis: storedAnalysis,
          status: 'analyzed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: storedAnalysis
    });
  } catch (error) {
    console.error("Error in update-property endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during property update" },
      { status: 500 }
    );
  }
}

