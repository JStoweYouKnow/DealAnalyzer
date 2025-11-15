# Stress Test Guide for DealAnalyzer

This guide helps you stress test your live deployment to verify performance, stability, and error handling under load.

## Quick Start

### 1. Get Your Production URL

Find your Vercel deployment URL:
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Select your DealAnalyzer project
- Copy the production URL (e.g., `https://deal-analyzer.vercel.app`)

### 2. Run Stress Test

**Option A: Using Node.js Script (Recommended)**
```bash
# Test production deployment
npm run stress-test https://your-app.vercel.app

# Test local deployment
npm run stress-test:local
```

**Option B: Using Apache Bench (Simple)**
```bash
# Test health endpoint
ab -n 1000 -c 50 https://your-app.vercel.app/api/health

# Test criteria endpoint
ab -n 500 -c 25 https://your-app.vercel.app/api/criteria

# Test market stats endpoint
ab -n 500 -c 25 https://your-app.vercel.app/api/market/cached-stats
```

## Test Configuration

### Current Settings
- **Concurrent Users**: 50
- **Duration**: 60 seconds
- **Ramp Up Time**: 10 seconds
- **Request Timeout**: 30 seconds

### Endpoints Tested
1. `/api/health` - Health check (weight: 10)
2. `/api/criteria` - Get investment criteria (weight: 8)
3. `/api/market/cached-stats` - Market statistics (weight: 7)
4. `/api/history` - Analysis history (weight: 5)
5. `/api/email-deals` - Email deals (weight: 5)
6. `/api/user/notifications` - User notifications (weight: 3)

## Expected Results

### Good Performance
- ✅ Success rate: > 99%
- ✅ Average response time: < 1000ms
- ✅ P95 response time: < 2000ms
- ✅ P99 response time: < 5000ms
- ✅ Requests per second: > 10

### Fair Performance
- ⚠️ Success rate: 95-99%
- ⚠️ Average response time: 1000-2000ms
- ⚠️ P95 response time: 2000-5000ms

### Poor Performance (Needs Attention)
- ❌ Success rate: < 95%
- ❌ Average response time: > 2000ms
- ❌ High error rate
- ❌ Timeout errors

## Monitoring During Test

### Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to **Analytics** or **Logs**
3. Monitor:
   - Request count
   - Response times
   - Error rates
   - Function invocations

### What to Watch For
- **High error rates**: Check for rate limiting, timeouts, or API failures
- **Slow response times**: Identify bottleneck endpoints
- **Memory issues**: Watch for function memory limits
- **Timeout errors**: Check for long-running operations

## Advanced Testing

### Load Profile Tests

**Light Load (10 concurrent users)**
```bash
# Edit scripts/stress-test.js
config.concurrentUsers = 10;
config.duration = 30;
```

**Heavy Load (100 concurrent users)**
```bash
# Edit scripts/stress-test.js
config.concurrentUsers = 100;
config.duration = 120;
```

**Spike Test (Sudden load increase)**
```bash
# Edit scripts/stress-test.js
config.rampUpTime = 2; // Quick ramp up
config.concurrentUsers = 200;
```

### Endpoint-Specific Tests

**Test Analysis Endpoint**
```bash
# This is expensive - use fewer requests
ab -n 50 -c 5 -p test-data.json -T application/json \
  https://your-app.vercel.app/api/analyze
```

**Test Market Data Endpoint**
```bash
# Test with different cities
for city in "Austin" "Dallas" "Phoenix"; do
  ab -n 100 -c 10 \
    "https://your-app.vercel.app/api/market/cached-stats?city=$city"
done
```

## Interpreting Results

### Response Time Metrics
- **Average**: Overall system performance
- **Median**: Typical user experience
- **P95**: 95% of requests are faster than this
- **P99**: 99% of requests are faster than this (worst case)

### Status Codes
- **200**: Success
- **401**: Authentication required (expected for protected routes)
- **429**: Rate limited (check rate limiting configuration)
- **500**: Server error (investigate)
- **502/503**: Service unavailable (check deployment status)

### Error Types
- **Timeout**: Request took too long (increase timeout or optimize)
- **Connection Error**: Network issues or service down
- **Rate Limit**: Too many requests (adjust rate limits)

## Troubleshooting

### High Error Rates
1. Check Vercel logs for specific errors
2. Verify environment variables are set
3. Check external API rate limits
4. Review database connection limits

### Slow Response Times
1. Check which endpoints are slowest
2. Review database query performance
3. Check external API response times
4. Consider caching for frequently accessed data

### Rate Limiting Issues
1. Review rate limiting configuration
2. Adjust limits if too restrictive
3. Implement request queuing if needed

## Next Steps After Testing

1. **Document Results**: Save test results for comparison
2. **Identify Bottlenecks**: Focus on slowest endpoints
3. **Optimize**: Implement caching, optimize queries
4. **Re-test**: Verify improvements with another test
5. **Monitor**: Set up ongoing monitoring in production

## Safety Notes

⚠️ **Important**: 
- Start with light load tests first
- Monitor your deployment during tests
- Be aware of Vercel function limits
- Don't overwhelm external APIs
- Use staging environment for heavy tests if available

