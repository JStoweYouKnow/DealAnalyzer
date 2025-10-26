import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

interface AnalyzerFormProps {
  onAnalyze: (data: { file?: File; strMetrics?: STRMetrics; ltrMetrics?: LTRMetrics; monthlyExpenses?: MonthlyExpenses }) => void;
  isLoading: boolean;
}

export function AnalyzerForm({ onAnalyze, isLoading }: AnalyzerFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [strMetrics, setSTRMetrics] = useState<STRMetrics>({});
  const [ltrMetrics, setLTRMetrics] = useState<LTRMetrics>({});
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpenses>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }
    
    onAnalyze({ file: selectedFile, strMetrics, ltrMetrics, monthlyExpenses });
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
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="input" className="w-full">
              <TabsList className="grid w-full grid-cols-4 gap-2">
                <TabsTrigger value="input">Upload File</TabsTrigger>
                <TabsTrigger value="str">STR Metrics</TabsTrigger>
                <TabsTrigger value="ltr">Monthly Rent</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="input" className="space-y-6 mt-6">
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
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 text-transparent file:text-primary-foreground"
                        data-testid="input-file-upload"
                      />
                      {!selectedFile && (
                        <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                          <span className="text-muted-foreground text-sm">
                            Choose file...
                          </span>
                        </div>
                      )}
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
              </TabsContent>
              
              <TabsContent value="str" className="space-y-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-2 text-base">Short-Term Rental Metrics</h4>
                  <p className="text-sm text-muted-foreground mb-4">Optional - ADR and occupancy for STR properties</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
              </TabsContent>
              
              <TabsContent value="expenses" className="space-y-6 mt-6">
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
              </TabsContent>
              
              <TabsContent value="ltr" className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="monthly-rent" className="text-sm font-medium">Monthly Rent Amount</Label>
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
              </TabsContent>
            </Tabs>
            
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
