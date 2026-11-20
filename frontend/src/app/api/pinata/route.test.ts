import { NextRequest } from 'next/server';
import { POST } from './route';

function makeRequest(ip: string): NextRequest {
  return new NextRequest('http://localhost/api/pinata', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
  });
}

describe('POST /api/pinata rate limiting', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('allows up to 5 requests per IP per minute', async () => {
    const ip = '203.0.113.10';
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest(ip));
      expect(res.status).not.toBe(429);
    }
  });

  it('returns 429 with Retry-After header when limit exceeded', async () => {
    const ip = '203.0.113.20';
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest(ip));
    }

    const res = await POST(makeRequest(ip));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('tracks limits independently per IP', async () => {
    const limitedIp = '203.0.113.30';
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest(limitedIp));
    }
    const limited = await POST(makeRequest(limitedIp));
    expect(limited.status).toBe(429);

    const otherIp = '203.0.113.31';
    const other = await POST(makeRequest(otherIp));
    expect(other.status).not.toBe(429);
  });
});
