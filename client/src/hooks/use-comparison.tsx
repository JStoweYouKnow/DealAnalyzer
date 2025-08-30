import { useState, useCallback } from 'react';
import type { DealAnalysis } from "@shared/schema";

export function useComparison() {
  const [comparisonList, setComparisonList] = useState<DealAnalysis[]>([]);

  const addToComparison = useCallback((analysis: DealAnalysis) => {
    console.log('Adding to comparison:', analysis.propertyId, analysis.property.address);
    setComparisonList(prev => {
      console.log('Current comparison list:', prev.map(p => p.propertyId));
      // Check if already exists
      if (prev.some(item => item.propertyId === analysis.propertyId)) {
        console.log('Property already in comparison:', analysis.propertyId);
        return prev;
      }
      
      // Limit to 4 properties for comparison
      if (prev.length >= 4) {
        return [...prev.slice(1), analysis]; // Remove oldest, add newest
      }
      
      const updated = [...prev, analysis];
      console.log('Updated comparison list:', updated.map(p => p.propertyId));
      return updated;
    });
  }, []);

  const removeFromComparison = useCallback((propertyId: string) => {
    setComparisonList(prev => prev.filter(item => item.propertyId !== propertyId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonList([]);
  }, []);

  const isInComparison = useCallback((propertyId: string) => {
    const result = comparisonList.some(item => item.propertyId === propertyId);
    console.log('Checking if in comparison:', propertyId, 'result:', result, 'comparison list:', comparisonList.map(p => p.propertyId));
    return result;
  }, [comparisonList]);

  return {
    comparisonList,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    comparisonCount: comparisonList.length
  };
}