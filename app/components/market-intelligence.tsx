"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Home, MapPin, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ComparableSale, MarketHeatMapData } from "@shared/schema";

type MarketStats = {
  totalProperties?: number;
  medianSalePrice?: number;
  avgPricePerSqft?: number;
  medianBuildingSize?: number;
  avgYearBuilt?: number;
  propertyTypes?: Record<string, number>;
  ownerOccupancyRate?: number;
  propertiesWithSaleData?: number;
};

type SampleProperty = {
  address?: string;
  propertyType?: string;
  yearBuilt?: number;
  beds?: number;
  baths?: number;
  buildingSize?: number;
  lotSize?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  assessedValue?: number;
  ownerOccupied?: boolean;
};

type DemographicsSnapshot = {
  population?: number;
  medianIncome?: number;
  medianAge?: number;
  medianHomeValue?: number;
  perCapitaIncome?: number;
  medianGrossRent?: number;
  totalHousingUnits?: number;
  ownerOccupied?: number;
  renterOccupied?: number;
  unemploymentRate?: number;
  educationLevel?: string;
};

type MarketTrend = {
  id?: string;
  zipCode?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  marketHeat?: string;
  averagePrice?: number;
  averageRent?: number;
  priceChangePercent1Year?: number;
  rentChangePercent1Year?: number;
  daysOnMarket?: number;
  pricePerSqft?: number;
  rentYield?: number;
  marketStats?: MarketStats;
  sampleProperties?: SampleProperty[];
  demographics?: DemographicsSnapshot;
};

export function MarketIntelligence() {
  const [zipInput, setZipInput] = useState<string>("");
  const [zipCode, setZipCode] = useState<string>("");
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [useLiveData, setUseLiveData] = useState<boolean>(false);

  const isZipValid = zipInput.trim().length === 5;

  const handleZipSubmit = () => {
    const sanitized = zipInput.trim();
    if (!sanitized) {
      return;
    }
    setZipInput(sanitized);
    setZipCode(sanitized);
  };

  const handleZipClear = () => {
    setZipInput("");
    setZipCode("");
  };

  // Fetch neighborhood trends
  const { data: neighborhoodTrends = [], isLoading: trendsLoading, error: trendsError } = useQuery<MarketTrend[]>({
    queryKey: ['/api/market/neighborhood-trends', zipCode || 'all', useLiveData],
    queryFn: async () => {
      const params = new URLSearchParams();
      const trimmedZip = zipCode.trim();
      if (trimmedZip) {
        params.append('zipCode', trimmedZip);
      }
      if (useLiveData) {
        params.append('live', 'true');
      }

      const queryString = params.toString();
      const response = await apiRequest(
        'GET',
        `/api/market/neighborhood-trends${queryString ? `?${queryString}` : ''}`
      );
      const data = await response.json();
      return (data.data as MarketTrend[]) || [];
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

  const formatCount = (value?: number) => {
    return value !== undefined && value !== null
      ? value.toLocaleString()
      : 'N/A';
  };

  const formatCurrencyOptional = (value?: number) => {
    return value !== undefined && value !== null
      ? formatCurrency(value)
      : 'N/A';
  };

  const formatPercentageOptional = (value?: number, decimals = 1) => {
    return value !== undefined && value !== null
      ? `${value.toFixed(decimals)}%`
      : 'N/A';
  };

  const formatNumberOptional = (value?: number, decimals = 0) => {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return 'N/A';
    }
    return decimals > 0 ? value.toFixed(decimals) : value.toLocaleString();
  };

  const formatDateOptional = (value?: string) => {
    return value ? new Date(value).toLocaleDateString() : 'N/A';
  };

  const getTrendBadge = (trend: MarketTrend) => {
    if (trend.marketHeat) {
      return {
        label: trend.marketHeat,
        className: getMarketHeatBadge(trend.marketHeat),
      };
    }

    if (trend.marketStats) {
      return {
        label: 'Live Data',
        className: 'bg-green-100 text-green-800 border-green-200',
      };
    }

    return {
      label: 'Historical',
      className: 'bg-slate-100 text-slate-800 border-slate-200',
    };
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

        <TabsContent value="trends" className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1 md:max-w-xs">
                <Label htmlFor="zip-search" className="text-sm font-medium">
                  ZIP Code
                </Label>
                <Input
                  id="zip-search"
                  placeholder="Enter 5-digit ZIP"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isZipValid) {
                      e.preventDefault();
                      handleZipSubmit();
                    }
                  }}
                  className="h-10"
                  data-testid="input-zip-search"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleZipSubmit}
                  disabled={!isZipValid}
                  data-testid="button-search-zip"
                >
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={handleZipClear}
                  disabled={!zipInput && !zipCode}
                  data-testid="button-clear-zip"
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                {zipCode
                  ? `Showing market intelligence for ZIP ${zipCode}${useLiveData ? ' with live data sources.' : '.'}`
                  : 'Enter a ZIP code to explore localized market intelligence. Without a ZIP we display sample historical data.'}
              </p>
              {useLiveData && !zipCode && (
                <p className="text-xs text-amber-600">
                  Enter a ZIP code to activate live Attom & Census insights.
                </p>
              )}
            </div>
          </div>

          {trendsLoading ? (
            <div className="text-center py-8">Loading neighborhood trends...</div>
          ) : trendsError ? (
            <div className="text-center py-8 text-red-600">
              Failed to load neighborhood trends. Please try again later.
            </div>
          ) : neighborhoodTrends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No neighborhood trends available. Try a different ZIP code or toggle off live data.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {neighborhoodTrends.map((trend, index) => {
                const { label, className } = getTrendBadge(trend);
                const propertyTypeEntries = trend.marketStats?.propertyTypes
                  ? Object.entries(trend.marketStats.propertyTypes)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                  : [];
                const priceChange =
                  typeof trend.priceChangePercent1Year === 'number'
                    ? trend.priceChangePercent1Year
                    : undefined;
                const rentChange =
                  typeof trend.rentChangePercent1Year === 'number'
                    ? trend.rentChangePercent1Year
                    : undefined;
                const rentYieldPercent =
                  typeof trend.rentYield === 'number' ? trend.rentYield * 100 : undefined;

                const hasLegacyMetrics =
                  typeof trend.averagePrice === 'number' ||
                  typeof trend.averageRent === 'number' ||
                  typeof trend.daysOnMarket === 'number' ||
                  typeof trend.pricePerSqft === 'number' ||
                  typeof priceChange === 'number' ||
                  typeof rentChange === 'number' ||
                  typeof rentYieldPercent === 'number';

                const cardKey = trend.zipCode || trend.id || trend.neighborhood || `trend-${index}`;

                return (
                  <Card
                    key={cardKey}
                    className="hover:shadow-lg transition-shadow"
                    data-testid={`trend-card-${trend.zipCode || trend.id || index}`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between gap-3">
                        <span className="text-lg">
                          {trend.neighborhood || (trend.zipCode ? `Zip ${trend.zipCode}` : 'Market Area')}
                        </span>
                        <Badge className={className}>{label}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {[
                          trend.city,
                          trend.state,
                          trend.zipCode ? `ZIP ${trend.zipCode}` : undefined,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "Location unavailable"}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {trend.marketStats && (
                        <section className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                              Market Snapshot
                            </h4>
                            {trend.marketStats.propertiesWithSaleData !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                Sale data for {formatCount(trend.marketStats.propertiesWithSaleData)} properties
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">
                                Total Properties
                              </p>
                              <p className="text-lg font-semibold">{formatCount(trend.marketStats.totalProperties)}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">
                                Median Sale Price
                              </p>
                              <p className="text-lg font-semibold">
                                {formatCurrencyOptional(trend.marketStats.medianSalePrice)}
                              </p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">
                                Avg Price / Sq Ft
                              </p>
                              <p className="text-lg font-semibold">
                                {formatCurrencyOptional(trend.marketStats.avgPricePerSqft)}
                              </p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">
                                Median Building Size
                              </p>
                              <p className="text-lg font-semibold">
                                {trend.marketStats.medianBuildingSize
                                  ? `${Math.round(trend.marketStats.medianBuildingSize).toLocaleString()} sq ft`
                                  : 'N/A'}
                              </p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">
                                Avg Year Built
                              </p>
                              <p className="text-lg font-semibold">
                                {formatNumberOptional(trend.marketStats.avgYearBuilt)}
                              </p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">
                                Owner Occupancy
                              </p>
                              <p className="text-lg font-semibold">
                                {formatPercentageOptional(trend.marketStats.ownerOccupancyRate)}
                              </p>
                            </div>
                          </div>
                          {propertyTypeEntries.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                Property Mix
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {propertyTypeEntries.map(([type, count]) => (
                                  <Badge
                                    key={`${cardKey}-${type}`}
                                    variant="outline"
                                    className="border border-border bg-muted/40 text-foreground"
                                  >
                                    {type || 'Unknown'}{" "}
                                    <span className="ml-1 text-xs text-muted-foreground">({count})</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </section>
                      )}

                      {hasLegacyMetrics && (
                        <section className="space-y-3">
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Historical Rent & Price Trends
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Avg Price</p>
                              <p className="text-lg font-semibold">
                                {typeof trend.averagePrice === 'number'
                                  ? formatCurrency(trend.averagePrice)
                                  : 'N/A'}
                              </p>
                              {priceChange !== undefined && (
                                <div className="flex items-center text-sm">
                                  {priceChange > 0 ? (
                                    <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                                  )}
                                  <span className={priceChange > 0 ? "text-green-600" : "text-red-600"}>
                                    {formatPercent(priceChange)} YoY
                                  </span>
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Avg Rent</p>
                              <p className="text-lg font-semibold">
                                {typeof trend.averageRent === 'number'
                                  ? formatCurrency(trend.averageRent)
                                  : 'N/A'}
                              </p>
                              {rentChange !== undefined && (
                                <div className="flex items-center text-sm">
                                  {rentChange > 0 ? (
                                    <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                                  )}
                                  <span className={rentChange > 0 ? "text-green-600" : "text-red-600"}>
                                    {formatPercent(rentChange)} YoY
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="pt-2 border-t space-y-2 text-sm">
                            {typeof trend.daysOnMarket === 'number' && (
                              <div className="flex justify-between">
                                <span>Days on Market:</span>
                                <span className="font-medium">{trend.daysOnMarket}</span>
                              </div>
                            )}
                            {typeof trend.pricePerSqft === 'number' && (
                              <div className="flex justify-between">
                                <span>Price per Sq Ft:</span>
                                <span className="font-medium">{formatCurrency(trend.pricePerSqft)}</span>
                              </div>
                            )}
                            {typeof rentYieldPercent === 'number' && (
                              <div className="flex justify-between">
                                <span>Rent Yield:</span>
                                <span className="font-medium">{rentYieldPercent.toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      {trend.sampleProperties?.length ? (
                        <section className="space-y-3">
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Sample Properties
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {trend.sampleProperties.slice(0, 5).map((property, propertyIndex) => (
                              <div
                                key={`${cardKey}-property-${propertyIndex}`}
                                className="border border-border rounded-lg bg-muted/20 p-3 space-y-2"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="text-sm font-medium flex items-center gap-2">
                                    <Home className="w-4 h-4 text-muted-foreground" />
                                    {property.address || 'Address unavailable'}
                                  </div>
                                  {property.lastSalePrice && (
                                    <span className="text-sm font-semibold text-green-700">
                                      {formatCurrency(property.lastSalePrice)}
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                  <div>
                                    <p className="font-medium text-muted-foreground uppercase">Type</p>
                                    <p className="text-muted-foreground/80 capitalize">
                                      {property.propertyType || 'Unknown'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-muted-foreground uppercase">Year Built</p>
                                    <p className="text-muted-foreground/80">
                                      {property.yearBuilt ?? '—'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-muted-foreground uppercase">Beds / Baths</p>
                                    <p className="text-muted-foreground/80">
                                      {property.beds ?? '—'} / {property.baths ?? '—'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-muted-foreground uppercase">Building Size</p>
                                    <p className="text-muted-foreground/80">
                                      {property.buildingSize
                                        ? `${Math.round(property.buildingSize).toLocaleString()} sq ft`
                                        : 'N/A'}
                                    </p>
                                  </div>
                                  {property.lotSize !== undefined && (
                                    <div>
                                      <p className="font-medium text-muted-foreground uppercase">Lot Size</p>
                                      <p className="text-muted-foreground/80">
                                        {property.lotSize
                                          ? `${Math.round(property.lotSize).toLocaleString()} sq ft`
                                          : 'N/A'}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  {property.lastSaleDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {formatDateOptional(property.lastSaleDate)}
                                    </span>
                                  )}
                                  {property.assessedValue && (
                                    <span>Assessed: {formatCurrency(property.assessedValue)}</span>
                                  )}
                                  {property.ownerOccupied !== undefined && (
                                    <span>
                                      Owner Occupied: {property.ownerOccupied ? 'Yes' : 'No'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}

                      {trend.demographics && (
                        <section className="space-y-3">
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Demographics Snapshot
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Population</p>
                              <p className="text-lg font-semibold">
                                {formatCount(trend.demographics.population)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Median Income</p>
                              <p className="text-lg font-semibold">
                                {formatCurrencyOptional(trend.demographics.medianIncome)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Median Age</p>
                              <p className="text-lg font-semibold">
                                {formatNumberOptional(trend.demographics.medianAge, 1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Median Home Value</p>
                              <p className="text-lg font-semibold">
                                {formatCurrencyOptional(trend.demographics.medianHomeValue)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Per Capita Income</p>
                              <p className="text-lg font-semibold">
                                {formatCurrencyOptional(trend.demographics.perCapitaIncome)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Median Gross Rent</p>
                              <p className="text-lg font-semibold">
                                {formatCurrencyOptional(trend.demographics.medianGrossRent)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Total Housing Units</p>
                              <p className="text-lg font-semibold">
                                {formatCount(trend.demographics.totalHousingUnits)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Owner Occupied</p>
                              <p className="text-lg font-semibold">
                                {formatCount(trend.demographics.ownerOccupied)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Renter Occupied</p>
                              <p className="text-lg font-semibold">
                                {formatCount(trend.demographics.renterOccupied)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Unemployment Rate</p>
                              <p className="text-lg font-semibold">
                                {formatPercentageOptional(trend.demographics.unemploymentRate)}
                              </p>
                            </div>
                          </div>
                          {trend.demographics.educationLevel && (
                            <p className="text-xs text-muted-foreground">
                              Education Highlights: {trend.demographics.educationLevel}
                            </p>
                          )}
                        </section>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
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