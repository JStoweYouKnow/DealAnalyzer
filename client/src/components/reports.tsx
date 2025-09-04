import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { DealAnalysis } from "@shared/schema";

interface ReportsProps {
  analyses: DealAnalysis[];
  comparisonList: DealAnalysis[];
}

export function Reports({ analyses, comparisonList }: ReportsProps) {
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [reportTitle, setReportTitle] = useState('Property Analysis Report');
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeComparison, setIncludeComparison] = useState(false);
  const { toast } = useToast();

  // Combine analyses and comparison list, avoiding duplicates
  const allAnalyses = [...analyses, ...comparisonList.filter(comp => 
    comp.id && !analyses.some(analysis => analysis.id === comp.id)
  )].filter(analysis => analysis.id); // Only include analyses with valid IDs

  // Reset selected analyses when the analyses list changes (e.g., when rent is updated)
  useEffect(() => {
    // Clear invalid selections when analyses change
    setSelectedAnalyses(prev => {
      const validIds = allAnalyses.map(a => a.id).filter((id): id is string => Boolean(id));
      return prev.filter(id => validIds.includes(id));
    });
  }, [analyses, comparisonList]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const handleSelectAll = () => {
    if (selectedAnalyses.length === allAnalyses.length) {
      setSelectedAnalyses([]);
    } else {
      setSelectedAnalyses(allAnalyses.map(a => a.id).filter((id): id is string => Boolean(id)));
    }
  };

  const handleSelectAnalysis = (analysisId: string) => {
    setSelectedAnalyses(prev => {
      if (prev.includes(analysisId)) {
        return prev.filter(id => id !== analysisId);
      } else {
        return [...prev, analysisId];
      }
    });
  };

  const generateReport = async (format: 'pdf' | 'csv') => {
    if (selectedAnalyses.length === 0) {
      toast({
        title: "No Properties Selected",
        description: "Please select at least one property to include in the report.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisIds: selectedAnalyses,
          format,
          title: reportTitle,
          includeComparison
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition ? 
        contentDisposition.split('filename=')[1]?.replace(/"/g, '') : 
        `report.${format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: `${format.toUpperCase()} report has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (allAnalyses.length === 0) {
    return (
      <Card className="analysis-card">
        <CardHeader>
          <h3 className="text-lg font-semibold text-card-foreground flex items-center">
            <i className="fas fa-file-alt text-primary mr-3"></i>
            Reports
          </h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-file-alt text-2xl text-muted-foreground"></i>
            </div>
            <h4 className="text-lg font-semibold mb-2">No Properties Available</h4>
            <p className="text-muted-foreground">
              Analyze properties to generate reports with detailed financial analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="analysis-card">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground flex items-center">
              <i className="fas fa-file-alt text-primary mr-3"></i>
              Generate Reports
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create PDF or CSV reports from your property analyses
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => generateReport('pdf')}
              disabled={isGenerating || selectedAnalyses.length === 0}
              data-testid="button-generate-pdf"
            >
              <i className="fas fa-file-pdf mr-2"></i>
              {isGenerating ? 'Generating...' : 'Generate PDF'}
            </Button>
            <Button
              onClick={() => generateReport('csv')}
              disabled={isGenerating || selectedAnalyses.length === 0}
              variant="outline"
              data-testid="button-generate-csv"
            >
              <i className="fas fa-file-csv mr-2"></i>
              {isGenerating ? 'Generating...' : 'Generate CSV'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Report Configuration */}
        <div className="mb-6 space-y-4">
          <div>
            <Label htmlFor="reportTitle">Report Title</Label>
            <Input
              id="reportTitle"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Enter report title"
              data-testid="input-report-title"
            />
          </div>
          
          {comparisonList.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeComparison"
                checked={includeComparison}
                onCheckedChange={(checked) => setIncludeComparison(checked as boolean)}
              />
              <Label htmlFor="includeComparison">Include comparison analysis</Label>
            </div>
          )}
        </div>

        {/* Property Selection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Select Properties to Include</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              data-testid="button-select-all"
            >
              {selectedAnalyses.length === allAnalyses.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allAnalyses.map((analysis, index) => {
              const analysisId = analysis.id || `temp-${analysis.property.address}-${index}`;
              return (
                <div
                  key={analysisId}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedAnalyses.includes(analysisId) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectAnalysis(analysisId)}
                  data-testid={`property-card-${analysisId}`}
                >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedAnalyses.includes(analysisId)}
                      onCheckedChange={() => {}} // Handled by parent div click
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-medium text-sm">{analysis.property.address}</h5>
                        <Badge variant={analysis.meetsCriteria ? "default" : "destructive"} className="text-xs">
                          {analysis.meetsCriteria ? '✓ Meets' : '✗ Fails'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {analysis.property.city}, {analysis.property.state}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <div className="font-medium">{formatCurrency(analysis.property.purchasePrice)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cash Flow:</span>
                          <div className={`font-medium ${analysis.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(analysis.cashFlow)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">COC Return:</span>
                          <div className="font-medium">{formatPercent(analysis.cocReturn)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cap Rate:</span>
                          <div className="font-medium">{formatPercent(analysis.capRate)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Selection Summary */}
        {selectedAnalyses.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
            <div className="flex items-center text-blue-800 dark:text-blue-200">
              <i className="fas fa-info-circle mr-2"></i>
              <span className="text-sm">
                {selectedAnalyses.length} {selectedAnalyses.length === 1 ? 'property' : 'properties'} selected for report generation
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}