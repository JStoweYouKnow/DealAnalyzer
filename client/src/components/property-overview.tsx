import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DealAnalysis } from "@shared/schema";

interface PropertyOverviewProps {
  analysis: DealAnalysis;
}

export function PropertyOverview({ analysis }: PropertyOverviewProps) {
  const { property } = analysis;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDecimal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="analysis-card">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-home text-primary"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Property Analysis</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-property-address">
                {property.address}
              </p>
            </div>
          </div>
          
          <Badge 
            variant={analysis.meetsCriteria ? "default" : "destructive"}
            className="metric-badge flex items-center space-x-2"
            data-testid="badge-criteria-status"
          >
            <i className={`fas ${analysis.meetsCriteria ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
            <span>{analysis.meetsCriteria ? 'MEETS CRITERIA' : 'DOES NOT MEET CRITERIA'}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Property Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground mb-3 flex items-center">
              <i className="fas fa-info-circle text-primary mr-2"></i>
              Property Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium" data-testid="text-property-type">
                  {property.propertyType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium text-primary" data-testid="text-purchase-price">
                  {formatCurrency(property.purchasePrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Rent:</span>
                <span className="font-medium text-green-600" data-testid="text-monthly-rent">
                  {formatCurrency(property.monthlyRent)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Beds/Baths:</span>
                <span className="font-medium" data-testid="text-beds-baths">
                  {property.bedrooms}/{property.bathrooms}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Square Feet:</span>
                <span className="font-medium" data-testid="text-square-footage">
                  {property.squareFootage.toLocaleString()}
                </span>
              </div>
              {property.lotSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lot Size:</span>
                  <span className="font-medium" data-testid="text-lot-size">
                    {property.lotSize.toLocaleString()} sq ft
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Year Built:</span>
                <span className="font-medium" data-testid="text-year-built">
                  {property.yearBuilt}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground mb-3 flex items-center">
              <i className="fas fa-dollar-sign text-green-600 mr-2"></i>
              Financial Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Down Payment:</span>
                <span className="font-medium" data-testid="text-downpayment">
                  {formatCurrency(analysis.calculatedDownpayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Closing Costs:</span>
                <span className="font-medium" data-testid="text-closing-costs">
                  {formatCurrency(analysis.calculatedClosingCosts)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Initial Costs:</span>
                <span className="font-medium" data-testid="text-initial-costs">
                  {formatCurrency(analysis.calculatedInitialFixedCosts)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground font-medium">Total Cash:</span>
                <span className="font-bold text-primary" data-testid="text-total-cash">
                  {formatCurrency(analysis.totalCashNeeded)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Cash Flow:</span>
                <span className={`font-medium ${analysis.cashFlowPositive ? 'text-green-600' : 'text-red-600'}`} data-testid="text-cash-flow">
                  {formatDecimal(analysis.cashFlow)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maintenance Reserve:</span>
                <span className="font-medium" data-testid="text-maintenance-reserve">
                  {formatCurrency(analysis.estimatedMaintenanceReserve)}/mo
                </span>
              </div>
            </div>
          </div>

          {/* Investment Metrics */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground mb-3 flex items-center">
              <i className="fas fa-chart-line text-blue-600 mr-2"></i>
              Investment Metrics
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">1% Rule</span>
                <Badge 
                  variant={analysis.passes1PercentRule ? "default" : "destructive"}
                  className="metric-badge text-xs"
                  data-testid="badge-one-percent-rule"
                >
                  <i className={`fas ${analysis.passes1PercentRule ? 'fa-check' : 'fa-times'} mr-1`}></i>
                  {analysis.passes1PercentRule ? 'PASS' : 'FAIL'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cash Flow</span>
                <Badge 
                  variant={analysis.cashFlowPositive ? "default" : "destructive"}
                  className="metric-badge text-xs"
                  data-testid="badge-cash-flow"
                >
                  <i className={`fas ${analysis.cashFlowPositive ? 'fa-check' : 'fa-times'} mr-1`}></i>
                  {analysis.cashFlowPositive ? 'POSITIVE' : 'NEGATIVE'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">COC Return</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium" data-testid="text-coc-return">
                    {(analysis.cocReturn * 100).toFixed(2)}%
                  </span>
                  <Badge 
                    variant={analysis.cocMeetsBenchmark ? "default" : analysis.cocMeetsMinimum ? "secondary" : "destructive"}
                    className="metric-badge text-xs"
                    data-testid="badge-coc-status"
                  >
                    {analysis.cocMeetsBenchmark ? 'BENCHMARK' : analysis.cocMeetsMinimum ? 'MINIMUM' : 'FAIL'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cap Rate</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium" data-testid="text-cap-rate">
                    {(analysis.capRate * 100).toFixed(2)}%
                  </span>
                  <Badge 
                    variant={analysis.capMeetsBenchmark ? "default" : analysis.capMeetsMinimum ? "secondary" : "destructive"}
                    className="metric-badge text-xs"
                    data-testid="badge-cap-status"
                  >
                    {analysis.capMeetsBenchmark ? 'BENCHMARK' : analysis.capMeetsMinimum ? 'MINIMUM' : 'FAIL'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
