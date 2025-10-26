"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DealAnalysis, CriteriaResponse } from "@shared/schema";

interface QuickCompareProps {
  analyses: DealAnalysis[];
  criteria?: CriteriaResponse;
  onRemoveProperty?: (propertyId: string) => void;
  onClearAll?: () => void;
}

export function QuickCompare({ analyses, criteria, onRemoveProperty, onClearAll }: QuickCompareProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'purchasePrice', 'monthlyRent', 'cashFlow', 'cocReturn', 'capRate', 'passes1PercentRule'
  ]);

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

  const getMetricValue = (analysis: DealAnalysis, metric: string) => {
    switch (metric) {
      case 'purchasePrice':
        return formatCurrency(analysis.property.purchasePrice);
      case 'monthlyRent':
        return formatCurrency(analysis.property.monthlyRent);
      case 'cashFlow':
        return formatCurrency(analysis.cashFlow);
      case 'cocReturn':
        return formatPercent(analysis.cocReturn);
      case 'capRate':
        return formatPercent(analysis.capRate);
      case 'passes1PercentRule':
        return analysis.passes1PercentRule ? '✓ Yes' : '✗ No';
      case 'meetsCriteria':
        return analysis.meetsCriteria ? '✓ Meets' : '✗ Fails';
      case 'totalCashNeeded':
        return formatCurrency(analysis.totalCashNeeded);
      default:
        return 'N/A';
    }
  };

  const getMetricComparison = (analyses: DealAnalysis[], metric: string, currentIndex: number) => {
    if (analyses.length < 2) return 'neutral';
    
    const values = analyses.map(analysis => {
      switch (metric) {
        case 'purchasePrice':
          return analysis.property.purchasePrice;
        case 'monthlyRent':
          return analysis.property.monthlyRent;
        case 'cashFlow':
          return analysis.cashFlow;
        case 'cocReturn':
          return analysis.cocReturn;
        case 'capRate':
          return analysis.capRate;
        case 'totalCashNeeded':
          return analysis.totalCashNeeded;
        default:
          return 0;
      }
    });

    const currentValue = values[currentIndex];
    const otherValues = values.filter((_, index) => index !== currentIndex);
    const maxOther = Math.max(...otherValues);
    const minOther = Math.min(...otherValues);

    // For metrics where higher is better (rent, cash flow, returns)
    if (['monthlyRent', 'cashFlow', 'cocReturn', 'capRate'].includes(metric)) {
      if (currentValue > maxOther) return 'best';
      if (currentValue < minOther) return 'worst';
      return 'middle';
    }
    
    // For metrics where lower is better (price, cash needed)
    if (['purchasePrice', 'totalCashNeeded'].includes(metric)) {
      if (currentValue < minOther) return 'best';
      if (currentValue > maxOther) return 'worst';
      return 'middle';
    }
    
    return 'neutral';
  };

  const getComparisonIcon = (comparison: string) => {
    switch (comparison) {
      case 'best':
        return <i className="fas fa-arrow-up text-green-600"></i>;
      case 'worst':
        return <i className="fas fa-arrow-down text-red-600"></i>;
      case 'middle':
        return <i className="fas fa-minus text-yellow-600"></i>;
      default:
        return null;
    }
  };

  const getComparisonColor = (comparison: string) => {
    switch (comparison) {
      case 'best':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'worst':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      case 'middle':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800';
    }
  };

  const metrics = [
    { key: 'purchasePrice', label: 'Purchase Price', icon: 'fa-dollar-sign' },
    { key: 'monthlyRent', label: 'Monthly Rent', icon: 'fa-home' },
    { key: 'cashFlow', label: 'Cash Flow', icon: 'fa-chart-line' },
    { key: 'cocReturn', label: 'COC Return', icon: 'fa-percentage' },
    { key: 'capRate', label: 'Cap Rate', icon: 'fa-chart-pie' },
    { key: 'totalCashNeeded', label: 'Total Cash Needed', icon: 'fa-wallet' },
    { key: 'passes1PercentRule', label: '1% Rule', icon: 'fa-check-circle' },
    { key: 'meetsCriteria', label: 'Meets Criteria', icon: 'fa-clipboard-check' },
  ];

  if (analyses.length === 0) {
    return (
      <Card className="analysis-card">
        <CardHeader>
          <h3 className="text-lg font-semibold text-card-foreground flex items-center">
            <i className="fas fa-balance-scale text-primary mr-3"></i>
            Quick Compare Dashboard
          </h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-balance-scale text-2xl text-muted-foreground"></i>
            </div>
            <h4 className="text-lg font-semibold mb-2">No Properties to Compare</h4>
            <p className="text-muted-foreground">
              Analyze properties to add them to your comparison dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="analysis-card">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-card-foreground flex items-center">
            <i className="fas fa-balance-scale text-primary mr-3"></i>
            Quick Compare Dashboard ({analyses.length} Properties)
          </h3>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClearAll}
              data-testid="button-clear-comparison"
            >
              <i className="fas fa-trash mr-2"></i>
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Property Headers */}
        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${analyses.length}, 1fr)` }}>
          <div className="font-medium text-sm text-muted-foreground">Metric</div>
          {analyses.map((analysis, index) => (
            <div key={analysis.propertyId || `analysis-${index}`} className="text-center">
              <div className="bg-muted rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={analysis.meetsCriteria ? "default" : "destructive"} className="text-xs">
                    {analysis.meetsCriteria ? '✓ Meets' : '✗ Fails'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveProperty?.(analysis.propertyId)}
                    className="h-6 w-6 p-0 hover:bg-red-100"
                    data-testid={`button-remove-property-${index}`}
                  >
                    <i className="fas fa-times text-xs"></i>
                  </Button>
                </div>
                <div className="font-medium text-sm truncate" title={analysis.property.address}>
                  {analysis.property.address}
                </div>
                <div className="text-xs text-muted-foreground">
                  {analysis.property.city}, {analysis.property.state}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Metrics Comparison */}
        <div className="space-y-2">
          {metrics.filter(metric => selectedMetrics.includes(metric.key)).map((metric) => (
            <div key={metric.key} className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${analyses.length}, 1fr)` }}>
              <div className="flex items-center py-3 px-2">
                <i className={`fas ${metric.icon} text-primary mr-2`}></i>
                <span className="font-medium text-sm">{metric.label}</span>
              </div>
              
              {analyses.map((analysis, index) => {
                const comparison = getMetricComparison(analyses, metric.key, index);
                return (
                  <div
                    key={`${analysis.propertyId || `analysis-${index}`}-${metric.key}`}
                    className={`p-3 rounded-lg border text-center ${getComparisonColor(comparison)}`}
                    data-testid={`metric-${metric.key}-${index}`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {getComparisonIcon(comparison)}
                      <span className="font-medium text-sm">
                        {getMetricValue(analysis, metric.key)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Summary */}
        <Separator className="my-6" />
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
          <div className="flex items-start">
            <i className="fas fa-lightbulb text-blue-600 mr-3 mt-1"></i>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Comparison Summary</h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <div>• Properties meeting criteria: {analyses.filter(a => a.meetsCriteria).length} of {analyses.length}</div>
                <div>• Average cash flow: {formatCurrency(analyses.reduce((sum, a) => sum + a.cashFlow, 0) / analyses.length)}</div>
                <div>• Average COC return: {formatPercent(analyses.reduce((sum, a) => sum + a.cocReturn, 0) / analyses.length)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}