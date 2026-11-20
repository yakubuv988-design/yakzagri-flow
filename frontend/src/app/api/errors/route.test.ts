import { NextRequest } from 'next/server';
import { POST } from './route';

const APP_ORIGIN = 'https://app.example.com';

function makeRequest(headers: Record<string, string>, body: unknown = { message: 'boom' }) {
  return new NextRequest('https://app.example.com/api/errors', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/errors origin verification', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = APP_ORIGIN;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    }
  });

  it('allows requests with a matching Origin header', async () => {
    const res = await POST(makeRequest({ origin: APP_ORIGIN }));
    expect(res.status).not.toBe(403);
  });

  it('allows requests with a matching Referer when Origin is absent', async () => {
    const res = await POST(makeRequest({ referer: `${APP_ORIGIN}/dashboard` }));
    expect(res.status).not.toBe(403);
  });

  it('rejects cross-origin requests with 403 Forbidden', async () => {
    const res = await POST(makeRequest({ origin: 'https://evil.example.com' }));
    expect(res.status).toBe(403);
  });

  it('rejects requests with a mismatched Referer when Origin is absent', async () => {
    const res = await POST(makeRequest({ referer: 'https://evil.example.com/attack' }));
    expect(res.status).toBe(403);
  });
});
