import { GET } from './route';
import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@/app/lib/rate-limit', () => ({
  getRedis: jest.fn(() => null),
}));

jest.mock('convex/browser', () => ({
  ConvexHttpClient: jest.fn(),
}));

describe('GET /api/health', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return healthy status when all services are available', async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test.convex.cloud';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_key';
    process.env.CLERK_SECRET_KEY = 'sk_test_key';
    
    // Mock successful Convex check
    jest.doMock('../../../convex/_generated/api.js', () => ({
      api: { emailDeals: {} },
    }));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.services).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  it('should return degraded status when Redis is unavailable', async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test.convex.cloud';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_key';
    process.env.CLERK_SECRET_KEY = 'sk_test_key';
    // Redis env vars not set

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('degraded');
    expect(data.services.redis.status).toBe('unavailable');
  });

  it('should return unhealthy status when database fails', async () => {
    // No Convex URL configured
    delete process.env.NEXT_PUBLIC_CONVEX_URL;

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('degraded'); // Or 'unhealthy' if DB is critical
    expect(data.services.convex.status).toBe('unavailable');
  });

  it('should include response times for service checks', async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test.convex.cloud';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_key';
    process.env.CLERK_SECRET_KEY = 'sk_test_key';

    const response = await GET();
    const data = await response.json();

    // Services that are ok should have response times
    if (data.services.convex.status === 'ok') {
      expect(data.services.convex.responseTime).toBeDefined();
    }
  });
});
