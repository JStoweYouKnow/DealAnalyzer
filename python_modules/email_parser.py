import re
from real_estate_data import Property

def parse_email_alert(email_content: str) -> Property:
    """
    Enhanced email parser that auto-detects property information from various email formats.
    Supports multiple patterns and formats commonly used by real estate services.
    """
    def extract_field(patterns, content, default="N/A"):
        """Try multiple regex patterns and return first match"""
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return default

    def extract_price(patterns, content, default=0.0):
        """Extract price and convert to float"""
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                price_str = match.group(1).replace(",", "").replace("$", "")
                try:
                    return float(price_str)
                except ValueError:
                    continue
        return default

    def extract_number(patterns, content, default=0, is_float=False):
        """Extract number and convert to int or float"""
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1)) if is_float else int(float(match.group(1)))
                except ValueError:
                    continue
        return default

    # Address patterns - look for various ways addresses are presented
    address_patterns = [
        r"\*\*Property Address:\*\*\s*(.*)",
        r"Address[:：]\s*([^\n\r]+)",
        r"Property Location[:：]\s*([^\n\r]+)",
        r"Located at[:：]?\s*([^\n\r]+)",
        r"(\d+\s+[^\n\r,]+,\s*[^\n\r,]+,\s*[A-Z]{2}\s*\d{5})",  # Street, City, State ZIP
        r"Property:\s*([^\n\r]+(?:St|Ave|Rd|Dr|Ln|Blvd|Way|Ct)[^\n\r]*)",
    ]

    # Property type patterns
    property_type_patterns = [
        r"\*\*Property Type:\*\*\s*(.*)",
        r"Type[:：]\s*([^\n\r]+)",
        r"Property Type[:：]\s*([^\n\r]+)",
        r"(Single Family|Multi[- ]Family|Townhouse|Condo|Duplex|Triplex|Fourplex)(?:\s+Home)?",
        r"Style[:：]\s*(Single Family|Multi Family|Townhouse|Condo)",
    ]

    # Price patterns - look for purchase price, listing price, asking price
    price_patterns = [
        r"\*\*Purchase Price:\*\*\s*\$?([\d,]+)",
        r"Purchase Price[:：]\s*\$?([\d,]+)",
        r"Listing Price[:：]\s*\$?([\d,]+)",
        r"Asking Price[:：]\s*\$?([\d,]+)",
        r"Price[:：]\s*\$?([\d,]+)",
        r"List Price[:：]\s*\$?([\d,]+)",
        r"\$\s*([\d,]+)(?:\s*-\s*list|listing|asking)",
    ]

    # Monthly rent patterns
    rent_patterns = [
        r"\*\*Estimated Monthly Rent:\*\*\s*\$?([\d,]+)",
        r"Monthly Rent[:：]\s*\$?([\d,]+)",
        r"Rent[:：]\s*\$?([\d,]+)(?:\s*/month|\s*per month|\s*monthly)?",
        r"Estimated Rent[:：]\s*\$?([\d,]+)",
        r"Projected Rent[:：]\s*\$?([\d,]+)",
        r"\$\s*([\d,]+)(?:\s*/mo|\s*per month|\s*monthly|\s*rent)",
    ]

    # Bedroom patterns
    bedroom_patterns = [
        r"\*\*Bedrooms:\*\*\s*(\d+)",
        r"Bedrooms?[:：]\s*(\d+)",
        r"(\d+)\s*(?:bed|bedroom|br)s?",
        r"Beds?[:：]\s*(\d+)",
    ]

    # Bathroom patterns
    bathroom_patterns = [
        r"\*\*Bathrooms:\*\*\s*([\d.]+)",
        r"Bathrooms?[:：]\s*([\d.]+)",
        r"([\d.]+)\s*(?:bath|bathroom|ba)s?",
        r"Baths?[:：]\s*([\d.]+)",
    ]

    # Square footage patterns
    sqft_patterns = [
        r"\*\*Square Footage:\*\*\s*(\d+)\s*sqft",
        r"Square Footage[:：]\s*(\d+)",
        r"(\d+)\s*(?:sq\.?\s*ft\.?|sqft|square feet)",
        r"Size[:：]\s*(\d+)\s*(?:sq\.?\s*ft\.?|sqft)",
        r"(\d{3,4})\s*(?:sf|sq\.ft\.)",
    ]

    # Year built patterns
    year_patterns = [
        r"\*\*Year Built:\*\*\s*(\d{4})",
        r"Year Built[:：]\s*(\d{4})",
        r"Built[:：]?\s*(?:in\s*)?(\d{4})",
        r"(\d{4})\s*built",
        r"Age[:：]\s*\d+\s*(?:years?)?\s*\((\d{4})\)",
    ]

    # URL patterns
    url_patterns = [
        r"\*\*Listing URL:\*\*\s*(.*)",
        r"(?:Listing\s+)?URL[:：]\s*([^\s]+)",
        r"(?:View|See)\s+(?:listing|property)[:：]?\s*([^\s]+)",
        r"(https?://[^\s]+)",
        r"Link[:：]\s*([^\s]+)",
    ]

    # Extract all fields using patterns
    address = extract_field(address_patterns, email_content)
    property_type = extract_field(property_type_patterns, email_content)
    purchase_price = extract_price(price_patterns, email_content)
    monthly_rent = extract_price(rent_patterns, email_content)
    bedrooms = int(extract_number(bedroom_patterns, email_content))
    bathrooms = extract_number(bathroom_patterns, email_content, is_float=True)
    square_footage = int(extract_number(sqft_patterns, email_content))
    year_built = int(extract_number(year_patterns, email_content))
    listing_url = extract_field(url_patterns, email_content)

    # Parse address into components
    if address != "N/A":
        # Try to split address into components
        parts = address.split(", ")
        if len(parts) >= 3:
            city = parts[1].strip()
            state_zip = parts[2].strip().split()
            state_abbr = state_zip[0] if len(state_zip) > 0 else "N/A"
            zip_code = state_zip[1] if len(state_zip) > 1 else "N/A"
        elif len(parts) == 2:
            city = parts[1].strip()
            state_abbr = "N/A"
            zip_code = "N/A"
        else:
            city = "N/A"
            state_abbr = "N/A" 
            zip_code = "N/A"
    else:
        city = "N/A"
        state_abbr = "N/A"
        zip_code = "N/A"

    # Convert state abbreviation to full name
    state_map = {
        "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
        "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
        "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
        "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
        "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
        "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
        "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
        "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
        "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
        "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"
    }
    state = state_map.get(state_abbr.upper(), state_abbr if state_abbr != "N/A" else "N/A")

    # Clean up property type
    if property_type != "N/A":
        property_type = property_type.replace(" Home", "").replace(" ", "-").lower()
        # Normalize common variations
        if "single" in property_type.lower():
            property_type = "single-family"
        elif "multi" in property_type.lower():
            property_type = "multi-family"
        elif property_type.lower() in ["townhouse", "townhome"]:
            property_type = "townhouse"
        elif property_type.lower() in ["condo", "condominium"]:
            property_type = "condo"

    # Extract description from remaining email content (fallback)
    description_patterns = [
        r"\*\*Description:\*\*\s*([\s\S]*?)(?=\n\n\*\*|Contact us|Sincerely|Best regards|$)",
        r"Description[:：]\s*([\s\S]*?)(?=\n\n|Contact|Sincerely|Best regards|$)",
        r"Details[:：]\s*([\s\S]*?)(?=\n\n|Contact|Sincerely|Best regards|$)",
    ]
    description = extract_field(description_patterns, email_content, "Property listing details")
    
    # Clean up description
    if len(description) > 500:
        description = description[:497] + "..."

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
        year_built=year_built,
        description=description,
        listing_url=listing_url
    )

if __name__ == "__main__":
    with open("example_email_alert.txt", "r") as f:
        email_content = f.read()
    property_data = parse_email_alert(email_content)
    print(property_data)
