"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import comfortFinderLogo from "@/assets/comfort-finder-logo.png";
import type { EmailDeal, EmailMonitoringResponse, AnalyzePropertyResponse } from "@shared/schema";

export default function DealsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'reviewed' | 'analyzed' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDeal, setEditingDeal] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: {price?: number, rent?: number, adr?: number, occupancyRate?: number, bedrooms?: number, bathrooms?: number}}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email deals
  const { data: emailDeals = [], isLoading, refetch } = useQuery<EmailDeal[]>({
    queryKey: ['/api/email-deals'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-deals');
      const data = await response.json();
      console.log('Email deals response:', data);
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  // Connect Gmail mutation
  const connectGmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/gmail-auth-url');
      const data = await response.json();
      if (data.success && data.authUrl) {
        // Open in new tab to avoid iframe restrictions
        window.open(data.authUrl, '_blank');
        toast({
          title: "Connecting to Gmail",
          description: "Redirecting to Google authentication...",
        });
      } else {
        throw new Error(data.error || "Failed to get Gmail auth URL");
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Gmail Connection Initiated",
        description: "Complete the authentication in the new window.",
      });
    },
    onError: (error: Error) => {
      console.error("Gmail connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Gmail. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Sync emails mutation
  const syncEmailsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sync-emails');
      return response.json() as Promise<EmailMonitoringResponse>;
    },
    onSuccess: (data) => {
      console.log('Sync response:', data);
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/email-deals'] });
        toast({
          title: "Emails Synced",
          description: `Found ${data.data?.length || 0} new real estate emails`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Analyze deal mutation
  const analyzeDealMutation = useMutation({
    mutationFn: async (deal: EmailDeal) => {
      const response = await apiRequest('POST', '/api/analyze-email-deal', {
        dealId: deal.id,
        emailContent: deal.emailContent
      });
      return response.json() as Promise<AnalyzePropertyResponse>;
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/email-deals'] });
        toast({
          title: "Deal Analyzed",
          description: "Property analysis completed successfully",
        });
      }
    }
  });

  // Update deal status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ dealId, status }: { dealId: string; status: EmailDeal['status'] }) => {
      const response = await apiRequest('PUT', `/api/email-deals/${dealId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-deals'] });
    }
  });

  // Fetch rental comps mutation
  const fetchRentalCompsMutation = useMutation({
    mutationFn: async (property: { address: string; bedrooms: number; bathrooms: number; squareFootage?: number }) => {
      const response = await apiRequest('POST', '/api/rental-comps', property);
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        const dealId = Object.keys(editValues).find(id => editingDeal === id) || editingDeal;
        if (dealId) {
          setEditValues(prev => ({
            ...prev,
            [dealId]: {
              ...prev[dealId],
              rent: data.data.averageRent
            }
          }));
        }
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

  // Fetch Airbnb data mutation
  const fetchAirbnbDataMutation = useMutation({
    mutationFn: async (property: { address: string; bedrooms: number; bathrooms: number; squareFootage?: number }) => {
      const response = await apiRequest('POST', '/api/airbnb-data', property);
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        const dealId = Object.keys(editValues).find(id => editingDeal === id) || editingDeal;
        if (dealId) {
          setEditValues(prev => ({
            ...prev,
            [dealId]: {
              ...prev[dealId],
              adr: data.data.averageDailyRate,
              occupancyRate: Math.round(data.data.occupancyRate * 100) // Convert to percentage
            }
          }));
        }
        toast({
          title: "Airbnb Data Found",
          description: `ADR: $${data.data.averageDailyRate}, Occupancy: ${Math.round(data.data.occupancyRate * 100)}% (${data.data.properties.length} comps, ${data.data.confidence} confidence)`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Airbnb Data Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ dealId, price, rent, adr, occupancyRate, bedrooms, bathrooms }: { 
      dealId: string; 
      price: number; 
      rent: number;
      adr?: number;
      occupancyRate?: number;
      bedrooms?: number;
      bathrooms?: number;
    }) => {
      const deal = emailDeals.find(d => d.id === dealId);
      if (!deal || !deal.extractedProperty) {
        throw new Error('Deal or property not found');
      }
      
      // First, update the extractedProperty with the new values
      const updatedExtractedProperty = {
        ...deal.extractedProperty,
        price: price,
        monthlyRent: rent,
        adr: adr !== undefined ? adr : deal.extractedProperty?.adr,
        occupancyRate: occupancyRate !== undefined ? occupancyRate : deal.extractedProperty?.occupancyRate,
        bedrooms: bedrooms !== undefined ? bedrooms : deal.extractedProperty?.bedrooms,
        bathrooms: bathrooms !== undefined ? bathrooms : deal.extractedProperty?.bathrooms
      };
      
      // Update the email deal's extractedProperty
      const updateResponse = await apiRequest('PUT', `/api/email-deals/${dealId}`, { 
        extractedProperty: updatedExtractedProperty
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update deal');
      }
      
      // Then run analysis with the updated property data
      const analysisResponse = await apiRequest('POST', '/api/analyze-email-deal', { 
        dealId: dealId,
        emailContent: deal.emailContent
      });
      return analysisResponse.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-deals'] });
      setEditingDeal(null);
      setEditValues(prev => ({ ...prev, [variables.dealId]: {} }));
      toast({
        title: "Property Updated",
        description: "Property data has been updated and re-analyzed",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ dealId, analysisId, format = 'pdf' }: { dealId: string; analysisId?: string; format?: 'pdf' | 'csv' }) => {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // If analysisId exists, use it; otherwise use dealId
          ...(analysisId ? { analysisIds: [analysisId] } : { dealIds: [dealId] }),
          format,
          title: 'Property Analysis Report'
        }),
      });
      
      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to generate report: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // Verify content type is correct
      const contentType = response.headers.get('Content-Type');
      const expectedContentType = format === 'pdf' ? 'application/pdf' : 'text/csv';
      if (contentType && !contentType.includes(expectedContentType)) {
        const errorText = await response.text();
        throw new Error(`Unexpected response type: ${contentType}. Error: ${errorText}`);
      }
      
      // Handle file download
      const blob = await response.blob();
      
      // Verify blob is not empty and has correct size
      if (blob.size === 0) {
        throw new Error('Generated report is empty');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: (data, variables) => {
      const reportType = variables.format === 'pdf' ? 'PDF' : 'CSV';
      toast({
        title: "Report Generated",
        description: `${reportType} property report has been downloaded`,
      });
    },
    onError: (error) => {
      toast({
        title: "Report Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter deals based on status and search
  const filteredDeals = emailDeals.filter(deal => {
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    const matchesSearch = !searchTerm || 
      deal.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.extractedProperty?.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: EmailDeal['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'analyzed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
      {/* Combined Header and Dashboard */}
      <Card className="analysis-card">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Email Deal Pipeline</h1>
              <p className="text-muted-foreground">Review and analyze your real estate email opportunities</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => connectGmailMutation.mutate()}
                variant="outline"
                size="sm"
              >
                <i className="fas fa-envelope mr-2"></i>
                Connect Gmail
              </Button>
              <Button
                onClick={() => syncEmailsMutation.mutate()}
                disabled={syncEmailsMutation.isPending}
                size="sm"
              >
                <i className="fas fa-sync mr-2"></i>
                {syncEmailsMutation.isPending ? 'Syncing...' : 'Sync Emails'}
              </Button>
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <h2 className="text-lg font-semibold">Dashboard Controls</h2>
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border rounded px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="analyzed">Analyzed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Deals', count: emailDeals.length, icon: 'fa-inbox' },
            { label: 'New', count: emailDeals.filter(d => d.status === 'new').length, icon: 'fa-star' },
            { label: 'Analyzed', count: emailDeals.filter(d => d.status === 'analyzed').length, icon: 'fa-chart-line' },
            { label: 'Archived', count: emailDeals.filter(d => d.status === 'archived').length, icon: 'fa-archive' }
          ].map((stat, index) => (
            <Card key={index} className="analysis-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.count}</p>
                  </div>
                  <i className={`fas ${stat.icon} text-2xl text-primary/60`}></i>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Deals List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading deals...</div>
          ) : filteredDeals.length === 0 ? (
            <Card className="analysis-card">
              <CardContent className="p-8 text-center">
                <i className="fas fa-inbox text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">No Deals Found</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your Gmail account and sync emails to start finding real estate deals
                </p>
                <Button onClick={() => connectGmailMutation.mutate()}>
                  <i className="fas fa-envelope mr-2"></i>
                  Connect Gmail
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredDeals.map((deal) => (
              <Card key={deal.id} className="analysis-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{deal.subject}</h3>
                        <Badge className={getStatusColor(deal.status)}>
                          {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        From: {deal.sender} • {new Date(deal.receivedDate).toLocaleDateString()}
                      </p>

                      {deal.extractedProperty && (
                        <div className="space-y-4 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {deal.extractedProperty.address && (
                              <div className="md:col-span-2">
                                <span className="text-sm text-muted-foreground">Address:</span>
                                <p className="font-medium">{deal.extractedProperty.address}</p>
                                {deal.extractedProperty.city && deal.extractedProperty.state && (
                                  <p className="text-sm text-muted-foreground">{deal.extractedProperty.city}, {deal.extractedProperty.state}</p>
                                )}
                              </div>
                            )}
                            {(deal.extractedProperty.bedrooms || deal.extractedProperty.bathrooms || deal.extractedProperty.sqft) && (
                              <div className="md:col-span-2">
                                <span className="text-sm text-muted-foreground">Details:</span>
                                <p className="font-medium">
                                  {deal.extractedProperty.bedrooms && `${deal.extractedProperty.bedrooms} bd`}
                                  {deal.extractedProperty.bedrooms && deal.extractedProperty.bathrooms && ' | '}
                                  {deal.extractedProperty.bathrooms && `${deal.extractedProperty.bathrooms} ba`}
                                  {(deal.extractedProperty.bedrooms || deal.extractedProperty.bathrooms) && deal.extractedProperty.sqft && ' | '}
                                  {deal.extractedProperty.sqft && `${deal.extractedProperty.sqft.toLocaleString()} sqft`}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Editable Price and Rent Section */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div>
                              <span className="text-sm text-muted-foreground">Purchase Price:</span>
                              {editingDeal === deal.id ? (
                                <Input
                                  type="number"
                                  placeholder="Enter purchase price"
                                  value={editValues[deal.id]?.price ?? deal.analysis?.property?.purchasePrice ?? deal.extractedProperty.price ?? ''}
                                  onChange={(e) => setEditValues(prev => ({
                                    ...prev,
                                    [deal.id]: {
                                      ...prev[deal.id],
                                      price: e.target.value ? Number(e.target.value) : undefined
                                    }
                                  }))}
                                  className="mt-1"
                                  data-testid={`input-price-${deal.id}`}
                                />
                              ) : (
                                <p className="font-medium text-lg mt-1">
                                  {(deal.analysis?.property?.purchasePrice || deal.extractedProperty.price)
                                    ? formatCurrency(deal.analysis?.property?.purchasePrice || deal.extractedProperty.price || 0)
                                    : 'Not specified'}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <span className="text-sm text-muted-foreground">Monthly Rent:</span>
                              {editingDeal === deal.id ? (
                                <div className="space-y-2">
                                  <Input
                                    type="number"
                                    placeholder="Enter monthly rent"
                                    value={editValues[deal.id]?.rent ?? deal.analysis?.property?.monthlyRent ?? deal.extractedProperty.monthlyRent ?? ''}
                                    onChange={(e) => setEditValues(prev => ({
                                      ...prev,
                                      [deal.id]: {
                                        ...prev[deal.id],
                                        rent: e.target.value ? Number(e.target.value) : undefined
                                      }
                                    }))}
                                    className="mt-1"
                                    data-testid={`input-rent-${deal.id}`}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const address = deal.extractedProperty?.address || deal.analysis?.property?.address;
                                      const bedrooms = editValues[deal.id]?.bedrooms ?? deal.extractedProperty?.bedrooms ?? deal.analysis?.property?.bedrooms;
                                      const bathrooms = editValues[deal.id]?.bathrooms ?? deal.extractedProperty?.bathrooms ?? deal.analysis?.property?.bathrooms;
                                      const squareFootage = deal.extractedProperty?.sqft || deal.analysis?.property?.squareFootage;
                                      
                                      if (address && bedrooms && bathrooms) {
                                        fetchRentalCompsMutation.mutate({
                                          address,
                                          bedrooms,
                                          bathrooms,
                                          squareFootage
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
                                    className="text-xs"
                                    data-testid={`button-rental-comps-${deal.id}`}
                                  >
                                    <i className="fas fa-search mr-1"></i>
                                    {fetchRentalCompsMutation.isPending ? 'Searching...' : 'Get Rental Comps'}
                                  </Button>
                                </div>
                              ) : (
                                <p className="font-medium text-lg mt-1">
                                  {(deal.analysis?.property?.monthlyRent || deal.extractedProperty.monthlyRent)
                                    ? formatCurrency(deal.analysis?.property?.monthlyRent || deal.extractedProperty.monthlyRent || 0)
                                    : 'Not specified'}
                                </p>
                              )}
                            </div>
                            
                            {/* Airbnb ADR Section */}
                            <div>
                              <span className="text-sm text-muted-foreground">ADR (Daily Rate):</span>
                              {editingDeal === deal.id ? (
                                <div className="space-y-2">
                                  <Input
                                    type="number"
                                    placeholder="Enter daily rate"
                                    value={editValues[deal.id]?.adr ?? deal.analysis?.property?.adr ?? ''}
                                    onChange={(e) => setEditValues(prev => ({
                                      ...prev,
                                      [deal.id]: {
                                        ...prev[deal.id],
                                        adr: e.target.value ? Number(e.target.value) : undefined
                                      }
                                    }))}
                                    className="mt-1"
                                    data-testid={`input-adr-${deal.id}`}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const address = deal.extractedProperty?.address || deal.analysis?.property?.address;
                                      const bedrooms = editValues[deal.id]?.bedrooms ?? deal.extractedProperty?.bedrooms ?? deal.analysis?.property?.bedrooms;
                                      const bathrooms = editValues[deal.id]?.bathrooms ?? deal.extractedProperty?.bathrooms ?? deal.analysis?.property?.bathrooms;
                                      const squareFootage = deal.extractedProperty?.sqft || deal.analysis?.property?.squareFootage;
                                      
                                      if (address && bedrooms && bathrooms) {
                                        fetchAirbnbDataMutation.mutate({
                                          address,
                                          bedrooms,
                                          bathrooms,
                                          squareFootage
                                        });
                                      } else {
                                        toast({
                                          title: "Missing Information",
                                          description: "Need address, bedrooms, and bathrooms to fetch Airbnb data",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    disabled={fetchAirbnbDataMutation.isPending}
                                    className="text-xs"
                                    data-testid={`button-airbnb-data-${deal.id}`}
                                  >
                                    <i className="fas fa-home mr-1"></i>
                                    {fetchAirbnbDataMutation.isPending ? 'Searching...' : 'Get Airbnb Data'}
                                  </Button>
                                </div>
                              ) : (
                                <p className="font-medium text-lg mt-1">
                                  {(deal.analysis?.property?.adr || deal.extractedProperty?.adr)
                                    ? `$${deal.analysis?.property?.adr || deal.extractedProperty?.adr}`
                                    : 'Not specified'}
                                </p>
                              )}
                            </div>
                            
                            {/* Airbnb Occupancy Rate Section */}
                            <div>
                              <span className="text-sm text-muted-foreground">Occupancy Rate:</span>
                              {editingDeal === deal.id ? (
                                <Input
                                  type="number"
                                  placeholder="Enter occupancy %"
                                  min="0"
                                  max="100"
                                  value={editValues[deal.id]?.occupancyRate ?? (deal.analysis?.property?.occupancyRate ? Math.round(deal.analysis.property.occupancyRate * 100) : '') ?? ''}
                                  onChange={(e) => setEditValues(prev => ({
                                    ...prev,
                                    [deal.id]: {
                                      ...prev[deal.id],
                                      occupancyRate: e.target.value ? Number(e.target.value) : undefined
                                    }
                                  }))}
                                  className="mt-1"
                                  data-testid={`input-occupancy-${deal.id}`}
                                />
                              ) : (
                                <p className="font-medium text-lg mt-1">
                                  {(deal.analysis?.property?.occupancyRate || deal.extractedProperty?.occupancyRate)
                                    ? `${Math.round((deal.analysis?.property?.occupancyRate || deal.extractedProperty?.occupancyRate || 0) * 100)}%`
                                    : 'Not specified'}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Editable Bedroom and Bathroom Section */}
                          {editingDeal === deal.id && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                              <div>
                                <span className="text-sm text-muted-foreground">Bedrooms:</span>
                                <Input
                                  type="number"
                                  placeholder="Number of bedrooms"
                                  min="0"
                                  max="20"
                                  value={editValues[deal.id]?.bedrooms ?? deal.analysis?.property?.bedrooms ?? deal.extractedProperty?.bedrooms ?? ''}
                                  onChange={(e) => setEditValues(prev => ({
                                    ...prev,
                                    [deal.id]: {
                                      ...prev[deal.id],
                                      bedrooms: e.target.value ? Number(e.target.value) : undefined
                                    }
                                  }))}
                                  className="mt-1"
                                  data-testid={`input-bedrooms-${deal.id}`}
                                />
                              </div>
                              
                              <div>
                                <span className="text-sm text-muted-foreground">Bathrooms:</span>
                                <Input
                                  type="number"
                                  placeholder="Number of bathrooms"
                                  min="0"
                                  max="20"
                                  step="0.5"
                                  value={editValues[deal.id]?.bathrooms ?? deal.analysis?.property?.bathrooms ?? deal.extractedProperty?.bathrooms ?? ''}
                                  onChange={(e) => setEditValues(prev => ({
                                    ...prev,
                                    [deal.id]: {
                                      ...prev[deal.id],
                                      bathrooms: e.target.value ? Number(e.target.value) : undefined
                                    }
                                  }))}
                                  className="mt-1"
                                  data-testid={`input-bathrooms-${deal.id}`}
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <span className="text-sm text-muted-foreground">Current Values:</span>
                                <p className="font-medium mt-1">
                                  {deal.extractedProperty?.bedrooms || deal.analysis?.property?.bedrooms || 0} bd | {deal.extractedProperty?.bathrooms || deal.analysis?.property?.bathrooms || 0} ba
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Edit Controls */}
                          {editingDeal === deal.id ? (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const price = editValues[deal.id]?.price ?? deal.analysis?.property?.purchasePrice ?? deal.extractedProperty?.price;
                                  const rent = editValues[deal.id]?.rent ?? deal.analysis?.property?.monthlyRent ?? deal.extractedProperty?.monthlyRent;
                                  const adr = editValues[deal.id]?.adr ?? deal.analysis?.property?.adr;
                                  const occupancyRate = editValues[deal.id]?.occupancyRate ? editValues[deal.id].occupancyRate! / 100 : deal.analysis?.property?.occupancyRate;
                                  const bedrooms = editValues[deal.id]?.bedrooms ?? deal.analysis?.property?.bedrooms ?? deal.extractedProperty?.bedrooms;
                                  const bathrooms = editValues[deal.id]?.bathrooms ?? deal.analysis?.property?.bathrooms ?? deal.extractedProperty?.bathrooms;
                                  
                                  if (price && (rent || (adr && occupancyRate))) {
                                    updatePropertyMutation.mutate({ 
                                      dealId: deal.id, 
                                      price, 
                                      rent: rent || 0,
                                      adr,
                                      occupancyRate,
                                      bedrooms,
                                      bathrooms
                                    });
                                  }
                                }}
                                disabled={updatePropertyMutation.isPending || 
                                  (!editValues[deal.id]?.price && !editValues[deal.id]?.rent && !editValues[deal.id]?.adr)}
                                data-testid={`button-save-${deal.id}`}
                              >
                                <i className="fas fa-save mr-2"></i>
                                {updatePropertyMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingDeal(null);
                                  setEditValues(prev => ({ ...prev, [deal.id]: {} }));
                                }}
                                data-testid={`button-cancel-${deal.id}`}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingDeal(deal.id);
                                setEditValues(prev => ({
                                  ...prev,
                                  [deal.id]: {
                                    price: deal.analysis?.property?.purchasePrice || deal.extractedProperty?.price,
                                    rent: deal.analysis?.property?.monthlyRent || deal.extractedProperty?.monthlyRent
                                  }
                                }));
                              }}
                              data-testid={`button-edit-${deal.id}`}
                            >
                              <i className="fas fa-edit mr-2"></i>
                              Edit Price & Rent
                            </Button>
                          )}

                          {/* Property Images */}
                          {deal.extractedProperty?.imageUrls && deal.extractedProperty.imageUrls.length > 0 && (
                            <div className="mt-4">
                              <span className="text-sm text-muted-foreground">Property Images:</span>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                {deal.extractedProperty.imageUrls.slice(0, 3).map((imageUrl, index) => {
                                  const imageScore = deal.extractedProperty?.imageScores?.find(img => img.url === imageUrl);
                                  return (
                                    <div key={index} className="relative aspect-square">
                                      <img
                                        src={imageUrl}
                                        alt={`Property image ${index + 1}`}
                                        className="w-full h-full object-cover rounded-md border border-border hover:opacity-80 transition-opacity cursor-pointer"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                        onClick={() => window.open(imageUrl, '_blank')}
                                        data-testid={`image-property-${deal.id}-${index}`}
                                        title={imageScore?.aiReasoning || `Property image ${index + 1}`}
                                      />
                                      {imageScore?.aiScore && (
                                        <div className={`absolute top-1 right-1 text-xs font-bold px-1.5 py-0.5 rounded text-white shadow-sm ${
                                          imageScore.aiCategory === 'excellent' ? 'bg-green-500' :
                                          imageScore.aiCategory === 'good' ? 'bg-blue-500' :
                                          imageScore.aiCategory === 'fair' ? 'bg-yellow-500' :
                                          'bg-red-500'
                                        }`}>
                                          {imageScore.aiScore.toFixed(1)}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              {deal.extractedProperty.imageUrls.length > 3 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  +{deal.extractedProperty.imageUrls.length - 3} more images
                                </p>
                              )}
                            </div>
                          )}

                          {/* Source Links */}
                          {deal.extractedProperty?.sourceLinks && deal.extractedProperty.sourceLinks.length > 0 && (
                            <div className="mt-4">
                              <span className="text-sm text-muted-foreground">Source Links:</span>
                              <div className="space-y-1 mt-2">
                                {deal.extractedProperty.sourceLinks.slice(0, 2).map((link, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <div className="flex-shrink-0 w-4">
                                      {link.type === 'listing' && <span className="text-blue-500">🏠</span>}
                                      {link.type === 'company' && <span className="text-green-500">🏢</span>}
                                      {link.type === 'external' && <span className="text-gray-500">🔗</span>}
                                      {link.type === 'other' && <span className="text-gray-500">🔗</span>}
                                    </div>
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline truncate flex-1"
                                      title={link.aiReasoning || link.url}
                                      data-testid={`link-source-${deal.id}-${index}`}
                                    >
                                      {link.description || new URL(link.url).hostname}
                                    </a>
                                    {link.aiScore && (
                                      <div className={`text-xs font-bold px-2 py-0.5 rounded text-white shadow-sm ${
                                        link.aiCategory === 'excellent' ? 'bg-green-500' :
                                        link.aiCategory === 'good' ? 'bg-blue-500' :
                                        link.aiCategory === 'fair' ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`}>
                                        {link.aiScore.toFixed(1)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {deal.extractedProperty.sourceLinks.length > 2 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{deal.extractedProperty.sourceLinks.length - 2} more links
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {deal.status === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ dealId: deal.id, status: 'reviewed' })}
                        >
                          Mark Reviewed
                        </Button>
                      )}
                      
                      {deal.extractedProperty && !deal.analysis && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => analyzeDealMutation.mutate(deal)}
                          disabled={analyzeDealMutation.isPending}
                        >
                          <i className="fas fa-chart-line mr-2"></i>
                          Analyze Deal
                        </Button>
                      )}

                      {deal.analysis && (
                        <Badge variant={deal.analysis.meetsCriteria ? "default" : "destructive"}>
                          {deal.analysis.meetsCriteria ? 'Meets Criteria' : 'Does Not Meet'}
                        </Badge>
                      )}
                      
                      {/* Report generation buttons - available for all deals */}
                      {(deal.analysis || deal.extractedProperty) && (
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateReportMutation.mutate({ 
                                dealId: deal.id, 
                                analysisId: deal.analysis?.id,
                                format: 'pdf' 
                              })}
                              disabled={generateReportMutation.isPending}
                              data-testid={`button-report-pdf-${deal.id}`}
                            >
                              <i className="fas fa-file-pdf mr-2"></i>
                              {generateReportMutation.isPending ? 'Generating...' : 'PDF Report'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateReportMutation.mutate({ 
                                dealId: deal.id, 
                                analysisId: deal.analysis?.id,
                                format: 'csv' 
                              })}
                              disabled={generateReportMutation.isPending}
                              data-testid={`button-report-csv-${deal.id}`}
                            >
                              <i className="fas fa-table mr-2"></i>
                              {generateReportMutation.isPending ? 'Generating...' : 'CSV Report'}
                            </Button>
                          </div>
                          {!deal.analysis && deal.extractedProperty && (
                            <p className="text-xs text-muted-foreground">
                              Report will include extracted property data
                            </p>
                          )}
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatusMutation.mutate({ 
                          dealId: deal.id, 
                          status: deal.status === 'archived' ? 'new' : 'archived' 
                        })}
                      >
                        <i className={`fas ${deal.status === 'archived' ? 'fa-undo' : 'fa-archive'} mr-2`}></i>
                        {deal.status === 'archived' ? 'Restore' : 'Archive'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        </div>
    </div>
  );
}