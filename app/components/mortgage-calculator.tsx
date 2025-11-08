"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface MortgageCalculatorResult {
  monthly_payment: number;
  total_interest_paid: number;
  total_paid: number;
  payback_period_years?: number;
  payback_period_months?: number;
}

interface MortgageCalculatorProps {
  onMortgageCalculated?: (values: {
    loanAmount: number;
    loanTermYears: number;
    monthlyPayment: number;
  } | null) => void;
}

export function MortgageCalculator({ onMortgageCalculated }: MortgageCalculatorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MortgageCalculatorResult | null>(null);

  const [purchasePrice, setPurchasePrice] = useState("");
  const [downPaymentPercent, setDownPaymentPercent] = useState("20");
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [durationYears, setDurationYears] = useState("30");
  const [manualLoanAmount, setManualLoanAmount] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Auto-calculate loan amount when purchase price or down payment changes
  const handlePurchasePriceChange = (value: string) => {
    setPurchasePrice(value);
    if (!manualLoanAmount && value && downPaymentPercent) {
      const price = parseFloat(value);
      const downPercent = parseFloat(downPaymentPercent);
      if (!isNaN(price) && !isNaN(downPercent) && price > 0) {
        const downPaymentAmount = price * (downPercent / 100);
        const calculatedLoanAmount = price - downPaymentAmount;
        setLoanAmount(calculatedLoanAmount.toFixed(2));
      }
    }
  };

  const handleDownPaymentChange = (value: string) => {
    setDownPaymentPercent(value);
    if (!manualLoanAmount && purchasePrice && value) {
      const price = parseFloat(purchasePrice);
      const downPercent = parseFloat(value);
      if (!isNaN(price) && !isNaN(downPercent) && price > 0) {
        const downPaymentAmount = price * (downPercent / 100);
        const calculatedLoanAmount = price - downPaymentAmount;
        setLoanAmount(calculatedLoanAmount.toFixed(2));
      }
    }
  };

  const handleLoanAmountChange = (value: string) => {
    setLoanAmount(value);
    setManualLoanAmount(true); // User is manually entering loan amount
  };

  const handleCalculate = async () => {
    if (!loanAmount || !interestRate || !durationYears) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
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

    setLoading(true);
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
        // Validate the data has valid values
        if (data.data.monthly_payment === null || 
            data.data.monthly_payment === undefined || 
            isNaN(data.data.monthly_payment)) {
          throw new Error('Received invalid calculation result');
        }
        
        // Validate and sanitize total_interest_paid
        if (data.data.total_interest_paid === null || 
            data.data.total_interest_paid === undefined || 
            isNaN(data.data.total_interest_paid) ||
            !Number.isFinite(data.data.total_interest_paid)) {
          throw new Error('Received invalid calculation result');
        }
        
        // Validate and sanitize total_paid
        if (data.data.total_paid === null || 
            data.data.total_paid === undefined || 
            isNaN(data.data.total_paid) ||
            !Number.isFinite(data.data.total_paid)) {
          throw new Error('Received invalid calculation result');
        }
        
        setResult(data.data);
        
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
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPurchasePrice("");
    setDownPaymentPercent("20");
    setLoanAmount("");
    setInterestRate("");
    setDurationYears("30");
    setManualLoanAmount(false);
    setResult(null);

    // Notify parent that mortgage calculator was reset
    if (onMortgageCalculated) {
      onMortgageCalculated(null);
    }
  };

  return (
    <Card className="analysis-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <i className="fas fa-calculator"></i>
          Mortgage Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Purchase Price and Down Payment Section */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground">Property Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase-price">Purchase Price ($)</Label>
              <Input
                id="purchase-price"
                type="number"
                placeholder="e.g., 250000"
                value={purchasePrice}
                onChange={(e) => handlePurchasePriceChange(e.target.value)}
                min="0"
                step="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="down-payment">Down Payment (%)</Label>
              <Input
                id="down-payment"
                type="number"
                placeholder="e.g., 20"
                value={downPaymentPercent}
                onChange={(e) => handleDownPaymentChange(e.target.value)}
                min="0"
                max="100"
                step="1"
              />
            </div>
          </div>

          {purchasePrice && downPaymentPercent && (
            <div className="text-sm text-muted-foreground">
              Down Payment Amount: {formatCurrency(parseFloat(purchasePrice) * (parseFloat(downPaymentPercent) / 100))}
            </div>
          )}
        </div>

        {/* Loan Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="loan-amount">
              Loan Amount ($)
              {!manualLoanAmount && purchasePrice && (
                <span className="ml-2 text-xs text-muted-foreground">(Auto-calculated)</span>
              )}
            </Label>
            <Input
              id="loan-amount"
              type="number"
              placeholder="e.g., 200000"
              value={loanAmount}
              onChange={(e) => handleLoanAmountChange(e.target.value)}
              min="0"
              step="1000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interest-rate">Interest Rate (%)</Label>
            <Input
              id="interest-rate"
              type="number"
              placeholder="e.g., 3.5"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Loan Term (years)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="e.g., 30"
              value={durationYears}
              onChange={(e) => setDurationYears(e.target.value)}
              min="1"
              step="1"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCalculate}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <i className="fas fa-calculator mr-2"></i>
                Calculate
              </>
            )}
          </Button>
          {result && (
            <Button
              onClick={handleReset}
              variant="outline"
            >
              Reset
            </Button>
          )}
        </div>

        {result && (
          <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-semibold text-lg mb-4">Payment Breakdown</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(result.monthly_payment)}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Interest Paid</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(result.total_interest_paid)}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Amount Paid</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(result.total_paid)}
                </p>
              </div>
              
              {result.payback_period_years && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Loan Term</p>
                  <p className="text-xl font-semibold">
                    {result.payback_period_years} years
                    {result.payback_period_months && (
                      <span className="text-sm text-muted-foreground ml-1">
                        ({result.payback_period_months} months)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Interest vs Principal Visualization */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Payment Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Principal</span>
                  <span className="font-semibold">{formatCurrency(result.total_paid - result.total_interest_paid)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Interest</span>
                  <span className="font-semibold">{formatCurrency(result.total_interest_paid)}</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{
                      width: `${((result.total_paid - result.total_interest_paid) / result.total_paid) * 100}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Principal: {(((result.total_paid - result.total_interest_paid) / result.total_paid) * 100).toFixed(1)}%</span>
                  <span>Interest: {((result.total_interest_paid / result.total_paid) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

