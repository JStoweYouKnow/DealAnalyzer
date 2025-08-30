import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { 
  analyzePropertyRequestSchema, 
  type AnalyzePropertyResponse,
  type CriteriaResponse 
} from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configure multer for file uploads
  const upload = multer({
    dest: 'temp_uploads/',
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
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
      const { property } = req.body;
      
      if (!property || property.monthlyRent < 0 || (property.adr && property.adr < 0)) {
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

      // Store the updated analysis
      const storedAnalysis = await storage.createDealAnalysis(analysisResult.data!);

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

      // Store the analysis in memory
      const storedAnalysis = await storage.createDealAnalysis(analysisResult.data!);

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
  app.post("/api/analyze-file", upload.single('file'), async (req, res) => {
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

      // Store the analysis in memory
      const storedAnalysis = await storage.createDealAnalysis(analysisResult.data!);

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
        address: property.address,
        city: property.city,
        state: property.state,
        zip_code: property.zipCode,
        property_type: property.propertyType,
        purchase_price: property.purchasePrice,
        monthly_rent: property.monthlyRent, // This is the updated value
        adr: property.adr, // Average Daily Rate for STR
        occupancy_rate: property.occupancyRate, // Occupancy rate for STR
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        square_footage: property.squareFootage,
        lot_size: property.lotSize,
        year_built: property.yearBuilt,
        description: property.description,
        listing_url: property.listingUrl
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
