"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Calendar, TrendingUp, FileText, Settings, DollarSign, Home as HomeIcon } from "lucide-react";
import type { EmailDeal, DealAnalysis } from "@shared/schema";

export default function AccountPage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [userEmail, setUserEmail] = useState("user@example.com");

  // Fetch email deals for statistics
  const { data: emailDeals = [] } = useQuery<EmailDeal[]>({
    queryKey: ['/api/email-deals'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-deals');
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    },
  });

  // Fetch analysis history for statistics
  const { data: analysisHistory = [] } = useQuery<DealAnalysis[]>({
    queryKey: ['/api/history'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/history');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Calculate statistics
  const totalAnalyses = analysisHistory.length;
  const meetsCriteriaCount = analysisHistory.filter(a => a.meetsCriteria).length;
  const totalDeals = emailDeals.length;
  const analyzedDeals = emailDeals.filter(d => d.status === 'analyzed').length;
  const newDeals = emailDeals.filter(d => d.status === 'new').length;

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
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Created</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Input
                        value={new Date().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
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
                        <p className="text-lg font-semibold">{totalAnalyses}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                      <Mail className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email Deals</p>
                        <p className="text-lg font-semibold">{totalDeals}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab - Enhanced Professional Design */}
          <TabsContent value="statistics" className="space-y-8 animate-fade-in">
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

            {/* Investment Summary - Enhanced */}
            <div className="analysis-card card-elevated">
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="heading-secondary">Investment Summary</h2>
                    <p className="text-sm text-muted-foreground mt-1">Average performance across all analyzed properties</p>
                  </div>
                  {analysisHistory.length > 0 && (
                    <Badge className="badge-info">{analysisHistory.length} Properties</Badge>
                  )}
                </div>
              </div>
              <div className="p-6">
                {analysisHistory.length === 0 ? (
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
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <h3 className="font-semibold">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about new deals and analysis results
                      </p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <h3 className="font-semibold">Investment Criteria</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure your default investment criteria and benchmarks
                      </p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <h3 className="font-semibold">Export Preferences</h3>
                      <p className="text-sm text-muted-foreground">
                        Set default formats and templates for PDF/CSV exports
                      </p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
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
