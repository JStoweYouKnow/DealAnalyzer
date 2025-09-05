// Note: web_search will be imported as needed

interface RentalProperty {
  address: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  source: string;
}

interface RentalCompsResult {
  averageRent: number;
  properties: RentalProperty[];
  searchArea: string;
  confidence: 'high' | 'medium' | 'low';
}

export class RentalCompsService {
  
  async searchRentalComps(
    address: string,
    bedrooms: number,
    bathrooms: number,
    squareFootage?: number
  ): Promise<RentalCompsResult> {
    try {
      // Extract city and state from address for search
      const cityState = this.extractCityState(address);
      
      // Build search queries for rental properties
      const queries = this.buildSearchQueries(cityState, bedrooms, bathrooms, squareFootage);
      
      const allProperties: RentalProperty[] = [];
      
      // Search multiple sources - placeholder for web search integration
      // This will be integrated with the web search functionality
      console.log(`Would search for rental comps with queries:`, queries);
      
      // For now, return mock data structure
      // This will be replaced with actual web search calls
      const mockProperties = this.generateMockRentalData(cityState, bedrooms, bathrooms, squareFootage);
      allProperties.push(...mockProperties);
      
      // Filter and deduplicate properties
      const filteredProperties = this.filterAndDeduplicateProperties(
        allProperties, 
        bedrooms, 
        bathrooms, 
        squareFootage
      );
      
      // Calculate average rent
      const averageRent = this.calculateAverageRent(filteredProperties);
      
      // Determine confidence level
      const confidence = this.assessConfidence(filteredProperties);
      
      return {
        averageRent,
        properties: filteredProperties.slice(0, 10), // Return top 10 for reference
        searchArea: cityState,
        confidence
      };
      
    } catch (error) {
      console.error('Error searching rental comps:', error);
      throw new Error('Failed to search rental comparables');
    }
  }
  
  private extractCityState(address: string): string {
    // Extract city, state from address like "123 Main St, Columbus, OH 43215"
    const match = address.match(/,\s*([^,]+),\s*([A-Z]{2})/);
    if (match) {
      return `${match[1]}, ${match[2]}`;
    }
    
    // Fallback - try to extract just city
    const cityMatch = address.match(/,\s*([^,]+)/);
    if (cityMatch) {
      return cityMatch[1];
    }
    
    return address;
  }
  
  private buildSearchQueries(
    cityState: string, 
    bedrooms: number, 
    bathrooms: number,
    squareFootage?: number
  ): string[] {
    const queries = [
      `${bedrooms} bedroom ${bathrooms} bathroom rental ${cityState} rent prices 2024`,
      `${bedrooms}BR ${bathrooms}BA apartment rent ${cityState} current market`,
      `rental comps ${bedrooms} bed ${cityState} average rent`,
    ];
    
    if (squareFootage && squareFootage > 0) {
      queries.push(`${squareFootage} sqft ${bedrooms} bedroom rental ${cityState} rent`);
    }
    
    return queries;
  }
  
  private extractRentalData(searchContent: string, targetBedrooms: number, targetBathrooms: number): RentalProperty[] {
    const properties: RentalProperty[] = [];
    
    // Multiple regex patterns to extract rental prices and property details
    const rentalPatterns = [
      // Format: "$1,200/month 2 bed 1 bath"
      /\$([0-9,]+)\/month.*?(\d+)\s*bed.*?(\d+(?:\.\d+)?)\s*bath/gi,
      // Format: "$1200 rent 2BR/1BA"
      /\$([0-9,]+).*?rent.*?(\d+)BR.*?(\d+(?:\.\d+)?)BA/gi,
      // Format: "Rent: $1,200 - 2 bedroom, 1 bathroom"
      /rent[:\s]*\$([0-9,]+).*?(\d+)\s*bedroom.*?(\d+(?:\.\d+)?)\s*bathroom/gi,
      // Format: "2 bed 1 bath $1200"
      /(\d+)\s*bed.*?(\d+(?:\.\d+)?)\s*bath.*?\$([0-9,]+)/gi,
    ];
    
    for (const pattern of rentalPatterns) {
      let match;
      while ((match = pattern.exec(searchContent)) !== null) {
        try {
          let rent, bedrooms, bathrooms;
          
          if (pattern.source.includes('month')) {
            // Pattern includes rent first
            rent = parseInt(match[1].replace(/,/g, ''));
            bedrooms = parseInt(match[2]);
            bathrooms = parseFloat(match[3]);
          } else if (pattern.source.includes('bed.*bath.*\\$')) {
            // Pattern has bed/bath first, then rent
            bedrooms = parseInt(match[1]);
            bathrooms = parseFloat(match[2]);
            rent = parseInt(match[3].replace(/,/g, ''));
          } else {
            // Standard pattern: rent, bed, bath
            rent = parseInt(match[1].replace(/,/g, ''));
            bedrooms = parseInt(match[2]);
            bathrooms = parseFloat(match[3]);
          }
          
          // Validate the extracted data
          if (rent > 500 && rent < 10000 && 
              bedrooms > 0 && bedrooms <= 10 && 
              bathrooms > 0 && bathrooms <= 10) {
            
            properties.push({
              address: 'Comparable Property',
              rent,
              bedrooms,
              bathrooms,
              source: 'web_search'
            });
          }
        } catch (error) {
          // Skip invalid matches
          continue;
        }
      }
    }
    
    return properties;
  }
  
  private filterAndDeduplicateProperties(
    properties: RentalProperty[], 
    targetBedrooms: number, 
    targetBathrooms: number,
    targetSquareFootage?: number
  ): RentalProperty[] {
    
    // Filter properties that are close matches
    const filtered = properties.filter(prop => {
      const bedroomMatch = Math.abs(prop.bedrooms - targetBedrooms) <= 1;
      const bathroomMatch = Math.abs(prop.bathrooms - targetBathrooms) <= 0.5;
      const reasonableRent = prop.rent >= 300 && prop.rent <= 8000;
      
      return bedroomMatch && bathroomMatch && reasonableRent;
    });
    
    // Deduplicate by rent amount (remove exact duplicates)
    const seen = new Set();
    const deduplicated = filtered.filter(prop => {
      const key = `${prop.rent}-${prop.bedrooms}-${prop.bathrooms}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    // Sort by how close they match target criteria
    return deduplicated.sort((a, b) => {
      const aScore = this.calculateMatchScore(a, targetBedrooms, targetBathrooms, targetSquareFootage);
      const bScore = this.calculateMatchScore(b, targetBedrooms, targetBathrooms, targetSquareFootage);
      return bScore - aScore;
    });
  }
  
  private calculateMatchScore(
    property: RentalProperty, 
    targetBedrooms: number, 
    targetBathrooms: number,
    targetSquareFootage?: number
  ): number {
    let score = 0;
    
    // Bedroom match scoring
    const bedroomDiff = Math.abs(property.bedrooms - targetBedrooms);
    if (bedroomDiff === 0) score += 40;
    else if (bedroomDiff === 1) score += 20;
    
    // Bathroom match scoring  
    const bathroomDiff = Math.abs(property.bathrooms - targetBathrooms);
    if (bathroomDiff === 0) score += 30;
    else if (bathroomDiff <= 0.5) score += 15;
    
    // Square footage match (if available)
    if (targetSquareFootage && property.squareFootage) {
      const sqftDiff = Math.abs(property.squareFootage - targetSquareFootage);
      const sqftPercentDiff = sqftDiff / targetSquareFootage;
      if (sqftPercentDiff <= 0.2) score += 20;
      else if (sqftPercentDiff <= 0.4) score += 10;
    }
    
    return score;
  }
  
  private calculateAverageRent(properties: RentalProperty[]): number {
    if (properties.length === 0) return 0;
    
    // Remove outliers (top and bottom 10% if we have enough data)
    if (properties.length >= 5) {
      const sorted = [...properties].sort((a, b) => a.rent - b.rent);
      const removeCount = Math.floor(properties.length * 0.1);
      const trimmed = sorted.slice(removeCount, -removeCount || undefined);
      
      const total = trimmed.reduce((sum, prop) => sum + prop.rent, 0);
      return Math.round(total / trimmed.length);
    }
    
    // For smaller datasets, use simple average
    const total = properties.reduce((sum, prop) => sum + prop.rent, 0);
    return Math.round(total / properties.length);
  }
  
  private assessConfidence(properties: RentalProperty[]): 'high' | 'medium' | 'low' {
    if (properties.length >= 8) return 'high';
    if (properties.length >= 4) return 'medium';
    return 'low';
  }
  
  private generateMockRentalData(cityState: string, bedrooms: number, bathrooms: number, squareFootage?: number): RentalProperty[] {
    // Generate some realistic rental data for testing
    // This will be replaced with actual web search results
    const baseRent = bedrooms * 400 + bathrooms * 200 + (squareFootage ? squareFootage * 0.8 : 0);
    const variance = baseRent * 0.3;
    
    const properties: RentalProperty[] = [];
    for (let i = 0; i < 6; i++) {
      const rent = Math.round(baseRent + (Math.random() - 0.5) * variance);
      properties.push({
        address: `Sample Property ${i + 1}, ${cityState}`,
        rent,
        bedrooms: bedrooms + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0),
        bathrooms: bathrooms + (Math.random() > 0.8 ? 0.5 : 0),
        squareFootage: squareFootage ? squareFootage + Math.round((Math.random() - 0.5) * 200) : undefined,
        source: 'mock_data'
      });
    }
    
    return properties;
  }
}

export const rentalCompsService = new RentalCompsService();