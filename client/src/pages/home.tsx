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
import comfortFinderLogo from "@/assets/comfort-finder-logo.png";
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header 
        className="border-b border-border sticky top-0 z-50"
        style={{ backgroundColor: '#1e7b1a' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <img 
                src={comfortFinderLogo} 
                alt="The Comfort Finder Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>

            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-xl font-bold text-foreground">The Comfort Finder</h1>
            </div>
            
            <nav className="flex items-center space-x-6">
              <a href="/" className="font-medium flex items-center text-foreground">
                <i className="fas fa-home mr-2"></i>Home
              </a>
              <a href="/deals" className="font-medium flex items-center transition-colors opacity-75 hover:opacity-100 text-foreground">
                <i className="fas fa-inbox mr-2"></i>Email Deal Pipeline
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Find Your Perfect Investment Property</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your property data files to instantly analyze investment potential and find your comfort zone
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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

        {/* Section Divider */}
        <div className="section-divider"></div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Left Panel - File Upload */}
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

      </main>
    </div>
  );
}
