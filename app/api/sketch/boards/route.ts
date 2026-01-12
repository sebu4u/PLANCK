import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithToken } from '@/lib/supabaseServer';
import { isJwtExpired } from '@/lib/auth-validate';
import { logger } from '@/lib/logger';
import { parseAccessToken, resolvePlanForRequest } from '@/lib/subscription-plan-server';
import { isPaidPlan } from '@/lib/subscription-plan';

const FREE_PLAN_BOARD_LIMIT =
  Number(process.env.FREE_PLAN_BOARD_LIMIT ?? process.env.NEXT_PUBLIC_FREE_PLAN_BOARD_LIMIT ?? '3') || 3;

// POST - Create new board (requires authentication)
export async function POST(req: NextRequest) {
  try {
    // Extract Bearer token
    const authHeader = req.headers.get('authorization') || '';
    const tokenMatch = authHeader.match(/^Bearer (.+)$/i);
    if (!tokenMatch) {
      return NextResponse.json(
        { error: 'Necesită autentificare.' },
        { status: 401 }
      );
    }
    const accessToken = tokenMatch[1];

    // Check if token is expired
    if (isJwtExpired(accessToken)) {
      return NextResponse.json(
        { error: 'Sesiune expirată.' },
        { status: 401 }
      );
    }

    // Validate token with Supabase - pass JWT explicitly for server-side validation
    // getUser() without params looks for session in storage, which doesn't exist on server
    // getUser(jwt) validates the JWT directly against Supabase Auth
    const supabase = createServerClientWithToken(accessToken);
    console.log('[Boards API] Validating token, length:', accessToken?.length);
    const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
    console.log('[Boards API] getUser result:', {
      hasUser: !!userData?.user,
      userId: userData?.user?.id,
      error: userErr?.message || userErr,
      errorStatus: (userErr as any)?.status
    });
    if (userErr || !userData?.user) {
      logger.error('[Boards API] Auth validation failed:', { error: userErr, hasUserData: !!userData });
      return NextResponse.json(
        { error: 'Sesiune invalidă.' },
        { status: 401 }
      );
    }
    const user = userData.user;

    const body = await req.json();
    const { title, roomId } = body || {};

    // Resolve user plan using the same logic as catalog problems
    const userPlan = await resolvePlanForRequest(supabase, accessToken);
    const userHasPaidPlanValue = isPaidPlan(userPlan);

    // Only check limit for free plan users (not for plus/premium)
    if (!userHasPaidPlanValue && FREE_PLAN_BOARD_LIMIT > 0) {
      const { count, error: countError } = await supabase
        .from('sketch_boards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        logger.error('Failed to count boards:', countError);
        return NextResponse.json(
          { error: 'Nu am putut verifica numărul de table existente.' },
          { status: 500 }
        );
      }

      if ((count ?? 0) >= FREE_PLAN_BOARD_LIMIT) {
        return NextResponse.json(
          {
            error: `Ai atins limita de ${FREE_PLAN_BOARD_LIMIT} table pe planul Free. Șterge una existentă pentru a crea alta.`,
          },
          { status: 403 }
        );
      }
    }

    // Generate room ID for PartyKit if not provided
    const generatedRoomId = roomId || (Date.now().toString(36) + Math.random().toString(36).substring(2, 8));

    const { data, error } = await supabase
      .from('sketch_boards')
      .insert({
        user_id: user.id,
        title: title || 'Untitled',
        is_public: true,
        room_id: generatedRoomId,
      })
      .select('id, title, share_token, created_at, room_id')
      .single();

    if (error) {
      logger.error('Failed to create board:', error);
      return NextResponse.json(
        { error: 'Nu am putut crea tabla.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ board: data });
  } catch (err: any) {
    logger.error('Create board API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}

// GET - List boards (requires authentication)
export async function GET(req: NextRequest) {
  try {
    // Extract Bearer token
    const authHeader = req.headers.get('authorization') || '';
    const tokenMatch = authHeader.match(/^Bearer (.+)$/i);
    if (!tokenMatch) {
      return NextResponse.json({ boards: [] });
    }
    const accessToken = tokenMatch[1];

    // Check if token is expired
    if (isJwtExpired(accessToken)) {
      return NextResponse.json({ boards: [] });
    }

    // Validate token with Supabase - pass JWT explicitly for server-side validation
    const supabase = createServerClientWithToken(accessToken);
    const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
    if (userErr || !userData?.user) {
      return NextResponse.json({ boards: [] });
    }
    const user = userData.user;

    const { data, error } = await supabase
      .from('sketch_boards')
      .select('id, title, share_token, created_at, updated_at, room_id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch boards:', error);
      return NextResponse.json(
        { error: 'Nu am putut lista tablele.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ boards: data || [] });
  } catch (err: any) {
    logger.error('List boards API error:', err);
    return NextResponse.json({ boards: [] });
  }
}




