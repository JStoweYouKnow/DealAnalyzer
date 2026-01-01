// Property exports
// Property exports
export * from "./property";
export { 
  fundingSourceSchema, 
  FUNDING_SOURCE_DOWN_PAYMENTS, 
  propertySchema, 
  mortgageValuesSchema, 
  insertPropertySchema 
} from "./property";
export type { 
  Property, 
  FundingSource, 
  MortgageValues, 
  InsertProperty 
} from "./property";

// Analysis exports
export * from "./analysis";
export type { DealAnalysis, AIAnalysis } from "./analysis";

// Email exports
export * from "./email";
export type { EmailDeal } from "./email";

// Market exports
export * from "./market";
export type {
  NeighborhoodTrend,
  ComparableSale,
  MarketHeatMapData,
  SavedFilter,
  NaturalLanguageSearch,
  SmartPropertyRecommendation,
  RentPricingRecommendation,
  InvestmentTimingAdvice,
  AnalysisTemplate,
  InsertNeighborhoodTrend,
  InsertComparableSale,
  InsertMarketHeatMapData,
  InsertSavedFilter,
  InsertNaturalLanguageSearch,
  InsertSmartPropertyRecommendation,
  InsertRentPricingRecommendation,
  InsertInvestmentTimingAdvice
} from "./market";

// Export/Import exports
export * from "./export";
