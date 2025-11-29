// Shared types matching web app schema
export interface EmailDeal {
  id: string;
  subject: string;
  sender: string;
  receivedDate: Date | string;
  emailContent: string;
  status: 'new' | 'analyzed' | 'archived';
  createdAt: Date | string;
  updatedAt: Date | string;
  propertyId?: string;
}

export interface DealAnalysis {
  propertyId: string;
  address: string;
  purchasePrice: number;
  monthlyRent: number;
  cashOnCashReturn: number;
  capRate: number;
  netOperatingIncome: number;
  totalMonthlyExpenses: number;
  cashFlow: number;
  meetsCriteria: boolean;
  [key: string]: any;
}

export interface AnalyzePropertyResponse {
  success: boolean;
  analysis: DealAnalysis;
  message?: string;
}

export interface CriteriaResponse {
  minCashOnCashReturn: number;
  minCapRate: number;
  maxVacancyRate: number;
  minCashFlow: number;
  [key: string]: any;
}

export interface FundingSource {
  type: 'conventional' | 'fha' | 'va' | 'cash' | 'hard_money' | 'other';
  downPaymentPercent?: number;
  interestRate?: number;
  loanTermYears?: number;
  points?: number;
  closingCosts?: number;
}

export interface MortgageValues {
  loanAmount: number;
  loanTermYears: number;
  monthlyPayment: number;
}

export interface MarketData {
  city: string;
  state: string;
  medianPrice: number;
  medianRent: number;
  capRate: number;
  marketScore: number;
  trends?: {
    priceChange: number;
    rentChange: number;
  };
}

export type RootStackParamList = {
  MainTabs: undefined;
  DealDetail: { dealId: string };
  Analyze: { dealId?: string; initialData?: any };
  Comparison: undefined;
  Account: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Neighborhood: undefined;
  Preferences: undefined;
  Notifications: undefined;
  EmailSettings: undefined;
  HelpSupport: undefined;
  TermsPrivacy: undefined;
  Subscription: undefined;
};

export type TabParamList = {
  Home: undefined;
  Deals: undefined;
  Market: undefined;
  Search: undefined;
  Account: undefined;
};

