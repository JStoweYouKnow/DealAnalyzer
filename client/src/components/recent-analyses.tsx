import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DealAnalysis } from "@shared/schema";

interface RecentAnalysesProps {
  analyses: DealAnalysis[];
  onAddToComparison: (analysis: DealAnalysis) => void;
  isInComparison: (propertyId: string) => boolean;
}

export function RecentAnalyses({ analyses, onAddToComparison, isInComparison }: RecentAnalysesProps) {
  if (analyses.length === 0) {
    return null;
  }

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

  return (
    <Card className="analysis-card">
      <CardHeader className="border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground flex items-center">
          <i className="fas fa-history text-primary mr-3"></i>
          Recent Analyses ({analyses.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          Add any of your recently analyzed properties to the comparison dashboard
        </p>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {analyses.map((analysis, index) => (
            <div key={analysis.propertyId} className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge variant={analysis.meetsCriteria ? "default" : "destructive"} className="text-xs">
                      {analysis.meetsCriteria ? '✓ Meets Criteria' : '✗ Fails Criteria'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {analysis.analysisDate ? new Date(analysis.analysisDate).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1" title={analysis.property.address}>
                    {analysis.property.address}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {analysis.property.city}, {analysis.property.state}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <div className="font-medium">{formatCurrency(analysis.property.purchasePrice)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cash Flow:</span>
                      <div className={`font-medium ${analysis.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(analysis.cashFlow)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">COC Return:</span>
                      <div className="font-medium">{formatPercent(analysis.cocReturn)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cap Rate:</span>
                      <div className="font-medium">{formatPercent(analysis.capRate)}</div>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  <Button
                    onClick={() => onAddToComparison(analysis)}
                    disabled={!analysis.propertyId || isInComparison(analysis.propertyId)}
                    variant={isInComparison(analysis.propertyId) ? "secondary" : "default"}
                    size="sm"
                    data-testid={`button-add-to-comparison-${index}`}
                  >
                    <i className={`fas ${isInComparison(analysis.propertyId) ? 'fa-check' : 'fa-balance-scale'} mr-2`}></i>
                    {isInComparison(analysis.propertyId) ? 'Added' : 'Compare'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {analyses.length >= 10 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center text-blue-800 dark:text-blue-200">
              <i className="fas fa-info-circle mr-2"></i>
              <span className="text-sm">Showing last 10 analyses. Older analyses are automatically removed.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}