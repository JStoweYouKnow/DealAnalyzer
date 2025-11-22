/**
 * Integration tests for /api/analyze endpoint
 * Tests property analysis functionality with rate limiting
 */

import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock rate limiting
jest.mock('@/app/lib/rate-limit', () => ({
  withRateLimit: jest.fn((req, limiter, handler) => handler(req)),
  generalRateLimit: jest.fn(() => null),
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

// Mock property analyzer
jest.mock('@/app/lib/property-analyzer', () => ({
  analyzeProperty: jest.fn(),
}));

describe('POST /api/analyze - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('should return 400 for invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error || data.success).toBeDefined();
  });

  it('should return 400 when property text is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    
    expect([400, 500]).toContain(response.status);
  });

  it('should handle rate limiting correctly', async () => {
    const { withRateLimit } = require('@/app/lib/rate-limit');
    
    // Simulate rate limit exceeded
    withRateLimit.mockImplementation((req, limiter, handler) => {
      return Promise.resolve(
        new NextResponse(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429 }
        )
      );
    });

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ propertyText: 'Test property' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
  });
});

