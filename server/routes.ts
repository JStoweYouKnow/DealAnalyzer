import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { 
  analyzePropertyRequestSchema, 
  updateCriteriaRequestSchema,
  type AnalyzePropertyResponse,
  type CriteriaResponse,
  type ConfigurableCriteria,
  type EmailMonitoringResponse,
  insertNeighborhoodTrendSchema,
  insertComparableSaleSchema,
  insertMarketHeatMapDataSchema,
  insertSavedFilterSchema,
  insertNaturalLanguageSearchSchema,
  insertPropertyClassificationSchema,
  insertSmartPropertyRecommendationSchema,
  insertRentPricingRecommendationSchema,
  insertInvestmentTimingAdviceSchema,
  insertAnalysisTemplateSchema,
  type NeighborhoodTrend,
  type ComparableSale,
  type MarketHeatMapData,
  type SavedFilter,
  type NaturalLanguageSearch,
  type PropertyClassification,
  type SmartPropertyRecommendation,
  type RentPricingRecommendation,
  type InvestmentTimingAdvice,
  type AnalysisTemplate,
  type Property,
  excelExportRequestSchema,
  csvExportRequestSchema,
  type ExcelExportRequest,
  type CsvExportRequest,
  type ImportResult,
  insertApiIntegrationSchema,
  type ApiIntegration,
  type InsertApiIntegration
} from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { generateReport, type ReportOptions, type ReportData } from "./report-generator";
import { aiAnalysisService as coreAiService } from "./ai-service";
import { emailMonitoringService } from "./email-service";
import { rentalCompsService } from "./rental-comps-service";
import { importExportService } from "./import-export-service";
import { apiIntegrationService } from "./api-integration-service";
import { aiAnalysisService as photoAnalysisService } from "./services/ai-analysis-service";
import { geocodingService } from "./services/geocoding-service";
import { rentCastAPI } from "./services/rentcast-api";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configure multer for file uploads
  const upload = multer({
    dest: 'temp_uploads/',
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow CSV, Excel, and PDF files for property analysis
      const allowedTypes = ['.csv', '.xlsx', '.xls', '.pdf'];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      
      if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only CSV, Excel, and PDF files are allowed for property analysis.'));
      }
    },
  });
  
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Update property data and re-analyze (optimized for smaller payloads)
  app.post("/api/update-property", async (req, res) => {
    try {
      // Extract only essential data to reduce payload size
      const { property, dealId } = req.body;
      
      if (!property) {
        res.status(400).json({
          success: false,
          error: "Property data is required"
        });
        return;
      }

      // Validate essential fields only
      if (property.monthlyRent && property.monthlyRent < 0) {
        res.status(400).json({
          success: false,
          error: "Monthly rent cannot be negative"
        });
        return;
      }

      if (property.adr && property.adr < 0) {
        res.status(400).json({
          success: false,
          error: "ADR cannot be negative"
        });
        return;
      }

      if (property.purchasePrice && property.purchasePrice <= 0) {
        res.status(400).json({
          success: false,
          error: "Purchase price must be positive"
        });
        return;
      }

      // Create minimal property object for analysis (exclude large fields like email content)
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
      
      const analysisResult = await runPythonPropertyUpdate(analysisProperty);
      
      if (!analysisResult.success) {
        res.status(400).json({
          success: false,
          error: analysisResult.error || "Re-analysis failed"
        });
        return;
      }

      // Run AI analysis if available for updated property
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
        // Provide fallback AI analysis based on financial metrics
        try {
          const fallbackAiAnalysis = {
            propertyAssessment: {
              overallScore: analysisResult.data!.meetsCriteria ? 7 : 4,
              strengths: analysisResult.data!.meetsCriteria ? [
                "Meets investment criteria",
                "Positive cash flow potential"
              ] : [],
              redFlags: analysisResult.data!.meetsCriteria ? [] : [
                analysisResult.data!.property.monthlyRent < analysisResult.data!.property.purchasePrice * 0.01 ? "Does not meet 1% rule" : "",
                analysisResult.data!.cashFlow < 0 ? "Negative cash flow" : ""
              ].filter(Boolean),
              description: "Analysis completed using financial metrics and investment criteria",
              marketPosition: analysisResult.data!.meetsCriteria ? "Favorable" : "Requires review"
            },
            marketIntelligence: {
              sentimentScore: analysisResult.data!.meetsCriteria ? 0.6 : -0.2,
              riskLevel: (analysisResult.data!.meetsCriteria ? 'low' : 'medium') as 'low' | 'medium' | 'high',
              marketTrends: [`1% rule ${analysisResult.data!.property.monthlyRent >= analysisResult.data!.property.purchasePrice * 0.01 ? 'passes' : 'fails'}`],
              competitiveAnalysis: "Basic financial metrics analysis completed"
            },
            investmentRecommendation: {
              recommendation: (analysisResult.data!.meetsCriteria ? 'buy' : 'hold') as 'strong_buy' | 'buy' | 'hold' | 'avoid',
              confidence: analysisResult.data!.meetsCriteria ? 0.7 : 0.4,
              reasoning: [
                `Property ${analysisResult.data!.meetsCriteria ? 'meets' : 'does not meet'} investment criteria`,
                `Cash flow is ${analysisResult.data!.cashFlow >= 0 ? 'positive' : 'negative'}`
              ],
              suggestedStrategy: analysisResult.data!.meetsCriteria ? "Long-term hold for cash flow" : "Review and reassess",
              timeHorizon: "5-10 years"
            },
            predictiveAnalysis: {
              appreciationForecast: 3.5, // Conservative 3.5% annual appreciation
              rentGrowthForecast: 2.5, // Conservative 2.5% annual rent growth
              exitStrategy: "Hold for cash flow, potential future sale",
              keyRisks: analysisResult.data!.meetsCriteria ? ["Market downturn", "Interest rate changes"] : ["Poor cash flow", "Market downturn", "High maintenance costs"]
            }
          };
          
          analysisWithAI = {
            ...analysisResult.data!,
            aiAnalysis: fallbackAiAnalysis
          };
        } catch (fallbackError) {
          console.warn("Fallback AI analysis also failed:", fallbackError);
        }
      }

      // Try to find existing analysis by property address and update it
      let storedAnalysis: any;
      
      if (property.address) {
        const existingAnalysis = await storage.findAnalysisByPropertyAddress(property.address as string);
        
        if (existingAnalysis?.id) {
          // Update existing analysis to maintain the same ID for report generation
          storedAnalysis = await storage.updateDealAnalysis(existingAnalysis.id, analysisWithAI);
        } else {
          // Create new analysis if none exists
          storedAnalysis = await storage.createDealAnalysis(analysisWithAI);
        }
      } else {
        // Create new analysis if no address
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

      const response: AnalyzePropertyResponse = {
        success: true,
        data: storedAnalysis
      };

      res.json(response);
    } catch (error) {
      console.error("Error in update-property endpoint:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during property update"
      });
    }
  });

  // Legacy endpoint for backwards compatibility
  app.post("/api/update-rent", async (req, res) => {
    // Redirect to the new update-property endpoint
    req.url = "/api/update-property";
    return app._router.handle(req, res);
  });

  // Get investment criteria
  app.get("/api/criteria", async (req, res) => {
    try {
      const criteria = await loadInvestmentCriteria();
      res.json(criteria);
    } catch (error) {
      console.error("Error loading criteria:", error);
      res.status(500).json({ error: "Failed to load investment criteria" });
    }
  });

  // Update investment criteria
  app.put("/api/criteria", async (req, res) => {
    try {
      const validation = updateCriteriaRequestSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ 
          success: false, 
          error: "Invalid criteria: " + validation.error.errors.map((e: any) => e.message).join(", ")
        });
        return;
      }

      const { criteria } = validation.data;
      
      // Update criteria in Python backend
      const result = await updateInvestmentCriteria(criteria);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error || "Failed to update criteria"
        });
        return;
      }

      // Return updated criteria
      const updatedCriteria = await loadInvestmentCriteria();
      res.json({
        success: true,
        data: updatedCriteria
      });
    } catch (error) {
      console.error("Error updating criteria:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during criteria update"
      });
    }
  });

  // Analyze property from email content
  app.post("/api/analyze", async (req, res) => {
    try {
      const validation = analyzePropertyRequestSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ 
          success: false, 
          error: "Invalid request: " + validation.error.errors.map(e => e.message).join(", ")
        });
        return;
      }

      const { emailContent, strMetrics, monthlyExpenses } = validation.data;
      
      // Run Python analysis with additional data
      const analysisResult = await runPythonAnalysis(emailContent, strMetrics, monthlyExpenses);
      
      if (!analysisResult.success) {
        res.status(400).json({
          success: false,
          error: analysisResult.error || "Analysis failed"
        });
        return;
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
        console.warn("AI analysis failed, continuing without AI insights:", error);
      }

      // Store the analysis in memory
      const storedAnalysis = await storage.createDealAnalysis(analysisWithAI);

      const response: AnalyzePropertyResponse = {
        success: true,
        data: storedAnalysis
      };

      res.json(response);
    } catch (error) {
      console.error("Error in analyze endpoint:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during analysis"
      });
    }
  });

  // Analyze property from uploaded file
  app.post("/api/analyze-file", (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        // Handle specific multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: "File is too large. Maximum file size is 50MB. Please try with a smaller file."
          });
        }
        if (err.message.includes('Invalid file type')) {
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        // Handle other multer errors
        return res.status(400).json({
          success: false,
          error: `File upload error: ${err.message}`
        });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No file uploaded"
        });
        return;
      }

      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      // Parse additional form data
      let strMetrics, monthlyExpenses;
      try {
        if (req.body.strMetrics) {
          strMetrics = JSON.parse(req.body.strMetrics);
        }
        if (req.body.monthlyExpenses) {
          monthlyExpenses = JSON.parse(req.body.monthlyExpenses);
        }
      } catch (e) {
        console.warn("Failed to parse form data:", e);
      }

      // Run Python file analysis
      const analysisResult = await runPythonFileAnalysis(filePath, fileExtension, strMetrics, monthlyExpenses);
      
      // Clean up uploaded file
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn("Failed to clean up uploaded file:", e);
      }
      
      if (!analysisResult.success) {
        res.status(400).json({
          success: false,
          error: analysisResult.error || "File analysis failed"
        });
        return;
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
        console.warn("AI analysis failed, continuing without AI insights:", error);
      }

      // Store the analysis in memory
      const storedAnalysis = await storage.createDealAnalysis(analysisWithAI);

      const response: AnalyzePropertyResponse = {
        success: true,
        data: storedAnalysis
      };

      res.json(response);
    } catch (error) {
      console.error("Error in analyze-file endpoint:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during file analysis"
      });
    }
  });

  // Get analysis history
  app.get("/api/history", async (req, res) => {
    try {
      const history = await storage.getAnalysisHistory();
      res.json(history);
    } catch (error) {
      console.error("Error getting history:", error);
      res.status(500).json({ error: "Failed to get analysis history" });
    }
  });

  // Generate report endpoint
  app.post("/api/generate-report", async (req, res) => {
    try {
      const { analysisIds, format, title, includeComparison } = req.body;
      
      if (!analysisIds || !Array.isArray(analysisIds) || analysisIds.length === 0) {
        res.status(400).json({
          success: false,
          error: "Analysis IDs are required"
        });
        return;
      }

      if (!format || !['pdf', 'csv'].includes(format)) {
        res.status(400).json({
          success: false,
          error: "Valid format (pdf or csv) is required"
        });
        return;
      }

      // Get analyses from storage
      const analyses: any[] = [];
      for (const id of analysisIds) {
        const analysis = await storage.getDealAnalysis(id);
        if (analysis) {
          analyses.push(analysis);
        }
      }

      if (analyses.length === 0) {
        res.status(404).json({
          success: false,
          error: "No analyses found for the provided IDs"
        });
        return;
      }

      const reportData: ReportData = {
        analyses
      };

      const options: ReportOptions = {
        format: format as 'pdf' | 'csv',
        title: title || `Property Analysis Report`,
        includeComparison
      };

      // Generate the report
      const result = await generateReport(reportData, options);

      // Send file as download
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'text/csv');
      
      const fileStream = fs.createReadStream(result.filePath);
      fileStream.pipe(res);
      
      // Clean up file after sending
      fileStream.on('end', () => {
        fs.unlink(result.filePath, (err) => {
          if (err) console.warn('Failed to clean up report file:', err);
        });
      });

    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate report"
      });
    }
  });

  // Gmail OAuth URL endpoint
  app.get("/api/gmail-auth-url", async (req, res) => {
    try {
      const authUrl = emailMonitoringService.getAuthUrl();
      console.log("Generated auth URL:", authUrl);
      console.log("Redirect URI in use:", process.env.GMAIL_REDIRECT_URI);
      res.json({
        success: true,
        authUrl
      });
    } catch (error) {
      console.error("Error getting Gmail auth URL:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get Gmail authorization URL"
      });
    }
  });

  // Gmail OAuth callback endpoint
  app.get("/api/gmail-callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        res.status(400).json({
          success: false,
          error: "Authorization code is required"
        });
        return;
      }

      const tokens = await emailMonitoringService.getTokens(code);
      
      // Store tokens in session (in production, store securely)
      req.session.gmailTokens = {
        access_token: tokens.access_token || '',
        refresh_token: tokens.refresh_token || '',
        scope: tokens.scope || '',
        token_type: tokens.token_type || 'Bearer',
        expiry_date: tokens.expiry_date || undefined
      };
      
      // Redirect to deals page
      res.redirect('/deals');
    } catch (error) {
      console.error("Error in Gmail callback:", error);
      res.status(500).json({
        success: false,
        error: "Failed to complete Gmail authorization"
      });
    }
  });

  // Sync emails endpoint
  app.post("/api/sync-emails", async (req, res) => {
    try {
      // Check if user has Gmail tokens
      if (!req.session.gmailTokens) {
        res.status(401).json({
          success: false,
          error: "Gmail not connected. Please connect your Gmail account first."
        });
        return;
      }

      // Set credentials for email service
      await emailMonitoringService.setCredentials(
        req.session.gmailTokens.access_token,
        req.session.gmailTokens.refresh_token
      );

      // Search for real estate emails
      const emailDeals = await emailMonitoringService.searchRealEstateEmails();
      
      // Store new deals in storage, checking for duplicates
      const storedDeals = [];
      for (const deal of emailDeals) {
        // Check if deal already exists by ID
        const existingDeal = await storage.getEmailDeal(deal.id);
        
        // Generate content hash for duplicate detection
        const contentHash = emailMonitoringService.generateContentHash(deal.subject, deal.sender, deal.emailContent);
        const duplicateByHash = await storage.findEmailDealByContentHash(contentHash);
        
        if (!existingDeal && !duplicateByHash) {
          const dealWithHash = { ...deal, contentHash };
          const storedDeal = await storage.createEmailDeal(dealWithHash);
          storedDeals.push(storedDeal);
        }
      }

      const response: EmailMonitoringResponse = {
        success: true,
        data: storedDeals
      };

      res.json(response);
    } catch (error) {
      console.error("Error syncing emails:", error);
      res.status(500).json({
        success: false,
        error: "Failed to sync emails"
      });
    }
  });

  // Get email deals endpoint
  app.get("/api/email-deals", async (req, res) => {
    try {
      const emailDeals = await storage.getEmailDeals();
      res.json(emailDeals);
    } catch (error) {
      console.error("Error getting email deals:", error);
      res.status(500).json({ error: "Failed to get email deals" });
    }
  });

  // ========================================
  // Market Intelligence API Routes
  // ========================================

  // Get neighborhood trends
  app.get("/api/market/neighborhood-trends", async (req, res) => {
    try {
      const { city, state, live } = req.query;
      let trends;
      
      // Try to get live data first if requested
      if (live === 'true' && city && state) {
        try {
          trends = await rentCastAPI.getNeighborhoodTrends(city as string, state as string);
          if (trends.length === 0) {
            // Fall back to stored data if API returns no results
            trends = await storage.getNeighborhoodTrends(city as string, state as string);
          }
        } catch (apiError) {
          console.warn("RentCast API failed, falling back to stored data:", apiError);
          trends = await storage.getNeighborhoodTrends(city as string, state as string);
        }
      } else {
        // Use stored data by default
        trends = await storage.getNeighborhoodTrends(
          city as string | undefined, 
          state as string | undefined
        );
      }
      
      res.json({ success: true, data: trends });
    } catch (error) {
      console.error("Error fetching neighborhood trends:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch neighborhood trends"
      });
    }
  });

  // Get comparable sales
  app.get("/api/market/comparable-sales", async (req, res) => {
    try {
      const { address, radius, live } = req.query;
      if (!address) {
        res.status(400).json({
          success: false,
          error: "Address is required"
        });
        return;
      }
      
      let sales;
      
      // Try to get live data first if requested
      if (live === 'true') {
        try {
          sales = await rentCastAPI.getComparableSales(
            address as string, 
            radius ? Number(radius) : 1
          );
          if (sales.length === 0) {
            // Fall back to stored data if API returns no results
            sales = await storage.getComparableSales(
              address as string, 
              radius ? Number(radius) : undefined
            );
          }
        } catch (apiError) {
          console.warn("RentCast API failed, falling back to stored data:", apiError);
          sales = await storage.getComparableSales(
            address as string, 
            radius ? Number(radius) : undefined
          );
        }
      } else {
        // Use stored data by default
        sales = await storage.getComparableSales(
          address as string, 
          radius ? Number(radius) : undefined
        );
      }
      
      res.json({ success: true, data: sales });
    } catch (error) {
      console.error("Error fetching comparable sales:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch comparable sales"
      });
    }
  });

  // Get market heat map data
  app.get("/api/market/heat-map", async (req, res) => {
    try {
      const { north, south, east, west, live } = req.query;
      const bounds = (north && south && east && west) ? {
        north: Number(north),
        south: Number(south),
        east: Number(east),
        west: Number(west)
      } : undefined;
      
      let heatMapData;
      
      // Try to get live data first if requested
      if (live === 'true') {
        try {
          // Get popular zip codes for live data
          const popularZipCodes = ['90210', '78701', '33139', '10001', '94110', '37203', '85001', '30309', '80202', '02101'];
          heatMapData = await rentCastAPI.getMarketHeatMapData(popularZipCodes);
          if (heatMapData.length === 0) {
            // Fall back to stored data if API returns no results
            heatMapData = await storage.getMarketHeatMapData(bounds);
          }
        } catch (apiError) {
          console.warn("RentCast API failed, falling back to stored data:", apiError);
          heatMapData = await storage.getMarketHeatMapData(bounds);
        }
      } else {
        // Use stored data by default
        heatMapData = await storage.getMarketHeatMapData(bounds);
      }
      res.json({ success: true, data: heatMapData });
    } catch (error) {
      console.error("Error fetching heat map data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch heat map data"
      });
    }
  });

  // Create neighborhood trend data
  app.post("/api/market/neighborhood-trends", async (req, res) => {
    try {
      const validated = insertNeighborhoodTrendSchema.parse(req.body);
      const trend = await storage.createNeighborhoodTrend(validated);
      res.json({ success: true, data: trend });
    } catch (error) {
      console.error("Error creating neighborhood trend:", error);
      res.status(400).json({
        success: false,
        error: "Failed to create neighborhood trend"
      });
    }
  });

  // Create comparable sale data
  app.post("/api/market/comparable-sales", async (req, res) => {
    try {
      const validated = insertComparableSaleSchema.parse(req.body);
      const sale = await storage.createComparableSale(validated);
      res.json({ success: true, data: sale });
    } catch (error) {
      console.error("Error creating comparable sale:", error);
      res.status(400).json({
        success: false,
        error: "Failed to create comparable sale"
      });
    }
  });

  // ========================================
  // Advanced Filtering & Search API Routes
  // ========================================

  // Get saved filters
  app.get("/api/filters", async (req, res) => {
    try {
      const filters = await storage.getSavedFilters();
      res.json({ success: true, data: filters });
    } catch (error) {
      console.error("Error fetching saved filters:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch saved filters"
      });
    }
  });

  // Create saved filter
  app.post("/api/filters", async (req, res) => {
    try {
      const validated = insertSavedFilterSchema.parse(req.body);
      const filter = await storage.createSavedFilter(validated);
      res.json({ success: true, data: filter });
    } catch (error) {
      console.error("Error creating saved filter:", error);
      res.status(400).json({
        success: false,
        error: "Failed to create saved filter"
      });
    }
  });

  // Update saved filter
  app.put("/api/filters/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertSavedFilterSchema.partial().parse(req.body);
      const filter = await storage.updateSavedFilter(id, updates);
      
      if (!filter) {
        res.status(404).json({
          success: false,
          error: "Filter not found"
        });
        return;
      }
      
      res.json({ success: true, data: filter });
    } catch (error) {
      console.error("Error updating saved filter:", error);
      res.status(400).json({
        success: false,
        error: "Failed to update saved filter"
      });
    }
  });

  // Delete saved filter
  app.delete("/api/filters/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSavedFilter(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "Filter not found"
        });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting saved filter:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete saved filter"
      });
    }
  });

  // Use saved filter (increment usage and search)
  app.post("/api/filters/:id/use", async (req, res) => {
    try {
      const { id } = req.params;
      const filter = await storage.getSavedFilter(id);
      
      if (!filter) {
        res.status(404).json({
          success: false,
          error: "Filter not found"
        });
        return;
      }
      
      // Increment usage count
      await storage.incrementFilterUsage(id);
      
      // Search properties using filter criteria
      const results = await storage.searchProperties(filter.filterCriteria);
      
      res.json({ 
        success: true, 
        data: {
          filter,
          results
        }
      });
    } catch (error) {
      console.error("Error using saved filter:", error);
      res.status(500).json({
        success: false,
        error: "Failed to use saved filter"
      });
    }
  });

  // Natural language search
  app.post("/api/search/natural-language", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: "Search query is required"
        });
        return;
      }
      
      const searchResult = await storage.searchNaturalLanguage(query);
      const properties = await storage.searchProperties(searchResult.parsedCriteria);
      
      res.json({ 
        success: true, 
        data: {
          search: searchResult,
          results: properties
        }
      });
    } catch (error) {
      console.error("Error performing natural language search:", error);
      res.status(500).json({
        success: false,
        error: "Failed to perform search"
      });
    }
  });

  // Get search history
  app.get("/api/search/history", async (req, res) => {
    try {
      const history = await storage.getSearchHistory();
      res.json({ success: true, data: history });
    } catch (error) {
      console.error("Error fetching search history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch search history"
      });
    }
  });

  // Advanced property search with filters
  app.post("/api/search/properties", async (req, res) => {
    try {
      const filters = req.body;
      const results = await storage.searchProperties(filters);
      res.json({ success: true, data: results });
    } catch (error) {
      console.error("Error searching properties:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search properties"
      });
    }
  });

  // ========================================
  // Property Classification API Routes
  // ========================================

  // Get property classification
  app.get("/api/properties/:id/classification", async (req, res) => {
    try {
      const { id } = req.params;
      const classification = await storage.getPropertyClassification(id);
      
      if (!classification) {
        res.status(404).json({
          success: false,
          error: "Property classification not found"
        });
        return;
      }
      
      res.json({ success: true, data: classification });
    } catch (error) {
      console.error("Error fetching property classification:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch property classification"
      });
    }
  });

  // Create or update property classification
  app.post("/api/properties/:id/classification", async (req, res) => {
    try {
      const { id } = req.params;
      const classificationData = {
        ...req.body,
        propertyId: id
      };
      
      const validated = insertPropertyClassificationSchema.parse(classificationData);
      
      // Check if classification already exists
      const existing = await storage.getPropertyClassification(id);
      let classification;
      
      if (existing) {
        classification = await storage.updatePropertyClassification(id, validated);
      } else {
        classification = await storage.createPropertyClassification(validated);
      }
      
      res.json({ success: true, data: classification });
    } catch (error) {
      console.error("Error creating/updating property classification:", error);
      res.status(400).json({
        success: false,
        error: "Failed to create/update property classification"
      });
    }
  });

  // AI-Powered Smart Recommendations endpoints
  
  // Get smart property recommendations for a property
  app.get("/api/properties/:id/recommendations", async (req, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getProperty(id);
      
      if (!property) {
        res.status(404).json({
          success: false,
          error: "Property not found"
        });
        return;
      }
      
      // Get available properties to compare against (excluding the source property)
      const allAnalyses = await storage.getAnalysisHistory();
      const availableProperties: Property[] = [];
      
      for (const analysis of allAnalyses) {
        if (analysis.property && analysis.property.id !== id) {
          availableProperties.push(analysis.property);
        }
      }
      
      const recommendations = await coreAiService.generateSmartPropertyRecommendations(
        property, 
        availableProperties
      );
      
      // Store recommendations in database
      for (const rec of recommendations) {
        await storage.createSmartPropertyRecommendation(rec);
      }
      
      res.json({ success: true, data: recommendations });
    } catch (error) {
      console.error("Error generating smart recommendations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate smart recommendations"
      });
    }
  });

  // Get rent pricing recommendation for a property
  app.get("/api/properties/:id/rent-pricing", async (req, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getProperty(id);
      
      if (!property) {
        res.status(404).json({
          success: false,
          error: "Property not found"
        });
        return;
      }
      
      // Check for existing valid recommendation
      let recommendation = await storage.getRentPricingRecommendation(id);
      
      if (!recommendation) {
        // Generate new recommendation
        const marketData = {
          medianRent: property.monthlyRent * 1.08, // Placeholder market data
          competitorRents: [
            property.monthlyRent * 0.92,
            property.monthlyRent * 1.05,
            property.monthlyRent * 1.12
          ]
        };
        
        recommendation = await coreAiService.generateRentPricingRecommendation(property, marketData);
        await storage.createRentPricingRecommendation(recommendation);
      }
      
      res.json({ success: true, data: recommendation });
    } catch (error) {
      console.error("Error generating rent pricing recommendation:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate rent pricing recommendation"
      });
    }
  });

  // Get investment timing advice for a property
  app.get("/api/properties/:id/timing-advice", async (req, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getProperty(id);
      
      if (!property) {
        res.status(404).json({
          success: false,
          error: "Property not found"
        });
        return;
      }
      
      // Check for existing valid advice
      let advice = await storage.getInvestmentTimingAdvice(id);
      
      if (!advice) {
        // Generate new advice
        const marketConditions = {
          interestRates: 6.5, // Current market rates
          marketPhase: "expansion"
        };
        
        advice = await coreAiService.generateInvestmentTimingAdvice(property, marketConditions);
        await storage.createInvestmentTimingAdvice(advice);
      }
      
      res.json({ success: true, data: advice });
    } catch (error) {
      console.error("Error generating investment timing advice:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate investment timing advice"
      });
    }
  });

  // Analysis Templates & Presets endpoints
  
  // Get all analysis templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAnalysisTemplates();
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch analysis templates"
      });
    }
  });

  // Get specific analysis template
  app.get("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getAnalysisTemplate(id);
      
      if (!template) {
        res.status(404).json({
          success: false,
          error: "Template not found"
        });
        return;
      }
      
      res.json({ success: true, data: template });
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch template"
      });
    }
  });

  // Create new analysis template
  app.post("/api/templates", async (req, res) => {
    try {
      const validated = insertAnalysisTemplateSchema.parse(req.body);
      const template = await storage.createAnalysisTemplate(validated);
      
      res.json({ success: true, data: template });
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(400).json({
        success: false,
        error: "Failed to create analysis template"
      });
    }
  });

  // Update analysis template
  app.put("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertAnalysisTemplateSchema.partial().parse(req.body);
      const template = await storage.updateAnalysisTemplate(id, updates);
      
      if (!template) {
        res.status(404).json({
          success: false,
          error: "Template not found"
        });
        return;
      }
      
      res.json({ success: true, data: template });
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(400).json({
        success: false,
        error: "Failed to update template"
      });
    }
  });

  // Delete analysis template
  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteAnalysisTemplate(id);
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: "Template not found"
        });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete template"
      });
    }
  });

  // Get default templates
  app.get("/api/templates/defaults", async (req, res) => {
    try {
      const templates = await storage.getDefaultTemplates();
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error("Error fetching default templates:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch default templates"
      });
    }
  });

  // Import/Export & BiggerPockets Integration endpoints
  
  // Import properties from BiggerPockets format (CSV/Excel)
  app.post("/api/import/biggerpockets", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No file uploaded"
        });
        return;
      }
      
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const fileType = fileExtension === '.xlsx' || fileExtension === '.xls' ? 'xlsx' : 'csv';
      
      const result = await importExportService.importFromBiggerPockets(req.file.path, fileType);
      
      // Clean up uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting uploaded file:", err);
      });
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error importing BiggerPockets data:", error);
      
      // Clean up uploaded file on error too
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting uploaded file on error:", err);
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to import BiggerPockets data"
      });
    }
  });

  // Export properties to Excel
  app.post("/api/export/excel", async (req, res) => {
    try {
      const validated = excelExportRequestSchema.parse(req.body);
      const buffer = await importExportService.exportToExcel(validated);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="property-analysis.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      res.status(500).json({
        success: false,
        error: "Failed to export to Excel"
      });
    }
  });

  // Export properties to CSV
  app.post("/api/export/csv", async (req, res) => {
    try {
      const validated = csvExportRequestSchema.parse(req.body);
      const csvData = await importExportService.exportToCsv(validated);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="property-analysis.csv"');
      res.send(csvData);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      res.status(500).json({
        success: false,
        error: "Failed to export to CSV"
      });
    }
  });

  // Download BiggerPockets import template
  app.get("/api/templates/biggerpockets", async (req, res) => {
    try {
      const buffer = importExportService.generateBiggerPocketsTemplate();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="biggerpockets-import-template.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error("Error generating BiggerPockets template:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate BiggerPockets template"
      });
    }
  });

  // API Integration endpoints
  
  // Create new API integration
  app.post("/api/integrations", async (req, res) => {
    try {
      const validated = insertApiIntegrationSchema.parse(req.body);
      const integration = await apiIntegrationService.createIntegration(validated);
      
      res.json({ success: true, data: integration });
    } catch (error) {
      console.error("Error creating API integration:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create API integration"
      });
    }
  });

  // Get user's API integrations
  app.get("/api/integrations", async (req, res) => {
    try {
      const userId = "default"; // In real app, get from auth
      const integrations = await apiIntegrationService.getUserIntegrations(userId);
      
      res.json({ success: true, data: integrations });
    } catch (error) {
      console.error("Error fetching API integrations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch API integrations"
      });
    }
  });

  // Get specific API integration
  app.get("/api/integrations/:id", async (req, res) => {
    try {
      const integration = await apiIntegrationService.getIntegration(req.params.id);
      
      if (!integration) {
        res.status(404).json({
          success: false,
          error: "API integration not found"
        });
        return;
      }
      
      res.json({ success: true, data: integration });
    } catch (error) {
      console.error("Error fetching API integration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch API integration"
      });
    }
  });

  // Update API integration
  app.put("/api/integrations/:id", async (req, res) => {
    try {
      const updates = req.body;
      const integration = await apiIntegrationService.updateIntegration(req.params.id, updates);
      
      if (!integration) {
        res.status(404).json({
          success: false,
          error: "API integration not found"
        });
        return;
      }
      
      res.json({ success: true, data: integration });
    } catch (error) {
      console.error("Error updating API integration:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to update API integration"
      });
    }
  });

  // Delete API integration
  app.delete("/api/integrations/:id", async (req, res) => {
    try {
      const deleted = await apiIntegrationService.deleteIntegration(req.params.id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "API integration not found"
        });
        return;
      }
      
      res.json({ success: true, message: "API integration deleted successfully" });
    } catch (error) {
      console.error("Error deleting API integration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete API integration"
      });
    }
  });

  // Test API integration connection
  app.post("/api/integrations/:id/test", async (req, res) => {
    try {
      const result = await apiIntegrationService.testIntegration(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error testing API integration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to test API integration"
      });
    }
  });

  // Sync data from API integration
  app.post("/api/integrations/:id/sync", async (req, res) => {
    try {
      const result = await apiIntegrationService.syncIntegrationData(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error syncing API integration data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to sync API integration data"
      });
    }
  });

  // Send data to API integration
  app.post("/api/integrations/:id/send", async (req, res) => {
    try {
      const { data: sendData, endpoint } = req.body;
      const result = await apiIntegrationService.sendData(req.params.id, sendData, endpoint);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error sending data to API integration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send data to API integration"
      });
    }
  });

  // Update email deal status
  app.put("/api/email-deals/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['new', 'reviewed', 'analyzed', 'archived'].includes(status)) {
        res.status(400).json({
          success: false,
          error: "Valid status is required (new, reviewed, analyzed, archived)"
        });
        return;
      }

      const updatedDeal = await storage.updateEmailDeal(id, { status });
      
      if (!updatedDeal) {
        res.status(404).json({
          success: false,
          error: "Email deal not found"
        });
        return;
      }

      res.json({
        success: true,
        data: updatedDeal
      });
    } catch (error) {
      console.error("Error updating email deal status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update deal status"
      });
    }
  });

  // Update email deal with new extractedProperty data
  app.put("/api/email-deals/:id", async (req, res) => {
    try {
      const dealId = req.params.id;
      const { extractedProperty } = req.body;

      if (!dealId) {
        res.status(400).json({
          success: false,
          error: "Deal ID is required"
        });
        return;
      }

      const updatedDeal = await storage.updateEmailDeal(dealId, { extractedProperty });
      
      res.json({
        success: true,
        data: updatedDeal
      });
    } catch (error) {
      console.error("Error updating email deal:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update email deal"
      });
    }
  });

  // Analyze email deal endpoint
  app.post("/api/analyze-email-deal", async (req, res) => {
    try {
      const { dealId, emailContent } = req.body;
      
      if (!dealId || !emailContent) {
        res.status(400).json({
          success: false,
          error: "Deal ID and email content are required"
        });
        return;
      }

      // Get the email deal
      const emailDeal = await storage.getEmailDeal(dealId);
      if (!emailDeal) {
        res.status(404).json({
          success: false,
          error: "Email deal not found"
        });
        return;
      }

      // Run Python analysis on the email content
      const analysisResult = await runPythonAnalysis(emailContent);
      
      if (!analysisResult.success) {
        res.status(400).json({
          success: false,
          error: analysisResult.error || "Analysis failed"
        });
        return;
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
        console.warn("AI analysis failed, continuing without AI insights:", error);
      }

      // Store the analysis
      const storedAnalysis = await storage.createDealAnalysis(analysisWithAI);

      // Update the email deal with the analysis
      await storage.updateEmailDeal(dealId, { 
        analysis: storedAnalysis,
        status: 'analyzed'
      });

      const response: AnalyzePropertyResponse = {
        success: true,
        data: storedAnalysis
      };

      res.json(response);
    } catch (error) {
      console.error("Error analyzing email deal:", error);
      res.status(500).json({
        success: false,
        error: "Failed to analyze email deal"
      });
    }
  });

  // Get rental comparables for a property
  app.post("/api/rental-comps", async (req, res) => {
    try {
      const { address, bedrooms, bathrooms, squareFootage } = req.body;
      
      if (!address || !bedrooms || !bathrooms) {
        res.status(400).json({
          success: false,
          error: "Address, bedrooms, and bathrooms are required"
        });
        return;
      }
      
      console.log(`Searching rental comps for: ${address}, ${bedrooms}BR/${bathrooms}BA`);
      
      const compsResult = await rentalCompsService.searchRentalComps(
        address,
        bedrooms,
        bathrooms,
        squareFootage
      );
      
      res.json({
        success: true,
        data: compsResult
      });
      
    } catch (error) {
      console.error("Error fetching rental comps:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch rental comparables"
      });
    }
  });

  // ========================================
  // Photo Analysis Routes
  // ========================================

  // Configure multer for image uploads
  const imageUpload = multer({
    dest: 'temp_uploads/photos/',
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit per image
      files: 10, // Max 10 files
    },
    fileFilter: (req, file, cb) => {
      // Accept common image formats
      const allowedMimes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'image/gif'
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
      }
    }
  });

  // Analyze property photos with AI
  app.post("/api/analyze-property-photos", imageUpload.array('photos', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { propertyId, propertyType, propertyDescription } = req.body;
      
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: "No photos provided"
        });
        return;
      }

      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: "Property ID is required"
        });
        return;
      }

      const analyses = [];
      
      for (const file of files) {
        try {
          // Read file and convert to base64
          const imageBuffer = fs.readFileSync(file.path);
          const base64Image = imageBuffer.toString('base64');
          const mimeType = file.mimetype;
          
          // Analyze with OpenAI Vision
          const analysis = await photoAnalysisService.analyzePropertyPhoto({
            image: `data:${mimeType};base64,${base64Image}`,
            filename: file.originalname,
            propertyType: propertyType || 'unknown',
            propertyDescription: propertyDescription
          });
          
          // Store photo analysis
          const photoAnalysis = await storage.createPhotoAnalysis({
            propertyId: propertyId,
            filename: file.originalname,
            url: `/uploads/${file.filename}`,
            ...analysis,
            analysisDate: new Date().toISOString()
          });
          
          analyses.push(photoAnalysis);
          
          // Clean up uploaded file
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error(`Error analyzing photo ${file.originalname}:`, error);
          // Clean up uploaded file on error
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
      
      res.json({ success: true, data: analyses });
    } catch (error) {
      console.error("Error analyzing property photos:", error);
      res.status(500).json({
        success: false,
        error: "Failed to analyze property photos"
      });
    }
  });

  // Get photo analyses for a property
  app.get("/api/properties/:id/photo-analyses", async (req, res) => {
    try {
      const { id } = req.params;
      const analyses = await storage.getPhotoAnalyses(id);
      res.json({ success: true, data: analyses });
    } catch (error) {
      console.error("Error fetching photo analyses:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch photo analyses"
      });
    }
  });

  // Delete photo analysis
  app.delete("/api/properties/:propertyId/photo-analyses/:photoId", async (req, res) => {
    try {
      const { photoId } = req.params;
      const deleted = await storage.deletePhotoAnalysis(photoId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "Photo analysis not found"
        });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting photo analysis:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete photo analysis"
      });
    }
  });

  // ========================================
  // Geocoding Routes
  // ========================================

  // Geocode an address to coordinates
  app.post("/api/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address || typeof address !== 'string') {
        res.status(400).json({
          success: false,
          error: "Address is required"
        });
        return;
      }

      const result = await geocodingService.geocodeAddress(address);
      
      if (!result) {
        res.status(404).json({
          success: false,
          error: "Could not geocode address"
        });
        return;
      }

      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error geocoding address:", error);
      res.status(500).json({
        success: false,
        error: "Failed to geocode address"
      });
    }
  });

  // Batch geocode multiple addresses
  app.post("/api/geocode/batch", async (req, res) => {
    try {
      const { addresses } = req.body;
      
      if (!addresses || !Array.isArray(addresses)) {
        res.status(400).json({
          success: false,
          error: "Addresses array is required"
        });
        return;
      }

      const results = await geocodingService.geocodeAddresses(addresses);
      res.json({ success: true, data: results });
    } catch (error) {
      console.error("Error batch geocoding addresses:", error);
      res.status(500).json({
        success: false,
        error: "Failed to geocode addresses"
      });
    }
  });

  // Get Airbnb data (ADR and occupancy) for a property
  app.post("/api/airbnb-data", async (req, res) => {
    try {
      const { address, bedrooms, bathrooms, squareFootage } = req.body;
      
      if (!address || !bedrooms || !bathrooms) {
        res.status(400).json({
          success: false,
          error: "Address, bedrooms, and bathrooms are required"
        });
        return;
      }
      
      console.log(`Searching Airbnb data for: ${address}, ${bedrooms}BR/${bathrooms}BA`);
      
      const airbnbResult = await rentalCompsService.searchAirbnbData(
        address,
        bedrooms,
        bathrooms,
        squareFootage
      );
      
      res.json({
        success: true,
        data: airbnbResult
      });
      
    } catch (error) {
      console.error("Error fetching Airbnb data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch Airbnb data"
      });
    }
  });

  // Update email deal with Airbnb data
  app.post("/api/update-email-deal-airbnb", async (req, res) => {
    try {
      const { dealId, averageDailyRate, occupancyRate } = req.body;
      
      if (!dealId) {
        res.status(400).json({
          success: false,
          error: "Deal ID is required"
        });
        return;
      }
      
      // Get the email deal
      const emailDeal = await storage.getEmailDeal(dealId);
      if (!emailDeal) {
        res.status(404).json({
          success: false,
          error: "Email deal not found"
        });
        return;
      }
      
      // Update the extractedProperty with Airbnb data
      const updatedExtractedProperty = {
        ...emailDeal.extractedProperty,
        adr: averageDailyRate,
        occupancyRate: occupancyRate
      };
      
      // Update the email deal
      await storage.updateEmailDeal(dealId, { 
        extractedProperty: updatedExtractedProperty
      });
      
      res.json({
        success: true,
        data: {
          dealId,
          adr: averageDailyRate,
          occupancyRate: occupancyRate
        }
      });
      
    } catch (error) {
      console.error("Error updating email deal with Airbnb data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update email deal with Airbnb data"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to run Python analysis
async function runPythonPropertyUpdate(
  property: any
): Promise<AnalyzePropertyResponse> {
  return new Promise((resolve) => {
    const pythonPath = path.join(process.cwd(), "python_modules");
    const tempDataFile = path.join(pythonPath, `temp_property_${Date.now()}.json`);
    
    // Write property data to JSON file for Python to process
    const propertyData = {
      property: {
        address: property.address || "",
        city: property.city || "",
        state: property.state || "",
        zip_code: property.zipCode || "00000", // Default zip code if not provided
        property_type: property.propertyType || "single-family",
        purchase_price: property.purchasePrice || property.price || 0,
        monthly_rent: property.monthlyRent || 0, // This is the updated value
        adr: property.adr || 0, // Average Daily Rate for STR
        occupancy_rate: property.occupancyRate || 0, // Occupancy rate for STR
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
      path.join(pythonPath, "main.py"),
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
      // Clean up temp files
      try {
        fs.unlinkSync(tempDataFile);
      } catch (e) {
        console.warn("Failed to clean up temp files:", e);
      }

      if (code !== 0) {
        console.error("Python property update failed:", stderr);
        console.error("Python stdout:", stdout);
        resolve({
          success: false,
          error: "Python analysis failed: " + stderr
        });
        return;
      }

      try {
        console.log("Python update output:", stdout);
        const result = JSON.parse(stdout);
        console.log("Parsed Python result:", JSON.stringify(result, null, 2));
        resolve({
          success: true,
          data: result
        });
      } catch (e) {
        console.error("Failed to parse Python output:", e);
        console.error("Raw Python output:", stdout);
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
}

async function runPythonAnalysis(
  emailContent: string, 
  strMetrics?: { adr?: number; occupancyRate?: number }, 
  monthlyExpenses?: { propertyTaxes?: number; insurance?: number; utilities?: number; management?: number; maintenance?: number; cleaning?: number; supplies?: number; other?: number }
): Promise<AnalyzePropertyResponse> {
  return new Promise((resolve) => {
    const pythonPath = path.join(process.cwd(), "python_modules");
    const tempFile = path.join(pythonPath, `temp_email_${Date.now()}.txt`);
    const tempDataFile = path.join(pythonPath, `temp_data_${Date.now()}.json`);
    
    // Write email content to temporary file
    fs.writeFileSync(tempFile, emailContent);
    
    // Write additional data to JSON file
    const additionalData = {
      str_metrics: strMetrics ? {
        adr: strMetrics.adr,
        occupancy_rate: strMetrics.occupancyRate,
      } : null,
      monthly_expenses: monthlyExpenses ? {
        property_taxes: monthlyExpenses.propertyTaxes,
        insurance: monthlyExpenses.insurance,
        utilities: monthlyExpenses.utilities,
        management: monthlyExpenses.management,
        maintenance: monthlyExpenses.maintenance,
        cleaning: monthlyExpenses.cleaning,
        supplies: monthlyExpenses.supplies,
        other: monthlyExpenses.other,
      } : null,
    };
    fs.writeFileSync(tempDataFile, JSON.stringify(additionalData));
    
    const python = spawn("python3", [
      path.join(pythonPath, "main.py"),
      tempFile,
      "--json",
      "--data-file",
      tempDataFile
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
      // Clean up temp files
      try {
        fs.unlinkSync(tempFile);
        fs.unlinkSync(tempDataFile);
      } catch (e) {
        console.warn("Failed to clean up temp files:", e);
      }

      if (code !== 0) {
        console.error("Python analysis failed:", stderr);
        resolve({
          success: false,
          error: "Python analysis failed: " + stderr
        });
        return;
      }

      try {
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
}

// Helper function to run Python file analysis
async function runPythonFileAnalysis(
  filePath: string,
  fileExtension: string, 
  strMetrics?: { adr?: number; occupancyRate?: number }, 
  monthlyExpenses?: { propertyTaxes?: number; insurance?: number; utilities?: number; management?: number; maintenance?: number; cleaning?: number; supplies?: number; other?: number }
): Promise<AnalyzePropertyResponse> {
  return new Promise((resolve) => {
    const pythonPath = path.join(process.cwd(), "python_modules");
    const tempDataFile = path.join(pythonPath, `temp_data_${Date.now()}.json`);
    
    // Write additional data to JSON file
    const additionalData = {
      str_metrics: strMetrics ? {
        adr: strMetrics.adr,
        occupancy_rate: strMetrics.occupancyRate,
      } : null,
      monthly_expenses: monthlyExpenses ? {
        property_taxes: monthlyExpenses.propertyTaxes,
        insurance: monthlyExpenses.insurance,
        utilities: monthlyExpenses.utilities,
        management: monthlyExpenses.management,
        maintenance: monthlyExpenses.maintenance,
        cleaning: monthlyExpenses.cleaning,
        supplies: monthlyExpenses.supplies,
        other: monthlyExpenses.other,
      } : null,
    };
    fs.writeFileSync(tempDataFile, JSON.stringify(additionalData));
    
    // Convert to absolute path since Python script runs from different directory
    const absoluteFilePath = path.resolve(filePath);
    
    const python = spawn("python3", [
      path.join(pythonPath, "file_analysis.py"),
      absoluteFilePath,
      fileExtension,
      "--json",
      "--data-file",
      tempDataFile
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
      // Clean up temp file
      try {
        fs.unlinkSync(tempDataFile);
      } catch (e) {
        console.warn("Failed to clean up temp data file:", e);
      }

      if (code !== 0) {
        console.error("Python file analysis failed:", stderr);
        resolve({
          success: false,
          error: "File analysis failed: " + stderr
        });
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve({
          success: true,
          data: result
        });
      } catch (e) {
        console.error("Failed to parse Python output:", e);
        resolve({
          success: false,
          error: "Failed to parse file analysis results"
        });
      }
    });

    python.on("error", (error) => {
      console.error("Failed to start Python process:", error);
      resolve({
        success: false,
        error: "Failed to start file analysis process"
      });
    });
  });
}

// Helper function to load investment criteria
async function loadInvestmentCriteria(): Promise<CriteriaResponse> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.cwd(), "python_modules");
    
    const python = spawn("python3", ["-c", `
import sys
sys.path.append('${pythonPath}')
from criteria_manager import load_investment_criteria
import json

criteria = load_investment_criteria('${path.join(pythonPath, 'investment_criteria.md')}')
print(json.dumps(criteria))
`]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("Failed to load criteria: " + stderr));
        return;
      }

      try {
        const criteria = JSON.parse(stdout);
        resolve(criteria);
      } catch (e) {
        reject(new Error("Failed to parse criteria"));
      }
    });
  });
}

// Helper function to update investment criteria
async function updateInvestmentCriteria(criteria: ConfigurableCriteria): Promise<{success: boolean, error?: string}> {
  return new Promise((resolve) => {
    const pythonPath = path.join(process.cwd(), "python_modules");
    
    const python = spawn("python3", ["-c", `
import sys
sys.path.append('${pythonPath}')
from criteria_manager import update_investment_criteria
import json

criteria_data = {
    'price_min': ${criteria.price_min},
    'price_max': ${criteria.price_max},
    'coc_return_min': ${criteria.coc_return_min / 100},
    'coc_return_max': ${criteria.coc_return_max / 100},
    'cap_rate_min': ${criteria.cap_rate_min / 100},
    'cap_rate_max': ${criteria.cap_rate_max / 100}
}

result = update_investment_criteria('${path.join(pythonPath, 'investment_criteria.md')}', criteria_data)
print(json.dumps(result))
`]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          error: "Failed to update criteria: " + stderr
        });
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        resolve({
          success: false,
          error: "Failed to parse update result"
        });
      }
    });
  });
}
