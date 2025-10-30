import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { FundingSource } from "../../shared/schema";

interface STRMetrics {
  adr?: number;
  occupancyRate?: number;
  monthlyRent?: number; // Calculated automatically from ADR and occupancy
}

interface LTRMetrics {
  monthlyRent?: number;
}

interface MonthlyExpenses {
  propertyTaxes?: number;
  insurance?: number;
  utilities?: number;
  management?: number;
  maintenance?: number;
  cleaning?: number;
  supplies?: number;
  other?: number;
}

interface MortgageValues {
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  monthlyPayment: number;
}

interface AnalyzerFormProps {
  onAnalyze: (data: { file?: File; strMetrics?: STRMetrics; ltrMetrics?: LTRMetrics; monthlyExpenses?: MonthlyExpenses; fundingSource?: FundingSource; mortgageValues?: MortgageValues }) => void;
  isLoading: boolean;
  mortgageValues?: MortgageValues | null;
  onMortgageCalculated?: (values: MortgageValues | null) => void;
}

interface MortgageCalculatorResult {
  monthly_payment: number;
  total_interest_paid: number;
  total_paid: number;
  payback_period_years?: number;
  payback_period_months?: number;
}

export function AnalyzerForm({ onAnalyze, isLoading, mortgageValues, onMortgageCalculated }: AnalyzerFormProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [strMetrics, setSTRMetrics] = useState<STRMetrics>({});
  const [ltrMetrics, setLTRMetrics] = useState<LTRMetrics>({});
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpenses>({});
  const [fundingSource, setFundingSource] = useState<FundingSource>('conventional');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mortgage calculator state
  const [mortgageLoading, setMortgageLoading] = useState(false);
  const [mortgageResult, setMortgageResult] = useState<MortgageCalculatorResult | null>(null);
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [durationYears, setDurationYears] = useState("30");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    onAnalyze({ file: selectedFile, strMetrics, ltrMetrics, monthlyExpenses, fundingSource, mortgageValues: mortgageValues || undefined });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['.pdf', '.csv', '.txt', '.xlsx', '.xls'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        alert('Please select a PDF, CSV, TXT, or Excel file');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleMortgageCalculate = async () => {
    if (!loanAmount || !interestRate || !durationYears) {
      toast({
        title: "Missing Information",
        description: "Please fill in all mortgage calculator fields",
        variant: "destructive",
      });
      return;
    }

    const loan = parseFloat(loanAmount);
    const rate = parseFloat(interestRate);
    const years = parseFloat(durationYears);

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

    setMortgageLoading(true);
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
        setMortgageResult(data.data);
        
        // Notify parent component of calculated values
        if (onMortgageCalculated) {
          onMortgageCalculated({
            loanAmount: loan,
            interestRate: rate,
            loanTermYears: years,
            monthlyPayment: data.data.monthly_payment,
          });
        }
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
      setMortgageLoading(false);
    }
  };

  const handleMortgageReset = () => {
    setLoanAmount("");
    setInterestRate("");
    setDurationYears("30");
    setMortgageResult(null);
    
    // Notify parent that mortgage calculator was reset
    if (onMortgageCalculated) {
      onMortgageCalculated(null);
    }
  };


  return (
    <div className="space-y-6">
      <Card className="analysis-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-calculator text-primary text-xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-card-foreground mb-1">Property Analysis Input</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Enter property details and rental metrics</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div>
              <Label htmlFor="file-upload" className="text-base font-semibold mb-3 block">Upload Property Data File</Label>
              <div className="space-y-5">
                <div className="relative">
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".pdf,.csv,.txt,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    data-testid="input-file-upload"
                  />
                </div>

                {selectedFile && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 flex items-center space-x-2">
                    <i className="fas fa-file text-green-600"></i>
                    <span className="font-medium text-green-800 dark:text-green-200 text-sm truncate">
                      {selectedFile.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Funding Source Section */}
            <div>
              <Label htmlFor="funding-source" className="text-base font-semibold mb-3 block">Funding Source</Label>
              <Select
                value={fundingSource}
                onValueChange={(value) => setFundingSource(value as FundingSource)}
              >
                <SelectTrigger id="funding-source" className="h-10" data-testid="select-funding-source">
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
              <p className="text-sm text-muted-foreground mt-2">
                {fundingSource === 'conventional' && 'Conventional loans require 5% down payment'}
                {fundingSource === 'fha' && 'FHA loans require 3.5% down payment'}
                {fundingSource === 'va' && 'VA loans require 0% down payment (for qualified veterans)'}
                {fundingSource === 'dscr' && 'DSCR (Debt Service Coverage Ratio) loans require 20% down payment'}
                {fundingSource === 'cash' && 'Cash purchase - no mortgage payment'}
              </p>
              {mortgageValues && (
                <div className="mt-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-info-circle text-blue-600 dark:text-blue-400"></i>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Using Mortgage Calculator Values
                    </p>
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p>Loan Amount: ${mortgageValues.loanAmount.toLocaleString()}</p>
                    <p>Interest Rate: {mortgageValues.interestRate}% ({mortgageValues.loanTermYears} years)</p>
                    <p>Monthly Payment: ${mortgageValues.monthlyPayment.toFixed(2)}</p>
                    <p className="mt-1 italic">Down payment will be calculated from purchase price - loan amount</p>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border/50"></div>

            {/* Mortgage Calculator Section */}
            <div>
              <h4 className="font-semibold mb-3 text-base">Mortgage Calculator</h4>
              <p className="text-sm text-muted-foreground mb-4">Optional - Calculate mortgage payment to use in property analysis</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loan-amount" className="text-sm font-medium">Loan Amount ($)</Label>
                    <Input
                      id="loan-amount"
                      type="number"
                      placeholder="e.g., 200000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      min="0"
                      step="1000"
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interest-rate" className="text-sm font-medium">Interest Rate (%)</Label>
                    <Input
                      id="interest-rate"
                      type="number"
                      placeholder="e.g., 3.5"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      min="0"
                      step="0.1"
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium">Loan Term (years)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="e.g., 30"
                      value={durationYears}
                      onChange={(e) => setDurationYears(e.target.value)}
                      min="1"
                      step="1"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleMortgageCalculate}
                    disabled={mortgageLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    {mortgageLoading ? (
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
                  {mortgageResult && (
                    <Button
                      type="button"
                      onClick={handleMortgageReset}
                      variant="outline"
                    >
                      Reset
                    </Button>
                  )}
                </div>

                {mortgageResult && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-blue-700 dark:text-blue-300">Monthly Payment</p>
                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                          {formatCurrency(mortgageResult.monthly_payment)}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-blue-700 dark:text-blue-300">Total Interest Paid</p>
                        <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                          {formatCurrency(mortgageResult.total_interest_paid)}
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

            {/* Divider */}
            <div className="border-t border-border/50"></div>

            {/* Rental Income Section */}
            <div>
              <h4 className="font-semibold mb-3 text-base">Rental Income</h4>
              <p className="text-sm text-muted-foreground mb-4">Choose one: Short-term rental metrics or monthly rent amount</p>
              
              {/* Short-Term Rental Metrics */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Short-Term Rental (Optional)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adr" className="text-sm font-medium">Average Daily Rate (ADR)</Label>
                    <Input
                      id="adr"
                      type="number"
                      placeholder="100"
                      value={strMetrics.adr || ""}
                      onChange={(e) => {
                        const adr = e.target.value ? Number(e.target.value) : undefined;
                        const occupancy = strMetrics.occupancyRate;
                        const monthlyRent = adr && occupancy ? adr * 30 * occupancy : undefined;
                        setSTRMetrics(prev => ({ ...prev, adr, monthlyRent }));
                      }}
                      className="h-10"
                      data-testid="input-adr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupancy" className="text-sm font-medium">Occupancy Rate (%)</Label>
                    <Input
                      id="occupancy"
                      type="number"
                      placeholder="65"
                      value={strMetrics.occupancyRate ? strMetrics.occupancyRate * 100 : ""}
                      onChange={(e) => {
                        const occupancyRate = e.target.value ? Number(e.target.value) / 100 : undefined;
                        const adr = strMetrics.adr;
                        const monthlyRent = adr && occupancyRate ? adr * 30 * occupancyRate : undefined;
                        setSTRMetrics(prev => ({ ...prev, occupancyRate, monthlyRent }));
                      }}
                      className="h-10"
                      data-testid="input-occupancy"
                    />
                  </div>
                  {strMetrics.monthlyRent && (
                    <div className="col-span-full bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
                      <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Calculated Monthly Income</Label>
                      <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        ${strMetrics.monthlyRent.toFixed(2)}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Based on ADR × 30 days × Occupancy Rate
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Long-Term Rental */}
              <div>
                <Label htmlFor="monthly-rent" className="text-sm font-medium block mb-2">Monthly Rent (Long-Term)</Label>
                <Input
                  id="monthly-rent"
                  type="number"
                  placeholder="1200"
                  value={ltrMetrics.monthlyRent || ""}
                  onChange={(e) => setLTRMetrics(prev => ({ ...prev, monthlyRent: e.target.value ? Number(e.target.value) : undefined }))}
                  className="h-10"
                  data-testid="input-monthly-rent"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50"></div>

            {/* Monthly Expenses Section */}
            <div>
              <h4 className="font-semibold mb-3 text-base">Monthly Expenses</h4>
              <p className="text-sm text-muted-foreground mb-4">Optional - Expenses will be auto-calculated if not provided</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property-taxes" className="text-sm font-medium">Property Taxes</Label>
                  <Input
                    id="property-taxes"
                    type="number"
                    placeholder="Auto-calculated"
                    value={monthlyExpenses.propertyTaxes || ""}
                    onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, propertyTaxes: e.target.value ? Number(e.target.value) : undefined }))}
                    className="h-10"
                    data-testid="input-property-taxes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance" className="text-sm font-medium">Insurance</Label>
                  <Input
                    id="insurance"
                    type="number"
                    placeholder="100"
                    value={monthlyExpenses.insurance || ""}
                    onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, insurance: e.target.value ? Number(e.target.value) : undefined }))}
                    className="h-10"
                    data-testid="input-insurance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utilities" className="text-sm font-medium">Utilities</Label>
                  <Input
                    id="utilities"
                    type="number"
                    placeholder="150"
                    value={monthlyExpenses.utilities || ""}
                    onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, utilities: e.target.value ? Number(e.target.value) : undefined }))}
                    className="h-10"
                    data-testid="input-utilities"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="management" className="text-sm font-medium">Management</Label>
                  <Input
                    id="management"
                    type="number"
                    placeholder="Auto-calculated"
                    value={monthlyExpenses.management || ""}
                    onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, management: e.target.value ? Number(e.target.value) : undefined }))}
                    className="h-10"
                    data-testid="input-management"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance" className="text-sm font-medium">Maintenance</Label>
                  <Input
                    id="maintenance"
                    type="number"
                    placeholder="Auto-calculated"
                    value={monthlyExpenses.maintenance || ""}
                    onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, maintenance: e.target.value ? Number(e.target.value) : undefined }))}
                    className="h-10"
                    data-testid="input-maintenance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cleaning" className="text-sm font-medium">Cleaning</Label>
                  <Input
                    id="cleaning"
                    type="number"
                    placeholder="Auto-calculated"
                    value={monthlyExpenses.cleaning || ""}
                    onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, cleaning: e.target.value ? Number(e.target.value) : undefined }))}
                    className="h-10"
                    data-testid="input-cleaning"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplies" className="text-sm font-medium">Supplies</Label>
                  <Input
                    id="supplies"
                    type="number"
                    placeholder="50"
                    value={monthlyExpenses.supplies || ""}
                    onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, supplies: e.target.value ? Number(e.target.value) : undefined }))}
                    className="h-10"
                    data-testid="input-supplies"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="other" className="text-sm font-medium">Other</Label>
                  <Input
                    id="other"
                    type="number"
                    placeholder="0"
                    value={monthlyExpenses.other || ""}
                    onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, other: e.target.value ? Number(e.target.value) : undefined }))}
                    className="h-10"
                    data-testid="input-other"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border/50">
              <div className="text-xs text-muted-foreground leading-relaxed">
                <i className="fas fa-info-circle mr-1"></i>
                <span className="hidden sm:inline">All fields are optional. Defaults will be calculated if not provided.</span>
                <span className="sm:hidden">All fields optional</span>
              </div>
              <Button 
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 w-full sm:w-auto"
                data-testid="button-analyze"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-chart-line"></i>
                    <span>Analyze Property</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4">
        <Button 
          variant="secondary" 
          className="p-4 h-auto text-left justify-start"
          data-testid="button-view-history"
        >
          <div className="flex items-center space-x-3">
            <i className="fas fa-history text-primary"></i>
            <div>
              <div className="font-medium">View History</div>
              <div className="text-xs text-muted-foreground">Past analyses</div>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}
