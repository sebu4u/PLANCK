import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createServerClientWithToken } from '@/lib/supabaseServer';
import { isJwtExpired } from '@/lib/auth-validate';

const FREE_PLAN_BOARD_LIMIT =
  Number(process.env.FREE_PLAN_BOARD_LIMIT ?? process.env.NEXT_PUBLIC_FREE_PLAN_BOARD_LIMIT ?? '3') || 3;
const FREE_PLAN_IDENTIFIERS = new Set(['free', 'free_plan', 'free-tier', 'gratuit']);

const resolveUserPlan = (user: User | null) => {
  if (!user) {
    return 'free';
  }

  const planSources = [
    (user.user_metadata as Record<string, any> | undefined)?.plan,
    (user.user_metadata as Record<string, any> | undefined)?.plan_tier,
    (user.user_metadata as Record<string, any> | undefined)?.planTier,
    (user.user_metadata as Record<string, any> | undefined)?.subscription_plan,
    (user.app_metadata as Record<string, any> | undefined)?.plan,
    (user.app_metadata as Record<string, any> | undefined)?.plan_tier,
    (user.app_metadata as Record<string, any> | undefined)?.planTier,
    (user.app_metadata as Record<string, any> | undefined)?.subscription_plan,
  ];

  const resolved = planSources.find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );

  return (resolved as string | undefined)?.trim().toLowerCase() || 'free';
};

const userHasFreePlan = (user: User | null) => {
  const plan = resolveUserPlan(user);
  return FREE_PLAN_IDENTIFIERS.has(plan) || !plan;
};

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

    // Validate token with Supabase
    const supabase = createServerClientWithToken(accessToken);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: 'Sesiune invalidă.' },
        { status: 401 }
      );
    }
    const user = userData.user;

    const body = await req.json();
    const { title } = body || {};

    if (userHasFreePlan(user) && FREE_PLAN_BOARD_LIMIT > 0) {
      const { count, error: countError } = await supabase
        .from('sketch_boards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Failed to count boards:', countError);
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

    const { data, error } = await supabase
      .from('sketch_boards')
      .insert({
        user_id: user.id,
        title: title || 'Untitled',
        is_public: true,
      })
      .select('id, title, share_token, created_at')
      .single();

    if (error) {
      console.error('Failed to create board:', error);
      return NextResponse.json(
        { error: 'Nu am putut crea tabla.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ board: data });
  } catch (err: any) {
    console.error('Create board API error:', err);
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

    // Validate token with Supabase
    const supabase = createServerClientWithToken(accessToken);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ boards: [] });
    }
    const user = userData.user;

    const { data, error } = await supabase
      .from('sketch_boards')
      .select('id, title, share_token, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch boards:', error);
      return NextResponse.json(
        { error: 'Nu am putut lista tablele.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ boards: data || [] });
  } catch (err: any) {
    console.error('List boards API error:', err);
    return NextResponse.json({ boards: [] });
  }
}




