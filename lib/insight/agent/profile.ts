import type { SupabaseClient } from '@supabase/supabase-js';
import type { InsightAgentIntent, InsightAgentProfileMemory } from './types';

function uniq(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}

function inferGrade(input: string): string | null {
  const match = input.match(/\b(?:clasa|cls\.?|clasa a)?\s*(9|10|11|12|ix|x|xi|xii)\b/i);
  if (!match) return null;
  const value = match[1].toLowerCase();
  const roman: Record<string, string> = { ix: '9', x: '10', xi: '11', xii: '12' };
  return roman[value] ?? value;
}

function inferGoals(input: string) {
  const goals: string[] = [];
  if (/\bbac|bacalaureat\b/i.test(input)) goals.push('BAC');
  if (/\bolimpiad[ăa]|concurs\b/i.test(input)) goals.push('olimpiadă/concurs');
  if (/\btest|tez[ăa]|examen\b/i.test(input)) goals.push('test/examen');
  if (/\badmitere\b/i.test(input)) goals.push('admitere');
  return goals;
}

export async function loadInsightAgentProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<InsightAgentProfileMemory> {
  const { data } = await supabase
    .from('insight_agent_memory')
    .select('memory_json')
    .eq('user_id', userId)
    .eq('memory_key', 'learner_profile')
    .maybeSingle();

  return ((data?.memory_json as InsightAgentProfileMemory | null) ?? {}) || {};
}

export async function ensureInsightAgentProfile(supabase: SupabaseClient, userId: string) {
  const now = new Date().toISOString();

  const [{ data: state }, { data: memory }] = await Promise.all([
    supabase
      .from('insight_agent_states')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('insight_agent_memory')
      .select('id')
      .eq('user_id', userId)
      .eq('memory_key', 'learner_profile')
      .maybeSingle(),
  ]);

  const writes: Array<PromiseLike<unknown>> = [];
  if (!state) {
    writes.push(
      supabase.from('insight_agent_states').insert({
        user_id: userId,
        current_goal: null,
        profile_json: {},
      })
    );
  }
  if (!memory) {
    writes.push(
      supabase.from('insight_agent_memory').insert({
        user_id: userId,
        memory_key: 'learner_profile',
        memory_json: { created_from: 'insight_agent', created_at: now },
        confidence: 0.5,
        source: 'insight_agent',
      })
    );
  }

  if (writes.length) {
    await Promise.allSettled(writes);
  }
}

export async function updateInsightAgentProfile(
  supabase: SupabaseClient,
  params: {
    userId: string;
    sessionId: string;
    userInput: string;
    assistantText: string;
    intent: InsightAgentIntent;
    resourceIds: string[];
  }
) {
  const previous = await loadInsightAgentProfile(supabase, params.userId);
  const grade = inferGrade(params.userInput) ?? previous.grade ?? null;
  const topic = params.intent.topic;
  const subject = params.intent.subject === 'general' ? null : params.intent.subject;

  const next: InsightAgentProfileMemory = {
    ...previous,
    grade,
    subjects: uniq([...(previous.subjects ?? []), subject]),
    goals: uniq([...(previous.goals ?? []), ...inferGoals(params.userInput)]),
    weak_topics:
      topic && (params.intent.type === 'diagnosis' || params.intent.type === 'plan')
        ? [
            { subject, topic, confidence: params.intent.confidence },
            ...(previous.weak_topics ?? []).filter((item) => item.topic !== topic).slice(0, 12),
          ]
        : previous.weak_topics ?? [],
    strengths: previous.strengths ?? [],
    preferred_explanation_style: previous.preferred_explanation_style ?? null,
    recent_resource_ids: uniq([...(params.resourceIds ?? []), ...(previous.recent_resource_ids ?? [])]).slice(0, 30),
    updated_from: 'insight_chat',
  };

  await supabase.from('insight_agent_memory').upsert(
    {
      user_id: params.userId,
      memory_key: 'learner_profile',
      memory_json: next,
      confidence: Math.max(params.intent.confidence, 0.6),
      source: 'insight_chat',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,memory_key' }
  );

  return next;
}
