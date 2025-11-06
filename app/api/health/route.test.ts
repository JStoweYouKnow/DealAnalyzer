import { GET } from './route';
import { NextRequest } from 'next/server';

describe('GET /api/health', () => {
  it('should return 200 with status ok', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET();

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  it('should return valid ISO timestamp', async () => {
    const response = await GET();
    const data = await response.json();

    // Check if timestamp is valid ISO string
    const timestamp = new Date(data.timestamp);
    const ms = timestamp.getTime();
    expect(Number.isFinite(ms)).toBe(true);
  });
});

