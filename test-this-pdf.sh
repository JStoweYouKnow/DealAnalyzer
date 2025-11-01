#!/bin/bash

# Quick test script for the uploaded PDF
# Usage: ./test-this-pdf.sh "path/to/pdf"

PDF_FILE="${1:-Agent-Detail-Short (1).pdf}"

if [ ! -f "$PDF_FILE" ]; then
    echo "❌ Error: PDF file not found: \"$PDF_FILE\""
    echo "Usage: $0 <path-to-pdf>"
    exit 1
fi

echo "🔍 Testing PDF upload..."
echo "File: \"$PDF_FILE\""
echo "Size: $(du -h "$PDF_FILE" | cut -f1)"
echo ""
echo "Sending to: http://localhost:3002/api/analyze-file"
echo ""

# Create temporary files for status and body
BODY_TMP=$(mktemp)
STATUS_TMP=$(mktemp)

# Cleanup function to remove temp files
cleanup() {
    rm -f "$BODY_TMP" "$STATUS_TMP"
}
trap cleanup EXIT

# Upload the PDF - write body to temp file, status code to another temp file
curl -sS \
    -o "$BODY_TMP" \
    -w '%{http_code}' \
    --connect-timeout 5 \
    --max-time 30 \
    -X POST http://localhost:3002/api/analyze-file \
    -F "file=@${PDF_FILE}" \
    -F "fundingSource=conventional" \
    > "$STATUS_TMP"

# Read HTTP status and body from temp files
HTTP_STATUS=$(cat "$STATUS_TMP")
BODY=$(cat "$BODY_TMP")

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
