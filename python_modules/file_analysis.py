import os
import sys
import argparse
import json
from file_parser import parse_file_content
from deal_analyzer import analyze_deal

def main():
    parser = argparse.ArgumentParser(description="Real Estate File Analyzer")
    parser.add_argument("file_path", help="Path to uploaded file")
    parser.add_argument("file_extension", help="File extension (.pdf, .csv, etc)")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    parser.add_argument("--data-file", help="Path to additional data JSON file")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file_path):
        print(f"Error: File '{args.file_path}' not found.", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Parse the uploaded file
        property_data = parse_file_content(args.file_path, args.file_extension)
        
        # Merge additional data if provided
        if args.data_file and os.path.exists(args.data_file):
            with open(args.data_file, "r") as f:
                additional_data = json.load(f)
                
            # Merge STR metrics
            if additional_data.get("str_metrics"):
                str_metrics = additional_data["str_metrics"]
                if str_metrics.get("adr"):
                    property_data.adr = str_metrics["adr"]
                if str_metrics.get("occupancy_rate"):
                    property_data.occupancy_rate = str_metrics["occupancy_rate"]
            
            # Merge monthly expenses
            if additional_data.get("monthly_expenses"):
                expenses = additional_data["monthly_expenses"]
                if expenses.get("property_taxes"):
                    property_data.property_taxes = expenses["property_taxes"]
                if expenses.get("insurance"):
                    property_data.insurance = expenses["insurance"]
                if expenses.get("utilities"):
                    property_data.utilities = expenses["utilities"]
                if expenses.get("management"):
                    property_data.management = expenses["management"]
                if expenses.get("maintenance"):
                    property_data.maintenance = expenses["maintenance"]
                if expenses.get("cleaning"):
                    property_data.cleaning = expenses["cleaning"]
                if expenses.get("supplies"):
                    property_data.supplies = expenses["supplies"]
                if expenses.get("other"):
                    property_data.other_expenses = expenses["other"]
        
        # Run deal analysis
        deal_analysis = analyze_deal(property_data)
        
        if args.json:
            # Convert to format expected by frontend
            result = {
                "propertyId": "temp_id",
                "property": {
                    "address": property_data.address,
                    "city": property_data.city, 
                    "state": property_data.state,
                    "zipCode": property_data.zip_code,
                    "propertyType": property_data.property_type,
                    "purchasePrice": property_data.purchase_price,
                    "monthlyRent": property_data.monthly_rent,
                    "bedrooms": property_data.bedrooms,
                    "bathrooms": property_data.bathrooms,
                    "squareFootage": property_data.square_footage,
                    "yearBuilt": property_data.year_built,
                    "description": property_data.description,
                    "listingUrl": property_data.listing_url,
                    "adr": property_data.adr,
                    "occupancyRate": property_data.occupancy_rate
                },
                "calculatedDownpayment": deal_analysis.calculated_downpayment,
                "calculatedClosingCosts": deal_analysis.calculated_closing_costs,
                "calculatedInitialFixedCosts": deal_analysis.calculated_initial_fixed_costs,
                "estimatedMaintenanceReserve": deal_analysis.estimated_maintenance_reserve,
                "totalCashNeeded": deal_analysis.total_cash_needed,
                "passes1PercentRule": deal_analysis.passes_1_percent_rule,
                "cashFlow": deal_analysis.cash_flow,
                "cashFlowPositive": deal_analysis.cash_flow_positive,
                "cocReturn": deal_analysis.coc_return,
                "cocMeetsBenchmark": deal_analysis.coc_meets_benchmark,
                "cocMeetsMinimum": deal_analysis.coc_meets_minimum,
                "capRate": deal_analysis.cap_rate,
                "capMeetsBenchmark": deal_analysis.cap_meets_benchmark,
                "capMeetsMinimum": deal_analysis.cap_meets_minimum,
                "projectedAnnualRevenue": deal_analysis.projected_annual_revenue,
                "projectedGrossYield": deal_analysis.projected_gross_yield,
                "totalMonthlyExpenses": deal_analysis.total_monthly_expenses,
                "strNetIncome": deal_analysis.str_net_income,
                "strMeetsCriteria": deal_analysis.str_meets_criteria,
                "meetsCriteria": deal_analysis.meets_criteria
            }
            print(json.dumps(result))
        else:
            # Text output format
            print(f"Property: {property_data.address}")
            print(f"File Type: {args.file_extension}")
            print(f"Meets Criteria: {'YES' if deal_analysis.meets_criteria else 'NO'}")
            print(f"Cash Flow: ${deal_analysis.cash_flow:.2f}")
            print(f"COC Return: {deal_analysis.coc_return:.2%}")
            print(f"Cap Rate: {deal_analysis.cap_rate:.2%}")
        
    except Exception as e:
        print(f"Error processing file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()