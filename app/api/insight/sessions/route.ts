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
    const user = userData.user;

    const { data, error } = await supabase
      .from('insight_chat_sessions')
      .select('id, title, created_at, updated_at, last_message_at')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false, nullsLast: true })
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch sessions:', error);
      return NextResponse.json({ error: 'Nu am putut lista sesiunile.' }, { status: 500 });
    }

    // Filter out sessions without any messages (only keep sessions with last_message_at not null)
    const sessionsWithMessages = (data || []).filter(session => session.last_message_at !== null);

    return NextResponse.json({ sessions: sessionsWithMessages });
  } catch (err: any) {
    logger.error('Sessions API error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    const user = userData.user;

    const body = await req.json();
    const { title } = body || {};

    const { data, error } = await supabase
      .from('insight_chat_sessions')
      .insert({
        user_id: user.id,
        title: title ? title.slice(0, 80) : 'Nou chat',
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to create session:', error);
      return NextResponse.json({ error: 'Nu am putut crea sesiunea.' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: data?.id });
  } catch (err: any) {
    logger.error('Create session API error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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
    const user = userData.user;

    const body = await req.json();
    const { sessionId, title } = body || {};

    if (!sessionId || !title) {
      return NextResponse.json({ error: 'Date lipsă.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('insight_chat_sessions')
      .update({ title: title.slice(0, 80) })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to update session:', error);
      return NextResponse.json({ error: 'Nu am putut redenumi sesiunea.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error('Update session API error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
    const user = userData.user;

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'Parametru lipsă.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('insight_chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to delete session:', error);
      return NextResponse.json({ error: 'Nu am putut șterge sesiunea.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error('Delete session API error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}

