import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { searchPlanckContentCatalog } from './content-catalog';
import { updateInsightAgentProfile } from './profile';
import type {
  InsightAgentProfileMemory,
  InsightAgentArtifacts,
  InsightAgentIntent,
  InsightMessageArtifact,
  PlanckResourceReference,
} from './types';

export function buildInsightAgentSystemAppendix(intent: InsightAgentIntent): string {
  if (intent.type === 'tutor') {
    return `\n\nREGULĂ PLANCK AGENT:
- NU recomanda proactive probleme, lecții, cursuri, grile sau trasee Planck decât dacă utilizatorul cere explicit resurse sau recomandări din platformă.
- Dacă utilizatorul pune întrebări, cere explicații sau ajutor la o problemă, răspunde la subiect fără a sugera resurse Planck la final.
- Nu inventa probleme, lecții, linkuri, cursuri sau resurse Planck. Dacă utilizatorul cere practică sau resurse, orientează-l doar către conținut existent din catalog sau cere context.`;
  }

  return `\n\nMOD INSIGHT AGENT ACTIVAT:
- Insight este interfața unică pentru tutorat, diagnostic, planuri personalizate, recomandări și rezumate de progres.
- Intenție detectată: ${intent.type}. Materie: ${intent.subject}. Topic: ${intent.topic ?? 'necunoscut'}.
- Ai memorie de utilizator și trebuie să tratezi interacțiunea ca parte din profilul educațional al elevului.
- NU recomanda proactive probleme, lecții sau cursuri Planck decât când utilizatorul cere explicit un plan, o recomandare sau resurse concrete din platformă.
- Nu inventa probleme, lecții, linkuri, cursuri sau resurse Planck. Când utilizatorul cere resurse, recomandă doar conținut existent în catalogul Planck disponibil server-side. Dacă nu există o resursă potrivită, spune explicit că nu ai găsit una.
- Dacă lipsesc informații importante, pune cel mult 2 întrebări clare înainte de a concluziona.
- Când utilizatorul cere un plan, oferă pași concreți, scurți, cu exerciții/lecții recomandate pe zile sau etape.
- Când recomanzi la cerere un curs sau o lecție, explică motivul educațional și evită tonul agresiv de vânzare.
- Pentru raport către părinți, redactează un rezumat calm, factual, bazat pe progres și următorul pas; cere confirmare înainte de trimitere.
- Răspunde în română, prietenos și practic.`;
}

export function buildInsightAgentResourceAppendix(resources: PlanckResourceReference[], responseInstruction?: string): string {
  const instruction = responseInstruction ? `\n${responseInstruction}` : '';
  if (!resources.length) {
    return `\n\nCATALOG PLANCK:
- Nu am găsit resurse Planck validate pentru mesajul curent și utilizatorul nu a cerut explicit recomandări.
- NU propune probleme, lecții sau cursuri Planck din proprie inițiativă. Nu inventa resurse.${instruction}`;
  }

  const lines = resources.slice(0, 8).map((resource, index) => {
    return `${index + 1}. ${resource.type}: ${resource.title} | url: ${resource.url} | materie: ${resource.subject ?? 'necunoscut'} | topic: ${resource.topic ?? resource.subtitle ?? 'necunoscut'} | dificultate: ${resource.difficulty ?? 'necunoscută'}`;
  });

  return `\n\nCATALOG PLANCK VALIDAT PENTRU ACEST MESAJ:
Folosește doar aceste resurse când recomanzi probleme, lecții, grile, cursuri sau trasee. Nu inventa resurse în afara listei.
Nu scrie linkuri raw sau linkuri Markdown în răspuns. Menționează resursele pe scurt după titlu, iar interfața va afișa cardurile clickabile sub mesaj.
${lines.join('\n')}${instruction}`;
}

export function buildInsightAgentProfileAppendix(profile: InsightAgentProfileMemory): string {
  const subjects = profile.subjects?.length ? profile.subjects.join(', ') : 'necunoscute';
  const goals = profile.goals?.length ? profile.goals.join(', ') : 'necunoscute';
  const weakTopics = profile.weak_topics?.length
    ? profile.weak_topics.slice(0, 5).map((item) => item.topic).join(', ')
    : 'necunoscute';

  return `\n\nPROFIL ELEV MEMORAT:
- Clasă: ${profile.grade ?? 'necunoscută'}
- Materii urmărite: ${subjects}
- Obiective: ${goals}
- Zone de lucru/slăbiciuni observate: ${weakTopics}
- Stil preferat: ${profile.preferred_explanation_style ?? 'necunoscut'}`;
}

function inferPlanTitle(intent: InsightAgentIntent) {
  const subject = intent.subject === 'general' ? 'învățare' : intent.subject;
  return `Plan personalizat pentru ${intent.topic ?? subject}`;
}

function inferCurrentGoal(intent: InsightAgentIntent) {
  const target = intent.topic ?? (intent.subject === 'general' ? 'învățare' : intent.subject);

  switch (intent.type) {
    case 'diagnosis':
      return `Diagnostic pentru ${target}`;
    case 'plan':
      return `Plan pentru ${target}`;
    case 'recommendation':
      return `Recomandare pentru ${target}`;
    case 'parent_report':
      return `Raport de progres pentru ${target}`;
    default:
      return `Tutorat pentru ${target}`;
  }
}

function buildResourceBackedSteps(resources: PlanckResourceReference[]) {
  if (!resources.length) {
    return [
      { title: 'Diagnostic rapid', objective: 'Clarifică exact capitolele și tipurile de exerciții unde elevul se blochează.' },
      { title: 'Recapitulare ghidată', objective: 'Revizuiește explicația principală și exemplele de bază pentru topicul detectat.' },
      { title: 'Exerciții progresive', objective: 'Alege resurse existente din Planck când catalogul conține potriviri relevante.' },
    ];
  }

  return resources.slice(0, 5).map((resource, index) => ({
    title: index === 0 ? 'Începe cu resursa cea mai potrivită' : `Pas ${index + 1}: ${resource.title}`,
    objective: `${resource.title} (${resource.url}) — ${resource.reason ?? 'Resursă Planck potrivită pentru obiectivul curent.'}`,
    resource,
  }));
}

export function buildInsightAgentArtifacts(
  intent: InsightAgentIntent,
  userInput: string,
  assistantText: string,
  resources: PlanckResourceReference[] = []
): InsightAgentArtifacts {
  const commonEvidence = {
    user_input_excerpt: userInput.slice(0, 500),
    assistant_excerpt: assistantText.slice(0, 500),
    intent,
    resources,
  };

  const artifacts: InsightAgentArtifacts = {};

  if (intent.type === 'diagnosis' || intent.type === 'plan') {
    artifacts.diagnosis = {
      subject: intent.subject,
      weak_topics: [
        {
          topic: intent.topic ?? 'diagnostic inițial',
          evidence: intent.reasons.join('; ') || 'Cerere explicită de ajutor personalizat',
          confidence: intent.confidence,
        },
      ],
      strengths: [],
      confidence: intent.confidence,
      evidence_json: commonEvidence,
    };
  }

  if (intent.type === 'plan') {
    artifacts.plan = {
      title: inferPlanTitle(intent),
      subject: intent.subject,
      plan_json: {
        source: 'insight_chat',
        intent,
        steps: buildResourceBackedSteps(resources),
        resources,
      },
    };
  }

  if (intent.type === 'recommendation' || resources.length > 0) {
    const primaryResource = resources[0] ?? null;
    artifacts.recommendation = {
      recommendation_type:
        primaryResource?.type === 'problem'
          ? 'problem'
          : primaryResource?.type === 'lesson'
            ? 'lesson'
            : primaryResource?.type === 'course'
              ? 'course'
              : 'learning_path',
      target_url: primaryResource?.url ?? null,
      reason: primaryResource
        ? `Recomandare validată din catalogul Planck: ${primaryResource.title}.`
        : `Recomandare generată din conversația Insight pentru ${intent.topic ?? intent.subject}.`,
      confidence: intent.confidence,
      metadata: commonEvidence,
      resources,
    };
  }

  if (intent.type === 'parent_report') {
    artifacts.parentReport = {
      report_json: {
        source: 'insight_chat',
        status: 'draft',
        summary: assistantText.slice(0, 1200),
        intent,
      },
    };
  }

  return artifacts;
}

function buildMessageArtifacts(
  resources: PlanckResourceReference[],
  title: string | null = 'Resurse Planck recomandate'
): InsightMessageArtifact[] {
  if (!resources.length) return [];
  return [
    {
      type: 'resource_references',
      ...(title ? { title } : {}),
      resources,
    },
  ];
}

export async function persistInsightAgentArtifacts(
  supabase: SupabaseClient,
  params: {
    userId: string;
    sessionId: string;
    userInput: string;
    assistantText: string;
    intent: InsightAgentIntent;
    resources?: PlanckResourceReference[];
    messageArtifactTitle?: string | null;
  }
) {
  const { userId, sessionId, userInput, assistantText, intent } = params;
  const resources =
    params.resources ??
    (await searchPlanckContentCatalog(supabase, {
      intent,
      userInput,
      limit: intent.type === 'plan' ? 6 : 4,
    }));
  const artifacts = buildInsightAgentArtifacts(intent, userInput, assistantText, resources);
  const messageArtifacts = buildMessageArtifacts(resources, params.messageArtifactTitle);
  const resourceIds = resources.map((resource) => `${resource.type}:${resource.id}`);

  const writes: Array<PromiseLike<unknown>> = [
    supabase.from('insight_agent_states').upsert(
      {
        user_id: userId,
        session_id: sessionId,
        current_goal: inferCurrentGoal(intent),
        subject: intent.subject === 'general' ? null : intent.subject,
        profile_json: {
          last_intent: intent.type,
          last_topic: intent.topic,
          confidence: intent.confidence,
          reasons: intent.reasons,
          learner_profile_updated: true,
          recommended_resources: resources,
          last_user_input_excerpt: userInput.slice(0, 500),
          last_assistant_excerpt: assistantText.slice(0, 500),
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    ),
    supabase.from('insight_agent_demand_signals').insert({
      user_id: userId,
      session_id: sessionId,
      subject: intent.subject,
      topic: intent.topic,
      intent: intent.type,
      difficulty: null,
      source: 'insight_chat',
      metadata: { confidence: intent.confidence, reasons: intent.reasons },
    }),
    updateInsightAgentProfile(supabase, {
      userId,
      sessionId,
      userInput,
      assistantText,
      intent,
      resourceIds,
    }),
    supabase.from('insight_agent_actions').insert({
      user_id: userId,
      session_id: sessionId,
      action_name:
        intent.type === 'plan'
          ? 'create_learning_plan'
          : intent.type === 'diagnosis'
            ? 'diagnose_student'
            : intent.type === 'parent_report'
              ? 'prepare_parent_report'
              : 'recommend_next_action',
      status: 'completed',
      input_json: { intent, user_input_excerpt: userInput.slice(0, 500) },
      result_json: { resources, artifacts },
      requires_confirmation: false,
    }),
  ];

  if (artifacts.diagnosis) {
    writes.push(
      supabase.from('insight_agent_diagnoses').insert({
        user_id: userId,
        session_id: sessionId,
        subject: artifacts.diagnosis.subject,
        weak_topics: artifacts.diagnosis.weak_topics,
        strengths: artifacts.diagnosis.strengths,
        confidence: artifacts.diagnosis.confidence,
        evidence_json: artifacts.diagnosis.evidence_json,
      })
    );
  }

  if (artifacts.plan) {
    writes.push(
      supabase.from('insight_agent_plans').insert({
        user_id: userId,
        session_id: sessionId,
        title: artifacts.plan.title,
        subject: artifacts.plan.subject,
        plan_json: artifacts.plan.plan_json,
      })
    );
  }

  if (artifacts.recommendation) {
    writes.push(
      supabase.from('insight_agent_recommendations').insert({
        user_id: userId,
        session_id: sessionId,
        recommendation_type: artifacts.recommendation.recommendation_type,
        target_url: artifacts.recommendation.target_url,
        reason: artifacts.recommendation.reason,
        confidence: artifacts.recommendation.confidence,
        metadata: artifacts.recommendation.metadata,
      })
    );
  }

  if (artifacts.parentReport) {
    writes.push(
      supabase.from('insight_agent_parent_reports').insert({
        user_id: userId,
        session_id: sessionId,
        report_json: artifacts.parentReport.report_json,
        delivery_status: 'draft',
      })
    );
  }

  const results = await Promise.allSettled(writes);
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const maybe = result.value as { error?: unknown } | null | undefined;
      if (maybe?.error) logger.warn('Insight Agent artifact persistence warning:', maybe.error);
    } else {
      logger.warn('Insight Agent artifact persistence failed:', result.reason);
    }
  });

  return { artifacts, resources, messageArtifacts };
}
