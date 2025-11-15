"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { User, Mail, Calendar, TrendingUp, FileText, Settings, DollarSign, Home as HomeIcon, RotateCcw, Save, Download, CheckSquare, Loader2, AlertCircle } from "lucide-react";
import type { EmailDeal, DealAnalysis, CriteriaResponse } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Investment Criteria state
  const [criteriaEditing, setCriteriaEditing] = useState(false);
  const [criteriaValues, setCriteriaValues] = useState<{
    maxPrice: number;
    cocBenchmarkMin: number;
    cocBenchmarkMax: number;
    cocMinimumMin: number;
    cocMinimumMax: number;
    capBenchmarkMin: number;
    capBenchmarkMax: number;
    capMinimum: number;
  }>({
    maxPrice: 500000,
    cocBenchmarkMin: 8,
    cocBenchmarkMax: 12,
    cocMinimumMin: 6,
    cocMinimumMax: 8,
    capBenchmarkMin: 6,
    capBenchmarkMax: 9,
    capMinimum: 5,
  });

  // Export Preferences state
  const [exportEditing, setExportEditing] = useState(false);
  const [exportPreferences, setExportPreferences] = useState({
    defaultFormat: "pdf" as "pdf" | "csv",
    sections: {
      propertyDetails: true,
      financialAnalysis: true,
      expenseBreakdown: true,
      cashFlowProjections: true,
      criteriaComparison: true,
      marketData: false,
    },
  });

  // Email Notifications state
  const [notifyEditing, setNotifyEditing] = useState(false);
  const [notifyPreferences, setNotifyPreferences] = useState({
    notifyOnNewDeals: false,
    notifyOnAnalysisComplete: false,
    notifyOnCriteriaMatch: true,
    notifyOnWeeklySummary: false,
    frequency: 'immediate' as 'immediate' | 'daily' | 'weekly',
    email: '',
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Preset templates
  const presetTemplates = {
    conservative: {
      name: "Conservative Investor",
      description: "Lower risk with stable, predictable returns",
      values: {
        maxPrice: 400000,
        cocBenchmarkMin: 10,
        cocBenchmarkMax: 15,
        cocMinimumMin: 8,
        cocMinimumMax: 10,
        capBenchmarkMin: 7,
        capBenchmarkMax: 10,
        capMinimum: 6,
      },
    },
    aggressive: {
      name: "Aggressive Growth",
      description: "Higher risk tolerance for maximum returns",
      values: {
        maxPrice: 1000000,
        cocBenchmarkMin: 15,
        cocBenchmarkMax: 25,
        cocMinimumMin: 12,
        cocMinimumMax: 15,
        capBenchmarkMin: 10,
        capBenchmarkMax: 15,
        capMinimum: 8,
      },
    },
    cashFlow: {
      name: "Cash Flow Focused",
      description: "Emphasis on consistent monthly cash flow",
      values: {
        maxPrice: 600000,
        cocBenchmarkMin: 12,
        cocBenchmarkMax: 18,
        cocMinimumMin: 10,
        cocMinimumMax: 12,
        capBenchmarkMin: 8,
        capBenchmarkMax: 12,
        capMinimum: 7,
      },
    },
  };

  // Validation function
  const validateCriteria = (values: typeof criteriaValues) => {
    const errors: typeof validationErrors = {};

    // Validate COC Benchmark range
    if (values.cocBenchmarkMin >= values.cocBenchmarkMax) {
      errors.cocBenchmark = "Minimum must be less than maximum";
    }
    if (values.cocBenchmarkMin < 0 || values.cocBenchmarkMax > 30) {
      errors.cocBenchmark = "Values must be between 0% and 30%";
    }

    // Validate COC Minimum range
    if (values.cocMinimumMin >= values.cocMinimumMax) {
      errors.cocMinimum = "Minimum must be less than maximum";
    }
    if (values.cocMinimumMin < 0 || values.cocMinimumMax > 20) {
      errors.cocMinimum = "Values must be between 0% and 20%";
    }

    // Validate Cap Benchmark range
    if (values.capBenchmarkMin >= values.capBenchmarkMax) {
      errors.capBenchmark = "Minimum must be less than maximum";
    }
    if (values.capBenchmarkMin < 0 || values.capBenchmarkMax > 20) {
      errors.capBenchmark = "Values must be between 0% and 20%";
    }

    // Validate max price
    if (values.maxPrice < 100000 || values.maxPrice > 2000000) {
      errors.maxPrice = "Price must be between $100,000 and $2,000,000";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Apply preset template
  const applyPreset = (presetKey: keyof typeof presetTemplates) => {
    const preset = presetTemplates[presetKey];
    setCriteriaValues(preset.values);
    setValidationErrors({});
    toast({
      title: "Preset Applied",
      description: `${preset.name} criteria have been applied.`,
    });
  };

  // Fetch investment criteria
  const { data: criteria, isLoading: criteriaLoading } = useQuery<CriteriaResponse>({
    queryKey: ['/api/criteria'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/criteria');
      return response.json();
    },
  });

  // Fetch user email from Clerk authentication
  useEffect(() => {
    if (isUserLoaded) {
      setEmailLoading(false);
      if (user) {
        // Get primary email or first available email
        const primaryEmail = user.primaryEmailAddress?.emailAddress;
        const firstEmail = user.emailAddresses?.[0]?.emailAddress;
        const email = primaryEmail || firstEmail;
        
        if (email) {
          setUserEmail(email);
          setEmailError(null);
        } else {
          setEmailError("No email address found for this user");
          setUserEmail("");
        }
      } else {
        // User not authenticated
        setEmailError("Please sign in to view your account");
        setUserEmail("");
      }
    }
  }, [user, isUserLoaded]);

  // Update criteria values when fetched
  useEffect(() => {
    if (criteria) {
      setCriteriaValues({
        maxPrice: criteria.max_purchase_price || 500000,
        cocBenchmarkMin: (criteria.coc_benchmark_min || 0.08) * 100,
        cocBenchmarkMax: (criteria.coc_benchmark_max || 0.12) * 100,
        cocMinimumMin: (criteria.coc_minimum_min || 0.06) * 100,
        cocMinimumMax: (criteria.coc_minimum_max || 0.08) * 100,
        capBenchmarkMin: (criteria.cap_benchmark_min || 0.06) * 100,
        capBenchmarkMax: (criteria.cap_benchmark_max || 0.09) * 100,
        capMinimum: (criteria.cap_minimum || 0.05) * 100,
      });
    }
  }, [criteria]);

  // Validate criteria when values change during editing
  useEffect(() => {
    if (criteriaEditing) {
      validateCriteria(criteriaValues);
    }
  }, [criteriaValues, criteriaEditing]);

  // Load export preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('exportPreferences');
    if (saved) {
      try {
        setExportPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse export preferences:', error);
      }
    }
  }, []);

  // Save export preferences to localStorage when they change
  const saveExportPreferences = () => {
    localStorage.setItem('exportPreferences', JSON.stringify(exportPreferences));
    toast({
      title: "Export Preferences Saved",
      description: "Your export preferences have been saved successfully.",
    });
    setExportEditing(false);
  };

  const resetExportPreferences = () => {
    const saved = localStorage.getItem('exportPreferences');
    if (saved) {
      try {
        setExportPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse export preferences:', error);
      }
    }
    setExportEditing(false);
  };

  // Update criteria mutation
  const updateCriteriaMutation = useMutation({
    mutationFn: async (values: typeof criteriaValues) => {
      const response = await apiRequest('PUT', '/api/criteria', {
        criteria: {
          price_max: values.maxPrice,
          coc_benchmark_min: values.cocBenchmarkMin,
          coc_benchmark_max: values.cocBenchmarkMax,
          coc_minimum_min: values.cocMinimumMin,
          coc_minimum_max: values.cocMinimumMax,
          cap_benchmark_min: values.capBenchmarkMin,
          cap_benchmark_max: values.capBenchmarkMax,
          cap_minimum: values.capMinimum,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/criteria'] });
      toast({
        title: "Criteria Updated",
        description: "Your investment criteria have been saved successfully.",
      });
      setCriteriaEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update investment criteria.",
        variant: "destructive",
      });
    },
  });

  const handleSaveCriteria = () => {
    if (validateCriteria(criteriaValues)) {
      updateCriteriaMutation.mutate(criteriaValues);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      });
    }
  };

  const handleResetCriteria = () => {
    if (criteria) {
      setCriteriaValues({
        maxPrice: criteria.max_purchase_price || 500000,
        cocBenchmarkMin: (criteria.coc_benchmark_min || 0.08) * 100,
        cocBenchmarkMax: (criteria.coc_benchmark_max || 0.12) * 100,
        cocMinimumMin: (criteria.coc_minimum_min || 0.06) * 100,
        cocMinimumMax: (criteria.coc_minimum_max || 0.08) * 100,
        capBenchmarkMin: (criteria.cap_benchmark_min || 0.06) * 100,
        capBenchmarkMax: (criteria.cap_benchmark_max || 0.09) * 100,
        capMinimum: (criteria.cap_minimum || 0.05) * 100,
      });
    }
    setValidationErrors({});
    setCriteriaEditing(false);
  };

  // Fetch email deals for statistics
  const { 
    data: emailDeals = [], 
    isLoading: isLoadingEmailDeals, 
    error: emailDealsError,
    refetch: refetchEmailDeals 
  } = useQuery<EmailDeal[]>({
    queryKey: ['/api/email-deals'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-deals');
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    },
  });

  // Fetch analysis history for statistics
  const { 
    data: analysisHistory = [], 
    isLoading: isLoadingAnalysisHistory, 
    error: analysisHistoryError,
    refetch: refetchAnalysisHistory 
  } = useQuery<DealAnalysis[]>({
    queryKey: ['/api/history'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/history');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch email notification preferences
  const { data: notificationPrefs } = useQuery({
    queryKey: ['/api/user/notifications'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/notifications');
      return response.json();
    },
    enabled: isUserLoaded && !!user,
  });

  // Update notification preferences when fetched
  useEffect(() => {
    if (notificationPrefs) {
      setNotifyPreferences({
        notifyOnNewDeals: notificationPrefs.notifyOnNewDeals ?? false,
        notifyOnAnalysisComplete: notificationPrefs.notifyOnAnalysisComplete ?? false,
        notifyOnCriteriaMatch: notificationPrefs.notifyOnCriteriaMatch ?? true,
        notifyOnWeeklySummary: notificationPrefs.notifyOnWeeklySummary ?? false,
        frequency: notificationPrefs.frequency || 'immediate',
        email: notificationPrefs.email || userEmail || '',
      });
    }
  }, [notificationPrefs, userEmail]);

  // Save notification preferences
  const saveNotificationPreferences = async () => {
    try {
      const email = userEmail || user?.primaryEmailAddress?.emailAddress || '';
      await apiRequest('PUT', '/api/user/notifications', {
        body: JSON.stringify({
          ...notifyPreferences,
          email,
        }),
      });
      toast({
        title: "Notification Preferences Saved",
        description: "Your email notification preferences have been saved successfully.",
      });
      setNotifyEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user/notifications'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetNotificationPreferences = () => {
    if (notificationPrefs) {
      setNotifyPreferences({
        notifyOnNewDeals: notificationPrefs.notifyOnNewDeals ?? false,
        notifyOnAnalysisComplete: notificationPrefs.notifyOnAnalysisComplete ?? false,
        notifyOnCriteriaMatch: notificationPrefs.notifyOnCriteriaMatch ?? true,
        notifyOnWeeklySummary: notificationPrefs.notifyOnWeeklySummary ?? false,
        frequency: notificationPrefs.frequency || 'immediate',
        email: notificationPrefs.email || userEmail || '',
      });
    }
    setNotifyEditing(false);
  };

  // Calculate statistics (only when data is available and not loading)
  const isLoadingStats = isLoadingEmailDeals || isLoadingAnalysisHistory;
  const statsError = emailDealsError || analysisHistoryError;
  
  const totalAnalyses = analysisHistory?.length || 0;
  const meetsCriteriaCount = analysisHistory?.filter(a => a.meetsCriteria).length || 0;
  const totalDeals = emailDeals?.length || 0;
  const analyzedDeals = emailDeals?.filter(d => d.status === 'analyzed').length || 0;
  const newDeals = emailDeals?.filter(d => d.status === 'new').length || 0;

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
    setIsEditing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="space-y-8">
        {/* Header - Professional Design */}
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="heading-primary">My Account</h1>
            <p className="text-muted-foreground text-lg">
              Manage your profile, view usage statistics, and configure your investment preferences
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="status-dot status-success"></div>
            <span className="text-sm font-medium text-muted-foreground">Active</span>
          </div>
        </div>

        {/* Decorative Section Divider */}
        <div className="section-divider"></div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Profile Information</span>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveProfile}>
                        Save Changes
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={emailLoading ? "Loading..." : userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        disabled={!isEditing || emailLoading}
                        placeholder={emailLoading ? "Loading..." : emailError || "No email available"}
                        className={emailError ? "border-red-500" : ""}
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-red-500 mt-1">{emailError}</p>
                    )}
                    {emailLoading && !emailError && (
                      <p className="text-sm text-muted-foreground mt-1">Loading email address...</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Account Created</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Input
                        value={(() => {
                          if (!user?.createdAt) {
                            return "Unknown";
                          }
                          try {
                            // Clerk createdAt is a timestamp in milliseconds
                            const createdDate = typeof user.createdAt === 'number' 
                              ? new Date(user.createdAt) 
                              : new Date(user.createdAt);
                            // Check if date is valid
                            if (isNaN(createdDate.getTime())) {
                              return "Unknown";
                            }
                            return createdDate.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                          } catch (error) {
                            return "Unknown";
                          }
                        })()}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Account Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                      <Mail className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="text-lg font-semibold">Free Tier</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Properties Analyzed</p>
                        {isLoadingStats ? (
                          <Skeleton className="h-7 w-12 mt-1" />
                        ) : statsError ? (
                          <p className="text-lg font-semibold text-muted-foreground">—</p>
                        ) : (
                          <p className="text-lg font-semibold">{totalAnalyses}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                      <Mail className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email Deals</p>
                        {isLoadingStats ? (
                          <Skeleton className="h-7 w-12 mt-1" />
                        ) : statsError ? (
                          <p className="text-lg font-semibold text-muted-foreground">—</p>
                        ) : (
                          <p className="text-lg font-semibold">{totalDeals}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab - Enhanced Professional Design */}
          <TabsContent value="statistics" className="space-y-8 animate-fade-in">
            {statsError ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
                      <AlertCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Failed to Load Statistics</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      {statsError instanceof Error ? statsError.message : 'An error occurred while loading your statistics. Please try again.'}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          refetchEmailDeals();
                          refetchAnalysisHistory();
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : isLoadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Loading Skeletons */}
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="stat-card group">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-20 mb-2" />
                      <Skeleton className="h-3 w-32 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Analyses Stat Card */}
                <div className="stat-card group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <HomeIcon className="w-10 h-10 text-primary transition-transform duration-300 group-hover:scale-110" />
                      <Badge variant="outline" className="text-xs">All time</Badge>
                    </div>
                    <div className="stat-label mb-2">Total Analyses</div>
                    <div className="stat-value text-gradient-primary">{totalAnalyses}</div>
                  </div>
                </div>

                {/* Meets Criteria Stat Card */}
                <div className="stat-card group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="w-10 h-10 text-green-600 transition-transform duration-300 group-hover:scale-110" />
                      <Badge className="badge-success text-xs">
                        {totalAnalyses > 0 ? Math.round((meetsCriteriaCount / totalAnalyses) * 100) : 0}%
                      </Badge>
                    </div>
                    <div className="stat-label mb-2">Meets Criteria</div>
                    <div className="stat-value text-gradient-success">{meetsCriteriaCount}</div>
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                      {totalAnalyses > 0 ? Math.round((meetsCriteriaCount / totalAnalyses) * 100) : 0}% of total analyzed
                    </p>
                  </div>
                </div>

                {/* Email Deals Stat Card */}
                <div className="stat-card group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <Mail className="w-10 h-10 text-blue-600 transition-transform duration-300 group-hover:scale-110" />
                      <div className="flex items-center gap-1">
                        <div className="status-dot status-success"></div>
                      </div>
                    </div>
                    <div className="stat-label mb-2">Email Deals</div>
                    <div className="stat-value text-blue-600">{totalDeals}</div>
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                      <span className="text-green-600 font-semibold">{analyzedDeals}</span> analyzed, <span className="text-blue-600 font-semibold">{newDeals}</span> new
                    </p>
                  </div>
                </div>

                {/* Analysis Rate Stat Card */}
                <div className="stat-card group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <FileText className="w-10 h-10 text-purple-600 transition-transform duration-300 group-hover:scale-110" />
                      <Badge variant="outline" className="text-xs">Rate</Badge>
                    </div>
                    <div className="stat-label mb-2">Analysis Rate</div>
                    <div className="stat-value text-purple-600">
                      {totalDeals > 0 ? Math.round((analyzedDeals / totalDeals) * 100) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                      Deals analyzed vs total
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Investment Summary - Enhanced */}
            {!statsError && (
              <div className="analysis-card card-elevated">
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="heading-secondary">Investment Summary</h2>
                      <p className="text-sm text-muted-foreground mt-1">Average performance across all analyzed properties</p>
                    </div>
                    {!isLoadingAnalysisHistory && analysisHistory.length > 0 && (
                      <Badge className="badge-info">{analysisHistory.length} Properties</Badge>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {isLoadingAnalysisHistory ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="relative p-6 rounded-xl border-2 border-border/20">
                          <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-10 w-32 mb-2" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      ))}
                    </div>
                  ) : analysisHistory.length === 0 ? (
                    <div className="text-center py-12 animate-fade-in">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                        <TrendingUp className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Start analyzing properties to see your investment summary and track your portfolio performance.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-scale-in">
                      {/* Avg Cash Flow Card */}
                      <div className="relative p-6 rounded-xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border-2 border-green-500/20 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 group overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/10 rounded-full blur-3xl transition-all duration-300 group-hover:bg-green-500/20"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-green-500/20 text-green-600">
                              <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Avg Cash Flow</p>
                              <p className="text-[10px] text-muted-foreground">Per month</p>
                            </div>
                          </div>
                          <p className="text-4xl font-bold text-gradient-success mb-1">
                            {formatCurrency(
                              analysisHistory.reduce((sum, a) => sum + a.cashFlow, 0) / analysisHistory.length
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">Per property/month</p>
                        </div>
                      </div>

                      {/* Avg COC Return Card */}
                      <div className="relative p-6 rounded-xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent border-2 border-blue-500/20 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl transition-all duration-300 group-hover:bg-blue-500/20"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-600">
                              <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Avg COC Return</p>
                              <p className="text-[10px] text-muted-foreground">Annual</p>
                            </div>
                          </div>
                          <p className="text-4xl font-bold text-blue-600 mb-1">
                            {(
                              (analysisHistory.reduce((sum, a) => sum + a.cocReturn, 0) / analysisHistory.length) * 100
                            ).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">Cash-on-cash return</p>
                        </div>
                      </div>

                      {/* Avg Cap Rate Card */}
                      <div className="relative p-6 rounded-xl bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-transparent border-2 border-purple-500/20 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl transition-all duration-300 group-hover:bg-purple-500/20"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-600">
                              <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Avg Cap Rate</p>
                              <p className="text-[10px] text-muted-foreground">Annual</p>
                            </div>
                          </div>
                          <p className="text-4xl font-bold text-purple-600 mb-1">
                            {(
                              (analysisHistory.reduce((sum, a) => sum + a.capRate, 0) / analysisHistory.length) * 100
                            ).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">Capitalization rate</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Email Notifications - Coming Soon */}
                  <div className="analysis-card p-6 relative">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Mail className="w-5 h-5 text-primary" />
                          Email Notifications
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Manage when you receive email updates
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Coming Soon
                      </Badge>
                    </div>

                    <div className="space-y-4 opacity-60 pointer-events-none">
                      <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed">
                        <div className="flex items-center gap-3 mb-3">
                          <Mail className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-semibold text-sm">Email Notifications</p>
                            <p className="text-xs text-muted-foreground">Feature launching soon</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Configure email alerts for new deals, analysis completions, criteria matches, and weekly summaries. 
                          This feature will be available once domain verification is complete.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                            <p className="font-semibold text-sm">New Deals</p>
                          </div>
                          <p className="text-xs text-muted-foreground">Get notified when new properties are added</p>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                            <p className="font-semibold text-sm">Analysis Complete</p>
                          </div>
                          <p className="text-xs text-muted-foreground">Notifications when property analysis finishes</p>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                            <p className="font-semibold text-sm">Criteria Match</p>
                          </div>
                          <p className="text-xs text-muted-foreground">Alerts when properties meet your criteria</p>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                            <p className="font-semibold text-sm">Weekly Summary</p>
                          </div>
                          <p className="text-xs text-muted-foreground">Weekly digest of your activity</p>
                        </div>
                      </div>

                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Settings className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-semibold text-sm mb-1">Customizable Delivery Frequency</p>
                            <p className="text-xs text-muted-foreground">
                              Choose between immediate notifications, daily digests, or weekly summaries to match your workflow.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Investment Criteria - Now Functional */}
                  <div className="analysis-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-primary" />
                          Investment Criteria
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Configure your default investment criteria and benchmarks
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {criteriaEditing ? (
                          <>
                            <Button variant="outline" size="sm" onClick={handleResetCriteria}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveCriteria}
                              disabled={updateCriteriaMutation.isPending || Object.keys(validationErrors).length > 0}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {updateCriteriaMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setCriteriaEditing(true)}>
                            Edit Criteria
                          </Button>
                        )}
                      </div>
                    </div>

                    {criteriaLoading ? (
                      <div className="space-y-4">
                        <div className="skeleton h-20"></div>
                        <div className="skeleton h-20"></div>
                        <div className="skeleton h-20"></div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Preset Templates */}
                        {criteriaEditing && (
                          <div className="p-4 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-primary/20 rounded-lg">
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              Quick Apply Presets
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset('conservative')}
                                className="flex flex-col items-start h-auto p-3 hover:bg-green-500/10 hover:border-green-500/50"
                              >
                                <span className="font-semibold text-xs">Conservative Investor</span>
                                <span className="text-[10px] text-muted-foreground mt-1">Lower risk, stable returns</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset('aggressive')}
                                className="flex flex-col items-start h-auto p-3 hover:bg-orange-500/10 hover:border-orange-500/50"
                              >
                                <span className="font-semibold text-xs">Aggressive Growth</span>
                                <span className="text-[10px] text-muted-foreground mt-1">Higher risk, max returns</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset('cashFlow')}
                                className="flex flex-col items-start h-auto p-3 hover:bg-blue-500/10 hover:border-blue-500/50"
                              >
                                <span className="font-semibold text-xs">Cash Flow Focused</span>
                                <span className="text-[10px] text-muted-foreground mt-1">Consistent monthly income</span>
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Max Purchase Price */}
                        <div className="form-section">
                          <Label className="text-sm font-semibold mb-3 block">Maximum Purchase Price</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[criteriaValues.maxPrice]}
                              onValueChange={(value) => setCriteriaValues({ ...criteriaValues, maxPrice: value[0] })}
                              min={100000}
                              max={2000000}
                              step={10000}
                              disabled={!criteriaEditing}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={criteriaValues.maxPrice}
                              onChange={(e) => setCriteriaValues({ ...criteriaValues, maxPrice: parseInt(e.target.value) || 0 })}
                              disabled={!criteriaEditing}
                              className={`w-32 input-enhanced ${validationErrors.maxPrice ? 'border-red-500' : ''}`}
                            />
                          </div>
                          {validationErrors.maxPrice ? (
                            <p className="text-xs text-red-500 mt-2">{validationErrors.maxPrice}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-2">
                              Properties above this price will not meet your criteria
                            </p>
                          )}
                        </div>

                        {/* COC Return Benchmarks */}
                        <div className="form-section">
                          <Label className="text-sm font-semibold mb-3 block">Cash-on-Cash Return Benchmark (%)</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-2 block">Minimum</Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[criteriaValues.cocBenchmarkMin]}
                                  onValueChange={(value) => setCriteriaValues({ ...criteriaValues, cocBenchmarkMin: value[0] })}
                                  min={0}
                                  max={30}
                                  step={0.5}
                                  disabled={!criteriaEditing}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium w-12 text-right">{criteriaValues.cocBenchmarkMin.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-2 block">Maximum</Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[criteriaValues.cocBenchmarkMax]}
                                  onValueChange={(value) => setCriteriaValues({ ...criteriaValues, cocBenchmarkMax: value[0] })}
                                  min={0}
                                  max={30}
                                  step={0.5}
                                  disabled={!criteriaEditing}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium w-12 text-right">{criteriaValues.cocBenchmarkMax.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                          {validationErrors.cocBenchmark ? (
                            <p className="text-xs text-red-500 mt-2">{validationErrors.cocBenchmark}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-2">
                              Your target range for cash-on-cash returns
                            </p>
                          )}
                        </div>

                        {/* COC Minimum */}
                        <div className="form-section">
                          <Label className="text-sm font-semibold mb-3 block">COC Minimum Acceptable Range (%)</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-2 block">Minimum</Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[criteriaValues.cocMinimumMin]}
                                  onValueChange={(value) => setCriteriaValues({ ...criteriaValues, cocMinimumMin: value[0] })}
                                  min={0}
                                  max={20}
                                  step={0.5}
                                  disabled={!criteriaEditing}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium w-12 text-right">{criteriaValues.cocMinimumMin.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-2 block">Maximum</Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[criteriaValues.cocMinimumMax]}
                                  onValueChange={(value) => setCriteriaValues({ ...criteriaValues, cocMinimumMax: value[0] })}
                                  min={0}
                                  max={20}
                                  step={0.5}
                                  disabled={!criteriaEditing}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium w-12 text-right">{criteriaValues.cocMinimumMax.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                          {validationErrors.cocMinimum ? (
                            <p className="text-xs text-red-500 mt-2">{validationErrors.cocMinimum}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-2">
                              The absolute minimum COC return you'll accept
                            </p>
                          )}
                        </div>

                        {/* Cap Rate Benchmarks */}
                        <div className="form-section">
                          <Label className="text-sm font-semibold mb-3 block">Capitalization Rate Benchmark (%)</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-2 block">Minimum</Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[criteriaValues.capBenchmarkMin]}
                                  onValueChange={(value) => setCriteriaValues({ ...criteriaValues, capBenchmarkMin: value[0] })}
                                  min={0}
                                  max={20}
                                  step={0.5}
                                  disabled={!criteriaEditing}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium w-12 text-right">{criteriaValues.capBenchmarkMin.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-2 block">Maximum</Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[criteriaValues.capBenchmarkMax]}
                                  onValueChange={(value) => setCriteriaValues({ ...criteriaValues, capBenchmarkMax: value[0] })}
                                  min={0}
                                  max={20}
                                  step={0.5}
                                  disabled={!criteriaEditing}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium w-12 text-right">{criteriaValues.capBenchmarkMax.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                          {validationErrors.capBenchmark ? (
                            <p className="text-xs text-red-500 mt-2">{validationErrors.capBenchmark}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-2">
                              Your target range for capitalization rates
                            </p>
                          )}
                        </div>

                        {/* Cap Rate Minimum */}
                        <div className="form-section">
                          <Label className="text-sm font-semibold mb-3 block">Cap Rate Absolute Minimum (%)</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[criteriaValues.capMinimum]}
                              onValueChange={(value) => setCriteriaValues({ ...criteriaValues, capMinimum: value[0] })}
                              min={0}
                              max={15}
                              step={0.5}
                              disabled={!criteriaEditing}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-16 text-right">{criteriaValues.capMinimum.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Properties below this cap rate will not meet your criteria
                          </p>
                        </div>

                        {/* Summary */}
                        {!criteriaEditing && (
                          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              Current Criteria Summary
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground">Max Price:</span>
                                <span className="font-semibold ml-1">${criteriaValues.maxPrice.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">COC Target:</span>
                                <span className="font-semibold ml-1">{criteriaValues.cocBenchmarkMin.toFixed(1)}% - {criteriaValues.cocBenchmarkMax.toFixed(1)}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cap Target:</span>
                                <span className="font-semibold ml-1">{criteriaValues.capBenchmarkMin.toFixed(1)}% - {criteriaValues.capBenchmarkMax.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Export Preferences - Now Functional */}
                  <div className="analysis-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Download className="w-5 h-5 text-primary" />
                          Export Preferences
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Configure your default export format and included sections
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {exportEditing ? (
                          <>
                            <Button variant="outline" size="sm" onClick={resetExportPreferences}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button size="sm" onClick={saveExportPreferences}>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setExportEditing(true)}>
                            Edit Preferences
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Default Format */}
                      <div className="form-section">
                        <Label className="text-sm font-semibold mb-3 block">Default Export Format</Label>
                        <RadioGroup
                          value={exportPreferences.defaultFormat}
                          onValueChange={(value) => setExportPreferences({ ...exportPreferences, defaultFormat: value as "pdf" | "csv" })}
                          disabled={!exportEditing}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2 p-3 border-2 rounded-lg hover:bg-accent/50 transition-colors">
                            <RadioGroupItem value="pdf" id="pdf" disabled={!exportEditing} />
                            <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-red-500" />
                                <div>
                                  <p className="font-semibold text-sm">PDF Report</p>
                                  <p className="text-xs text-muted-foreground">Formatted, printable report</p>
                                </div>
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border-2 rounded-lg hover:bg-accent/50 transition-colors">
                            <RadioGroupItem value="csv" id="csv" disabled={!exportEditing} />
                            <Label htmlFor="csv" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-green-500" />
                                <div>
                                  <p className="font-semibold text-sm">CSV Data</p>
                                  <p className="text-xs text-muted-foreground">Spreadsheet-compatible data</p>
                                </div>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Included Sections */}
                      <div className="form-section">
                        <Label className="text-sm font-semibold mb-3 block">Sections to Include in Reports</Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/30 transition-colors">
                            <Checkbox
                              id="propertyDetails"
                              checked={exportPreferences.sections.propertyDetails}
                              onCheckedChange={(checked) => setExportPreferences({
                                ...exportPreferences,
                                sections: { ...exportPreferences.sections, propertyDetails: checked as boolean }
                              })}
                              disabled={!exportEditing}
                            />
                            <Label htmlFor="propertyDetails" className="flex-1 cursor-pointer">
                              <div>
                                <p className="font-semibold text-sm">Property Details</p>
                                <p className="text-xs text-muted-foreground">Address, price, size, and basic information</p>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/30 transition-colors">
                            <Checkbox
                              id="financialAnalysis"
                              checked={exportPreferences.sections.financialAnalysis}
                              onCheckedChange={(checked) => setExportPreferences({
                                ...exportPreferences,
                                sections: { ...exportPreferences.sections, financialAnalysis: checked as boolean }
                              })}
                              disabled={!exportEditing}
                            />
                            <Label htmlFor="financialAnalysis" className="flex-1 cursor-pointer">
                              <div>
                                <p className="font-semibold text-sm">Financial Analysis</p>
                                <p className="text-xs text-muted-foreground">ROI, COC, Cap Rate, and key metrics</p>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/30 transition-colors">
                            <Checkbox
                              id="expenseBreakdown"
                              checked={exportPreferences.sections.expenseBreakdown}
                              onCheckedChange={(checked) => setExportPreferences({
                                ...exportPreferences,
                                sections: { ...exportPreferences.sections, expenseBreakdown: checked as boolean }
                              })}
                              disabled={!exportEditing}
                            />
                            <Label htmlFor="expenseBreakdown" className="flex-1 cursor-pointer">
                              <div>
                                <p className="font-semibold text-sm">Expense Breakdown</p>
                                <p className="text-xs text-muted-foreground">Detailed monthly and annual expenses</p>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/30 transition-colors">
                            <Checkbox
                              id="cashFlowProjections"
                              checked={exportPreferences.sections.cashFlowProjections}
                              onCheckedChange={(checked) => setExportPreferences({
                                ...exportPreferences,
                                sections: { ...exportPreferences.sections, cashFlowProjections: checked as boolean }
                              })}
                              disabled={!exportEditing}
                            />
                            <Label htmlFor="cashFlowProjections" className="flex-1 cursor-pointer">
                              <div>
                                <p className="font-semibold text-sm">Cash Flow Projections</p>
                                <p className="text-xs text-muted-foreground">Monthly and annual cash flow estimates</p>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/30 transition-colors">
                            <Checkbox
                              id="criteriaComparison"
                              checked={exportPreferences.sections.criteriaComparison}
                              onCheckedChange={(checked) => setExportPreferences({
                                ...exportPreferences,
                                sections: { ...exportPreferences.sections, criteriaComparison: checked as boolean }
                              })}
                              disabled={!exportEditing}
                            />
                            <Label htmlFor="criteriaComparison" className="flex-1 cursor-pointer">
                              <div>
                                <p className="font-semibold text-sm">Criteria Comparison</p>
                                <p className="text-xs text-muted-foreground">How the property compares to your criteria</p>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/30 transition-colors">
                            <Checkbox
                              id="marketData"
                              checked={exportPreferences.sections.marketData}
                              onCheckedChange={(checked) => setExportPreferences({
                                ...exportPreferences,
                                sections: { ...exportPreferences.sections, marketData: checked as boolean }
                              })}
                              disabled={!exportEditing}
                            />
                            <Label htmlFor="marketData" className="flex-1 cursor-pointer">
                              <div>
                                <p className="font-semibold text-sm">Market Data</p>
                                <p className="text-xs text-muted-foreground">Local market trends and comparables</p>
                              </div>
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      {!exportEditing && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-primary" />
                            Current Export Settings
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground">Format:</span>
                              <span className="font-semibold ml-1 uppercase">{exportPreferences.defaultFormat}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Sections:</span>
                              <span className="font-semibold ml-1">
                                {Object.values(exportPreferences.sections).filter(Boolean).length} / {Object.keys(exportPreferences.sections).length}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <h3 className="font-semibold">Data & Privacy</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your data, privacy settings, and account deletion
                      </p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">About</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Application:</strong> The Comfort Finder</p>
                    <p><strong>Version:</strong> 1.0.0</p>
                    <p><strong>Description:</strong> Advanced real estate deal analysis and property intelligence platform</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
