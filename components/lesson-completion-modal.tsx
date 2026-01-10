'use client'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronRight, Trophy } from "lucide-react"

interface LessonCompletionModalProps {
    isOpen: boolean
    onClose: () => void
    onNextLesson: () => void
    hasNextLesson: boolean
}

export function LessonCompletionModal({ isOpen, onClose, onNextLesson, hasNextLesson }: LessonCompletionModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <Card className="relative w-full max-w-md bg-[#18181b] border-[#27272a] text-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center space-y-6">
                    {/* Icon */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                        <div className="relative bg-green-500/10 p-4 rounded-full border border-green-500/20">
                            <Trophy className="w-12 h-12 text-green-400" />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                            Felicitări!
                        </h2>
                        <p className="text-gray-400">
                            Ai finalizat cu succes această lecție. Continui să înveți?
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col w-full gap-3 sm:flex-row">
                        <Button
                            variant="outline"
                            className="w-full border-white/10 hover:bg-white/5 hover:text-white"
                            onClick={onClose}
                        >
                            Rămâi aici
                        </Button>
                        {hasNextLesson && (
                            <Button
                                className="w-full bg-white text-black hover:bg-gray-200"
                                onClick={() => {
                                    onClose()
                                    onNextLesson()
                                }}
                            >
                                Lecția următoare
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
