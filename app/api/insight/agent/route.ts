import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithToken } from '@/lib/supabaseServer';
import { isJwtExpired } from '@/lib/auth-validate';
import { logger } from '@/lib/logger';
import { ensureInsightAgentProfile } from '@/lib/insight/agent/profile';

function isMissingAgentSchema(error: unknown) {
  const maybe = error as { code?: string; message?: string } | null | undefined;
  return maybe?.code === '42P01' || maybe?.code === '42703' || /does not exist/i.test(maybe?.message ?? '');
}

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

    const userId = userData.user.id;
    await ensureInsightAgentProfile(supabase, userId);

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    let plansQuery = supabase
      .from('insight_agent_plans')
      .select('id, session_id, title, subject, status, plan_json, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    let recommendationsQuery = supabase
      .from('insight_agent_recommendations')
      .select('id, session_id, recommendation_type, target_id, target_url, reason, confidence, status, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    let diagnosesQuery = supabase
      .from('insight_agent_diagnoses')
      .select('id, session_id, subject, weak_topics, strengths, confidence, evidence_json, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    let parentReportsQuery = supabase
      .from('insight_agent_parent_reports')
      .select('id, session_id, parent_email, report_json, delivery_status, created_at, sent_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    let demandSignalsQuery = supabase
      .from('insight_agent_demand_signals')
      .select('id, session_id, subject, topic, intent, difficulty, source, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const stateQuery = supabase
      .from('insight_agent_states')
      .select('id, session_id, current_goal, subject, grade, exam_target, profile_json, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    const memoryQuery = supabase
      .from('insight_agent_memory')
      .select('id, memory_key, memory_json, confidence, source, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    let actionsQuery = supabase
      .from('insight_agent_actions')
      .select('id, session_id, action_name, status, input_json, result_json, requires_confirmation, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (sessionId) {
      plansQuery = plansQuery.eq('session_id', sessionId);
      recommendationsQuery = recommendationsQuery.eq('session_id', sessionId);
      diagnosesQuery = diagnosesQuery.eq('session_id', sessionId);
      parentReportsQuery = parentReportsQuery.eq('session_id', sessionId);
      demandSignalsQuery = demandSignalsQuery.eq('session_id', sessionId);
      actionsQuery = actionsQuery.eq('session_id', sessionId);
    }

    const [plans, recommendations, diagnoses, parentReports, demandSignals, state, memory, actions] = await Promise.all([
      plansQuery,
      recommendationsQuery,
      diagnosesQuery,
      parentReportsQuery,
      demandSignalsQuery,
      stateQuery,
      memoryQuery,
      actionsQuery,
    ]);

    const firstError =
      plans.error ||
      recommendations.error ||
      diagnoses.error ||
      parentReports.error ||
      demandSignals.error ||
      state.error ||
      memory.error ||
      actions.error;
    if (firstError) {
      if (isMissingAgentSchema(firstError)) {
        return NextResponse.json({
          state: null,
          memory: [],
          actions: [],
          plans: [],
          recommendations: [],
          diagnoses: [],
          parentReports: [],
          demandSignals: [],
          migrationRequired: true,
        });
      }
      logger.error('Insight Agent API error:', firstError);
      return NextResponse.json({ error: 'Nu am putut încărca datele Insight Agent.' }, { status: 500 });
    }

    return NextResponse.json({
      state: state.data || null,
      memory: memory.data || [],
      actions: actions.data || [],
      plans: plans.data || [],
      recommendations: recommendations.data || [],
      diagnoses: diagnoses.data || [],
      parentReports: parentReports.data || [],
      demandSignals: demandSignals.data || [],
    });
  } catch (err: unknown) {
    logger.error('Insight Agent API unexpected error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
