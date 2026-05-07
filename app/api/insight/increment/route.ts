import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithToken } from '@/lib/supabaseServer';
import { isJwtExpired } from '@/lib/auth-validate';
import {
  FREE_DAILY_LIMIT,
  FREE_RAPTOR1_MONTHLY_LIMIT,
  PLUS_MONTHLY_LIMIT,
  isInsightIdeFastModel,
  resolveInsightModel,
  shouldUseRaptorFreeTierLimits,
} from '@/lib/insight-limits';
import { logger } from '@/lib/logger';
import { resolvePlanForRequest } from '@/lib/subscription-plan-server';
import { parseAnonymousIdFromCookieHeader } from '@/lib/anonymous-insight';
import { getServiceRoleSupabase } from '@/lib/supabaseServiceRole';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const tokenMatch = authHeader.match(/^Bearer (.+)$/i);
    if (!tokenMatch) {
      let admin;
      try {
        admin = getServiceRoleSupabase();
      } catch {
        return NextResponse.json({ error: 'Configurare server incompletă.' }, { status: 503 });
      }

      const anonymousId = parseAnonymousIdFromCookieHeader(req.headers.get('cookie'));
      if (!anonymousId) {
        return NextResponse.json({ error: 'Identitate anonimă lipsă.' }, { status: 401 });
      }

      let body: Record<string, unknown> = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }

      const useRaptorFreeTierLimits = shouldUseRaptorFreeTierLimits(body?.persona);
      const modelToUse = resolveInsightModel(body?.model);
      const isIdeFastModel = isInsightIdeFastModel(modelToUse);

      if (useRaptorFreeTierLimits && !isIdeFastModel) {
        const { data: incrementAllowed, error: rpcErr } = await admin.rpc(
          'anonymous_ai_check_and_increment_monthly',
          {
            p_anonymous_id: anonymousId,
            p_monthly_limit: FREE_RAPTOR1_MONTHLY_LIMIT,
          }
        );

        if (rpcErr) {
          logger.error('Anonymous increment monthly after stop:', rpcErr);
          return NextResponse.json(
            { error: 'Nu am putut actualiza utilizarea lunară pentru Raptor1.' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, incremented: Boolean(incrementAllowed) });
      }

      const { data: incrementAllowed, error: rpcErr } = await admin.rpc(
        'anonymous_insight_check_and_increment',
        {
          p_anonymous_id: anonymousId,
          p_daily_limit: FREE_DAILY_LIMIT,
        }
      );

      if (rpcErr) {
        logger.error('Anonymous increment daily after stop:', rpcErr);
        return NextResponse.json({ error: 'Nu am putut actualiza utilizarea zilnică.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, incremented: Boolean(incrementAllowed) });
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
    let body: any = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const useRaptorFreeTierLimits = shouldUseRaptorFreeTierLimits(body?.persona);
    const modelToUse = resolveInsightModel(body?.model);
    const isIdeFastModel = isInsightIdeFastModel(modelToUse);

    // Use appropriate tracking based on plan
    if (isFreePlan) {
      if (useRaptorFreeTierLimits && !isIdeFastModel) {
        const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
          'ai_check_and_increment_monthly',
          {
            p_user_id: userData.user.id,
            p_monthly_limit: FREE_RAPTOR1_MONTHLY_LIMIT,
          }
        );

        if (rpcErr) {
          logger.error('Failed to increment Raptor1 monthly usage after stop:', rpcErr);
          return NextResponse.json(
            { error: 'Nu am putut actualiza utilizarea lunară pentru Raptor1.' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, incremented: Boolean(incrementAllowed) });
      }

      const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
        'insight_check_and_increment',
        {
          p_user_id: userData.user.id,
          p_daily_limit: FREE_DAILY_LIMIT,
        }
      );

      if (rpcErr) {
        logger.error('Failed to increment daily Insight usage after stop:', rpcErr);
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

