// Property exports
// Property exports
export * from "./property.js";
export {
  fundingSourceSchema,
  FUNDING_SOURCE_DOWN_PAYMENTS,
  propertySchema,
  mortgageValuesSchema,
  insertPropertySchema
} from "./property.js";
export type {
  Property,
  FundingSource,
  MortgageValues,
  InsertProperty
} from "./property.js";

// Analysis exports
export * from "./analysis.js";
export type {
  DealAnalysis,
  AIAnalysis,
  AnalyzePropertyResponse,
  CriteriaResponse,
  ConfigurableCriteria,
  PropertyComparison,
  PropertyClassification,
  PhotoAnalysis,
  InsertDealAnalysis,
  InsertPropertyClassification,
  InsertPhotoAnalysis
} from "./analysis.js";

// Email exports
export * from "./email.js";
export type { EmailDeal, EmailMonitoringResponse } from "./email.js";

// Market exports
export * from "./market.js";
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
  InsertInvestmentTimingAdvice,
  InsertAnalysisTemplate
} from "./market.js";

// Export/Import exports
export * from "./export.js";
export type {
  ApiIntegration,
  InsertApiIntegration
} from "./export.js";
