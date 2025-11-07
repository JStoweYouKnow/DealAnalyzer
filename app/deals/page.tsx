"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import comfortFinderLogo from "@/assets/comfort-finder-logo.png";
import type { EmailDeal, EmailMonitoringResponse, AnalyzePropertyResponse, FundingSource } from "@shared/schema";

interface MortgageValues {
  loanAmount: number;
  loanTermYears: number;
  monthlyPayment: number;
}

export default function DealsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'reviewed' | 'analyzed' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDeal, setEditingDeal] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: {price?: number, rent?: number, adr?: number, occupancyRate?: number, bedrooms?: number, bathrooms?: number, fundingSource?: FundingSource, mortgageValues?: MortgageValues | null}}>({});
  const [mortgageInputs, setMortgageInputs] = useState<{[key: string]: {loanAmount: string, interestRate: string, durationYears: string}}>({});
  const [mortgageLoading, setMortgageLoading] = useState<{[key: string]: boolean}>({});
  const [mortgageResults, setMortgageResults] = useState<{[key: string]: {monthly_payment: number, total_interest_paid: number, total_paid: number}}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Coordination flag to prevent race conditions between postMessage handler and polling
  const isSyncingRef = useRef<boolean>(false);
  
  // Ref to store the sync mutation function (set after mutation is defined)
  const syncMutateRef = useRef<(() => void) | null>(null);

  // Fetch email deals
  // Override staleTime to allow refetching after sync
  const { data: emailDeals = [], isLoading, refetch } = useQuery<EmailDeal[]>({
    queryKey: ['/api/email-deals'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-deals');
      const data = await response.json();
      console.log('Email deals response:', data);
      return Array.isArray(data) ? data : data.data || [];
    },
    staleTime: 0, // Allow refetching immediately (overrides global staleTime: Infinity)
  });

  // Check Gmail connection status
  const { data: gmailStatus, refetch: refetchGmailStatus } = useQuery({
    queryKey: ['/api/gmail-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/gmail-status');
      const data = await response.json();
      console.log('Gmail status check:', {
        success: data.success,
        connected: data.connected,
        fullResponse: data
      });
      return data;
    },
    staleTime: 0, // Always allow refetching
    refetchOnWindowFocus: true, // Refetch when user returns to tab (after OAuth)
    refetchInterval: (query) => {
      // If not connected, check every 5 seconds to catch recent connections
      // If connected, don't auto-refetch (user can manually refresh)
      return query.state.data?.connected ? false : 5000;
    },
  });

  // Listen for auth success message from popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'GMAIL_AUTH_SUCCESS') {
        try {
          console.log('🎉 Received auth success message from popup!');

          // Wait a bit longer for cookie to propagate and be available
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Force multiple status checks with retries
          let retries = 5;
          let isConnected = false;
          
          while (retries > 0 && !isConnected) {
            queryClient.invalidateQueries({ queryKey: ['/api/gmail-status'] });
            const status = await refetchGmailStatus();
            
            console.log(`[Retry ${6 - retries}/5] Auth success - status check result:`, status.data);
            
            if (status.data?.connected === true) {
              isConnected = true;
              console.log('✅ Gmail connected! Starting auto-sync...');
              // Use the helper function via ref to trigger sync with coordination
              if (syncMutateRef.current) {
                syncMutateRef.current();
              }
              toast({
                title: "Gmail Connected",
                description: "Your Gmail account is now connected. You can sync emails now.",
              });
              break;
            }
            
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          if (!isConnected) {
            console.log('⚠️ Auth success message received but status still shows disconnected after retries');
            toast({
              title: "Connection Detected",
              description: "Gmail connection detected. Please refresh the page or click 'Sync Emails' to verify.",
            });
            // Force one more status check
            queryClient.invalidateQueries({ queryKey: ['/api/gmail-status'] });
            refetchGmailStatus();
          }
        } catch (error) {
          console.error('❌ Error handling Gmail auth success:', error);
          toast({
            title: "Connection Error",
            description: "Failed to verify Gmail connection. Please try clicking 'Sync Emails' manually.",
            variant: "destructive",
          });
          // Ensure queries are still invalidated even on error
          queryClient.invalidateQueries({ queryKey: ['/api/gmail-status'] });
          refetchGmailStatus();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetchGmailStatus, queryClient, toast]);

  // Connect Gmail mutation
  const connectGmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/gmail-auth-url');
      const data = await response.json();
      if (data.success && data.authUrl) {
        // Open in popup window
        window.open(data.authUrl, 'gmail-auth', 'width=600,height=700');
        toast({
          title: "Connecting to Gmail",
          description: "Complete the authentication in the popup window.",
        });
      } else {
        throw new Error(data.error || "Failed to get Gmail auth URL");
      }
      return data;
    },
    onSuccess: () => {
      // Poll for connection status - start immediately and poll frequently
      let pollCount = 0;
      const maxPolls = 150; // 5 minutes total

      const pollInterval = setInterval(async () => {
        pollCount++;

        try {
          // Force a fresh query by invalidating first
          queryClient.invalidateQueries({ queryKey: ['/api/gmail-status'] });
          const status = await refetchGmailStatus();

          const statusData = status.data;
          console.log(`[Poll ${pollCount}/${maxPolls}] Gmail status:`, {
            success: statusData?.success,
            connected: statusData?.connected,
            connectedType: typeof statusData?.connected,
            fullStatusData: statusData
          });

          // Check if connected is true (handle both boolean true and string "true")
          const isConnected = statusData?.connected === true || statusData?.connected === 'true';
          
          if (isConnected) {
            console.log('✅ Gmail connected! Starting auto-sync...');
            clearInterval(pollInterval);
            // Use the helper function via ref to trigger sync with coordination
            if (syncMutateRef.current) {
              syncMutateRef.current();
            }
          } else {
            console.log(`⏳ Gmail not connected yet (connected=${statusData?.connected})`);
          }
        } catch (error) {
          console.error('❌ Error polling Gmail status:', error);
        }

        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          console.log('⏱️ Stopped polling - max attempts reached');
          clearInterval(pollInterval);
          toast({
            title: "Polling Stopped",
            description: "Unable to detect Gmail connection. Try clicking 'Sync Emails' manually.",
            variant: "destructive",
          });
        }
      }, 2000); // Poll every 2 seconds
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
    onSuccess: async (data) => {
      console.log('Sync response:', data);
      if (data.success) {
        // Invalidate the query to mark it as stale
        // React Query will automatically refetch active queries
        try {
          await queryClient.invalidateQueries({
            queryKey: ['/api/email-deals']
          });
        } catch (error) {
          console.error('Error invalidating email deals query:', error);
          toast({
            title: "Refresh Error",
            description: "Failed to refresh email deals. Please reload the page.",
            variant: "destructive",
          });
        }

        toast({
          title: "Emails Synced",
          description: `Found ${data.data?.length || 0} new real estate emails. Refreshing dashboard...`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: async (error: Error) => {
      console.error('Sync error:', error);

      // Check if error is 401 (not connected)
      if (error.message.includes('401') || error.message.includes('not connected')) {
        // Refresh Gmail status
        await refetchGmailStatus();
        toast({
          title: "Gmail Not Connected",
          description: "Please connect your Gmail account to sync emails.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      // Always clear the coordination flag when mutation completes (success or error)
      isSyncingRef.current = false;
    }
  });
  
  // Helper function to atomically trigger sync with toast (prevents duplicate syncs)
  // Defined after mutation so it can access syncEmailsMutation
  const triggerSyncWithToast = useCallback(() => {
    // Atomically check and set the flag
    if (isSyncingRef.current) {
      console.log('⏸️ Sync already in progress, skipping duplicate trigger');
      return;
    }
    
    // Set flag immediately before mutation
    isSyncingRef.current = true;
    
    // Show toast
    toast({
      title: "Gmail Connected",
      description: "Automatically syncing your emails...",
    });
    
    // Trigger sync
    syncEmailsMutation.mutate();
  }, [syncEmailsMutation, toast]);
  
  // Store the helper function in a ref so it can be accessed by the message handler and polling logic
  useEffect(() => {
    syncMutateRef.current = triggerSyncWithToast;
  }, [triggerSyncWithToast]);

  // Analyze deal mutation
  const analyzeDealMutation = useMutation({
    mutationFn: async (deal: EmailDeal) => {
      // Validate deal has required data
      if (!deal.id) {
        throw new Error('Deal ID is missing. Please refresh the deals list and try again.');
      }
      if (!deal.emailContent) {
        throw new Error('Email content is missing. Cannot analyze this deal.');
      }
      
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
      } else {
        toast({
          title: "Analysis Failed",
          description: data.error || "Failed to analyze email deal",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error analyzing deal:', error);
      // Extract meaningful error message
      let errorMessage = error.message;
      
      // Try to parse error response if it's a JSON error
      try {
        // The apiRequest throws errors with status codes, try to extract more info
        const errorMatch = errorMessage.match(/(\d+):\s*(.+)/);
        if (errorMatch) {
          const statusCode = errorMatch[1];
          const errorText = errorMatch[2];
          
          // Try to parse JSON error response
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
            if (errorJson.suggestion) {
              errorMessage += ` ${errorJson.suggestion}`;
            }
          } catch {
            // Not JSON, use the text as is
            errorMessage = errorText;
          }
          
          // Add user-friendly messages based on status code
          if (statusCode === '404') {
            errorMessage = 'Email deal not found. ' + (errorMessage.includes('suggestion') ? '' : 'The deal may have been deleted or the ID is incorrect. Please refresh the deals list and try again.');
          } else if (statusCode === '400') {
            errorMessage = 'Invalid request. ' + (errorMessage.includes('required') ? '' : 'Please check that the deal has all required information.');
          } else if (statusCode === '500') {
            errorMessage = 'Server error occurred. Please try again later.';
          }
        }
      } catch {
        // If parsing fails, use original error message
      }
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
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

  // Mortgage calculator handler
  const handleMortgageCalculate = async (dealId: string) => {
    const inputs = mortgageInputs[dealId];
    if (!inputs || !inputs.loanAmount || !inputs.interestRate || !inputs.durationYears) {
      toast({
        title: "Missing Information",
        description: "Please fill in all mortgage calculator fields",
        variant: "destructive",
      });
      return;
    }

    const loan = parseFloat(inputs.loanAmount);
    const rate = parseFloat(inputs.interestRate);
    const years = parseFloat(inputs.durationYears);

    if (isNaN(loan) || loan <= 0) {
      toast({
        title: "Invalid Loan Amount",
        description: "Loan amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(rate) || rate < 0) {
      toast({
        title: "Invalid Interest Rate",
        description: "Interest rate must be 0 or greater",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(years) || years <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Duration must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setMortgageLoading(prev => ({ ...prev, [dealId]: true }));
    try {
      const response = await fetch('/api/mortgage-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loan_amount: loan,
          interest_rate: rate,
          duration_years: years,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate mortgage');
      }

      if (data.success && data.data) {
        if (data.data.monthly_payment === null || 
            data.data.monthly_payment === undefined || 
            isNaN(data.data.monthly_payment)) {
          throw new Error('Received invalid calculation result');
        }
        setMortgageResults(prev => ({ ...prev, [dealId]: data.data }));
        
        // Update editValues with mortgage values
        setEditValues(prev => ({
          ...prev,
          [dealId]: {
            ...prev[dealId],
            mortgageValues: {
              loanAmount: loan,
              loanTermYears: years,
              monthlyPayment: data.data.monthly_payment,
            }
          }
        }));
      } else {
        throw new Error(data.error || 'Calculation failed');
      }
    } catch (error) {
      console.error('Error calculating mortgage:', error);
      toast({
        title: "Calculation Error",
        description: error instanceof Error ? error.message : "Failed to calculate mortgage payment",
        variant: "destructive",
      });
    } finally {
      setMortgageLoading(prev => ({ ...prev, [dealId]: false }));
    }
  };

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ dealId, price, rent, adr, occupancyRate, bedrooms, bathrooms, fundingSource, mortgageValues }: { 
      dealId: string; 
      price: number; 
      rent: number;
      adr?: number;
      occupancyRate?: number;
      bedrooms?: number;
      bathrooms?: number;
      fundingSource?: FundingSource;
      mortgageValues?: MortgageValues | null;
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
      
      // Then run analysis with the updated property data, including funding source and mortgage values
      const analysisResponse = await apiRequest('POST', '/api/analyze-email-deal', { 
        dealId: dealId,
        emailContent: deal.emailContent,
        fundingSource: fundingSource,
        mortgageValues: mortgageValues
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
          // Always use dealId for email deals since the analysis is stored on the deal
          // The backend will retrieve the analysis from the email deal if it exists
          dealIds: [dealId],
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
              {/* Connect Gmail Button */}
              {!gmailStatus?.connected && (
                <Button
                  onClick={() => connectGmailMutation.mutate()}
                  disabled={connectGmailMutation.isPending || syncEmailsMutation.isPending}
                  size="sm"
                >
                  {connectGmailMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-envelope mr-2"></i>
                      Connect Gmail
                    </>
                  )}
                </Button>
              )}

              {/* Sync Emails Button - Always visible, disabled when not connected */}
              <Button
                onClick={() => {
                  if (!syncEmailsMutation.isPending && gmailStatus?.connected) {
                    syncEmailsMutation.mutate();
                  }
                }}
                disabled={!gmailStatus?.connected || syncEmailsMutation.isPending || connectGmailMutation.isPending}
                size="sm"
                variant={gmailStatus?.connected ? "default" : "outline"}
                title={!gmailStatus?.connected ? "Connect Gmail first to sync emails" : "Sync emails from Gmail"}
              >
                {syncEmailsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync mr-2"></i>
                    Sync Emails
                  </>
                )}
              </Button>

              {/* Manual refresh button - always visible to check connection status */}
              <Button
                onClick={async () => {
                  console.log('Manual status refresh triggered');
                  queryClient.invalidateQueries({ queryKey: ['/api/gmail-status'] });
                  const status = await refetchGmailStatus();
                  console.log('Manual refresh result:', status.data);
                  if (status.data?.connected) {
                    toast({
                      title: "Gmail Connected",
                      description: "Connection verified! You can now sync emails.",
                    });
                  } else {
                    toast({
                      title: gmailStatus?.connected ? "Connection Lost" : "Not Connected",
                      description: gmailStatus?.connected 
                        ? "Gmail connection not detected. Please reconnect."
                        : "Gmail is not connected. Click 'Connect Gmail' to get started.",
                      variant: "destructive",
                    });
                  }
                }}
                variant="outline"
                size="sm"
                title="Refresh Gmail connection status"
              >
                <i className="fas fa-refresh mr-2"></i>
                Refresh Status
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
                  {!gmailStatus?.connected
                    ? "Connect your Gmail account to start finding real estate deals"
                    : "Click the button above to sync your emails and find real estate deals"}
                </p>
                {!gmailStatus?.connected && (
                  <Button onClick={() => connectGmailMutation.mutate()}>
                    <i className="fas fa-envelope mr-2"></i>
                    Connect Gmail
                  </Button>
                )}
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
                          
                          {/* Funding Source and Mortgage Calculator Section */}
                          {editingDeal === deal.id && (
                            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-t border-gray-200 dark:border-gray-700 mt-4">
                              {/* Funding Source */}
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Funding Source</Label>
                                <Select
                                  value={editValues[deal.id]?.fundingSource || 'conventional'}
                                  onValueChange={(value) => setEditValues(prev => ({
                                    ...prev,
                                    [deal.id]: {
                                      ...prev[deal.id],
                                      fundingSource: value as FundingSource
                                    }
                                  }))}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select funding source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="conventional">Conventional (5% down)</SelectItem>
                                    <SelectItem value="fha">FHA (3.5% down)</SelectItem>
                                    <SelectItem value="va">VA (0% down)</SelectItem>
                                    <SelectItem value="dscr">DSCR (20% down)</SelectItem>
                                    <SelectItem value="cash">Cash (100% down)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Divider */}
                              <div className="border-t border-gray-200 dark:border-gray-700"></div>

                              {/* Mortgage Calculator */}
                              <div>
                                <Label className="text-sm font-semibold mb-3 block">Mortgage Calculator (Optional)</Label>
                                <p className="text-xs text-muted-foreground mb-4">Calculate mortgage payment to use in analysis</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`loan-amount-${deal.id}`} className="text-sm font-medium">Loan Amount ($)</Label>
                                    <Input
                                      id={`loan-amount-${deal.id}`}
                                      type="number"
                                      placeholder="e.g., 200000"
                                      value={mortgageInputs[deal.id]?.loanAmount || ""}
                                      onChange={(e) => setMortgageInputs(prev => ({
                                        ...prev,
                                        [deal.id]: {
                                          ...prev[deal.id],
                                          loanAmount: e.target.value,
                                          interestRate: prev[deal.id]?.interestRate || "",
                                          durationYears: prev[deal.id]?.durationYears || "30"
                                        }
                                      }))}
                                      min="0"
                                      step="1000"
                                      className="h-10"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`interest-rate-${deal.id}`} className="text-sm font-medium">Interest Rate (%)</Label>
                                    <Input
                                      id={`interest-rate-${deal.id}`}
                                      type="number"
                                      placeholder="e.g., 3.5"
                                      value={mortgageInputs[deal.id]?.interestRate || ""}
                                      onChange={(e) => setMortgageInputs(prev => ({
                                        ...prev,
                                        [deal.id]: {
                                          ...prev[deal.id],
                                          loanAmount: prev[deal.id]?.loanAmount || "",
                                          interestRate: e.target.value,
                                          durationYears: prev[deal.id]?.durationYears || "30"
                                        }
                                      }))}
                                      min="0"
                                      step="0.1"
                                      className="h-10"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`duration-${deal.id}`} className="text-sm font-medium">Loan Term (years)</Label>
                                    <Input
                                      id={`duration-${deal.id}`}
                                      type="number"
                                      placeholder="e.g., 30"
                                      value={mortgageInputs[deal.id]?.durationYears || "30"}
                                      onChange={(e) => setMortgageInputs(prev => ({
                                        ...prev,
                                        [deal.id]: {
                                          ...prev[deal.id],
                                          loanAmount: prev[deal.id]?.loanAmount || "",
                                          interestRate: prev[deal.id]?.interestRate || "",
                                          durationYears: e.target.value
                                        }
                                      }))}
                                      min="1"
                                      step="1"
                                      className="h-10"
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-2 mb-4">
                                  <Button
                                    type="button"
                                    onClick={() => handleMortgageCalculate(deal.id)}
                                    disabled={mortgageLoading[deal.id]}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                  >
                                    {mortgageLoading[deal.id] ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Calculating...
                                      </>
                                    ) : (
                                      <>
                                        <i className="fas fa-calculator mr-2"></i>
                                        Calculate Mortgage
                                      </>
                                    )}
                                  </Button>
                                  {mortgageResults[deal.id] && (
                                    <Button
                                      type="button"
                                      onClick={() => {
                                        setMortgageResults(prev => {
                                          const newState = { ...prev };
                                          delete newState[deal.id];
                                          return newState;
                                        });
                                        setMortgageInputs(prev => {
                                          const newState = { ...prev };
                                          delete newState[deal.id];
                                          return newState;
                                        });
                                        setEditValues(prev => ({
                                          ...prev,
                                          [deal.id]: {
                                            ...prev[deal.id],
                                            mortgageValues: null
                                          }
                                        }));
                                      }}
                                      variant="outline"
                                      size="sm"
                                    >
                                      Reset
                                    </Button>
                                  )}
                                </div>

                                {mortgageResults[deal.id] && (
                                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <p className="text-sm text-blue-700 dark:text-blue-300">Monthly Payment</p>
                                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                          {formatCurrency(mortgageResults[deal.id].monthly_payment)}
                                        </p>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <p className="text-sm text-blue-700 dark:text-blue-300">Total Interest Paid</p>
                                        <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                          {formatCurrency(mortgageResults[deal.id].total_interest_paid)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                                      <p className="text-xs text-blue-600 dark:text-blue-400">
                                        <i className="fas fa-check-circle mr-1"></i>
                                        Mortgage values will be used in property analysis
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
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
                                  const fundingSource = editValues[deal.id]?.fundingSource;
                                  const mortgageValues = editValues[deal.id]?.mortgageValues;
                                  
                                  if (price && (rent || (adr && occupancyRate))) {
                                    updatePropertyMutation.mutate({ 
                                      dealId: deal.id, 
                                      price, 
                                      rent: rent || 0,
                                      adr,
                                      occupancyRate,
                                      bedrooms,
                                      bathrooms,
                                      fundingSource,
                                      mortgageValues
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
                                  setMortgageInputs(prev => {
                                    const newState = { ...prev };
                                    delete newState[deal.id];
                                    return newState;
                                  });
                                  setMortgageResults(prev => {
                                    const newState = { ...prev };
                                    delete newState[deal.id];
                                    return newState;
                                  });
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
                                    rent: deal.analysis?.property?.monthlyRent || deal.extractedProperty?.monthlyRent,
                                    fundingSource: 'conventional'
                                  }
                                }));
                                setMortgageInputs(prev => ({
                                  ...prev,
                                  [deal.id]: {
                                    loanAmount: "",
                                    interestRate: "",
                                    durationYears: "30"
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
                              onClick={() => {
                                // Use analysisId if available, otherwise use dealId
                                // The backend will use the analysisId if provided, or fall back to dealId
                                generateReportMutation.mutate({ 
                                  dealId: deal.id, 
                                  analysisId: deal.analysis?.id || deal.analysis?.propertyId,
                                  format: 'pdf' 
                                });
                              }}
                              disabled={generateReportMutation.isPending}
                              data-testid={`button-report-pdf-${deal.id}`}
                            >
                              <i className="fas fa-file-pdf mr-2"></i>
                              {generateReportMutation.isPending ? 'Generating...' : 'PDF Report'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Use analysisId if available, otherwise use dealId
                                // The backend will use the analysisId if provided, or fall back to dealId
                                generateReportMutation.mutate({ 
                                  dealId: deal.id, 
                                  analysisId: deal.analysis?.id || deal.analysis?.propertyId,
                                  format: 'csv' 
                                });
                              }}
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