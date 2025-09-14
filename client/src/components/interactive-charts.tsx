import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";
import type { DealAnalysis, CriteriaResponse } from "@shared/schema";

interface InteractiveChartsProps {
  analysis: DealAnalysis;
  criteria?: CriteriaResponse;
  comparisonAnalyses?: DealAnalysis[];
}

export function InteractiveCharts({ analysis, criteria, comparisonAnalyses = [] }: InteractiveChartsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("5-years");
  const [selectedChartType, setSelectedChartType] = useState<string>("financial");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${(percent * 100).toFixed(1)}%`;
  };

  // Financial Overview Data
  const financialData = [
    {
      name: 'Monthly Cash Flow',
      value: analysis.cashFlow,
      target: criteria?.minCashFlow || 0,
      status: analysis.cashFlowPositive ? 'positive' : 'negative'
    },
    {
      name: 'COC Return',
      value: analysis.cocReturn * 100,
      target: (criteria?.minCocReturn || 0) * 100,
      status: analysis.cocMeetsBenchmark ? 'meets' : 'below'
    },
    {
      name: 'Cap Rate',
      value: analysis.capRate * 100,
      target: (criteria?.minCapRate || 0) * 100,
      status: analysis.capMeetsBenchmark ? 'meets' : 'below'
    },
    {
      name: '1% Rule',
      value: (analysis.property.monthlyRent / analysis.property.purchasePrice) * 100,
      target: 1,
      status: analysis.passes1PercentRule ? 'meets' : 'below'
    }
  ];

  // Cash Flow Projection Data
  const timeframes = {
    "1-year": 12,
    "3-years": 36,
    "5-years": 60,
    "10-years": 120
  };

  const projectionData = Array.from({ length: timeframes[selectedTimeframe as keyof typeof timeframes] }, (_, i) => {
    const month = i + 1;
    const year = Math.floor(month / 12) + 1;
    const appreciationRate = analysis.aiAnalysis?.predictiveAnalysis?.appreciationForecast || 0.03;
    const rentGrowthRate = analysis.aiAnalysis?.predictiveAnalysis?.rentGrowthForecast || 0.02;
    
    const propertyValue = analysis.property.purchasePrice * Math.pow(1 + appreciationRate / 12, month);
    const monthlyRent = analysis.property.monthlyRent * Math.pow(1 + rentGrowthRate / 12, month);
    const monthlyCashFlow = monthlyRent - (analysis.totalMonthlyExpenses || 0);
    const equity = propertyValue - (analysis.property.purchasePrice * 0.8); // Assuming 20% down
    const totalReturn = (monthlyCashFlow * month) + equity;

    return {
      month: month,
      year: year,
      monthLabel: month % 12 === 0 ? `Year ${year}` : `M${month}`,
      propertyValue: Math.round(propertyValue),
      monthlyRent: Math.round(monthlyRent),
      cashFlow: Math.round(monthlyCashFlow),
      equity: Math.round(equity),
      totalReturn: Math.round(totalReturn),
      cumulativeCashFlow: Math.round(monthlyCashFlow * month)
    };
  });

  // Investment Breakdown Data
  const investmentBreakdown = [
    { name: 'Down Payment', value: analysis.calculatedDownpayment, color: '#8884d8' },
    { name: 'Closing Costs', value: analysis.calculatedClosingCosts, color: '#82ca9d' },
    { name: 'Initial Repairs', value: analysis.calculatedInitialFixedCosts, color: '#ffc658' },
    { name: 'Reserves', value: analysis.estimatedMaintenanceReserve, color: '#ff7300' }
  ];

  // Performance Comparison Data
  const comparisonData = [analysis, ...comparisonAnalyses].map((item, index) => ({
    name: `Property ${index + 1}`,
    address: item.property.address.split(',')[0], // First part of address
    cashFlow: item.cashFlow,
    cocReturn: item.cocReturn * 100,
    capRate: item.capRate * 100,
    totalCashNeeded: item.totalCashNeeded,
    purchasePrice: item.property.purchasePrice,
    meetsCriteria: item.meetsCriteria,
    overallScore: item.aiAnalysis?.propertyAssessment?.overallScore || 5
  }));

  // AI Analysis Radar Data
  const radarData = analysis.aiAnalysis ? [
    {
      subject: 'Overall Score',
      score: analysis.aiAnalysis.propertyAssessment.overallScore,
      fullMark: 10
    },
    {
      subject: 'Market Position',
      score: analysis.aiAnalysis.marketIntelligence.sentimentScore * 5 + 5, // Convert -1 to 1 scale to 0-10
      fullMark: 10
    },
    {
      subject: 'Investment Confidence',
      score: analysis.aiAnalysis.investmentRecommendation.confidence * 10,
      fullMark: 10
    },
    {
      subject: 'Appreciation Potential',
      score: Math.min((analysis.aiAnalysis.predictiveAnalysis.appreciationForecast || 0) * 100, 10),
      fullMark: 10
    },
    {
      subject: 'Risk Level',
      score: analysis.aiAnalysis.marketIntelligence.riskLevel === 'low' ? 8 : 
             analysis.aiAnalysis.marketIntelligence.riskLevel === 'medium' ? 5 : 2,
      fullMark: 10
    }
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive':
      case 'meets':
        return '#10b981';
      case 'negative':
      case 'below':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' && entry.name.includes('$') ? 
                formatCurrency(entry.value) : 
                typeof entry.value === 'number' && entry.name.includes('%') ?
                formatPercent(entry.value / 100) :
                entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" data-testid="interactive-charts">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Interactive Analysis Charts</h2>
          <div className="flex space-x-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32" data-testid="select-timeframe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-year">1 Year</SelectItem>
                <SelectItem value="3-years">3 Years</SelectItem>
                <SelectItem value="5-years">5 Years</SelectItem>
                <SelectItem value="10-years">10 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-muted-foreground">
          Interactive visualizations of your property analysis with hover details and projections.
        </p>
      </div>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial" data-testid="tab-financial">
            <BarChart3 className="w-4 h-4 mr-2" />
            Financial Overview
          </TabsTrigger>
          <TabsTrigger value="projections" data-testid="tab-projections">
            <TrendingUp className="w-4 h-4 mr-2" />
            Cash Flow Projections
          </TabsTrigger>
          <TabsTrigger value="breakdown" data-testid="tab-breakdown">
            <PieChartIcon className="w-4 h-4 mr-2" />
            Investment Breakdown
          </TabsTrigger>
          <TabsTrigger value="comparison" data-testid="tab-comparison">
            <Activity className="w-4 h-4 mr-2" />
            Performance Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Financial Metrics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Hover over bars to see detailed information and target comparisons
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Actual Value"
                    radius={[4, 4, 0, 0]}
                  >
                    {financialData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="target" 
                    name="Target/Benchmark"
                    fill="#e5e7eb"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {financialData.map((metric, index) => (
                  <div key={index} className="text-center">
                    <Badge 
                      variant={metric.status === 'positive' || metric.status === 'meets' ? 'default' : 'destructive'}
                      data-testid={`badge-${metric.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {metric.status === 'positive' || metric.status === 'meets' ? '✓' : '✗'} {metric.name}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow & Property Value Projections</CardTitle>
              <p className="text-sm text-muted-foreground">
                Projected growth over {selectedTimeframe.replace('-', ' ')} based on AI market analysis
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={projectionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="monthLabel" 
                    interval={selectedTimeframe === "10-years" ? 11 : selectedTimeframe === "5-years" ? 5 : 2}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeCashFlow" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Cumulative Cash Flow ($)"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="propertyValue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Property Value ($)"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Equity Build-up ($)"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Return Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="totalReturn" 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.3}
                    name="Total Return ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Initial Investment Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(analysis.totalCashNeeded)}
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={investmentBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {investmentBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {analysis.aiAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Property Assessment</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Multi-dimensional property evaluation
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {comparisonAnalyses.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Property Performance Comparison</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Compare this property against {comparisonAnalyses.length} other properties
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="address" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="cashFlow" name="Monthly Cash Flow ($)" fill="#10b981" />
                    <Bar dataKey="cocReturn" name="COC Return (%)" fill="#3b82f6" />
                    <Bar dataKey="capRate" name="Cap Rate (%)" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Property Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No comparison properties available.</p>
                  <p className="text-sm mt-2">Analyze multiple properties and add them to comparison to see performance charts.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}