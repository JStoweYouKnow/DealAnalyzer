import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DealAnalysis, CriteriaResponse } from "@shared/schema";

interface STRMetricsProps {
  analysis: DealAnalysis;
  criteria?: CriteriaResponse;
}

export function STRMetrics({ analysis, criteria }: STRMetricsProps) {
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

  // Don't render if no STR data
  if (!analysis.projectedAnnualRevenue && !analysis.property.adr) {
    return null;
  }

  return (
    <Card className="analysis-card">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar-alt text-blue-600"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Short-Term Rental Metrics</h3>
              <p className="text-sm text-muted-foreground">Projected STR performance analysis</p>
            </div>
          </div>
          
          {analysis.strMeetsCriteria !== null && (
            <Badge 
              variant={analysis.strMeetsCriteria ? "default" : "destructive"}
              className="metric-badge flex items-center space-x-2"
              data-testid="badge-str-criteria-status"
            >
              <i className={`fas ${analysis.strMeetsCriteria ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
              <span>{analysis.strMeetsCriteria ? 'MEETS STR CRITERIA' : 'BELOW STR CRITERIA'}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* STR Performance Metrics */}
          <div className="space-y-4">
            <h4 className="font-semibold text-blue-600 flex items-center mb-3">
              <i className="fas fa-chart-line mr-2"></i>
              Performance Metrics
            </h4>
            <div className="space-y-3">
              {analysis.property.adr && (
                <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-sm font-medium">Average Daily Rate</span>
                  <span className="font-bold text-blue-600" data-testid="text-adr">
                    {formatCurrency(analysis.property.adr)}
                  </span>
                </div>
              )}
              
              {analysis.property.occupancyRate && (
                <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-sm font-medium">Occupancy Rate</span>
                  <span className="font-bold text-blue-600" data-testid="text-occupancy-rate">
                    {formatPercent(analysis.property.occupancyRate)}
                  </span>
                </div>
              )}
              
              {analysis.projectedAnnualRevenue && (
                <div className="flex justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <span className="text-sm font-medium">Annual Revenue</span>
                  <span className="font-bold text-green-600" data-testid="text-annual-revenue">
                    {formatCurrency(analysis.projectedAnnualRevenue)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Investment Returns */}
          <div className="space-y-4">
            <h4 className="font-semibold text-purple-600 flex items-center mb-3">
              <i className="fas fa-percentage mr-2"></i>
              Investment Returns
            </h4>
            <div className="space-y-3">
              {analysis.projectedGrossYield && (
                <div className="flex justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <span className="text-sm font-medium">Gross Yield</span>
                  <span className="font-bold text-purple-600" data-testid="text-gross-yield">
                    {formatPercent(analysis.projectedGrossYield)}
                  </span>
                </div>
              )}
              
              {analysis.strNetIncome && (
                <div className="flex justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <span className="text-sm font-medium">Monthly Net Income</span>
                  <span className={`font-bold ${analysis.strNetIncome > 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-str-net-income">
                    {formatCurrency(analysis.strNetIncome)}
                  </span>
                </div>
              )}
              
              {analysis.totalMonthlyExpenses && (
                <div className="flex justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <span className="text-sm font-medium">Monthly Expenses</span>
                  <span className="font-bold text-red-600" data-testid="text-str-monthly-expenses">
                    {formatCurrency(analysis.totalMonthlyExpenses)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Criteria Assessment */}
          <div className="space-y-4">
            <h4 className="font-semibold text-yellow-600 flex items-center mb-3">
              <i className="fas fa-clipboard-check mr-2"></i>
              STR Criteria
            </h4>
            <div className="space-y-3">
              {criteria?.str_adr_minimum && analysis.property.adr && (
                <div className={`flex justify-between p-3 rounded-lg ${
                  analysis.property.adr >= criteria.str_adr_minimum 
                    ? 'bg-green-50 dark:bg-green-950/20' 
                    : 'bg-red-50 dark:bg-red-950/20'
                }`}>
                  <span className="text-sm font-medium">ADR Requirement</span>
                  <Badge 
                    variant={analysis.property.adr >= criteria.str_adr_minimum ? "default" : "destructive"}
                    className="text-xs"
                    data-testid="badge-adr-criteria"
                  >
                    {analysis.property.adr >= criteria.str_adr_minimum ? '✓' : '✗'} {formatCurrency(criteria.str_adr_minimum)}
                  </Badge>
                </div>
              )}
              
              {criteria?.str_occupancy_rate_minimum && analysis.property.occupancyRate && (
                <div className={`flex justify-between p-3 rounded-lg ${
                  analysis.property.occupancyRate >= criteria.str_occupancy_rate_minimum 
                    ? 'bg-green-50 dark:bg-green-950/20' 
                    : 'bg-red-50 dark:bg-red-950/20'
                }`}>
                  <span className="text-sm font-medium">Occupancy Target</span>
                  <Badge 
                    variant={analysis.property.occupancyRate >= criteria.str_occupancy_rate_minimum ? "default" : "destructive"}
                    className="text-xs"
                    data-testid="badge-occupancy-criteria"
                  >
                    {analysis.property.occupancyRate >= criteria.str_occupancy_rate_minimum ? '✓' : '✗'} {formatPercent(criteria.str_occupancy_rate_minimum)}
                  </Badge>
                </div>
              )}
              
              {criteria?.str_gross_yield_minimum && analysis.projectedGrossYield && (
                <div className={`flex justify-between p-3 rounded-lg ${
                  analysis.projectedGrossYield >= criteria.str_gross_yield_minimum 
                    ? 'bg-green-50 dark:bg-green-950/20' 
                    : 'bg-red-50 dark:bg-red-950/20'
                }`}>
                  <span className="text-sm font-medium">Yield Target</span>
                  <Badge 
                    variant={analysis.projectedGrossYield >= criteria.str_gross_yield_minimum ? "default" : "destructive"}
                    className="text-xs"
                    data-testid="badge-yield-criteria"
                  >
                    {analysis.projectedGrossYield >= criteria.str_gross_yield_minimum ? '✓' : '✗'} {formatPercent(criteria.str_gross_yield_minimum)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STR vs Traditional Rental Comparison */}
        {analysis.projectedAnnualRevenue && (
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4 border-l-4 border-yellow-400">
            <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center">
              <i className="fas fa-balance-scale mr-2"></i>
              STR vs Traditional Rental Comparison
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-yellow-700 dark:text-yellow-300">STR Annual Revenue:</span>
                <span className="ml-2 font-bold">{formatCurrency(analysis.projectedAnnualRevenue)}</span>
              </div>
              <div>
                <span className="text-yellow-700 dark:text-yellow-300">Traditional Annual Rent:</span>
                <span className="ml-2 font-bold">{formatCurrency(analysis.property.monthlyRent * 12)}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              <i className="fas fa-info-circle mr-1"></i>
              STR revenue is {analysis.projectedAnnualRevenue > (analysis.property.monthlyRent * 12) ? 'higher' : 'lower'} than traditional rental by{' '}
              {formatCurrency(Math.abs(analysis.projectedAnnualRevenue - (analysis.property.monthlyRent * 12)))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}