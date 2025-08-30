import { type Property, type DealAnalysis, type InsertProperty, type InsertDealAnalysis, type PropertyComparison } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Property methods
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Deal analysis methods
  getDealAnalysis(id: string): Promise<DealAnalysis | undefined>;
  createDealAnalysis(analysis: InsertDealAnalysis): Promise<DealAnalysis>;
  getAnalysisHistory(): Promise<DealAnalysis[]>;
  
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

  constructor() {
    this.properties = new Map();
    this.dealAnalyses = new Map();
    this.comparisons = new Map();
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
}

export const storage = new MemStorage();
