import { TrainingPageContent } from "@/components/antrenament/training-page-content"
import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
    title: "Antrenament | PLANCK",
    description: "Teste de antrenament pentru concursul de fizică PLANCK.",
}

function TrainingPageFallback() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    )
}

export default function TrainingPage() {
    return (
        <Suspense fallback={<TrainingPageFallback />}>
            <TrainingPageContent />
        </Suspense>
    )
}
