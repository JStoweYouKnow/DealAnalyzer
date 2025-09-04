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
  type EmailMonitoringResponse
} from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { generateReport, type ReportOptions, type ReportData } from "./report-generator";
import { aiAnalysisService } from "./ai-service";
import { emailMonitoringService } from "./email-service";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configure multer for file uploads
  const upload = multer({
    dest: 'temp_uploads/',
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit (increased from 10MB)
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['.pdf', '.csv', '.txt', '.xlsx', '.xls'];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      
      if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, CSV, TXT, and Excel files are allowed.'));
      }
    },
  });
  
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Update property data and re-analyze
  app.post("/api/update-property", async (req, res) => {
    try {
      const { property, dealId } = req.body;
      
      if (!property || (property.monthlyRent && property.monthlyRent < 0) || (property.adr && property.adr < 0)) {
        res.status(400).json({
          success: false,
          error: "Invalid property data"
        });
        return;
      }

      // Convert property back to analysis format by running Python analysis
      // We'll serialize the property data and pass it to Python for re-analysis
      const propertyData = JSON.stringify(property);
      const analysisResult = await runPythonPropertyUpdate(property);
      
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
          const aiAnalysis = await aiAnalysisService.analyzeProperty(analysisResult.data!.property);
          analysisWithAI = {
            ...analysisResult.data!,
            aiAnalysis
          };
        }
      } catch (error) {
        console.warn("AI analysis failed for updated property, continuing without AI insights:", error);
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
          const aiAnalysis = await aiAnalysisService.analyzeProperty(analysisResult.data!.property);
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
          const aiAnalysis = await aiAnalysisService.analyzeProperty(analysisResult.data!.property);
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
        expiry_date: tokens.expiry_date
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
          const aiAnalysis = await aiAnalysisService.analyzeProperty(analysisResult.data!.property);
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
        square_footage: property.squareFootage || property.sqft || 0,
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
