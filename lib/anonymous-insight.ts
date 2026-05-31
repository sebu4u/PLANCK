import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const ANONYMOUS_INSIGHT_COOKIE = 'planck_insight_anon';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidAnonymousId(value: string | undefined | null): value is string {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

export function parseAnonymousIdFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (name === ANONYMOUS_INSIGHT_COOKIE && isValidAnonymousId(val)) {
      return val;
    }
  }
  return null;
}

function deriveStableAnonymousId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  const ua = req.headers.get('user-agent') || '';
  const pepper =
    process.env.ANONYMOUS_INSIGHT_ID_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'planck-anon-dev-pepper';

  const digest = createHash('sha256').update(`${ip}\0${ua}\0${pepper}`).digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function resolveAnonymousIdentity(req: NextRequest): {
  anonymousId: string;
  /** When true, response must Set-Cookie this id */
  isNewAnonymousId: boolean;
} {
  const existing = parseAnonymousIdFromCookieHeader(req.headers.get('cookie'));
  if (existing) {
    return { anonymousId: existing, isNewAnonymousId: false };
  }

  return { anonymousId: deriveStableAnonymousId(req), isNewAnonymousId: true };
}

export function buildAnonymousInsightCookieHeader(anonymousId: string): string {
  const secure = process.env.NODE_ENV === 'production';
  const maxAge = 60 * 60 * 24 * 365;
  const parts = [
    `${ANONYMOUS_INSIGHT_COOKIE}=${anonymousId}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function nextUtcMidnightIso(): string {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next.toISOString();
}
