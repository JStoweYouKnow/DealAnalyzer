import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, Save, Star, Brain, Trash2, Edit, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DealAnalysis, SavedFilter, NaturalLanguageSearch, SmartPropertyRecommendation } from "@shared/schema";

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
  propertyTypes?: string[];
  cities?: string[];
  states?: string[];
  meetsCriteria?: boolean;
  investmentGrade?: string[];
}

export function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [newFilterName, setNewFilterName] = useState("");
  const [propertyResults, setPropertyResults] = useState<DealAnalysis[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch saved filters
  const { data: savedFilters = [], isLoading: filtersLoading, error: filtersError } = useQuery<SavedFilter[]>({
    queryKey: ['/api/filters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/filters');
      const data = await response.json();
      return data.data || [];
    }
  });

  // Fetch search history
  const { data: searchHistory = [], error: historyError } = useQuery<NaturalLanguageSearch[]>({
    queryKey: ['/api/search/history'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/search/history');
      const data = await response.json();
      return data.data || [];
    }
  });

  // Fetch smart recommendations (using first available property for demo)
  const { data: recommendations = [], error: recommendationsError } = useQuery<SmartPropertyRecommendation[]>({
    queryKey: ['/api/recommendations/smart-properties'],
    queryFn: async () => {
      // Get first available property to generate recommendations
      const analysisResponse = await apiRequest('GET', '/api/analysis-history');
      const analysisData = await analysisResponse.json();
      
      if (analysisData.data && analysisData.data.length > 0) {
        const firstProperty = analysisData.data[0];
        if (firstProperty.property?.id) {
          const response = await apiRequest('GET', `/api/properties/${firstProperty.property.id}/recommendations`);
          const data = await response.json();
          return data.data || [];
        }
      }
      
      return [];
    }
  });

  // Natural language search mutation
  const naturalSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/search/natural-language', { query });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setPropertyResults(data.results || []);
        queryClient.invalidateQueries({ queryKey: ['/api/search/history'] });
        toast({
          title: "Search Complete",
          description: `Found ${data.results?.length || 0} properties matching your query.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to perform natural language search",
        variant: "destructive",
      });
    }
  });

  // Advanced search mutation
  const advancedSearchMutation = useMutation({
    mutationFn: async (filters: SearchFilters) => {
      const response = await apiRequest('POST', '/api/search/properties', { filters });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setPropertyResults(data.data || []);
        toast({
          title: "Search Complete",
          description: `Found ${data.data?.length || 0} properties matching your criteria.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search properties",
        variant: "destructive",
      });
    }
  });

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

  const handleNaturalSearch = () => {
    if (!searchQuery.trim()) return;
    naturalSearchMutation.mutate(searchQuery);
  };

  const handleAdvancedSearch = () => {
    advancedSearchMutation.mutate(searchFilters);
  };

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the filter.",
        variant: "destructive"
      });
      return;
    }

    saveFilterMutation.mutate({
      name: newFilterName,
      description: `Custom filter with ${Object.keys(searchFilters).length} criteria`,
      filterCriteria: searchFilters
    });
  };

  const loadSavedFilter = (filter: SavedFilter) => {
    setSearchFilters(filter.filterCriteria);
    setSelectedFilter(filter.id!);
    toast({
      title: "Filter Loaded",
      description: `Applied filter: ${filter.name}`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const getInvestmentGradeBadge = (grade: string) => {
    const colors = {
      'A': 'bg-green-100 text-green-800 border-green-200',
      'B': 'bg-blue-100 text-blue-800 border-blue-200',
      'C': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'D': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[grade as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6" data-testid="advanced-search">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Advanced Property Search</h1>
        <p className="text-muted-foreground">
          Use natural language queries or detailed filters to find properties that match your investment criteria.
        </p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" data-testid="tab-search">Smart Search</TabsTrigger>
          <TabsTrigger value="filters" data-testid="tab-filters">Advanced Filters</TabsTrigger>
          <TabsTrigger value="saved" data-testid="tab-saved">Saved Filters</TabsTrigger>
          <TabsTrigger value="recommendations" data-testid="tab-recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Natural Language Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Try: 3 bedroom houses under $300k with positive cash flow in Austin, TX"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  rows={3}
                  data-testid="textarea-natural-search"
                />
                <Button 
                  onClick={handleNaturalSearch}
                  disabled={naturalSearchMutation.isPending || !searchQuery.trim()}
                  data-testid="button-natural-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchHistory.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Recent Searches</Label>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 5).map((search) => (
                      <Button
                        key={search.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery(search.query)}
                        className="text-xs"
                        data-testid={`button-recent-search-${search.id}`}
                      >
                        {search.query.substring(0, 50)}...
                        <Badge variant="secondary" className="ml-2">
                          {search.resultCount}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Advanced Filters
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Filter name"
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    className="w-48"
                    data-testid="input-filter-name"
                  />
                  <Button 
                    onClick={handleSaveFilter}
                    variant="outline"
                    size="sm"
                    disabled={!newFilterName.trim()}
                    data-testid="button-save-filter"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                </div>

                {/* Property Types */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Property Types</Label>
                  <div className="space-y-2">
                    {['single-family', 'multi-family', 'condo', 'townhouse', 'duplex'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={searchFilters.propertyTypes?.includes(type) || false}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSearchFilters(prev => ({
                                ...prev,
                                propertyTypes: [...(prev.propertyTypes || []), type]
                              }));
                            } else {
                              setSearchFilters(prev => ({
                                ...prev,
                                propertyTypes: prev.propertyTypes?.filter(t => t !== type)
                              }));
                            }
                          }}
                          data-testid={`checkbox-property-type-${type}`}
                        />
                        <Label htmlFor={type} className="capitalize text-sm">
                          {type.replace('-', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meets Criteria */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Investment Criteria</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="meets-criteria"
                      checked={searchFilters.meetsCriteria || false}
                      onCheckedChange={(checked) => setSearchFilters(prev => ({ ...prev, meetsCriteria: !!checked }))}
                      data-testid="checkbox-meets-criteria"
                    />
                    <Label htmlFor="meets-criteria" className="text-sm">
                      Only show properties that meet investment criteria
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleAdvancedSearch}
                  disabled={advancedSearchMutation.isPending}
                  size="lg"
                  data-testid="button-advanced-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Properties
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          {filtersLoading ? (
            <div className="text-center py-8">Loading saved filters...</div>
          ) : filtersError ? (
            <div className="text-center py-8 text-red-600">Failed to load saved filters. Please try again later.</div>
          ) : savedFilters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No saved filters yet. Create a filter above and save it to see it here.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedFilters.map((filter) => (
                <Card key={filter.id} className="hover:shadow-lg transition-shadow" data-testid={`saved-filter-${filter.id}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{filter.name}</span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadSavedFilter(filter)}
                          data-testid={`button-load-filter-${filter.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFilterMutation.mutate(filter.id!)}
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
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage Count:</span>
                        <Badge variant="secondary">{filter.usageCount}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Created:</span>
                        <span>{new Date(filter.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>System Filter:</span>
                        <span>{filter.isSystem ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Smart Property Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendationsError ? (
                <div className="text-center py-8 text-red-600">
                  Failed to load recommendations. Please try again later.
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recommendations available. Analyze some properties to get personalized suggestions.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((rec) => (
                    <Card key={rec.id} className="hover:shadow-lg transition-shadow" data-testid={`recommendation-${rec.id}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-lg capitalize">{rec.recommendationType.replace('_', ' ')}</span>
                          <Badge variant="outline">{(rec.similarityScore).toFixed(0)}% match</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Match Reasons:</p>
                          <div className="flex flex-wrap gap-1">
                            {rec.matchReasons.map((reason, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium mb-2">AI Insights:</p>
                          <p className="text-sm text-muted-foreground">{rec.aiInsights}</p>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Confidence:</span>
                          <span className="font-medium">{(rec.confidenceScore * 100).toFixed(0)}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Search Results */}
      {propertyResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({propertyResults.length} properties)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {propertyResults.map((property) => (
                <Card key={property.id} className="hover:shadow-lg transition-shadow" data-testid={`result-property-${property.id}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{property.property.address}</span>
                      {property.meetsCriteria && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Meets Criteria
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {property.property.city}, {property.property.state}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Price</p>
                        <p className="text-lg font-semibold">{formatCurrency(property.property.purchasePrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(property.property.monthlyRent)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{property.property.bedrooms}</p>
                        <p className="text-muted-foreground">Beds</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{property.property.bathrooms}</p>
                        <p className="text-muted-foreground">Baths</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{property.property.squareFootage.toLocaleString()}</p>
                        <p className="text-muted-foreground">Sq Ft</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Cash Flow:</span>
                        <span className={`font-medium ${property.cashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(property.cashFlow)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>COC Return:</span>
                        <span className="font-medium">{(property.cocReturn * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cap Rate:</span>
                        <span className="font-medium">{(property.capRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}