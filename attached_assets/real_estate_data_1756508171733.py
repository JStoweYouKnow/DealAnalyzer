from dataclasses import dataclass

@dataclass
class Property:
    address: str
    city: str
    state: str
    zip_code: str
    property_type: str  # e.g., 'Single Family', 'Multi-family'
    purchase_price: float
    monthly_rent: float
    bedrooms: int
    bathrooms: float
    square_footage: int
    year_built: int
    description: str
    listing_url: str
    # Financials (calculated or estimated)
    downpayment_percentage: float = 0.20 # Default to 20%
    closing_costs_percentage: float = 0.05 # Default to 5%
    initial_fixed_costs_percentage: float = 0.01 # Default to 1%
    maintenance_reserve_percentage: float = 0.05 # Default to 5% of gross rents

@dataclass
class DealAnalysis:
    property: Property
    calculated_downpayment: float
    calculated_closing_costs: float
    calculated_initial_fixed_costs: float
    estimated_maintenance_reserve: float
    total_cash_needed: float
    passes_1_percent_rule: bool
    cash_flow: float
    cash_flow_positive: bool
    coc_return: float
    coc_meets_benchmark: bool
    coc_meets_minimum: bool
    cap_rate: float
    cap_meets_benchmark: bool
    cap_meets_minimum: bool
    meets_criteria: bool


