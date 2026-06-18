'use client';

import { useState } from 'react';
import type { InsightMessageArtifact } from '@/lib/insight/agent/types';
import { PlanckResourceCard } from '@/components/planck-resource-card';
import { cn } from '@/lib/utils';
import { Check, Send } from 'lucide-react';

export default function InsightMessageArtifacts({
  artifacts,
  light = false,
  singleColumn = false,
  onAnswerSelect,
}: {
  artifacts?: InsightMessageArtifact[] | null;
  light?: boolean;
  singleColumn?: boolean;
  /** Called when the user selects an answer to an agent_question artifact. */
  onAnswerSelect?: (answer: string) => void;
}) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {artifacts.map((artifact, index) => {
        if (artifact.type === 'resource_references' && artifact.resources.length > 0) {
          return (
            <div key={`resources-${index}`} className="space-y-2">
              {artifact.title ? (
                <div className={light ? 'text-xs font-medium uppercase tracking-wide text-[#64748b]' : 'text-xs font-medium uppercase tracking-wide text-gray-500'}>
                  {artifact.title}
                </div>
              ) : null}
              <div className={singleColumn ? 'grid gap-2' : 'grid gap-2 sm:grid-cols-2'}>
                {artifact.resources.map((resource) => (
                  <PlanckResourceCard
                    key={`${resource.type}-${resource.id}-${resource.url}`}
                    resource={resource}
                    light={light}
                  />
                ))}
              </div>
            </div>
          );
        }

        if (artifact.type === 'agent_action') {
          return (
            <div
              key={`action-${index}`}
              className={
                light
                  ? 'rounded-md border border-[#0b0d10]/12 bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a]'
                  : 'rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gray-200'
              }
            >
              <span className="font-medium">{artifact.title}</span>
              <span className={light ? 'ml-2 text-xs text-[#64748b]' : 'ml-2 text-xs text-gray-500'}>{artifact.status}</span>
            </div>
          );
        }

        if (artifact.type === 'agent_question') {
          return (
            <AgentQuestionCard
              key={`question-${index}`}
              question={artifact.question}
              options={artifact.options}
              allowCustom={artifact.allowCustom}
              placeholder={artifact.placeholder}
              light={light}
              onAnswerSelect={onAnswerSelect}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AgentQuestionCard — interactive multiple-choice question
// ---------------------------------------------------------------------------

function AgentQuestionCard({
  question,
  options,
  allowCustom,
  placeholder,
  light,
  onAnswerSelect,
}: {
  question: string;
  options: string[];
  allowCustom: boolean;
  placeholder?: string;
  light: boolean;
  onAnswerSelect?: (answer: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (option: string) => {
    if (submitted) return;
    setSelected(option);
    setSubmitted(true);
    onAnswerSelect?.(option);
  };

  const handleCustomSubmit = () => {
    const trimmed = customText.trim();
    if (!trimmed || submitted) return;
    setSelected(trimmed);
    setSubmitted(true);
    onAnswerSelect?.(trimmed);
  };

  const buttonBase = cn(
    'w-full text-left text-sm rounded-xl px-4 py-3 transition-all duration-200 border',
    'flex items-center justify-between gap-2',
  );

  const buttonUnselected = light
    ? 'bg-white border-[#0b0d10]/12 hover:border-[#0891b2]/40 hover:bg-[#f8fafc] text-[#111827]'
    : 'bg-white/[0.04] border-white/10 hover:border-cyan-300/40 hover:bg-cyan-300/10 text-gray-200';

  const buttonSelected = light
    ? 'bg-[#ecfeff] border-[#0891b2]/50 text-[#0f172a]'
    : 'bg-cyan-300/15 border-cyan-300/50 text-cyan-100';

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        light
          ? 'bg-white border-[#0b0d10]/12'
          : 'bg-white/[0.03] border-white/10',
      )}
    >
      <p className={cn('text-sm font-medium mb-3', light ? 'text-[#0f172a]' : 'text-gray-100')}>
        {question}
      </p>

      <div className="space-y-2">
        {options.map((option, i) => {
          const isSelected = submitted && selected === option;
          return (
            <button
              key={i}
              type="button"
              disabled={submitted}
              onClick={() => handleSelect(option)}
              className={cn(buttonBase, isSelected ? buttonSelected : buttonUnselected, submitted && !isSelected && 'opacity-50')}
            >
              <span>{option}</span>
              {isSelected && <Check className="h-4 w-4 shrink-0" />}
            </button>
          );
        })}

        {allowCustom && (
          <>
            {!showCustom && !submitted && (
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className={cn(buttonBase, buttonUnselected, 'italic opacity-80 hover:opacity-100')}
              >
                <span>Altul…</span>
              </button>
            )}

            {showCustom && !submitted && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCustomSubmit();
                    }
                  }}
                  placeholder={placeholder || 'Scrie propriul răspuns...'}
                  autoFocus
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none',
                    light
                      ? 'bg-white border-[#0b0d10]/12 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#0891b2]/40'
                      : 'bg-white/[0.04] border-white/10 text-gray-200 placeholder:text-gray-500 focus:border-cyan-300/40',
                  )}
                />
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  disabled={!customText.trim()}
                  className={cn(
                    'shrink-0 rounded-xl px-3 py-2.5 transition-colors disabled:opacity-40',
                    light
                      ? 'bg-[#0f172a] text-white hover:bg-[#1e293b]'
                      : 'bg-cyan-300/20 text-cyan-100 hover:bg-cyan-300/30',
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}

            {submitted && selected && !options.includes(selected) && (
              <div
                className={cn(
                  'rounded-xl px-4 py-3 text-sm border',
                  buttonSelected,
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{selected}</span>
                  <Check className="h-4 w-4 shrink-0" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
