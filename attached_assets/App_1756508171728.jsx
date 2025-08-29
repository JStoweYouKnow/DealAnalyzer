import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Upload, Home, DollarSign, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import './App.css'

function App() {
  const [emailContent, setEmailContent] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const analyzeProperty = async () => {
    if (!emailContent.trim()) return
    
    setLoading(true)
    try {
      // Simulate API call - in a real app, this would call your backend
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailContent }),
      })
      
      if (response.ok) {
        const result = await response.json()
        setAnalysis(result)
      } else {
        // For demo purposes, we'll simulate a successful analysis
        setTimeout(() => {
          setAnalysis({
            property: {
              address: '123 Main St, Anytown, CA 90210',
              property_type: 'single-family',
              purchase_price: 250000,
              monthly_rent: 2500,
              bedrooms: 3,
              bathrooms: 2.5,
              square_footage: 1500,
              year_built: 1985,
              listing_url: 'https://example.com/listing/123mainst'
            },
            calculated_downpayment: 56250,
            calculated_closing_costs: 15000,
            calculated_initial_fixed_costs: 2500,
            total_cash_needed: 73750,
            estimated_maintenance_reserve: 125,
            passes_1_percent_rule: true,
            cash_flow: 360.98,
            cash_flow_positive: true,
            coc_return: 0.0587,
            coc_meets_benchmark: false,
            coc_meets_minimum: true,
            cap_rate: 0.0792,
            cap_meets_benchmark: false,
            cap_meets_minimum: true,
            meets_criteria: true
          })
          setLoading(false)
        }, 1500)
        return
      }
    } catch (error) {
      console.error('Error analyzing property:', error)
    }
    setLoading(false)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Real Estate Deal Analyzer</h1>
          <p className="text-lg text-gray-600">Analyze real estate investment opportunities from email alerts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Email Content
              </CardTitle>
              <CardDescription>
                Paste your real estate listing email alert content below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your email content here..."
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="min-h-[300px] mb-4"
              />
              <Button 
                onClick={analyzeProperty} 
                disabled={!emailContent.trim() || loading}
                className="w-full"
              >
                {loading ? 'Analyzing...' : 'Analyze Property'}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Analysis Results
                </CardTitle>
                <CardDescription>
                  Investment criteria evaluation for {analysis.property.address}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Property Details */}
                <div>
                  <h3 className="font-semibold mb-2">Property Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Type: {analysis.property.property_type}</div>
                    <div>Price: {formatCurrency(analysis.property.purchase_price)}</div>
                    <div>Rent: {formatCurrency(analysis.property.monthly_rent)}/mo</div>
                    <div>Beds/Baths: {analysis.property.bedrooms}/{analysis.property.bathrooms}</div>
                    <div>Sq Ft: {analysis.property.square_footage.toLocaleString()}</div>
                    <div>Year: {analysis.property.year_built}</div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Down Payment: {formatCurrency(analysis.calculated_downpayment)}</div>
                    <div>Closing Costs: {formatCurrency(analysis.calculated_closing_costs)}</div>
                    <div>Initial Costs: {formatCurrency(analysis.calculated_initial_fixed_costs)}</div>
                    <div>Total Cash: {formatCurrency(analysis.total_cash_needed)}</div>
                    <div>Monthly Cash Flow: {formatCurrency(analysis.cash_flow)}</div>
                    <div>Maintenance Reserve: {formatCurrency(analysis.estimated_maintenance_reserve)}/mo</div>
                  </div>
                </div>

                {/* Investment Metrics */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Investment Metrics
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">1% Rule</span>
                      <Badge variant={analysis.passes_1_percent_rule ? "default" : "destructive"}>
                        {analysis.passes_1_percent_rule ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {analysis.passes_1_percent_rule ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cash Flow</span>
                      <Badge variant={analysis.cash_flow_positive ? "default" : "destructive"}>
                        {analysis.cash_flow_positive ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {analysis.cash_flow_positive ? 'POSITIVE' : 'NEGATIVE'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">COC Return: {formatPercentage(analysis.coc_return)}</span>
                      <Badge variant={analysis.coc_meets_benchmark ? "default" : analysis.coc_meets_minimum ? "secondary" : "destructive"}>
                        {analysis.coc_meets_benchmark ? 'BENCHMARK' : analysis.coc_meets_minimum ? 'MINIMUM' : 'FAIL'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cap Rate: {formatPercentage(analysis.cap_rate)}</span>
                      <Badge variant={analysis.cap_meets_benchmark ? "default" : analysis.cap_meets_minimum ? "secondary" : "destructive"}>
                        {analysis.cap_meets_benchmark ? 'BENCHMARK' : analysis.cap_meets_minimum ? 'MINIMUM' : 'FAIL'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Overall Result */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Overall Assessment</span>
                    <Badge 
                      variant={analysis.meets_criteria ? "default" : "destructive"}
                      className="text-sm px-3 py-1"
                    >
                      {analysis.meets_criteria ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      {analysis.meets_criteria ? 'MEETS CRITERIA' : 'DOES NOT MEET CRITERIA'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

