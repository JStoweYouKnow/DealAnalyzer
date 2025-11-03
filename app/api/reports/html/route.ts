import { NextRequest, NextResponse } from "next/server";

// Browser-printable HTML report (no Puppeteer needed!)
// Users can print to PDF directly from their browser (Cmd/Ctrl+P)

/**
 * Interface for property data used in HTML report generation.
 * Represents the minimal structure needed for report rendering.
 */
export interface ReportProperty {
  address: string;
  city?: string;
  state?: string;
  propertyType?: string;
  purchasePrice: number;
  monthlyRent: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
}

/**
 * Interface for analysis data used in HTML report generation.
 * Represents the minimal structure needed for report rendering.
 */
export interface ReportAnalysis {
  property: ReportProperty;
  totalCashNeeded: number;
  cashFlow: number;
  cocReturn: number;
  capRate: number;
  passes1PercentRule: boolean;
  meetsCriteria: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analyses, title } = body;

    if (!analyses || !Array.isArray(analyses) || analyses.length === 0) {
      return NextResponse.json(
        { success: false, error: "Analyses array is required" },
        { status: 400 }
      );
    }

    // Type assertion: we expect analyses to conform to ReportAnalysis[]
    // Runtime validation would ideally be done here with a library like Zod
    const htmlContent = generatePrintableHTML(analyses as ReportAnalysis[], title || "Deal Analysis Report");

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating HTML report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

function generatePrintableHTML(analyses: ReportAnalysis[], title: string): string {
  /**
   * Escapes HTML special characters to prevent XSS attacks.
   * Replaces &, <, >, ", ', and / with their HTML entity equivalents.
   */
  const escapeHtml = (text: string | number | undefined | null): string => {
    if (text === null || text === undefined) {
      return "N/A";
    }
    const str = String(text);
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const analysesHtml = analyses
    .map(
      (analysis, index) => `
    <div class="property-analysis">
      <div class="property-header">
        <span class="property-number">Property ${index + 1}</span>
        <h2>${escapeHtml(analysis.property.address)}</h2>
      </div>

      <div class="analysis-grid">
        <div class="card">
          <h3>Property Details</h3>
          <dl>
            <div><dt>Address:</dt><dd>${escapeHtml(analysis.property.address)}</dd></div>
            <div><dt>City, State:</dt><dd>${escapeHtml(analysis.property.city)}, ${escapeHtml(analysis.property.state)}</dd></div>
            <div><dt>Property Type:</dt><dd>${escapeHtml(analysis.property.propertyType)}</dd></div>
            <div><dt>Purchase Price:</dt><dd class="highlight">${escapeHtml(formatCurrency(analysis.property.purchasePrice || 0))}</dd></div>
            <div><dt>Monthly Rent:</dt><dd class="highlight">${escapeHtml(formatCurrency(analysis.property.monthlyRent || 0))}</dd></div>
            <div><dt>Bedrooms:</dt><dd>${escapeHtml(analysis.property.bedrooms)}</dd></div>
            <div><dt>Bathrooms:</dt><dd>${escapeHtml(analysis.property.bathrooms)}</dd></div>
            <div><dt>Square Footage:</dt><dd>${escapeHtml(analysis.property.squareFootage ? analysis.property.squareFootage.toLocaleString() : null)}</dd></div>
            <div><dt>Year Built:</dt><dd>${escapeHtml(analysis.property.yearBuilt)}</dd></div>
          </dl>
        </div>

        <div class="card">
          <h3>Financial Analysis</h3>
          <dl>
            <div><dt>Total Cash Needed:</dt><dd class="highlight">${escapeHtml(formatCurrency(analysis.totalCashNeeded || 0))}</dd></div>
            <div><dt>Monthly Cash Flow:</dt><dd class="highlight ${(analysis.cashFlow || 0) >= 0 ? "positive" : "negative"}">${escapeHtml(formatCurrency(analysis.cashFlow || 0))}</dd></div>
            <div><dt>Cash-on-Cash Return:</dt><dd class="highlight">${escapeHtml(formatPercent(analysis.cocReturn || 0))}</dd></div>
            <div><dt>Cap Rate:</dt><dd class="highlight">${escapeHtml(formatPercent(analysis.capRate || 0))}</dd></div>
            <div><dt>Passes 1% Rule:</dt><dd class="badge ${analysis.passes1PercentRule ? "pass" : "fail"}">${escapeHtml(analysis.passes1PercentRule ? "✓ Yes" : "✗ No")}</dd></div>
            <div><dt>Meets Criteria:</dt><dd class="badge ${analysis.meetsCriteria ? "pass" : "fail"}">${escapeHtml(analysis.meetsCriteria ? "✓ Yes" : "✗ No")}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  const avgCashFlow = analyses.reduce((sum, a) => sum + a.cashFlow, 0) / analyses.length;
  const avgCOC = analyses.reduce((sum, a) => sum + a.cocReturn, 0) / analyses.length;
  const meetingCriteria = analyses.filter((a) => a.meetsCriteria).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || '')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
      padding: 2rem;
    }

    .header {
      text-align: center;
      padding: 2rem 0 3rem;
      border-bottom: 3px solid #6366f1;
      margin-bottom: 3rem;
    }

    .header .subtitle {
      color: #6366f1;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: #111827;
      margin: 0.5rem 0;
    }

    .header .meta {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .no-print {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .no-print button {
      background: #6366f1;
      color: white;
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 0.375rem;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .no-print button:hover {
      background: #4f46e5;
    }

    .property-analysis {
      margin-bottom: 3rem;
      page-break-inside: avoid;
    }

    .property-header {
      margin-bottom: 1.5rem;
    }

    .property-number {
      display: inline-block;
      background: #6366f1;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .property-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin-top: 0.5rem;
    }

    .analysis-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .card {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.5rem;
      background: #f9fafb;
    }

    .card h3 {
      color: #6366f1;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card dl {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .card dl > div {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .card dt {
      font-weight: 500;
      color: #4b5563;
    }

    .card dd {
      font-weight: 400;
      color: #111827;
    }

    .card dd.highlight {
      font-weight: 700;
      color: #111827;
    }

    .card dd.positive {
      color: #059669;
    }

    .card dd.negative {
      color: #dc2626;
    }

    .badge {
      padding: 0.125rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge.pass {
      background: #d1fae5;
      color: #065f46;
    }

    .badge.fail {
      background: #fee2e2;
      color: #991b1b;
    }

    .summary {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 2rem;
      margin-top: 3rem;
      page-break-inside: avoid;
    }

    .summary h3 {
      color: #6366f1;
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .summary dl {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .summary dl > div {
      display: flex;
      justify-content: space-between;
    }

    .summary dt {
      font-weight: 500;
      color: #4b5563;
    }

    .summary dd {
      font-weight: 700;
      color: #111827;
    }

    .summary dd.positive {
      color: #059669;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      .property-analysis { page-break-inside: avoid; }
      .summary { page-break-inside: avoid; }
    }

    @media (max-width: 768px) {
      .analysis-grid {
        grid-template-columns: 1fr;
      }
      .summary dl {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="flex: 1;">
      <strong>💡 Tip:</strong> Press <strong>Cmd+P</strong> (Mac) or <strong>Ctrl+P</strong> (Windows) to print or save as PDF
    </div>
    <button onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="subtitle">Real Estate Investment Report</div>
    <h1>${escapeHtml(title || '')}</h1>
    <div class="meta">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
  </div>

  ${analysesHtml}

  <div class="summary">
    <h3>📊 Summary</h3>
    <dl>
      <div><dt>Total Properties Analyzed:</dt><dd>${analyses.length}</dd></div>
      <div><dt>Properties Meeting Criteria:</dt><dd class="positive">${meetingCriteria}</dd></div>
      <div><dt>Average Cash Flow:</dt><dd class="${avgCashFlow >= 0 ? "positive" : "negative"}">${formatCurrency(avgCashFlow)}</dd></div>
      <div><dt>Average COC Return:</dt><dd>${formatPercent(avgCOC)}</dd></div>
    </dl>
  </div>

  <script>
    // Auto-print on load (optional - can be removed)
    // window.addEventListener('load', () => setTimeout(() => window.print(), 500));
  </script>
</body>
</html>`;
}
