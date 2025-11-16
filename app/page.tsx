"use client";

import { useState, useEffect, useRef } from "react";
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
  // Don't auto-load last analysis - start fresh each time
  const [analysisResult, setAnalysisResult] = useState<DealAnalysis | null>(null);

  const [recentAnalyses, setRecentAnalyses] = useState<DealAnalysis[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dealanalyzer_recent_analyses');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to load recent analyses from localStorage:', e);
        localStorage.removeItem('dealanalyzer_recent_analyses');
      }
    }
    return [];
  });

  const [mortgageValues, setMortgageValues] = useState<MortgageValues | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dealanalyzer_mortgage_values');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' &&
              typeof parsed.loanAmount === 'number' &&
              typeof parsed.monthlyPayment === 'number' &&
              typeof parsed.loanTermYears === 'number' &&
              Number.isInteger(parsed.loanTermYears) &&
              parsed.loanTermYears > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to load mortgage values from localStorage:', e);
        localStorage.removeItem('dealanalyzer_mortgage_values');
      }
    }
    return null;
  });

  const [lastAnalysisData, setLastAnalysisData] = useState<{ emailContent?: string; file?: File; strMetrics?: any; ltrMetrics?: any; monthlyExpenses?: any; fundingSource?: any; } | null>(null);
  const [currentFormValues, setCurrentFormValues] = useState<{ strMetrics?: any; ltrMetrics?: any; monthlyExpenses?: any; fundingSource?: any; file?: File } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track if this is the initial mount to avoid unnecessary localStorage writes
  const isInitialMount = useRef(true);

  // Helper function to safely save to localStorage with quota error handling
  const safeLocalStorageSave = (key: string, data: any) => {
    if (typeof window === 'undefined') return false;

    try {
      const serialized = JSON.stringify(data);
      // Check if data is too large (mobile browsers typically have 5-10MB limit)
      const sizeInMB = new Blob([serialized]).size / (1024 * 1024);

      if (sizeInMB > 4) { // Warn at 4MB to leave headroom
        console.warn(`Large data size (${sizeInMB.toFixed(2)}MB) for key: ${key}. May cause issues on mobile.`);
        toast({
          title: "Storage Warning",
          description: "Analysis data is large. Consider clearing old analyses to free up space.",
          variant: "destructive",
        });
      }

      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage:`, e);

      // Check if it's a quota exceeded error
      if (e instanceof Error && (e.name === 'QuotaExceededError' || e.message.includes('quota'))) {
        toast({
          title: "Storage Full",
          description: "Browser storage is full. Please clear some data to continue saving analyses.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Storage Error",
          description: "Failed to save data. Your browser may be in private mode or storage is disabled.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  // Save to localStorage whenever state changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (analysisResult) {
      // Strip sensitive data before saving (don't save full property description/emails)
      const sanitizedAnalysis = {
        ...analysisResult,
        property: {
          ...analysisResult.property,
          // Keep only essential property data, strip potentially sensitive email content
          description: analysisResult.property.description?.substring(0, 200) || '',
        }
      };
      safeLocalStorageSave('dealanalyzer_current_analysis', sanitizedAnalysis);
    }
  }, [analysisResult]);

  useEffect(() => {
    if (recentAnalyses.length > 0) {
      // Sanitize recent analyses as well
      const sanitizedRecent = recentAnalyses.map(analysis => ({
        ...analysis,
        property: {
          ...analysis.property,
          description: analysis.property.description?.substring(0, 200) || '',
        }
      }));
      safeLocalStorageSave('dealanalyzer_recent_analyses', sanitizedRecent);
    }
  }, [recentAnalyses]);

  useEffect(() => {
    if (mortgageValues) {
      safeLocalStorageSave('dealanalyzer_mortgage_values', mortgageValues);
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
      try {
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
          return await response.json() as AnalyzePropertyResponse;
        }
      } catch (error) {
        // Catch any errors including memory issues on mobile
        console.error('Analysis mutation error:', error);

        // Check if it's a memory/quota error
        if (error instanceof Error) {
          if (error.message.includes('memory') || error.message.includes('quota') || error.message.includes('out of memory')) {
            throw new Error('Analysis failed due to insufficient memory. Try using a smaller file or clearing old data.');
          }
        }

        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Ensure propertyId exists, generate one if missing
        if (!data.data.propertyId) {
          data.data.propertyId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        }
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

  const handleClearAllData = () => {
    if (confirm('⚠️ Clear All Data?\n\nThis will permanently delete all saved analyses, mortgage values, and property data from this browser.\n\nThis cannot be undone. Continue?')) {
      try {
        // Clear all state
        setAnalysisResult(null);
        setRecentAnalyses([]);
        setMortgageValues(null);
        setLastAnalysisData(null);
        setCurrentFormValues(null);

        // Clear all localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dealanalyzer_current_analysis');
          localStorage.removeItem('dealanalyzer_recent_analyses');
          localStorage.removeItem('dealanalyzer_mortgage_values');

          // Also clear comparison list from localStorage
          localStorage.removeItem('dealanalyzer_comparison_list');
        }

        toast({
          title: "Data Cleared",
          description: "All saved analyses and data have been permanently deleted.",
        });
      } catch (e) {
        console.error('Failed to clear data:', e);
        toast({
          title: "Clear Failed",
          description: "Some data could not be cleared. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Criteria Configuration with Privacy Controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <CriteriaConfig
              criteria={criteria}
              onUpdate={() => {
                // Invalidate criteria cache to refresh both dashboard and account page
                queryClient.invalidateQueries({ queryKey: ['/api/criteria'] });
              }}
            />
          </div>
          <div className="ml-4 flex gap-2">
            {(recentAnalyses.length > 0 || analysisResult) && (
              <Button
                onClick={handleClearAllData}
                variant="outline"
                size="sm"
                className="gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                title="Clear all saved analyses and data from this browser"
              >
                <i className="fas fa-trash-alt"></i>
                Clear All Data
              </Button>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        {(recentAnalyses.length > 0 || analysisResult) && (
          <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <i className="fas fa-shield-alt text-yellow-600 dark:text-yellow-400 mt-0.5"></i>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Privacy Notice:</strong> Your analysis data is saved locally in your browser for convenience.
                This data persists across sessions. Use "Clear All Data" to remove all saved information from this device.
              </div>
            </div>
          </div>
        )}
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

