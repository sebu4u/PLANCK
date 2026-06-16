"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { QuizQuestion, GradeLevel, AnswerKey, UserAnswer } from '@/lib/types/quiz-questions';
import { markQuestionAsSolved } from '@/lib/supabase-quiz';
import { verifyQuizSelection } from '@/lib/quiz-question-utils';
import { useGrileSubject } from './grile-subject-context';

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
    verifyAnswer: () => boolean | null;
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

function createEmptyAnswer(questionId: string): UserAnswer {
    return {
        questionId,
        selectedAnswers: [],
        isVerified: false,
        isCorrect: null,
    };
}

export function QuizProvider({ children }: QuizProviderProps) {
    const subjectConfig = useGrileSubject();
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
        return answers.get(currentQuestion.id) || createEmptyAnswer(currentQuestion.id);
    }, [currentQuestion, answers]);

    const totalQuestions = questions.length;
    const canGoNext = currentIndex < totalQuestions - 1;
    const canGoPrevious = currentIndex > 0;

    const selectAnswer = useCallback((answer: AnswerKey) => {
        if (!currentQuestion) return;

        const existingAnswer = answers.get(currentQuestion.id);
        if (existingAnswer?.isVerified) return;

        setAnswers(prev => {
            const next = new Map(prev);
            const current = existingAnswer || createEmptyAnswer(currentQuestion.id);
            let selectedAnswers: AnswerKey[];

            if (subjectConfig.multiSelect) {
                const selectedSet = new Set(current.selectedAnswers);
                if (selectedSet.has(answer)) {
                    selectedSet.delete(answer);
                } else {
                    selectedSet.add(answer);
                }
                selectedAnswers = ANSWER_KEYS_ORDER.filter((key) => selectedSet.has(key));
            } else {
                selectedAnswers = [answer];
            }

            next.set(currentQuestion.id, {
                questionId: currentQuestion.id,
                selectedAnswers,
                isVerified: false,
                isCorrect: null,
            });
            return next;
        });
    }, [currentQuestion, answers, subjectConfig.multiSelect]);

    const verifyAnswer = useCallback((): boolean | null => {
        if (!currentQuestion) return null;

        const userAnswer = answers.get(currentQuestion.id);
        if (!userAnswer || userAnswer.selectedAnswers.length === 0 || userAnswer.isVerified) return null;

        const isCorrect = verifyQuizSelection(userAnswer.selectedAnswers, currentQuestion);

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
        return isCorrect;
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
        if (questions.length <= 1) return;

        setQuestions(prev => {
            const newQuestions = [...prev];
            const [skipped] = newQuestions.splice(currentIndex, 1);
            newQuestions.push(skipped);
            return newQuestions;
        });

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

const ANSWER_KEYS_ORDER: AnswerKey[] = ['A', 'B', 'C', 'D', 'E', 'F'];
