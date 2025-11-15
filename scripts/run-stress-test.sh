#!/bin/bash

# Stress Test Runner for DealAnalyzer
# This script helps you run stress tests against your production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DealAnalyzer Stress Test${NC}"
echo "=================================="
echo ""

# Get production URL
if [ -z "$1" ]; then
  echo -e "${YELLOW}Please provide your production URL:${NC}"
  echo "Usage: ./scripts/run-stress-test.sh <production-url>"
  echo ""
  echo "Example:"
  echo "  ./scripts/run-stress-test.sh https://deal-analyzer.vercel.app"
  echo ""
  echo -e "${YELLOW}To find your Vercel URL:${NC}"
  echo "  1. Go to https://vercel.com/dashboard"
  echo "  2. Select your DealAnalyzer project"
  echo "  3. Copy the production URL"
  echo ""
  exit 1
fi

PRODUCTION_URL=$1

# Validate URL
if [[ ! $PRODUCTION_URL =~ ^https?:// ]]; then
  echo -e "${RED}❌ Invalid URL format. Please include http:// or https://${NC}"
  exit 1
fi

echo -e "${GREEN}Production URL: ${PRODUCTION_URL}${NC}"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js is not installed${NC}"
  exit 1
fi

# Test connectivity first
echo -e "${BLUE}Testing connectivity...${NC}"
if curl -s -f -o /dev/null -w "%{http_code}" "${PRODUCTION_URL}/api/health" | grep -q "200"; then
  echo -e "${GREEN}✅ Server is reachable${NC}"
else
  echo -e "${RED}❌ Server is not reachable. Please check your URL.${NC}"
  exit 1
fi
echo ""

# Ask for test type
echo -e "${YELLOW}Select test type:${NC}"
echo "1) Quick test (Apache Bench) - Fast, basic metrics"
echo "2) Comprehensive test (Node.js) - Detailed metrics, 60 seconds"
echo "3) Light load test (Node.js) - 10 users, 30 seconds"
echo "4) Heavy load test (Node.js) - 100 users, 120 seconds"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
  1)
    echo -e "${BLUE}Running quick test with Apache Bench...${NC}"
    if command -v ab &> /dev/null; then
      ./scripts/quick-stress-test.sh "$PRODUCTION_URL"
    else
      echo -e "${RED}❌ Apache Bench (ab) is not installed${NC}"
      echo "Install it with: brew install httpd (macOS) or apt-get install apache2-utils (Linux)"
      exit 1
    fi
    ;;
  2)
    echo -e "${BLUE}Running comprehensive test...${NC}"
    node scripts/stress-test.js "$PRODUCTION_URL"
    ;;
  3)
    echo -e "${BLUE}Running light load test...${NC}"
    # Create temporary config for light load
    node -e "
      const script = require('./scripts/stress-test.js');
      process.argv[2] = '$PRODUCTION_URL';
      // Modify config inline
    " || node scripts/stress-test.js "$PRODUCTION_URL" | sed 's/concurrentUsers: 50/concurrentUsers: 10/' | sed 's/duration: 60/duration: 30/'
    echo -e "${YELLOW}Note: For light load, edit scripts/stress-test.js and set concurrentUsers: 10, duration: 30${NC}"
    node scripts/stress-test.js "$PRODUCTION_URL"
    ;;
  4)
    echo -e "${BLUE}Running heavy load test...${NC}"
    echo -e "${YELLOW}Warning: This will generate significant load. Make sure your deployment can handle it.${NC}"
    read -p "Continue? [y/N]: " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}Note: For heavy load, edit scripts/stress-test.js and set concurrentUsers: 100, duration: 120${NC}"
      node scripts/stress-test.js "$PRODUCTION_URL"
    else
      echo "Cancelled."
      exit 0
    fi
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✅ Stress test complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the results above"
echo "2. Check Vercel dashboard for detailed metrics"
echo "3. Review server logs for any errors"
echo "4. Compare results with previous tests"

