import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { storage } from "../../../server/storage";
import { parseEmailContent, analyzeProperty } from "../../lib/property-analyzer";
import { loadInvestmentCriteria } from "../../../server/services/criteria-service";
import { FUNDING_SOURCE_DOWN_PAYMENTS } from "@dealanalyzer/types";
import { withRateLimit, expensiveRateLimit } from "../../lib/rate-limit";

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

export async function POST(request: NextRequest) {
  return withRateLimit(request, expensiveRateLimit, async (req) => {
  const startTime = Date.now();
  console.log("=".repeat(80));
  console.log("[Next.js POST /api/analyze-email-deal] 🚀 Analysis request received");
  console.log("[Next.js POST /api/analyze-email-deal] Timestamp:", new Date().toISOString());
  
  try {
    const userId = await getUserId(req);
    console.log("[Next.js POST /api/analyze-email-deal] User ID:", userId?.substring(0, 8) + '...');

    if (!userId) {
      console.error("[Next.js POST /api/analyze-email-deal] ❌ Unauthorized - no user ID");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { dealId, emailContent, fundingSource, mortgageValues, monthlyExpenses } = body;
    
    console.log("[Next.js POST /api/analyze-email-deal] Request body received");
    console.log("[Next.js POST /api/analyze-email-deal] Deal ID:", dealId);
    console.log("[Next.js POST /api/analyze-email-deal] Email content present:", !!emailContent);
    console.log("[Next.js POST /api/analyze-email-deal] Email content length:", emailContent?.length || 0);
    
    if (!dealId || !emailContent) {
      console.error("[Next.js POST /api/analyze-email-deal] ❌ Missing required fields");
      console.error("[Next.js POST /api/analyze-email-deal] dealId:", dealId);
      console.error("[Next.js POST /api/analyze-email-deal] emailContent:", !!emailContent);
      return NextResponse.json(
        { success: false, error: "Deal ID and email content are required" },
        { status: 400 }
      );
    }

    // Get the email deal
    console.log(`[Next.js POST /api/analyze-email-deal] 📥 Looking for email deal with ID: ${dealId}`);
    console.log(`[Next.js POST /api/analyze-email-deal] User ID: ${userId?.substring(0, 8)}...`);
    console.log(`[Next.js POST /api/analyze-email-deal] Deal ID format: ${dealId.startsWith('k') ? 'Convex ID' : 'Gmail ID (hex)'}`);
    console.log(`[Next.js POST /api/analyze-email-deal] Deal ID length: ${dealId.length}`);
    
    let emailDeal = await storage.getEmailDeal(dealId, userId);
    
    // If not found, try to find it by searching through all user's deals
    // This handles cases where the ID format might be different than expected
    if (!emailDeal) {
      console.warn(`[Next.js POST /api/analyze-email-deal] ⚠️ Direct lookup failed, trying fallback search...`);
      try {
        const allUserDeals = await storage.getEmailDeals(userId);
        console.log(`[Next.js POST /api/analyze-email-deal] Found ${allUserDeals.length} deals for user`);
        console.log(`[Next.js POST /api/analyze-email-deal] Searching for deal ID: ${dealId}`);
        console.log(`[Next.js POST /api/analyze-email-deal] Deal ID type: ${typeof dealId}`);
        console.log(`[Next.js POST /api/analyze-email-deal] Deal ID length: ${dealId?.length}`);
        
        // PRIMARY METHOD: Use indexOf first since we know the deal is in the list
        const dealIds = allUserDeals.map(d => d.id);
        const indexInList = dealIds.indexOf(dealId);
        console.log(`[Next.js POST /api/analyze-email-deal] PRIMARY - indexOf check, result: ${indexInList}`);
        
        if (indexInList >= 0) {
          console.log(`[Next.js POST /api/analyze-email-deal] ✅ PRIMARY SUCCESS - Found deal at index ${indexInList} using indexOf!`);
          emailDeal = allUserDeals[indexInList];
          console.log(`[Next.js POST /api/analyze-email-deal] Deal retrieved via indexOf: ${emailDeal.id}`);
        } else {
          console.log(`[Next.js POST /api/analyze-email-deal] ❌ PRIMARY FAILED - indexOf returned -1`);
          // Fallback: Try with string conversion
          const stringIndex = dealIds.map(String).indexOf(String(dealId));
          console.log(`[Next.js POST /api/analyze-email-deal] FALLBACK - string indexOf check, result: ${stringIndex}`);
          if (stringIndex >= 0) {
            console.log(`[Next.js POST /api/analyze-email-deal] ✅ FALLBACK SUCCESS - Found via string conversion indexOf at index ${stringIndex}`);
            emailDeal = allUserDeals[stringIndex];
          } else {
            // Last resort: Try all comparison methods
            console.log(`[Next.js POST /api/analyze-email-deal] FALLBACK FAILED - Trying all comparison methods`);
            
            // Method 1: Try exact match
            emailDeal = allUserDeals.find(d => d.id === dealId);
            if (emailDeal) {
              console.log(`[Next.js POST /api/analyze-email-deal] ✅ Found via exact match!`);
            }
            
            // Method 2: Try string conversion match
            if (!emailDeal) {
              emailDeal = allUserDeals.find(d => String(d.id) === String(dealId));
              if (emailDeal) {
                console.log(`[Next.js POST /api/analyze-email-deal] ✅ Found via string conversion!`);
              }
            }
            
            // Method 3: Try trimmed match
            if (!emailDeal) {
              emailDeal = allUserDeals.find(d => d.id?.trim() === dealId?.trim());
              if (emailDeal) {
                console.log(`[Next.js POST /api/analyze-email-deal] ✅ Found via trimmed match!`);
              }
            }
            
            // Method 4: Explicit loop with detailed logging
            if (!emailDeal) {
              console.log(`[Next.js POST /api/analyze-email-deal] Methods 1-3 failed, trying explicit loop`);
              for (let i = 0; i < allUserDeals.length; i++) {
                const d = allUserDeals[i];
                const exactMatch = d.id === dealId;
                const stringMatch = String(d.id) === String(dealId);
                const trimMatch = d.id?.trim() === dealId?.trim();
                
                if (exactMatch || stringMatch || trimMatch) {
                  console.log(`[Next.js POST /api/analyze-email-deal] ✅ MATCH FOUND at index ${i}`, {
                    dealId: d.id,
                    searchId: dealId,
                    exactMatch,
                    stringMatch,
                    trimMatch,
                  });
                  emailDeal = d;
                  break;
                }
                
                // Log first 3 deals for debugging
                if (i < 3) {
                  console.log(`[Next.js POST /api/analyze-email-deal] Deal ${i}:`, {
                    id: d.id,
                    idType: typeof d.id,
                    matches: exactMatch || stringMatch || trimMatch,
                  });
                }
              }
            }
          }
        }

        // Method 5: LAST RESORT - use indexOf (will definitely find it if it exists)
        if (!emailDeal) {
          const indexInList = dealIds.indexOf(dealId);
          console.log(`[Next.js POST /api/analyze-email-deal] 🔍 LAST RESORT - indexOf result: ${indexInList}`);
          console.log(`[Next.js POST /api/analyze-email-deal] 🔍 Deal ID being searched: "${dealId}"`);
          console.log(`[Next.js POST /api/analyze-email-deal] 🔍 First deal ID in list: "${dealIds[0]}"`);
          console.log(`[Next.js POST /api/analyze-email-deal] 🔍 Deal at index 2: "${dealIds[2]}"`);
          
          if (indexInList >= 0) {
            console.log(`[Next.js POST /api/analyze-email-deal] 🚨 LAST RESORT - Found deal at index ${indexInList} using indexOf!`);
            emailDeal = allUserDeals[indexInList];
            console.log(`[Next.js POST /api/analyze-email-deal] 🚨 Deal retrieved: ${emailDeal.id}`);
          } else {
            console.error(`[Next.js POST /api/analyze-email-deal] 🚨 LAST RESORT FAILED - Deal ID not found even with indexOf!`);
            console.error(`[Next.js POST /api/analyze-email-deal] 🚨 This should not happen if the deal is in the list!`);
            // Try one more time with explicit comparison
            for (let i = 0; i < dealIds.length; i++) {
              if (dealIds[i] === dealId) {
                console.error(`[Next.js POST /api/analyze-email-deal] 🚨 FOUND IT! Deal is at index ${i} but indexOf failed!`);
                emailDeal = allUserDeals[i];
                break;
              }
            }
          }
        }
        
        if (emailDeal) {
          console.log(`[Next.js POST /api/analyze-email-deal] ✅✅✅ SUCCESS - Found deal via fallback search!`);
          console.log(`[Next.js POST /api/analyze-email-deal] Found deal ID: ${emailDeal.id}`);
          console.log(`[Next.js POST /api/analyze-email-deal] Found deal subject: ${emailDeal.subject?.substring(0, 50)}`);
        } else {
          // Log available deal IDs for debugging
          console.error(`[Next.js POST /api/analyze-email-deal] ❌❌❌ CRITICAL ERROR - Deal not found in fallback search!`);
          console.error(`[Next.js POST /api/analyze-email-deal] Searching for: "${dealId}"`);
          console.error(`[Next.js POST /api/analyze-email-deal] Deal ID type: ${typeof dealId}`);
          console.error(`[Next.js POST /api/analyze-email-deal] Deal ID length: ${dealId?.length}`);
          console.error(`[Next.js POST /api/analyze-email-deal] Available deal IDs (first 10):`, 
            allUserDeals.slice(0, 10).map((d, idx) => ({
              index: idx,
              id: d.id,
              idType: typeof d.id,
              idLength: d.id?.length,
              searchId: dealId,
              searchIdType: typeof dealId,
              exactMatch: d.id === dealId,
              stringMatch: String(d.id) === String(dealId),
              trimMatch: d.id?.trim() === dealId?.trim(),
              indexOfMatch: dealIds.indexOf(dealId),
              charByChar: d.id.split('').map((c: string, i: number) => ({ char: c, match: c === dealId[i] })).slice(0, 10),
            }))
          );
        }
      } catch (fallbackErr: any) {
        console.error('[Next.js POST /api/analyze-email-deal] Fallback search failed:', {
          error: fallbackErr?.message || String(fallbackErr),
          stack: fallbackErr?.stack,
        });
      }
    } else {
      console.log(`[Next.js POST /api/analyze-email-deal] ✅ Deal found via direct lookup`);
    }
    
    if (!emailDeal) {
      console.error(`[Next.js POST /api/analyze-email-deal] ❌ Email deal not found for ID: ${dealId}`);
      console.error(`[Next.js POST /api/analyze-email-deal] User ID used: ${userId?.substring(0, 8)}...`);
      
      // Final attempt: log all deals to help debug
      try {
        const allDeals = await storage.getEmailDeals(userId);
        console.error(`[Next.js POST /api/analyze-email-deal] Total deals for user: ${allDeals.length}`);
        if (allDeals.length > 0) {
          console.error(`[Next.js POST /api/analyze-email-deal] All deal IDs:`, 
            allDeals.map(d => d.id)
          );
          // Check if the deal ID exists but with different casing or whitespace
          const exactMatch = allDeals.find(d => d.id === dealId);
          const caseInsensitiveMatch = allDeals.find(d => d.id.toLowerCase() === dealId.toLowerCase());
          const trimmedMatch = allDeals.find(d => d.id.trim() === dealId.trim());
          
          if (exactMatch) {
            console.error(`[Next.js POST /api/analyze-email-deal] ⚠️ Deal exists with exact match but lookup failed!`);
            console.error(`[Next.js POST /api/analyze-email-deal] This suggests a bug in getEmailDeal lookup`);
          } else if (caseInsensitiveMatch) {
            console.error(`[Next.js POST /api/analyze-email-deal] ⚠️ Deal exists but with different casing: ${caseInsensitiveMatch.id}`);
          } else if (trimmedMatch) {
            console.error(`[Next.js POST /api/analyze-email-deal] ⚠️ Deal exists but with whitespace: ${trimmedMatch.id}`);
          }
        }
      } catch (err: any) {
        console.error('[Next.js POST /api/analyze-email-deal] Error fetching deals list:', {
          error: err?.message || String(err),
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Email deal not found with ID: ${dealId}`,
          suggestion: "Please refresh the deals list and try again. The deal may have been deleted, the ID may be incorrect, or it may belong to a different account."
        },
        { status: 404 }
      );
    }
    console.log(`[Next.js POST /api/analyze-email-deal] ✅ Found email deal: ${emailDeal.id}`);
    console.log(`[Next.js POST /api/analyze-email-deal] Email deal has emailContent: ${!!emailDeal.emailContent}`);
    console.log(`[Next.js POST /api/analyze-email-deal] Email deal emailContent length: ${emailDeal.emailContent?.length || 0}`);

    // Parse and analyze the email content using TypeScript
    const propertyData = parseEmailContent(emailContent);
    
    // Merge extracted property data from emailDeal
    if (emailDeal.extractedProperty) {
      Object.assign(propertyData, emailDeal.extractedProperty);
    }
    
    // Ensure purchasePrice is set in propertyData (extractedProperty may have 'price' instead of 'purchasePrice')
    // This handles the case where extractedProperty has 'price' but analyzeProperty expects 'purchasePrice'
    const purchasePrice = propertyData.purchase_price || propertyData.purchasePrice || emailDeal.extractedProperty?.price || 0;
    if (purchasePrice > 0) {
      propertyData.purchasePrice = purchasePrice;
      propertyData.purchase_price = purchasePrice;
    }
    
    // Prepare STR metrics if available
    // Convert occupancy rate from percentage (0-100) to decimal (0-1) if needed
    let occupancyRate = emailDeal.extractedProperty?.occupancyRate;
    if (occupancyRate !== undefined && occupancyRate > 1) {
      // If it's stored as percentage (e.g., 74), convert to decimal (0.74)
      occupancyRate = occupancyRate / 100;
    }
    
    const strMetrics = emailDeal.extractedProperty?.adr || occupancyRate
      ? {
          adr: emailDeal.extractedProperty?.adr,
          occupancyRate: occupancyRate,
          monthlyRent: emailDeal.extractedProperty?.monthlyRent
        }
      : undefined;
    
    // Use funding source to determine down payment percentage (same logic as in analyzeProperty)
    // Use fundingSource from request, or default to 'conventional'
    let propertyFundingSource = fundingSource || 'conventional';
    // Validate that propertyFundingSource exists as a key in FUNDING_SOURCE_DOWN_PAYMENTS
    if (!Object.prototype.hasOwnProperty.call(FUNDING_SOURCE_DOWN_PAYMENTS, propertyFundingSource)) {
      propertyFundingSource = 'conventional';
    }
    
    // Use mortgage calculator values if provided, otherwise fetch mortgage rate
    // Note: mortgageRate should be passed directly as a decimal if provided
    // MortgageValues no longer includes interestRate - use monthlyPayment directly
    let mortgageRate: number | undefined;
    if (mortgageValues) {
      console.log('Using mortgage calculator values:', {
        loanAmount: mortgageValues.loanAmount,
        loanTermYears: mortgageValues.loanTermYears,
        monthlyPayment: mortgageValues.monthlyPayment
      });
      // mortgageRate will be undefined when mortgageValues is provided,
      // and analyzeProperty will use mortgageValues.monthlyPayment directly
    } else {
      // Fetch current mortgage rate (fallback to 7% on error)
      // Use the purchasePrice we extracted and set above (already defined above)
      const downpaymentPercentage = FUNDING_SOURCE_DOWN_PAYMENTS[propertyFundingSource as keyof typeof FUNDING_SOURCE_DOWN_PAYMENTS] || 0.20;
      const downpayment = purchasePrice * downpaymentPercentage;
      const loanAmount = purchasePrice - downpayment;
      
      // Fetch mortgage rate with error handling (lazy import to avoid build-time evaluation)
      try {
        const zipCode = propertyData.zip_code || propertyData.zipCode;
        if (zipCode) {
          const { getMortgageRate } = await import("../../../server/mortgage-rate-service");
          mortgageRate = await getMortgageRate({
            loan_term: 30,
            loan_amount: loanAmount,
            zip_code: zipCode,
          });
        } else {
          console.warn('No zip code found in property data, using default mortgage rate of 7%');
          mortgageRate = 0.07;
        }
      } catch (error) {
        console.error('Error fetching mortgage rate, falling back to 7%:', error);
        mortgageRate = 0.07;
      }
    }

    // Fetch current investment criteria
    const criteria = await loadInvestmentCriteria();
    
    // Run TypeScript analysis with optional mortgage values, monthly expenses, and criteria
    const analysisData = analyzeProperty(propertyData, strMetrics, monthlyExpenses, propertyFundingSource as any, mortgageRate, mortgageValues, criteria);

    // Run AI analysis if available (lazy import to avoid build-time evaluation)
    let analysisWithAI = analysisData;
    try {
      if (process.env.OPENAI_API_KEY) {
        const { aiAnalysisService: coreAiService } = await import("../../../server/ai-service");
        const aiAnalysis = await coreAiService.analyzeProperty(analysisData.property as any);
        analysisWithAI = {
          ...analysisData,
          aiAnalysis
        } as any;
      }
    } catch (error) {
      console.warn("AI analysis failed, continuing without AI insights:", error);
    }

    console.log("[Next.js POST /api/analyze-email-deal] 💾 Storing analysis in database...");
    // Store the analysis
    const storedAnalysis = await storage.createDealAnalysis(analysisWithAI as any);
    console.log("[Next.js POST /api/analyze-email-deal] ✅ Analysis stored with ID:", storedAnalysis.id);

    console.log("[Next.js POST /api/analyze-email-deal] 💾 Updating email deal with analysis...");
    // Update the email deal with the analysis
    await storage.updateEmailDeal(dealId, {
      analysis: storedAnalysis as any,
      status: 'analyzed'
    } as any, userId);
    console.log("[Next.js POST /api/analyze-email-deal] ✅ Email deal updated");

    const totalDuration = Date.now() - startTime;
    console.log("[Next.js POST /api/analyze-email-deal] ✅ Analysis complete in", totalDuration, "ms");
    console.log("[Next.js POST /api/analyze-email-deal] Response:", {
      success: true,
      hasData: !!storedAnalysis,
      dataId: storedAnalysis.id
    });
    console.log("=".repeat(80));

    return NextResponse.json({
      success: true,
      data: storedAnalysis
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error("[Next.js POST /api/analyze-email-deal] ❌ Error analyzing email deal after", totalDuration, "ms");
    console.error("[Next.js POST /api/analyze-email-deal] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[Next.js POST /api/analyze-email-deal] Error message:", errorMessage);
    console.error("[Next.js POST /api/analyze-email-deal] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    console.error("[Next.js POST /api/analyze-email-deal] Full error:", error);
    console.log("=".repeat(80));
    
    return NextResponse.json(
      { success: false, error: `Failed to analyze email deal: ${errorMessage}` },
      { status: 500 }
    );
  }
  });
}

