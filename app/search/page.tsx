"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SearchPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to deals page where advanced search is now integrated
    router.push("/deals");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Redirecting to Email Deal Finder...</p>
      </div>
    </div>
  );
}