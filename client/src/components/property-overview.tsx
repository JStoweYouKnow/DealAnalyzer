import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DealAnalysis, AnalyzePropertyResponse } from "@shared/schema";

interface PropertyOverviewProps {
  analysis: DealAnalysis;
  onAnalysisUpdate?: (updatedAnalysis: DealAnalysis) => void;
}

export function PropertyOverview({ analysis, onAnalysisUpdate }: PropertyOverviewProps) {
  const { property } = analysis;
  const [editableRent, setEditableRent] = useState(property.monthlyRent);
  const [editableBedrooms, setEditableBedrooms] = useState(property.bedrooms);
  const [editableBathrooms, setEditableBathrooms] = useState(property.bathrooms);
  const [isEditingRent, setIsEditingRent] = useState(false);
  const [isEditingBeds, setIsEditingBeds] = useState(false);
  const { toast } = useToast();

  // Fetch rental comps mutation
  const fetchRentalCompsMutation = useMutation({
    mutationFn: async (property: { address: string; bedrooms: number; bathrooms: number; squareFootage?: number }) => {
      const response = await apiRequest('POST', '/api/rental-comps', property);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setEditableRent(data.data.averageRent);
        toast({
          title: "Rental Comps Found",
          description: `Average rent: ${formatCurrency(data.data.averageRent)} (${data.data.properties.length} comps, ${data.data.confidence} confidence)`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Rental Comps Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for updating rent and re-analyzing
  const updateRentMutation = useMutation({
    mutationFn: async (newRent: number) => {
      const updatedProperty = { ...property, monthlyRent: newRent };
      const response = await apiRequest("POST", "/api/update-rent", {
        property: updatedProperty,
      });
      return response.json() as Promise<AnalyzePropertyResponse>;
    },
    onSuccess: (data) => {
      if (data.success && data.data && onAnalysisUpdate) {
        onAnalysisUpdate(data.data);
        setIsEditingRent(false);
        toast({
          title: "Rent Updated",
          description: "Analysis and criteria assessment refreshed with new rent data.",
        });
      } else {
        toast({
          title: "Update Failed",
          description: data.error || "Failed to update rent",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating bedrooms/bathrooms and re-analyzing
  const updateBedsAndBathsMutation = useMutation({
    mutationFn: async ({ bedrooms, bathrooms }: { bedrooms: number; bathrooms: number }) => {
      const updatedProperty = { ...property, bedrooms, bathrooms };
      const response = await apiRequest("POST", "/api/update-property", {
        property: updatedProperty,
      });
      return response.json() as Promise<AnalyzePropertyResponse>;
    },
    onSuccess: (data) => {
      if (data.success && data.data && onAnalysisUpdate) {
        onAnalysisUpdate(data.data);
        setIsEditingBeds(false);
        toast({
          title: "Beds/Baths Updated",
          description: "Analysis and criteria assessment refreshed with new bedroom/bathroom data.",
        });
      } else {
        toast({
          title: "Update Failed",
          description: data.error || "Failed to update beds/baths",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRentUpdate = async () => {
    if (editableRent !== property.monthlyRent && editableRent >= 0) {
      updateRentMutation.mutate(editableRent);
    } else {
      setIsEditingRent(false);
      setEditableRent(property.monthlyRent); // Reset to original value
    }
  };

  const handleBedsAndBathsUpdate = async () => {
    if ((editableBedrooms !== property.bedrooms || editableBathrooms !== property.bathrooms) && 
        editableBedrooms >= 0 && editableBathrooms >= 0) {
      updateBedsAndBathsMutation.mutate({ bedrooms: editableBedrooms, bathrooms: editableBathrooms });
    } else {
      setIsEditingBeds(false);
      setEditableBedrooms(property.bedrooms); // Reset to original values
      setEditableBathrooms(property.bathrooms);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDecimal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="analysis-card">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-home text-primary"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Property Analysis</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-property-address">
                {property.address}
              </p>
            </div>
          </div>
          
          <Badge 
            variant={analysis.meetsCriteria ? "default" : "destructive"}
            className="metric-badge flex items-center space-x-2"
            data-testid="badge-criteria-status"
          >
            <i className={`fas ${analysis.meetsCriteria ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
            <span>{analysis.meetsCriteria ? 'MEETS CRITERIA' : 'DOES NOT MEET CRITERIA'}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Property Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground mb-3 flex items-center">
              <i className="fas fa-info-circle text-primary mr-2"></i>
              Property Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium text-primary" data-testid="text-purchase-price">
                  {formatCurrency(property.purchasePrice)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Monthly Rent:</span>
                <div className="flex items-center space-x-2">
                  {isEditingRent ? (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        value={editableRent}
                        onChange={(e) => setEditableRent(Number(e.target.value))}
                        onBlur={handleRentUpdate}
                        onKeyDown={(e) => e.key === 'Enter' && handleRentUpdate()}
                        className="w-24 h-6 text-right text-sm"
                        data-testid="input-monthly-rent"
                      />
                      <button
                        onClick={() => {
                          if (property.address && editableBedrooms && editableBathrooms) {
                            fetchRentalCompsMutation.mutate({
                              address: property.address,
                              bedrooms: editableBedrooms,
                              bathrooms: editableBathrooms,
                              squareFootage: property.squareFootage
                            });
                          } else {
                            toast({
                              title: "Missing Information",
                              description: "Need address, bedrooms, and bathrooms to fetch rental comps",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={fetchRentalCompsMutation.isPending}
                        className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 hover:border-blue-300 transition-colors"
                        data-testid="button-rental-comps"
                      >
                        <i className="fas fa-search mr-1"></i>
                        {fetchRentalCompsMutation.isPending ? 'Searching...' : 'Get Rental Comps'}
                      </button>
                    </div>
                  ) : (
                    <span 
                      className="font-medium text-green-600 cursor-pointer hover:bg-green-50 px-1 rounded" 
                      data-testid="text-monthly-rent"
                      onClick={() => setIsEditingRent(true)}
                      title="Click to edit monthly rent"
                    >
                      {formatCurrency(editableRent)}
                    </span>
                  )}
                  <button
                    onClick={() => setIsEditingRent(!isEditingRent)}
                    className="text-xs text-muted-foreground hover:text-primary"
                    title={isEditingRent ? "Cancel" : "Edit rent"}
                  >
                    <i className={`fas ${isEditingRent ? 'fa-times' : 'fa-edit'}`}></i>
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Beds/Baths:</span>
                <div className="flex items-center space-x-2">
                  {isEditingBeds ? (
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        value={editableBedrooms}
                        onChange={(e) => setEditableBedrooms(Number(e.target.value))}
                        onBlur={handleBedsAndBathsUpdate}
                        onKeyDown={(e) => e.key === 'Enter' && handleBedsAndBathsUpdate()}
                        className="w-16 h-6 text-right text-sm"
                        data-testid="input-bedrooms"
                        min="0"
                        max="20"
                      />
                      <span className="text-xs text-muted-foreground">/</span>
                      <Input
                        type="number"
                        value={editableBathrooms}
                        onChange={(e) => setEditableBathrooms(Number(e.target.value))}
                        onBlur={handleBedsAndBathsUpdate}
                        onKeyDown={(e) => e.key === 'Enter' && handleBedsAndBathsUpdate()}
                        className="w-16 h-6 text-right text-sm"
                        data-testid="input-bathrooms"
                        min="0"
                        max="20"
                        step="0.5"
                      />
                    </div>
                  ) : (
                    <span 
                      className="font-medium cursor-pointer hover:bg-blue-50 px-1 rounded" 
                      data-testid="text-beds-baths"
                      onClick={() => setIsEditingBeds(true)}
                      title="Click to edit beds/baths"
                    >
                      {editableBedrooms}/{editableBathrooms}
                    </span>
                  )}
                  <button
                    onClick={() => setIsEditingBeds(!isEditingBeds)}
                    className="text-xs text-muted-foreground hover:text-primary"
                    title={isEditingBeds ? "Cancel" : "Edit beds/baths"}
                  >
                    <i className={`fas ${isEditingBeds ? 'fa-times' : 'fa-edit'}`}></i>
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Square Feet:</span>
                <span className="font-medium" data-testid="text-square-footage">
                  {property.squareFootage.toLocaleString()}
                </span>
              </div>
              {property.lotSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lot Size:</span>
                  <span className="font-medium" data-testid="text-lot-size">
                    {property.lotSize.toLocaleString()} sq ft
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground mb-3 flex items-center">
              <i className="fas fa-dollar-sign text-green-600 mr-2"></i>
              Financial Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Down Payment:</span>
                <span className="font-medium" data-testid="text-downpayment">
                  {formatCurrency(analysis.calculatedDownpayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Closing Costs:</span>
                <span className="font-medium" data-testid="text-closing-costs">
                  {formatCurrency(analysis.calculatedClosingCosts)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Initial Costs:</span>
                <span className="font-medium" data-testid="text-initial-costs">
                  {formatCurrency(analysis.calculatedInitialFixedCosts)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground font-medium">Total Cash:</span>
                <span className="font-bold text-primary" data-testid="text-total-cash">
                  {formatCurrency(analysis.totalCashNeeded)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Cash Flow:</span>
                <span className={`font-medium ${analysis.cashFlowPositive ? 'text-green-600' : 'text-red-600'}`} data-testid="text-cash-flow">
                  {formatDecimal(analysis.cashFlow)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maintenance Reserve:</span>
                <span className="font-medium" data-testid="text-maintenance-reserve">
                  {formatCurrency(analysis.estimatedMaintenanceReserve)}/mo
                </span>
              </div>
            </div>
          </div>

          {/* Investment Metrics */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground mb-3 flex items-center">
              <i className="fas fa-chart-line text-blue-600 mr-2"></i>
              Investment Metrics
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">1% Rule</span>
                <Badge 
                  variant={analysis.passes1PercentRule ? "default" : "destructive"}
                  className="metric-badge text-xs"
                  data-testid="badge-one-percent-rule"
                >
                  <i className={`fas ${analysis.passes1PercentRule ? 'fa-check' : 'fa-times'} mr-1`}></i>
                  {analysis.passes1PercentRule ? 'PASS' : 'FAIL'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cash Flow</span>
                <Badge 
                  variant={analysis.cashFlowPositive ? "default" : "destructive"}
                  className="metric-badge text-xs"
                  data-testid="badge-cash-flow"
                >
                  <i className={`fas ${analysis.cashFlowPositive ? 'fa-check' : 'fa-times'} mr-1`}></i>
                  {analysis.cashFlowPositive ? 'POSITIVE' : 'NEGATIVE'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">COC Return</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium" data-testid="text-coc-return">
                    {(analysis.cocReturn * 100).toFixed(2)}%
                  </span>
                  <Badge 
                    variant={analysis.cocMeetsBenchmark ? "default" : analysis.cocMeetsMinimum ? "secondary" : "destructive"}
                    className="metric-badge text-xs"
                    data-testid="badge-coc-status"
                  >
                    {analysis.cocMeetsBenchmark ? 'BENCHMARK' : analysis.cocMeetsMinimum ? 'MINIMUM' : 'FAIL'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cap Rate</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium" data-testid="text-cap-rate">
                    {(analysis.capRate * 100).toFixed(2)}%
                  </span>
                  <Badge 
                    variant={analysis.capMeetsBenchmark ? "default" : analysis.capMeetsMinimum ? "secondary" : "destructive"}
                    className="metric-badge text-xs"
                    data-testid="badge-cap-status"
                  >
                    {analysis.capMeetsBenchmark ? 'BENCHMARK' : analysis.capMeetsMinimum ? 'MINIMUM' : 'FAIL'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
