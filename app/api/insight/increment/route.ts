import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithToken } from '@/lib/supabaseServer';
import { isJwtExpired } from '@/lib/auth-validate';
import { logger } from '@/lib/logger';
import { resolvePlanForRequest, parseAccessToken } from '@/lib/subscription-plan-server';

// Limita zilnică pentru planul Free: 3 mesaje pe zi
const FREE_DAILY_LIMIT = 3;
// Limita lunară pentru planul Plus: 800 mesaje pe lună
const PLUS_MONTHLY_LIMIT = 800;

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

    // Get user's plan
    const userPlan = await resolvePlanForRequest(supabase, accessToken);
    const isFreePlan = userPlan === 'free';
    const isPlusPlan = userPlan === 'plus';

    // Use appropriate tracking based on plan
    if (isFreePlan) {
      const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
        'insight_check_and_increment',
        {
          p_user_id: userData.user.id,
          p_daily_limit: FREE_DAILY_LIMIT,
        }
      );

      if (rpcErr) {
        logger.error('Failed to increment usage after stop:', rpcErr);
        return NextResponse.json(
          { error: 'Nu am putut actualiza utilizarea zilnică.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, incremented: Boolean(incrementAllowed) });
    } else if (isPlusPlan) {
      const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
        'ai_check_and_increment_monthly',
        {
          p_user_id: userData.user.id,
          p_monthly_limit: PLUS_MONTHLY_LIMIT,
        }
      );

      if (rpcErr) {
        logger.error('Failed to increment monthly usage after stop:', rpcErr);
        return NextResponse.json(
          { error: 'Nu am putut actualiza utilizarea lunară.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, incremented: Boolean(incrementAllowed) });
    }

    // Premium plan: no tracking needed
    return NextResponse.json({ success: true, incremented: true });
  } catch (err: any) {
    logger.error('Increment API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă la incrementarea consumului.' },
      { status: 500 }
    );
  }
}

