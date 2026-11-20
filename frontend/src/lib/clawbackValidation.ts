import { createHmac, timingSafeEqual } from 'crypto';

export interface ClawbackWebhookPayload {
  /** Event identifier from the on-chain clawback notification. */
  eventId: string;
  /** Unix epoch milliseconds when the notification was produced. */
  timestamp: number;
  /** Arbitrary notification body (account, amount, tx hash, etc.). */
  data: Record<string, unknown>;
}

export interface VerifyClawbackWebhookOptions {
  /** Shared secret used to compute the HMAC-SHA256 signature. */
  secret: string;
  /** Maximum allowed age of a notification in milliseconds. Defaults to 5 minutes. */
  maxAgeMs?: number;
  /** Injectable clock for deterministic testing. Defaults to Date.now. */
  now?: () => number;
}

export type ClawbackWebhookVerificationResult =
  | { valid: true; payload: ClawbackWebhookPayload }
  | { valid: false; reason: 'missing-signature' | 'invalid-signature' | 'expired' | 'malformed-payload' };

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Compute the canonical HMAC-SHA256 signature for a clawback webhook payload.
 * The signed message binds the timestamp and event id to the body so that
 * neither can be tampered with independently.
 */
export function computeClawbackSignature(payload: ClawbackWebhookPayload, secret: string): string {
  const message = `${payload.timestamp}.${payload.eventId}.${JSON.stringify(payload.data)}`;
  return createHmac('sha256', secret).update(message).digest('hex');
}

function timingSafeHexEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify an incoming clawback webhook notification.
 *
 * Validates the `X-Signature-SHA256` header against the shared secret using a
 * timing-safe comparison, and rejects payloads that are expired (older than
 * `maxAgeMs`) or whose signature does not match (tampered payloads).
 */
export function verifyClawbackWebhook(
  signature: string | null | undefined,
  payload: ClawbackWebhookPayload,
  options: VerifyClawbackWebhookOptions,
): ClawbackWebhookVerificationResult {
  if (!signature) {
    return { valid: false, reason: 'missing-signature' };
  }

  if (
    !payload ||
    typeof payload.eventId !== 'string' ||
    typeof payload.timestamp !== 'number' ||
    !Number.isFinite(payload.timestamp) ||
    typeof payload.data !== 'object' ||
    payload.data === null
  ) {
    return { valid: false, reason: 'malformed-payload' };
  }

  const expected = computeClawbackSignature(payload, options.secret);
  if (!timingSafeHexEqual(signature, expected)) {
    return { valid: false, reason: 'invalid-signature' };
  }

  const now = options.now ? options.now() : Date.now();
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  if (now - payload.timestamp > maxAgeMs) {
    return { valid: false, reason: 'expired' };
  }

  return { valid: true, payload };
}
