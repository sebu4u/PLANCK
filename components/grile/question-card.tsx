"use client";

import React, { Suspense, lazy } from 'react';
import { Badge } from '@/components/ui/badge';
import type { QuizQuestion, DifficultyLevel } from '@/lib/types/quiz-questions';
import { difficultyLabels } from '@/lib/types/quiz-questions';
import 'katex/dist/katex.min.css';

// Lazy load KaTeX components
const LazyInlineMath = lazy(() =>
    import('react-katex').then(module => ({ default: module.InlineMath }))
);
const LazyBlockMath = lazy(() =>
    import('react-katex').then(module => ({ default: module.BlockMath }))
);

interface QuestionCardProps {
    question: QuizQuestion;
    questionNumber: number;
    totalQuestions: number;
}

const difficultyColors: Record<DifficultyLevel, string> = {
    1: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    2: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    3: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
};

// Component for rendering LaTeX content
function LatexContent({ content }: { content: string }) {
    // Check if the content contains LaTeX delimiters
    const hasBlockMath = content.includes('$$');
    const hasInlineMath = content.includes('$') && !hasBlockMath;

    if (!hasBlockMath && !hasInlineMath) {
        return <span>{content}</span>;
    }

    // Split by block math first ($$...$$)
    if (hasBlockMath) {
        const parts = content.split(/(\$\$[^$]+\$\$)/g);
        return (
            <Suspense fallback={<span className="animate-pulse">Loading...</span>}>
                {parts.map((part, idx) => {
                    if (part.startsWith('$$') && part.endsWith('$$')) {
                        const math = part.slice(2, -2);
                        return <LazyBlockMath key={idx} math={math} />;
                    }
                    // Process inline math within non-block parts
                    return <InlineLatexContent key={idx} content={part} />;
                })}
            </Suspense>
        );
    }

    return <InlineLatexContent content={content} />;
}

function InlineLatexContent({ content }: { content: string }) {
    const parts = content.split(/(\$[^$]+\$)/g);

    return (
        <Suspense fallback={<span className="animate-pulse">Loading...</span>}>
            {parts.map((part, idx) => {
                if (part.startsWith('$') && part.endsWith('$')) {
                    const math = part.slice(1, -1);
                    return <LazyInlineMath key={idx} math={math} />;
                }
                return <span key={idx}>{part}</span>;
            })}
        </Suspense>
    );
}

export function QuestionCard({ question, questionNumber, totalQuestions }: QuestionCardProps) {
    return (
        <div className="w-full">
            {/* Header with metadata */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Question counter */}
                <span className="text-white/50 text-sm font-medium">
                    Întrebarea {questionNumber} din {totalQuestions}
                </span>

                {/* Question ID */}
                <Badge
                    variant="outline"
                    className="border-white/20 bg-white/5 text-white/70 font-mono text-xs tracking-wider"
                >
                    {question.question_id}
                </Badge>

                {/* Difficulty */}
                <Badge
                    variant="outline"
                    className={`${difficultyColors[question.difficulty]} font-medium text-xs`}
                >
                    {difficultyLabels[question.difficulty]}
                </Badge>
            </div>

            {/* Question statement */}
            <div className="text-white text-lg md:text-xl leading-relaxed">
                <LatexContent content={question.statement} />
            </div>
        </div>
    );
}

export { LatexContent };
