# Real Estate Deal Analyzer - User Guide

## Overview

The Real Estate Deal Analyzer is a comprehensive application designed to help real estate investors quickly evaluate investment opportunities from email listing alerts. The application parses property information from emails and automatically calculates key financial metrics to determine if a property meets your predefined investment criteria.

## Features

- **Email Parsing**: Automatically extracts property details from real estate listing emails
- **Financial Analysis**: Calculates downpayment, closing costs, cash flow, COC return, and cap rate
- **Investment Criteria Evaluation**: Checks properties against your specific buy box requirements
- **Multiple Interfaces**: Available as both command-line tool and web application
- **Detailed Reporting**: Generates comprehensive analysis reports

## Investment Criteria

The application evaluates properties based on the following criteria (as defined in `investment_criteria.md`):

- **Property Types**: Single-family and Multi-family properties
- **Location**: California
- **Max Purchase Price**: $300,000
- **Downpayment**: 20-25% for rental properties
- **Closing Costs**: 5-7% of purchase price
- **Initial Fixed Costs**: 1% of purchase price
- **Maintenance Reserve**: 5% of gross rents
- **1% Rule**: Monthly rent must be ≥ 1% of purchase price
- **Cash Flow**: Property must generate positive cash flow
- **Cash-on-Cash Return**: Benchmark 8-12%, minimum 5-7%
- **Cap Rate**: Benchmark 10-12%, minimum 4%

## Command Line Interface (CLI)

### Installation

1. Ensure Python 3.11+ is installed
2. Download all Python files to a directory
3. No additional dependencies required (uses standard library)

### Usage

```bash
python3.11 main.py [email_files...] [-o output_file]
```

**Arguments:**
- `email_files`: One or more paths to email alert text files
- `-o, --output`: Optional output file for the report (default: stdout)

**Examples:**

```bash
# Analyze a single email
python3.11 main.py example_email_alert.txt

# Analyze multiple emails
python3.11 main.py email1.txt email2.txt email3.txt

# Save report to file
python3.11 main.py example_email_alert.txt -o my_report.txt
```

### Email Format Requirements

The email parser expects emails with the following format:

```
**Property Address:** [Full Address]
**Property Type:** [Single Family Home | Multi-family Home]
**Purchase Price:** $[Amount]
**Estimated Monthly Rent:** $[Amount]
**Bedrooms:** [Number]
**Bathrooms:** [Number]
**Square Footage:** [Number] sqft
**Year Built:** [Year]
**Description:** [Property description]
**Listing URL:** [URL]
```

## Web Interface

### Starting the Application

1. Navigate to the `real-estate-analyzer` directory
2. Install dependencies: `pnpm install` (if not already done)
3. Start the development server: `pnpm run dev --host`
4. Open your browser to the displayed URL (typically `http://localhost:5174`)

### Using the Web Interface

1. **Input Email Content**: Paste your real estate listing email into the text area
2. **Analyze Property**: Click the "Analyze Property" button
3. **Review Results**: The analysis results will appear on the right side, showing:
   - Property details (address, type, price, etc.)
   - Financial summary (downpayment, closing costs, cash flow)
   - Investment metrics (1% rule, COC return, cap rate)
   - Overall assessment (meets criteria or not)

### Understanding the Results

**Property Details Section:**
- Basic information extracted from the email
- Includes property type, price, rent, bedrooms, bathrooms, square footage, and year built

**Financial Summary Section:**
- **Down Payment**: Calculated based on 22.5% (average of 20-25% range)
- **Closing Costs**: Calculated based on 6% (average of 5-7% range)
- **Initial Costs**: 1% of purchase price
- **Total Cash**: Sum of all upfront costs
- **Monthly Cash Flow**: Net monthly income after all expenses
- **Maintenance Reserve**: 5% of gross monthly rent

**Investment Metrics Section:**
- **1% Rule**: PASS/FAIL indicator for monthly rent ≥ 1% of purchase price
- **Cash Flow**: POSITIVE/NEGATIVE indicator
- **COC Return**: Percentage with BENCHMARK/MINIMUM/FAIL rating
- **Cap Rate**: Percentage with BENCHMARK/MINIMUM/FAIL rating

**Overall Assessment:**
- **MEETS CRITERIA**: Property passes all minimum requirements
- **DOES NOT MEET CRITERIA**: Property fails one or more requirements

## File Structure

```
real-estate-analyzer/
├── criteria_manager.py      # Loads and parses investment criteria
├── deal_analyzer.py         # Performs financial analysis
├── email_parser.py          # Parses email content
├── investment_criteria.md   # User's investment criteria
├── main.py                  # Command-line interface
├── real_estate_data.py      # Data structures (Property, DealAnalysis)
├── example_email_alert.txt  # Sample email for testing
├── example_email_alert_2.txt # Second sample email
└── real-estate-analyzer/    # Web application directory
    ├── src/
    │   ├── App.jsx          # Main React component
    │   └── ...
    └── ...
```

## Customizing Investment Criteria

To modify your investment criteria, edit the `investment_criteria.md` file. The application will automatically parse the new criteria on the next run. Ensure you follow the exact format shown in the existing file.

## Troubleshooting

**Common Issues:**

1. **Email not parsing correctly**: Ensure the email follows the expected format with bold field labels
2. **Property not meeting criteria**: Check each metric individually to see which requirement failed
3. **Web interface not loading**: Ensure the development server is running and accessible

**Debug Mode:**

The CLI application includes debug output showing which criteria checks pass or fail. This can help identify why a property doesn't meet your requirements.

## Limitations

- Email parsing is format-specific and may need adjustment for different listing services
- Financial calculations use estimated values for property taxes, insurance, and other expenses
- The web interface currently uses simulated analysis (would need backend integration for production use)
- Limited to California properties as currently configured

## Future Enhancements

Potential improvements could include:
- Support for additional email formats
- Integration with MLS data
- More sophisticated expense calculations
- Database storage for historical analysis
- Email integration for automatic processing
- Mobile-responsive design improvements

