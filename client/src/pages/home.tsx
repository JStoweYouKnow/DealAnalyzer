import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AnalyzerForm } from "@/components/analyzer-form";
import { AnalysisResults } from "@/components/analysis-results";
import { LoadingState } from "@/components/loading-state";
import { useToast } from "@/hooks/use-toast";
import type { AnalyzePropertyResponse, DealAnalysis, CriteriaResponse } from "@shared/schema";

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<DealAnalysis | null>(null);
  const { toast } = useToast();

  // Get investment criteria
  const { data: criteria } = useQuery<CriteriaResponse>({
    queryKey: ["/api/criteria"],
  });

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (emailContent: string) => {
      const response = await apiRequest("POST", "/api/analyze", { emailContent });
      return response.json() as Promise<AnalyzePropertyResponse>;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAnalysisResult(data.data);
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

  const handleAnalyze = (data: { emailContent: string; strMetrics?: any; monthlyExpenses?: any }) => {
    analysisMutation.mutate(data.emailContent); // For now, just pass email content until backend is updated
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

        {/* API Integration Status */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-server text-green-600 text-xl"></i>
            </div>
            <h3 className="font-semibold mb-2">Backend API</h3>
            <p className="text-sm text-muted-foreground mb-3">Express.js server running on Replit</p>
            <div className="metric-badge bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">Connected</div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fab fa-python text-blue-600 text-xl"></i>
            </div>
            <h3 className="font-semibold mb-2">Python Analysis</h3>
            <p className="text-sm text-muted-foreground mb-3">Email parsing & financial calculations</p>
            <div className="metric-badge bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">Active</div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fab fa-react text-purple-600 text-xl"></i>
            </div>
            <h3 className="font-semibold mb-2">React Frontend</h3>
            <p className="text-sm text-muted-foreground mb-3">Built & served statically</p>
            <div className="metric-badge bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs">Deployed</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground">Deployment Info</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-cloud text-primary"></i>
                  <span>Hosted on Replit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-code text-primary"></i>
                  <span>React + Express.js</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-database text-primary"></i>
                  <span>Python Analysis Engine</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground">Features</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Email Parsing</div>
                <div>Financial Analysis</div>
                <div>Criteria Evaluation</div>
                <div>Investment Metrics</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground">API Endpoints</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div><code>/api/analyze</code></div>
                <div><code>/api/criteria</code></div>
                <div><code>/api/history</code></div>
                <div><code>/api/health</code></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground">Resources</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-primary hover:text-primary/80 transition-colors flex items-center space-x-2">
                  <i className="fas fa-book"></i>
                  <span>User Guide</span>
                </a>
                <a href="#" className="text-primary hover:text-primary/80 transition-colors flex items-center space-x-2">
                  <i className="fas fa-cog"></i>
                  <span>API Documentation</span>
                </a>
                <a href="#" className="text-primary hover:text-primary/80 transition-colors flex items-center space-x-2">
                  <i className="fas fa-github"></i>
                  <span>Source Code</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-6 mt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Real Estate Deal Analyzer. Production deployment on Replit.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
