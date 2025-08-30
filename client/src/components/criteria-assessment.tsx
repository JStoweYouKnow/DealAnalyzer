import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DealAnalysis, CriteriaResponse } from "@shared/schema";

interface CriteriaAssessmentProps {
  analysis: DealAnalysis;
  criteria?: CriteriaResponse;
}

export function CriteriaAssessment({ analysis, criteria }: CriteriaAssessmentProps) {
  const { property } = analysis;

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

  // Calculate 1% rule percentage
  const onePercentRule = (property.monthlyRent / property.purchasePrice) * 100;

  const passingCriteria = [
    {
      name: "Price Under Max",
      status: property.purchasePrice <= (criteria?.max_purchase_price ?? 300000),
      value: `${formatCurrency(property.purchasePrice)} < ${formatCurrency(criteria?.max_purchase_price ?? 300000)}`,
      testId: "criterion-price"
    },
    {
      name: "1% Rule",
      status: analysis.passes1PercentRule,
      value: `${onePercentRule.toFixed(2)}%`,
      testId: "criterion-one-percent"
    },
    {
      name: "Positive Cash Flow",
      status: analysis.cashFlowPositive,
      value: `${formatCurrency(analysis.cashFlow)}/mo`,
      testId: "criterion-cash-flow"
    }
  ];

  const improvementAreas = [
    {
      name: "COC Return",
      status: analysis.cocMeetsBenchmark ? "benchmark" : analysis.cocMeetsMinimum ? "minimum" : "fail",
      value: `${formatPercent(analysis.cocReturn)} (Min: ${formatPercent(criteria?.coc_minimum_min ?? 0.05)}-${formatPercent(criteria?.coc_minimum_max ?? 0.07)})`,
      testId: "improvement-coc"
    },
    {
      name: "Cap Rate", 
      status: analysis.capMeetsBenchmark ? "benchmark" : analysis.capMeetsMinimum ? "minimum" : "fail",
      value: `${formatPercent(analysis.capRate)} (Min: ${formatPercent(criteria?.cap_minimum ?? 0.04)})`,
      testId: "improvement-cap"
    }
  ];

  // Add STR-specific criteria if available
  if (analysis.projectedAnnualRevenue && criteria) {
    const strCriteria = [
      {
        name: "STR Annual Revenue",
        status: criteria.str_annual_revenue_minimum ? 
          analysis.projectedAnnualRevenue >= criteria.str_annual_revenue_minimum : true,
        value: `${formatCurrency(analysis.projectedAnnualRevenue)}${criteria.str_annual_revenue_minimum ? ` (Min: ${formatCurrency(criteria.str_annual_revenue_minimum)})` : ''}`,
        testId: "criterion-str-revenue"
      },
      {
        name: "STR Gross Yield",
        status: criteria.str_gross_yield_minimum && analysis.projectedGrossYield ? 
          analysis.projectedGrossYield >= criteria.str_gross_yield_minimum : true,
        value: `${analysis.projectedGrossYield ? formatPercent(analysis.projectedGrossYield) : 'N/A'}${criteria.str_gross_yield_minimum ? ` (Min: ${formatPercent(criteria.str_gross_yield_minimum)})` : ''}`,
        testId: "criterion-str-yield"
      }
    ];
    
    passingCriteria.push(...strCriteria);
  }

  // Generate dynamic recommendation based on property performance
  const getRecommendationText = (analysis: DealAnalysis, passingCriteria: any[], improvementAreas: any[]) => {
    const allCriteriaPassing = passingCriteria.every(c => c.status);
    const allMetricsPassing = improvementAreas.every(area => area.status === "benchmark" || area.status === "minimum");
    const hasBenchmarkMetrics = improvementAreas.some(area => area.status === "benchmark");
    const failedCriteria = passingCriteria.filter(c => !c.status);
    const failedMetrics = improvementAreas.filter(area => area.status === "fail");

    // Excellent property - exceeds conditions
    if (allCriteriaPassing && allMetricsPassing && hasBenchmarkMetrics) {
      return " 🌟 Excellent investment opportunity! This property exceeds benchmark criteria. Consider moving forward quickly or exploring value-add opportunities to maximize returns.";
    }
    
    // Good property - meets all conditions
    if (allCriteriaPassing && allMetricsPassing) {
      return " ✅ Solid investment that meets all criteria. Consider strategies to boost cash flow or cap rate above benchmark levels for even better returns.";
    }
    
    // Marginal property - meets basic criteria but weak metrics
    if (allCriteriaPassing && !allMetricsPassing) {
      const suggestions = [];
      if (failedMetrics.some(m => m.name === "COC Return")) {
        suggestions.push("increase down payment to improve cash-on-cash return");
      }
      if (failedMetrics.some(m => m.name === "Cap Rate")) {
        suggestions.push("negotiate a lower purchase price to improve cap rate");
      }
      return ` ⚠️ Property meets basic criteria but has weak returns. Consider: ${suggestions.join(" or ")} before proceeding.`;
    }
    
    // Failed property - specific advice
    if (!allCriteriaPassing || !allMetricsPassing) {
      const issues = [];
      if (failedCriteria.some(c => c.name === "Price Under Max")) {
        issues.push("negotiate lower purchase price");
      }
      if (failedCriteria.some(c => c.name === "1% Rule")) {
        issues.push("find higher rent comps or lower purchase price");
      }
      if (failedCriteria.some(c => c.name === "Positive Cash Flow")) {
        issues.push("reduce expenses or increase rent");
      }
      if (failedMetrics.length > 0) {
        issues.push("improve investment returns through better financing or pricing");
      }
      return ` ❌ Property doesn't meet criteria. Focus on: ${issues.slice(0, 2).join(" and ")}. Consider looking for better opportunities.`;
    }
    
    return " Property analysis complete. Review metrics for investment decision.";
  };

  return (
    <Card className="analysis-card">
      <CardHeader className="border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground flex items-center">
          <i className="fas fa-clipboard-check text-primary mr-3"></i>
          Buy Box Criteria Assessment
        </h3>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Passing Criteria */}
          <div className="space-y-4">
            <h4 className="font-semibold text-green-600 flex items-center mb-4">
              <i className="fas fa-check-circle mr-2"></i>
              Passing Criteria
            </h4>
            <div className="space-y-3">
              {passingCriteria.map((criterion) => (
                <div 
                  key={criterion.name}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    criterion.status 
                      ? 'bg-green-50 dark:bg-green-950/20' 
                      : 'bg-red-50 dark:bg-red-950/20'
                  }`}
                  data-testid={criterion.testId}
                >
                  <span className="text-sm font-medium">{criterion.name}</span>
                  <Badge 
                    variant={criterion.status ? "default" : "destructive"}
                    className="metric-badge text-xs"
                  >
                    {criterion.status ? '✓' : '✗'} {criterion.value}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Investment Metrics */}
          <div className="space-y-4">
            <h4 className={`font-semibold flex items-center mb-4 ${
              improvementAreas.every(area => area.status === "benchmark" || area.status === "minimum") 
                ? 'text-green-600' 
                : 'text-yellow-600'
            }`}>
              <i className={`mr-2 ${
                improvementAreas.every(area => area.status === "benchmark" || area.status === "minimum") 
                  ? 'fas fa-check-circle' 
                  : 'fas fa-exclamation-triangle'
              }`}></i>
              Investment Metrics
            </h4>
            <div className="space-y-3">
              {improvementAreas.map((area) => (
                <div 
                  key={area.name}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    area.status === "benchmark" || area.status === "minimum" 
                      ? 'bg-green-50 dark:bg-green-950/20' 
                      : 'bg-red-50 dark:bg-red-950/20'
                  }`}
                  data-testid={area.testId}
                >
                  <span className="text-sm font-medium">{area.name}</span>
                  <Badge 
                    variant={
                      area.status === "benchmark" ? "default" :
                      area.status === "minimum" ? "secondary" : "destructive"
                    }
                    className="metric-badge text-xs"
                  >
                    {area.value}
                  </Badge>
                </div>
              ))}
              
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <i className="fas fa-lightbulb mr-2"></i>
                  <strong>Recommendation:</strong> 
                  {getRecommendationText(analysis, passingCriteria, improvementAreas)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
