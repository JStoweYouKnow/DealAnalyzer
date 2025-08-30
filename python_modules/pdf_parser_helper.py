import re
from real_estate_data import Property
from email_parser import normalize_property_type

def parse_pdf_content(text_content: str) -> Property:
    """Parse property data specifically from PDF text content with flexible patterns."""
    
    def extract_flexible_value(patterns, text, default=None):
        """Extract values with flexible whitespace and formatting."""
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            if matches:
                for match in matches:
                    if isinstance(match, tuple):
                        match = match[0] if match[0] else (match[1] if len(match) > 1 else "")
                    if match and match.strip():
                        return match.strip()
        return default
    
    def extract_price(patterns, text, default=0.0):
        """Extract price values and convert to float."""
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            if matches:
                for match in matches:
                    if isinstance(match, tuple):
                        match = match[0] if match[0] else (match[1] if len(match) > 1 else "")
                    if match:
                        price_str = str(match).replace(',', '').replace('$', '').replace(' ', '').strip()
                        try:
                            return float(price_str)
                        except ValueError:
                            continue
        return default
    
    def extract_number(patterns, text, default=0, is_float=False):
        """Extract numeric values."""
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            if matches:
                for match in matches:
                    if isinstance(match, tuple):
                        match = match[0] if match[0] else (match[1] if len(match) > 1 else "")
                    if match:
                        # Clean numeric string - remove commas and spaces
                        clean_match = str(match).replace(',', '').replace(' ', '').strip()
                        try:
                            return float(clean_match) if is_float else int(float(clean_match))
                        except ValueError:
                            continue
        return default
    
    # Enhanced patterns for PDF text
    address_patterns = [
        r'(?:Address|Property Address|Location)[:=]?\s*([^\n\r]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl)[^\n\r]*)',
        r'(\d+\s+[^\n\r,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl)[^\n\r,]*)',
        r'(?:Property)[:=]?\s*([^\n\r]+)',
        r'(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl))',
    ]
    
    price_patterns = [
        r'(?:Price|Purchase Price|Listing Price|Asking Price|List Price|Sale Price)[:=]?\s*\$?([\d,]+)',
        r'\$\s*([\d,]+)(?:\s*(?:price|list|asking|purchase))?',
        r'([\d,]+)\s*(?:dollars?|USD)',
        r'\$([\d,]+)',
    ]
    
    rent_patterns = [
        r'(?:Rent|Monthly Rent|Rental|Rental Income)[:=]?\s*\$?([\d,]+)',
        r'\$\s*([\d,]+)\s*(?:per month|/month|monthly|rent)',
        r'(?:Monthly)[:=]?\s*\$?([\d,]+)',
    ]
    
    property_type_patterns = [
        r'(?:Type|Property Type)[:=]?\s*([^\n\r]+?)(?:\n|$|,)',
        r'(Single Family|Multifamily|Multi[- ]?Family|Townhouse|Condo|Duplex|Triplex|Fourplex|SFR|MFR)(?:\s+(?:Home|House|Property|Residence))?',
        r'(?:Style)[:=]?\s*([^\n\r]+)',
    ]
    
    bedroom_patterns = [
        r'(?:Bedrooms?|Beds?)[:=]?\s*(\d+)',
        r'(\d+)\s*(?:bed|bedroom|br)s?',
        r'(\d+)\s*BR',
    ]
    
    bathroom_patterns = [
        r'(?:Bathrooms?|Baths?)[:=]?\s*([\d.]+)',
        r'([\d.]+)\s*(?:bath|bathroom|ba)s?',
        r'([\d.]+)\s*BA',
    ]
    
    sqft_patterns = [
        r'(?:Square Feet|Square Footage|Size|Sq\.?\s*Ft\.?)[:=]?\s*([\d,]+)',
        r'([\d,]+)\s*(?:sq\.?\s*ft\.?|sqft|square feet|sf)',
        r'(\d{3,5})\s*(?:SF|sq\s*ft)',
    ]
    
    lot_size_patterns = [
        r'(?:Lot Size|Lot|Land Size)[:=]?\s*([\d,]+)\s*(?:sq\.?\s*ft\.?|sqft|square feet|sf)?',
        r'([\d,]+)\s*(?:sq\.?\s*ft\.?|sqft)\s*lot',
        r'Lot[:=]?\s*([\d,]+)',
    ]
    
    year_patterns = [
        r'(?:Year Built|Built|Construction Year)[:=]?\s*(\d{4})',
        r'(\d{4})\s*built',
        r'Built\s*(?:in\s*)?(\d{4})',
    ]
    
    city_patterns = [
        r'(?:City)[:=]?\s*([^\n\r,]+?)(?:,|\n|$)',
        r',\s*([A-Za-z\s]+),\s*[A-Z]{2}\s*\d{5}',
    ]
    
    state_patterns = [
        r'(?:State)[:=]?\s*([A-Z]{2})',
        r',\s*[A-Za-z\s]+,\s*([A-Z]{2})\s*\d{5}',
    ]
    
    zip_patterns = [
        r'(?:ZIP|Zip Code|Postal Code)[:=]?\s*(\d{5})',
        r',\s*[A-Z]{2}\s*(\d{5})',
    ]
    
    # Extract values
    address = extract_flexible_value(address_patterns, text_content, "Unknown Address")
    purchase_price = extract_price(price_patterns, text_content, 0.0)
    monthly_rent = extract_price(rent_patterns, text_content, 0.0)
    property_type_raw = extract_flexible_value(property_type_patterns, text_content, "single-family")
    property_type = normalize_property_type(property_type_raw)
    
    bedrooms = extract_number(bedroom_patterns, text_content, 0)
    bathrooms = extract_number(bathroom_patterns, text_content, 0.0, is_float=True)
    square_footage = extract_number(sqft_patterns, text_content, 0)
    lot_size = extract_number(lot_size_patterns, text_content, 0) if extract_number(lot_size_patterns, text_content, 0) > 0 else None
    year_built = extract_number(year_patterns, text_content, 0)
    
    # Use lot size as square footage fallback if square footage is missing or zero
    if square_footage == 0 and lot_size and lot_size > 0:
        square_footage = lot_size
    
    city = extract_flexible_value(city_patterns, text_content, "Unknown")
    state = extract_flexible_value(state_patterns, text_content, "Unknown")
    zip_code = extract_flexible_value(zip_patterns, text_content, "00000")
    
    return Property(
        address=address,
        city=city,
        state=state,
        zip_code=zip_code,
        property_type=property_type,
        purchase_price=purchase_price,
        monthly_rent=monthly_rent,
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        square_footage=square_footage,
        lot_size=lot_size,
        year_built=year_built,
        description="Property details extracted from PDF",
        listing_url="N/A"
    )