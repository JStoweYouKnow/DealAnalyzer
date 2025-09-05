import re
from real_estate_data import Property

def normalize_property_type(property_type):
    """Normalize property type abbreviations and variations."""
    if not property_type:
        return "single-family"
    
    # Convert to lowercase for comparison
    normalized = str(property_type).lower().strip()
    
    # Handle abbreviations and full forms
    if normalized in ['sfr', 'sf', 'single family residential', 'single family', 'singlefamily']:
        return "single-family"
    elif normalized in ['mfr', 'mf', 'multi family residential', 'multifamily residential', 'multifamily', 'multi family']:
        return "multi-family"
    elif 'single' in normalized and 'family' in normalized:
        return "single-family"
    elif 'multi' in normalized and 'family' in normalized:
        return "multi-family"
    elif normalized in ['townhouse', 'townhome', 'town home']:
        return "townhouse"
    elif normalized in ['condo', 'condominium']:
        return "condo"
    elif normalized in ['duplex']:
        return "duplex"
    elif normalized in ['triplex']:
        return "triplex"
    elif normalized in ['fourplex', '4plex']:
        return "fourplex"
    else:
        # Default normalization - replace spaces with hyphens and lowercase
        return normalized.replace(" ", "-")

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
        r"(Single Family|Multifamily|Multi[- ]Family|Townhouse|Condo|Duplex|Triplex|Fourplex|SFR|MFR)(?:\s+(?:Home|House|Property|Residence))?",
        r"Style[:：]\s*(Single Family|Multifamily|Multi Family|Townhouse|Condo|SFR|MFR)",
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
        r"\*\*Square Footage:\*\*\s*([\d,]+)\s*sqft",
        r"Square Footage[:：]\s*([\d,]+)",
        r"([\d,]+)\s*(?:sq\.?\s*ft\.?|sqft|square feet)",
        r"Size[:：]\s*([\d,]+)\s*(?:sq\.?\s*ft\.?|sqft)",
        r"(\d{3,5})\s*(?:sf|sq\.ft\.)",
    ]

    # Lot size patterns
    lot_size_patterns = [
        r"\*\*Lot Size:\*\*\s*([\d,]+)\s*(?:sq\.?\s*ft\.?|sqft|square feet)?",
        r"Lot Size[:：]\s*([\d,]+)",
        r"Lot[:：]\s*([\d,]+)\s*(?:sq\.?\s*ft\.?|sqft|square feet)",
        r"Land Size[:：]\s*([\d,]+)",
        r"([\d,]+)\s*(?:sq\.?\s*ft\.?|sqft)\s*lot",
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

    # Image URL patterns
    image_patterns = [
        r"(https?://[^\s]*\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^\s]*)?)",
        r"(https?://[^\s]*images?[^\s]*\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^\s]*)?)",
        r"(https?://[^\s]*photo[^\s]*\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^\s]*)?)",
        r"(https?://[^\s]*image[^\s]*)",
        r"src=[\"']([^\"']*\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^\"']*)?)[\"']",
    ]

    def extract_images(patterns, content):
        """Extract all image URLs from content"""
        images = set()  # Use set to avoid duplicates
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                if match and match.startswith('http'):
                    images.add(match)
        # Limit to top 3 most relevant images
        return list(images)[:3]
    
    def extract_all_links(patterns, content):
        """Extract all links with categorization"""
        links = []
        found_urls = set()  # Track URLs to avoid duplicates
        
        # Define unwanted keywords to filter out
        unwanted_keywords = [
            'unsubscribe', 'preferences', 'privacy', 'feedback', 'nmlsconsumer',
            'terms', 'policy', 'manage', 'notification', 'email', 'optout', 
            'unsub', 'settings', 'track', 'click', 'pixel', 'analytics',
            'campaign', 'utm_', 'redirect', 'mail.', 'token=', 'rtoken='
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                if match and match.startswith('http') and match not in found_urls:
                    found_urls.add(match)
                    
                    # Skip unwanted links
                    if any(keyword in match.lower() for keyword in unwanted_keywords):
                        continue
                    
                    # Categorize link type
                    link_type = 'other'
                    description = None
                    
                    if any(domain in match.lower() for domain in ['zillow', 'realtor', 'redfin', 'mls']):
                        # Only include if it looks like a property listing, not tracking
                        if not any(track in match.lower() for track in ['click', 'track', 'email', 'campaign']):
                            link_type = 'listing'
                            description = 'Property listing'
                        else:
                            continue  # Skip tracking links
                    elif any(domain in match.lower() for domain in ['trulia', 'homes.com', 'movoto']):
                        if not any(track in match.lower() for track in ['click', 'track', 'email', 'campaign']):
                            link_type = 'listing'
                            description = 'Property listing'
                        else:
                            continue
                    elif any(keyword in match.lower() for keyword in ['company', 'agent', 'broker', 'realty']):
                        link_type = 'company'
                        description = 'Real estate company'
                    else:
                        # Only include external links if they seem property-related
                        if any(keyword in match.lower() for keyword in ['property', 'home', 'house', 'listing']):
                            link_type = 'external'
                        else:
                            continue  # Skip other external links
                    
                    links.append({
                        'url': match,
                        'type': link_type,
                        'description': description
                    })
        
        # Limit to most relevant links (top 3)
        return links[:3]

    # Extract all fields using patterns
    address = extract_field(address_patterns, email_content)
    property_type = extract_field(property_type_patterns, email_content)
    purchase_price = extract_price(price_patterns, email_content)
    monthly_rent = extract_price(rent_patterns, email_content, 0.0)  # Default to 0 since most listings don't include rent
    bedrooms = int(extract_number(bedroom_patterns, email_content))
    bathrooms = extract_number(bathroom_patterns, email_content, is_float=True)
    square_footage = int(extract_number(sqft_patterns, email_content))
    lot_size = int(extract_number(lot_size_patterns, email_content)) if extract_number(lot_size_patterns, email_content) > 0 else None
    year_built = int(extract_number(year_patterns, email_content))
    listing_url = extract_field(url_patterns, email_content)
    
    # Extract images and all links
    image_urls = extract_images(image_patterns, email_content)
    source_links = extract_all_links(url_patterns, email_content)
    
    # Use lot size as square footage fallback if square footage is missing or zero
    if square_footage == 0 and lot_size and lot_size > 0:
        square_footage = lot_size

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
        property_type = normalize_property_type(property_type)

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
        lot_size=lot_size,
        year_built=year_built,
        description=description,
        listing_url=listing_url,
        image_urls=image_urls,
        source_links=source_links
    )

if __name__ == "__main__":
    with open("example_email_alert.txt", "r") as f:
        email_content = f.read()
    property_data = parse_email_alert(email_content)
    print(property_data)
