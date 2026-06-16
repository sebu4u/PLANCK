"use client";

import React from 'react';
import type { QuizAnswers, AnswerKey, UserAnswer } from '@/lib/types/quiz-questions';
import { LatexContent } from './question-card';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { getActiveAnswerEntries } from '@/lib/quiz-question-utils';

interface AnswersListProps {
    answers: QuizAnswers;
    correctAnswers: AnswerKey[];
    userAnswer: UserAnswer | null;
    onSelect: (answer: AnswerKey) => void;
}

export function AnswersList({ answers, correctAnswers, userAnswer, onSelect }: AnswersListProps) {
    const selectedAnswers = userAnswer?.selectedAnswers ?? [];
    const selectedSet = new Set(selectedAnswers);
    const isVerified = userAnswer?.isVerified ?? false;
    const correctSet = new Set(correctAnswers);
    const answerEntries = getActiveAnswerEntries(answers);

    const getAnswerState = (key: AnswerKey) => {
        if (!isVerified) {
            return selectedSet.has(key) ? 'selected' : 'default';
        }

        const isCorrectKey = correctSet.has(key);
        const isSelected = selectedSet.has(key);

        if (isCorrectKey && isSelected) {
            return 'correct';
        }
        if (isCorrectKey && !isSelected) {
            return 'correct';
        }
        if (!isCorrectKey && isSelected) {
            return 'incorrect';
        }
        return 'disabled';
    };

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3 mt-6">
            {answerEntries.map(([key, answerText]) => {
                const state = getAnswerState(key);

                return (
                    <button
                        key={key}
                        onClick={() => {
                            onSelect(key);
                        }}
                        disabled={isVerified}
                        className={cn(
                            'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200',
                            state === 'default' && 'border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-gray-100',
                            state === 'selected' && 'border-violet-400 bg-violet-50 ring-1 ring-violet-200/60',
                            state === 'correct' && 'border-emerald-300 bg-emerald-50',
                            state === 'incorrect' && 'border-rose-300 bg-rose-50',
                            state === 'disabled' && 'border-gray-100 bg-gray-50/40 opacity-55',
                            isVerified ? 'cursor-default' : 'cursor-pointer'
                        )}
                    >
                        <div
                            className={cn(
                                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm',
                                state === 'default' && 'bg-gray-200 text-gray-700',
                                state === 'selected' && 'bg-violet-200 text-violet-900',
                                state === 'correct' && 'bg-emerald-200 text-emerald-800',
                                state === 'incorrect' && 'bg-rose-200 text-rose-800',
                                state === 'disabled' && 'bg-gray-100 text-gray-400'
                            )}
                        >
                            {state === 'correct' ? (
                                <Check className="h-4 w-4" />
                            ) : state === 'incorrect' ? (
                                <X className="h-4 w-4" />
                            ) : (
                                key
                            )}
                        </div>

                        <div
                            className={cn(
                                'flex-1 pt-1 text-base leading-relaxed [&_.katex]:text-inherit',
                                state === 'default' && 'text-gray-800',
                                state === 'selected' && 'text-gray-900',
                                state === 'correct' && 'text-emerald-900',
                                state === 'incorrect' && 'text-rose-900',
                                state === 'disabled' && 'text-gray-500'
                            )}
                        >
                            <LatexContent content={answerText} />
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
