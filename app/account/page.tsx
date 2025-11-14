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
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground">
              Manage your profile, view usage statistics, and configure your investment preferences
            </p>
          </div>
        </div>

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

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Analyses</p>
                      <p className="text-3xl font-bold">{totalAnalyses}</p>
                    </div>
                    <HomeIcon className="w-12 h-12 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Meets Criteria</p>
                      <p className="text-3xl font-bold text-green-600">{meetsCriteriaCount}</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-600/20" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {totalAnalyses > 0 ? Math.round((meetsCriteriaCount / totalAnalyses) * 100) : 0}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Email Deals</p>
                      <p className="text-3xl font-bold">{totalDeals}</p>
                    </div>
                    <Mail className="w-12 h-12 text-blue-600/20" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {analyzedDeals} analyzed, {newDeals} new
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Analysis Rate</p>
                      <p className="text-3xl font-bold">
                        {totalDeals > 0 ? Math.round((analyzedDeals / totalDeals) * 100) : 0}%
                      </p>
                    </div>
                    <FileText className="w-12 h-12 text-purple-600/20" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Deals analyzed vs total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No analyses yet. Start analyzing properties to see your investment summary.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <p className="text-sm font-medium">Avg Cash Flow</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(
                            analysisHistory.reduce((sum, a) => sum + a.cashFlow, 0) / analysisHistory.length
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Per property/month</p>
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <p className="text-sm font-medium">Avg COC Return</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {(
                            (analysisHistory.reduce((sum, a) => sum + a.cocReturn, 0) / analysisHistory.length) * 100
                          ).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Cash-on-cash return</p>
                      </div>

                      <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <p className="text-sm font-medium">Avg Cap Rate</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                          {(
                            (analysisHistory.reduce((sum, a) => sum + a.capRate, 0) / analysisHistory.length) * 100
                          ).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Capitalization rate</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
