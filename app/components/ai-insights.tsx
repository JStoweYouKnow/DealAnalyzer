import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AIAnalysis } from "@shared/schema";

interface AIInsightsProps {
  aiAnalysis: AIAnalysis;
}

export function AIInsights({ aiAnalysis }: AIInsightsProps) {
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy': return 'bg-green-600 text-white';
      case 'buy': return 'bg-green-500 text-white';
      case 'hold': return 'bg-yellow-500 text-white';
      case 'avoid': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatRecommendation = (rec: string) => {
    return rec.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6" data-testid="ai-insights">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <i className="fas fa-brain text-primary"></i>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">AI Investment Insights</h3>
          <p className="text-sm text-muted-foreground">Powered by advanced analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Assessment */}
        <Card className="analysis-card">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-card-foreground">Property Assessment</h4>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-primary">{aiAnalysis.propertyAssessment.overallScore}</span>
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Score</span>
                <span className="text-sm text-muted-foreground">{aiAnalysis.propertyAssessment.overallScore * 10}%</span>
              </div>
              <Progress value={aiAnalysis.propertyAssessment.overallScore * 10} className="h-2" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">{aiAnalysis.propertyAssessment.description}</p>
              <p className="text-sm text-muted-foreground">{aiAnalysis.propertyAssessment.marketPosition}</p>
            </div>

            {aiAnalysis.propertyAssessment.strengths.length > 0 && (
              <div>
                <h5 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center">
                  <i className="fas fa-check-circle mr-2"></i>
                  Strengths
                </h5>
                <ul className="space-y-1">
                  {aiAnalysis.propertyAssessment.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <i className="fas fa-plus text-green-600 mr-2 mt-1 text-xs"></i>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiAnalysis.propertyAssessment.redFlags.length > 0 && (
              <div>
                <h5 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Red Flags
                </h5>
                <ul className="space-y-1">
                  {aiAnalysis.propertyAssessment.redFlags.map((flag, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <i className="fas fa-minus text-red-600 mr-2 mt-1 text-xs"></i>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Intelligence */}
        <Card className="analysis-card">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-card-foreground">Market Intelligence</h4>
              <Badge className={getRiskColor(aiAnalysis.marketIntelligence.riskLevel)}>
                {aiAnalysis.marketIntelligence.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Market Sentiment</span>
                <span className="text-sm text-muted-foreground">
                  {aiAnalysis.marketIntelligence.sentimentScore > 0 ? 'Positive' : 
                   aiAnalysis.marketIntelligence.sentimentScore < 0 ? 'Negative' : 'Neutral'}
                </span>
              </div>
              <Progress 
                value={(aiAnalysis.marketIntelligence.sentimentScore + 1) * 50} 
                className="h-2" 
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">{aiAnalysis.marketIntelligence.competitiveAnalysis}</p>
            </div>

            {aiAnalysis.marketIntelligence.marketTrends.length > 0 && (
              <div>
                <h5 className="font-medium text-card-foreground mb-2">Market Trends</h5>
                <ul className="space-y-1">
                  {aiAnalysis.marketIntelligence.marketTrends.map((trend, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <i className="fas fa-chart-line text-primary mr-2 mt-1 text-xs"></i>
                      {trend}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Recommendation */}
        <Card className="analysis-card">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-card-foreground">Investment Recommendation</h4>
              <Badge className={getRecommendationColor(aiAnalysis.investmentRecommendation.recommendation)}>
                {formatRecommendation(aiAnalysis.investmentRecommendation.recommendation)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Confidence Level</span>
                <span className="text-sm text-muted-foreground">{Math.round(aiAnalysis.investmentRecommendation.confidence * 100)}%</span>
              </div>
              <Progress value={aiAnalysis.investmentRecommendation.confidence * 100} className="h-2" />
            </div>

            <div>
              <p className="text-sm font-medium text-card-foreground mb-2">Strategy: {aiAnalysis.investmentRecommendation.suggestedStrategy}</p>
              <p className="text-sm text-muted-foreground mb-3">Timeline: {aiAnalysis.investmentRecommendation.timeHorizon}</p>
            </div>

            {aiAnalysis.investmentRecommendation.reasoning.length > 0 && (
              <div>
                <h5 className="font-medium text-card-foreground mb-2">Key Reasoning</h5>
                <ul className="space-y-1">
                  {aiAnalysis.investmentRecommendation.reasoning.map((reason, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <i className="fas fa-lightbulb text-yellow-600 mr-2 mt-1 text-xs"></i>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Predictive Analysis */}
        <Card className="analysis-card">
          <CardHeader className="border-b border-border">
            <h4 className="font-semibold text-card-foreground">Predictive Analysis</h4>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-primary">{aiAnalysis.predictiveAnalysis.appreciationForecast.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Annual Appreciation</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-primary">{aiAnalysis.predictiveAnalysis.rentGrowthForecast.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Rent Growth</div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-card-foreground mb-2">Exit Strategy</h5>
              <p className="text-sm text-muted-foreground">{aiAnalysis.predictiveAnalysis.exitStrategy}</p>
            </div>

            {aiAnalysis.predictiveAnalysis.keyRisks.length > 0 && (
              <div>
                <h5 className="font-medium text-card-foreground mb-2">Key Risks to Monitor</h5>
                <ul className="space-y-1">
                  {aiAnalysis.predictiveAnalysis.keyRisks.map((risk, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <i className="fas fa-shield-alt text-orange-600 mr-2 mt-1 text-xs"></i>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}