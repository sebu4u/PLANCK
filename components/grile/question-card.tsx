"use client";

import React, { Suspense, lazy } from 'react';
import type { QuizQuestion } from '@/lib/types/quiz-questions';
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
}

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
            <Suspense fallback={<span className="animate-pulse text-gray-500">Loading...</span>}>
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
        <Suspense fallback={<span className="animate-pulse text-gray-500">Loading...</span>}>
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
