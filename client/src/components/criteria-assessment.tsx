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
      name: "Property Type Match",
      status: criteria?.property_types?.includes(property.propertyType) ?? true,
      value: property.propertyType,
      testId: "criterion-property-type"
    },
    {
      name: "Location Requirement", 
      status: property.state === criteria?.location,
      value: property.state,
      testId: "criterion-location"
    },
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

          {/* Areas for Improvement */}
          <div className="space-y-4">
            <h4 className="font-semibold text-yellow-600 flex items-center mb-4">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Investment Metrics
            </h4>
            <div className="space-y-3">
              {improvementAreas.map((area) => (
                <div 
                  key={area.name}
                  className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg"
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
                  {analysis.meetsCriteria 
                    ? " Property meets minimum requirements. Consider ways to improve returns."
                    : " Property doesn't meet all criteria. Consider negotiating price or finding better opportunities."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
