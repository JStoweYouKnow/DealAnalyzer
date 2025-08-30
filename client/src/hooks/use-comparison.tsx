import { useState, useCallback } from 'react';
import type { DealAnalysis } from "@shared/schema";

export function useComparison() {
  const [comparisonList, setComparisonList] = useState<DealAnalysis[]>([]);

  const addToComparison = useCallback((analysis: DealAnalysis) => {
    setComparisonList(prev => {
      // Check if already exists
      if (prev.some(item => item.propertyId === analysis.propertyId)) {
        return prev;
      }
      
      // Limit to 4 properties for comparison
      if (prev.length >= 4) {
        return [...prev.slice(1), analysis]; // Remove oldest, add newest
      }
      
      return [...prev, analysis];
    });
  }, []);

  const removeFromComparison = useCallback((propertyId: string) => {
    setComparisonList(prev => prev.filter(item => item.propertyId !== propertyId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonList([]);
  }, []);

  const isInComparison = useCallback((propertyId: string) => {
    return comparisonList.some(item => item.propertyId === propertyId);
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