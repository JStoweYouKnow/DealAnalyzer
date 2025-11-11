"use client";
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { configurableCriteriaSchema, type ConfigurableCriteria, type CriteriaResponse } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InfoTooltip } from "@/components/info-tooltip";

interface CriteriaConfigProps {
  criteria?: CriteriaResponse;
  onUpdate?: () => void;
}

export function CriteriaConfig({ criteria, onUpdate }: CriteriaConfigProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Convert current criteria to form format
  const getDefaultValues = (): ConfigurableCriteria => ({
    price_min: 0,
    price_max: criteria?.max_purchase_price ?? 300000,
    coc_return_min: (criteria?.coc_minimum_min ?? 0.08) * 100, // Convert to percentage
    coc_return_max: (criteria?.coc_benchmark_max ?? 0.15) * 100,
    cap_rate_min: (criteria?.cap_minimum ?? 0.04) * 100,
    cap_rate_max: (criteria?.cap_benchmark_max ?? 0.12) * 100,
  });

  const form = useForm<ConfigurableCriteria>({
    resolver: zodResolver(configurableCriteriaSchema),
    defaultValues: getDefaultValues(),
  });

  // Update form when criteria changes
  useEffect(() => {
    form.reset(getDefaultValues());
  }, [criteria]);

  const updateCriteriaMutation = useMutation({
    mutationFn: async (data: ConfigurableCriteria) => {
      const response = await apiRequest("PUT", "/api/criteria", {
        criteria: data
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Criteria Updated",
        description: "Investment criteria have been successfully updated.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/criteria'] });
      onUpdate?.();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update criteria. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ConfigurableCriteria) => {
    updateCriteriaMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!isEditing) {
    return (
      <Card className="analysis-card">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <i className="fas fa-sliders-h text-primary mr-3"></i>
              Investment Criteria
              <InfoTooltip
                title="Investment Criteria"
                content={[
                  "Set your investment criteria to automatically evaluate properties. DealAnalyzer will compare each property against these criteria to determine if it meets your investment standards.",
                  "• Purchase Price Range: Maximum price you're willing to pay for a property",
                  "• COC Return Range: Cash-on-Cash return percentage (annual return on cash investment). Higher is better for passive income.",
                  "• Cap Rate Range: Capitalization rate percentage (NOI / property value). Indicates the property's potential return.",
                  "Properties that meet your criteria will be marked with a green indicator. You can adjust these criteria at any time to refine your search.",
                ]}
              />
            </h3>
            <Button 
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              data-testid="button-edit-criteria"
            >
              <i className="fas fa-edit mr-2"></i>
              Configure
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Purchase Price Range</Label>
              <div className="flex flex-col space-y-1">
                <Badge variant="outline" className="justify-center">
                  {formatCurrency(0)} - {formatCurrency(criteria?.max_purchase_price ?? 300000)}
                </Badge>
              </div>
            </div>

            {/* COC Return Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">COC Return Range</Label>
              <div className="flex flex-col space-y-1">
                <Badge variant="outline" className="justify-center">
                  {formatPercent((criteria?.coc_minimum_min ?? 0.08) * 100)} - {formatPercent((criteria?.coc_benchmark_max ?? 0.15) * 100)}
                </Badge>
              </div>
            </div>

            {/* Cap Rate Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cap Rate Range</Label>
              <div className="flex flex-col space-y-1">
                <Badge variant="outline" className="justify-center">
                  {formatPercent((criteria?.cap_minimum ?? 0.04) * 100)} - {formatPercent((criteria?.cap_benchmark_max ?? 0.12) * 100)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="analysis-card">
      <CardHeader className="border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <i className="fas fa-sliders-h text-primary mr-3"></i>
          Configure Investment Criteria
          <InfoTooltip
            title="Investment Criteria"
            content={[
              "Set your investment criteria to automatically evaluate properties. DealAnalyzer will compare each property against these criteria to determine if it meets your investment standards.",
              "• Purchase Price Range: Maximum price you're willing to pay for a property",
              "• COC Return Range: Cash-on-Cash return percentage (annual return on cash investment). Higher is better for passive income.",
              "• Cap Rate Range: Capitalization rate percentage (NOI / property value). Indicates the property's potential return.",
              "Properties that meet your criteria will be marked with a green indicator. You can adjust these criteria at any time to refine your search.",
            ]}
          />
        </h3>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price Range */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Purchase Price Range</Label>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="price_min" className="text-xs text-muted-foreground">Minimum Price</Label>
                  <Input
                    id="price_min"
                    type="number"
                    placeholder="0"
                    {...form.register('price_min', { valueAsNumber: true })}
                    data-testid="input-price-min"
                  />
                  {form.formState.errors.price_min && (
                    <p className="text-xs text-red-500">{form.formState.errors.price_min.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="price_max" className="text-xs text-muted-foreground">Maximum Price</Label>
                  <Input
                    id="price_max"
                    type="number"
                    placeholder="300000"
                    {...form.register('price_max', { valueAsNumber: true })}
                    data-testid="input-price-max"
                  />
                  {form.formState.errors.price_max && (
                    <p className="text-xs text-red-500">{form.formState.errors.price_max.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* COC Return Range */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">COC Return Range (%)</Label>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="coc_return_min" className="text-xs text-muted-foreground">Minimum COC Return</Label>
                  <Input
                    id="coc_return_min"
                    type="number"
                    step="0.1"
                    placeholder="8.0"
                    {...form.register('coc_return_min', { valueAsNumber: true })}
                    data-testid="input-coc-min"
                  />
                  {form.formState.errors.coc_return_min && (
                    <p className="text-xs text-red-500">{form.formState.errors.coc_return_min.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="coc_return_max" className="text-xs text-muted-foreground">Maximum COC Return</Label>
                  <Input
                    id="coc_return_max"
                    type="number"
                    step="0.1"
                    placeholder="15.0"
                    {...form.register('coc_return_max', { valueAsNumber: true })}
                    data-testid="input-coc-max"
                  />
                  {form.formState.errors.coc_return_max && (
                    <p className="text-xs text-red-500">{form.formState.errors.coc_return_max.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cap Rate Range */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Cap Rate Range (%)</Label>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="cap_rate_min" className="text-xs text-muted-foreground">Minimum Cap Rate</Label>
                  <Input
                    id="cap_rate_min"
                    type="number"
                    step="0.1"
                    placeholder="4.0"
                    {...form.register('cap_rate_min', { valueAsNumber: true })}
                    data-testid="input-cap-min"
                  />
                  {form.formState.errors.cap_rate_min && (
                    <p className="text-xs text-red-500">{form.formState.errors.cap_rate_min.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cap_rate_max" className="text-xs text-muted-foreground">Maximum Cap Rate</Label>
                  <Input
                    id="cap_rate_max"
                    type="number"
                    step="0.1"
                    placeholder="12.0"
                    {...form.register('cap_rate_max', { valueAsNumber: true })}
                    data-testid="input-cap-max"
                  />
                  {form.formState.errors.cap_rate_max && (
                    <p className="text-xs text-red-500">{form.formState.errors.cap_rate_max.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              data-testid="button-cancel-criteria"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateCriteriaMutation.isPending}
              data-testid="button-save-criteria"
            >
              {updateCriteriaMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Criteria
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}