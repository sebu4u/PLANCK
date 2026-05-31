import { NextRequest, NextResponse } from 'next/server';
import { isJwtExpired } from '@/lib/auth-validate';
import { logger } from '@/lib/logger';

/**
 * Legacy endpoint kept for backward compatibility with older clients.
 * Quota is reserved atomically at the start of POST /api/insight/chat,
 * so manual stop / abort must not increment again.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const tokenMatch = authHeader.match(/^Bearer (.+)$/i);

    if (tokenMatch) {
      const accessToken = tokenMatch[1];
      if (isJwtExpired(accessToken)) {
        return NextResponse.json({ error: 'Sesiune expirată.' }, { status: 401 });
      }
    }

    logger.debug('Insight increment endpoint called (no-op; quota reserved at chat start)');
    return NextResponse.json({ success: true, incremented: false });
  } catch (err: unknown) {
    logger.error('Increment API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă la incrementarea consumului.' },
      { status: 500 }
    );
  }
}
