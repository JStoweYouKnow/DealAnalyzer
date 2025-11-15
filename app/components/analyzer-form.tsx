import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { FundingSource } from "../../shared/schema";
import { InfoTooltip } from "@/components/info-tooltip";

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
  loanTermYears: number;
  monthlyPayment: number;
}

interface AnalyzerFormProps {
  onAnalyze: (data: { file?: File; strMetrics?: STRMetrics; ltrMetrics?: LTRMetrics; monthlyExpenses?: MonthlyExpenses; fundingSource?: FundingSource; mortgageValues?: MortgageValues }) => void;
  isLoading: boolean;
  mortgageValues?: MortgageValues | null;
  onMortgageCalculated?: (values: MortgageValues | null) => void;
  onFormValuesChange?: (values: { strMetrics: STRMetrics; ltrMetrics: LTRMetrics; monthlyExpenses: MonthlyExpenses; fundingSource: FundingSource; file?: File }) => void;
}

interface MortgageCalculatorResult {
  monthly_payment: number;
  total_interest_paid: number;
  total_paid: number;
  payback_period_years?: number;
  payback_period_months?: number;
}

export function AnalyzerForm({ onAnalyze, isLoading, mortgageValues, onMortgageCalculated, onFormValuesChange }: AnalyzerFormProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [strMetrics, setSTRMetrics] = useState<STRMetrics>({});
  const [ltrMetrics, setLTRMetrics] = useState<LTRMetrics>({});
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpenses>({});
  const [fundingSource, setFundingSource] = useState<FundingSource>('conventional');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL extraction state
  const [propertyUrl, setPropertyUrl] = useState("");
  const [extractingUrl, setExtractingUrl] = useState(false);
  
  // Mortgage calculator state
  const [mortgageLoading, setMortgageLoading] = useState(false);
  const [mortgageResult, setMortgageResult] = useState<MortgageCalculatorResult | null>(null);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [durationYears, setDurationYears] = useState("30");

  // Notify parent when form values change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (onFormValuesChange) {
      onFormValuesChange({
        strMetrics,
        ltrMetrics,
        monthlyExpenses,
        fundingSource,
        file: selectedFile || undefined,
      });
    }
  }, [strMetrics, ltrMetrics, monthlyExpenses, fundingSource, selectedFile]);

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
      const allowedTypes = ['.pdf', '.csv', '.txt', '.xlsx', '.xls', '.json'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        alert('Please select a PDF, CSV, TXT, Excel, or JSON file');
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

  const handleExtractFromUrl = async () => {
    if (!propertyUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a property listing URL",
        variant: "destructive",
      });
      return;
    }

    setExtractingUrl(true);
    try {
      const response = await fetch('/api/extract-property-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: propertyUrl.trim() }),
      });

      // Check if response has content before parsing
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server. Please try again.');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text);
        throw new Error(`Invalid response from server: ${response.statusText || 'Unknown error'}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract property data');
      }

      const propertyData = data.data;

      // Validate that we have at least a purchase price
      if (!propertyData.purchasePrice || propertyData.purchasePrice <= 0) {
        toast({
          title: "Missing Purchase Price",
          description: "The property listing doesn't include a purchase price. Please enter the price manually or use a different listing.",
          variant: "destructive",
        });
        setExtractingUrl(false);
        return;
      }

      // Create a JSON file from the extracted data
      const jsonContent = JSON.stringify({
        address: propertyData.address || '',
        city: propertyData.city || '',
        state: propertyData.state || '',
        zipCode: propertyData.zipCode || '',
        purchasePrice: propertyData.purchasePrice,
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        squareFootage: propertyData.squareFootage || 0,
        yearBuilt: propertyData.yearBuilt || 0,
        propertyType: propertyData.propertyType || 'single-family',
        listingUrl: propertyData.listingUrl || propertyUrl,
        source: propertyData.source || 'web',
      }, null, 2);

      const blob = new Blob([jsonContent], { type: 'application/json' });
      const file = new File([blob], `property-${Date.now()}.json`, { type: 'application/json' });

      setSelectedFile(file);

      // Auto-populate form fields if available
      if (propertyData.monthlyRent) {
        setLTRMetrics({ monthlyRent: propertyData.monthlyRent });
      }

      if (propertyData.propertyTaxes) {
        setMonthlyExpenses(prev => ({ ...prev, propertyTaxes: propertyData.propertyTaxes / 12 }));
      }

      if (propertyData.hoa) {
        setMonthlyExpenses(prev => ({ ...prev, other: propertyData.hoa }));
      }

      // Auto-populate mortgage calculator with purchase price
      if (propertyData.purchasePrice && propertyData.purchasePrice > 0) {
        setPurchasePrice(propertyData.purchasePrice.toString());
        // Auto-calculate loan amount based on funding source down payment percentage
        const downPaymentPercentages: Record<FundingSource, number> = {
          conventional: 5,
          fha: 3.5,
          va: 0,
          dscr: 20,
          cash: 100,
        };
        const downPercent = downPaymentPercentages[fundingSource] || 20;
        const downPaymentAmount = propertyData.purchasePrice * (downPercent / 100);
        const calculatedLoanAmount = propertyData.purchasePrice - downPaymentAmount;
        setLoanAmount(calculatedLoanAmount.toFixed(2));
      }

      toast({
        title: "Property Data Extracted",
        description: `Successfully extracted data from ${propertyData.source || 'listing'}. Review and analyze.`,
      });
    } catch (error: any) {
      console.error('Error extracting from URL:', error);
      toast({
        title: "Extraction Failed",
        description: error.message || "Could not extract property data from URL. Try uploading a file instead.",
        variant: "destructive",
      });
    } finally {
      setExtractingUrl(false);
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
    setPurchasePrice("");
    setLoanAmount("");
    setInterestRate("");
    setDurationYears("30");
    setMortgageResult(null);
    
    // Notify parent that mortgage calculator was reset
    if (onMortgageCalculated) {
      onMortgageCalculated(null);
    }
  };

  // Auto-calculate loan amount when purchase price or funding source changes
  const handlePurchasePriceChange = (value: string) => {
    setPurchasePrice(value);
    if (value && !isNaN(parseFloat(value))) {
      const price = parseFloat(value);
      if (price > 0) {
        const downPaymentPercentages: Record<FundingSource, number> = {
          conventional: 5,
          fha: 3.5,
          va: 0,
          dscr: 20,
          cash: 100,
        };
        const downPercent = downPaymentPercentages[fundingSource] || 20;
        const downPaymentAmount = price * (downPercent / 100);
        const calculatedLoanAmount = price - downPaymentAmount;
        setLoanAmount(calculatedLoanAmount.toFixed(2));
      }
    }
  };

  // Recalculate loan amount when funding source changes
  const handleFundingSourceChange = (value: FundingSource) => {
    setFundingSource(value);
    if (purchasePrice && !isNaN(parseFloat(purchasePrice))) {
      const price = parseFloat(purchasePrice);
      if (price > 0) {
        const downPaymentPercentages: Record<FundingSource, number> = {
          conventional: 5,
          fha: 3.5,
          va: 0,
          dscr: 20,
          cash: 100,
        };
        const downPercent = downPaymentPercentages[value] || 20;
        const downPaymentAmount = price * (downPercent / 100);
        const calculatedLoanAmount = price - downPaymentAmount;
        setLoanAmount(calculatedLoanAmount.toFixed(2));
      }
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
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold text-card-foreground">Property Analysis Input</h3>
                <InfoTooltip
                  title="Property Analysis"
                  content={[
                    "Analyze properties to get detailed investment metrics and recommendations. You can analyze properties by:",
                    "• Uploading a PDF: Property listings, flyers, or documents",
                    "• Pasting Email Content: Property deal emails from brokers or listings",
                    "• Manual Entry: Enter property details manually",
                    "• Property URL: Extract data from listing websites (Zillow, Redfin, Realtor.com)",
                    "The analysis will calculate:",
                    "• Cash-on-Cash Return: Annual return on your cash investment",
                    "• Cap Rate: Net operating income divided by property value",
                    "• ROI: Total return on investment over time",
                    "• Cash Flow: Monthly and annual cash flow projections",
                    "• Break-even Analysis: When your investment becomes profitable",
                    "• STR Metrics: For short-term rentals, analyzes ADR, occupancy, and revenue potential",
                  ]}
                />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Enter property details and rental metrics</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Extraction Section */}
            <div>
              <Label htmlFor="property-url" className="text-base font-semibold mb-3 block">
                <i className="fas fa-link mr-2 text-primary"></i>
                Extract from Listing URL
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Paste a property listing URL from Zillow, Redfin, Realtor.com, or other sites
              </p>
              <div className="flex gap-2">
                <Input
                  id="property-url"
                  type="url"
                  placeholder="https://www.zillow.com/homedetails/..."
                  value={propertyUrl}
                  onChange={(e) => setPropertyUrl(e.target.value)}
                  className="h-10"
                  data-testid="input-property-url"
                />
                <Button
                  type="button"
                  onClick={handleExtractFromUrl}
                  disabled={extractingUrl || !propertyUrl.trim()}
                  variant="outline"
                  className="whitespace-nowrap"
                  data-testid="button-extract-url"
                >
                  {extractingUrl ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic mr-2"></i>
                      Extract
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Divider with "OR" */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* File Upload Section */}
            <div>
              <Label htmlFor="file-upload" className="text-base font-semibold mb-3 block">Upload Property Data File</Label>
              <div className="space-y-5">
                <div className="relative overflow-visible pb-1">
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".pdf,.csv,.txt,.xlsx,.xls,.json"
                    onChange={handleFileChange}
                    className="h-auto min-h-[2.75rem] file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
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
                onValueChange={(value) => handleFundingSourceChange(value as FundingSource)}
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
                    <p>Loan Term: {mortgageValues.loanTermYears} years</p>
                    <p>Monthly Payment: ${mortgageValues.monthlyPayment.toFixed(2)}</p>
                    <p className="mt-1 italic">
                      {fundingSource === 'cash' 
                        ? 'Cash purchase - no mortgage payment used' 
                        : `Down payment will be calculated from purchase price using ${fundingSource === 'conventional' ? '5%' : fundingSource === 'fha' ? '3.5%' : fundingSource === 'va' ? '0%' : fundingSource === 'dscr' ? '20%' : '100%'} funding source percentage. If purchase price is missing, it will be calculated from loan amount.`}
                    </p>
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
                <div className="space-y-2">
                  <Label htmlFor="purchase-price" className="text-sm font-medium">Purchase Price ($)</Label>
                  <Input
                    id="purchase-price"
                    type="number"
                    placeholder="e.g., 250000"
                    value={purchasePrice}
                    onChange={(e) => handlePurchasePriceChange(e.target.value)}
                    min="0"
                    step="1"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Loan amount will be auto-calculated based on funding source down payment percentage
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loan-amount" className="text-sm font-medium">Loan Amount ($)</Label>
                    <Input
                      id="loan-amount"
                      type="number"
                      placeholder="Auto-calculated"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      min="0"
                      step="1"
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
