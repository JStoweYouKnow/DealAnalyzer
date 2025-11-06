// Lazy load ExcelJS - only import when needed
let ExcelJSModule: any = null;

async function getExcelJS() {
  if (!ExcelJSModule) {
    ExcelJSModule = await import('exceljs');
  }
  return ExcelJSModule;
}
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { 
  type BiggerPocketsImport, 
  type Property, 
  type InsertProperty,
  type ImportResult,
  type ExcelExportRequest,
  type CsvExportRequest,
  type DealAnalysis,
  biggerPocketsImportSchema 
} from "@shared/schema";
import { storage } from "./storage";

export class ImportExportService {
  
  // BiggerPockets CSV/Excel Import
  async importFromBiggerPockets(filePath: string, fileType: 'csv' | 'xlsx'): Promise<ImportResult> {
    let data: any[] = [];
    
    try {
      if (fileType === 'xlsx') {
        data = await this.parseExcelFile(filePath);
      } else {
        data = await this.parseCsvFile(filePath);
      }
      
      const result: ImportResult = {
        success: true,
        imported: 0,
        skipped: 0,
        errors: [],
        properties: []
      };
      
      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i];
          const importData = this.mapRowToBiggerPocketsFormat(row);
          const validated = biggerPocketsImportSchema.parse(importData);
          
          // Convert to our internal property format
          const property = this.convertBiggerPocketsToProperty(validated);
          const created = await storage.createProperty(property);
          
          result.properties?.push(created);
          result.imported++;
        } catch (error) {
          result.errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: data[i]
          });
          result.skipped++;
        }
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{
          row: 0,
          error: `File parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
  
  // Parse Excel file
  private async parseExcelFile(filePath: string): Promise<any[]> {
    const ExcelJSModule = await getExcelJS();
    const ExcelJS = ExcelJSModule.default || ExcelJSModule;
    const Workbook = ExcelJS.Workbook;
    const workbook = new Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    
    const data: any[] = [];
    const headers: string[] = [];
    
    // Get headers from first row
    worksheet.getRow(1).eachCell((cell: any, colNumber: number) => {
      headers[colNumber - 1] = cell.value?.toString() || '';
    });
    
    // Get data rows
    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return; // Skip header row
      
      const rowData: any = {};
      row.eachCell((cell: any, colNumber: number) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      data.push(rowData);
    });
    
    return data;
  }
  
  // Parse CSV file
  private async parseCsvFile(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = fs.createReadStream(filePath)
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (data: any) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }
  
  // Map CSV/Excel row to BiggerPockets format
  private mapRowToBiggerPocketsFormat(row: any): BiggerPocketsImport {
    // Handle various possible column names from BiggerPockets exports
    const getField = (row: any, possibleNames: string[]): any => {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
      }
      return undefined;
    };
    
    const parseNumber = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Remove currency symbols and commas
        const cleaned = value.replace(/[$,\s]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    
    return {
      propertyAddress: getField(row, ['address', 'property_address', 'Address', 'Property Address']),
      propertyCity: getField(row, ['city', 'property_city', 'City', 'Property City']),
      propertyState: getField(row, ['state', 'property_state', 'State', 'Property State']),
      propertyZip: getField(row, ['zip', 'zipcode', 'property_zip', 'Zip', 'ZIP']),
      propertyType: getField(row, ['type', 'property_type', 'Type', 'Property Type']) || 'single-family',
      propertyBedrooms: parseNumber(getField(row, ['bedrooms', 'beds', 'Bedrooms', 'Beds'])),
      propertyBathrooms: parseNumber(getField(row, ['bathrooms', 'baths', 'Bathrooms', 'Baths'])),
      propertySquareFootage: parseNumber(getField(row, ['sqft', 'square_feet', 'Square Feet', 'Sq Ft'])),
      propertyYearBuilt: parseNumber(getField(row, ['year_built', 'built', 'Year Built', 'Built'])),
      
      purchasePrice: parseNumber(getField(row, ['purchase_price', 'price', 'Purchase Price', 'Price'])),
      closingCosts: parseNumber(getField(row, ['closing_costs', 'Closing Costs'])),
      downPayment: parseNumber(getField(row, ['down_payment', 'Down Payment'])),
      downPaymentPercentage: parseNumber(getField(row, ['down_payment_percent', 'Down Payment %'])),
      loanAmount: parseNumber(getField(row, ['loan_amount', 'Loan Amount'])),
      interestRate: parseNumber(getField(row, ['interest_rate', 'Interest Rate'])),
      loanTerm: parseNumber(getField(row, ['loan_term', 'Loan Term'])),
      
      monthlyRent: parseNumber(getField(row, ['monthly_rent', 'rent', 'Monthly Rent', 'Rent'])),
      otherMonthlyIncome: parseNumber(getField(row, ['other_income', 'Other Income'])),
      
      monthlyTaxes: parseNumber(getField(row, ['taxes', 'property_taxes', 'Property Taxes'])),
      monthlyInsurance: parseNumber(getField(row, ['insurance', 'Insurance'])),
      monthlyUtilities: parseNumber(getField(row, ['utilities', 'Utilities'])),
      monthlyMaintenance: parseNumber(getField(row, ['maintenance', 'Maintenance'])),
      monthlyManagement: parseNumber(getField(row, ['management', 'property_management', 'Management'])),
      monthlyHOA: parseNumber(getField(row, ['hoa', 'HOA', 'hoa_fees', 'HOA Fees'])),
      monthlyCapEx: parseNumber(getField(row, ['capex', 'capital_expenditures', 'CapEx'])),
      monthlyVacancy: parseNumber(getField(row, ['vacancy', 'vacancy_allowance', 'Vacancy'])),
      otherMonthlyExpenses: parseNumber(getField(row, ['other_expenses', 'Other Expenses'])),
      
      appreciationRate: parseNumber(getField(row, ['appreciation', 'appreciation_rate', 'Appreciation %'])),
      incomeGrowthRate: parseNumber(getField(row, ['income_growth', 'Income Growth %'])),
      expenseGrowthRate: parseNumber(getField(row, ['expense_growth', 'Expense Growth %'])),
      salesExpensePercentage: parseNumber(getField(row, ['sales_expense', 'Sales Expense %'])),
      
      notes: getField(row, ['notes', 'comments', 'Notes', 'Comments']),
      source: 'BiggerPockets Import'
    };
  }
  
  // Convert BiggerPockets format to our internal Property format
  private convertBiggerPocketsToProperty(data: BiggerPocketsImport): InsertProperty {
    return {
      address: data.propertyAddress,
      city: data.propertyCity,
      state: data.propertyState,
      zipCode: data.propertyZip || '',
      propertyType: data.propertyType,
      bedrooms: data.propertyBedrooms || 0,
      bathrooms: data.propertyBathrooms || 0,
      squareFootage: data.propertySquareFootage || 0,
      yearBuilt: data.propertyYearBuilt || new Date().getFullYear(),
      purchasePrice: data.purchasePrice,
      monthlyRent: data.monthlyRent,
      description: data.notes || 'Imported from BiggerPockets',
      listingUrl: '',
      fundingSource: 'conventional' // Default to conventional for BiggerPockets imports
    };
  }
  
  // Export to Excel
  async exportToExcel(request: ExcelExportRequest): Promise<Buffer> {
    const analyses = await this.getAnalysesForExport(request.propertyIds);
    
    const ExcelJSModule = await getExcelJS();
    const workbook = new ExcelJSModule.Workbook();
    
    if (request.templateType === 'biggerpockets') {
      await this.addBiggerPocketsSheet(workbook, analyses);
    } else if (request.templateType === 'detailed') {
      await this.addDetailedAnalysisSheet(workbook, analyses);
    } else {
      await this.addSummarySheet(workbook, analyses);
    }
    
    if (request.includeTemplate) {
      await this.addTemplateSheet(workbook, request.templateType);
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
  
  // Export to CSV
  async exportToCsv(request: CsvExportRequest): Promise<string> {
    const analyses = await this.getAnalysesForExport(request.propertyIds);
    
    let data: any[];
    if (request.format === 'biggerpockets') {
      data = this.formatForBiggerPockets(analyses);
    } else {
      data = this.formatForStandard(analyses);
    }
    
    // Convert to CSV format
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(','))
    ];
    
    return csvRows.join('\n');
  }
  
  private async getAnalysesForExport(propertyIds?: string[]): Promise<DealAnalysis[]> {
    const allAnalyses = await storage.getAnalysisHistory();
    
    if (propertyIds && propertyIds.length > 0) {
      return allAnalyses.filter(analysis => 
        analysis.property && propertyIds.includes(analysis.property.id!)
      );
    }
    
    return allAnalyses;
  }
  
  private async addBiggerPocketsSheet(workbook: any, analyses: DealAnalysis[]) {
    const data = this.formatForBiggerPockets(analyses);
    const worksheet = workbook.addWorksheet('BiggerPockets Export');
    
    if (data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add data rows
      data.forEach((row: any) => {
        worksheet.addRow(headers.map((header: string) => (row as any)[header]));
      });
    }
  }
  
  private async addDetailedAnalysisSheet(workbook: any, analyses: DealAnalysis[]) {
    const data = analyses.map(analysis => ({
      'Property Address': `${analysis.property?.address}, ${analysis.property?.city}, ${analysis.property?.state}`,
      'Property Type': analysis.property?.propertyType,
      'Purchase Price': analysis.property?.purchasePrice,
      'Monthly Rent': analysis.property?.monthlyRent,
      'Cash Flow': analysis.cashFlow,
      'COC Return': `${(analysis.cocReturn * 100).toFixed(2)}%`,
      'Cap Rate': `${(analysis.capRate * 100).toFixed(2)}%`,
      'Cash Required': analysis.totalCashNeeded,
      'Down Payment': analysis.calculatedDownpayment,
      'Closing Costs': analysis.calculatedClosingCosts,
      'Loan Amount': (analysis.property?.purchasePrice || 0) - (analysis.calculatedDownpayment || 0),
      'Monthly Payment': 0, // Not directly available in schema
      'Monthly Expenses': analysis.totalMonthlyExpenses,
      'Meets Criteria': analysis.meetsCriteria ? 'Yes' : 'No',
      'Analysis Date': analysis.analysisDate?.toDateString(),
      'AI Overall Score': analysis.aiAnalysis?.propertyAssessment?.overallScore,
      'AI Recommendation': analysis.aiAnalysis?.investmentRecommendation?.recommendation,
      'Investment Strategy': analysis.aiAnalysis?.investmentRecommendation?.suggestedStrategy,
    }));
    
    const worksheet = workbook.addWorksheet('Detailed Analysis');
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      data.forEach((row: any) => {
        worksheet.addRow(headers.map((header: string) => (row as any)[header]));
      });
    }
  }
  
  private async addSummarySheet(workbook: any, analyses: DealAnalysis[]) {
    const data = analyses.map(analysis => ({
      'Address': `${analysis.property?.address}, ${analysis.property?.city}, ${analysis.property?.state}`,
      'Price': analysis.property?.purchasePrice,
      'Rent': analysis.property?.monthlyRent,
      'Cash Flow': analysis.cashFlow,
      'COC Return': `${(analysis.cocReturn * 100).toFixed(2)}%`,
      'Cap Rate': `${(analysis.capRate * 100).toFixed(2)}%`,
      'Meets Criteria': analysis.meetsCriteria ? 'Yes' : 'No',
    }));
    
    const worksheet = workbook.addWorksheet('Summary');
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      data.forEach((row: any) => {
        worksheet.addRow(headers.map((header: string) => (row as any)[header]));
      });
    }
  }
  
  private async addTemplateSheet(workbook: any, templateType: string) {
    let templateData: any[] = [];
    
    if (templateType === 'biggerpockets') {
      templateData = [{
        'Property Address': 'Example: 123 Main St',
        'City': 'Example: Denver',
        'State': 'Example: CO',
        'Zip': 'Example: 80202',
        'Property Type': 'single-family',
        'Bedrooms': 3,
        'Bathrooms': 2,
        'Square Feet': 1500,
        'Year Built': 2020,
        'Purchase Price': 350000,
        'Down Payment': 70000,
        'Loan Amount': 280000,
        'Interest Rate': 6.5,
        'Monthly Rent': 2800,
        'Property Taxes': 400,
        'Insurance': 150,
        'Maintenance': 200,
        'Management': 280,
        'Vacancy': 140,
        'Other Expenses': 100,
      }];
    }
    
    const worksheet = workbook.addWorksheet('Import Template');
    
    if (templateData.length > 0) {
      const headers = Object.keys(templateData[0]);
      worksheet.addRow(headers);
      
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      templateData.forEach(row => {
        worksheet.addRow(headers.map(header => row[header]));
      });
    }
  }
  
  private formatForBiggerPockets(analyses: DealAnalysis[]): any[] {
    return analyses.map(analysis => ({
      'Property Address': analysis.property?.address || '',
      'City': analysis.property?.city || '',
      'State': analysis.property?.state || '',
      'Zip': analysis.property?.zipCode || '',
      'Property Type': analysis.property?.propertyType || '',
      'Bedrooms': analysis.property?.bedrooms || 0,
      'Bathrooms': analysis.property?.bathrooms || 0,
      'Square Feet': analysis.property?.squareFootage || 0,
      'Year Built': analysis.property?.yearBuilt || '',
      'Purchase Price': analysis.property?.purchasePrice || 0,
      'Down Payment': analysis.calculatedDownpayment || 0,
      'Down Payment %': analysis.calculatedDownpayment ? (analysis.calculatedDownpayment / (analysis.property?.purchasePrice || 1) * 100) : 0,
      'Loan Amount': (analysis.property?.purchasePrice || 0) - (analysis.calculatedDownpayment || 0),
      'Interest Rate': 0, // Not available in schema
      'Loan Term': 30, // Default value
      'Closing Costs': analysis.calculatedClosingCosts || 0,
      'Monthly Rent': analysis.property?.monthlyRent || 0,
      'Other Income': 0, // Not tracked in our system
      'Property Taxes': analysis.property?.monthlyExpenses?.propertyTaxes || 0,
      'Insurance': analysis.property?.monthlyExpenses?.insurance || 0,
      'Utilities': analysis.property?.monthlyExpenses?.utilities || 0,
      'Maintenance': analysis.property?.monthlyExpenses?.maintenance || 0,
      'Management': analysis.property?.monthlyExpenses?.management || 0,
      'HOA': 0, // Not tracked in current schema
      'CapEx': 0, // Not separately tracked
      'Vacancy': 0, // Not separately tracked
      'Other Expenses': 0,
      'Net Cash Flow': analysis.cashFlow || 0,
      'COC Return %': (analysis.cocReturn * 100) || 0,
      'Cap Rate %': (analysis.capRate * 100) || 0,
      'Total Cash Required': analysis.totalCashNeeded || 0,
      'Monthly Mortgage Payment': 0, // Not available in schema
      'Total Monthly Expenses': analysis.totalMonthlyExpenses || 0,
      'Meets Investment Criteria': analysis.meetsCriteria ? 'Yes' : 'No',
      'AI Overall Score': analysis.aiAnalysis?.propertyAssessment?.overallScore || '',
      'AI Recommendation': analysis.aiAnalysis?.investmentRecommendation?.recommendation || '',
      'Analysis Date': analysis.analysisDate?.toDateString() || '',
    }));
  }
  
  private formatForStandard(analyses: DealAnalysis[]): any[] {
    return analyses.map(analysis => ({
      address: `${analysis.property?.address}, ${analysis.property?.city}, ${analysis.property?.state}`,
      propertyType: analysis.property?.propertyType,
      purchasePrice: analysis.property?.purchasePrice,
      monthlyRent: analysis.property?.monthlyRent,
      cashFlow: analysis.cashFlow,
      cocReturn: analysis.cocReturn,
      capRate: analysis.capRate,
      totalCashNeeded: analysis.totalCashNeeded,
      meetsCriteria: analysis.meetsCriteria,
      analysisDate: analysis.analysisDate?.toISOString(),
    }));
  }
  
  // Generate BiggerPockets-compatible template
  async generateBiggerPocketsTemplate(): Promise<Buffer> {
    const ExcelJSModule = await getExcelJS();
    const ExcelJS = ExcelJSModule.default || ExcelJSModule;
    const Workbook = ExcelJS.Workbook || ExcelJS;
    const templateData = [
      {
        'Property Address': '',
        'City': '',
        'State': '',
        'Zip': '',
        'Property Type': 'single-family',
        'Bedrooms': '',
        'Bathrooms': '',
        'Square Feet': '',
        'Year Built': '',
        'Purchase Price': '',
        'Down Payment': '',
        'Down Payment %': '20',
        'Loan Amount': '',
        'Interest Rate': '6.5',
        'Loan Term': '30',
        'Closing Costs': '',
        'Monthly Rent': '',
        'Other Income': '0',
        'Property Taxes': '',
        'Insurance': '',
        'Utilities': '0',
        'Maintenance': '',
        'Management': '',
        'HOA': '0',
        'CapEx': '',
        'Vacancy': '',
        'Other Expenses': '0',
        'Notes': '',
      }
    ];
    
    const ExcelJSMod = await getExcelJS();
    const ExcelJSClass = ExcelJSMod.default || ExcelJSMod;
    const WorkbookClass = ExcelJSClass?.Workbook || ExcelJSClass;
    const workbook = new WorkbookClass();
    const worksheet = workbook.addWorksheet('BiggerPockets Template');
    
    if (templateData.length > 0) {
      const headers = Object.keys(templateData[0]);
      worksheet.addRow(headers);
      
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      templateData.forEach((row: any) => {
        worksheet.addRow(headers.map((header: string) => (row as any)[header]));
      });
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export const importExportService = new ImportExportService();