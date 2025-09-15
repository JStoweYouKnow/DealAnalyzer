import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Home, MapPin, Calendar, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { NeighborhoodTrend, ComparableSale, MarketHeatMapData } from "@shared/schema";

export function MarketIntelligence() {
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [useLiveData, setUseLiveData] = useState<boolean>(false);

  // Fetch neighborhood trends
  const { data: neighborhoodTrends = [], isLoading: trendsLoading, error: trendsError } = useQuery<NeighborhoodTrend[]>({
    queryKey: ['/api/market/neighborhood-trends', selectedCity, selectedState, useLiveData],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCity !== "all") params.append('city', selectedCity);
      if (selectedState !== "all") params.append('state', selectedState);
      if (useLiveData) params.append('live', 'true');
      
      const response = await apiRequest('GET', `/api/market/neighborhood-trends?${params}`);
      const data = await response.json();
      return data.data || [];
    }
  });

  // Fetch comparable sales
  const { data: comparableSales = [], isLoading: salesLoading, error: salesError } = useQuery<ComparableSale[]>({
    queryKey: ['/api/market/comparable-sales', searchAddress, useLiveData],
    queryFn: async () => {
      if (!searchAddress) return [];
      
      const params = new URLSearchParams();
      params.append('address', searchAddress);
      params.append('radius', '2');
      if (useLiveData) params.append('live', 'true');
      
      const response = await apiRequest('GET', `/api/market/comparable-sales?${params}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!searchAddress
  });

  // Fetch market heat map data
  const { data: heatMapData = [], isLoading: heatMapLoading, error: heatMapError } = useQuery<MarketHeatMapData[]>({
    queryKey: ['/api/market/heat-map', useLiveData],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (useLiveData) params.append('live', 'true');
      
      const response = await apiRequest('GET', `/api/market/heat-map?${params}`);
      const data = await response.json();
      return data.data || [];
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
  };

  const getHeatLevelColor = (level: string) => {
    switch (level) {
      case 'very_hot': return 'bg-red-500 text-white';
      case 'hot': return 'bg-orange-500 text-white';
      case 'warm': return 'bg-yellow-500 text-black';
      case 'balanced': return 'bg-blue-500 text-white';
      case 'cool': return 'bg-gray-500 text-white';
      default: return 'bg-gray-300 text-black';
    }
  };

  const getMarketHeatBadge = (heat: string) => {
    switch (heat) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-200';
      case 'warm': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'balanced': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cool': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cold': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6" data-testid="market-intelligence">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Market Intelligence</h1>
            <p className="text-muted-foreground">
              Analyze neighborhood trends, comparable sales, and market conditions to make informed investment decisions.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="live-data-toggle" className="text-sm font-medium">
              Live Data
            </label>
            <input
              id="live-data-toggle"
              type="checkbox"
              checked={useLiveData}
              onChange={(e) => setUseLiveData(e.target.checked)}
              className="rounded border-gray-300"
              data-testid="toggle-live-data"
            />
            {useLiveData && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Live
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends" data-testid="tab-trends">Neighborhood Trends</TabsTrigger>
          <TabsTrigger value="sales" data-testid="tab-sales">Comparable Sales</TabsTrigger>
          <TabsTrigger value="heatmap" data-testid="tab-heatmap">Market Heat Map</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="flex space-x-4">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-48" data-testid="select-state">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="CA">California</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
                <SelectItem value="FL">Florida</SelectItem>
                <SelectItem value="NY">New York</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-48" data-testid="select-city">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Los Angeles">Los Angeles</SelectItem>
                <SelectItem value="Austin">Austin</SelectItem>
                <SelectItem value="Miami">Miami</SelectItem>
                <SelectItem value="New York">New York</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {trendsLoading ? (
            <div className="text-center py-8">Loading neighborhood trends...</div>
          ) : trendsError ? (
            <div className="text-center py-8 text-red-600">Failed to load neighborhood trends. Please try again later.</div>
          ) : neighborhoodTrends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No neighborhood trends available for the selected area.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {neighborhoodTrends.map((trend) => (
                <Card key={trend.id} className="hover:shadow-lg transition-shadow" data-testid={`trend-card-${trend.id}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{trend.neighborhood}</span>
                      <Badge className={getMarketHeatBadge(trend.marketHeat)}>
                        {trend.marketHeat}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {trend.city}, {trend.state}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Price</p>
                        <p className="text-lg font-semibold">{formatCurrency(trend.averagePrice)}</p>
                        <div className="flex items-center text-sm">
                          {trend.priceChangePercent1Year > 0 ? (
                            <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                          )}
                          <span className={trend.priceChangePercent1Year > 0 ? "text-green-600" : "text-red-600"}>
                            {formatPercent(trend.priceChangePercent1Year)} YoY
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Rent</p>
                        <p className="text-lg font-semibold">{formatCurrency(trend.averageRent)}</p>
                        <div className="flex items-center text-sm">
                          {trend.rentChangePercent1Year > 0 ? (
                            <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                          )}
                          <span className={trend.rentChangePercent1Year > 0 ? "text-green-600" : "text-red-600"}>
                            {formatPercent(trend.rentChangePercent1Year)} YoY
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Days on Market:</span>
                        <span className="font-medium">{trend.daysOnMarket}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Price per Sq Ft:</span>
                        <span className="font-medium">{formatCurrency(trend.pricePerSqft)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Rent Yield:</span>
                        <span className="font-medium">{(trend.rentYield * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="flex space-x-4">
            <Input 
              placeholder="Enter property address to find comparable sales..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="flex-1"
              data-testid="input-address-search"
            />
            <Button 
              onClick={() => setSearchAddress("")}
              variant="outline"
              data-testid="button-clear-search"
            >
              Clear
            </Button>
          </div>

          {salesLoading ? (
            <div className="text-center py-8">Loading comparable sales...</div>
          ) : salesError ? (
            <div className="text-center py-8 text-red-600">Failed to load comparable sales. Please try again.</div>
          ) : searchAddress ? (
            <div className="space-y-4">
              {comparableSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No comparable sales found for this address. Try a different location.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {comparableSales.map((sale) => (
                    <Card key={sale.id} className="hover:shadow-lg transition-shadow" data-testid={`sale-card-${sale.id}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-lg">{sale.address}</span>
                          <Badge variant="outline">{sale.distance.toFixed(1)} mi</Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {sale.city}, {sale.state} {sale.zipCode}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Sale Price</p>
                            <p className="text-xl font-semibold text-green-600">{formatCurrency(sale.salePrice)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Price per Sq Ft</p>
                            <p className="text-lg font-semibold">{formatCurrency(sale.pricePerSqft)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{sale.bedrooms}</p>
                            <p className="text-muted-foreground">Beds</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{sale.bathrooms}</p>
                            <p className="text-muted-foreground">Baths</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{sale.squareFootage.toLocaleString()}</p>
                            <p className="text-muted-foreground">Sq Ft</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span>Sale Date:</span>
                            <span className="font-medium flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(sale.saleDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Year Built:</span>
                            <span className="font-medium">{sale.yearBuilt}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Property Type:</span>
                            <span className="font-medium capitalize">{sale.propertyType}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Enter a property address above to find comparable sales in the area.
            </div>
          )}
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          {heatMapLoading ? (
            <div className="text-center py-8">Loading market heat map data...</div>
          ) : heatMapError ? (
            <div className="text-center py-8 text-red-600">Failed to load market heat map data. Please try again later.</div>
          ) : heatMapData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No market heat map data available.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 text-sm">
                <span className="font-medium">Market Heat Legend:</span>
                <div className="flex space-x-2">
                  {[
                    { level: 'very_hot', label: 'Very Hot' },
                    { level: 'hot', label: 'Hot' },
                    { level: 'warm', label: 'Warm' },
                    { level: 'balanced', label: 'Balanced' },
                    { level: 'cool', label: 'Cool' }
                  ].map(({ level, label }) => (
                    <div key={level} className="flex items-center space-x-1">
                      <div className={`w-3 h-3 rounded ${getHeatLevelColor(level)}`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map-style Grid Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>Interactive Heat Map</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Visual representation of market activity by area. Hover over tiles for details.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-1 p-4 bg-muted/30 rounded-lg" data-testid="heatmap-grid">
                    {heatMapData.map((area, index) => (
                      <div
                        key={area.id}
                        className={`
                          relative aspect-square rounded cursor-pointer transition-all duration-200
                          hover:scale-110 hover:z-10 hover:shadow-lg
                          ${getHeatLevelColor(area.heatLevel)}
                        `}
                        title={`${area.zipCode} - ${area.city}, ${area.state}\nInvestment Score: ${area.investmentScore}/100\nAvg Price: ${formatCurrency(area.averagePrice)}\nDeal Volume: ${area.dealVolume}`}
                        data-testid={`heatmap-tile-${area.id}`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium opacity-80">
                            {area.zipCode.slice(-3)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Cards View */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {heatMapData.map((area) => (
                  <Card key={area.id} className="hover:shadow-lg transition-shadow" data-testid={`heatmap-card-${area.id}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg">{area.zipCode}</span>
                        <Badge className={getHeatLevelColor(area.heatLevel)}>
                          {area.heatLevel.replace('_', ' ')}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {area.city}, {area.state}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Price</p>
                          <p className="text-lg font-semibold">{formatCurrency(area.averagePrice)}</p>
                          <div className="flex items-center text-sm">
                            {area.priceChangePercent > 0 ? (
                              <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                            )}
                            <span className={area.priceChangePercent > 0 ? "text-green-600" : "text-red-600"}>
                              {formatPercent(area.priceChangePercent)}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Rent</p>
                          <p className="text-lg font-semibold">{formatCurrency(area.averageRent)}</p>
                          <div className="flex items-center text-sm">
                            {area.rentChangePercent > 0 ? (
                              <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                            )}
                            <span className={area.rentChangePercent > 0 ? "text-green-600" : "text-red-600"}>
                              {formatPercent(area.rentChangePercent)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span>Investment Score:</span>
                          <span className="font-medium">{area.investmentScore}/100</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Deal Volume:</span>
                          <span className="font-medium">{area.dealVolume}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Last Updated:</span>
                          <span className="font-medium">{new Date(area.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}