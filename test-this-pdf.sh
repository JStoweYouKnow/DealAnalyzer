#!/bin/bash

# Quick test script for the uploaded PDF
# Usage: ./test-this-pdf.sh "path/to/pdf"

PDF_FILE="${1:-Agent-Detail-Short (1).pdf}"

if [ ! -f "$PDF_FILE" ]; then
    echo "❌ Error: PDF file not found: $PDF_FILE"
    echo "Usage: $0 <path-to-pdf>"
    exit 1
fi

echo "🔍 Testing PDF upload..."
echo "File: $PDF_FILE"
echo "Size: $(du -h "$PDF_FILE" | cut -f1)"
echo ""
echo "Sending to: http://localhost:3002/api/analyze-file"
echo ""

# Upload the PDF
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST http://localhost:3002/api/analyze-file \
    -F "file=@$PDF_FILE" \
    -F "fundingSource=conventional")

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Status Code: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Success!"
    echo ""
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo "❌ Error Response:"
    echo "$BODY"
fi
