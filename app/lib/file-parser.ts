// TypeScript file parser to replace Python backend for Vercel deployment
export interface ParsedProperty {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  property_type: string;
  purchase_price: number;
  monthly_rent: number;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  year_built: number;
  description: string;
  listing_url: string;
}

export function parseTextFile(content: string): ParsedProperty {
  const property: any = {
    address: "",
    city: "Unknown",
    state: "Unknown",
    zipCode: "00000",
    property_type: "single-family",
    purchase_price: 0,
    monthly_rent: 0,
    bedrooms: 0,
    bathrooms: 0,
    square_footage: 0,
    year_built: 0,
    description: "",
    listing_url: "N/A",
  };

  // Extract address
  const addressMatch = content.match(/\b(\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Place|Pl)[,\s]*[A-Z][a-z]+[\s,]*[A-Z][a-z]+)?/);
  if (addressMatch) {
    property.address = addressMatch[0].trim();
  }

  // Extract price - try multiple patterns with priority ordering
  // PRIORITY 1: Explicit "Purchase Price" label (highest priority - this is what we want)
  const purchasePricePattern = /(?:Purchase\s+Price|Purchase\s+Amount)[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/gi;
  
  // PRIORITY 2: Other explicit price labels (listing, asking, sale, etc.)
  const highPriorityPatterns = [
    /(?:List\s+Price|Listing\s+Price|Asking\s+Price|Sale\s+Price)[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/gi,
    /(?:Price|Cost)[:\s=]+\$?\s*([\d,]+(?:\.\d{2})?)/gi,
  ];
  
  // PRIORITY 2: Price with context keywords
  const mediumPriorityPatterns = [
    /(?:For\s+Sale|Listed\s+at|Asking)[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/gi,
    /([\d,]+(?:\.\d{2})?)\s*(?:dollars?|USD)\s*(?:for|purchase|sale|listing|price)/gi,
  ];
  
  // PRIORITY 3: Standalone dollar amounts (less reliable, might catch other prices)
  const lowPriorityPatterns = [
    /\$\s*([1-9]\d{2,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    /\$([1-9]\d{2,}(?:,\d{3})*)/g,
  ];
  
  let purchasePrice = 0;
  const purchasePriceMatches: number[] = [];
  const highPriorityPrices: number[] = [];
  const mediumPriorityPrices: number[] = [];
  const lowPriorityPrices: number[] = [];
  
  // First, look specifically for "Purchase Price" - this is what we want
  const purchaseMatches = content.matchAll(purchasePricePattern);
  for (const match of purchaseMatches) {
    const priceStr = match[1] || match[0];
    if (priceStr) {
      const cleanedPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
      if (cleanedPrice >= 10000 && cleanedPrice <= 50000000) {
        purchasePriceMatches.push(cleanedPrice);
      }
    }
  }
  
  // Collect other prices by priority
  for (const pattern of highPriorityPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const priceStr = match[1] || match[0];
      if (priceStr) {
        const cleanedPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
        if (cleanedPrice >= 10000 && cleanedPrice <= 50000000) {
          highPriorityPrices.push(cleanedPrice);
        }
      }
    }
  }
  
  for (const pattern of mediumPriorityPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const priceStr = match[1] || match[0];
      if (priceStr) {
        const cleanedPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
        if (cleanedPrice >= 10000 && cleanedPrice <= 50000000) {
          mediumPriorityPrices.push(cleanedPrice);
        }
      }
    }
  }
  
  for (const pattern of lowPriorityPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const priceStr = match[1] || match[0];
      if (priceStr) {
        const cleanedPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
        if (cleanedPrice >= 10000 && cleanedPrice <= 50000000) {
          lowPriorityPrices.push(cleanedPrice);
        }
      }
    }
  }
  
  // Select price based on priority:
  // 1. If "Purchase Price" explicitly labeled, use it (prefer smallest if multiple)
  // 2. Else if other high priority prices found, use the smallest (most likely purchase price, not appraisal)
  // 3. Else if medium priority, use the smallest
  // 4. Else use the smallest from low priority
  if (purchasePriceMatches.length > 0) {
    // Explicit "Purchase Price" label found - this is what we want
    purchasePrice = Math.min(...purchasePriceMatches);
    console.log(`Found ${purchasePriceMatches.length} explicit "Purchase Price" matches: [${purchasePriceMatches.map(p => `$${p.toLocaleString()}`).join(', ')}], using: $${purchasePrice.toLocaleString()}`);
  } else if (highPriorityPrices.length > 0) {
    // For other labeled prices, prefer the smaller one (purchase price is often less than appraised value)
    purchasePrice = Math.min(...highPriorityPrices);
    console.log(`Found ${highPriorityPrices.length} high-priority prices: [${highPriorityPrices.map(p => `$${p.toLocaleString()}`).join(', ')}], using: $${purchasePrice.toLocaleString()}`);
  } else if (mediumPriorityPrices.length > 0) {
    purchasePrice = Math.min(...mediumPriorityPrices);
    console.log(`Found ${mediumPriorityPrices.length} medium-priority prices: [${mediumPriorityPrices.map(p => `$${p.toLocaleString()}`).join(', ')}], using: $${purchasePrice.toLocaleString()}`);
  } else if (lowPriorityPrices.length > 0) {
    // For standalone prices, still prefer smaller ones but filter out obvious outliers
    const sortedPrices = [...lowPriorityPrices].sort((a, b) => a - b);
    // If there's a clear cluster (prices within 20% of each other), use the smallest
    // Otherwise, might be different types of prices, so be conservative
    const minPrice = sortedPrices[0];
    const maxPrice = sortedPrices[sortedPrices.length - 1];
    if (maxPrice / minPrice < 1.2) {
      // Prices are close together, use the smallest
      purchasePrice = minPrice;
    } else {
      // Prices are far apart, might be different metrics, use smallest reasonable one
      purchasePrice = minPrice;
    }
    console.log(`Found ${lowPriorityPrices.length} low-priority prices: [${lowPriorityPrices.map(p => `$${p.toLocaleString()}`).join(', ')}], using: $${purchasePrice.toLocaleString()}`);
  }
  
  property.purchase_price = purchasePrice;

  // Extract rent
  const rentMatch = content.match(/rent[:\$]?\s*\$?([0-9,]+)/i);
  if (rentMatch) {
    property.monthly_rent = parseInt(rentMatch[1].replace(/,/g, ""));
  }

  // Extract bedrooms
  const bedMatch = content.match(/(\d+)\s*(?:bed|bedroom|br|bedrooms)/i);
  if (bedMatch) {
    property.bedrooms = parseInt(bedMatch[1]);
  }

  // Extract bathrooms
  const bathMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:bath|bathroom|ba|bathrooms)/i);
  if (bathMatch) {
    property.bathrooms = parseFloat(bathMatch[1]);
  }

  // Extract square footage
  const sqftMatch = content.match(/(\d+)\s*(?:sq\.?\s*ft\.?|square\s*feet)/i);
  if (sqftMatch) {
    property.square_footage = parseInt(sqftMatch[1]);
  }

  property.description = content.substring(0, 500);

  return property;
}

// For CSV parsing, we'd need to implement CSV parsing logic
export async function parseCSVFile(content: string): Promise<ParsedProperty> {
  // Basic CSV parsing
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  if (lines.length < 2) {
    throw new Error("CSV file must have at least a header and one data row");
  }

  const dataRow = lines[1].split(',');
  const property: any = {
    address: "",
    city: "Unknown",
    state: "Unknown",
    zipCode: "00000",
    property_type: "single-family",
    purchase_price: 0,
    monthly_rent: 0,
    bedrooms: 0,
    bathrooms: 0,
    square_footage: 0,
    year_built: 0,
    description: "",
    listing_url: "N/A",
  };

  headers.forEach((header, index) => {
    const value = dataRow[index]?.trim();
    if (!value) return;

    const headerLower = header.toLowerCase();
    if (headerLower.includes('address')) property.address = value;
    if (headerLower.includes('city')) property.city = value;
    if (headerLower.includes('state')) property.state = value;
    if (headerLower.includes('zip')) property.zipCode = value;
    // Check for various price column names (price, purchase_price, listing_price, etc.)
    if (headerLower.includes('price') && !headerLower.includes('rent')) {
      property.purchase_price = parseFloat(value.replace(/[^0-9.]/g, ""));
    }
    // Check for various rent column names
    if (headerLower.includes('rent') || headerLower.includes('rental')) {
      property.monthly_rent = parseFloat(value.replace(/[^0-9.]/g, ""));
    }
    if (headerLower.includes('bed') && !headerLower.includes('bath')) property.bedrooms = parseInt(value);
    if (headerLower.includes('bath')) property.bathrooms = parseFloat(value);
    if (headerLower.includes('sqft') || headerLower.includes('square')) property.square_footage = parseInt(value);
    if (headerLower.includes('year')) property.year_built = parseInt(value);
  });

  return property;
}

export async function parseFileContent(
  fileContent: string,
  fileExtension: string,
  strMetrics?: any,
  monthlyExpenses?: any
): Promise<any> {
  let property: ParsedProperty;

  if (fileExtension === '.csv') {
    property = await parseCSVFile(fileContent);
  } else {
    property = parseTextFile(fileContent);
  }

  // Merge additional data if provided
  if (strMetrics) {
    if (strMetrics.adr) property.monthly_rent = strMetrics.adr * 30 * (strMetrics.occupancyRate || 0.65);
    // Note: occupancy_rate is stored in strMetrics, not in the property object
  }

  if (monthlyExpenses) {
    // Merge expense data if needed
  }

  return property;
}

