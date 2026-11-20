/**
 * Error reporting pipeline for render exceptions caught by error boundaries.
 *
 * In production this ships structured payloads to the backend `/api/errors`
 * endpoint (same reporting channel consumed by issue #54 alerting).
 * In development and test it writes to console.error so nothing is silently
 * swallowed and no spurious network traffic is generated.
 *
 * Usage:
 *   reportBoundaryError({ error, componentStack, correlationId, route });
 */

import type { ErrorInfo } from "react";

export interface ErrorReport {
  /** The thrown error. */
  error: Error;
  /** React component stack from ErrorInfo. */
  componentStack: ErrorInfo["componentStack"];
  /** Correlation ID surfaced in the fallback UI (client or backend origin). */
  correlationId: string;
  /** window.location.pathname at the time of the crash. */
  route: string;
  /** Additional metadata callers may attach. */
  meta?: Record<string, unknown>;
}

/** Shape POSTed to /api/errors. */
interface ErrorPayload {
  correlationId: string;
  message: string;
  stack?: string;
  componentStack?: string | null;
  route: string;
  userAgent: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

const REPORT_ENDPOINT = "/api/errors";

/** Placeholder substituted for any scrubbed sensitive value. */
export const REDACTED = "[REDACTED]";

/**
 * Keys whose values are always sensitive and must be scrubbed entirely,
 * regardless of the value's shape.
 */
const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "apikey",
  "api_key",
  "secret",
  "secretkey",
  "secret_key",
  "privatekey",
  "private_key",
  "password",
  "access_token",
  "refresh_token",
  "session",
  "sessionid",
  "session_id",
]);

/**
 * Inline patterns that may appear inside free-form strings (messages, stacks,
 * URLs) and must be scrubbed even when the surrounding key is not sensitive.
 */
const INLINE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Authorization: Bearer <token>
  { pattern: /(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, replacement: `$1${REDACTED}` },
  // Basic auth credentials
  { pattern: /(Basic\s+)[A-Za-z0-9+/=]+/gi, replacement: `$1${REDACTED}` },
  // PEM private key blocks
  {
    pattern:
      /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    replacement: REDACTED,
  },
  // Cookie / Set-Cookie header values
  { pattern: /((?:set-)?cookie\s*:\s*)[^\n\r]+/gi, replacement: `$1${REDACTED}` },
  // Authorization header values
  { pattern: /(authorization\s*:\s*)[^\n\r]+/gi, replacement: `$1${REDACTED}` },
];

/** Whether a key name refers to a sensitive field. */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase().replace(/[-\s]/g, ""));
}

/** Scrub inline sensitive patterns from a free-form string. */
function scrubString(value: string): string {
  return INLINE_PATTERNS.reduce(
    (acc, { pattern, replacement }) => acc.replace(pattern, replacement),
    value,
  );
}

/**
 * Recursively sanitize an arbitrary value, replacing sensitive keys and inline
 * credential patterns with the [REDACTED] placeholder.
 */
function sanitizeValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === "string") {
    return scrubString(value);
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  // Guard against circular references in meta payloads
  if (seen.has(value)) {
    return REDACTED;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    result[key] = isSensitiveKey(key) ? REDACTED : sanitizeValue(entry, seen);
  }
  return result;
}

/**
 * Sanitize an error payload before it leaves the client, scrubbing bearer
 * tokens, private keys, session cookies, and secret key fields.
 */
export function sanitizePayload(payload: ErrorPayload): ErrorPayload {
  const seen = new WeakSet<object>();
  return {
    ...payload,
    message: scrubString(payload.message),
    stack: payload.stack ? scrubString(payload.stack) : payload.stack,
    componentStack: payload.componentStack
      ? scrubString(payload.componentStack)
      : payload.componentStack,
    route: scrubString(payload.route),
    meta: payload.meta
      ? (sanitizeValue(payload.meta, seen) as Record<string, unknown>)
      : payload.meta,
  };
}

/** Whether we are in a browser environment. */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Fire-and-forget POST to the error reporting endpoint.
 * Silently swallows network failures so the reporter never causes a
 * secondary crash.
 */
async function postReport(payload: ErrorPayload): Promise<void> {
  try {
    await fetch(REPORT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // keepalive allows the request to outlive the page in some browsers
      keepalive: true,
      body: JSON.stringify(payload),
    });
  } catch {
    // Intentionally ignored — reporter must never throw
  }
}

/**
 * Report a render exception from an error boundary.
 *
 * - In production: POSTs structured payload to REPORT_ENDPOINT.
 * - In development/test: logs to console.error only (no network).
 */
export function reportBoundaryError(report: ErrorReport): void {
  const { error, componentStack, correlationId, route, meta } = report;

  const payload: ErrorPayload = {
    correlationId,
    message: error.message,
    stack: error.stack,
    componentStack,
    route: isBrowser() ? route || window.location.pathname : route,
    userAgent: isBrowser() ? navigator.userAgent : "ssr",
    timestamp: new Date().toISOString(),
    meta,
  };

  if (process.env.NODE_ENV === "production") {
    void postReport(sanitizePayload(payload));
  } else {
    // Dev/test: surface full detail without console noise in prod
    // (next.config.ts strips console.log/info/debug in prod builds)
    console.error(
      `[ErrorBoundary] ${correlationId} @ ${payload.route}\n`,
      error,
      "\nComponent stack:",
      componentStack,
    );
  }
}
