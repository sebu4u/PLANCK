"use client";

import React, { Suspense, lazy } from 'react';
import type { QuizQuestion } from '@/lib/types/quiz-questions';
import 'katex/dist/katex.min.css';
import { hasMixedLatexDelimiters, splitMixedLatex } from '@/lib/parse-mixed-latex';

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
    return (
        <div className="w-full">
            <div className="text-lg md:text-xl leading-relaxed text-[#111111] [&_.katex]:text-[#111111]">
                <LatexContent content={question.statement} />
            </div>
        </div>
    );
}

export { LatexContent };
