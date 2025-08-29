from real_estate_data import Property, DealAnalysis
from criteria_manager import load_investment_criteria

def analyze_deal(property: Property) -> DealAnalysis:
    criteria = load_investment_criteria()

    # Financial Calculations
    downpayment_percentage = (criteria["downpayment_percentage_min"] + criteria["downpayment_percentage_max"]) / 2
    closing_costs_percentage = (criteria["closing_costs_percentage_min"] + criteria["closing_costs_percentage_max"]) / 2
    initial_fixed_costs_percentage = criteria["initial_fixed_costs_percentage"]
    maintenance_reserve_percentage = criteria["maintenance_reserve_percentage"]

    calculated_downpayment = property.purchase_price * downpayment_percentage
    calculated_closing_costs = property.purchase_price * closing_costs_percentage
    calculated_initial_fixed_costs = property.purchase_price * initial_fixed_costs_percentage
    estimated_maintenance_reserve = property.monthly_rent * maintenance_reserve_percentage

    total_cash_needed = calculated_downpayment + calculated_closing_costs + calculated_initial_fixed_costs

    # 1% Rule Check
    passes_1_percent_rule = property.monthly_rent >= (property.purchase_price * 0.01)

    # Calculate estimated monthly mortgage payment (Principal & Interest) first.
    # Assuming a 30-year fixed mortgage at 7% interest rate.
    loan_amount = property.purchase_price - calculated_downpayment
    annual_interest_rate = 0.07
    monthly_interest_rate = annual_interest_rate / 12
    number_of_payments = 30 * 12

    if monthly_interest_rate > 0:
        monthly_mortgage_payment = loan_amount * (monthly_interest_rate * (1 + monthly_interest_rate)**number_of_payments) / ((1 + monthly_interest_rate)**number_of_payments - 1)
    else:
        monthly_mortgage_payment = loan_amount / number_of_payments # Simple division if interest rate is 0

    # Estimated Monthly Expenses
    estimated_property_tax = property.purchase_price * 0.012 / 12  # 1.2% annually
    estimated_insurance = 100.0  # Flat $100
    estimated_vacancy = property.monthly_rent * 0.05 # 5% of gross rents
    estimated_property_management = property.monthly_rent * 0.10 # 10% of gross rents

    total_monthly_expenses = (
        monthly_mortgage_payment +
        estimated_property_tax +
        estimated_insurance +
        estimated_vacancy +
        estimated_maintenance_reserve +
        estimated_property_management
    )

    cash_flow = property.monthly_rent - total_monthly_expenses
    
    # Check if cash flow is positive
    cash_flow_positive = cash_flow > 0

    # Cash-on-Cash Return (COC)
    # COC = Annual Cash Flow / Total Cash Invested
    annual_cash_flow = cash_flow * 12
    if total_cash_needed > 0:
        coc_return = annual_cash_flow / total_cash_needed
    else:
        coc_return = 0.0

    coc_meets_benchmark = (coc_return >= criteria["coc_benchmark_min"] and coc_return <= criteria["coc_benchmark_max"])
    coc_meets_minimum = (coc_return >= criteria["coc_minimum_min"] and coc_return <= criteria["coc_minimum_max"])
    
    # Capitalization Rate (Cap Rate)
    # Cap Rate = Net Operating Income (NOI) / Property Purchase Price
    # NOI = Gross Rental Income - Operating Expenses (excluding mortgage interest and principal)
    
    annual_gross_rent = property.monthly_rent * 12
    annual_operating_expenses = (
        estimated_maintenance_reserve * 12 +
        estimated_property_tax * 12 +
        estimated_insurance * 12 +
        estimated_vacancy * 12 +
        estimated_property_management * 12
    )
    
    net_operating_income = annual_gross_rent - annual_operating_expenses
    
    if property.purchase_price > 0:
        cap_rate = net_operating_income / property.purchase_price
    else:
        cap_rate = 0.0

    cap_meets_benchmark = (cap_rate >= criteria["cap_benchmark_min"] and cap_rate <= criteria["cap_benchmark_max"])
    cap_meets_minimum = (cap_rate >= criteria["cap_minimum"])
    
    # Calculate STR-specific metrics if STR data is available
    projected_annual_revenue = None
    projected_gross_yield = None
    total_monthly_expenses = None
    str_net_income = None
    str_meets_criteria = None
    
    if property.adr is not None and property.occupancy_rate is not None:
        # Calculate STR projected annual revenue
        days_per_year = 365
        occupied_days = days_per_year * property.occupancy_rate
        projected_annual_revenue = property.adr * occupied_days
        
        # Calculate gross yield for STR
        if property.purchase_price > 0:
            projected_gross_yield = projected_annual_revenue / property.purchase_price
        
        # Calculate total monthly expenses (use user inputs if available, otherwise estimates)
        monthly_property_tax = property.property_taxes if property.property_taxes else estimated_property_tax
        monthly_insurance = property.insurance if property.insurance else estimated_insurance
        monthly_utilities = property.utilities if property.utilities else 150.0  # Estimate for STR
        monthly_management = property.management if property.management else projected_annual_revenue * 0.15 / 12  # 15% for STR management
        monthly_maintenance = property.maintenance if property.maintenance else projected_annual_revenue * 0.05 / 12
        monthly_cleaning = property.cleaning if property.cleaning else 75.0 * property.occupancy_rate * 30  # Estimate per occupied day
        monthly_supplies = property.supplies if property.supplies else 50.0
        monthly_other = property.other_expenses if property.other_expenses else 0.0
        
        total_monthly_expenses = (
            monthly_mortgage_payment +
            monthly_property_tax +
            monthly_insurance +
            monthly_utilities +
            monthly_management +
            monthly_maintenance +
            monthly_cleaning +
            monthly_supplies +
            monthly_other
        )
        
        # Calculate STR net income
        str_net_income = (projected_annual_revenue / 12) - total_monthly_expenses
        
        # Check STR criteria
        str_meets_criteria = True
        if "str_adr_minimum" in criteria and property.adr < criteria["str_adr_minimum"]:
            str_meets_criteria = False
        if "str_occupancy_rate_minimum" in criteria and property.occupancy_rate < criteria["str_occupancy_rate_minimum"]:
            str_meets_criteria = False
        if "str_gross_yield_minimum" in criteria and projected_gross_yield < criteria["str_gross_yield_minimum"]:
            str_meets_criteria = False
        if "str_annual_revenue_minimum" in criteria and projected_annual_revenue < criteria["str_annual_revenue_minimum"]:
            str_meets_criteria = False

    # Overall criteria check (includes STR if applicable)
    meets_criteria = (
        property.property_type in criteria["property_types"] and
        property.state == criteria["location"] and
        property.purchase_price <= criteria["max_purchase_price"] and
        passes_1_percent_rule and
        cash_flow_positive and
        coc_meets_minimum and
        cap_meets_minimum
    )
    
    # If STR data is available, also check STR criteria
    if str_meets_criteria is not None:
        meets_criteria = meets_criteria and str_meets_criteria

    return DealAnalysis(
        property=property,
        calculated_downpayment=calculated_downpayment,
        calculated_closing_costs=calculated_closing_costs,
        calculated_initial_fixed_costs=calculated_initial_fixed_costs,
        estimated_maintenance_reserve=estimated_maintenance_reserve,
        total_cash_needed=total_cash_needed,
        passes_1_percent_rule=passes_1_percent_rule,
        cash_flow=cash_flow,
        cash_flow_positive=cash_flow_positive,
        coc_return=coc_return,
        coc_meets_benchmark=coc_meets_benchmark,
        coc_meets_minimum=coc_meets_minimum,
        cap_rate=cap_rate,
        cap_meets_benchmark=cap_meets_benchmark,
        cap_meets_minimum=cap_meets_minimum,
        projected_annual_revenue=projected_annual_revenue,
        projected_gross_yield=projected_gross_yield,
        total_monthly_expenses=total_monthly_expenses,
        str_net_income=str_net_income,
        str_meets_criteria=str_meets_criteria,
        meets_criteria=meets_criteria
    )

if __name__ == "__main__":
    # Example usage (you can replace this with actual parsed property data)
    from email_parser import parse_email_alert

    with open("example_email_alert.txt", "r") as f:
        email_content = f.read()
    property_data = parse_email_alert(email_content)

    deal_analysis = analyze_deal(property_data)
    print(deal_analysis)
