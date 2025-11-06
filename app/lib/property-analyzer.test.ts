import { analyzeProperty } from './property-analyzer';

describe('analyzeProperty', () => {
  const baseProperty = {
    address: '123 Main St',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    propertyType: 'single-family',
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1500,
    yearBuilt: 2020,
    purchasePrice: 300000,
    monthlyRent: 2500,
    description: 'Test property',
    listingUrl: '',
    fundingSource: 'conventional',
  };

  it('should calculate cash-on-cash return correctly', () => {
    const result = analyzeProperty(baseProperty);
    
    expect(result).toBeDefined();
    expect(result.cocReturn).toBeGreaterThan(0);
    expect(result.cashFlow).toBeDefined();
    expect(result.totalCashNeeded).toBeGreaterThan(0);
  });

  it('should calculate cap rate correctly', () => {
    const result = analyzeProperty(baseProperty);
    
    expect(result.capRate).toBeDefined();
    if (result.property?.purchasePrice && result.property?.monthlyRent) {
      const expectedCapRate = (result.property.monthlyRent * 12) / result.property.purchasePrice;
      expect(Math.abs(result.capRate - expectedCapRate)).toBeLessThan(0.01);
    }
  });

  it('should determine if property meets 1% rule', () => {
    const result = analyzeProperty(baseProperty);
    
    expect(result.passes1PercentRule).toBeDefined();
    expect(typeof result.passes1PercentRule).toBe('boolean');
    
    // If monthly rent is at least 1% of purchase price, should pass
    if (baseProperty.monthlyRent && baseProperty.purchasePrice) {
      const onePercent = baseProperty.purchasePrice * 0.01;
      expect(result.passes1PercentRule).toBe(baseProperty.monthlyRent >= onePercent);
    }
  });

  it('should handle missing optional fields', () => {
    const minimalProperty = {
      ...baseProperty,
      bedrooms: undefined,
      bathrooms: undefined,
      squareFootage: undefined,
    };

    const result = analyzeProperty(minimalProperty);
    
    expect(result).toBeDefined();
    expect(result.cocReturn).toBeDefined();
  });

  it('should calculate total cash needed correctly', () => {
    const result = analyzeProperty(baseProperty);
    
    expect(result.totalCashNeeded).toBeGreaterThan(0);
    // Total cash needed should include down payment and closing costs
    expect(result.totalCashNeeded).toBeGreaterThanOrEqual(result.calculatedDownpayment || 0);
  });
});

