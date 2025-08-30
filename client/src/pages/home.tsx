import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<DealAnalysis | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<DealAnalysis[]>([]);
  const { toast } = useToast();
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
  });

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (data: { emailContent?: string; file?: File; strMetrics?: any; monthlyExpenses?: any }) => {
      if (data.file) {
        // Handle file upload
        const formData = new FormData();
        formData.append('file', data.file);
        if (data.strMetrics) {
          formData.append('strMetrics', JSON.stringify(data.strMetrics));
        }
        if (data.monthlyExpenses) {
          formData.append('monthlyExpenses', JSON.stringify(data.monthlyExpenses));
        }
        
        const response = await fetch('/api/analyze-file', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json() as Promise<AnalyzePropertyResponse>;
      } else {
        // Handle text input (existing functionality)
        const response = await apiRequest("POST", "/api/analyze", {
          emailContent: data.emailContent,
          strMetrics: data.strMetrics,
          monthlyExpenses: data.monthlyExpenses,
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

  const handleAnalyze = (data: { emailContent?: string; file?: File; strMetrics?: any; monthlyExpenses?: any }) => {
    analysisMutation.mutate(data);
  };

  const handleAnalysisUpdate = (updatedAnalysis: DealAnalysis) => {
    setAnalysisResult(updatedAnalysis);
    // Also update in recent analyses
    setRecentAnalyses(prev => 
      prev.map(analysis => 
        analysis.propertyId === updatedAnalysis.propertyId ? updatedAnalysis : analysis
      )
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-home text-primary-foreground text-sm"></i>
                </div>
                <h1 className="text-xl font-bold gradient-text">Real Estate Deal Analyzer</h1>
              </div>
              <div className="deployment-badge px-3 py-1 rounded-full text-white text-xs font-medium flex items-center space-x-2">
                <div className="status-indicator w-2 h-2"></div>
                <span>LIVE ON REPLIT</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="api-status px-3 py-1 rounded-md text-xs font-medium text-green-800 flex items-center space-x-2">
                <i className="fas fa-server text-green-600"></i>
                <span>API Connected</span>
              </div>
              
              <nav className="hidden md:flex space-x-6">
                <a href="#analyzer" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  <i className="fas fa-calculator mr-2"></i>Analyzer
                </a>
                <a href="#criteria" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  <i className="fas fa-cog mr-2"></i>Criteria
                </a>
                <a href="#reports" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  <i className="fas fa-chart-line mr-2"></i>Reports
                </a>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Investment Property Analysis</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Paste your real estate listing email below to instantly analyze investment potential against your buy box criteria
          </p>
        </div>

        {/* Criteria Configuration */}
        <div className="mb-8">
          <CriteriaConfig 
            criteria={criteria}
            onUpdate={() => {
              // Invalidate criteria cache to refresh
              window.location.reload();
            }}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Left Panel - Email Input */}
          <div className="xl:col-span-2">
            <AnalyzerForm 
              onAnalyze={handleAnalyze}
              isLoading={analysisMutation.isPending}
              data-testid="analyzer-form"
            />
          </div>

          {/* Right Panel - Analysis Results */}
          <div className="xl:col-span-3">
            {analysisMutation.isPending && <LoadingState data-testid="loading-state" />}
            
            {analysisResult && !analysisMutation.isPending && (
              <AnalysisResults 
                analysis={analysisResult} 
                criteria={criteria}
                onAnalysisUpdate={handleAnalysisUpdate}
                onAddToComparison={addToComparison}
                isInComparison={isInComparison(analysisResult.propertyId)}
                data-testid="analysis-results"
              />
            )}
            
            {!analysisResult && !analysisMutation.isPending && (
              <div className="bg-card rounded-lg border border-border shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-line text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                <p className="text-muted-foreground">Paste your property email content and click analyze to get started</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
