import { describe, it, expect } from 'vitest';
import {
  computeClawbackSignature,
  verifyClawbackWebhook,
  type ClawbackWebhookPayload,
} from './clawbackValidation';

const SECRET = 'test-shared-secret';
const NOW = 1_700_000_000_000;

function makePayload(overrides: Partial<ClawbackWebhookPayload> = {}): ClawbackWebhookPayload {
  return {
    eventId: 'evt_123',
    timestamp: NOW,
    data: { account: 'GABC', amount: '100', txHash: '0xdeadbeef' },
    ...overrides,
  };
}

describe('verifyClawbackWebhook', () => {
  it('accepts a payload signed with the correct secret', () => {
    const payload = makePayload();
    const signature = computeClawbackSignature(payload, SECRET);

    const result = verifyClawbackWebhook(signature, payload, { secret: SECRET, now: () => NOW });

    expect(result.valid).toBe(true);
  });

  it('rejects a payload signed with an invalid key', () => {
    const payload = makePayload();
    const signature = computeClawbackSignature(payload, 'wrong-secret');

    const result = verifyClawbackWebhook(signature, payload, { secret: SECRET, now: () => NOW });

    expect(result).toEqual({ valid: false, reason: 'invalid-signature' });
  });

  it('rejects a tampered payload', () => {
    const payload = makePayload();
    const signature = computeClawbackSignature(payload, SECRET);
    const tampered = makePayload({ data: { account: 'GABC', amount: '999999', txHash: '0xdeadbeef' } });

    const result = verifyClawbackWebhook(signature, tampered, { secret: SECRET, now: () => NOW });

    expect(result).toEqual({ valid: false, reason: 'invalid-signature' });
  });

  it('rejects a missing signature header', () => {
    const payload = makePayload();

    const result = verifyClawbackWebhook(undefined, payload, { secret: SECRET, now: () => NOW });

    expect(result).toEqual({ valid: false, reason: 'missing-signature' });
  });

  it('rejects an expired payload', () => {
    const payload = makePayload({ timestamp: NOW - 10 * 60 * 1000 });
    const signature = computeClawbackSignature(payload, SECRET);

    const result = verifyClawbackWebhook(signature, payload, { secret: SECRET, now: () => NOW });

    expect(result).toEqual({ valid: false, reason: 'expired' });
  });

  it('rejects a malformed payload', () => {
    const payload = { eventId: 'evt_123' } as unknown as ClawbackWebhookPayload;

    const result = verifyClawbackWebhook('anything', payload, { secret: SECRET, now: () => NOW });

    expect(result).toEqual({ valid: false, reason: 'malformed-payload' });
  });
});
