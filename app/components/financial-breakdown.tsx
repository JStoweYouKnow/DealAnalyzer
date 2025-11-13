import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DealAnalysis } from "@shared/schema";

interface FinancialBreakdownProps {
  analysis: DealAnalysis;
}

export function FinancialBreakdown({ analysis }: FinancialBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Try to get the actual mortgage payment used in the analysis if available
  // Otherwise, calculate it the same way the backend does
  const analysisData = analysis as any;
  const actualMortgagePayment = analysisData.monthlyMortgagePayment;
  
  // For display, calculate mortgage payment if not available from analysis
  const loanAmount = analysis.property.purchasePrice - analysis.calculatedDownpayment;
  const monthlyInterestRate = 0.07 / 12; // Assuming 7% interest rate
  const numberOfPayments = 30 * 12; // 30 years
  const calculatedMortgagePayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  
  // Use actual mortgage payment from analysis if available, otherwise use calculated
  const mortgagePayment = actualMortgagePayment ?? calculatedMortgagePayment;
  
  // Estimated breakdown components (used for display breakdown)
  const propertyTax = analysis.property.purchasePrice * 0.012 / 12; // 1.2% annually
  const insurance = 100; // Estimated $100/month
  const vacancy = analysis.property.monthlyRent * 0.05; // 5% of rent
  const propertyManagement = analysis.property.monthlyRent * 0.10; // 10% of rent
  
  // Get additional expenses from property if available
  const utilities = (analysis.property as any).monthlyExpenses?.utilities || 0;
  const cleaning = (analysis.property as any).monthlyExpenses?.cleaning || 0;
  const supplies = (analysis.property as any).monthlyExpenses?.supplies || 0;
  const other = (analysis.property as any).monthlyExpenses?.other || 0;
  
  // Calculate displayed total as the sum of all displayed expense items
  // This ensures the total matches what the user sees in the breakdown
  const displayedExpenses = mortgagePayment + propertyTax + insurance + vacancy + analysis.estimatedMaintenanceReserve + propertyManagement + utilities + cleaning + supplies + other;
  
  // Use the displayed expenses total so it matches the sum of visible items
  // The cash flow calculation from the backend is still correct, but the displayed total should match what's shown
  const totalExpensesEstimated = displayedExpenses;
  
  // Recalculate cash flow based on displayed expenses
  const correctedCashFlow = analysis.property.monthlyRent - totalExpensesEstimated;
  const correctedAnnualCashFlow = correctedCashFlow * 12;
  
  // Recalculate Cash-on-Cash Return using corrected cash flow
  const correctedCocReturn = analysis.totalCashNeeded > 0 ? correctedAnnualCashFlow / analysis.totalCashNeeded : 0;
  
  // Recalculate Cap Rate using displayed expenses (excluding mortgage)
  // Cap Rate = NOI / Purchase Price, where NOI excludes debt service (mortgage)
  const annualOperatingExpenses = (propertyTax + insurance + vacancy + analysis.estimatedMaintenanceReserve + propertyManagement + utilities + cleaning + supplies + other) * 12;
  const netOperatingIncome = (analysis.property.monthlyRent * 12) - annualOperatingExpenses;
  const correctedCapRate = analysis.property.purchasePrice > 0 ? netOperatingIncome / analysis.property.purchasePrice : 0;

  return (
    <Card className="analysis-card">
      <CardHeader className="border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground flex items-center">
          <i className="fas fa-calculator text-primary mr-3"></i>
          Financial Breakdown
        </h3>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Monthly Income */}
          <div className="space-y-4">
            <h4 className="font-semibold text-green-600 flex items-center">
              <i className="fas fa-plus-circle mr-2"></i>
              Monthly Income
            </h4>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gross Rental Income</span>
                <span className="font-medium" data-testid="text-gross-rental-income">
                  {formatCurrency(analysis.property.monthlyRent)}
                </span>
              </div>
              <div className="border-t border-green-200 dark:border-green-800 pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total Income</span>
                  <span className="text-green-600" data-testid="text-total-income">
                    {formatCurrency(analysis.property.monthlyRent)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Expenses */}
          <div className="space-y-4">
            <h4 className="font-semibold text-red-600 flex items-center">
              <i className="fas fa-minus-circle mr-2"></i>
              Monthly Expenses
            </h4>
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Mortgage Payment (P&I)</span>
                <span data-testid="text-mortgage-payment">{formatCurrency(mortgagePayment)}</span>
              </div>
              <div className="flex justify-between">
                <span>Property Tax</span>
                <span data-testid="text-property-tax">{formatCurrency(propertyTax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Insurance</span>
                <span data-testid="text-insurance">{formatCurrency(insurance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Vacancy (5%)</span>
                <span data-testid="text-vacancy">{formatCurrency(vacancy)}</span>
              </div>
              <div className="flex justify-between">
                <span>Maintenance Reserve</span>
                <span data-testid="text-maintenance">{formatCurrency(analysis.estimatedMaintenanceReserve)}</span>
              </div>
              <div className="flex justify-between">
                <span>Property Management</span>
                <span data-testid="text-property-management">{formatCurrency(propertyManagement)}</span>
              </div>
              {utilities > 0 && (
                <div className="flex justify-between">
                  <span>Utilities</span>
                  <span data-testid="text-utilities">{formatCurrency(utilities)}</span>
                </div>
              )}
              {cleaning > 0 && (
                <div className="flex justify-between">
                  <span>Cleaning</span>
                  <span data-testid="text-cleaning">{formatCurrency(cleaning)}</span>
                </div>
              )}
              {supplies > 0 && (
                <div className="flex justify-between">
                  <span>Supplies</span>
                  <span data-testid="text-supplies">{formatCurrency(supplies)}</span>
                </div>
              )}
              {other > 0 && (
                <div className="flex justify-between">
                  <span>Other</span>
                  <span data-testid="text-other">{formatCurrency(other)}</span>
                </div>
              )}
              <div className="border-t border-red-200 dark:border-red-800 pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total Expenses</span>
                  <span className="text-red-600" data-testid="text-total-expenses">
                    {formatCurrency(totalExpensesEstimated)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Net Cash Flow from Analysis Engine */}
        <div className="mt-6 bg-primary/5 rounded-lg p-4 border-l-4 border-primary">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-primary">Net Monthly Cash Flow</span>
            {(() => {
              // Calculate cash flow based on displayed expenses to match what user sees
              const calculatedCashFlow = analysis.property.monthlyRent - totalExpensesEstimated;
              const isPositive = calculatedCashFlow >= 0;
              return (
                <span 
                  className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                  data-testid="text-net-cash-flow"
                >
                  {formatCurrency(calculatedCashFlow)}
                </span>
              );
            })()}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Calculated from displayed expenses: {formatCurrency(analysis.property.monthlyRent)} - {formatCurrency(totalExpensesEstimated)} = {(() => {
              const calculatedCashFlow = analysis.property.monthlyRent - totalExpensesEstimated;
              return formatCurrency(calculatedCashFlow);
            })()}
          </p>
        </div>
        
        {/* Key Investment Metrics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Cash-on-Cash Return</div>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-coc-return">
              {(correctedCocReturn * 100).toFixed(1)}%
            </div>
            <div className={`text-xs mt-1 ${correctedCocReturn >= 0.08 ? 'text-green-600' : 'text-red-600'}`}>
              {correctedCocReturn >= 0.08 ? '✓ Meets minimum' : '✗ Below minimum'}
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Cap Rate</div>
            <div className="text-2xl font-bold text-purple-600" data-testid="text-cap-rate">
              {(correctedCapRate * 100).toFixed(1)}%
            </div>
            <div className={`text-xs mt-1 ${correctedCapRate >= 0.05 ? 'text-green-600' : 'text-red-600'}`}>
              {correctedCapRate >= 0.05 ? '✓ Meets minimum' : '✗ Below minimum'}
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Total Cash Needed</div>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-cash-needed">
              {formatCurrency(analysis.totalCashNeeded)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Down payment + closing costs
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
