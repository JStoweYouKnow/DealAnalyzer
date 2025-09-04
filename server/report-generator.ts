import puppeteer from 'puppeteer';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';
import type { DealAnalysis, PropertyComparison } from '@shared/schema';
import { aiAnalysisService } from './ai-service';

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
    return generatePDFReport(data, options, baseFileName);
  } else {
    return generateCSVReport(data, options, baseFileName);
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
  
  // Launch puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-extensions'
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filePath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true
    });
  } finally {
    await browser.close();
  }
  
  return { filePath, fileName };
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
    'Address': analysis.property.address,
    'City': analysis.property.city,
    'State': analysis.property.state,
    'Property Type': analysis.property.propertyType,
    'Purchase Price': analysis.property.purchasePrice,
    'Monthly Rent': analysis.property.monthlyRent,
    'Bedrooms': analysis.property.bedrooms,
    'Bathrooms': analysis.property.bathrooms,
    'Square Footage': analysis.property.squareFootage,
    'Year Built': analysis.property.yearBuilt,
    'Total Cash Needed': analysis.totalCashNeeded,
    'Monthly Cash Flow': analysis.cashFlow,
    'Cash-on-Cash Return (%)': (analysis.cocReturn * 100).toFixed(2),
    'Cap Rate (%)': (analysis.capRate * 100).toFixed(2),
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
    <div class="property-section">
      <h3>Property ${index + 1}: ${analysis.property.address}</h3>
      
      <div class="property-grid">
        <div class="property-details">
          <h4>Property Details</h4>
          <table>
            <tr><td>Address:</td><td>${analysis.property.address}</td></tr>
            <tr><td>City, State:</td><td>${analysis.property.city}, ${analysis.property.state}</td></tr>
            <tr><td>Property Type:</td><td>${analysis.property.propertyType}</td></tr>
            <tr><td>Purchase Price:</td><td>${formatCurrency(analysis.property.purchasePrice)}</td></tr>
            <tr><td>Monthly Rent:</td><td>${formatCurrency(analysis.property.monthlyRent)}</td></tr>
            <tr><td>Bedrooms:</td><td>${analysis.property.bedrooms}</td></tr>
            <tr><td>Bathrooms:</td><td>${analysis.property.bathrooms}</td></tr>
            <tr><td>Square Footage:</td><td>${analysis.property.squareFootage?.toLocaleString() || 'N/A'}</td></tr>
            <tr><td>Year Built:</td><td>${analysis.property.yearBuilt || 'N/A'}</td></tr>
          </table>
        </div>
        
        <div class="financial-analysis">
          <h4>Financial Analysis</h4>
          <table>
            <tr><td>Total Cash Needed:</td><td>${formatCurrency(analysis.totalCashNeeded)}</td></tr>
            <tr><td>Monthly Cash Flow:</td><td class="${analysis.cashFlow >= 0 ? 'positive' : 'negative'}">${formatCurrency(analysis.cashFlow)}</td></tr>
            <tr><td>Cash-on-Cash Return:</td><td>${formatPercent(analysis.cocReturn)}</td></tr>
            <tr><td>Cap Rate:</td><td>${formatPercent(analysis.capRate)}</td></tr>
            <tr><td>Passes 1% Rule:</td><td class="${analysis.passes1PercentRule ? 'pass' : 'fail'}">${analysis.passes1PercentRule ? 'Yes' : 'No'}</td></tr>
            <tr><td>Meets Criteria:</td><td class="${analysis.meetsCriteria ? 'pass' : 'fail'}">${analysis.meetsCriteria ? 'Yes' : 'No'}</td></tr>
          </table>
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
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #0070f3;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #0070f3;
          margin: 0;
        }
        .header p {
          color: #666;
          margin: 10px 0 0 0;
        }
        .property-section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        .property-section h3 {
          background: #f8f9fa;
          padding: 10px;
          border-left: 4px solid #0070f3;
          margin: 0 0 20px 0;
        }
        .property-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        .property-details, .financial-analysis {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
        }
        .property-details h4, .financial-analysis h4 {
          margin: 0 0 15px 0;
          color: #0070f3;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td {
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        td:first-child {
          font-weight: bold;
          width: 40%;
        }
        .positive { color: #28a745; font-weight: bold; }
        .negative { color: #dc3545; font-weight: bold; }
        .pass { color: #28a745; font-weight: bold; }
        .fail { color: #dc3545; font-weight: bold; }
        .summary {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }
        .summary h3 {
          color: #0070f3;
          margin: 0 0 15px 0;
        }
        @media print {
          .property-section {
            page-break-after: auto;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${options.title}</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Real Estate Investment Analysis Report</p>
      </div>
      
      ${analysesHtml}
      
      <div class="summary">
        <h3>Summary</h3>
        <p><strong>Total Properties Analyzed:</strong> ${data.analyses.length}</p>
        <p><strong>Properties Meeting Criteria:</strong> ${data.analyses.filter(a => a.meetsCriteria).length}</p>
        <p><strong>Average Cash Flow:</strong> ${formatCurrency(data.analyses.reduce((sum, a) => sum + a.cashFlow, 0) / data.analyses.length)}</p>
        <p><strong>Average COC Return:</strong> ${formatPercent(data.analyses.reduce((sum, a) => sum + a.cocReturn, 0) / data.analyses.length)}</p>
      </div>
    </body>
    </html>
  `;
}