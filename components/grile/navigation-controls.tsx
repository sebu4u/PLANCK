"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle, RotateCcw } from 'lucide-react';
import type { UserAnswer } from '@/lib/types/quiz-questions';

interface NavigationControlsProps {
    currentAnswer: UserAnswer | null;
    canGoNext: boolean;
    canGoPrevious: boolean;
    onVerify: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onSkip: () => void;
    onReset: () => void;
    isLastQuestion: boolean;
}

export function NavigationControls({
    currentAnswer,
    canGoNext,
    canGoPrevious,
    onVerify,
    onNext,
    onPrevious,
    onSkip,
    onReset,
    isLastQuestion,
}: NavigationControlsProps) {
    const hasSelectedAnswer = currentAnswer?.selectedAnswer !== null;
    const isVerified = currentAnswer?.isVerified ?? false;
    const canVerify = hasSelectedAnswer && !isVerified;

    return (
        <div className="w-full mt-4 lg:mt-6 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left side - Previous button */}
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={!canGoPrevious}
                    className="border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Înapoi
                </Button>

                {/* Right side - Dynamic button based on state */}
                {(() => {
                    // Last question after verification -> New test button
                    if (isLastQuestion && isVerified) {
                        return (
                            <Button
                                onClick={onReset}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Nou test
                            </Button>
                        );
                    }

                    // After verification -> Next button
                    if (isVerified) {
                        return (
                            <Button
                                onClick={onNext}
                                disabled={!canGoNext}
                                className="bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Următoarea
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        );
                    }

                    // Answer selected but not verified -> Verify button
                    if (hasSelectedAnswer) {
                        return (
                            <Button
                                onClick={onVerify}
                                className="bg-violet-600 hover:bg-violet-500 text-white px-8"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verifică
                            </Button>
                        );
                    }

                    // No answer selected -> Skip button
                    return (
                        <Button
                            variant="outline"
                            onClick={onSkip}
                            className="border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Skip
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    );
                })()}
            </div>

            {/* Reset button for going back to class selection */}
            <div className="mt-3 lg:mt-4 text-center">
                <button
                    onClick={onReset}
                    className="text-white/40 hover:text-white/60 text-sm transition-colors"
                >
                    ← Schimbă clasa
                </button>
            </div>
        </div>
    );
}
