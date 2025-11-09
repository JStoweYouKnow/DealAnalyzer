"use client";

import { useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Home, MapPin, Calendar, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useRouter } from "next/navigation";

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
  educationLevel?: string | Record<string, number>;
};

type MarketTrend = {
  id?: string;
  zipCode?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  averagePrice?: number;
  averageRent?: number;
  priceChangePercent3Month?: number;
  priceChangePercent6Month?: number;
  priceChangePercent1Year?: number;
  rentChangePercent3Month?: number;
  rentChangePercent6Month?: number;
  rentChangePercent1Year?: number;
  daysOnMarket?: number;
  pricePerSqft?: number;
  rentYield?: number;
  totalListings?: number;
  lastUpdated?: string | Date;
  marketStats?: MarketStats;
  sampleProperties?: SampleProperty[];
  demographics?: DemographicsSnapshot;
};

const getChangeColor = (value?: number) => {
  if (value === undefined || value === null) {
    return "text-muted-foreground";
  }
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "text-muted-foreground";
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

const formatPercent = (percent: number) => `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;

const formatCount = (value?: number) =>
  value !== undefined && value !== null ? value.toLocaleString() : 'N/A';

const formatCurrencyOptional = (value?: number) =>
  value !== undefined && value !== null ? formatCurrency(value) : 'N/A';

const formatPercentageOptional = (value?: number, decimals = 1) =>
  value !== undefined && value !== null ? `${value.toFixed(decimals)}%` : 'N/A';

const formatNumberOptional = (value?: number, decimals = 0) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 'N/A';
  }
  return decimals > 0 ? value.toFixed(decimals) : value.toLocaleString();
};

const formatRatioToPercent = (value?: number, decimals = 1) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 'N/A';
  }
  const normalized = value > 1 ? value : value * 100;
  return `${normalized.toFixed(decimals)}%`;
};

const formatDateOptional = (value?: string | Date) => {
  if (!value) return 'N/A';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString();
};

const getTrendBadge = (trend: MarketTrend) => {
  if (trend.lastUpdated || trend.marketStats || trend.averagePrice !== undefined || trend.averageRent !== undefined) {
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

export function MarketIntelligence() {
  const [zipInput, setZipInput] = useState<string>("");
  const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([]);
  const [detailView, setDetailView] = useState<"overview" | "properties" | "insights">("overview");
  const [selectedProperty, setSelectedProperty] = useState<{ property: SampleProperty; trend: MarketTrend } | null>(null);
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const router = useRouter();

  const MAX_COMPARISON_ZIPS = 4;
  const isZipValid = zipInput.trim().length === 5;
  const isZipLimitReached = selectedZipCodes.length >= MAX_COMPARISON_ZIPS;

  const handleZipSubmit = () => {
    const sanitized = zipInput.trim();
    if (!sanitized || sanitized.length !== 5) return;
    if (selectedZipCodes.includes(sanitized) || isZipLimitReached) {
      setZipInput("");
      return;
    }
    setSelectedZipCodes((prev) => [...prev, sanitized]);
    setZipInput("");
  };

  const handleZipRemove = (zip: string) => {
    setSelectedZipCodes((prev) => prev.filter((code) => code !== zip));
  };

  const handleZipClear = () => {
    setSelectedZipCodes([]);
    setZipInput("");
  };

  const fetchTrends = async (params: URLSearchParams) => {
    params.append('live', 'true');
    const queryString = params.toString();
    const response = await apiRequest(
      'GET',
      `/api/market/neighborhood-trends${queryString ? `?${queryString}` : ''}`
    );
    const data = await response.json();
    return (data.data as MarketTrend[]) || [];
  };

  const defaultTrendsQuery = useQuery<MarketTrend[]>({
    queryKey: ['/api/market/neighborhood-trends', 'all', 'live'],
    queryFn: async () => {
      const params = new URLSearchParams();
      return fetchTrends(params);
    },
    enabled: selectedZipCodes.length === 0,
  });

  const comparisonQueries = useQueries({
    queries: selectedZipCodes.map((zip) => ({
      queryKey: ['/api/market/neighborhood-trends', zip, 'live'],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append('zipCode', zip);
        return fetchTrends(params);
      },
    })),
  });

  const isComparing = selectedZipCodes.length > 0;

  const comparisonTrends = isComparing
    ? selectedZipCodes.flatMap((zip, index) => comparisonQueries[index]?.data ?? [])
    : [];

  const neighborhoodTrends = isComparing
    ? comparisonTrends
    : defaultTrendsQuery.data ?? [];

  const trendsLoading = isComparing
    ? comparisonQueries.some((query) => query.isLoading)
    : defaultTrendsQuery.isLoading;

  const trendsError = isComparing
    ? comparisonQueries.find((query) => query.error)?.error
    : defaultTrendsQuery.error;

  const selectedTrend = selectedProperty?.trend;
  const selectedTrendRentYieldPercent =
    selectedTrend && typeof selectedTrend.rentYield === 'number'
      ? selectedTrend.rentYield * 100
      : undefined;
  const selectedTrendComparableCount =
    selectedTrend?.marketStats?.propertiesWithSaleData ??
    (selectedTrend?.sampleProperties ? selectedTrend.sampleProperties.length : undefined);
  const selectedTrendLastUpdated =
    selectedTrend?.lastUpdated ? new Date(selectedTrend.lastUpdated) : undefined;
  const selectedTrendPriceChange12M = selectedTrend?.priceChangePercent1Year;
  const selectedTrendPriceChange6M = selectedTrend?.priceChangePercent6Month;
  const selectedTrendPriceChange3M = selectedTrend?.priceChangePercent3Month;
  const selectedTrendRentChange12M = selectedTrend?.rentChangePercent1Year;
  const selectedTrendRentChange6M = selectedTrend?.rentChangePercent6Month;
  const selectedTrendRentChange3M = selectedTrend?.rentChangePercent3Month;
  const selectedTrendDaysOnMarket = selectedTrend?.daysOnMarket;
  const selectedTrendPricePerSqft = selectedTrend?.pricePerSqft;
  const selectedTrendTotalListings = selectedTrend?.totalListings;

  const selectedTrendChangeMetrics: { key: string; label: string; value: number }[] = [];
  if (typeof selectedTrendPriceChange12M === 'number') {
    selectedTrendChangeMetrics.push({ key: 'price-12m', label: 'Price Change (12M)', value: selectedTrendPriceChange12M });
  }
  if (typeof selectedTrendPriceChange6M === 'number') {
    selectedTrendChangeMetrics.push({ key: 'price-6m', label: 'Price Change (6M)', value: selectedTrendPriceChange6M });
  }
  if (typeof selectedTrendPriceChange3M === 'number') {
    selectedTrendChangeMetrics.push({ key: 'price-3m', label: 'Price Change (3M)', value: selectedTrendPriceChange3M });
  }
  if (typeof selectedTrendRentChange12M === 'number') {
    selectedTrendChangeMetrics.push({ key: 'rent-12m', label: 'Rent Change (12M)', value: selectedTrendRentChange12M });
  }
  if (typeof selectedTrendRentChange6M === 'number') {
    selectedTrendChangeMetrics.push({ key: 'rent-6m', label: 'Rent Change (6M)', value: selectedTrendRentChange6M });
  }
  if (typeof selectedTrendRentChange3M === 'number') {
    selectedTrendChangeMetrics.push({ key: 'rent-3m', label: 'Rent Change (3M)', value: selectedTrendRentChange3M });
  }
  const selectedTrendHasSecondaryMetrics =
    selectedTrendChangeMetrics.length > 0 ||
    typeof selectedTrendRentYieldPercent === 'number' ||
    typeof selectedTrendDaysOnMarket === 'number' ||
    typeof selectedTrendTotalListings === 'number' ||
    typeof selectedTrendComparableCount === 'number' ||
    typeof selectedTrendPricePerSqft === 'number';

  const handlePropertySelect = (trend: MarketTrend, property: SampleProperty) => {
    setSelectedProperty({ trend, property });
    setIsPropertyDialogOpen(true);
  };

  const handleCompare = () => {
    if (!selectedProperty) return;
    try {
      const payload = {
        source: 'market-intelligence',
        timestamp: Date.now(),
        property: selectedProperty.property,
        trend: {
          neighborhood: selectedProperty.trend.neighborhood,
          city: selectedProperty.trend.city,
          state: selectedProperty.trend.state,
          zipCode: selectedProperty.trend.zipCode,
          averagePrice: selectedProperty.trend.averagePrice,
          averageRent: selectedProperty.trend.averageRent,
          priceChangePercent1Year: selectedProperty.trend.priceChangePercent1Year,
          priceChangePercent6Month: selectedProperty.trend.priceChangePercent6Month,
          priceChangePercent3Month: selectedProperty.trend.priceChangePercent3Month,
          rentChangePercent1Year: selectedProperty.trend.rentChangePercent1Year,
          rentChangePercent6Month: selectedProperty.trend.rentChangePercent6Month,
          rentChangePercent3Month: selectedProperty.trend.rentChangePercent3Month,
          rentYield: selectedProperty.trend.rentYield,
          daysOnMarket: selectedProperty.trend.daysOnMarket,
          pricePerSqft: selectedProperty.trend.pricePerSqft,
          totalListings: selectedProperty.trend.totalListings,
          lastUpdated: selectedProperty.trend.lastUpdated,
        },
      };
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('market-intelligence:last-selected-property', JSON.stringify(payload));
      }
    } catch (error) {
      console.warn('Failed to persist selected property for comparison:', error);
    }
    setIsPropertyDialogOpen(false);
    setSelectedProperty(null);
    router.push('/comparison');
  };

  return (
    <div className="space-y-6" data-testid="market-intelligence">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Market Intelligence</h1>
          <p className="text-muted-foreground">
            Analyze neighborhood trends and market conditions to make informed investment decisions.
          </p>
        </div>
      </div>

      <section className="space-y-6">
        <div className="space-y-4">
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
                  if (e.key === 'Enter' && isZipValid && !isZipLimitReached) {
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
                disabled={!isZipValid || isZipLimitReached}
                data-testid="button-add-zip"
              >
                Add ZIP
              </Button>
              <Button
                variant="outline"
                onClick={handleZipClear}
                disabled={selectedZipCodes.length === 0 && !zipInput}
                data-testid="button-clear-zip"
              >
                Clear
              </Button>
            </div>
          </div>

          {isZipLimitReached && (
            <p className="text-xs text-amber-600">
              Maximum of {MAX_COMPARISON_ZIPS} ZIP codes at a time. Remove one to add another.
            </p>
          )}

          {selectedZipCodes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedZipCodes.map((zip) => (
                <Badge key={zip} variant="secondary" className="flex items-center gap-2 px-3 py-1 text-sm">
                  ZIP {zip}
                  <button
                    type="button"
                    onClick={() => handleZipRemove(zip)}
                    className="rounded-full p-1 hover:bg-muted transition-colors"
                    aria-label={`Remove ZIP ${zip}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <span className="text-sm text-muted-foreground">
                {selectedZipCodes.length === 1
                  ? 'Comparing 1 ZIP code.'
                  : `Comparing ${selectedZipCodes.length} ZIP codes.`}
              </span>
            </div>
          )}

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              {selectedZipCodes.length > 0
                ? `Showing live market intelligence for ${
                    selectedZipCodes.length === 1
                      ? `ZIP ${selectedZipCodes[0]}`
                      : `ZIP codes ${selectedZipCodes.join(', ')}`
                  }.`
                : 'Add one or more ZIP codes to explore localized market intelligence powered by live data sources.'}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Choose what you’d like to explore further.
            </p>
            <ToggleGroup
              type="single"
              value={detailView}
              onValueChange={(value) => {
                if (value) {
                  setDetailView(value as typeof detailView);
                }
              }}
              className="justify-start md:justify-end"
              aria-label="Select detail view"
            >
              <ToggleGroupItem value="overview" aria-label="Show overview insights">
                Overview
              </ToggleGroupItem>
              <ToggleGroupItem value="properties" aria-label="Show property cards">
                Property Cards
              </ToggleGroupItem>
              <ToggleGroupItem value="insights" aria-label="Show expanded insights">
                Expanded Insights
              </ToggleGroupItem>
            </ToggleGroup>
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
            No neighborhood trends available. Try a different ZIP code.
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

              const priceChange12M = typeof trend.priceChangePercent1Year === 'number' ? trend.priceChangePercent1Year : undefined;
              const priceChange6M = typeof trend.priceChangePercent6Month === 'number' ? trend.priceChangePercent6Month : undefined;
              const priceChange3M = typeof trend.priceChangePercent3Month === 'number' ? trend.priceChangePercent3Month : undefined;
              const rentChange12M = typeof trend.rentChangePercent1Year === 'number' ? trend.rentChangePercent1Year : undefined;
              const rentChange6M = typeof trend.rentChangePercent6Month === 'number' ? trend.rentChangePercent6Month : undefined;
              const rentChange3M = typeof trend.rentChangePercent3Month === 'number' ? trend.rentChangePercent3Month : undefined;
              const rentYieldPercent = typeof trend.rentYield === 'number' ? trend.rentYield * 100 : undefined;

              const cardKey = trend.zipCode || trend.id || trend.neighborhood || `trend-${index}`;

              return (
                <Card key={cardKey} className="hover:shadow-lg transition-shadow" data-testid={`trend-card-${trend.zipCode || trend.id || index}`}>
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
                        .join(' • ') || 'Location unavailable'}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {detailView === "overview" && trend.marketStats && (
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
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Total Properties</p>
                            <p className="text-lg font-semibold">{formatCount(trend.marketStats.totalProperties)}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Median Sale Price</p>
                            <p className="text-lg font-semibold">{formatCurrencyOptional(trend.marketStats.medianSalePrice)}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Avg Price / Sq Ft</p>
                            <p className="text-lg font-semibold">{formatCurrencyOptional(trend.marketStats.avgPricePerSqft)}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Median Building Size</p>
                            <p className="text-lg font-semibold">
                              {trend.marketStats.medianBuildingSize
                                ? `${Math.round(trend.marketStats.medianBuildingSize).toLocaleString()} sq ft`
                                : 'N/A'}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Avg Year Built</p>
                            <p className="text-lg font-semibold">{formatNumberOptional(trend.marketStats.avgYearBuilt)}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Owner Occupancy</p>
                            <p className="text-lg font-semibold">{formatPercentageOptional(trend.marketStats.ownerOccupancyRate)}</p>
                          </div>
                        </div>
                        {propertyTypeEntries.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Property Mix</p>
                            <div className="flex flex-wrap gap-2">
                              {propertyTypeEntries.map(([type, count]) => (
                                <Badge
                                  key={`${cardKey}-${type}`}
                                  variant="outline"
                                  className="border border-border bg-muted/40 text-foreground"
                                >
                                  {type || 'Unknown'} <span className="ml-1 text-xs text-muted-foreground">({count})</span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </section>
                    )}

                    {detailView === "overview" && (
                      <section className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Historical Rent & Price Trends
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Price</p>
                            <p className="text-lg font-semibold">
                              {typeof trend.averagePrice === 'number' ? formatCurrency(trend.averagePrice) : 'N/A'}
                            </p>
                            {priceChange12M !== undefined && (
                              <div className="flex items-center text-sm">
                                {priceChange12M > 0 ? (
                                  <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                                )}
                                <span className={getChangeColor(priceChange12M)}>{formatPercent(priceChange12M)} YoY</span>
                              </div>
                            )}
                            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {priceChange6M !== undefined && (
                                <div className="flex justify-between">
                                  <span>6-month</span>
                                  <span className={getChangeColor(priceChange6M)}>{formatPercent(priceChange6M)}</span>
                                </div>
                              )}
                              {priceChange3M !== undefined && (
                                <div className="flex justify-between">
                                  <span>3-month</span>
                                  <span className={getChangeColor(priceChange3M)}>{formatPercent(priceChange3M)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Rent</p>
                            <p className="text-lg font-semibold">
                              {typeof trend.averageRent === 'number' ? formatCurrency(trend.averageRent) : 'N/A'}
                            </p>
                            {rentChange12M !== undefined && (
                              <div className="flex items-center text-sm">
                                {rentChange12M > 0 ? (
                                  <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                                )}
                                <span className={getChangeColor(rentChange12M)}>{formatPercent(rentChange12M)} YoY</span>
                              </div>
                            )}
                            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {rentChange6M !== undefined && (
                                <div className="flex justify-between">
                                  <span>6-month</span>
                                  <span className={getChangeColor(rentChange6M)}>{formatPercent(rentChange6M)}</span>
                                </div>
                              )}
                              {rentChange3M !== undefined && (
                                <div className="flex justify-between">
                                  <span>3-month</span>
                                  <span className={getChangeColor(rentChange3M)}>{formatPercent(rentChange3M)}</span>
                                </div>
                              )}
                            </div>
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
                          {typeof trend.totalListings === 'number' && (
                            <div className="flex justify-between">
                              <span>Active Listings:</span>
                              <span className="font-medium">{trend.totalListings.toLocaleString()}</span>
                            </div>
                          )}
                          {trend.lastUpdated && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Last Updated:</span>
                              <span>{formatDateOptional(trend.lastUpdated)}</span>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {detailView === "properties" && trend.sampleProperties?.length ? (
                      <section className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Sample Properties
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {trend.sampleProperties.slice(0, 5).map((property, propertyIndex) => (
                            <button
                              key={`${cardKey}-property-${propertyIndex}`}
                              type="button"
                              onClick={() => handlePropertySelect(trend, property)}
                              className="w-full text-left border border-border rounded-lg bg-muted/20 p-3 space-y-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              data-testid={`sample-property-${propertyIndex}`}
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
                                  <p className="text-muted-foreground/80 capitalize">{property.propertyType || 'Unknown'}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-muted-foreground uppercase">Year Built</p>
                                  <p className="text-muted-foreground/80">{property.yearBuilt ?? '—'}</p>
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
                                  <span>Owner Occupied: {property.ownerOccupied ? 'Yes' : 'No'}</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </section>
                    ) : detailView === "properties" ? (
                      <section className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                        We couldn’t find live sample properties for this area yet. Try another ZIP code or check back soon.
                      </section>
                    ) : null}

                    {detailView === "insights" && trend.demographics && (
                      <section className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Demographics Snapshot
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Population</p>
                            <p className="text-lg font-semibold">{formatCount(trend.demographics.population)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Median Income</p>
                            <p className="text-lg font-semibold">{formatCurrencyOptional(trend.demographics.medianIncome)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Median Age</p>
                            <p className="text-lg font-semibold">{formatNumberOptional(trend.demographics.medianAge, 1)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Median Home Value</p>
                            <p className="text-lg font-semibold">{formatCurrencyOptional(trend.demographics.medianHomeValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Per Capita Income</p>
                            <p className="text-lg font-semibold">{formatCurrencyOptional(trend.demographics.perCapitaIncome)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Median Gross Rent</p>
                            <p className="text-lg font-semibold">{formatCurrencyOptional(trend.demographics.medianGrossRent)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Total Housing Units</p>
                            <p className="text-lg font-semibold">{formatCount(trend.demographics.totalHousingUnits)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Owner Occupied</p>
                            <p className="text-lg font-semibold">{formatCount(trend.demographics.ownerOccupied)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Renter Occupied</p>
                            <p className="text-lg font-semibold">{formatCount(trend.demographics.renterOccupied)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Unemployment Rate</p>
                            <p className="text-lg font-semibold">{formatPercentageOptional(trend.demographics.unemploymentRate)}</p>
                          </div>
                        </div>
                        {trend.demographics.educationLevel && (
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p className="font-semibold uppercase tracking-wide">Education Highlights</p>
                            {typeof trend.demographics.educationLevel === 'string' ? (
                              <p>{trend.demographics.educationLevel}</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(trend.demographics.educationLevel).map(([level, value]) => (
                                  <Badge
                                    key={`${cardKey}-education-${level}`}
                                    variant="outline"
                                    className="border border-border bg-muted/40 text-foreground"
                                  >
                                    {level}
                                    <span className="ml-1 text-[10px] text-muted-foreground">
                                      ({formatRatioToPercent(value)})
                                    </span>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Dialog
        open={isPropertyDialogOpen}
        onOpenChange={(open) => {
          setIsPropertyDialogOpen(open);
          if (!open) {
            setSelectedProperty(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          {selectedProperty && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-col gap-1">
                  <span className="text-base font-semibold text-muted-foreground">
                    {selectedProperty.trend.neighborhood || selectedProperty.trend.city || 'Market Area'}
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {selectedProperty.property.address || 'Address unavailable'}
                  </span>
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 text-sm">
                  <span>
                    {[selectedProperty.trend.city, selectedProperty.trend.state, selectedProperty.trend.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                  {selectedProperty.property.propertyType && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="capitalize">{selectedProperty.property.propertyType}</span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Last Sale Price</p>
                    <p className="text-lg font-semibold">
                      {selectedProperty.property.lastSalePrice
                        ? formatCurrency(selectedProperty.property.lastSalePrice)
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Sale Date</p>
                    <p className="text-lg font-semibold">{formatDateOptional(selectedProperty.property.lastSaleDate)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Beds / Baths</p>
                    <p className="text-lg font-semibold">
                      {(selectedProperty.property.beds ?? '—')} / {selectedProperty.property.baths ?? '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Building Size</p>
                    <p className="text-lg font-semibold">
                      {selectedProperty.property.buildingSize
                        ? `${Math.round(selectedProperty.property.buildingSize).toLocaleString()} sq ft`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Lot Size</p>
                    <p className="text-lg font-semibold">
                      {selectedProperty.property.lotSize
                        ? `${Math.round(selectedProperty.property.lotSize).toLocaleString()} sq ft`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Assessed Value</p>
                    <p className="text-lg font-semibold">
                      {selectedProperty.property.assessedValue
                        ? formatCurrency(selectedProperty.property.assessedValue)
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Year Built</p>
                    <p className="text-lg font-semibold">{selectedProperty.property.yearBuilt ?? 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Owner Occupied</p>
                    <p className="text-lg font-semibold">
                      {selectedProperty.property.ownerOccupied === undefined
                        ? 'N/A'
                        : selectedProperty.property.ownerOccupied
                        ? 'Yes'
                        : 'No'}
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Neighborhood Context
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Average Price</p>
                      <p className="text-lg font-semibold">
                        {typeof selectedTrend?.averagePrice === 'number'
                          ? formatCurrency(selectedTrend.averagePrice)
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Average Rent</p>
                      <p className="text-lg font-semibold">
                        {typeof selectedTrend?.averageRent === 'number'
                          ? formatCurrency(selectedTrend.averageRent)
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Price per Sq Ft</p>
                      <p className="text-lg font-semibold">
                        {typeof selectedTrendPricePerSqft === 'number'
                          ? formatCurrency(selectedTrendPricePerSqft)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {selectedTrendHasSecondaryMetrics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {selectedTrendChangeMetrics.map((metric) => (
                        <div key={metric.key} className="rounded-lg border border-border bg-muted/20 p-3">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">{metric.label}</p>
                          <p className={`text-lg font-semibold ${getChangeColor(metric.value)}`}>
                            {formatPercent(metric.value)}
                          </p>
                        </div>
                      ))}
                      {typeof selectedTrendRentYieldPercent === 'number' && (
                        <div className="rounded-lg border border-border bg-muted/20 p-3">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Rent Yield</p>
                          <p className="text-lg font-semibold">{selectedTrendRentYieldPercent.toFixed(1)}%</p>
                        </div>
                      )}
                      {typeof selectedTrendDaysOnMarket === 'number' && (
                        <div className="rounded-lg border border-border bg-muted/20 p-3">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Days on Market</p>
                          <p className="text-lg font-semibold">{formatNumberOptional(selectedTrendDaysOnMarket)}</p>
                        </div>
                      )}
                      {typeof selectedTrendTotalListings === 'number' && (
                        <div className="rounded-lg border border-border bg-muted/20 p-3">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Active Listings</p>
                          <p className="text-lg font-semibold">{formatCount(selectedTrendTotalListings)}</p>
                        </div>
                      )}
                      {typeof selectedTrendComparableCount === 'number' && (
                        <div className="rounded-lg border border-border bg-muted/20 p-3">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Sales Records Analyzed</p>
                          <p className="text-lg font-semibold">{formatCount(selectedTrendComparableCount)}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedTrendLastUpdated && (
                    <p className="text-xs text-muted-foreground">
                      Last updated {formatDateOptional(selectedTrendLastUpdated)}
                    </p>
                  )}
                </section>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPropertyDialogOpen(false);
                    setSelectedProperty(null);
                  }}
                >
                  Close
                </Button>
                <Button onClick={handleCompare}>Compare with Saved Properties</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
