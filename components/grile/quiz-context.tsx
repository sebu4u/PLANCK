"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { QuizQuestion, GradeLevel, AnswerKey, UserAnswer } from '@/lib/types/quiz-questions';
import { markQuestionAsSolved } from '@/lib/supabase-quiz';

interface QuizContextValue {
    // Session state
    classLevel: GradeLevel | null;
    questions: QuizQuestion[];
    currentIndex: number;
    isLoading: boolean;

    // Current question helpers
    currentQuestion: QuizQuestion | null;
    currentAnswer: UserAnswer | null;
    totalQuestions: number;

    // Actions
    setClassLevel: (level: GradeLevel) => void;
    setQuestions: (questions: QuizQuestion[]) => void;
    setLoading: (loading: boolean) => void;
    selectAnswer: (answer: AnswerKey) => void;
    verifyAnswer: () => void;
    goToNext: () => void;
    goToPrevious: () => void;
    goToQuestion: (index: number) => void;
    resetQuiz: () => void;

    // Navigation state
    skipCurrentQuestion: () => void;
    canGoNext: boolean;
    canGoPrevious: boolean;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function useQuiz() {
    const context = useContext(QuizContext);
    if (!context) {
        throw new Error('useQuiz must be used within a QuizProvider');
    }
    return context;
}

interface QuizProviderProps {
    children: React.ReactNode;
}

export function QuizProvider({ children }: QuizProviderProps) {
    const [classLevel, setClassLevel] = useState<GradeLevel | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setLoading] = useState(false);
    const [answers, setAnswers] = useState<Map<string, UserAnswer>>(new Map());

    const currentQuestion = useMemo(() => {
        return questions[currentIndex] || null;
    }, [questions, currentIndex]);

    const currentAnswer = useMemo(() => {
        if (!currentQuestion) return null;
        return answers.get(currentQuestion.id) || {
            questionId: currentQuestion.id,
            selectedAnswer: null,
            isVerified: false,
            isCorrect: null,
        };
    }, [currentQuestion, answers]);

    const totalQuestions = questions.length;
    const canGoNext = currentIndex < totalQuestions - 1;
    const canGoPrevious = currentIndex > 0;

    const selectAnswer = useCallback((answer: AnswerKey) => {
        if (!currentQuestion) return;

        // Don't allow changing answer after verification
        const existingAnswer = answers.get(currentQuestion.id);
        if (existingAnswer?.isVerified) return;

        setAnswers(prev => {
            const next = new Map(prev);
            next.set(currentQuestion.id, {
                questionId: currentQuestion.id,
                selectedAnswer: answer,
                isVerified: false,
                isCorrect: null,
            });
            return next;
        });
    }, [currentQuestion, answers]);

    const verifyAnswer = useCallback(() => {
        if (!currentQuestion) return;

        const userAnswer = answers.get(currentQuestion.id);
        if (!userAnswer || userAnswer.selectedAnswer === null || userAnswer.isVerified) return;

        const isCorrect = userAnswer.selectedAnswer === currentQuestion.correct_answer;

        if (isCorrect) {
            markQuestionAsSolved(currentQuestion.id).catch(console.error);
        }

        setAnswers(prev => {
            const next = new Map(prev);
            next.set(currentQuestion.id, {
                ...userAnswer,
                isVerified: true,
                isCorrect,
            });
            return next;
        });
    }, [currentQuestion, answers]);

    const goToNext = useCallback(() => {
        if (canGoNext) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [canGoNext]);

    const goToPrevious = useCallback(() => {
        if (canGoPrevious) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [canGoPrevious]);

    const skipCurrentQuestion = useCallback(() => {
        if (questions.length <= 1) return; // Can't skip if only 1 question

        setQuestions(prev => {
            const newQuestions = [...prev];
            // Remove current question
            const [skipped] = newQuestions.splice(currentIndex, 1);
            // Add to the end
            newQuestions.push(skipped);
            return newQuestions;
        });

        // We don't change currentIndex, so the next question (which shifted into this spot) is shown.
        // However, if we were at the last index, the shifted spot is now empty?
        // Example: [A, B, C], index 2 (C). Splice C -> [A, B]. Push C -> [A, B, C].
        // Index 2 is still C.
        // This is fine for the "last text" case, but if user wants to skip the last one to go back to start?
        // User just said "skip".
        // If we are at the last index, and we want to "skip" to a new question, we probably need to wrap around or something.
        // But if currentIndex points to the end, and we just moved the element to the end, we are still looking at it.
        // Maybe we should decrement currentIndex if it's the last element? No, then we look at previous.
        // Ideally we want to look at the *first* unsolved question?
        // But we are just reordering.
        // If we are at end, we are at end.

        // Actually, if we are at the last index, and we skip, we probably want to go to index 0?
        // Or if we move it, effectively it stays at last index.
        // If the user wants to see *another* question, we should probably shuffle it better or move index.
        // But if we only have 1 question left, we can't show another.
        // If we have [Solved, Solved, Unsolved(Current)], and we skip.
        // We want to see Solved? No.

        // Let's assume the user hasn't solved previous ones?
        // "skip" implies we haven't solved it.
        // If we have mixed solved/unsolved in the history.

        // Simpler logic:
        // Move current to end.
        // If we are at the end of the array, set currentIndex to 0?
        // This ensures check all questions.

        if (currentIndex === questions.length - 1) {
            setCurrentIndex(0);
        }

    }, [questions.length, currentIndex]);

    const goToQuestion = useCallback((index: number) => {
        if (index >= 0 && index < totalQuestions) {
            setCurrentIndex(index);
        }
    }, [totalQuestions]);

    const resetQuiz = useCallback(() => {
        setClassLevel(null);
        setQuestions([]);
        setCurrentIndex(0);
        setAnswers(new Map());
        setLoading(false);
    }, []);

    const value: QuizContextValue = {
        classLevel,
        questions,
        currentIndex,
        isLoading,
        currentQuestion,
        currentAnswer,
        totalQuestions,
        setClassLevel,
        setQuestions,
        setLoading,
        selectAnswer,
        verifyAnswer,
        goToNext,
        goToPrevious,
        skipCurrentQuestion,
        goToQuestion,
        resetQuiz,
        canGoNext,
        canGoPrevious,
    };

    return (
        <QuizContext.Provider value={value}>
            {children}
        </QuizContext.Provider>
    );
}
