#!/bin/bash
# Script to update REDIS_URL in Vercel production environment
#
# This script removes the existing REDIS_URL (which has quotes) and adds it back without quotes
#
# Usage: bash fix-vercel-redis.sh

set -e

echo "Linking to Vercel project..."
# Use a valid project name (lowercase, no spaces, no triple dashes)
# If the project doesn't exist, it will be created with this name
vercel link --yes --project comfort-finder-analyzer

echo ""
echo "Removing old REDIS_URL from production..."
vercel env rm REDIS_URL production --yes || echo "No existing REDIS_URL found, continuing..."

echo ""
echo "Adding new REDIS_URL to production (without quotes)..."
echo 'redis://default:3Zn8iolThlmnRWVYzl4UnsR1igp1XksL@redis-13583.c274.us-east-1-3.ec2.cloud.redislabs.com:13583' | vercel env add REDIS_URL production

echo ""
echo "✅ REDIS_URL updated successfully!"
echo ""
echo "Now trigger a redeploy:"
echo "  vercel --prod"
echo ""
echo "Or go to https://vercel.com/dashboard and redeploy the latest deployment"
