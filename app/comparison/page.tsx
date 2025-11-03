"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Home,
  DollarSign,
  Calendar,
  MapPin,
  X,
  Plus,
  Download
} from "lucide-react";
import Link from "next/link";

interface PropertyComparison {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  cashFlow: number;
  cocReturn: number;
  capRate: number;
  monthlyRent: number;
  monthlyExpenses: number;
  downPayment: number;
  meetsCriteria: boolean;
}

export default function ComparisonPage() {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  // Fetch user's recent analyses for comparison
  const { data: analyses = [] } = useQuery<any[]>({
    queryKey: ['/api/history'],
    queryFn: async () => {
      const response = await fetch('/api/history');
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    },
  });

  const toggleProperty = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : prev.length < 5 // Max 5 properties
        ? [...prev, propertyId]
        : prev
    );
  };

  const clearAll = () => setSelectedProperties([]);

  const comparisonData = analyses
    .filter(analysis => selectedProperties.includes(analysis.propertyId))
    .map(analysis => ({
      id: analysis.propertyId,
      address: analysis.property?.address || 'Unknown',
      price: analysis.property?.purchasePrice || 0,
      bedrooms: analysis.property?.bedrooms || 0,
      bathrooms: analysis.property?.bathrooms || 0,
      sqft: analysis.property?.sqft || 0,
      cashFlow: analysis.cashFlow || 0,
      cocReturn: analysis.cocReturn || 0,
      capRate: analysis.capRate || 0,
      monthlyRent: analysis.monthlyRevenue || 0,
      monthlyExpenses: analysis.totalMonthlyExpenses || 0,
      downPayment: analysis.downPayment || 0,
      meetsCriteria: analysis.meetsCriteria || false,
    }));

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  // CSV Export function
  const exportToCSV = () => {
    if (comparisonData.length === 0) return;

    // CSV Headers
    const headers = [
      'Address',
      'Status',
      'Purchase Price',
      'Monthly Cash Flow',
      'CoC Return (%)',
      'Cap Rate (%)',
      'Down Payment',
      'Monthly Rent',
      'Monthly Expenses',
      'Annual Cash Flow',
      'Bedrooms',
      'Bathrooms',
      'Square Feet',
      'Price per Sq Ft'
    ];

    // CSV Rows
    const rows = comparisonData.map(property => [
      property.address,
      property.meetsCriteria ? 'Pass' : 'Fail',
      property.price,
      property.cashFlow,
      (property.cocReturn * 100).toFixed(2),
      (property.capRate * 100).toFixed(2),
      property.downPayment,
      property.monthlyRent,
      property.monthlyExpenses,
      property.cashFlow * 12,
      property.bedrooms || 'N/A',
      property.bathrooms || 'N/A',
      property.sqft || 'N/A',
      property.sqft ? (property.price / property.sqft).toFixed(2) : 'N/A'
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell =>
        // Escape cells that contain commas or quotes
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      ).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `property-comparison-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Comparison</h1>
        <p className="text-muted-foreground">
          Compare up to 5 properties side-by-side to find the best investment
        </p>
      </div>

      {/* Property Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Select Properties to Compare ({selectedProperties.length}/5)</span>
            {selectedProperties.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.slice(0, 10).map((analysis) => {
              const isSelected = selectedProperties.includes(analysis.propertyId);
              const isFull = selectedProperties.length >= 5 && !isSelected;

              return (
                <div
                  key={analysis.propertyId}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : isFull
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => !isFull && toggleProperty(analysis.propertyId)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {analysis.property?.address || 'Unknown Address'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(analysis.property?.purchasePrice || 0)}
                      </p>
                    </div>
                    {isSelected ? (
                      <X className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge
                      variant={analysis.meetsCriteria ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {analysis.meetsCriteria ? '✓ Meets Criteria' : '✗ Does Not Meet'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {analyses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No properties analyzed yet.</p>
              <Link href="/">
                <Button className="mt-4">Analyze Your First Property</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selectedProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Side-by-Side Comparison</span>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export to CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="financial">Financial Metrics</TabsTrigger>
                <TabsTrigger value="details">Property Details</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Metric</th>
                        {comparisonData.map((property) => (
                          <th key={property.id} className="text-left p-4 font-medium min-w-[200px]">
                            <div className="line-clamp-2 text-sm">{property.address}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Status</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            <Badge
                              variant={property.meetsCriteria ? 'default' : 'secondary'}
                            >
                              {property.meetsCriteria ? '✓ Pass' : '✗ Fail'}
                            </Badge>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Purchase Price</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            {formatCurrency(property.price)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Monthly Cash Flow</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            <span
                              className={
                                property.cashFlow > 0
                                  ? 'text-green-600 font-medium'
                                  : 'text-red-600 font-medium'
                              }
                            >
                              {formatCurrency(property.cashFlow)}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">CoC Return</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            {formatPercent(property.cocReturn)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Cap Rate</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            {formatPercent(property.capRate)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Financial Metrics Tab */}
              <TabsContent value="financial">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Metric</th>
                        {comparisonData.map((property) => (
                          <th key={property.id} className="text-left p-4 font-medium min-w-[200px]">
                            <div className="line-clamp-2 text-sm">{property.address}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Down Payment</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            {formatCurrency(property.downPayment)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Monthly Rent</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            {formatCurrency(property.monthlyRent)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Monthly Expenses</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            {formatCurrency(property.monthlyExpenses)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Net Cash Flow</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            <span
                              className={
                                property.cashFlow > 0
                                  ? 'text-green-600 font-medium'
                                  : 'text-red-600 font-medium'
                              }
                            >
                              {formatCurrency(property.cashFlow)}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Annual Cash Flow</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            <span
                              className={
                                property.cashFlow > 0
                                  ? 'text-green-600 font-medium'
                                  : 'text-red-600 font-medium'
                              }
                            >
                              {formatCurrency(property.cashFlow * 12)}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Property Details Tab */}
              <TabsContent value="details">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Detail</th>
                        {comparisonData.map((property) => (
                          <th key={property.id} className="text-left p-4 font-medium min-w-[200px]">
                            <div className="line-clamp-2 text-sm">{property.address}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Bedrooms</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            {property.bedrooms || 'N/A'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Bathrooms</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            {property.bathrooms || 'N/A'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Square Feet</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            {property.sqft ? property.sqft.toLocaleString() : 'N/A'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">Price per Sq Ft</td>
                        {comparisonData.map((property) => (
                          <td key={property.id} className="p-4">
                            {property.sqft
                              ? formatCurrency(property.price / property.sqft)
                              : 'N/A'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {selectedProperties.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Properties Selected</h3>
            <p className="text-muted-foreground mb-4">
              Select properties above to start comparing
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
