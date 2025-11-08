import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';
import type { DealAnalysis, PropertyComparison } from '@shared/schema';
import { aiAnalysisService } from './ai-service';
import type { Browser } from 'puppeteer-core';

export interface ReportOptions {
  format: 'pdf' | 'csv';
  title: string;
  includeComparison?: boolean;
}

export interface ReportData {
  analyses: DealAnalysis[];
  comparison?: PropertyComparison;
}

export async function generateReport(data: ReportData, options: ReportOptions): Promise<{ filePath: string; fileName: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFileName = `${options.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
  
  if (options.format === 'pdf') {
    try {
      return await generatePDFReport(data, options, baseFileName);
    } catch (error) {
      console.warn('PDF generation failed, falling back to CSV:', error);
      // Fallback to CSV if PDF fails
      return generateCSVReport(data, options, baseFileName.replace('.pdf', '.csv'));
    }
  } else {
    return generateCSVReport(data, options, baseFileName);
  }
}

// New function that returns buffer instead of file path (for Vercel)
export async function generateReportBuffer(data: ReportData, options: ReportOptions): Promise<{ buffer: Buffer; fileName: string; contentType: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFileName = `${options.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
  
  if (options.format === 'pdf') {
    const htmlContent = generateHTMLReport(data, options);
    const pdfBuffer = await makePDF(htmlContent);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Failed to generate PDF: buffer is empty or null');
    }
    
    // Validate PDF buffer has correct header
    const pdfHeader = pdfBuffer.slice(0, 4).toString('ascii');
    if (pdfHeader !== '%PDF') {
      console.error('Invalid PDF buffer generated, header:', pdfHeader, 'buffer length:', pdfBuffer.length);
      throw new Error(`Invalid PDF buffer: expected '%PDF' header but got '${pdfHeader}'`);
    }
    
    return {
      buffer: pdfBuffer,
      fileName: `${baseFileName}.pdf`,
      contentType: 'application/pdf'
    };
  } else {
    const csvBuffer = await generateCSVBuffer(data, options);
    return {
      buffer: csvBuffer,
      fileName: `${baseFileName}.csv`,
      contentType: 'text/csv'
    };
  }
}

async function generatePDFReport(data: ReportData, options: ReportOptions, baseFileName: string): Promise<{ filePath: string; fileName: string }> {
  const fileName = `${baseFileName}.pdf`;
  const filePath = path.join('temp_uploads', fileName);
  
  // Ensure temp_uploads directory exists
  if (!fs.existsSync('temp_uploads')) {
    fs.mkdirSync('temp_uploads', { recursive: true });
  }

  // Generate HTML content for PDF
  const htmlContent = await generateHTMLReport(data, options);
  
  // Get PDF buffer
  const pdfBuffer = await makePDF(htmlContent);
  
  if (!pdfBuffer) {
    throw new Error('Failed to generate PDF');
  }
  
  // Write buffer to file
  fs.writeFileSync(filePath, pdfBuffer);
  
  return { filePath, fileName };
}

async function resolveChromiumExecutablePath(chromium: any): Promise<string> {
  // Capture whether a custom CHROMIUM_PACK_URL was provided before the try block
  const chromiumPackUrl = process.env.CHROMIUM_PACK_URL;
  const hadCustomChromiumPackUrl = !!chromiumPackUrl;
  
  try {
    // Check if a chromium pack URL is provided via environment variable
    // This allows downloading the chromium pack from a CDN or GitHub releases
    if (chromiumPackUrl) {
      console.log("Using Chromium pack URL from environment variable:", chromiumPackUrl);
      const executablePath = await chromium.executablePath(chromiumPackUrl);
      console.log("Chromium executable path:", executablePath);
      return executablePath;
    } else {
      // First, try to get the executable path using the default location
      // If that fails with "does not exist" error, the bin directory is missing
      const executablePath = await chromium.executablePath();
      console.log("Chromium executable path:", executablePath);
      return executablePath;
    }
  } catch (pathError) {
    console.error("Error getting chromium executable path:", pathError);
    const errorMessage = pathError instanceof Error ? pathError.message : String(pathError);
    
    // Check if it's the brotli files error
    if (errorMessage.includes("brotli") || errorMessage.includes("does not exist")) {
      console.error("Chromium brotli files not found in package.");
      
      // Only attempt fallback if a custom CHROMIUM_PACK_URL was not already used
      if (hadCustomChromiumPackUrl) {
        console.error(
          `Custom CHROMIUM_PACK_URL was already used (${chromiumPackUrl}) and failed. ` +
          `No further fallback will be attempted.`
        );
        throw new Error(
          `Failed to locate Chromium binary using custom CHROMIUM_PACK_URL: ${errorMessage}. ` +
          `The custom URL (${chromiumPackUrl}) was already attempted and failed. ` +
          `For Vercel deployments, you can:\n` +
          `1. Verify the CHROMIUM_PACK_URL points to a valid chromium pack URL\n` +
          `2. Use a different PDF generation library (e.g., pdfkit, jsPDF)\n` +
          `3. Use the full @sparticuz/chromium package instead of chromium-min`
        );
      }
      
      // Try to use GitHub releases URL as fallback
      // Detect architecture and construct the appropriate URL
      // Format: https://github.com/Sparticuz/chromium/releases/download/v141.0.0/chromium-v141.0.0-pack.ARCH.tar
      const arch = process.arch === 'arm64' ? 'arm64' : 'x64'; // Default to x64 for other architectures
      const fallbackUrl = 
        `https://github.com/Sparticuz/chromium/releases/download/v141.0.0/chromium-v141.0.0-pack.${arch}.tar`;
      
      try {
        console.log("Attempting to download Chromium pack from fallback URL:", fallbackUrl);
        const executablePath = await chromium.executablePath(fallbackUrl);
        console.log("Successfully downloaded Chromium, path:", executablePath);
        return executablePath;
      } catch (downloadError) {
        console.error("Failed to download Chromium pack:", downloadError);
        throw new Error(
          `Failed to locate Chromium binary: ${errorMessage}. ` +
          `The @sparticuz/chromium-min package v141.0.0 does not include the Chromium binary files. ` +
          `Tried downloading from ${fallbackUrl} but that also failed. ` +
          `For Vercel deployments, you can:\n` +
          `1. Set CHROMIUM_PACK_URL environment variable to a valid chromium pack URL\n` +
          `2. Use a different PDF generation library (e.g., pdfkit, jsPDF)\n` +
          `3. Use the full @sparticuz/chromium package instead of chromium-min`
        );
      }
    } else {
      throw new Error(`Failed to get Chromium executable path: ${errorMessage}`);
    }
  }
}

async function makePDF(html: string): Promise<Buffer | null> {
  console.log("Starting PDF generation, NODE_ENV:", process.env.NODE_ENV);
  
  // Initiate the browser instance
  let browser: Browser | undefined | null;

  // Check if the environment is development
  if (process.env.NODE_ENV !== "development") {
    console.log("Using Vercel-compatible Puppeteer");
    try {
      // Import the packages required on production
      const chromium = require("@sparticuz/chromium-min");
      const puppeteer = require("puppeteer-core");

      // Configure chromium for serverless environment
      // Disable graphics mode for serverless environments (if method exists)
      if (typeof chromium.setGraphicsMode === 'function') {
        chromium.setGraphicsMode(false);
      } else {
        console.log('setGraphicsMode not available in this chromium version, skipping');
      }
      
      // Get the executable path - this will extract the binary if needed
      const executablePath = await resolveChromiumExecutablePath(chromium);

      // Build launch options with fallbacks for properties that might not exist
      const launchOptions: any = {
        executablePath,
        headless: chromium.headless !== undefined ? chromium.headless : true,
        ignoreHTTPSErrors: true,
        args: [
          ...(chromium.args || []),
          "--hide-scrollbars",
          "--disable-web-security",
          "--no-sandbox",
          "--disable-setuid-sandbox"
        ],
      };

      // Add defaultViewport if available
      if (chromium.defaultViewport) {
        launchOptions.defaultViewport = chromium.defaultViewport;
      } else {
        launchOptions.defaultViewport = { width: 1280, height: 720 };
      }

      // Assign the browser instance
      browser = await puppeteer.launch(launchOptions);
      console.log("Browser launched successfully");
    } catch (error) {
      console.error("Error launching browser:", error);
      throw error;
    }
  } else {
    console.log("Using local Puppeteer");
    try {
      // Else, use the full version of puppeteer
      const puppeteer = require("puppeteer");
      browser = await puppeteer.launch({
        headless: "new",
      });
      console.log("Browser launched successfully");
    } catch (error) {
      console.error("Error launching browser:", error);
      throw error;
    }
  }

  try {
    // Create a PDF
    if (browser) {
      console.log("Creating new page");
      const page = await browser.newPage();
      console.log("Setting page content");
      await page.setContent(html);

      console.log("Generating PDF");
      const pdfBuffer = await page.pdf({
        format: "a4",
        printBackground: true,
        margin: {
          top: 80,
          bottom: 80,
          left: 80,
          right: 80,
        },
      });

      console.log("PDF generated, buffer size:", pdfBuffer.length);
      
      // Validate the PDF buffer before returning
      if (!pdfBuffer || pdfBuffer.length === 0) {
        console.error("PDF buffer is empty or null");
        await browser.close();
        throw new Error('Generated PDF buffer is empty');
      }
      
      // Check PDF header (pdfBuffer from Puppeteer is already a Buffer)
      const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
      const header = buffer.slice(0, 4).toString('ascii');
      if (header !== '%PDF') {
        console.error("Invalid PDF header:", header, "Buffer length:", pdfBuffer.length);
        await browser.close();
        throw new Error(`Invalid PDF header: expected '%PDF' but got '${header}'`);
      }
      
      await browser.close();

      return buffer;
    }

    // If browser wasn't launched, this is an error condition
    throw new Error('Browser was not launched - cannot generate PDF');
  } catch (error) {
    console.error("Error during PDF generation:", error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

async function generateCSVBuffer(data: ReportData, options: ReportOptions): Promise<Buffer> {
  // Prepare CSV data
  const csvData = data.analyses.map((analysis, index) => ({
    'Property #': index + 1,
    'Address': analysis.property.address || 'Unknown Address',
    'City': analysis.property.city || 'N/A',
    'State': analysis.property.state || 'N/A',
    'Property Type': analysis.property.propertyType || 'N/A',
    'Purchase Price': analysis.property.purchasePrice || 0,
    'Monthly Rent': analysis.property.monthlyRent || 0,
    'Bedrooms': analysis.property.bedrooms || 'N/A',
    'Bathrooms': analysis.property.bathrooms || 'N/A',
    'Square Footage': analysis.property.squareFootage || 'N/A',
    'Year Built': analysis.property.yearBuilt || 'N/A',
    'Total Cash Needed': analysis.totalCashNeeded || 0,
    'Monthly Cash Flow': analysis.cashFlow || 0,
    'Cash-on-Cash Return (%)': ((analysis.cocReturn || 0) * 100).toFixed(2),
    'Cap Rate (%)': ((analysis.capRate || 0) * 100).toFixed(2),
    'Passes 1% Rule': analysis.passes1PercentRule ? 'Yes' : 'No',
    'Meets Criteria': analysis.meetsCriteria ? 'Yes' : 'No',
    'Analysis Date': analysis.analysisDate ? new Date(analysis.analysisDate).toLocaleDateString() : 'N/A'
  }));

  // Generate CSV as string
  const headers = Object.keys(csvData[0] || {});
  const csvRows = [
    headers.join(','), // Header row
    ...csvData.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','))
  ];
  const csvContent = csvRows.join('\n');
  
  return Buffer.from(csvContent, 'utf-8');
}

async function generateCSVReport(data: ReportData, options: ReportOptions, baseFileName: string): Promise<{ filePath: string; fileName: string }> {
  const fileName = `${baseFileName}.csv`;
  const filePath = path.join('temp_uploads', fileName);
  
  // Ensure temp_uploads directory exists
  if (!fs.existsSync('temp_uploads')) {
    fs.mkdirSync('temp_uploads', { recursive: true });
  }

  // Prepare CSV data
  const csvData = data.analyses.map((analysis, index) => ({
    'Property #': index + 1,
    'Address': analysis.property.address || 'Unknown Address',
    'City': analysis.property.city || 'N/A',
    'State': analysis.property.state || 'N/A',
    'Property Type': analysis.property.propertyType || 'N/A',
    'Purchase Price': analysis.property.purchasePrice || 0,
    'Monthly Rent': analysis.property.monthlyRent || 0,
    'Bedrooms': analysis.property.bedrooms || 'N/A',
    'Bathrooms': analysis.property.bathrooms || 'N/A',
    'Square Footage': analysis.property.squareFootage || 'N/A',
    'Year Built': analysis.property.yearBuilt || 'N/A',
    'Total Cash Needed': analysis.totalCashNeeded || 0,
    'Monthly Cash Flow': analysis.cashFlow || 0,
    'Cash-on-Cash Return (%)': ((analysis.cocReturn || 0) * 100).toFixed(2),
    'Cap Rate (%)': ((analysis.capRate || 0) * 100).toFixed(2),
    'Passes 1% Rule': analysis.passes1PercentRule ? 'Yes' : 'No',
    'Meets Criteria': analysis.meetsCriteria ? 'Yes' : 'No',
    'Analysis Date': analysis.analysisDate ? new Date(analysis.analysisDate).toLocaleDateString() : 'N/A'
  }));

  // Create CSV writer
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'Property #', title: 'Property #' },
      { id: 'Address', title: 'Address' },
      { id: 'City', title: 'City' },
      { id: 'State', title: 'State' },
      { id: 'Property Type', title: 'Property Type' },
      { id: 'Purchase Price', title: 'Purchase Price ($)' },
      { id: 'Monthly Rent', title: 'Monthly Rent ($)' },
      { id: 'Bedrooms', title: 'Bedrooms' },
      { id: 'Bathrooms', title: 'Bathrooms' },
      { id: 'Square Footage', title: 'Square Footage' },
      { id: 'Year Built', title: 'Year Built' },
      { id: 'Total Cash Needed', title: 'Total Cash Needed ($)' },
      { id: 'Monthly Cash Flow', title: 'Monthly Cash Flow ($)' },
      { id: 'Cash-on-Cash Return (%)', title: 'Cash-on-Cash Return (%)' },
      { id: 'Cap Rate (%)', title: 'Cap Rate (%)' },
      { id: 'Passes 1% Rule', title: 'Passes 1% Rule' },
      { id: 'Meets Criteria', title: 'Meets Criteria' },
      { id: 'Analysis Date', title: 'Analysis Date' }
    ]
  });

  // Write CSV file
  await csvWriter.writeRecords(csvData);
  
  return { filePath, fileName };
}

function generateHTMLReport(data: ReportData, options: ReportOptions): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const analysesHtml = data.analyses.map((analysis, index) => `
    <div class="mb-8 p-2 border-b border-gray-200">
      <p class="text-xs font-semibold leading-7 text-indigo-600">
        Property Analysis ${index + 1}
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-gray-900">${analysis.property.address || 'Unknown Address'}</h1>
      
      <div class="mt-6 grid grid-cols-2 gap-6">
        <div class="p-4 border border-gray-200 rounded-lg">
          <h3 class="text-sm font-semibold text-indigo-600 mb-4">Property Details</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between"><dt class="font-medium">Address:</dt><dd>${analysis.property.address || 'Unknown Address'}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">City, State:</dt><dd>${analysis.property.city || 'N/A'}, ${analysis.property.state || 'N/A'}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Property Type:</dt><dd>${analysis.property.propertyType || 'N/A'}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Purchase Price:</dt><dd class="font-semibold">${formatCurrency(analysis.property.purchasePrice || 0)}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Monthly Rent:</dt><dd class="font-semibold">${formatCurrency(analysis.property.monthlyRent || 0)}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Bedrooms:</dt><dd>${analysis.property.bedrooms || 'N/A'}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Bathrooms:</dt><dd>${analysis.property.bathrooms || 'N/A'}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Square Footage:</dt><dd>${analysis.property.squareFootage?.toLocaleString() || 'N/A'}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Year Built:</dt><dd>${analysis.property.yearBuilt || 'N/A'}</dd></div>
          </dl>
        </div>
        
        <div class="p-4 border border-gray-200 rounded-lg">
          <h3 class="text-sm font-semibold text-indigo-600 mb-4">Financial Analysis</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between"><dt class="font-medium">Total Cash Needed:</dt><dd class="font-semibold">${formatCurrency(analysis.totalCashNeeded || 0)}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Monthly Cash Flow:</dt><dd class="font-semibold ${(analysis.cashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(analysis.cashFlow || 0)}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Cash-on-Cash Return:</dt><dd class="font-semibold">${formatPercent(analysis.cocReturn || 0)}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Cap Rate:</dt><dd class="font-semibold">${formatPercent(analysis.capRate || 0)}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Passes 1% Rule:</dt><dd class="font-semibold ${analysis.passes1PercentRule ? 'text-green-600' : 'text-red-600'}">${analysis.passes1PercentRule ? 'Yes' : 'No'}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Meets Criteria:</dt><dd class="font-semibold ${analysis.meetsCriteria ? 'text-green-600' : 'text-red-600'}">${analysis.meetsCriteria ? 'Yes' : 'No'}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${options.title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          .page-break { page-break-after: always; }
        }
      </style>
    </head>
    <body class="p-6 bg-white">
      <div class="text-center mb-8 pb-6 border-b-2 border-indigo-600">
        <p class="text-xs font-semibold leading-7 text-indigo-600">Real Estate Investment Report</p>
        <h1 class="mt-2 text-4xl font-bold tracking-tight text-gray-900">${options.title}</h1>
        <p class="mt-2 text-sm text-gray-600">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
      
      ${analysesHtml}
      
      <div class="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 class="text-lg font-semibold text-indigo-600 mb-4">Summary</h3>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="font-medium">Total Properties Analyzed:</dt><dd class="font-semibold">${data.analyses.length}</dd></div>
          <div class="flex justify-between"><dt class="font-medium">Properties Meeting Criteria:</dt><dd class="font-semibold text-green-600">${data.analyses.filter(a => a.meetsCriteria).length}</dd></div>
          <div class="flex justify-between"><dt class="font-medium">Average Cash Flow:</dt><dd class="font-semibold">${data.analyses.length > 0 ? formatCurrency(data.analyses.reduce((sum, a) => sum + (a.cashFlow || 0), 0) / data.analyses.length) : formatCurrency(0)}</dd></div>
          <div class="flex justify-between"><dt class="font-medium">Average COC Return:</dt><dd class="font-semibold">${data.analyses.length > 0 ? formatPercent(data.analyses.reduce((sum, a) => sum + (a.cocReturn || 0), 0) / data.analyses.length) : formatPercent(0)}</dd></div>
        </dl>
      </div>
    </body>
    </html>
  `;
}