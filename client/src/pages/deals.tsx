import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailDeal, EmailMonitoringResponse, AnalyzePropertyResponse } from "@shared/schema";

export default function DealsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'reviewed' | 'analyzed' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
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
      if (data.success) {
        // Open in new tab to avoid iframe restrictions
        window.open(data.authUrl, '_blank');
      }
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold gradient-text">Deal Pipeline</h1>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters and Search */}
        <Card className="analysis-card mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Email Deals Dashboard</h2>
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {deal.extractedProperty.address && (
                            <div>
                              <span className="text-sm text-muted-foreground">Address:</span>
                              <p className="font-medium">{deal.extractedProperty.address}</p>
                            </div>
                          )}
                          {deal.extractedProperty.price && (
                            <div>
                              <span className="text-sm text-muted-foreground">Price:</span>
                              <p className="font-medium">{formatCurrency(deal.extractedProperty.price)}</p>
                            </div>
                          )}
                          {deal.extractedProperty.bedrooms && (
                            <div>
                              <span className="text-sm text-muted-foreground">Bedrooms:</span>
                              <p className="font-medium">{deal.extractedProperty.bedrooms}</p>
                            </div>
                          )}
                          {deal.extractedProperty.sqft && (
                            <div>
                              <span className="text-sm text-muted-foreground">Sq Ft:</span>
                              <p className="font-medium">{deal.extractedProperty.sqft.toLocaleString()}</p>
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
      </main>
    </div>
  );
}