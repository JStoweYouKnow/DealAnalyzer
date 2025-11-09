# URL Property Extraction Feature

## Overview

The property analyzer now supports **automatic property data extraction from listing URLs**! This feature uses OpenAI GPT-4o-mini to intelligently extract property details from real estate listing websites.

## How It Works

### Supported Websites
- **Zillow** - zillow.com
- **Redfin** - redfin.com
- **Realtor.com** - realtor.com
- **Trulia** - trulia.com
- **And many others** - Works with most property listing sites

### What It Extracts

The AI automatically identifies and extracts:

**Property Details:**
- Full address (street, city, state, zip code)
- Purchase/asking price
- Bedrooms & bathrooms
- Square footage (living area)
- Lot size
- Year built
- Property type (single-family, condo, townhouse, etc.)

**Financial Data (if available):**
- Monthly rent estimates
- HOA fees
- Property taxes
- Other listing-specific details

## Usage

### Step 1: Get a Property Listing URL
Copy the URL from any property listing website. For example:
```
https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345678_zpid/
```

### Step 2: Paste URL in Analyzer
1. Navigate to the home page
2. Find the "Extract from Listing URL" section
3. Paste your URL into the input field
4. Click the "Extract" button

### Step 3: Review and Analyze
- The system will fetch the listing page
- OpenAI extracts the property data
- A JSON file is automatically created with the extracted data
- Form fields are auto-populated where possible
- Review the data and add any additional details
- Click "Analyze Property" to run your investment analysis

## Technical Details

### API Endpoint
**POST** `/api/extract-property-url`

**Request:**
```json
{
  "url": "https://www.zillow.com/homedetails/..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "zipCode": "78701",
    "purchasePrice": 450000,
    "bedrooms": 3,
    "bathrooms": 2,
    "squareFootage": 1800,
    "lotSize": 7000,
    "yearBuilt": 2015,
    "propertyType": "single-family",
    "monthlyRent": 2500,
    "hoa": 150,
    "propertyTaxes": 6000,
    "description": "Beautiful 3BR/2BA home...",
    "listingUrl": "https://...",
    "source": "zillow"
  }
}
```

### Serverless Compatible

✅ **Works in serverless environments (Vercel, Netlify, etc.)**
- No heavy dependencies
- Uses standard fetch API
- Leverages OpenAI's API for parsing
- No browser automation required

### Cost

**Very affordable:**
- Uses GPT-4o-mini model (~$0.00015 per request)
- Each extraction costs less than 1 cent
- No additional paid APIs required

### Reliability

**Handles edge cases:**
- Invalid URLs
- Websites that block requests
- Missing or incomplete data
- Network errors
- Graceful fallbacks to manual file upload

## Benefits

### For Users
- ⚡ **Fast** - Extract data in seconds instead of manual entry
- 🎯 **Accurate** - AI understands context and extracts relevant data
- 🔄 **Flexible** - Works with most real estate listing sites
- 💰 **Free** - Uses your existing OpenAI API key

### For Developers
- 🚀 **Serverless-friendly** - No complex scraping infrastructure
- 🛠️ **Maintainable** - AI adapts to website changes
- 📦 **Simple** - Just fetch HTML and call OpenAI API
- 🔒 **Safe** - No terms of service violations

## Limitations

1. **Rate Limits** - Some websites may rate-limit requests
2. **Dynamic Content** - Client-side rendered content may not be accessible
3. **Access Restrictions** - Login-required listings won't work
4. **Data Accuracy** - AI extracts what's visible, may miss some details

## Fallback Options

If URL extraction fails, you can always:
1. **Upload a file** - PDF, CSV, TXT, Excel, or JSON
2. **Manually enter data** - Use the rental metrics and expense fields
3. **Try a different listing** - Some sites work better than others

## Example Workflow

```typescript
// 1. User pastes Zillow URL
const url = "https://www.zillow.com/homedetails/...";

// 2. System fetches and extracts
const response = await fetch('/api/extract-property-url', {
  method: 'POST',
  body: JSON.stringify({ url })
});

// 3. Data is extracted via OpenAI
const { data } = await response.json();

// 4. JSON file is created automatically
const file = new File([JSON.stringify(data)], 'property.json');

// 5. Form is populated and ready to analyze
setSelectedFile(file);
setLTRMetrics({ monthlyRent: data.monthlyRent });
```

## Future Enhancements

Potential improvements:
- [ ] Bulk URL extraction
- [ ] Browser extension for one-click extraction
- [ ] Save extracted properties to history
- [ ] Auto-fetch comparable properties
- [ ] Integration with MLS listings
- [ ] Image extraction and analysis

## Support

If you encounter issues:
1. Check that the URL is publicly accessible
2. Try a different listing from the same site
3. Fall back to manual file upload
4. Check your OpenAI API key is valid
5. Review console logs for detailed error messages

## Privacy & Terms

- No property data is stored on our servers
- Extraction happens in real-time
- Complies with OpenAI's terms of service
- Does not violate listing site terms (public data only)
- All data remains in your browser/session
