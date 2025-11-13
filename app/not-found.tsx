import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">404 - Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex gap-2">
            <Button asChild>
              <Link href="/">
                <i className="fas fa-home mr-2"></i>
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/deals">
                <i className="fas fa-list mr-2"></i>
                View Deals
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}










