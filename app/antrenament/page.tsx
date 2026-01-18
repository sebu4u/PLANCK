import { TrainingPageContent } from "@/components/antrenament/training-page-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Antrenament | PLANCK",
    description: "Teste de antrenament pentru concursul de fizică PLANCK.",
}

export default function TrainingPage() {
    return <TrainingPageContent />
}
