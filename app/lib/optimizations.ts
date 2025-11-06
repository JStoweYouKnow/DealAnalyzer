/**
 * Performance optimizations - compiled regex patterns and memoization
 */

// Pre-compile regex patterns for email parsing (reused frequently)
export const REGEX_PATTERNS = {
  address: /\b(\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Place|Pl)[,\s]*[A-Z][a-z]+[\s,]*[A-Z][a-z]+)?/,
  price: /\$\s*([0-9,]+)/,
  rent: /rent[:\$]?\s*\$?([0-9,]+)/i,
  bedrooms: /(\d+)\s*(?:bed|bedroom|br|bedrooms)/i,
  bathrooms: /(\d+(?:\.\d+)?)\s*(?:bath|bathroom|ba|bathrooms)/i,
  squareFeet: /(\d+)\s*(?:sq\.?\s*ft\.?|square\s*feet)/i,
} as const;

// Memoization cache for expensive calculations
const calculationCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Memoize expensive calculations
 */
export function memoize<T>(
  key: string,
  calculator: () => T,
  ttl: number = CACHE_TTL
): T {
  const cached = calculationCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.result as T;
  }

  const result = calculator();
  calculationCache.set(key, { result, timestamp: Date.now() });
  return result;
}

/**
 * Clear memoization cache
 */
export function clearMemoizationCache(): void {
  calculationCache.clear();
}

/**
 * Optimized string parsing - extract multiple values in one pass
 */
export function parseEmailContentOptimized(emailContent: string): any {
  const property: any = {
    address: "",
    city: "Unknown",
    state: "Unknown",
    zipCode: "00000",
    propertyType: "N/A",
    purchasePrice: 0,
    monthlyRent: 0,
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: 0,
    yearBuilt: 0,
    description: "",
    listingUrl: "N/A",
  };

  // Single pass through the content for all regex matches
  const addressMatch = REGEX_PATTERNS.address.exec(emailContent);
  if (addressMatch) property.address = addressMatch[0].trim();

  const priceMatch = REGEX_PATTERNS.price.exec(emailContent);
  if (priceMatch) {
    property.purchasePrice = parseInt(priceMatch[1].replace(/,/g, ""), 10);
  }

  const rentMatch = REGEX_PATTERNS.rent.exec(emailContent);
  if (rentMatch) {
    property.monthlyRent = parseInt(rentMatch[1].replace(/,/g, ""), 10);
  }

  const bedMatch = REGEX_PATTERNS.bedrooms.exec(emailContent);
  if (bedMatch) {
    property.bedrooms = parseInt(bedMatch[1], 10);
  }

  const bathMatch = REGEX_PATTERNS.bathrooms.exec(emailContent);
  if (bathMatch) {
    property.bathrooms = parseFloat(bathMatch[1]);
  }

  const sqftMatch = REGEX_PATTERNS.squareFeet.exec(emailContent);
  if (sqftMatch) {
    property.squareFootage = parseInt(sqftMatch[1], 10);
  }

  return property;
}

/**
 * Debounce function for expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for rate-limited operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

