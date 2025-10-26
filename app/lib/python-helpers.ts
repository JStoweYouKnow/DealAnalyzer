import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import type { AnalyzePropertyResponse } from "../../shared/schema";

export async function runPythonAnalysis(
  emailContent: string,
  strMetrics?: { adr?: number; occupancyRate?: number; monthlyRent?: number },
  monthlyExpenses?: any
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
        monthly_rent: strMetrics.monthlyRent, // Calculated monthly income from ADR and occupancy
      } : null,
      monthly_expenses: monthlyExpenses || null,
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

export async function runPythonFileAnalysis(
  filePath: string,
  fileExtension: string,
  strMetrics?: { adr?: number; occupancyRate?: number; monthlyRent?: number },
  monthlyExpenses?: any
): Promise<AnalyzePropertyResponse> {
  return new Promise((resolve) => {
    const pythonPath = path.join(process.cwd(), "python_modules");
    const tempDataFile = path.join(pythonPath, `temp_data_${Date.now()}.json`);
    
    const additionalData = {
      str_metrics: strMetrics ? {
        adr: strMetrics.adr,
        occupancy_rate: strMetrics.occupancyRate,
        monthly_rent: strMetrics.monthlyRent, // Calculated monthly income from ADR and occupancy
      } : null,
      monthly_expenses: monthlyExpenses || null,
    };
    fs.writeFileSync(tempDataFile, JSON.stringify(additionalData));
    
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

