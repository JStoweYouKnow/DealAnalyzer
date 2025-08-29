import { type Property, type DealAnalysis, type InsertProperty, type InsertDealAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Property methods
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Deal analysis methods
  getDealAnalysis(id: string): Promise<DealAnalysis | undefined>;
  createDealAnalysis(analysis: InsertDealAnalysis): Promise<DealAnalysis>;
  getAnalysisHistory(): Promise<DealAnalysis[]>;
}

export class MemStorage implements IStorage {
  private properties: Map<string, Property>;
  private dealAnalyses: Map<string, DealAnalysis>;

  constructor() {
    this.properties = new Map();
    this.dealAnalyses = new Map();
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
}

export const storage = new MemStorage();
