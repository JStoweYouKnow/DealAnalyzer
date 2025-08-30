import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface STRMetrics {
  adr?: number;
  occupancyRate?: number;
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

interface AnalyzerFormProps {
  onAnalyze: (data: { emailContent: string; strMetrics?: STRMetrics; monthlyExpenses?: MonthlyExpenses }) => void;
  isLoading: boolean;
}

export function AnalyzerForm({ onAnalyze, isLoading }: AnalyzerFormProps) {
  const [emailContent, setEmailContent] = useState("");
  const [strMetrics, setSTRMetrics] = useState<STRMetrics>({});
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpenses>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailContent.trim()) {
      alert("Please paste email content first");
      return;
    }
    onAnalyze({ emailContent, strMetrics, monthlyExpenses });
  };

  const loadExample = () => {
    const exampleContent = `Subject: New Investment Opportunity - 123 Main Street

Dear Investor,

We found a great property that matches your criteria:

Property: 123 Main St, Anytown, CA 90210
Type: Single Family Home  
Listing Price: $250,000
Estimated Monthly Rent: $2,500
Bedrooms: 3
Bathrooms: 2.5
Square Footage: 1500 sq ft
Year Built: 1985

This charming 3-bedroom, 2.5-bathroom home is located in a desirable neighborhood. The property features a spacious living area, modern kitchen, and large backyard. It's currently tenant-occupied with market-rate rent.

View listing: https://example.com/listing/123mainst

Let me know if you'd like to schedule a showing!

Best regards,
Your Real Estate Team`;
    
    setEmailContent(exampleContent);
  };

  return (
    <div className="space-y-6">
      <Card className="analysis-card">
        <CardHeader className="border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-calculator text-primary"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Property Analysis Input</h3>
              <p className="text-sm text-muted-foreground">Enter property details and rental metrics</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="email">Email Content</TabsTrigger>
                <TabsTrigger value="str">STR Metrics</TabsTrigger>
                <TabsTrigger value="expenses">Monthly Expenses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="space-y-4">
                <div>
                  <Label htmlFor="email-content">Property Listing Email</Label>
                  <Textarea
                    id="email-content"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    className="h-80 resize-none mt-2"
                    placeholder="Paste your real estate email content here...

The analyzer automatically detects property details from various email formats including:
• Property address and location
• Purchase/listing price and monthly rent
• Bedrooms, bathrooms, square footage
• Property type and year built
• Listing URLs and descriptions

Works with emails from MLS, Zillow, Realtor.com, and other real estate services."
                    data-testid="input-email-content"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="str" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-4">Short-Term Rental Metrics (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adr">Average Daily Rate (ADR)</Label>
                      <Input
                        id="adr"
                        type="number"
                        placeholder="100"
                        value={strMetrics.adr || ""}
                        onChange={(e) => setSTRMetrics(prev => ({ ...prev, adr: e.target.value ? Number(e.target.value) : undefined }))}
                        data-testid="input-adr"
                      />
                    </div>
                    <div>
                      <Label htmlFor="occupancy">Occupancy Rate (%)</Label>
                      <Input
                        id="occupancy"
                        type="number"
                        placeholder="65"
                        value={strMetrics.occupancyRate ? strMetrics.occupancyRate * 100 : ""}
                        onChange={(e) => setSTRMetrics(prev => ({ ...prev, occupancyRate: e.target.value ? Number(e.target.value) / 100 : undefined }))}
                        data-testid="input-occupancy"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="expenses" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-4">Monthly Expenses (Optional - Override Estimates)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="property-taxes">Property Taxes</Label>
                      <Input
                        id="property-taxes"
                        type="number"
                        placeholder="Auto-calculated"
                        value={monthlyExpenses.propertyTaxes || ""}
                        onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, propertyTaxes: e.target.value ? Number(e.target.value) : undefined }))}
                        data-testid="input-property-taxes"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance">Insurance</Label>
                      <Input
                        id="insurance"
                        type="number"
                        placeholder="100"
                        value={monthlyExpenses.insurance || ""}
                        onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, insurance: e.target.value ? Number(e.target.value) : undefined }))}
                        data-testid="input-insurance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="utilities">Utilities</Label>
                      <Input
                        id="utilities"
                        type="number"
                        placeholder="150"
                        value={monthlyExpenses.utilities || ""}
                        onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, utilities: e.target.value ? Number(e.target.value) : undefined }))}
                        data-testid="input-utilities"
                      />
                    </div>
                    <div>
                      <Label htmlFor="management">Management</Label>
                      <Input
                        id="management"
                        type="number"
                        placeholder="Auto-calculated"
                        value={monthlyExpenses.management || ""}
                        onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, management: e.target.value ? Number(e.target.value) : undefined }))}
                        data-testid="input-management"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maintenance">Maintenance</Label>
                      <Input
                        id="maintenance"
                        type="number"
                        placeholder="Auto-calculated"
                        value={monthlyExpenses.maintenance || ""}
                        onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, maintenance: e.target.value ? Number(e.target.value) : undefined }))}
                        data-testid="input-maintenance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cleaning">Cleaning</Label>
                      <Input
                        id="cleaning"
                        type="number"
                        placeholder="Auto-calculated"
                        value={monthlyExpenses.cleaning || ""}
                        onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, cleaning: e.target.value ? Number(e.target.value) : undefined }))}
                        data-testid="input-cleaning"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplies">Supplies</Label>
                      <Input
                        id="supplies"
                        type="number"
                        placeholder="50"
                        value={monthlyExpenses.supplies || ""}
                        onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, supplies: e.target.value ? Number(e.target.value) : undefined }))}
                        data-testid="input-supplies"
                      />
                    </div>
                    <div>
                      <Label htmlFor="other">Other</Label>
                      <Input
                        id="other"
                        type="number"
                        placeholder="0"
                        value={monthlyExpenses.other || ""}
                        onChange={(e) => setMonthlyExpenses(prev => ({ ...prev, other: e.target.value ? Number(e.target.value) : undefined }))}
                        data-testid="input-other"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                <i className="fas fa-info-circle mr-1"></i>
                STR metrics and expenses are optional - defaults will be used if not provided
              </div>
              <Button 
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2"
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
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="secondary" 
          className="p-4 h-auto text-left justify-start"
          onClick={loadExample}
          data-testid="button-load-example"
        >
          <div className="flex items-center space-x-3">
            <i className="fas fa-file-upload text-primary"></i>
            <div>
              <div className="font-medium">Load Example</div>
              <div className="text-xs text-muted-foreground">Try sample data</div>
            </div>
          </div>
        </Button>
        
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
