import type { Express } from "express";
import { createServer, type Server } from "http";
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
  
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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
