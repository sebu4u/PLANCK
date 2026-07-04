import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionPlan } from '@/lib/subscription-plan';
import {
  FREE_DAILY_LIMIT,
  FREE_RAPTOR1_MONTHLY_LIMIT,
  PLUS_MONTHLY_LIMIT,
} from '@/lib/insight-limits';
import { nextUtcMidnightIso } from '@/lib/anonymous-insight';

export type InsightUsageReserveInput = {
  plan: SubscriptionPlan;
  userId: string;
  useRaptorFreeTierLimits: boolean;
  isIdeFastModel: boolean;
};

export type InsightUsageReserveResult =
  | { ok: true }
  | { ok: false; status: number; body: Record<string, unknown> };

export async function reserveAuthenticatedInsightUsage(
  supabase: SupabaseClient,
  input: InsightUsageReserveInput
): Promise<InsightUsageReserveResult> {
  const { plan, userId, useRaptorFreeTierLimits, isIdeFastModel } = input;

  if (plan === 'premium') {
    return { ok: true };
  }

  // PlanckCode IDE agent: unlimited for Plus and Premium
  if (useRaptorFreeTierLimits && plan === 'plus') {
    return { ok: true };
  }

  if (plan === 'plus') {
    const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
      'ai_check_and_increment_monthly',
      {
        p_user_id: userId,
        p_monthly_limit: PLUS_MONTHLY_LIMIT,
      }
    );

    if (rpcErr) {
      return {
        ok: false,
        status: 500,
        body: { error: 'Nu am putut verifica utilizarea lunară.' },
      };
    }

    if (!incrementAllowed) {
      return {
        ok: false,
        status: 429,
        body: {
          error:
            'Ai atins limita lunară pentru planul Plus (800 solicitări/lună pentru Insight și AI Agent).',
        },
      };
    }

    return { ok: true };
  }

  if (useRaptorFreeTierLimits && !isIdeFastModel) {
    const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
      'ai_check_and_increment_monthly',
      {
        p_user_id: userId,
        p_monthly_limit: FREE_RAPTOR1_MONTHLY_LIMIT,
      }
    );

    if (rpcErr) {
      return {
        ok: false,
        status: 500,
        body: { error: 'Nu am putut verifica utilizarea lunară pentru Planck Agent.' },
      };
    }

    if (!incrementAllowed) {
      return {
        ok: false,
        status: 429,
        body: {
          error:
            'Ai atins limita lunară pentru Planck Agent (10 solicitări/lună) pe planul Free. Treci la Planck rapid sau fă upgrade.',
        },
      };
    }

    return { ok: true };
  }

  const { data: incrementAllowed, error: rpcErr } = await supabase.rpc(
    'insight_check_and_increment',
    {
      p_user_id: userId,
      p_daily_limit: FREE_DAILY_LIMIT,
    }
  );

  if (rpcErr) {
    return {
      ok: false,
      status: 500,
      body: { error: 'Nu am putut verifica utilizarea zilnică.' },
    };
  }

  if (!incrementAllowed) {
    const errorMessage = useRaptorFreeTierLimits
      ? 'Ai atins limita zilnică pentru Planck rapid (3 solicitări/zi).'
      : 'Ai atins limita zilnică pentru Insight (3 solicitări/zi) pe planul Free. Încearcă mâine sau fă upgrade.';

    return {
      ok: false,
      status: 429,
      body: {
        error: errorMessage,
        resetTime: nextUtcMidnightIso(),
      },
    };
  }

  return { ok: true };
}

export type AnonymousUsageReserveResult =
  | { ok: true }
  | { ok: false; limitExceeded: true }
  | { ok: false; status: number; body: Record<string, unknown> };

export async function reserveAnonymousInsightUsage(
  admin: SupabaseClient,
  anonymousId: string,
  useRaptorFreeTierLimits: boolean,
  isIdeFastModel: boolean
): Promise<AnonymousUsageReserveResult> {
  if (useRaptorFreeTierLimits && !isIdeFastModel) {
    const { data: incrementAllowed, error: rpcErr } = await admin.rpc(
      'anonymous_ai_check_and_increment_monthly',
      {
        p_anonymous_id: anonymousId,
        p_monthly_limit: FREE_RAPTOR1_MONTHLY_LIMIT,
      }
    );

    if (rpcErr) {
      return {
        ok: false,
        status: 500,
        body: { error: 'Nu am putut verifica utilizarea lunară pentru Planck Agent.' },
      };
    }

    if (!incrementAllowed) {
      return { ok: false, limitExceeded: true };
    }

    return { ok: true };
  }

  const { data: incrementAllowed, error: rpcErr } = await admin.rpc(
    'anonymous_insight_check_and_increment',
    {
      p_anonymous_id: anonymousId,
      p_daily_limit: FREE_DAILY_LIMIT,
    }
  );

  if (rpcErr) {
    return {
      ok: false,
      status: 500,
      body: { error: 'Nu am putut verifica utilizarea zilnică.' },
    };
  }

  if (!incrementAllowed) {
    return { ok: false, limitExceeded: true };
  }

  return { ok: true };
}
