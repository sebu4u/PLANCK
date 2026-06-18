'use client';

import React from 'react';
import {
  Brain,
  ClipboardList,
  FileText,
  GraduationCap,
  Lightbulb,
  RefreshCw,
  Target,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanckResourceCard } from '@/components/planck-resource-card';
import { cn } from '@/lib/utils';
import type { InsightAgentProfileMemory, PlanckResourceReference } from '@/lib/insight/agent/types';

type AgentState = {
  current_goal: string | null;
  subject: string | null;
  grade: string | null;
  exam_target: string | null;
  profile_json: Record<string, unknown> | null;
  updated_at: string;
};

type AgentPlan = {
  id: string;
  title: string;
  subject: string;
  status: string;
  plan_json: {
    steps?: Array<{ title?: string; objective?: string; resource?: PlanckResourceReference }>;
    resources?: PlanckResourceReference[];
  } | null;
  created_at: string;
};

type AgentDiagnosis = {
  id: string;
  subject: string;
  weak_topics: Array<{ topic?: string; evidence?: string; confidence?: number }> | null;
  confidence: number | null;
  created_at: string;
};

type AgentRecommendation = {
  id: string;
  recommendation_type: string;
  target_url: string | null;
  reason: string;
  confidence: number | null;
  metadata?: {
    resources?: PlanckResourceReference[];
  } | null;
  created_at: string;
};

type AgentParentReport = {
  id: string;
  report_json: {
    summary?: string;
  } | null;
  delivery_status: string;
  created_at: string;
};

type AgentDemandSignal = {
  id: string;
  subject: string | null;
  topic: string | null;
  intent: string | null;
  created_at: string;
};

type AgentMemory = {
  id: string;
  memory_key: string;
  memory_json: InsightAgentProfileMemory;
  confidence: number | null;
  updated_at: string;
};

type AgentAction = {
  id: string;
  action_name: string;
  status: string;
  created_at: string;
};

export type InsightAgentPanelData = {
  state: AgentState | null;
  memory: AgentMemory[];
  actions: AgentAction[];
  plans: AgentPlan[];
  diagnoses: AgentDiagnosis[];
  recommendations: AgentRecommendation[];
  parentReports: AgentParentReport[];
  demandSignals: AgentDemandSignal[];
};

type InsightAgentPanelProps = {
  data: InsightAgentPanelData | null;
  loading: boolean;
  sessionScoped: boolean;
  className?: string;
  onClose?: () => void;
  onRefresh: () => void;
  onPromptSelect: (prompt: string) => void;
};

const intentLabels: Record<string, string> = {
  tutor: 'Tutorat',
  diagnosis: 'Diagnostic',
  plan: 'Plan',
  recommendation: 'Recomandare',
  parent_report: 'Raport',
};

const promptTemplates = [
  'Fă-mi un diagnostic rapid: unde sunt blocat și ce ar trebui să repar prima dată?',
  'Construiește-mi un plan de învățare pe 7 zile pentru următorul test.',
  'Recomandă-mi următoarea lecție sau traseu potrivit pentru nivelul meu.',
  'Pregătește un raport scurt de progres pentru părinți, ca draft.',
];

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function confidenceLabel(value: number | null | undefined) {
  if (typeof value !== 'number') return null;
  return `${Math.round(value * 100)}%`;
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/10 py-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-100">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

export default function InsightAgentPanel({
  data,
  loading,
  sessionScoped,
  className,
  onClose,
  onRefresh,
  onPromptSelect,
}: InsightAgentPanelProps) {
  const latestPlan = data?.plans?.[0] ?? null;
  const latestDiagnosis = data?.diagnoses?.[0] ?? null;
  const latestRecommendation = data?.recommendations?.[0] ?? null;
  const latestReport = data?.parentReports?.[0] ?? null;
  const profileMemory = data?.memory?.find((item) => item.memory_key === 'learner_profile')?.memory_json ?? null;
  const recentActions = data?.actions?.slice(0, 4) ?? [];
  const recentSignals = data?.demandSignals?.slice(0, 4) ?? [];
  const planResources = latestPlan?.plan_json?.resources ?? [];
  const recommendationResources = latestRecommendation?.metadata?.resources ?? [];
  const hasArtifacts = Boolean(
    latestPlan ||
      latestDiagnosis ||
      latestRecommendation ||
      latestReport ||
      data?.state ||
      profileMemory ||
      recentSignals.length
  );

  return (
    <aside className={cn('flex h-full flex-col bg-[#171717] text-white', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Brain className="h-4 w-4 text-cyan-300" />
            <span>Insight Agent</span>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {sessionScoped ? 'Sesiunea curentă' : 'Activitate recentă'}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-300 hover:bg-white/10 hover:text-white"
            onClick={onRefresh}
            disabled={loading}
            title="Actualizează"
          >
            <RefreshCw className={cn('h-4 w-4', loading ? 'animate-spin' : '')} />
          </Button>
          {onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-300 hover:bg-white/10 hover:text-white"
              onClick={onClose}
              title="Închide"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <Section title="Comenzi rapide" icon={<Lightbulb className="h-4 w-4 text-amber-300" />}>
          <div className="space-y-2">
            {promptTemplates.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onPromptSelect(prompt)}
                className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs leading-5 text-gray-200 transition-colors hover:border-cyan-400/40 hover:bg-cyan-400/10"
              >
                {prompt}
              </button>
            ))}
          </div>
        </Section>

        {loading && !hasArtifacts ? (
          <div className="py-10 text-center text-sm text-gray-400">Se încarcă...</div>
        ) : null}

        {!loading && !hasArtifacts ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Cere un plan, diagnostic, recomandare sau raport ca să apară aici.
          </div>
        ) : null}

        {data?.state ? (
          <Section title="Stare" icon={<Target className="h-4 w-4 text-emerald-300" />}>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-medium text-gray-100">
                {data.state.current_goal || 'Obiectiv activ'}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-300">
                {data.state.subject ? (
                  <span className="rounded-full bg-white/10 px-2 py-1">{data.state.subject}</span>
                ) : null}
                {data.state.exam_target ? (
                  <span className="rounded-full bg-white/10 px-2 py-1">{data.state.exam_target}</span>
                ) : null}
                <span className="rounded-full bg-white/10 px-2 py-1">
                  {formatDate(data.state.updated_at)}
                </span>
              </div>
            </div>
          </Section>
        ) : null}

        {profileMemory ? (
          <Section title="Profil memorat" icon={<Brain className="h-4 w-4 text-cyan-300" />}>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-gray-300">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-gray-500">Clasă</div>
                  <div className="text-gray-100">{profileMemory.grade || 'necunoscută'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Materii</div>
                  <div className="text-gray-100">
                    {(profileMemory.subjects || []).join(', ') || 'în curs'}
                  </div>
                </div>
              </div>
              {profileMemory.goals?.length ? (
                <div className="mt-3">
                  <div className="text-gray-500">Obiective</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {profileMemory.goals.slice(0, 4).map((goal) => (
                      <span key={goal} className="rounded-full bg-white/10 px-2 py-1 text-[11px]">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {profileMemory.weak_topics?.length ? (
                <div className="mt-3">
                  <div className="text-gray-500">Zone urmărite</div>
                  <div className="mt-1 text-gray-100">
                    {profileMemory.weak_topics.slice(0, 3).map((item) => item.topic).join(', ')}
                  </div>
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        {latestDiagnosis ? (
          <Section title="Diagnostic" icon={<GraduationCap className="h-4 w-4 text-sky-300" />}>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-gray-100">{latestDiagnosis.subject}</div>
                {confidenceLabel(latestDiagnosis.confidence) ? (
                  <span className="text-xs text-gray-400">
                    {confidenceLabel(latestDiagnosis.confidence)}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 space-y-2">
                {(latestDiagnosis.weak_topics || []).slice(0, 3).map((topic, index) => (
                  <div key={`${latestDiagnosis.id}-${index}`} className="text-xs text-gray-300">
                    <span className="font-medium text-gray-100">
                      {topic.topic || 'Topic detectat'}
                    </span>
                    {topic.evidence ? <span>: {topic.evidence}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          </Section>
        ) : null}

        {latestPlan ? (
          <Section title="Plan" icon={<ClipboardList className="h-4 w-4 text-violet-300" />}>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-medium text-gray-100">{latestPlan.title}</div>
              <div className="mt-1 text-xs text-gray-400">
                {latestPlan.status} · {formatDate(latestPlan.created_at)}
              </div>
              <div className="mt-3 space-y-2">
                {(latestPlan.plan_json?.steps || []).slice(0, 3).map((step, index) => (
                  <div key={`${latestPlan.id}-${index}`} className="text-xs leading-5 text-gray-300">
                    <span className="text-gray-100">{step.title || `Pas ${index + 1}`}</span>
                    {step.objective ? <span>: {step.objective}</span> : null}
                  </div>
                ))}
              </div>
              {planResources.length ? (
                <div className="mt-3 space-y-2">
                  {planResources.slice(0, 2).map((resource) => (
                    <PlanckResourceCard key={`${resource.type}-${resource.id}`} resource={resource} compact />
                  ))}
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        {latestRecommendation ? (
          <Section title="Recomandare" icon={<Lightbulb className="h-4 w-4 text-amber-300" />}>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                {latestRecommendation.recommendation_type}
              </div>
              <div className="mt-2 text-sm text-gray-100">{latestRecommendation.reason}</div>
              {latestRecommendation.target_url ? (
                <a
                  href={latestRecommendation.target_url}
                  className="mt-3 inline-flex text-xs font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Deschide
                </a>
              ) : null}
              {recommendationResources.length ? (
                <div className="mt-3 space-y-2">
                  {recommendationResources.slice(0, 2).map((resource) => (
                    <PlanckResourceCard key={`${resource.type}-${resource.id}`} resource={resource} compact />
                  ))}
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        {recentActions.length ? (
          <Section title="Acțiuni" icon={<ClipboardList className="h-4 w-4 text-violet-300" />}>
            <div className="space-y-2">
              {recentActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs"
                >
                  <span className="truncate text-gray-100">{action.action_name}</span>
                  <span className="shrink-0 text-gray-500">{action.status}</span>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {latestReport ? (
          <Section title="Raport" icon={<FileText className="h-4 w-4 text-rose-300" />}>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                {latestReport.delivery_status}
              </div>
              <div className="mt-2 line-clamp-4 text-sm leading-6 text-gray-200">
                {latestReport.report_json?.summary || 'Draft de raport generat în conversație.'}
              </div>
            </div>
          </Section>
        ) : null}

        {recentSignals.length ? (
          <Section title="Semnale" icon={<Brain className="h-4 w-4 text-cyan-300" />}>
            <div className="space-y-2 pb-4">
              {recentSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-gray-100">
                      {signal.topic || signal.subject || 'General'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {intentLabels[signal.intent || ''] || signal.intent || 'Tutorat'}
                    </div>
                  </div>
                  <div className="shrink-0 text-[11px] text-gray-500">
                    {formatDate(signal.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : null}
      </div>
    </aside>
  );
}
