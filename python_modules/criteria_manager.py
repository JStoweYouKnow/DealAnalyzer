import re

def load_investment_criteria(filepath="investment_criteria.md"):
    criteria = {}
    with open(filepath, "r") as f:
        content = f.read()

    # Extracting Property Types
    prop_type_match = re.search(r"\*\*Property Types:\*\*\s*(.*)", content)
    if prop_type_match: 
        criteria["property_types"] = [pt.strip().replace(" ", "-").replace("properties", "").strip("-").lower() for pt in prop_type_match.group(1).split("and")]

    # Extracting Location
    location_match = re.search(r"\*\*Location:\*\*\s*(.*)", content)
    if location_match:
        criteria["location"] = location_match.group(1).strip()

    # Extracting Max Purchase Price
    price_match = re.search(r"\*\*Max Purchase Price:\*\*\s*\$(\d{1,3}(?:,\d{3})*)", content)
    if price_match:
        criteria["max_purchase_price"] = float(price_match.group(1).replace(",", ""))

    # Extracting Financials
    dp_match = re.search(r"\*\*Downpayment:\*\*\s*Anticipate\s*(\d{1,2}-\d{1,2})%", content)
    if dp_match:
        dp_range = [float(x) / 100 for x in dp_match.group(1).split("-")]
        criteria["downpayment_percentage_min"] = dp_range[0]
        criteria["downpayment_percentage_max"] = dp_range[1]

    cc_match = re.search(r"\*\*Closing Costs:\*\*\s*Estimate\s*(\d{1,2})% to (\d{1,2})%", content)
    if cc_match:
        criteria["closing_costs_percentage_min"] = float(cc_match.group(1)) / 100
        criteria["closing_costs_percentage_max"] = float(cc_match.group(2)) / 100

    ifc_match = re.search(r"\*\*Initial Fixed Costs:\*\*\s*Estimate an additional\s*(\d{1,2})%", content)
    if ifc_match:
        criteria["initial_fixed_costs_percentage"] = float(ifc_match.group(1)) / 100

    mr_match = re.search(r"\*\*Maintenance Reserve:\*\*\s*Allow\s*(\d{1,2})%", content)
    if mr_match:
        criteria["maintenance_reserve_percentage"] = float(mr_match.group(1)) / 100

    # Extracting Rules/Benchmarks
    coc_match = re.search(r"\*\*Cash-on-Cash \(COC\) Return:\*\*\s*Benchmark of\s*(\d{1,2})% to (\d{1,2})%, bare minimum of (\d{1,2})% to (\d{1,2})%", content)
    if coc_match:
        criteria["coc_benchmark_min"] = float(coc_match.group(1)) / 100
        criteria["coc_benchmark_max"] = float(coc_match.group(2)) / 100
        criteria["coc_minimum_min"] = float(coc_match.group(3)) / 100
        criteria["coc_minimum_max"] = float(coc_match.group(4)) / 100

    cap_match = re.search(r"\*\*Capitalization \(Cap\) Rate:\*\*\s*Benchmark of\s*(\d{1,2})% to (\d{1,2})%, bare minimum of (\d{1,2})%", content)
    if cap_match:
        criteria["cap_benchmark_min"] = float(cap_match.group(1)) / 100
        criteria["cap_benchmark_max"] = float(cap_match.group(2)) / 100
        criteria["cap_minimum"] = float(cap_match.group(3)) / 100

    # Extracting STR Criteria
    str_adr_match = re.search(r"\*\*Minimum ADR \(Average Daily Rate\):\*\*\s*\$(\d+)", content)
    if str_adr_match:
        criteria["str_adr_minimum"] = float(str_adr_match.group(1))

    str_occ_match = re.search(r"\*\*Minimum Occupancy Rate:\*\*\s*(\d{1,2})%\s*\(([0-9.]+)\)", content)
    if str_occ_match:
        criteria["str_occupancy_rate_minimum"] = float(str_occ_match.group(2))

    str_yield_match = re.search(r"\*\*Minimum Gross Yield:\*\*\s*(\d{1,2})%\s*\(([0-9.]+)\)", content)
    if str_yield_match:
        criteria["str_gross_yield_minimum"] = float(str_yield_match.group(2))

    str_revenue_match = re.search(r"\*\*Minimum Annual Revenue:\*\*\s*\$(\d{1,3}(?:,\d{3})*)", content)
    if str_revenue_match:
        criteria["str_annual_revenue_minimum"] = float(str_revenue_match.group(1).replace(",", ""))

    return criteria

def update_investment_criteria(filepath, new_criteria):
    """Update investment criteria in the markdown file"""
    try:
        # Read current file
        with open(filepath, "r") as f:
            content = f.read()
        
        # Update max purchase price
        if 'price_max' in new_criteria:
            content = re.sub(
                r"\*\*Max Purchase Price:\*\*\s*\$[\d,]+", 
                f"**Max Purchase Price:** ${new_criteria['price_max']:,.0f}",
                content
            )
        
        # Update COC Return ranges
        if 'coc_return_min' in new_criteria and 'coc_return_max' in new_criteria:
            content = re.sub(
                r"\*\*Cash-on-Cash \(COC\) Return:\*\*\s*Benchmark of\s*\d{1,2}% to \d{1,2}%, bare minimum of \d{1,2}% to \d{1,2}%",
                f"**Cash-on-Cash (COC) Return:** Benchmark of {new_criteria['coc_return_max']*100:.0f}% to {new_criteria['coc_return_max']*100:.0f}%, bare minimum of {new_criteria['coc_return_min']*100:.0f}% to {new_criteria['coc_return_max']*100:.0f}%",
                content
            )
        
        # Update Cap Rate ranges
        if 'cap_rate_min' in new_criteria and 'cap_rate_max' in new_criteria:
            content = re.sub(
                r"\*\*Capitalization \(Cap\) Rate:\*\*\s*Benchmark of\s*\d{1,2}% to \d{1,2}%, bare minimum of \d{1,2}%",
                f"**Capitalization (Cap) Rate:** Benchmark of {new_criteria['cap_rate_max']*100:.0f}% to {new_criteria['cap_rate_max']*100:.0f}%, bare minimum of {new_criteria['cap_rate_min']*100:.0f}%",
                content
            )
        
        # Write updated content back to file
        with open(filepath, "w") as f:
            f.write(content)
        
        return {"success": True}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    criteria = load_investment_criteria()
    print(criteria)
