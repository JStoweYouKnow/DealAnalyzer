// Optimized email content parsing with pre-compiled regex patterns
// This file provides optimized parsing functions for better performance

/**
 * Parse email content to extract property details
 * Optimized version using pre-compiled regex patterns
 */
export function parseEmailContentOptimized(emailContent: string): any {
  const propertyData: any = {};

  // Pre-compiled regex patterns for common property fields
  const patterns = {
    address: /(?:address|location|property)[:\s]+([^\n,]+(?:,\s*[A-Z]{2})?)/i,
    price: /(?:price|purchase|cost|asking)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    rent: /(?:rent|rental|monthly\s*rent)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    bedrooms: /(?:bed|bedroom|br|beds)[:\s]*(\d+)/i,
    bathrooms: /(?:bath|bathroom|ba|baths)[:\s]*(\d+(?:\.\d+)?)/i,
    sqft: /(?:sq\s*ft|square\s*feet|sqft|sq\.?\s*ft\.?)[:\s]*([\d,]+)/i,
    year: /(?:year\s*built|built|constructed)[:\s]*(\d{4})/i,
    city: /(?:city)[:\s]*([A-Za-z\s]+)/i,
    state: /(?:state)[:\s]*([A-Z]{2})/i,
    zip: /(?:zip|zipcode|postal)[:\s]*(\d{5}(?:-\d{4})?)/i,
  };

  // Extract address
  const addressMatch = emailContent.match(patterns.address);
  if (addressMatch) {
    propertyData.address = addressMatch[1].trim();
  }

  // Extract price
  const priceMatch = emailContent.match(patterns.price);
  if (priceMatch) {
    propertyData.purchasePrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    propertyData.purchase_price = propertyData.purchasePrice;
  }

  // Extract rent
  const rentMatch = emailContent.match(patterns.rent);
  if (rentMatch) {
    propertyData.monthlyRent = parseFloat(rentMatch[1].replace(/,/g, ''));
    propertyData.monthly_rent = propertyData.monthlyRent;
  }

  // Extract bedrooms
  const bedroomsMatch = emailContent.match(patterns.bedrooms);
  if (bedroomsMatch) {
    propertyData.bedrooms = parseInt(bedroomsMatch[1], 10);
  }

  // Extract bathrooms
  const bathroomsMatch = emailContent.match(patterns.bathrooms);
  if (bathroomsMatch) {
    propertyData.bathrooms = parseFloat(bathroomsMatch[1]);
  }

  // Extract square footage
  const sqftMatch = emailContent.match(patterns.sqft);
  if (sqftMatch) {
    propertyData.squareFootage = parseInt(sqftMatch[1].replace(/,/g, ''), 10);
    propertyData.square_footage = propertyData.squareFootage;
  }

  // Extract year built
  const yearMatch = emailContent.match(patterns.year);
  if (yearMatch) {
    propertyData.yearBuilt = parseInt(yearMatch[1], 10);
    propertyData.year_built = propertyData.yearBuilt;
  }

  // Extract city
  const cityMatch = emailContent.match(patterns.city);
  if (cityMatch) {
    propertyData.city = cityMatch[1].trim();
  }

  // Extract state
  const stateMatch = emailContent.match(patterns.state);
  if (stateMatch) {
    propertyData.state = stateMatch[1].trim();
  }

  // Extract zip code
  const zipMatch = emailContent.match(patterns.zip);
  if (zipMatch) {
    propertyData.zipCode = zipMatch[1];
    propertyData.zip_code = propertyData.zipCode;
  }

  return propertyData;
}


