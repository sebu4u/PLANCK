'use client';

import Link from 'next/link';
import { BookOpen, Brain, FileQuestion, GraduationCap, Route, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanckResourceReference } from '@/lib/insight/agent/types';

const typeLabels: Record<PlanckResourceReference['type'], string> = {
  problem: 'Problemă',
  lesson: 'Lecție',
  course: 'Curs',
  learning_path: 'Traseu',
  quiz: 'Grilă',
  flashcard_deck: 'Flashcard-uri',
};

function ResourceIcon({ type }: { type: PlanckResourceReference['type'] }) {
  if (type === 'problem') return <FileQuestion className="h-4 w-4" />;
  if (type === 'lesson' || type === 'course') return <BookOpen className="h-4 w-4" />;
  if (type === 'learning_path') return <Route className="h-4 w-4" />;
  if (type === 'quiz') return <GraduationCap className="h-4 w-4" />;
  if (type === 'flashcard_deck') return <Sparkles className="h-4 w-4" />;
  return <Brain className="h-4 w-4" />;
}

export function PlanckResourceCard({
  resource,
  compact = false,
  light = false,
}: {
  resource: PlanckResourceReference;
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <Link
      href={resource.url}
      className={cn(
        'group block rounded-md border p-3 text-left transition-colors',
        light
          ? 'border-[#0b0d10]/12 bg-[#f8fafc] hover:border-[#0891b2]/35 hover:bg-[#ecfeff]'
          : 'border-white/10 bg-white/[0.04] hover:border-cyan-300/50 hover:bg-cyan-300/10',
        compact ? 'p-2.5' : 'p-3'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
            light ? 'bg-[#cffafe] text-[#0e7490]' : 'bg-cyan-300/10 text-cyan-200'
          )}
        >
          <ResourceIcon type={resource.type} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide',
              light ? 'text-[#0e7490]' : 'text-cyan-200/80'
            )}
          >
            <span>{typeLabels[resource.type]}</span>
            {resource.difficulty ? (
              <span className={cn(light ? 'text-[#64748b]' : 'text-gray-500')}>· {resource.difficulty}</span>
            ) : null}
          </div>
          <div
            className={cn(
              'mt-1 line-clamp-2 text-sm font-medium leading-5',
              light ? 'text-[#0f172a]' : 'text-gray-100'
            )}
          >
            {resource.title}
          </div>
          {resource.subtitle || resource.topic ? (
            <div className={cn('mt-1 line-clamp-1 text-xs', light ? 'text-[#64748b]' : 'text-gray-400')}>
              {resource.subtitle || resource.topic}
            </div>
          ) : null}
          {resource.reason && !compact ? (
            <div className={cn('mt-2 line-clamp-2 text-xs leading-5', light ? 'text-[#64748b]' : 'text-gray-400')}>
              {resource.reason}
            </div>
          ) : null}
          <div
            className={cn(
              'mt-2 text-xs font-medium',
              light ? 'text-[#0e7490] group-hover:text-[#155e75]' : 'text-cyan-200 group-hover:text-cyan-100'
            )}
          >
            Deschide resursa →
          </div>
        </div>
      </div>
    </Link>
  );
}
