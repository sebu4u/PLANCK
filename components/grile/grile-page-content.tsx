"use client";

import React, { useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { QuizProvider, useQuiz } from './quiz-context';
import { ClassSelector } from './class-selector';
import { QuestionCard } from './question-card';
import { AnswersList } from './answers-list';
import { NavigationControls } from './navigation-controls';
import { fetchAndShuffleQuestions } from '@/lib/supabase-quiz';
import type { GradeLevel } from '@/lib/types/quiz-questions';
import { Loader2, AlertCircle } from 'lucide-react';

function QuizContent() {
    const {
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
        resetQuiz,
        canGoNext,
        canGoPrevious,
    } = useQuiz();

    const handleClassSelect = useCallback(async (level: GradeLevel) => {
        setClassLevel(level);
        setLoading(true);

        try {
            const shuffledQuestions = await fetchAndShuffleQuestions(level);
            setQuestions(shuffledQuestions);
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    }, [setClassLevel, setLoading, setQuestions]);

    const searchParams = useSearchParams();
    const gradeParam = searchParams.get('grade');

    useEffect(() => {
        if (gradeParam && !classLevel) {
            const grade = parseInt(gradeParam);
            if (!isNaN(grade) && [9, 10, 11, 12].includes(grade)) {
                handleClassSelect(grade as GradeLevel);
            }
        }
    }, [gradeParam, classLevel, handleClassSelect]);

    // Show class selector if no class selected
    if (!classLevel) {
        return <ClassSelector onSelect={handleClassSelect} />;
    }

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-violet-400 animate-spin mb-4" />
                <p className="text-white/60">Se încarcă întrebările...</p>
            </div>
        );
    }

    // Show empty state if no questions
    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="h-12 w-12 text-amber-400 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                    Nu există întrebări disponibile
                </h2>
                <p className="text-white/60 mb-6 max-w-md">
                    Nu am găsit întrebări pentru această clasă. Te rugăm să încerci mai târziu sau să alegi altă clasă.
                </p>
                <button
                    onClick={resetQuiz}
                    className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                    ← Înapoi la selecția clasei
                </button>
            </div>
        );
    }

    // Show current question
    if (!currentQuestion) {
        return null;
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 lg:px-6">
            {/* Progress bar */}
            <div className="mb-4 lg:mb-6">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question card */}
            <QuestionCard
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalQuestions={totalQuestions}
            />

            {/* Answers list */}
            <AnswersList
                answers={currentQuestion.answers}
                correctAnswer={currentQuestion.correct_answer}
                userAnswer={currentAnswer}
                onSelect={selectAnswer}
            />

            {/* Navigation controls */}
            <NavigationControls
                currentAnswer={currentAnswer}
                canGoNext={canGoNext}
                canGoPrevious={canGoPrevious}
                onVerify={verifyAnswer}
                onNext={goToNext}
                onPrevious={goToPrevious}
                onSkip={skipCurrentQuestion}
                onReset={resetQuiz}
                isLastQuestion={currentIndex === totalQuestions - 1}
            />
        </div>
    );
}

export function GrilePageContent() {
    return (
        <QuizProvider>
            <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#0a0a0f] pt-20 lg:pt-24 pb-8 lg:pb-4 flex flex-col">
                <div className="flex-1 flex items-start lg:items-center justify-center">
                    <QuizContent />
                </div>
            </div>
        </QuizProvider>
    );
}
