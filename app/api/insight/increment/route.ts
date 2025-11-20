import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithToken } from '@/lib/supabaseServer';
import { isJwtExpired } from '@/lib/auth-validate';

// TEMPORAR: Limita dezactivată pentru testare - va fi reactivată în viitor
const FREE_DAILY_LIMIT = 999999; // Temporar: limita foarte mare pentru testare

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

    const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
      'insight_check_and_increment',
      {
        p_user_id: userData.user.id,
        p_daily_limit: FREE_DAILY_LIMIT,
      }
    );

    if (rpcErr) {
      console.error('Failed to increment usage after stop:', rpcErr);
      return NextResponse.json(
        { error: 'Nu am putut actualiza utilizarea zilnică.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, incremented: Boolean(incrementAllowed) });
  } catch (err: any) {
    console.error('Increment API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă la incrementarea consumului.' },
      { status: 500 }
    );
  }
}

