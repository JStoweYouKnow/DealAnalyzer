"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, Save, Trash2, Copy, Mail, MapPin, Home, TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { EmailDeal, SavedFilter } from "@shared/schema";
import { InfoTooltip } from "@/components/info-tooltip";

interface SearchFilters {
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  bathroomsMax?: number;
  sqftMin?: number;
  sqftMax?: number;
  cocReturnMin?: number;
  cocReturnMax?: number;
  capRateMin?: number;
  capRateMax?: number;
  cashFlowMin?: number;
  rentMin?: number;
  cities?: string[];
  states?: string[];
  status?: ('new' | 'reviewed' | 'analyzed' | 'archived')[];
  meetsCriteria?: boolean;
  hasAnalysis?: boolean;
  searchText?: string;
}

export function AdvancedSearch() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [newFilterName, setNewFilterName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<EmailDeal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email deals
  const { data: emailDeals = [], isLoading: dealsLoading } = useQuery<EmailDeal[]>({
    queryKey: ['/api/email-deals'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-deals');
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    },
    staleTime: 0,
  });

  // Fetch saved filters
  const { data: savedFilters = [], isLoading: filtersLoading } = useQuery<SavedFilter[]>({
    queryKey: ['/api/filters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/filters');
      const data = await response.json();
      return data.data || [];
    }
  });

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
        emailContent: deal.emailContent,
        extractedProperty: deal.extractedProperty,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-deals'] });
      toast({
        title: "Analysis Complete",
        description: `Property analyzed successfully. ${data.analysis?.meetsCriteria ? 'Meets' : 'Does not meet'} investment criteria.`,
      });
      // Update selected deal with analysis
      if (selectedDeal) {
        setSelectedDeal({ ...selectedDeal, analysis: data.analysis, status: 'analyzed' });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze property",
        variant: "destructive",
      });
    }
  });

  // Filter email deals based on search criteria
  const filteredDeals = useMemo(() => {
    return emailDeals.filter(deal => {
      const property = deal.extractedProperty;
      const analysis = deal.analysis;

      // Text search across multiple fields
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesText =
          deal.subject?.toLowerCase().includes(searchLower) ||
          deal.sender?.toLowerCase().includes(searchLower) ||
          property?.address?.toLowerCase().includes(searchLower) ||
          property?.city?.toLowerCase().includes(searchLower) ||
          property?.state?.toLowerCase().includes(searchLower);

        if (!matchesText) return false;
      }

      // Status filter
      if (searchFilters.status && searchFilters.status.length > 0) {
        if (!searchFilters.status.includes(deal.status)) return false;
      }

      // Has analysis filter
      if (searchFilters.hasAnalysis !== undefined) {
        if (searchFilters.hasAnalysis && !analysis) return false;
        if (!searchFilters.hasAnalysis && analysis) return false;
      }

      // Meets criteria filter
      if (searchFilters.meetsCriteria !== undefined) {
        if (searchFilters.meetsCriteria && !analysis?.meetsCriteria) return false;
      }

      // Price filters
      if (searchFilters.priceMin !== undefined) {
        const price = analysis?.property?.purchasePrice || property?.price;
        if (!price || price < searchFilters.priceMin) return false;
      }
      if (searchFilters.priceMax !== undefined) {
        const price = analysis?.property?.purchasePrice || property?.price;
        if (!price || price > searchFilters.priceMax) return false;
      }

      // Bedroom filters
      if (searchFilters.bedroomsMin !== undefined) {
        const beds = analysis?.property?.bedrooms || property?.bedrooms;
        if (!beds || beds < searchFilters.bedroomsMin) return false;
      }
      if (searchFilters.bedroomsMax !== undefined) {
        const beds = analysis?.property?.bedrooms || property?.bedrooms;
        if (!beds || beds > searchFilters.bedroomsMax) return false;
      }

      // Bathroom filters
      if (searchFilters.bathroomsMin !== undefined) {
        const baths = analysis?.property?.bathrooms || property?.bathrooms;
        if (!baths || baths < searchFilters.bathroomsMin) return false;
      }
      if (searchFilters.bathroomsMax !== undefined) {
        const baths = analysis?.property?.bathrooms || property?.bathrooms;
        if (!baths || baths > searchFilters.bathroomsMax) return false;
      }

      // Square footage filters
      if (searchFilters.sqftMin !== undefined) {
        const sqft = analysis?.property?.squareFootage || property?.sqft;
        if (!sqft || sqft < searchFilters.sqftMin) return false;
      }
      if (searchFilters.sqftMax !== undefined) {
        const sqft = analysis?.property?.squareFootage || property?.sqft;
        if (!sqft || sqft > searchFilters.sqftMax) return false;
      }

      // Rent filter
      if (searchFilters.rentMin !== undefined) {
        const rent = analysis?.property?.monthlyRent || property?.monthlyRent;
        if (!rent || rent < searchFilters.rentMin) return false;
      }

      // Financial filters (only for analyzed deals)
      if (analysis) {
        if (searchFilters.cashFlowMin !== undefined) {
          if (!analysis.cashFlow || analysis.cashFlow < searchFilters.cashFlowMin) return false;
        }

        if (searchFilters.cocReturnMin !== undefined) {
          if (!analysis.cocReturn || analysis.cocReturn < searchFilters.cocReturnMin / 100) return false;
        }
        if (searchFilters.cocReturnMax !== undefined) {
          if (!analysis.cocReturn || analysis.cocReturn > searchFilters.cocReturnMax / 100) return false;
        }

        if (searchFilters.capRateMin !== undefined) {
          if (!analysis.capRate || analysis.capRate < searchFilters.capRateMin / 100) return false;
        }
        if (searchFilters.capRateMax !== undefined) {
          if (!analysis.capRate || analysis.capRate > searchFilters.capRateMax / 100) return false;
        }
      }

      // City filter
      if (searchFilters.cities && searchFilters.cities.length > 0) {
        const city = property?.city || analysis?.property?.city;
        if (!city || !searchFilters.cities.includes(city)) return false;
      }

      // State filter
      if (searchFilters.states && searchFilters.states.length > 0) {
        const state = property?.state || analysis?.property?.state;
        if (!state || !searchFilters.states.includes(state)) return false;
      }

      return true;
    });
  }, [emailDeals, searchFilters, searchText]);

  // Get unique cities and states from email deals
  const availableLocations = useMemo(() => {
    const cities = new Set<string>();
    const states = new Set<string>();

    emailDeals.forEach(deal => {
      const city = deal.extractedProperty?.city || deal.analysis?.property?.city;
      const state = deal.extractedProperty?.state || deal.analysis?.property?.state;
      if (city) cities.add(city);
      if (state) states.add(state);
    });

    return {
      cities: Array.from(cities).sort(),
      states: Array.from(states).sort()
    };
  }, [emailDeals]);

  // Save filter mutation
  const saveFilterMutation = useMutation({
    mutationFn: async (filterData: { name: string; description?: string; filterCriteria: SearchFilters }) => {
      const response = await apiRequest('POST', '/api/filters', filterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filters'] });
      setNewFilterName("");
      toast({
        title: "Filter Saved",
        description: "Your search filter has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save filter",
        variant: "destructive",
      });
    }
  });

  // Delete filter mutation
  const deleteFilterMutation = useMutation({
    mutationFn: async (filterId: string) => {
      const response = await apiRequest('DELETE', `/api/filters/${filterId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filters'] });
      toast({
        title: "Filter Deleted",
        description: "The saved filter has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete filter",
        variant: "destructive",
      });
    }
  });

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the filter.",
        variant: "destructive"
      });
      return;
    }

    const activeFilters = Object.keys(searchFilters).length;
    saveFilterMutation.mutate({
      name: newFilterName,
      description: `Email deals filter with ${activeFilters} criteria`,
      filterCriteria: searchFilters
    });
  };

  const loadSavedFilter = (filter: SavedFilter) => {
    setSearchFilters(filter.filterCriteria);
    toast({
      title: "Filter Loaded",
      description: `Applied filter: ${filter.name}`,
    });
  };

  const clearFilters = () => {
    setSearchFilters({});
    setSearchText("");
    toast({
      title: "Filters Cleared",
      description: "All search filters have been reset.",
    });
  };

  const handleCardClick = (deal: EmailDeal) => {
    setSelectedDeal(deal);
    setIsDialogOpen(true);
  };

  const handleRunAnalysis = () => {
    if (selectedDeal) {
      analyzeDealMutation.mutate(selectedDeal);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'csv') => {
    if (!selectedDeal?.analysis?.id) {
      toast({
        title: "Cannot Export",
        description: "This property must be analyzed before exporting a report.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const response = await apiRequest('POST', '/api/generate-report', {
        analysisIds: [selectedDeal.analysis.id],
        format,
        title: `${selectedDeal.extractedProperty?.address || 'Property'} Analysis Report`,
        includeComparison: false
      });

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      
      // Robust filename extraction with RFC5987 support
      let filename = `report.${format}`; // Safe fallback
      
      if (contentDisposition) {
        // Split header by semicolons to parse parameters
        const parts = contentDisposition.split(';').map(p => p.trim());
        
        // Parse parameters into key/value pairs
        const params: Record<string, string> = {};
        for (const part of parts) {
          const match = part.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim().toLowerCase();
            let value = match[2].trim();
            params[key] = value;
          }
        }
        
        // Prefer filename* (RFC5987) over filename
        if (params['filename*']) {
          // RFC5987 format: filename*=charset'lang'encoded-value
          // Example: filename*=UTF-8''encoded-name or filename*=UTF-8'en'encoded-name
          const filenameStar = params['filename*'];
          const match = filenameStar.match(/^[^']*'[^']*'(.*)$/);
          if (match) {
            try {
              // Decode percent-encoding
              filename = decodeURIComponent(match[1]);
              // Strip surrounding quotes if present
              filename = filename.replace(/^["']|["']$/g, '').trim();
            } catch (e) {
              // If decoding fails, try to use the raw value
              filename = match[1].replace(/^["']|["']$/g, '').trim();
            }
          } else {
            // Fallback: try to use the value as-is if it doesn't match the pattern
            filename = filenameStar.replace(/^["']|["']$/g, '').trim();
          }
        } else if (params['filename']) {
          // Fallback to regular filename parameter
          filename = params['filename'];
          // Strip surrounding quotes
          filename = filename.replace(/^["']|["']$/g, '').trim();
        }
        
        // Final safety check: ensure we have a valid filename
        if (!filename || filename.length === 0) {
          filename = `report.${format}`;
        }
      }

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
        title: "Report Downloaded",
        description: `${format.toUpperCase()} report has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      // Extract safe error message, avoiding sensitive data exposure
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : String(error);
      // Truncate to reasonable length for toast display
      const truncatedMessage = errorMessage.length > 150 
        ? errorMessage.substring(0, 150) + '...' 
        : errorMessage;
      toast({
        title: "Export Failed",
        description: `Failed to generate report. ${truncatedMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: EmailDeal['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'analyzed': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const activeFilterCount = Object.keys(searchFilters).length + (searchText ? 1 : 0);

  return (
    <div className="space-y-6" data-testid="advanced-search">
      <div className="flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Search Email Deals</h1>
              <InfoTooltip
                title="Search Email Deals"
                content={[
                  "Search and filter your email deals using advanced criteria. Find properties that match your specific investment requirements.",
                  "• Text Search: Search across deal subjects, sender emails, addresses, cities, and states",
                  "• Price Filters: Filter by purchase price range",
                  "• Property Features: Filter by bedrooms, bathrooms, and square footage",
                  "• Investment Metrics: Filter by cash-on-cash return, cap rate, and cash flow",
                  "• Location Filters: Filter by cities and states",
                  "• Status Filters: Filter by deal status (new, reviewed, analyzed, archived)",
                  "• Criteria Match: Filter by whether properties meet your investment criteria",
                  "• Save Filters: Save frequently used filter combinations for quick access",
                  "Use the filters to narrow down deals that match your investment criteria and find the best opportunities.",
                ]}
              />
            </div>
            <p className="text-muted-foreground">
              Filter and search through your uploaded email deals using advanced criteria.
            </p>
          </div>
          <Badge variant="outline" className="mt-2">
            <Mail className="w-3 h-3 mr-1" />
            {emailDeals.length} total deals
          </Badge>
        </div>
      </div>

      {/* Quick Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Search by address, city, sender, or subject..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full"
                data-testid="input-search-text"
              />
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              Clear All
            </Button>
          </div>
          {activeFilterCount > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''} • {filteredDeals.length} result{filteredDeals.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="filters" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="filters" data-testid="tab-filters">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </TabsTrigger>
          <TabsTrigger value="saved" data-testid="tab-saved">
            <Save className="w-4 h-4 mr-2" />
            Saved Filters ({savedFilters.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="filters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filter Criteria
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Filter name..."
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    className="w-48"
                    data-testid="input-filter-name"
                  />
                  <Button
                    onClick={handleSaveFilter}
                    variant="outline"
                    size="sm"
                    disabled={!newFilterName.trim() || activeFilterCount === 0}
                    data-testid="button-save-filter"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Filter
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status and Analysis Filters */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium">Deal Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['new', 'reviewed', 'analyzed', 'archived'] as const).map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={searchFilters.status?.includes(status) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSearchFilters(prev => ({
                              ...prev,
                              status: [...(prev.status || []), status]
                            }));
                          } else {
                            setSearchFilters(prev => ({
                              ...prev,
                              status: prev.status?.filter(s => s !== status)
                            }));
                          }
                        }}
                        data-testid={`checkbox-status-${status}`}
                      />
                      <Label htmlFor={`status-${status}`} className="capitalize text-sm">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-4 pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has-analysis"
                      checked={searchFilters.hasAnalysis || false}
                      onCheckedChange={(checked) => setSearchFilters(prev => ({ ...prev, hasAnalysis: !!checked }))}
                      data-testid="checkbox-has-analysis"
                    />
                    <Label htmlFor="has-analysis" className="text-sm">
                      Only analyzed deals
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="meets-criteria"
                      checked={searchFilters.meetsCriteria || false}
                      onCheckedChange={(checked) => setSearchFilters(prev => ({ ...prev, meetsCriteria: !!checked }))}
                      data-testid="checkbox-meets-criteria"
                    />
                    <Label htmlFor="meets-criteria" className="text-sm">
                      Meets investment criteria
                    </Label>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Price Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Price Range</Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min Price"
                      value={searchFilters.priceMin || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, priceMin: Number(e.target.value) || undefined }))}
                      data-testid="input-price-min"
                    />
                    <Input
                      type="number"
                      placeholder="Max Price"
                      value={searchFilters.priceMax || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, priceMax: Number(e.target.value) || undefined }))}
                      data-testid="input-price-max"
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Bedrooms</Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min Bedrooms"
                      value={searchFilters.bedroomsMin || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, bedroomsMin: Number(e.target.value) || undefined }))}
                      data-testid="input-bedrooms-min"
                    />
                    <Input
                      type="number"
                      placeholder="Max Bedrooms"
                      value={searchFilters.bedroomsMax || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, bedroomsMax: Number(e.target.value) || undefined }))}
                      data-testid="input-bedrooms-max"
                    />
                  </div>
                </div>

                {/* Bathrooms */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Bathrooms</Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min Bathrooms"
                      value={searchFilters.bathroomsMin || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, bathroomsMin: Number(e.target.value) || undefined }))}
                      data-testid="input-bathrooms-min"
                    />
                    <Input
                      type="number"
                      placeholder="Max Bathrooms"
                      value={searchFilters.bathroomsMax || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, bathroomsMax: Number(e.target.value) || undefined }))}
                      data-testid="input-bathrooms-max"
                    />
                  </div>
                </div>

                {/* Square Footage */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Square Footage</Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min Sq Ft"
                      value={searchFilters.sqftMin || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, sqftMin: Number(e.target.value) || undefined }))}
                      data-testid="input-sqft-min"
                    />
                    <Input
                      type="number"
                      placeholder="Max Sq Ft"
                      value={searchFilters.sqftMax || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, sqftMax: Number(e.target.value) || undefined }))}
                      data-testid="input-sqft-max"
                    />
                  </div>
                </div>

                {/* Monthly Rent */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Monthly Rent (Min)</Label>
                  <Input
                    type="number"
                    placeholder="Min Monthly Rent"
                    value={searchFilters.rentMin || ""}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, rentMin: Number(e.target.value) || undefined }))}
                    data-testid="input-rent-min"
                  />
                </div>

                {/* Cash Flow */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Min Cash Flow</Label>
                  <Input
                    type="number"
                    placeholder="Monthly Cash Flow"
                    value={searchFilters.cashFlowMin || ""}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, cashFlowMin: Number(e.target.value) || undefined }))}
                    data-testid="input-cash-flow-min"
                  />
                  <p className="text-xs text-muted-foreground">Only applies to analyzed deals</p>
                </div>

                {/* COC Return */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">COC Return Range (%)</Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min COC Return"
                      value={searchFilters.cocReturnMin || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, cocReturnMin: Number(e.target.value) || undefined }))}
                      data-testid="input-coc-min"
                    />
                    <Input
                      type="number"
                      placeholder="Max COC Return"
                      value={searchFilters.cocReturnMax || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, cocReturnMax: Number(e.target.value) || undefined }))}
                      data-testid="input-coc-max"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Only applies to analyzed deals</p>
                </div>

                {/* Cap Rate */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Cap Rate Range (%)</Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min Cap Rate"
                      value={searchFilters.capRateMin || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, capRateMin: Number(e.target.value) || undefined }))}
                      data-testid="input-cap-rate-min"
                    />
                    <Input
                      type="number"
                      placeholder="Max Cap Rate"
                      value={searchFilters.capRateMax || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, capRateMax: Number(e.target.value) || undefined }))}
                      data-testid="input-cap-rate-max"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Only applies to analyzed deals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          {filtersLoading ? (
            <div className="text-center py-8">Loading saved filters...</div>
          ) : savedFilters.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Saved Filters</h3>
                <p className="text-muted-foreground">
                  Create a filter in the Advanced Filters tab and save it to see it here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedFilters.map((filter) => (
                <Card key={filter.id} className="hover:shadow-lg transition-shadow" data-testid={`saved-filter-${filter.id}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg truncate">{filter.name}</span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadSavedFilter(filter)}
                          title="Load filter"
                          data-testid={`button-load-filter-${filter.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => filter.id && deleteFilterMutation.mutate(filter.id)}
                          title="Delete filter"
                          data-testid={`button-delete-filter-${filter.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardTitle>
                    {filter.description && (
                      <p className="text-sm text-muted-foreground">{filter.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Usage Count:</span>
                        <Badge variant="secondary">{filter.usageCount}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(filter.createdAt).toLocaleDateString()}</span>
                      </div>
                      {filter.isSystem && (
                        <Badge variant="outline" className="mt-2">System Filter</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search Results</span>
            <Badge variant="outline">
              {filteredDeals.length} of {emailDeals.length} deals
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dealsLoading ? (
            <div className="text-center py-8">Loading email deals...</div>
          ) : emailDeals.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Email Deals Found</h3>
              <p className="text-muted-foreground">
                Connect your Gmail account and sync emails to see deals here.
              </p>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Matches Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or clearing filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDeals.map((deal) => {
                const property = deal.extractedProperty;
                const analysis = deal.analysis;

                return (
                  <Card key={deal.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick(deal)} data-testid={`result-deal-${deal.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className={getStatusColor(deal.status)} variant="outline">
                          {deal.status}
                        </Badge>
                        {analysis?.meetsCriteria && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Meets Criteria
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base line-clamp-2">
                        {property?.address || deal.subject}
                      </CardTitle>
                      {(property?.city || analysis?.property?.city) && (property?.state || analysis?.property?.state) && (
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {[
                            property?.city || analysis?.property?.city,
                            property?.state || analysis?.property?.state,
                            analysis?.property?.zipCode
                          ].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {(analysis?.property?.purchasePrice || property?.price) && (
                          <div>
                            <p className="text-xs text-muted-foreground">Price</p>
                            <p className="font-semibold">
                              {formatCurrency(analysis?.property?.purchasePrice || property?.price || 0)}
                            </p>
                          </div>
                        )}
                        {(analysis?.property?.monthlyRent || property?.monthlyRent) && (
                          <div>
                            <p className="text-xs text-muted-foreground">Rent</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(analysis?.property?.monthlyRent || property?.monthlyRent || 0)}
                            </p>
                          </div>
                        )}
                      </div>

                      {(property?.bedrooms || property?.bathrooms || property?.sqft) && (
                        <div className="grid grid-cols-3 gap-2 text-center text-xs border-t pt-2">
                          {property?.bedrooms && (
                            <div>
                              <p className="font-medium">{property.bedrooms}</p>
                              <p className="text-muted-foreground">Beds</p>
                            </div>
                          )}
                          {property?.bathrooms && (
                            <div>
                              <p className="font-medium">{property.bathrooms}</p>
                              <p className="text-muted-foreground">Baths</p>
                            </div>
                          )}
                          {property?.sqft && (
                            <div>
                              <p className="font-medium">{property.sqft.toLocaleString()}</p>
                              <p className="text-muted-foreground">Sq Ft</p>
                            </div>
                          )}
                        </div>
                      )}

                      {analysis && (
                        <div className="space-y-1 text-xs border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cash Flow:</span>
                            <span className={`font-medium ${analysis.cashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(analysis.cashFlow)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">COC Return:</span>
                            <span className="font-medium">{(analysis.cocReturn * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cap Rate:</span>
                            <span className="font-medium">{(analysis.capRate * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground border-t pt-2">
                        <p className="truncate">From: {deal.sender}</p>
                        <p>{new Date(deal.receivedDate).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Property Details</DialogTitle>
            <DialogDescription>
              Detailed information about this property deal
            </DialogDescription>
          </DialogHeader>

          {selectedDeal && (
            <div className="space-y-6">
              {/* Property Information */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">
                      {selectedDeal.extractedProperty?.address || selectedDeal.subject}
                    </h3>
                    {(selectedDeal.extractedProperty?.city || selectedDeal.analysis?.property?.city) &&
                     (selectedDeal.extractedProperty?.state || selectedDeal.analysis?.property?.state) && (
                      <p className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {[
                          selectedDeal.extractedProperty?.city || selectedDeal.analysis?.property?.city,
                          selectedDeal.extractedProperty?.state || selectedDeal.analysis?.property?.state,
                          selectedDeal.analysis?.property?.zipCode
                        ].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className={getStatusColor(selectedDeal.status)} variant="outline">
                      {selectedDeal.status}
                    </Badge>
                    {selectedDeal.analysis?.meetsCriteria && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Meets Criteria
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Basic Property Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  {(selectedDeal.analysis?.property?.purchasePrice || selectedDeal.extractedProperty?.price) && (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span>Purchase Price</span>
                      </div>
                      <p className="text-lg font-semibold">
                        {formatCurrency(selectedDeal.analysis?.property?.purchasePrice || selectedDeal.extractedProperty?.price || 0)}
                      </p>
                    </div>
                  )}
                  {(selectedDeal.analysis?.property?.monthlyRent || selectedDeal.extractedProperty?.monthlyRent) && (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Home className="w-4 h-4 mr-1" />
                        <span>Monthly Rent</span>
                      </div>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(selectedDeal.analysis?.property?.monthlyRent || selectedDeal.extractedProperty?.monthlyRent || 0)}
                      </p>
                    </div>
                  )}
                  {selectedDeal.extractedProperty?.bedrooms && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="text-lg font-semibold">{selectedDeal.extractedProperty.bedrooms}</p>
                    </div>
                  )}
                  {selectedDeal.extractedProperty?.bathrooms && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="text-lg font-semibold">{selectedDeal.extractedProperty.bathrooms}</p>
                    </div>
                  )}
                  {selectedDeal.extractedProperty?.sqft && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Square Footage</p>
                      <p className="text-lg font-semibold">{selectedDeal.extractedProperty.sqft.toLocaleString()} sq ft</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Section */}
              {selectedDeal.analysis ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Financial Analysis</h3>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            {selectedDeal.analysis.cashFlow > 0 ? (
                              <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                            )}
                            <span>Monthly Cash Flow</span>
                          </div>
                          <p className={`text-2xl font-bold ${selectedDeal.analysis.cashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(selectedDeal.analysis.cashFlow)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span>Cash-on-Cash Return</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {(selectedDeal.analysis.cocReturn * 100).toFixed(2)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span>Cap Rate</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {(selectedDeal.analysis.capRate * 100).toFixed(2)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Investment Criteria Checks */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Investment Criteria</h4>
                    <div className="space-y-2">
                      {selectedDeal.analysis.passes1PercentRule !== undefined && (
                        <div className={`flex items-start p-3 rounded-lg ${selectedDeal.analysis.passes1PercentRule ? 'bg-green-50' : 'bg-red-50'}`}>
                          <AlertCircle className={`w-5 h-5 mr-2 mt-0.5 ${selectedDeal.analysis.passes1PercentRule ? 'text-green-600' : 'text-red-600'}`} />
                          <div className="flex-1">
                            <p className="font-medium">1% Rule</p>
                            <p className="text-sm text-muted-foreground">
                              Monthly rent should be at least 1% of purchase price
                            </p>
                          </div>
                          <Badge variant={selectedDeal.analysis.passes1PercentRule ? "default" : "destructive"}>
                            {selectedDeal.analysis.passes1PercentRule ? 'Pass' : 'Fail'}
                          </Badge>
                        </div>
                      )}

                      {selectedDeal.analysis.cashFlowPositive !== undefined && (
                        <div className={`flex items-start p-3 rounded-lg ${selectedDeal.analysis.cashFlowPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                          <AlertCircle className={`w-5 h-5 mr-2 mt-0.5 ${selectedDeal.analysis.cashFlowPositive ? 'text-green-600' : 'text-red-600'}`} />
                          <div className="flex-1">
                            <p className="font-medium">Positive Cash Flow</p>
                            <p className="text-sm text-muted-foreground">
                              Monthly income should exceed monthly expenses
                            </p>
                          </div>
                          <Badge variant={selectedDeal.analysis.cashFlowPositive ? "default" : "destructive"}>
                            {selectedDeal.analysis.cashFlowPositive ? 'Pass' : 'Fail'}
                          </Badge>
                        </div>
                      )}

                      {selectedDeal.analysis.cocMeetsBenchmark !== undefined && (
                        <div className={`flex items-start p-3 rounded-lg ${selectedDeal.analysis.cocMeetsBenchmark ? 'bg-green-50' : 'bg-red-50'}`}>
                          <AlertCircle className={`w-5 h-5 mr-2 mt-0.5 ${selectedDeal.analysis.cocMeetsBenchmark ? 'text-green-600' : 'text-red-600'}`} />
                          <div className="flex-1">
                            <p className="font-medium">COC Return Benchmark</p>
                            <p className="text-sm text-muted-foreground">
                              Cash-on-cash return should meet or exceed target
                            </p>
                          </div>
                          <Badge variant={selectedDeal.analysis.cocMeetsBenchmark ? "default" : "destructive"}>
                            {selectedDeal.analysis.cocMeetsBenchmark ? 'Pass' : 'Fail'}
                          </Badge>
                        </div>
                      )}

                      {selectedDeal.analysis.capMeetsBenchmark !== undefined && (
                        <div className={`flex items-start p-3 rounded-lg ${selectedDeal.analysis.capMeetsBenchmark ? 'bg-green-50' : 'bg-red-50'}`}>
                          <AlertCircle className={`w-5 h-5 mr-2 mt-0.5 ${selectedDeal.analysis.capMeetsBenchmark ? 'text-green-600' : 'text-red-600'}`} />
                          <div className="flex-1">
                            <p className="font-medium">Cap Rate Benchmark</p>
                            <p className="text-sm text-muted-foreground">
                              Cap rate should meet or exceed target
                            </p>
                          </div>
                          <Badge variant={selectedDeal.analysis.capMeetsBenchmark ? "default" : "destructive"}>
                            {selectedDeal.analysis.capMeetsBenchmark ? 'Pass' : 'Fail'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Financial Details</h4>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                      {selectedDeal.analysis.calculatedDownpayment !== undefined && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Down Payment</p>
                          <p className="font-semibold">{formatCurrency(selectedDeal.analysis.calculatedDownpayment)}</p>
                        </div>
                      )}
                      {selectedDeal.analysis.calculatedClosingCosts !== undefined && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Closing Costs</p>
                          <p className="font-semibold">{formatCurrency(selectedDeal.analysis.calculatedClosingCosts)}</p>
                        </div>
                      )}
                      {selectedDeal.analysis.totalCashNeeded !== undefined && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Cash Needed</p>
                          <p className="font-semibold text-lg">{formatCurrency(selectedDeal.analysis.totalCashNeeded)}</p>
                        </div>
                      )}
                      {selectedDeal.analysis.totalMonthlyExpenses !== undefined && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                          <p className="font-semibold">{formatCurrency(selectedDeal.analysis.totalMonthlyExpenses)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-8 bg-muted/30 rounded-lg">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                    <p className="text-muted-foreground mb-4">
                      This property has not been analyzed yet. Run an analysis to see financial metrics and investment criteria.
                    </p>
                    <Button
                      onClick={handleRunAnalysis}
                      disabled={analyzeDealMutation.isPending || !selectedDeal.extractedProperty}
                    >
                      {analyzeDealMutation.isPending ? (
                        <>Analyzing...</>
                      ) : (
                        <>Run Analysis</>
                      )}
                    </Button>
                    {!selectedDeal.extractedProperty && (
                      <p className="text-sm text-red-600 mt-2">
                        Cannot analyze: Property data is missing
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Email Details */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">Email Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">From</p>
                      <p className="font-medium">{selectedDeal.sender}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Received</p>
                      <p className="font-medium">{new Date(selectedDeal.receivedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Buttons - Only show for analyzed properties */}
              {selectedDeal.analysis && (
                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport('pdf')}
                    disabled={isExporting}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Download PDF'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport('csv')}
                    disabled={isExporting}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Download CSV'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
