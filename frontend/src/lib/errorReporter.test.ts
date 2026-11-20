import { describe, it, expect } from 'vitest';
import { sanitizeErrorPayload, REDACTED } from './errorReporter';

describe('sanitizeErrorPayload', () => {
  it('redacts authorization headers from error payloads', () => {
    const payload = {
      message: 'Request failed',
      headers: {
        Authorization: 'Bearer sk_live_abc123',
        'content-type': 'application/json',
      },
    };

    const result = sanitizeErrorPayload(payload);

    expect(result.headers.Authorization).toBe(REDACTED);
    expect(result.headers['content-type']).toBe('application/json');
    expect(JSON.stringify(result)).not.toContain('sk_live_abc123');
  });

  it('redacts bearer tokens embedded in strings', () => {
    const payload = { message: 'Auth failed with Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig' };

    const result = sanitizeErrorPayload(payload);

    expect(result.message).toContain(REDACTED);
    expect(result.message).not.toContain('eyJhbGciOiJIUzI1NiJ9');
  });

  it('redacts session cookies and secret key fields', () => {
    const payload = {
      cookie: 'session=abc123; token=xyz',
      apiKey: 'super-secret-key',
      nested: { privateKey: '-----BEGIN PRIVATE KEY-----abc-----END PRIVATE KEY-----' },
    };

    const result = sanitizeErrorPayload(payload);

    expect(result.cookie).toBe(REDACTED);
    expect(result.apiKey).toBe(REDACTED);
    expect(result.nested.privateKey).toBe(REDACTED);
  });

  it('leaves non-sensitive fields untouched', () => {
    const payload = { message: 'ok', status: 500, url: 'https://example.com/api' };

    const result = sanitizeErrorPayload(payload);

    expect(result).toEqual(payload);
  });
});
