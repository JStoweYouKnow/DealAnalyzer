"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DealAnalysis } from "@dealanalyzer/types";

interface AnalysisViewerProps {
  analysis: DealAnalysis;
}

export function AnalysisViewer({ analysis }: AnalysisViewerProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_buy': return 'bg-green-600';
      case 'buy': return 'bg-green-500';
      case 'hold': return 'bg-yellow-500';
      case 'avoid': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Property Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Property Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{analysis.property.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purchase Price</p>
              <p className="font-medium">{formatCurrency(analysis.property.purchasePrice)}</p>
            </div>
            {analysis.property.monthlyRent && (
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="font-medium">{formatCurrency(analysis.property.monthlyRent)}</p>
              </div>
            )}
            {analysis.property.bedrooms && (
              <div>
                <p className="text-sm text-muted-foreground">Bedrooms / Bathrooms</p>
                <p className="font-medium">{analysis.property.bedrooms} bd / {analysis.property.bathrooms} ba</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Cash Needed</p>
              <p className="font-medium text-lg">{formatCurrency(analysis.totalCashNeeded)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Cash Flow</p>
              <p className={`font-medium text-lg ${analysis.cashFlowPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(analysis.cashFlow)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cash on Cash Return</p>
              <p className="font-medium">{formatPercent(analysis.cocReturn)}</p>
              {analysis.cocMeetsBenchmark && <Badge className="mt-1">Meets Benchmark</Badge>}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cap Rate</p>
              <p className="font-medium">{formatPercent(analysis.capRate)}</p>
              {analysis.capMeetsBenchmark && <Badge className="mt-1">Meets Benchmark</Badge>}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Down Payment</p>
              <p className="font-medium">{formatCurrency(analysis.calculatedDownpayment)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Closing Costs</p>
              <p className="font-medium">{formatCurrency(analysis.calculatedClosingCosts)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Maintenance Reserve</p>
              <p className="font-medium">{formatCurrency(analysis.estimatedMaintenanceReserve)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Badge variant={analysis.passes1PercentRule ? "default" : "secondary"}>
              {analysis.passes1PercentRule ? '✓ Passes 1% Rule' : '✗ Does Not Pass 1% Rule'}
            </Badge>
            <Badge variant={analysis.meetsCriteria ? "default" : "destructive"}>
              {analysis.meetsCriteria ? '✓ Meets Investment Criteria' : '✗ Does Not Meet Criteria'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      {analysis.aiAnalysis && (
        <>
          {/* Property Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>AI Property Assessment</span>
                <Badge className="text-lg px-3 py-1">{analysis.aiAnalysis.propertyAssessment.overallScore}/10</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Overall Assessment</h4>
                <p className="text-sm text-muted-foreground">{analysis.aiAnalysis.propertyAssessment.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Market Position</h4>
                <p className="text-sm text-muted-foreground">{analysis.aiAnalysis.propertyAssessment.marketPosition}</p>
              </div>

              {analysis.aiAnalysis.propertyAssessment.strengths.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-green-600">Strengths</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.aiAnalysis.propertyAssessment.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.aiAnalysis.propertyAssessment.redFlags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Red Flags</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.aiAnalysis.propertyAssessment.redFlags.map((flag: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Investment Recommendation</span>
                <Badge className={getRecommendationColor(analysis.aiAnalysis.investmentRecommendation.recommendation)}>
                  {analysis.aiAnalysis.investmentRecommendation.recommendation.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Confidence: {formatPercent(analysis.aiAnalysis.investmentRecommendation.confidence)}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Suggested Strategy</h4>
                <p className="text-sm text-muted-foreground">{analysis.aiAnalysis.investmentRecommendation.suggestedStrategy}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Time Horizon</h4>
                <p className="text-sm text-muted-foreground">{analysis.aiAnalysis.investmentRecommendation.timeHorizon}</p>
              </div>

              {analysis.aiAnalysis.investmentRecommendation.reasoning.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Reasoning</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.aiAnalysis.investmentRecommendation.reasoning.map((reason: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market Intelligence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Market Intelligence</span>
                <Badge className={getRiskColor(analysis.aiAnalysis.marketIntelligence.riskLevel)}>
                  {analysis.aiAnalysis.marketIntelligence.riskLevel.toUpperCase()} RISK
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Market Sentiment: {(analysis.aiAnalysis.marketIntelligence.sentimentScore * 100).toFixed(0)}%
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Competitive Analysis</h4>
                <p className="text-sm text-muted-foreground">{analysis.aiAnalysis.marketIntelligence.competitiveAnalysis}</p>
              </div>

              {analysis.aiAnalysis.marketIntelligence.marketTrends.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Market Trends</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.aiAnalysis.marketIntelligence.marketTrends.map((trend: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{trend}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Predictive Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Predictive Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Appreciation Forecast</p>
                  <p className="font-medium">{formatPercent(analysis.aiAnalysis.predictiveAnalysis.appreciationForecast / 100)} annually</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rent Growth Forecast</p>
                  <p className="font-medium">{formatPercent(analysis.aiAnalysis.predictiveAnalysis.rentGrowthForecast / 100)} annually</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Exit Strategy</h4>
                <p className="text-sm text-muted-foreground">{analysis.aiAnalysis.predictiveAnalysis.exitStrategy}</p>
              </div>

              {analysis.aiAnalysis.predictiveAnalysis.keyRisks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-yellow-600">Key Risks</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.aiAnalysis.predictiveAnalysis.keyRisks.map((risk: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Analysis Date */}
      {analysis.analysisDate && (
        <p className="text-xs text-muted-foreground text-center">
          Analysis completed on {new Date(analysis.analysisDate).toLocaleString()}
        </p>
      )}
    </div>
  );
}
