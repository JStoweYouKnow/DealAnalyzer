import { type Property, type DealAnalysis, type InsertProperty, type InsertDealAnalysis, type PropertyComparison, type EmailDeal } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Property methods
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Deal analysis methods
  getDealAnalysis(id: string): Promise<DealAnalysis | undefined>;
  createDealAnalysis(analysis: InsertDealAnalysis): Promise<DealAnalysis>;
  updateDealAnalysis(id: string, analysis: InsertDealAnalysis): Promise<DealAnalysis | undefined>;
  findAnalysisByPropertyAddress(address: string): Promise<DealAnalysis | undefined>;
  getAnalysisHistory(): Promise<DealAnalysis[]>;
  
  // Email deal methods
  getEmailDeals(): Promise<EmailDeal[]>;
  getEmailDeal(id: string): Promise<EmailDeal | undefined>;
  createEmailDeal(deal: Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDeal>;
  updateEmailDeal(id: string, updates: Partial<Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>>): Promise<EmailDeal | undefined>;
  deleteEmailDeal(id: string): Promise<boolean>;
  findEmailDealByContentHash(contentHash: string): Promise<EmailDeal | undefined>;
  
  // Comparison methods
  createComparison(propertyIds: string[], name?: string): Promise<PropertyComparison | null>;
  getComparison(id: string): Promise<PropertyComparison | undefined>;
  getComparisons(): Promise<PropertyComparison[]>;
  deleteComparison(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private properties: Map<string, Property>;
  private dealAnalyses: Map<string, DealAnalysis>;
  private comparisons: Map<string, PropertyComparison>;
  private emailDeals: Map<string, EmailDeal>;

  constructor() {
    this.properties = new Map();
    this.dealAnalyses = new Map();
    this.comparisons = new Map();
    this.emailDeals = new Map();
  }

  async getProperty(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = randomUUID();
    const property: Property = { ...insertProperty, id };
    this.properties.set(id, property);
    return property;
  }

  async getDealAnalysis(id: string): Promise<DealAnalysis | undefined> {
    return this.dealAnalyses.get(id);
  }

  async createDealAnalysis(insertAnalysis: InsertDealAnalysis): Promise<DealAnalysis> {
    const id = randomUUID();
    const analysis: DealAnalysis = { 
      ...insertAnalysis, 
      id,
      analysisDate: new Date()
    };
    this.dealAnalyses.set(id, analysis);
    return analysis;
  }

  async updateDealAnalysis(id: string, insertAnalysis: InsertDealAnalysis): Promise<DealAnalysis | undefined> {
    const existingAnalysis = this.dealAnalyses.get(id);
    if (!existingAnalysis) {
      return undefined;
    }
    
    const updatedAnalysis: DealAnalysis = { 
      ...insertAnalysis, 
      id: existingAnalysis.id, // Keep the same ID
      analysisDate: new Date() // Update the timestamp
    };
    this.dealAnalyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  }

  async findAnalysisByPropertyAddress(address: string): Promise<DealAnalysis | undefined> {
    const analyses = Array.from(this.dealAnalyses.values());
    return analyses.find(analysis => analysis.property.address === address);
  }

  async getAnalysisHistory(): Promise<DealAnalysis[]> {
    return Array.from(this.dealAnalyses.values())
      .sort((a, b) => (b.analysisDate?.getTime() || 0) - (a.analysisDate?.getTime() || 0));
  }

  async createComparison(propertyIds: string[], name?: string): Promise<PropertyComparison | null> {
    // Get the deal analyses for the provided property IDs
    const properties: DealAnalysis[] = [];
    for (const propertyId of propertyIds) {
      const analysis = this.dealAnalyses.get(propertyId);
      if (analysis) {
        properties.push(analysis);
      }
    }

    if (properties.length < 2) {
      return null; // Need at least 2 properties to compare
    }

    const id = randomUUID();
    const comparison: PropertyComparison = {
      id,
      name: name || `Comparison ${new Date().toLocaleDateString()}`,
      properties,
      createdAt: new Date()
    };

    this.comparisons.set(id, comparison);
    return comparison;
  }

  async getComparison(id: string): Promise<PropertyComparison | undefined> {
    return this.comparisons.get(id);
  }

  async getComparisons(): Promise<PropertyComparison[]> {
    return Array.from(this.comparisons.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async deleteComparison(id: string): Promise<boolean> {
    return this.comparisons.delete(id);
  }

  // Email deal methods implementation
  async getEmailDeals(): Promise<EmailDeal[]> {
    return Array.from(this.emailDeals.values())
      .sort((a, b) => b.receivedDate.getTime() - a.receivedDate.getTime());
  }

  async getEmailDeal(id: string): Promise<EmailDeal | undefined> {
    return this.emailDeals.get(id);
  }

  async createEmailDeal(deal: Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDeal> {
    const id = randomUUID();
    const now = new Date();
    const emailDeal: EmailDeal = {
      ...deal,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.emailDeals.set(id, emailDeal);
    return emailDeal;
  }

  async updateEmailDeal(id: string, updates: Partial<Omit<EmailDeal, 'id' | 'createdAt' | 'updatedAt'>>): Promise<EmailDeal | undefined> {
    const existingDeal = this.emailDeals.get(id);
    if (!existingDeal) {
      return undefined;
    }

    const updatedDeal: EmailDeal = {
      ...existingDeal,
      ...updates,
      id: existingDeal.id, // Keep the same ID
      createdAt: existingDeal.createdAt, // Keep original creation time
      updatedAt: new Date(), // Update the timestamp
    };
    this.emailDeals.set(id, updatedDeal);
    return updatedDeal;
  }

  async deleteEmailDeal(id: string): Promise<boolean> {
    return this.emailDeals.delete(id);
  }

  async findEmailDealByContentHash(contentHash: string): Promise<EmailDeal | undefined> {
    const deals = Array.from(this.emailDeals.values());
    return deals.find(deal => deal.contentHash === contentHash);
  }
}

export const storage = new MemStorage();
