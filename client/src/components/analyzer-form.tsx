import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AnalyzerFormProps {
  onAnalyze: (emailContent: string) => void;
  isLoading: boolean;
}

export function AnalyzerForm({ onAnalyze, isLoading }: AnalyzerFormProps) {
  const [emailContent, setEmailContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailContent.trim()) {
      alert("Please paste email content first");
      return;
    }
    onAnalyze(emailContent);
  };

  const loadExample = () => {
    const exampleContent = `Subject: New Listing Alert: 123 Main St, Anytown, CA

Dear Investor,

We have a new listing that might interest you:

**Property Address:** 123 Main St, Anytown, CA 90210
**Property Type:** Single Family Home
**Purchase Price:** $250,000
**Estimated Monthly Rent:** $2,500
**Bedrooms:** 3
**Bathrooms:** 2.5
**Square Footage:** 1500 sqft
**Year Built:** 1985

**Description:**
This charming 3-bedroom, 2.5-bathroom single-family home is located in a desirable neighborhood in Anytown, CA. It features a spacious living area, a modern kitchen, and a large backyard. Perfect for a rental property.

**Listing URL:** https://example.com/listing/123mainst

Contact us for more details!

Sincerely,
Your Real Estate Team`;
    
    setEmailContent(exampleContent);
  };

  return (
    <div className="space-y-6">
      <Card className="analysis-card">
        <CardHeader className="border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-envelope text-primary"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Email Content</h3>
              <p className="text-sm text-muted-foreground">Paste your listing alert email content</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <Textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              className="h-80 resize-none"
              placeholder="Paste your real estate email content here...

Example format:
**Property Address:** 123 Main St, Anytown, CA 90210
**Property Type:** Single Family Home
**Purchase Price:** $250,000
**Estimated Monthly Rent:** $2,500
**Bedrooms:** 3
**Bathrooms:** 2.5
**Square Footage:** 1500 sqft
**Year Built:** 1985
**Description:** Beautiful property description...
**Listing URL:** https://example.com/listing"
              data-testid="input-email-content"
            />
            
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                <i className="fas fa-info-circle mr-1"></i>
                Supports standard MLS email formats
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
