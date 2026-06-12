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
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { QuizProvider, useQuiz } from './quiz-context';
import { GrileInsightChatProvider, useGrileInsightChat } from './grile-insight-chat-provider';
import { ClassSelector } from './class-selector';
import { GrileDesktopSidebar } from './grile-desktop-sidebar';
import { useGrileClassSelect } from './use-grile-class-select';
import { QuestionCard } from './question-card';
import { AnswersList } from './answers-list';
import { GrileQuizBottomBar } from './grile-quiz-bottom-bar';
import { fetchQuizQuestionById } from '@/lib/supabase-quiz';
import { formatGrileCatalogInsightContext } from '@/lib/grile-insight-context';
import type { GradeLevel } from '@/lib/types/quiz-questions';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fireLearningPathCorrectConfetti } from '@/lib/learning-path-confetti';
import { playGrileErrorSound, playGrileSuccessSound } from '@/lib/grile-quiz-audio';

const GRILE_DESKTOP_EMPTY_ICON = `/images/icons/${encodeURIComponent("Untitled design (42).png")}`;

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

    const handleExplain = useCallback(() => {
        if (!grileChat || !currentQuestion || !classLevel) return;
        grileChat.openGrileChat({
            problemStatement: formatGrileCatalogInsightContext({
                question: currentQuestion,
                userAnswer: currentAnswer,
                classLevel,
                questionIndex: currentIndex,
                totalQuestions,
            }),
            problemId: `grile-catalog:${currentQuestion.id}:${currentIndex}`,
        });
    }, [grileChat, currentQuestion, currentAnswer, classLevel, currentIndex, totalQuestions]);

    const { handleClassSelect } = useGrileClassSelect();

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

    // Show class selector if no class selected (mobile only; desktop uses sidebar)
    if (!classLevel) {
        return (
            <>
                <div className="w-full lg:hidden">
                    <ClassSelector onSelect={handleClassSelect} />
                </div>
                <div className="hidden w-full max-w-md flex-col items-center px-6 text-center lg:flex">
                    <Image
                        src={GRILE_DESKTOP_EMPTY_ICON}
                        alt=""
                        width={176}
                        height={176}
                        className="mb-1 h-auto w-44 object-contain"
                        priority
                    />
                    <p className="text-sm text-[#2c2f33]/75 sm:text-base">
                        Selectează clasa din meniul din stânga pentru a începe grilele.
                    </p>
                </div>
            </>
        );
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
        <div
            className={cn(
                "mx-auto w-full max-w-4xl px-4 lg:px-6",
                "burger:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]",
                "lg:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]",
            )}
        >
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
                <QuestionCard question={currentQuestion} />

                <AnswersList
                    answers={currentQuestion.answers}
                    correctAnswer={currentQuestion.correct_answer}
                    userAnswer={currentAnswer}
                    onSelect={selectAnswer}
                />
            </div>

            <div className="mt-4 text-center lg:mt-5 lg:hidden">
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
                onExplain={handleExplain}
                isLastQuestion={currentIndex === totalQuestions - 1}
                insightDesktopOpen={insightDesktopOpen}
            />
        </div>
    );
}

function GrilePageShell() {
    const chat = useGrileInsightChat()
    const insightDesktopOpen = Boolean(chat?.grileChatDocked && chat?.isDesktopViewport)
    const { classLevel, isLoading, handleClassSelect } = useGrileClassSelect()
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
                    'relative flex min-h-screen flex-col bg-[#ffffff] pt-16',
                    'lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden',
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
                <GrileDesktopSidebar
                    selectedClass={classLevel}
                    isLoading={isLoading}
                    onSelectClass={handleClassSelect}
                />
                <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:ml-[300px]">
                    <div
                        className={cn(
                            'flex flex-1 items-start justify-center',
                            'lg:absolute lg:inset-[3px] lg:top-0 lg:overflow-hidden lg:rounded-xl lg:bg-[#f5f4f2]',
                        )}
                    >
                        <div
                            className={cn(
                                'w-full',
                                'lg:catalog-problems-scroll lg:flex lg:h-full lg:items-center lg:justify-center lg:overflow-y-auto',
                            )}
                        >
                            <QuizContent />
                        </div>
                    </div>
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
