import re
from real_estate_data import Property

def parse_email_alert(email_content: str) -> Property:
    address_match = re.search(r"\*\*Property Address:\*\*\s*(.*)", email_content)
    property_type_match = re.search(r"\*\*Property Type:\*\*\s*(.*)", email_content)
    purchase_price_match = re.search(r"\*\*Purchase Price:\*\*\s*\$(\d{1,3}(?:,\d{3})*)", email_content)
    monthly_rent_match = re.search(r"\*\*Estimated Monthly Rent:\*\*\s*\$(\d{1,3}(?:,\d{3})*)", email_content)
    bedrooms_match = re.search(r"\*\*Bedrooms:\*\*\s*(\d+)", email_content)
    bathrooms_match = re.search(r"\*\*Bathrooms:\*\*\s*([\d.]+)", email_content)
    sq_footage_match = re.search(r"\*\*Square Footage:\*\*\s*(\d+)\s*sqft", email_content)
    year_built_match = re.search(r"\*\*Year Built:\*\*\s*(\d{4})", email_content)
    description_match = re.search(r"\*\*Description:\*\*\s*([\s\S]*?)(?=\n\n\*\*Listing URL:|Contact us for more details!)", email_content)
    listing_url_match = re.search(r"\*\*Listing URL:\*\*\s*(.*)", email_content)

    address = address_match.group(1).strip() if address_match else "N/A"
    city_state_zip = address.split(", ")
    city = city_state_zip[1] if len(city_state_zip) > 1 else "N/A"
    state_abbr = city_state_zip[2].split(" ")[0] if len(city_state_zip) > 2 else "N/A"
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
    state = state_map.get(state_abbr, "N/A")
    zip_code = city_state_zip[2].split(" ")[1] if len(city_state_zip) > 2 else "N/A"

    property_type = property_type_match.group(1).strip().replace(" Home", "").replace(" ", "-").lower() if property_type_match else "N/A"
    purchase_price = float(purchase_price_match.group(1).replace(",", "")) if purchase_price_match else 0.0
    monthly_rent = float(monthly_rent_match.group(1).replace(",", "")) if monthly_rent_match else 0.0
    bedrooms = int(bedrooms_match.group(1)) if bedrooms_match else 0
    bathrooms = float(bathrooms_match.group(1)) if bathrooms_match else 0.0
    square_footage = int(sq_footage_match.group(1)) if sq_footage_match else 0
    year_built = int(year_built_match.group(1)) if year_built_match else 0
    description = description_match.group(1).strip() if description_match else "N/A"
    listing_url = listing_url_match.group(1).strip() if listing_url_match else "N/A"

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


