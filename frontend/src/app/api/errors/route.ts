import { NextRequest, NextResponse } from 'next/server';
import { scrubPII } from '@/lib/analytics';

export const runtime = 'nodejs';

/**
 * Resolve the set of origins that are allowed to submit error reports.
 * Falls back to the request's own origin when no explicit configuration is
 * present, which keeps same-origin requests working in every environment.
 */
function getAllowedOrigins(request: NextRequest): string[] {
  const configured = process.env.ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
  const origins = configured
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    origins.push(request.nextUrl.origin);
  }

  return origins;
}

/**
 * Verify that a state-mutating request originates from an allowed domain by
 * checking the `Origin` header, falling back to `Referer` when absent.
 */
function isAllowedOrigin(request: NextRequest): boolean {
  const allowed = getAllowedOrigins(request);
  const origin = request.headers.get('origin');

  if (origin) {
    return allowed.includes(origin);
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return allowed.includes(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  // No Origin/Referer header at all: reject to be safe.
  return false;
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'forbidden_origin' }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const scrubbed = scrubPII(payload);

  // Sink for client-side error reports. Log server-side so reports are
  // actually received instead of being silently 404'd.
  console.error('[client-error]', JSON.stringify(scrubbed));

  return NextResponse.json({ ok: true }, { status: 202 });
}
