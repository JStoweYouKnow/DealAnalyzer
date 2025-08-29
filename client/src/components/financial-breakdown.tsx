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

  // Calculate estimated monthly expenses breakdown
  const loanAmount = analysis.property.purchasePrice - analysis.calculatedDownpayment;
  const monthlyInterestRate = 0.07 / 12; // Assuming 7% interest rate
  const numberOfPayments = 30 * 12; // 30 years
  const mortgagePayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  
  const propertyTax = analysis.property.purchasePrice * 0.012 / 12; // 1.2% annually
  const insurance = 100; // Estimated $100/month
  const vacancy = analysis.property.monthlyRent * 0.05; // 5% of rent
  const propertyManagement = analysis.property.monthlyRent * 0.10; // 10% of rent
  
  const totalExpenses = mortgagePayment + propertyTax + insurance + vacancy + analysis.estimatedMaintenanceReserve + propertyManagement;

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
              <div className="border-t border-red-200 dark:border-red-800 pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total Expenses</span>
                  <span className="text-red-600" data-testid="text-total-expenses">
                    {formatCurrency(totalExpenses)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="mt-6 bg-primary/5 rounded-lg p-4 border-l-4 border-primary">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-primary">Net Monthly Cash Flow</span>
            <span 
              className={`text-xl font-bold ${analysis.cashFlowPositive ? 'text-primary' : 'text-red-600'}`}
              data-testid="text-net-cash-flow"
            >
              {formatCurrency(analysis.cashFlow)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Monthly income after all expenses</p>
        </div>
      </CardContent>
    </Card>
  );
}
