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
    
    def extract_header_text(text, max_lines=10):
        """Extract header text (first few lines) for fallback parsing."""
        lines = text.split('\n')
        return '\n'.join(lines[:max_lines])
    
    def extract_with_header_fallback(patterns, header_patterns, text, header_text, default=None):
        """Try main patterns first, then header patterns as fallback."""
        # Try main patterns first
        result = extract_flexible_value(patterns, text, None)
        if result and result != default:
            return result
        
        # Fallback to header patterns
        return extract_flexible_value(header_patterns, header_text, default)
    
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
    
    # Header-specific patterns for property type (often in titles/headers)
    header_property_type_patterns = [
        r'^.*?(Single Family|Multifamily|Multi[- ]?Family|Townhouse|Condo|Duplex|Triplex|Fourplex|SFR|MFR).*?$',
        r'(Single Family|Multifamily|Multi[- ]?Family|Townhouse|Condo|Duplex|Triplex|Fourplex|SFR|MFR)(?:\s+(?:Home|House|Property|Residence|Listing))?',
        r'(?:FOR SALE|LISTING).*?(Single Family|Multifamily|Multi[- ]?Family|Townhouse|Condo|Duplex|Triplex|Fourplex|SFR|MFR)',
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
    
    # Header-specific patterns for square footage (often in title lines)
    # These patterns avoid matching street addresses by requiring specific context
    header_sqft_patterns = [
        r'(?:Property|Home|House).*?(\d{1,2},\d{3})\s*(?:sq\.?\s*ft\.?|sqft|SF|square feet)',  # Property context with comma
        r'(?:Property|Home|House).*?(\d{3,5})\s*(?:sq\.?\s*ft\.?|sqft|SF|square feet)',        # Property context without comma
        r'.*?(\d{1,2},\d{3})\s*(?:sq\.?\s*ft\.?|sqft|SF)\s*(?:Property|Home|House)',           # Sqft before property type
        r'.*?(\d{3,5})\s*(?:sq\.?\s*ft\.?|sqft|SF)\s*(?:Property|Home|House)',                 # Sqft before property type
        r'-\s*(\d{1,2},\d{3})\s*(?:sq\.?\s*ft\.?|sqft|SF)',                                    # Dash separator with comma
        r'-\s*(\d{3,5})\s*(?:sq\.?\s*ft\.?|sqft|SF)',                                          # Dash separator without comma
        r'(\d{1,2},\d{3})\s*SF(?!\w)',                                                         # SF with word boundary (not Street)
        r'(\d{3,5})\s*SF(?!\w)',                                                               # SF with word boundary
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
    
    # Extract header text for fallback parsing
    header_text = extract_header_text(text_content)
    
    # Extract values with header fallback for property type and square footage
    address = extract_flexible_value(address_patterns, text_content, "Unknown Address")
    purchase_price = extract_price(price_patterns, text_content, 0.0)
    monthly_rent = extract_price(rent_patterns, text_content, 0.0)  # Default to 0 since most listings don't include rent
    
    # Property type with header fallback
    property_type_raw = extract_with_header_fallback(
        property_type_patterns, 
        header_property_type_patterns, 
        text_content, 
        header_text, 
        "single-family"
    )
    property_type = normalize_property_type(property_type_raw)
    
    bedrooms = extract_number(bedroom_patterns, text_content, 0)
    bathrooms = extract_number(bathroom_patterns, text_content, 0.0, is_float=True)
    
    # Square footage with header fallback
    square_footage = extract_number(sqft_patterns, text_content, 0)
    
    # If no square footage found, or if the found value seems too small (likely from address),
    # try header patterns as fallback
    if square_footage == 0 or square_footage < 500:  # 500 sq ft is very small for most properties
        header_sqft = extract_number(header_sqft_patterns, header_text, 0)
        if header_sqft > 0:
            # Use header value if it's significantly larger than what we found in the main text
            if header_sqft > square_footage:
                square_footage = header_sqft
    
    lot_size = extract_number(lot_size_patterns, text_content, 0) if extract_number(lot_size_patterns, text_content, 0) > 0 else None
    year_built = extract_number(year_patterns, text_content, 0)
    
    # Use lot size as square footage fallback if square footage is still missing or zero
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