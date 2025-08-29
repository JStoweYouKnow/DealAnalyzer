import { Card, CardContent } from "@/components/ui/card";

export function LoadingState() {
  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-8 text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Analyzing Property...</h3>
        <p className="text-muted-foreground">Parsing email content and calculating investment metrics</p>
      </CardContent>
    </Card>
  );
}
