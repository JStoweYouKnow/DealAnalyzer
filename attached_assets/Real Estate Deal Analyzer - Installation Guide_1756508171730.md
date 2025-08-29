# Real Estate Deal Analyzer - Installation Guide

## System Requirements

- **Operating System**: Linux, macOS, or Windows
- **Python**: Version 3.11 or higher
- **Node.js**: Version 18 or higher (for web interface)
- **Package Manager**: pnpm (for web interface)

## Installation Steps

### 1. Download the Application

Download all the application files to a directory on your computer:

```
real-estate-analyzer/
├── criteria_manager.py
├── deal_analyzer.py
├── email_parser.py
├── investment_criteria.md
├── main.py
├── real_estate_data.py
├── example_email_alert.txt
├── example_email_alert_2.txt
└── real-estate-analyzer/    # Web application (if using web interface)
```

### 2. Python Environment Setup

#### Check Python Version
```bash
python3.11 --version
```

If Python 3.11+ is not installed, download it from [python.org](https://www.python.org/downloads/).

#### No Additional Dependencies Required
The command-line application uses only Python standard library modules, so no additional packages need to be installed.

### 3. Web Interface Setup (Optional)

If you want to use the web interface:

#### Install Node.js and pnpm
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Install pnpm globally:
   ```bash
   npm install -g pnpm
   ```

#### Setup the React Application
```bash
cd real-estate-analyzer
pnpm install
```

## Configuration

### 1. Customize Investment Criteria

Edit the `investment_criteria.md` file to match your investment preferences:

```markdown
## Real Estate Investment Criteria

**Property Types:** Single-family and Multi-family properties
**Location:** [Your preferred location]
**Max Purchase Price:** $[Your max price]
**Financials:**
*   **Downpayment:** [Your downpayment range]%
*   **Closing Costs:** [Your closing cost estimate]%
*   **Initial Fixed Costs:** [Your initial cost estimate]%
*   **Maintenance Reserve:** [Your maintenance reserve]% of gross rents

**Rules/Benchmarks:**
*   **1% Rule:** Property must pass the 1% rule
*   **Cash Flow:** Property must cash flow (positive cash flow)
*   **Cash-on-Cash (COC) Return:** Benchmark of [X]% to [Y]%, bare minimum of [A]% to [B]%
*   **Capitalization (Cap) Rate:** Benchmark of [X]% to [Y]%, bare minimum of [Z]%
```

### 2. Test the Installation

#### Test Command-Line Interface
```bash
python3.11 main.py example_email_alert.txt
```

You should see output similar to:
```
Property Type Check: single-family in ['single-family', 'multi-family'] = True
Location Check: California == California = True
...
Processed: example_email_alert.txt
Real Estate Deal Analysis Report
========================================
...
```

#### Test Web Interface
```bash
cd real-estate-analyzer
pnpm run dev --host
```

Open your browser to the displayed URL (typically `http://localhost:5174`).

## Verification

### 1. Command-Line Interface Test

Run the following command to verify everything is working:

```bash
python3.11 main.py example_email_alert.txt example_email_alert_2.txt -o test_output.txt
```

Check that:
- Both email files are processed without errors
- A report file `test_output.txt` is created
- The report contains analysis for both properties

### 2. Web Interface Test

1. Start the web server
2. Paste the content from `example_email_alert.txt` into the text area
3. Click "Analyze Property"
4. Verify that analysis results appear on the right side

## Troubleshooting

### Common Installation Issues

**Python Version Issues:**
```bash
# If python3.11 is not found, try:
python3 --version
python --version

# Use the appropriate command for your system
```

**Permission Issues (Linux/macOS):**
```bash
# Make scripts executable
chmod +x main.py
```

**Node.js/pnpm Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall pnpm
npm uninstall -g pnpm
npm install -g pnpm

# Clear pnpm cache
pnpm store prune
```

**Port Already in Use (Web Interface):**
```bash
# The application will automatically try another port
# Or specify a different port:
pnpm run dev --host --port 3000
```

### File Permission Issues

Ensure all files have appropriate read permissions:

```bash
# Linux/macOS
chmod 644 *.py *.md *.txt
chmod 755 main.py

# Windows (run as administrator if needed)
icacls *.py /grant Users:F
```

### Testing Email Parser

Create a test email file with the required format:

```bash
cat > test_email.txt << 'EOF'
**Property Address:** 123 Test St, Your City, CA 90210
**Property Type:** Single Family Home
**Purchase Price:** $200,000
**Estimated Monthly Rent:** $2,000
**Bedrooms:** 3
**Bathrooms:** 2
**Square Footage:** 1200 sqft
**Year Built:** 2000
**Description:** Test property
**Listing URL:** https://example.com/test
EOF

python3.11 main.py test_email.txt
```

## Performance Considerations

- The command-line application is lightweight and should run quickly on any modern system
- The web interface requires more resources due to the React development server
- For production use, the web interface should be built and served by a proper web server

## Security Considerations

- The application processes local files only and doesn't make external network requests
- Email content is processed locally and not transmitted anywhere
- For production deployment, consider implementing proper input validation and sanitization

## Next Steps

After successful installation:

1. Review the `USER_GUIDE.md` for detailed usage instructions
2. Customize your investment criteria in `investment_criteria.md`
3. Test with your own email alerts
4. Consider integrating with your email workflow for automated processing

## Support

If you encounter issues during installation:

1. Check that all files are present and readable
2. Verify Python and Node.js versions meet requirements
3. Review error messages for specific guidance
4. Test with the provided example files first

