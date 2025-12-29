"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  title: string;
  content: string | string[];
  className?: string;
  iconSize?: number;
  iconColor?: string;
  variant?: "default" | "ghost" | "outline";
}

export function InfoTooltip({
  title,
  content,
  className,
  iconSize = 18,
  iconColor = "text-muted-foreground",
  variant = "ghost",
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  const contentArray = Array.isArray(content) ? content : [content];

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size="icon"
        className={cn("h-auto w-auto p-1", className)}
        onClick={() => setOpen(true)}
        aria-label={`Information about ${title}`}
      >
        <Info size={iconSize} className={iconColor} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {contentArray.map((paragraph, index) => (
              <p key={index} className="text-sm leading-6 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

