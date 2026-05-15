"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QuizProvider, useQuiz } from './quiz-context';
import { GrileInsightChatProvider, useGrileInsightChat } from './grile-insight-chat-provider';
import { ClassSelector } from './class-selector';
import { QuestionCard } from './question-card';
import { AnswersList } from './answers-list';
import { GrileQuizBottomBar } from './grile-quiz-bottom-bar';
import { fetchAndShuffleQuestions, fetchQuizQuestionById } from '@/lib/supabase-quiz';
import { formatGrileCatalogInsightContext } from '@/lib/grile-insight-context';
import type { GradeLevel, QuizQuestion, UserAnswer } from '@/lib/types/quiz-questions';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fireLearningPathCorrectConfetti } from '@/lib/learning-path-confetti';
import { playGrileErrorSound, playGrileSuccessSound } from '@/lib/grile-quiz-audio';

type GrileShellFeedbackContextValue = {
    triggerWrongAnswerFeedback: () => void;
};

const GrileShellFeedbackContext = createContext<GrileShellFeedbackContextValue | null>(null);

function useGrileShellFeedback() {
    return useContext(GrileShellFeedbackContext);
}

function QuizContent() {
    const router = useRouter();
    const grileChat = useGrileInsightChat();
    const insightDesktopOpen = Boolean(grileChat?.grileChatDocked && grileChat?.isDesktopViewport);
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
    const shellFeedback = useGrileShellFeedback();
    const [singleQuestionNotFound, setSingleQuestionNotFound] = useState(false);

    const handleVerify = useCallback(() => {
        const result = verifyAnswer();
        if (result === true) {
            playGrileSuccessSound();
            fireLearningPathCorrectConfetti();
        } else if (result === false) {
            playGrileErrorSound();
            shellFeedback?.triggerWrongAnswerFeedback();
        }
    }, [verifyAnswer, shellFeedback]);

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
    const questionParam = searchParams.get('question');

    useEffect(() => {
        if (!questionParam || classLevel) return;

        let cancelled = false;

        const loadSpecificQuestion = async () => {
            setLoading(true);
            setSingleQuestionNotFound(false);

            try {
                const question = await fetchQuizQuestionById(questionParam);
                if (cancelled) return;

                if (!question) {
                    setSingleQuestionNotFound(true);
                    return;
                }

                setClassLevel(question.class);
                setQuestions([question]);
            } catch (error) {
                console.error('Error fetching specific quiz question:', error);
                if (!cancelled) {
                    setSingleQuestionNotFound(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadSpecificQuestion();

        return () => {
            cancelled = true;
        };
    }, [questionParam, classLevel, setClassLevel, setLoading, setQuestions]);

    useEffect(() => {
        if (questionParam || !gradeParam || classLevel) return;

            const grade = parseInt(gradeParam);
            if (!isNaN(grade) && [9, 10, 11, 12].includes(grade)) {
                handleClassSelect(grade as GradeLevel);
            }
    }, [questionParam, gradeParam, classLevel, handleClassSelect]);

    if (questionParam && !classLevel && !singleQuestionNotFound) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-violet-600 animate-spin mb-4" />
                <p className="text-[#6d6d6d]">Se încarcă grila selectată...</p>
            </div>
        );
    }

    if (questionParam && singleQuestionNotFound) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="h-12 w-12 text-amber-600 mb-4" />
                <h2 className="text-xl font-semibold text-[#111111] mb-2">
                    Grila selectată nu a fost găsită
                </h2>
                <p className="text-[#6d6d6d] mb-6 max-w-md">
                    ID-ul trimis nu corespunde unei întrebări existente.
                </p>
                <button
                    onClick={() => router.push('/grile')}
                    className="text-violet-700 hover:text-violet-600 font-medium transition-colors"
                >
                    Vezi toate grilele
                </button>
            </div>
        );
    }

    // Show class selector if no class selected
    if (!classLevel) {
        return <ClassSelector onSelect={handleClassSelect} />;
    }

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-violet-600 animate-spin mb-4" />
                <p className="text-[#6d6d6d]">Se încarcă întrebările...</p>
            </div>
        );
    }

    // Show empty state if no questions
    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="h-12 w-12 text-amber-600 mb-4" />
                <h2 className="text-xl font-semibold text-[#111111] mb-2">
                    Nu există întrebări disponibile
                </h2>
                <p className="text-[#6d6d6d] mb-6 max-w-md">
                    Nu am găsit întrebări pentru această clasă. Te rugăm să încerci mai târziu sau să alegi altă clasă.
                </p>
                <button
                    onClick={resetQuiz}
                    className="text-violet-700 hover:text-violet-600 font-medium transition-colors"
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

    if (!classLevel) {
        return null;
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 lg:px-6 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
                <QuestionCard question={currentQuestion} />

                <AnswersList
                    answers={currentQuestion.answers}
                    correctAnswer={currentQuestion.correct_answer}
                    userAnswer={currentAnswer}
                    onSelect={selectAnswer}
                />
            </div>

            <div className="mt-4 text-center lg:mt-5">
                <button
                    type="button"
                    onClick={resetQuiz}
                    className="text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                    ← Schimbă clasa
                </button>
            </div>

            <GrileQuizBottomBar
                currentAnswer={currentAnswer}
                canGoNext={canGoNext}
                canGoPrevious={canGoPrevious}
                onVerify={handleVerify}
                onNext={goToNext}
                onPrevious={goToPrevious}
                onSkip={skipCurrentQuestion}
                onReset={resetQuiz}
                isLastQuestion={currentIndex === totalQuestions - 1}
                insightDesktopOpen={insightDesktopOpen}
            />

            <GrileInsightFab
                classLevel={classLevel}
                currentQuestion={currentQuestion}
                currentAnswer={currentAnswer}
                currentIndex={currentIndex}
                totalQuestions={totalQuestions}
            />
        </div>
    );
}

function GrileInsightFab({
    classLevel,
    currentQuestion,
    currentAnswer,
    currentIndex,
    totalQuestions,
}: {
    classLevel: GradeLevel
    currentQuestion: QuizQuestion
    currentAnswer: UserAnswer | null
    currentIndex: number
    totalQuestions: number
}) {
    const grileChat = useGrileInsightChat()
    const grileDesktopChat = Boolean(grileChat?.grileChatDocked && grileChat?.isDesktopViewport)

    if (!grileChat) return null

    return (
        <button
            type="button"
            onClick={() => {
                grileChat.openGrileChat({
                    problemStatement: formatGrileCatalogInsightContext({
                        question: currentQuestion,
                        userAnswer: currentAnswer,
                        classLevel,
                        questionIndex: currentIndex,
                        totalQuestions,
                    }),
                    problemId: `grile-catalog:${currentQuestion.id}:${currentIndex}`,
                })
            }}
            className={cn(
                'fixed z-[400] flex items-center gap-2 rounded-full border border-violet-500/40 bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/15 transition hover:from-violet-500 hover:to-purple-500',
                'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] max-lg:right-[max(1.5rem,env(safe-area-inset-right,0px))]',
                grileDesktopChat ? 'lg:right-[calc(1.5rem+25vw)]' : 'lg:right-6',
            )}
        >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            Întreabă Insight
        </button>
    )
}

function GrilePageShell() {
    const chat = useGrileInsightChat()
    const insightDesktopOpen = Boolean(chat?.grileChatDocked && chat?.isDesktopViewport)
    const [wrongFlash, setWrongFlash] = useState(false)
    const wrongFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const triggerWrongAnswerFeedback = useCallback(() => {
        setWrongFlash(true)
        if (wrongFlashTimeoutRef.current) {
            clearTimeout(wrongFlashTimeoutRef.current)
        }
        wrongFlashTimeoutRef.current = setTimeout(() => {
            setWrongFlash(false)
            wrongFlashTimeoutRef.current = null
        }, 520)
    }, [])

    const shellFeedbackValue = useMemo(
        () => ({ triggerWrongAnswerFeedback }),
        [triggerWrongAnswerFeedback],
    )

    return (
        <GrileShellFeedbackContext.Provider value={shellFeedbackValue}>
            <div
                className={cn(
                    'relative min-h-screen lg:h-screen lg:overflow-hidden bg-[#ffffff] pt-20 lg:pt-24 pb-8 lg:pb-4 flex flex-col',
                    insightDesktopOpen && 'lg:mr-[25vw]',
                    wrongFlash && 'animate-grile-wrong-shake',
                )}
            >
                <div
                    className={cn(
                        'pointer-events-none absolute inset-0 z-[45] transition-[background-color] duration-150 ease-out',
                        wrongFlash ? 'bg-rose-500/[0.16]' : 'bg-transparent',
                    )}
                    aria-hidden
                />
                <div className="relative z-10 flex flex-1 items-start justify-center lg:items-center">
                    <QuizContent />
                </div>
            </div>
        </GrileShellFeedbackContext.Provider>
    )
}

export function GrilePageContent() {
    return (
        <QuizProvider>
            <GrileInsightChatProvider>
                <GrilePageShell />
            </GrileInsightChatProvider>
        </QuizProvider>
    )
}
