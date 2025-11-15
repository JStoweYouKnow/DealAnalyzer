#!/usr/bin/env node

/**
 * Stress Test Script for DealAnalyzer API
 * 
 * Tests the live deployment with concurrent requests to verify:
 * - Response times
 * - Error rates
 * - Rate limiting effectiveness
 * - System stability under load
 * 
 * Usage:
 *   node scripts/stress-test.js <base-url>
 * 
 * Example:
 *   node scripts/stress-test.js https://your-app.vercel.app
 */

const baseUrl = process.argv[2] || 'http://localhost:3002';

// Test endpoints configuration
const endpoints = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/health',
    weight: 10, // Higher weight = more requests
    public: true,
  },
  {
    name: 'Get Criteria',
    method: 'GET',
    path: '/api/criteria',
    weight: 8,
    public: false, // May require auth
  },
  {
    name: 'Market Cached Stats',
    method: 'GET',
    path: '/api/market/cached-stats',
    weight: 7,
    public: true,
  },
  {
    name: 'Analysis History',
    method: 'GET',
    path: '/api/history',
    weight: 5,
    public: false,
    requiresAuth: true,
  },
  {
    name: 'Email Deals',
    method: 'GET',
    path: '/api/email-deals',
    weight: 5,
    public: false,
    requiresAuth: true,
  },
  {
    name: 'User Notifications',
    method: 'GET',
    path: '/api/user/notifications',
    weight: 3,
    public: false,
    requiresAuth: true,
  },
];

// Test configuration
const config = {
  concurrentUsers: 50,
  duration: 60, // seconds
  rampUpTime: 10, // seconds to ramp up to full load
  timeout: 30000, // 30 seconds
};

// Statistics
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  errors: {},
  responseTimes: [],
  statusCodes: {},
};

// Build weighted endpoint list
function buildEndpointList(publicOnly = false) {
  const list = [];
  endpoints.forEach(endpoint => {
    // Skip auth-required endpoints if publicOnly is true
    if (publicOnly && (endpoint.requiresAuth || !endpoint.public)) {
      return;
    }
    for (let i = 0; i < endpoint.weight; i++) {
      list.push(endpoint);
    }
  });
  return list;
}

// Use public endpoints only by default to get accurate success rates
const publicOnly = process.argv.includes('--public-only') || true;
const endpointList = buildEndpointList(publicOnly);

// Make a single request
async function makeRequest(endpoint) {
  const startTime = Date.now();
  const url = `${baseUrl}${endpoint.path}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    const options = {
      method: endpoint.method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Add auth header if needed (you'll need to get a valid token)
    if (endpoint.requiresAuth) {
      // For now, skip auth endpoints or add token here
      // options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    // Update statistics
    stats.totalRequests++;
    stats.responseTimes.push(responseTime);
    
    if (response.ok) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
      const status = response.status;
      stats.statusCodes[status] = (stats.statusCodes[status] || 0) + 1;
    }
    
    // Track status codes
    const status = response.status;
    stats.statusCodes[status] = (stats.statusCodes[status] || 0) + 1;
    
    // Read response body to ensure full request completes
    await response.text().catch(() => {});
    
    return {
      success: response.ok,
      status: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    stats.totalRequests++;
    stats.failedRequests++;
    
    const errorType = error.name || 'Unknown';
    stats.errors[errorType] = (stats.errors[errorType] || 0) + 1;
    
    return {
      success: false,
      error: error.message,
      responseTime,
    };
  }
}

// Run a single user session
async function runUserSession(userId) {
  const startTime = Date.now();
  const endTime = startTime + (config.duration * 1000);
  
  while (Date.now() < endTime) {
    // Select random endpoint based on weight
    const endpoint = endpointList[Math.floor(Math.random() * endpointList.length)];
    
    await makeRequest(endpoint);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Calculate statistics
function calculateStats() {
  const responseTimes = stats.responseTimes.sort((a, b) => a - b);
  const count = responseTimes.length;
  
  return {
    total: stats.totalRequests,
    successful: stats.successfulRequests,
    failed: stats.failedRequests,
    successRate: ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2) + '%',
    avgResponseTime: responseTimes.length > 0 
      ? (responseTimes.reduce((a, b) => a + b, 0) / count).toFixed(2) + 'ms'
      : 'N/A',
    minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) + 'ms' : 'N/A',
    maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) + 'ms' : 'N/A',
    medianResponseTime: responseTimes.length > 0 
      ? responseTimes[Math.floor(count / 2)] + 'ms' 
      : 'N/A',
    p95ResponseTime: responseTimes.length > 0 
      ? responseTimes[Math.floor(count * 0.95)] + 'ms' 
      : 'N/A',
    p99ResponseTime: responseTimes.length > 0 
      ? responseTimes[Math.floor(count * 0.99)] + 'ms' 
      : 'N/A',
    statusCodes: stats.statusCodes,
    errors: stats.errors,
    requestsPerSecond: (stats.totalRequests / config.duration).toFixed(2),
  };
}

// Main test function
async function runStressTest() {
  console.log('🚀 Starting Stress Test');
  console.log('='.repeat(60));
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Concurrent Users: ${config.concurrentUsers}`);
  console.log(`Duration: ${config.duration} seconds`);
  console.log(`Ramp Up Time: ${config.rampUpTime} seconds`);
  console.log('='.repeat(60));
  console.log('');
  
  const startTime = Date.now();
  
  // Ramp up users gradually
  const rampUpStep = Math.max(1, Math.floor(config.concurrentUsers / (config.rampUpTime / 2)));
  const userPromises = [];
  
  // Start users gradually with promises
  for (let i = 0; i < config.concurrentUsers; i++) {
    const delay = Math.floor((i / rampUpStep) * 2000); // 2 seconds per step
    
    const userPromise = new Promise(resolve => {
      setTimeout(async () => {
        console.log(`📈 Started user ${i + 1}/${config.concurrentUsers}`);
        await runUserSession(i);
        resolve();
      }, delay);
    });
    
    userPromises.push(userPromise);
  }
  
  // Wait for all users to complete
  await Promise.all(userPromises);
  
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  
  // Calculate and display results
  const results = calculateStats();
  
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 Stress Test Results');
  console.log('='.repeat(60));
  console.log(`Total Time: ${totalTime}s`);
  console.log(`Total Requests: ${results.total}`);
  console.log(`Successful Requests: ${results.successful}`);
  console.log(`Failed Requests: ${results.failed}`);
  console.log(`Success Rate: ${results.successRate}`);
  console.log(`Requests Per Second: ${results.requestsPerSecond}`);
  console.log('');
  console.log('⏱️  Response Times:');
  console.log(`  Average: ${results.avgResponseTime}`);
  console.log(`  Median: ${results.medianResponseTime}`);
  console.log(`  Min: ${results.minResponseTime}`);
  console.log(`  Max: ${results.maxResponseTime}`);
  console.log(`  P95: ${results.p95ResponseTime}`);
  console.log(`  P99: ${results.p99ResponseTime}`);
  console.log('');
  
  if (Object.keys(results.statusCodes).length > 0) {
    console.log('📈 Status Codes:');
    Object.entries(results.statusCodes)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .forEach(([code, count]) => {
        console.log(`  ${code}: ${count}`);
      });
    console.log('');
  }
  
  if (Object.keys(results.errors).length > 0) {
    console.log('❌ Errors:');
    Object.entries(results.errors).forEach(([error, count]) => {
      console.log(`  ${error}: ${count}`);
    });
    console.log('');
  }
  
  // Determine health status
  const successRate = parseFloat(results.successRate);
  const avgResponseTime = parseFloat(results.avgResponseTime);
  
  console.log('='.repeat(60));
  if (successRate >= 99 && avgResponseTime < 1000) {
    console.log('✅ System Health: EXCELLENT');
  } else if (successRate >= 95 && avgResponseTime < 2000) {
    console.log('✅ System Health: GOOD');
  } else if (successRate >= 90) {
    console.log('⚠️  System Health: FAIR');
  } else {
    console.log('❌ System Health: POOR - Needs Attention');
  }
  console.log('='.repeat(60));
}

// Run the test
runStressTest().catch(error => {
  console.error('❌ Stress test failed:', error);
  process.exit(1);
});

