import os
import csv
import pandas as pd
import numpy as np
import pdfplumber
from PyPDF2 import PdfReader
from real_estate_data import Property
from email_parser import parse_email_alert, normalize_property_type

def parse_file_content(file_path: str, file_type: str) -> Property:
    """
    Parse property data from different file formats.
    
    Args:
        file_path: Path to the uploaded file
        file_type: File extension (.pdf, .csv, .txt, .xlsx, .xls)
    
    Returns:
        Property object with extracted data
    """
    
    if file_type.lower() == '.pdf':
        return parse_pdf_file(file_path)
    elif file_type.lower() == '.csv':
        return parse_csv_file(file_path)
    elif file_type.lower() in ['.xlsx', '.xls']:
        return parse_excel_file(file_path)
    elif file_type.lower() == '.txt':
        return parse_text_file(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

def parse_pdf_file(file_path: str) -> Property:
    """Extract property data from PDF files using pdfplumber."""
    try:
        text_content = ""
        
        # Try pdfplumber first (better for text extraction)
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
        
        # If no text found, try PyPDF2 as backup
        if not text_content.strip():
            reader = PdfReader(file_path)
            for page in reader.pages:
                text_content += page.extract_text() + "\n"
        
        if not text_content.strip():
            # Create a minimal property with PDF filename
            return Property(
                address="PDF File: " + os.path.basename(file_path),
                city="Unknown",
                state="Unknown", 
                zip_code="00000",
                property_type="unknown",
                purchase_price=0.0,
                monthly_rent=0.0,
                bedrooms=0,
                bathrooms=0.0,
                square_footage=0,
                year_built=0,
                description="PDF parsing failed - no extractable text found",
                listing_url="N/A"
            )
        
        # Use existing email parser on extracted text
        return parse_email_alert(text_content)
        
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return Property(
            address="PDF Parse Error",
            city="Unknown",
            state="Unknown",
            zip_code="00000", 
            property_type="unknown",
            purchase_price=0.0,
            monthly_rent=0.0,
            bedrooms=0,
            bathrooms=0.0,
            square_footage=0,
            year_built=0,
            description=f"PDF parsing error: {str(e)}",
            listing_url="N/A"
        )

def parse_csv_file(file_path: str) -> Property:
    """Parse property data from CSV files."""
    try:
        df = pd.read_csv(file_path)
        
        # If empty CSV
        if df.empty:
            raise ValueError("CSV file is empty")
        
        # Get first row of data
        row = df.iloc[0]
        
        # Common CSV column mappings (case insensitive)
        def get_value(possible_names, default=None):
            for name in possible_names:
                for col in df.columns:
                    if name.lower() in col.lower():
                        value = row[col]
                        if pd.isna(value):
                            continue
                        if isinstance(value, str):
                            value = value.strip()
                            if value == "":
                                continue
                        return value
            return default
        
        # Extract property information
        address = get_value(['address', 'property_address', 'street', 'location'], "Unknown Address")
        city = get_value(['city'], "Unknown")
        state = get_value(['state'], "Unknown")
        zip_code = get_value(['zip', 'zipcode', 'postal'], "00000")
        property_type = get_value(['type', 'property_type', 'style'], "single-family")
        
        # Prices - clean numeric values
        purchase_price = clean_numeric(get_value(['price', 'purchase_price', 'listing_price', 'list_price', 'asking_price'], 0))
        monthly_rent = clean_numeric(get_value(['rent', 'monthly_rent', 'rental_income'], 0))
        
        # Property details
        bedrooms = int(clean_numeric(get_value(['bedrooms', 'beds', 'br'], 0)))
        bathrooms = float(clean_numeric(get_value(['bathrooms', 'baths', 'ba'], 0)))
        square_footage = int(clean_numeric(get_value(['sqft', 'square_feet', 'square feet', 'size', 'sq_ft'], 0)))
        year_built = int(clean_numeric(get_value(['year_built', 'built', 'construction_year'], 0)))
        
        description = str(get_value(['description', 'details', 'notes'], "CSV property listing"))
        listing_url = str(get_value(['url', 'listing_url', 'link'], "N/A"))
        
        return Property(
            address=str(address),
            city=str(city),
            state=str(state),
            zip_code=str(zip_code),
            property_type=normalize_property_type(property_type),
            purchase_price=purchase_price,
            monthly_rent=monthly_rent,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            square_footage=square_footage,
            year_built=year_built,
            description=description,
            listing_url=listing_url
        )
        
    except Exception as e:
        print(f"Error parsing CSV: {e}")
        return Property(
            address="CSV Parse Error",
            city="Unknown",
            state="Unknown",
            zip_code="00000",
            property_type="unknown",
            purchase_price=0.0,
            monthly_rent=0.0,
            bedrooms=0,
            bathrooms=0.0,
            square_footage=0,
            year_built=0,
            description=f"CSV parsing error: {str(e)}",
            listing_url="N/A"
        )

def parse_excel_file(file_path: str) -> Property:
    """Parse property data from Excel files."""
    try:
        # Read the first sheet
        df = pd.read_excel(file_path)
        
        if df.empty:
            raise ValueError("Excel file is empty")
        
        # Use the same logic as CSV parsing
        # Convert to CSV in memory and parse
        temp_csv = file_path + ".tmp.csv"
        df.to_csv(temp_csv, index=False)
        
        result = parse_csv_file(temp_csv)
        
        # Clean up temp file
        if os.path.exists(temp_csv):
            os.remove(temp_csv)
            
        return result
        
    except Exception as e:
        print(f"Error parsing Excel: {e}")
        return Property(
            address="Excel Parse Error",
            city="Unknown",
            state="Unknown",
            zip_code="00000",
            property_type="unknown",
            purchase_price=0.0,
            monthly_rent=0.0,
            bedrooms=0,
            bathrooms=0.0,
            square_footage=0,
            year_built=0,
            description=f"Excel parsing error: {str(e)}",
            listing_url="N/A"
        )

def parse_text_file(file_path: str) -> Property:
    """Parse property data from plain text files."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Use existing email parser
        return parse_email_alert(content)
        
    except Exception as e:
        print(f"Error parsing text file: {e}")
        return Property(
            address="Text Parse Error",
            city="Unknown",
            state="Unknown", 
            zip_code="00000",
            property_type="unknown",
            purchase_price=0.0,
            monthly_rent=0.0,
            bedrooms=0,
            bathrooms=0.0,
            square_footage=0,
            year_built=0,
            description=f"Text parsing error: {str(e)}",
            listing_url="N/A"
        )

def clean_numeric(value, default=0):
    """Clean and convert values to numbers."""
    if value is None or pd.isna(value):
        return default
    
    if isinstance(value, (int, float, np.integer, np.floating)):
        return float(value) if isinstance(value, np.floating) else int(value)
    
    if isinstance(value, str):
        # Remove common currency symbols and commas
        cleaned = value.replace('$', '').replace(',', '').replace(' ', '').strip()
        if cleaned == '':
            return default
        try:
            if '.' in cleaned:
                return float(cleaned)
            else:
                return int(cleaned)
        except ValueError:
            return default
    
    return default

if __name__ == "__main__":
    # Test the file parser
    import sys
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        file_ext = os.path.splitext(file_path)[1]
        try:
            property_data = parse_file_content(file_path, file_ext)
            print(property_data.to_dict())
        except Exception as e:
            print(f"Error: {e}")