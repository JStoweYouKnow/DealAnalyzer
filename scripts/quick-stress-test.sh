#!/bin/bash

# Quick Stress Test using Apache Bench
# Usage: ./scripts/quick-stress-test.sh <base-url>
# Example: ./scripts/quick-stress-test.sh https://your-app.vercel.app

BASE_URL=${1:-"http://localhost:3002"}
REQUESTS=1000
CONCURRENCY=50

echo "🚀 Quick Stress Test - Apache Bench"
echo "=================================="
echo "Base URL: $BASE_URL"
echo "Requests: $REQUESTS"
echo "Concurrency: $CONCURRENCY"
echo ""

# Test Health Endpoint
echo "1️⃣ Testing Health Endpoint..."
ab -n $REQUESTS -c $CONCURRENCY "$BASE_URL/api/health" 2>&1 | grep -E "(Requests per second|Time per request|Failed requests|Non-2xx responses)"
echo ""

# Test Criteria Endpoint
echo "2️⃣ Testing Criteria Endpoint..."
ab -n 500 -c 25 "$BASE_URL/api/criteria" 2>&1 | grep -E "(Requests per second|Time per request|Failed requests|Non-2xx responses)"
echo ""

# Test Market Stats Endpoint
echo "3️⃣ Testing Market Stats Endpoint..."
ab -n 500 -c 25 "$BASE_URL/api/market/cached-stats" 2>&1 | grep -E "(Requests per second|Time per request|Failed requests|Non-2xx responses)"
echo ""

echo "✅ Stress test complete!"

