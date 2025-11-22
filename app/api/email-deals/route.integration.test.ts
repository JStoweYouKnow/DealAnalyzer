/**
 * Integration tests for /api/email-deals endpoint
 * These tests verify the endpoint works with authentication and storage
 */

import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

// Type for auth return value - matches what Clerk's auth() returns
type AuthResult = {
  userId: string | null;
  sessionId?: string | null;
  orgId?: string | null;
} & Record<string, unknown>;

// Mock storage
jest.mock('../../../server/storage', () => ({
  storage: {
    getEmailDeals: jest.fn(),
  },
}));

import { auth } from '@clerk/nextjs/server';
import { storage } from '../../../server/storage';

describe('GET /api/email-deals - Integration Tests', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockGetEmailDeals = storage.getEmailDeals as jest.MockedFunction<typeof storage.getEmailDeals>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test.convex.cloud';
  });

  it('should return 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);

    const request = new NextRequest('http://localhost:3000/api/email-deals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
    expect(mockGetEmailDeals).not.toHaveBeenCalled();
  });

  it('should return email deals for authenticated user', async () => {
    const userId = 'user_123';
    const mockDeals = [
      {
        id: 'deal_1',
        subject: 'Test Deal',
        sender: 'test@example.com',
        receivedDate: new Date(),
        emailContent: 'Test content',
        status: 'new' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockAuth.mockResolvedValue({ userId } as any);
    mockGetEmailDeals.mockResolvedValue(mockDeals);

    const request = new NextRequest('http://localhost:3000/api/email-deals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockDeals);
    expect(mockGetEmailDeals).toHaveBeenCalled();
  });

  it('should return empty array when Convex URL is not configured', async () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;

    const request = new NextRequest('http://localhost:3000/api/email-deals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(mockGetEmailDeals).not.toHaveBeenCalled();
  });

  it('should handle storage errors gracefully', async () => {
    const userId = 'user_123';
    mockAuth.mockResolvedValue({ userId } as any);
    mockGetEmailDeals.mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/email-deals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
    expect(data.error).toContain('Failed to get email deals');
  });

  it('should return empty array for Convex-related errors', async () => {
    const userId = 'user_123';
    mockAuth.mockResolvedValue({ userId } as any);
    mockGetEmailDeals.mockRejectedValue(new Error('CONVEX_API_ERROR: Connection failed'));

    const request = new NextRequest('http://localhost:3000/api/email-deals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });
});

