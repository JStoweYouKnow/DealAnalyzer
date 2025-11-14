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
      <FinancialBreakdown key={`financial-${analysis.propertyId}-${analysis.analysisDate}`} analysis={analysis} />
      <STRMetrics analysis={analysis} criteria={criteria} onAnalysisUpdate={onAnalysisUpdate} />
      <InteractiveCharts 
        key={`charts-${analysis.propertyId}-${analysis.analysisDate}`}
        analysis={analysis} 
        criteria={criteria}
        comparisonAnalyses={comparisonAnalyses}
      />
      <MapIntegration 
        key={`map-${analysis.propertyId}-${analysis.analysisDate}`}
        analysis={analysis}
        comparisonAnalyses={comparisonAnalyses}
      />
      {analysis.aiAnalysis && <AIInsights key={`ai-${analysis.propertyId}-${analysis.analysisDate}`} aiAnalysis={analysis.aiAnalysis} />}
      <CriteriaAssessment key={`criteria-${analysis.propertyId}-${analysis.analysisDate}`} analysis={analysis} criteria={criteria} />
    </div>
  );
}
