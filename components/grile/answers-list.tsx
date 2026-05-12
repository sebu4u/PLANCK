"use client";

import React from 'react';
import type { QuizAnswers, AnswerKey, UserAnswer } from '@/lib/types/quiz-questions';
import { LatexContent } from './question-card';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface AnswersListProps {
    answers: QuizAnswers;
    correctAnswer: AnswerKey;
    userAnswer: UserAnswer | null;
    onSelect: (answer: AnswerKey) => void;
}

const answerKeys: AnswerKey[] = ['A', 'B', 'C', 'D', 'E', 'F'];

export function AnswersList({ answers, correctAnswer, userAnswer, onSelect }: AnswersListProps) {
    const selectedAnswer = userAnswer?.selectedAnswer;
    const isVerified = userAnswer?.isVerified ?? false;

    const getAnswerState = (key: AnswerKey) => {
        if (!isVerified) {
            return selectedAnswer === key ? 'selected' : 'default';
        }

        // After verification
        if (key === correctAnswer) {
            return 'correct';
        }
        if (selectedAnswer === key && key !== correctAnswer) {
            return 'incorrect';
        }
        return 'disabled';
    };

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3 mt-6">
            {answerKeys.map((key) => {
                const state = getAnswerState(key);
                const answerText = answers[key];

                return (
                    <button
                        key={key}
                        onClick={() => onSelect(key)}
                        disabled={isVerified}
                        className={cn(
                            'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200',
                            // Default state
                            state === 'default' && 'border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-gray-100',
                            // Selected (before verification)
                            state === 'selected' && 'border-violet-400 bg-violet-50 ring-1 ring-violet-200/60',
                            // Correct answer (after verification)
                            state === 'correct' && 'border-emerald-300 bg-emerald-50',
                            // Wrong answer selected (after verification)
                            state === 'incorrect' && 'border-rose-300 bg-rose-50',
                            // Disabled (other answers after verification)
                            state === 'disabled' && 'border-gray-100 bg-gray-50/40 opacity-55',
                            // Cursor states
                            isVerified ? 'cursor-default' : 'cursor-pointer'
                        )}
                    >
                        {/* Answer letter badge */}
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

                        {/* Answer text */}
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
