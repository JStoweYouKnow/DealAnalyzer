import { PropertyOverview } from "./property-overview";
import { FinancialBreakdown } from "./financial-breakdown";
import { CriteriaAssessment } from "./criteria-assessment";
import type { DealAnalysis, CriteriaResponse } from "@shared/schema";

interface AnalysisResultsProps {
  analysis: DealAnalysis;
  criteria?: CriteriaResponse;
}

export function AnalysisResults({ analysis, criteria }: AnalysisResultsProps) {
  return (
    <div className="space-y-6">
      <PropertyOverview analysis={analysis} />
      <FinancialBreakdown analysis={analysis} />
      <CriteriaAssessment analysis={analysis} criteria={criteria} />
    </div>
  );
}
