import os
import argparse
from email_parser import parse_email_alert
from deal_analyzer import analyze_deal
from real_estate_data import DealAnalysis

def generate_report(deal_analyses):
    """Generate a text report from a list of DealAnalysis objects."""
    report = "Real Estate Deal Analysis Report\n"
    report += "=" * 40 + "\n\n"
    
    for i, analysis in enumerate(deal_analyses, 1):
        property = analysis.property
        report += f"Property {i}: {property.address}\n"
        report += f"  Property Type: {property.property_type}\n"
        report += f"  Purchase Price: ${property.purchase_price:,.2f}\n"
        report += f"  Monthly Rent: ${property.monthly_rent:,.2f}\n"
        report += f"  Bedrooms: {property.bedrooms}, Bathrooms: {property.bathrooms}\n"
        report += f"  Square Footage: {property.square_footage} sqft\n"
        report += f"  Year Built: {property.year_built}\n"
        report += f"  Listing URL: {property.listing_url}\n\n"
        
        report += f"  Financial Analysis:\n"
        report += f"    Downpayment: ${analysis.calculated_downpayment:,.2f}\n"
        report += f"    Closing Costs: ${analysis.calculated_closing_costs:,.2f}\n"
        report += f"    Initial Fixed Costs: ${analysis.calculated_initial_fixed_costs:,.2f}\n"
        report += f"    Total Cash Needed: ${analysis.total_cash_needed:,.2f}\n"
        report += f"    Estimated Maintenance Reserve: ${analysis.estimated_maintenance_reserve:,.2f}/month\n\n"
        
        report += f"  Investment Criteria Check:\n"
        report += f"    1% Rule: {'PASS' if analysis.passes_1_percent_rule else 'FAIL'}\n"
        report += f"    Cash Flow: ${analysis.cash_flow:,.2f}/month ({'PASS' if analysis.cash_flow_positive else 'FAIL'})\n"
        report += f"    COC Return: {analysis.coc_return:.2%} ({'BENCHMARK' if analysis.coc_meets_benchmark else 'MINIMUM' if analysis.coc_meets_minimum else 'FAIL'})\n"
        report += f"    Cap Rate: {analysis.cap_rate:.2%} ({'BENCHMARK' if analysis.cap_meets_benchmark else 'MINIMUM' if analysis.cap_meets_minimum else 'FAIL'})\n"
        report += f"    Overall: {'MEETS CRITERIA' if analysis.meets_criteria else 'DOES NOT MEET CRITERIA'}\n"
        report += "\n" + "-" * 40 + "\n\n"
    
    return report

def main():
    parser = argparse.ArgumentParser(description="Real Estate Deal Analyzer")
    parser.add_argument("email_files", nargs="+", help="Path(s) to email alert text files")
    parser.add_argument("-o", "--output", help="Output file for the report (default: stdout)")
    
    args = parser.parse_args()
    
    deal_analyses = []
    
    for email_file in args.email_files:
        if not os.path.exists(email_file):
            print(f"Error: File '{email_file}' not found.")
            continue
        
        with open(email_file, "r") as f:
            email_content = f.read()
        
        try:
            property_data = parse_email_alert(email_content)
            deal_analysis = analyze_deal(property_data)
            deal_analyses.append(deal_analysis)
            print(f"Processed: {email_file}")
        except Exception as e:
            print(f"Error processing '{email_file}': {e}")
    
    if deal_analyses:
        report = generate_report(deal_analyses)
        
        if args.output:
            with open(args.output, "w") as f:
                f.write(report)
            print(f"Report saved to: {args.output}")
        else:
            print(report)
    else:
        print("No valid email files processed.")

if __name__ == "__main__":
    main()

