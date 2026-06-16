"use client";

import React, { Suspense, lazy } from 'react';
import Image from 'next/image';
import type { QuizQuestion } from '@/lib/types/quiz-questions';
import { difficultyLabels } from '@/lib/types/quiz-questions';
import 'katex/dist/katex.min.css';
import { hasMixedLatexDelimiters, splitMixedLatex } from '@/lib/parse-mixed-latex';
import { ExternalLink } from 'lucide-react';

// Lazy load KaTeX components
const LazyInlineMath = lazy(() =>
    import('react-katex').then(module => ({ default: module.InlineMath }))
);
const LazyBlockMath = lazy(() =>
    import('react-katex').then(module => ({ default: module.BlockMath }))
);

interface QuestionCardProps {
    question: QuizQuestion;
}

// Component for rendering LaTeX content
function LatexContent({ content }: { content: string }) {
    if (!hasMixedLatexDelimiters(content)) {
        return <span>{content}</span>;
    }

    const pieces = splitMixedLatex(content);
    return (
        <Suspense fallback={<span className="animate-pulse text-gray-500">Loading...</span>}>
            {pieces.map((part, idx) => {
                if (part.type === 'text') {
                    return <span key={idx}>{part.value}</span>;
                }
                if (part.type === 'inline') {
                    return <LazyInlineMath key={idx} math={part.value} />;
                }
                return <LazyBlockMath key={idx} math={part.value} />;
            })}
        </Suspense>
    );
}

export function QuestionCard({ question }: QuestionCardProps) {
    const displayTitle = question.title?.trim() || question.question_id;
    const hasTags = (question.tags?.length ?? 0) > 0;

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#6d6d6d]">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-[#4d4d4d]">
                    {displayTitle}
                </span>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700">
                    {difficultyLabels[question.difficulty]}
                </span>
                {hasTags
                    ? question.tags!.map((tag) => (
                          <span
                              key={tag}
                              className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700"
                          >
                              {tag}
                          </span>
                      ))
                    : null}
            </div>

            {question.description?.trim() ? (
                <p className="text-sm leading-relaxed text-[#6d6d6d]">{question.description.trim()}</p>
            ) : null}

            {question.image_url?.trim() ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <Image
                        src={question.image_url.trim()}
                        alt={displayTitle}
                        width={960}
                        height={540}
                        className="h-auto w-full object-contain"
                        unoptimized
                    />
                </div>
            ) : null}

            <div className="text-lg md:text-xl leading-relaxed text-[#111111] [&_.katex]:text-[#111111]">
                <LatexContent content={question.statement} />
            </div>

            {question.video_url?.trim() ? (
                <a
                    href={question.video_url.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 transition-colors hover:text-violet-600"
                >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Vezi rezolvarea video
                </a>
            ) : null}
        </div>
    );
}

export { LatexContent };
