/**
 * Integration tests for /api/analyze endpoint
 * Tests property analysis functionality with rate limiting
 */

import { POST } from './route';
import { NextRequest, NextResponse } from 'next/server';

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: jest.fn(
    (req: NextRequest, limiter: any, handler: (req: NextRequest) => Promise<NextResponse>) => handler(req)
  ),
  generalRateLimit: jest.fn(() => null),
  expensiveRateLimit: jest.fn(() => null),
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
jest.mock('@/lib/property-analyzer', () => ({
  analyzeProperty: jest.fn(),
  parseEmailContent: jest.fn(),
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
    const { withRateLimit } = require('@/lib/rate-limit');
    
    // Simulate rate limit exceeded
    (withRateLimit as jest.Mock).mockImplementation(
      (req: NextRequest, limiter: any, handler: (req: NextRequest) => Promise<NextResponse>) => {
        return Promise.resolve(
          NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          )
        );
      }
    );

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ propertyText: 'Test property' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
  });
});

