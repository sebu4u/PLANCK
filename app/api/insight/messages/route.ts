import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithToken } from '@/lib/supabaseServer';
import { isJwtExpired } from '@/lib/auth-validate';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const tokenMatch = authHeader.match(/^Bearer (.+)$/i);
    if (!tokenMatch) {
      return NextResponse.json({ error: 'Necesită autentificare.' }, { status: 401 });
    }
    const accessToken = tokenMatch[1];

    if (isJwtExpired(accessToken)) {
      return NextResponse.json({ error: 'Sesiune expirată.' }, { status: 401 });
    }

    const supabase = createServerClientWithToken(accessToken);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Sesiune invalidă.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'Parametru lipsă.' }, { status: 400 });
    }

    // RLS will ensure user can only access their own sessions
    const { data, error } = await supabase
      .from('insight_chat_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch messages:', error);
      return NextResponse.json({ error: 'Nu am putut încărca mesajele.' }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err: any) {
    logger.error('Messages API error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}

