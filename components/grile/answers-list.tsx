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
                            state === 'default' && 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]',
                            // Selected (before verification)
                            state === 'selected' && 'border-violet-500/50 bg-violet-500/10',
                            // Correct answer (after verification)
                            state === 'correct' && 'border-emerald-500/60 bg-emerald-500/15',
                            // Wrong answer selected (after verification)
                            state === 'incorrect' && 'border-rose-500/60 bg-rose-500/15',
                            // Disabled (other answers after verification)
                            state === 'disabled' && 'border-white/5 bg-white/[0.02] opacity-50',
                            // Cursor states
                            isVerified ? 'cursor-default' : 'cursor-pointer'
                        )}
                    >
                        {/* Answer letter badge */}
                        <div
                            className={cn(
                                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm',
                                state === 'default' && 'bg-white/10 text-white/70',
                                state === 'selected' && 'bg-violet-500/30 text-violet-200',
                                state === 'correct' && 'bg-emerald-500/30 text-emerald-200',
                                state === 'incorrect' && 'bg-rose-500/30 text-rose-200',
                                state === 'disabled' && 'bg-white/5 text-white/40'
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
                                'flex-1 pt-1 text-base leading-relaxed',
                                state === 'default' && 'text-white/80',
                                state === 'selected' && 'text-white',
                                state === 'correct' && 'text-emerald-100',
                                state === 'incorrect' && 'text-rose-100',
                                state === 'disabled' && 'text-white/50'
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
