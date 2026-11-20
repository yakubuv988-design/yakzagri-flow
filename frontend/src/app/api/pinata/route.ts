import { NextRequest, NextResponse } from 'next/server';

const WINDOW_MS = 60_000;
const MAX_UPLOADS_PER_WINDOW = 5;

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function consumeToken(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { tokens: MAX_UPLOADS_PER_WINDOW, lastRefill: now };

  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    const refill = (elapsed / WINDOW_MS) * MAX_UPLOADS_PER_WINDOW;
    bucket.tokens = Math.min(MAX_UPLOADS_PER_WINDOW, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens < 1) {
    buckets.set(ip, bucket);
    const msUntilToken = ((1 - bucket.tokens) / MAX_UPLOADS_PER_WINDOW) * WINDOW_MS;
    return { allowed: false, retryAfter: Math.max(1, Math.ceil(msUntilToken / 1000)) };
  }

  bucket.tokens -= 1;
  buckets.set(ip, bucket);
  return { allowed: true, retryAfter: 0 };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed, retryAfter } = consumeToken(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many upload requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    return NextResponse.json({ error: 'Pinata is not configured.' }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file.' }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append('file', file, file.name);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${pinataJwt}` },
    body: upstream,
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to upload to IPFS.' }, { status: 502 });
  }

  const data = (await response.json()) as { IpfsHash?: string };
  return NextResponse.json({ ipfsHash: data.IpfsHash });
}
