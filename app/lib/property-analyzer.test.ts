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
      // Calculate annual operating expenses (excluding mortgage/debt service)
      // Using default estimates from the implementation
      const purchasePrice = result.property.purchasePrice;
      const monthlyRent = result.property.monthlyRent;
      const estimatedPropertyTax = purchasePrice * 0.012 / 12; // 1.2% annually default
      const estimatedInsurance = 100.0; // Default $100/month
      const estimatedVacancy = monthlyRent * 0.05; // 5% of gross rents
      const estimatedPropertyManagement = monthlyRent * 0.10; // 10% of gross rents default
      const estimatedMaintenanceReserve = monthlyRent * 0.05; // 5% maintenance reserve percentage
      const providedUtilities = 0;
      const providedCleaning = 0;
      const providedSupplies = 0;
      const providedOther = 0;
      
      const annualOperatingExpenses = (
        estimatedPropertyTax * 12 +
        estimatedInsurance * 12 +
        estimatedVacancy * 12 +
        estimatedMaintenanceReserve * 12 +
        estimatedPropertyManagement * 12 +
        providedUtilities * 12 +
        providedCleaning * 12 +
        providedSupplies * 12 +
        providedOther * 12
      );
      
      const netOperatingIncome = (monthlyRent * 12) - annualOperatingExpenses;
      const expectedCapRate = purchasePrice > 0 ? netOperatingIncome / purchasePrice : 0;
      
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

