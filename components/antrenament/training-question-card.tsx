"use client"

import { useState, lazy, Suspense, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, HelpCircle, Star } from "lucide-react"
import 'katex/dist/katex.min.css'

// Lazy load KaTeX components (reused logic from problem-card.tsx for consistency)
const LazyInlineMath = lazy(() => import('react-katex').then(module => ({ default: module.InlineMath })))

// MathContent Component
function MathContent({ content }: { content: string }) {
    const [isMathLoaded, setIsMathLoaded] = useState(false)
    const [hasMath, setHasMath] = useState(false)

    useEffect(() => {
        const containsMath = content.includes('$')
        setHasMath(containsMath)

        if (containsMath) {
            const timer = setTimeout(() => {
                setIsMathLoaded(true)
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [content])

    if (!hasMath) {
        return <span>{content}</span>
    }

    if (!isMathLoaded) {
        return <span className="bg-gray-700/30 rounded px-2 text-transparent animate-pulse">math</span>
    }

    return (
        <Suspense fallback={<span className="bg-gray-700/30 rounded px-2 text-transparent animate-pulse">math</span>}>
            {content.split(/(\$[^$]+\$)/g).map((part, idx) =>
                part.startsWith('$') && part.endsWith('$') ? (
                    <LazyInlineMath key={idx} math={part.slice(1, -1)} />
                ) : (
                    <span key={idx}>{part}</span>
                )
            )}
        </Suspense>
    )
}

interface TrainingQuestion {
    id: string
    problem_number: number
    statement: string
    option1: string
    option2: string
    option3: string
    option4: string
    correct_option: number
    image_url?: string | null
}

interface TrainingQuestionCardProps {
    question: TrainingQuestion
    showAiSuggestion?: boolean
    onAnswerChecked?: (questionId: string, isCorrect: boolean) => void
    onShowAiClick?: () => void
}

export function TrainingQuestionCard({ question, showAiSuggestion = false, onAnswerChecked, onShowAiClick }: TrainingQuestionCardProps) {
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [isChecked, setIsChecked] = useState(false)

    const handleCheck = () => {
        if (selectedOption !== null) {
            setIsChecked(true)
            const isCorrect = selectedOption === question.correct_option
            onAnswerChecked?.(question.id, isCorrect)
        }
    }

    const getOptionStyle = (optionIndex: number) => {
        if (!isChecked) {
            return selectedOption === optionIndex
                ? "border-green-500 bg-green-500/10 text-green-700 font-semibold" // Selected state
                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700" // Default state
        }

        if (optionIndex === question.correct_option) {
            return "border-green-500 bg-green-50 text-green-700" // Correct answer
        }

        if (selectedOption === optionIndex && selectedOption !== question.correct_option) {
            return "border-red-500 bg-red-50 text-red-700" // Wrong selection
        }

        return "border-gray-100 bg-gray-50 text-gray-400 opacity-50" // Other options when checked
    }

    const shouldShowAiCard = showAiSuggestion && isChecked && selectedOption !== question.correct_option

    return (
        <div className={cn("space-y-0", shouldShowAiCard && "shadow-lg rounded-2xl")}>
        <Card className={cn("relative overflow-hidden border border-gray-200 bg-white p-5 sm:p-6 rounded-2xl transition-all duration-300 hover:border-gray-300", shouldShowAiCard ? "rounded-b-none shadow-none" : "shadow-lg hover:shadow-xl")}>
            {/* Problem Number Badge */}
            <div className="absolute top-0 left-0 bg-gradient-to-br from-green-500 to-green-600 px-3 py-1.5 rounded-br-xl text-white font-bold text-sm shadow-md z-10">
                #{question.problem_number}
            </div>

            <div className="mt-5 mb-3 space-y-3">
                {/* Statement */}
                <div className="text-sm sm:text-base text-gray-900 leading-relaxed font-medium">
                    <MathContent content={question.statement} />
                </div>

                {/* Optional Image */}
                {question.image_url && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={question.image_url}
                            alt={`Imagine problema #${question.problem_number}`}
                            className="w-full h-auto max-h-[300px] object-contain bg-gray-50"
                        />
                    </div>
                )}

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((idx) => {
                        const optionText = question[`option${idx}` as keyof TrainingQuestion] as string;
                        return (
                            <button
                                key={idx}
                                onClick={() => !isChecked && setSelectedOption(idx)}
                                disabled={isChecked}
                                className={cn(
                                    "relative p-3 rounded-lg border text-left transition-all duration-200 group flex items-center gap-3",
                                    getOptionStyle(idx)
                                )}
                            >
                                <div className={cn(
                                    "shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors mt-0.5",
                                    isChecked && idx === question.correct_option ? "border-green-500 bg-green-500 text-white" :
                                        isChecked && selectedOption === idx && idx !== question.correct_option ? "border-red-500 bg-red-500 text-white" :
                                            selectedOption === idx ? "border-green-500 bg-green-500 text-white" :
                                                "border-gray-300 text-gray-500 group-hover:border-gray-400"
                                )}>
                                    {String.fromCharCode(64 + idx)}
                                </div>
                                <span className={cn("text-sm sm:text-base", isChecked && idx !== question.correct_option && selectedOption !== idx && "text-gray-500")}>
                                    <MathContent content={optionText} />
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Actions / Feedback */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                <div className="flex items-center gap-2">
                    {isChecked ? (
                        selectedOption === question.correct_option ? (
                            <span className="flex items-center gap-2 text-green-600 font-bold animate-in fade-in slide-in-from-left-2">
                                <CheckCircle2 className="w-5 h-5" />
                                Corect! Bravo!
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-red-600 font-bold animate-in fade-in slide-in-from-left-2">
                                <XCircle className="w-5 h-5" />
                                Răspuns greșit.
                            </span>
                        )
                    ) : (
                        <span className="text-gray-500 text-sm flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" />
                            Alege o variantă
                        </span>
                    )}
                </div>

                {!isChecked && (
                    <Button
                        onClick={handleCheck}
                        disabled={selectedOption === null}
                        className={cn(
                            "rounded-full px-6 py-2 font-bold text-sm transition-all duration-300 shadow-md",
                            selectedOption !== null
                                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-green-500/25 hover:scale-105"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        Verifică
                    </Button>
                )}
                {isChecked && (
                    <div className="text-sm text-gray-500">
                        Varianta corectă: <span className="font-bold text-green-600 ml-1">{String.fromCharCode(64 + question.correct_option)}</span>
                    </div>
                )}
            </div>

        </Card>
            {/* AI Suggestion Card - appears below when answer is wrong */}
            {shouldShowAiCard && (
                <Card className="border-t-0 border border-gray-200 bg-white p-4 sm:p-5 rounded-t-none rounded-b-2xl shadow-lg animate-in fade-in slide-in-from-top-2 relative z-10" style={{ boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 -2px 10px -5px rgba(0, 0, 0, 0.05), -8px 0 20px -5px rgba(0, 0, 0, 0.1), 8px 0 20px -5px rgba(0, 0, 0, 0.1)' }}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-full bg-gray-800 items-center justify-center shadow-sm">
                                <Star className="w-5 h-5 text-white fill-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm sm:text-base text-gray-900 font-medium leading-relaxed">
                                    <span className="sm:hidden">Vezi soluția cu AI</span>
                                    <span className="hidden sm:inline">Poți vedea cum se rezolvă această problemă cu modul AI pentru testele de antrenament.</span>
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={onShowAiClick}
                            className="shrink-0 rounded-full px-6 py-2 font-bold text-sm bg-gray-900 hover:bg-gray-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                        >
                            Arata-mi
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
}
