from dataclasses import dataclass, asdict, field
from typing import Optional, List, Dict
import json

@dataclass
class Property:
    # Required fields (no defaults)
    address: str
    city: str
    state: str
    zip_code: str
    property_type: str  # e.g., 'single-family', 'multi-family'
    purchase_price: float
    monthly_rent: float
    bedrooms: int
    bathrooms: float
    square_footage: int
    year_built: int
    description: str
    listing_url: str
    # Optional fields (with defaults)
    lot_size: Optional[int] = None  # Lot size in square feet
    image_urls: List[str] = field(default_factory=list)
    source_links: List[Dict[str, str]] = field(default_factory=list)
    # Financials (calculated or estimated)
    downpayment_percentage: float = 0.20 # Default to 20%
    closing_costs_percentage: float = 0.05 # Default to 5%
    initial_fixed_costs_percentage: float = 0.01 # Default to 1%
    maintenance_reserve_percentage: float = 0.05 # Default to 5% of gross rents
    # Short-term rental metrics
    adr: Optional[float] = None  # Average Daily Rate
    occupancy_rate: Optional[float] = None  # As decimal (0.75 = 75%)
    # User-inputtable monthly expenses
    property_taxes: Optional[float] = None
    insurance: Optional[float] = None
    utilities: Optional[float] = None
    management: Optional[float] = None
    maintenance: Optional[float] = None
    cleaning: Optional[float] = None
    supplies: Optional[float] = None
    other_expenses: Optional[float] = None

    def to_dict(self):
        return asdict(self)

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
    # Short-term rental specific metrics
    projected_annual_revenue: Optional[float] = None
    projected_gross_yield: Optional[float] = None  # As decimal
    total_monthly_expenses: Optional[float] = None
    str_net_income: Optional[float] = None  # STR-specific net income
    str_meets_criteria: Optional[bool] = None
    meets_criteria: bool = False

    def to_dict(self):
        result = asdict(self)
        # Convert nested property object
        result['property'] = self.property.to_dict()
        return result

    def to_json(self):
        return json.dumps(self.to_dict(), indent=2)
