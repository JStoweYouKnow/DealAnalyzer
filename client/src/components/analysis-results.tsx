import { PropertyOverview } from "./property-overview";
import { FinancialBreakdown } from "./financial-breakdown";
import { STRMetrics } from "./str-metrics";
import { CriteriaAssessment } from "./criteria-assessment";
import { ConfettiCelebration } from "./confetti-celebration";
import type { DealAnalysis, CriteriaResponse } from "@shared/schema";

interface AnalysisResultsProps {
  analysis: DealAnalysis;
  criteria?: CriteriaResponse;
  onAnalysisUpdate?: (updatedAnalysis: DealAnalysis) => void;
}

export function AnalysisResults({ analysis, criteria, onAnalysisUpdate }: AnalysisResultsProps) {
  return (
    <div className="space-y-6">
      <ConfettiCelebration 
        trigger={analysis.meetsCriteria} 
      />
      <PropertyOverview analysis={analysis} onAnalysisUpdate={onAnalysisUpdate} />
      <FinancialBreakdown analysis={analysis} />
      <STRMetrics analysis={analysis} criteria={criteria} onAnalysisUpdate={onAnalysisUpdate} />
      <CriteriaAssessment analysis={analysis} criteria={criteria} />
    </div>
  );
}
