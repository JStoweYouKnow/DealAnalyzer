"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

type LoadingStateProps = React.HTMLAttributes<HTMLDivElement>;

const STATUS_STEPS = [
  {
    title: "Preparing data",
    description: "Uploading files and normalizing property details",
  },
  {
    title: "Parsing insights",
    description: "Extracting income, expenses, and loan assumptions",
  },
  {
    title: "Running calculations",
    description: "Evaluating cash flow, cap rate, and return metrics",
  },
  {
    title: "Summarizing results",
    description: "Finalizing recommendations and risk highlights",
  },
] as const;

export function LoadingState({ className, ...props }: LoadingStateProps) {
  const steps = useMemo(() => STATUS_STEPS, []);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setActiveStep(0);
    const intervalId = window.setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [steps.length]);

  return (
    <Card className={`border border-border shadow-sm ${className ?? ""}`} {...props}>
      <CardContent className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div>
            <div className="loading-spinner mb-4 sm:mb-0 sm:mr-4"></div>
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-semibold">Analyzing Property...</h3>
            <p className="text-muted-foreground">
              We’re reviewing your document and crunching the investment metrics. You’ll see results in just a moment.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isComplete = index < activeStep;
            const isCurrent = index === activeStep;

            return (
              <div
                key={step.title}
                className="flex items-start gap-3"
              >
                <div
                  className={[
                    "mt-1 h-3 w-3 rounded-full border transition-colors duration-300",
                    isComplete
                      ? "bg-green-500 border-green-500"
                      : isCurrent
                      ? "bg-primary border-primary animate-pulse"
                      : "bg-muted border-border",
                  ].join(" ")}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
