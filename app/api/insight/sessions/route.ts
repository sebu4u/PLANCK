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

    const problemIdParam = new URL(req.url).searchParams.get('problemId');
    const problemId =
      typeof problemIdParam === 'string' && problemIdParam.trim()
        ? problemIdParam.trim().slice(0, 128)
        : null;

    const lessonIdParam = new URL(req.url).searchParams.get('lessonId');
    const lessonId =
      typeof lessonIdParam === 'string' && lessonIdParam.trim()
        ? lessonIdParam.trim().slice(0, 128)
        : null;

    let query = supabase
      .from('insight_chat_sessions')
      .select('id, title, created_at, updated_at, last_message_at, problem_id, lesson_id')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });

    if (problemId) {
      query = query.eq('problem_id', problemId);
    }
    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    const { data, error } = await query;

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
    const { title, problemId: rawProblemId, lessonId: rawLessonId } = body || {};
    const problemId =
      typeof rawProblemId === 'string' && rawProblemId.trim()
        ? rawProblemId.trim().slice(0, 128)
        : null;
    const lessonId =
      typeof rawLessonId === 'string' && rawLessonId.trim()
        ? rawLessonId.trim().slice(0, 128)
        : null;

    const insertPayload: {
      user_id: string;
      title: string;
      problem_id?: string;
      lesson_id?: string;
    } = {
      user_id: user.id,
      title: title ? String(title).slice(0, 80) : 'Nou chat',
    };
    if (problemId) {
      insertPayload.problem_id = problemId;
    }
    if (lessonId) {
      insertPayload.lesson_id = lessonId;
    }

    const { data, error } = await supabase
      .from('insight_chat_sessions')
      .insert(insertPayload)
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
