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

    return criteria

if __name__ == "__main__":
    criteria = load_investment_criteria()
    print(criteria)


