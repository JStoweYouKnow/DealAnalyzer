"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Mail, ArrowRight } from 'lucide-react';

interface EmailForwardingSetupProps {
  userId?: string;
}

export function EmailForwardingSetup({ userId }: EmailForwardingSetupProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate unique email address for this user
  // If no userId, use a default or generate a session-based ID
  const userIdentifier = userId || 'default';
  const forwardingEmail = `deals+${userIdentifier}@yourdomain.com`; // TODO: Replace with actual domain

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(forwardingEmail);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Forwarding email address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the email address",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Easy Email Forwarding Setup</h3>
            <p className="text-sm text-muted-foreground">
              Automatically receive property deals by forwarding emails - no Gmail OAuth needed!
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Your Unique Email Address */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <Label className="text-sm font-medium">Your Unique Forwarding Address</Label>
          <div className="flex gap-2">
            <Input
              value={forwardingEmail}
              readOnly
              className="font-mono text-sm bg-background"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This is your unique address. All emails forwarded here will appear in your pipeline.
          </p>
        </div>

        {/* Setup Steps */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Setup Steps (2 minutes)</h4>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                1
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium mb-1">Open Gmail Settings</p>
                <p className="text-xs text-muted-foreground">
                  Go to Gmail → Settings (gear icon) → "See all settings" → "Filters and Blocked Addresses"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                2
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium mb-1">Create a New Filter</p>
                <p className="text-xs text-muted-foreground">
                  Click "Create a new filter" and set your criteria (e.g., from specific senders or containing keywords like "property", "investment deal", etc.)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                3
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium mb-1">Set Forward Action</p>
                <p className="text-xs text-muted-foreground">
                  Check "Forward it to" and enter your unique forwarding address: <code className="text-xs bg-muted px-1 py-0.5 rounded">{forwardingEmail}</code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                4
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium mb-1">Done! Deals Appear Automatically</p>
                <p className="text-xs text-muted-foreground">
                  All matching emails will now be forwarded and automatically analyzed in your pipeline
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Example Filter */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs font-medium mb-2 text-blue-900 dark:text-blue-100">Example Filter Criteria:</p>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>From: <code>deals@realestatelist.com</code></li>
            <li>Subject contains: <code>investment property</code> OR <code>deal alert</code></li>
            <li>Has attachment</li>
          </ul>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">✓ No OAuth Setup</p>
            <p className="text-xs text-green-700 dark:text-green-300">Just forward emails</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">✓ Automatic</p>
            <p className="text-xs text-green-700 dark:text-green-300">Set it and forget it</p>
          </div>
        </div>

        {/* Help Link */}
        <div className="pt-2 border-t">
          <Button
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => window.open('https://support.google.com/mail/answer/10957?hl=en', '_blank')}
          >
            Need help setting up Gmail forwarding? <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
