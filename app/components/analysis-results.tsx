import { PropertyOverview } from "./property-overview";
import { FinancialBreakdown } from "./financial-breakdown";
import { STRMetrics } from "./str-metrics";
import { CriteriaAssessment } from "./criteria-assessment";
import { AIInsights } from "./ai-insights";
import { InteractiveCharts } from "./interactive-charts";
import { MapIntegration } from "./map-integration";
import { ConfettiCelebration } from "./confetti-celebration";
import { Button } from "@/components/ui/button";
import type { DealAnalysis, CriteriaResponse } from "@shared/schema";

interface AnalysisResultsProps {
  analysis: DealAnalysis;
  criteria?: CriteriaResponse;
  onAnalysisUpdate?: (updatedAnalysis: DealAnalysis) => void;
  onAddToComparison?: (analysis: DealAnalysis) => void;
  isInComparison?: boolean;
  comparisonAnalyses?: DealAnalysis[];
}

export function AnalysisResults({ analysis, criteria, onAnalysisUpdate, onAddToComparison, isInComparison, comparisonAnalyses = [] }: AnalysisResultsProps) {
  // Safety check - ensure analysis and property exist
  if (!analysis || !analysis.property) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-8 text-center">
        <div className="text-red-600">Error: Invalid analysis data</div>
      </div>
    );
  }

  // Generate unique keys with fallbacks
  const propertyId = analysis.propertyId || `temp-${Date.now()}`;
  const analysisDate = analysis.analysisDate || new Date().toISOString();
  const uniqueKey = `${propertyId}-${analysisDate}`;

  return (
    <div className="space-y-6">
      <ConfettiCelebration 
        trigger={analysis.meetsCriteria} 
      />
      
      {/* Add to Comparison Button */}
      {onAddToComparison && (
        <div className="flex justify-end">
          <Button
            onClick={() => onAddToComparison(analysis)}
            disabled={isInComparison}
            variant={isInComparison ? "secondary" : "default"}
            size="sm"
            data-testid="button-add-to-comparison"
          >
            <i className={`fas ${isInComparison ? 'fa-check' : 'fa-balance-scale'} mr-2`}></i>
            {isInComparison ? 'Added to Compare' : 'Add to Compare'}
          </Button>
        </div>
      )}
      
      <PropertyOverview analysis={analysis} onAnalysisUpdate={onAnalysisUpdate} />
      <FinancialBreakdown key={`financial-${uniqueKey}`} analysis={analysis} />
      <STRMetrics analysis={analysis} criteria={criteria} onAnalysisUpdate={onAnalysisUpdate} />
      <InteractiveCharts 
        key={`charts-${uniqueKey}`}
        analysis={analysis} 
        criteria={criteria}
        comparisonAnalyses={comparisonAnalyses}
      />
      <MapIntegration 
        key={`map-${uniqueKey}`}
        analysis={analysis}
        comparisonAnalyses={comparisonAnalyses}
      />
      {analysis.aiAnalysis && <AIInsights key={`ai-${uniqueKey}`} aiAnalysis={analysis.aiAnalysis} />}
      <CriteriaAssessment key={`criteria-${uniqueKey}`} analysis={analysis} criteria={criteria} />
    </div>
  );
}
