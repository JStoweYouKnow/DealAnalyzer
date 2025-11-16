"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { AnalyzerForm } from "@/components/analyzer-form";
import { AnalysisResults } from "@/components/analysis-results";
import { CriteriaConfig } from "@/components/criteria-config";
import { QuickCompare } from "@/components/quick-compare";
import { RecentAnalyses } from "@/components/recent-analyses";
import { Reports } from "@/components/reports";
import { LoadingState } from "@/components/loading-state";
import { useToast } from "@/hooks/use-toast";
import { useComparison } from "@/hooks/use-comparison";
import type { AnalyzePropertyResponse, DealAnalysis, CriteriaResponse } from "@shared/schema";

interface MortgageValues {
  loanAmount: number;
  loanTermYears: number;
  monthlyPayment: number;
}

export default function HomePage() {
  // Load initial state from localStorage
  const [analysisResult, setAnalysisResult] = useState<DealAnalysis | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dealanalyzer_current_analysis');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [recentAnalyses, setRecentAnalyses] = useState<DealAnalysis[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dealanalyzer_recent_analyses');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [mortgageValues, setMortgageValues] = useState<MortgageValues | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dealanalyzer_mortgage_values');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [lastAnalysisData, setLastAnalysisData] = useState<{ emailContent?: string; file?: File; strMetrics?: any; ltrMetrics?: any; monthlyExpenses?: any; fundingSource?: any; } | null>(null);
  const [currentFormValues, setCurrentFormValues] = useState<{ strMetrics?: any; ltrMetrics?: any; monthlyExpenses?: any; fundingSource?: any; file?: File } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && analysisResult) {
      localStorage.setItem('dealanalyzer_current_analysis', JSON.stringify(analysisResult));
    }
  }, [analysisResult]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dealanalyzer_recent_analyses', JSON.stringify(recentAnalyses));
    }
  }, [recentAnalyses]);

  useEffect(() => {
    if (typeof window !== 'undefined' && mortgageValues) {
      localStorage.setItem('dealanalyzer_mortgage_values', JSON.stringify(mortgageValues));
    }
  }, [mortgageValues]);

  const { 
    comparisonList, 
    addToComparison, 
    removeFromComparison, 
    clearComparison, 
    isInComparison 
  } = useComparison();

  // Get investment criteria
  const { data: criteria } = useQuery<CriteriaResponse>({
    queryKey: ["/api/criteria"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/criteria');
      return response.json();
    },
  });

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (data: { emailContent?: string; file?: File; strMetrics?: any; ltrMetrics?: any; monthlyExpenses?: any; fundingSource?: any; mortgageValues?: MortgageValues }) => {
      if (data.file) {
        // Handle file upload
        const formData = new FormData();
        formData.append('file', data.file);
        if (data.strMetrics) {
          formData.append('strMetrics', JSON.stringify(data.strMetrics));
        }
        if (data.ltrMetrics) {
          formData.append('ltrMetrics', JSON.stringify(data.ltrMetrics));
        }
        if (data.monthlyExpenses) {
          formData.append('monthlyExpenses', JSON.stringify(data.monthlyExpenses));
        }
        if (data.fundingSource) {
          formData.append('fundingSource', data.fundingSource);
        }
        if (data.mortgageValues) {
          formData.append('mortgageValues', JSON.stringify(data.mortgageValues));
        }
        
        const response = await fetch('/api/analyze-file', {
          method: 'POST',
          body: formData,
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          // Try to extract error message from response
          const errorMessage = responseData.error || responseData.message || `HTTP error! status: ${response.status}`;
          const errorDetails = responseData.details || '';
          throw new Error(errorMessage + (errorDetails ? `\n${errorDetails}` : ''));
        }
        
        return responseData as AnalyzePropertyResponse;
      } else {
        // Handle text input (existing functionality)
        const response = await apiRequest("POST", "/api/analyze", {
          emailContent: data.emailContent,
          strMetrics: data.strMetrics,
          ltrMetrics: data.ltrMetrics,
          monthlyExpenses: data.monthlyExpenses,
          fundingSource: data.fundingSource,
          mortgageValues: data.mortgageValues,
        });
        return response.json() as Promise<AnalyzePropertyResponse>;
      }
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAnalysisResult(data.data);
        // Add to recent analyses (keep last 10)
        setRecentAnalyses(prev => {
          const updated = [data.data!, ...prev.filter(a => a.propertyId !== data.data!.propertyId)];
          return updated.slice(0, 10);
        });
        toast({
          title: "Analysis Complete",
          description: data.data.meetsCriteria 
            ? "Property meets investment criteria!" 
            : "Property does not meet minimum criteria.",
          variant: data.data.meetsCriteria ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = (data: { emailContent?: string; file?: File; strMetrics?: any; ltrMetrics?: any; monthlyExpenses?: any; fundingSource?: any; mortgageValues?: MortgageValues }) => {
    // Store the analysis data for re-analysis
    setLastAnalysisData(data);
    analysisMutation.mutate(data);
  };

  const handleReAnalyze = () => {
    if (lastAnalysisData && currentFormValues) {
      // Re-run analysis with stored file/email but current form values and mortgage values
      analysisMutation.mutate({
        file: currentFormValues.file || lastAnalysisData.file,
        emailContent: lastAnalysisData.emailContent,
        strMetrics: currentFormValues.strMetrics,
        ltrMetrics: currentFormValues.ltrMetrics,
        monthlyExpenses: currentFormValues.monthlyExpenses,
        fundingSource: currentFormValues.fundingSource,
        mortgageValues: mortgageValues || undefined,
      });
    }
  };

  const handleAnalysisUpdate = (updatedAnalysis: DealAnalysis) => {
    setAnalysisResult(updatedAnalysis);
    // Also update in recent analyses
    setRecentAnalyses(prev => 
      prev.map(analysis => 
        analysis.propertyId === updatedAnalysis.propertyId ? updatedAnalysis : analysis
      )
    );
    
    // Show toast notification about criteria refresh
    toast({
      title: "Analysis Updated",
      description: updatedAnalysis.meetsCriteria 
        ? "Property now meets investment criteria!" 
        : "Criteria assessment refreshed with updated data.",
      variant: updatedAnalysis.meetsCriteria ? "default" : "destructive",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Criteria Configuration */}
      <div className="mb-8">
        <CriteriaConfig 
          criteria={criteria}
          onUpdate={() => {
            // Invalidate criteria cache to refresh both dashboard and account page
            queryClient.invalidateQueries({ queryKey: ['/api/criteria'] });
          }}
        />
      </div>

      {/* Section Divider */}
      <div className="section-divider"></div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Left Panel - File Upload & Tools */}
        <div className="xl:col-span-2 space-y-6">
          <AnalyzerForm
            onAnalyze={handleAnalyze}
            isLoading={analysisMutation.isPending}
            mortgageValues={mortgageValues}
            onMortgageCalculated={setMortgageValues}
            onFormValuesChange={setCurrentFormValues}
            data-testid="analyzer-form"
          />
        </div>

        {/* Right Panel - Analysis Results */}
        <div className="xl:col-span-3">
          {analysisMutation.isPending && <LoadingState data-testid="loading-state" />}

          {analysisResult && !analysisMutation.isPending && (
            <>
              {lastAnalysisData && (
                <div className="mb-4 flex justify-end">
                  <Button
                    onClick={handleReAnalyze}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    data-testid="button-reanalyze"
                  >
                    <i className="fas fa-sync-alt"></i>
                    Re-analyze with Current Values
                  </Button>
                </div>
              )}
              <AnalysisResults
                analysis={analysisResult}
                criteria={criteria}
                onAnalysisUpdate={handleAnalysisUpdate}
                onAddToComparison={addToComparison}
                isInComparison={isInComparison(analysisResult.propertyId)}
                data-testid="analysis-results"
              />
            </>
          )}
          
          {!analysisResult && !analysisMutation.isPending && (
            <div className="bg-card rounded-lg border border-border shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-2xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
              <p className="text-muted-foreground">Upload your property file and click analyze to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <>
          <div className="section-divider"></div>
          <div className="mt-8">
            <RecentAnalyses 
              analyses={recentAnalyses}
              onAddToComparison={addToComparison}
              isInComparison={isInComparison}
            />
          </div>
        </>
      )}

      {/* Quick Compare Dashboard */}
      {comparisonList.length > 0 && (
        <>
          <div className="section-divider"></div>
          <div className="mt-8">
            <QuickCompare 
              analyses={comparisonList}
              criteria={criteria}
              onRemoveProperty={removeFromComparison}
              onClearAll={clearComparison}
            />
          </div>
        </>
      )}

      {/* Reports Section */}
      <div className="section-divider"></div>
      <div className="mt-8">
        <Reports
          analyses={analysisResult ? [analysisResult, ...recentAnalyses.filter(a => a.propertyId !== analysisResult.propertyId)] : recentAnalyses}
          comparisonList={comparisonList}
        />
      </div>
    </div>
  );
}

