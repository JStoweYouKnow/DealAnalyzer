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

  // Extract price - try multiple patterns (enhanced for PDF and text files)
  // Try more flexible patterns that work with PDF text extraction
  const pricePatterns = [
    // Explicit price labels (case-insensitive, flexible spacing)
    /(?:Price|Purchase\s+Price|Listing\s+Price|Asking\s+Price|List\s+Price|Sale\s+Price|Total\s+Price)[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/gi,
    // Price after ":" or "=" with flexible spacing
    /(?:Price|Cost|Asking|List|Sale)[:\s=]+\$?\s*([\d,]+(?:\.\d{2})?)/gi,
    // Standalone dollar amounts (prefer larger numbers that look like prices)
    /\$\s*([1-9]\d{2,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    // Numbers followed by price-related keywords
    /([\d,]+(?:\.\d{2})?)\s*(?:dollars?|USD|price|asking|list)/gi,
    // Simple dollar amount pattern (but require at least 3 digits)
    /\$([1-9]\d{2,}(?:,\d{3})*)/g,
  ];
  
  let purchasePrice = 0;
  const foundPrices: number[] = [];
  
  // Collect all potential prices
  for (const pattern of pricePatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const priceStr = match[1] || match[0];
      if (priceStr) {
        const cleanedPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
        // Filter out unrealistic prices (too small or too large)
        if (cleanedPrice >= 10000 && cleanedPrice <= 50000000) {
          foundPrices.push(cleanedPrice);
        }
      }
    }
  }
  
  // Use the largest valid price found (typically the listing price)
  if (foundPrices.length > 0) {
    purchasePrice = Math.max(...foundPrices);
    console.log(`Found ${foundPrices.length} potential prices, using: $${purchasePrice.toLocaleString()}`);
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

