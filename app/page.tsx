"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Authenticated, Unauthenticated } from 'convex/react';
import { SignInButton, UserButton } from '@clerk/nextjs';
import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
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

export default function HomePage() {
  return (
    <>
      <Authenticated>
        <AuthenticatedContent />
      </Authenticated>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Welcome to The Comfort Finder</h1>
            <p className="text-muted-foreground">Sign in to start analyzing real estate deals</p>
            <SignInButton>
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
                Sign In to Get Started
              </button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}

function AuthenticatedContent() {
  const [analysisResult, setAnalysisResult] = useState<DealAnalysis | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<DealAnalysis[]>([]);
  const { toast } = useToast();
  
  // Get user's email deals from Convex
  const emailDeals = useConvexQuery(api.emailDeals.list, {});
  const { 
    comparisonList, 
    addToComparison, 
    removeFromComparison, 
    clearComparison, 
    isInComparison 
  } = useComparison();

  // Get investment criteria
  const { data: criteria } = useQuery<CriteriaResponse>({
    queryKey: ["api", "criteria"],
  });

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (data: { emailContent?: string; file?: File; strMetrics?: any; ltrMetrics?: any; monthlyExpenses?: any }) => {
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
          ltrMetrics: data.ltrMetrics,
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

  const handleAnalyze = (data: { emailContent?: string; file?: File; strMetrics?: any; ltrMetrics?: any; monthlyExpenses?: any }) => {
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
    <div className="container mx-auto px-4 py-8">
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

      {/* Email Deals from Convex */}
      {emailDeals && emailDeals.length > 0 && (
        <>
          <div className="section-divider"></div>
          <div className="mt-8">
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-4">Your Email Deals ({emailDeals.length})</h3>
              <p className="text-muted-foreground">
                You have {emailDeals.length} email deals synced from your Gmail account.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

