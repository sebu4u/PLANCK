import { Metadata } from "next"
import { ConcursContent } from "@/components/concurs/concurs-content"
import { ConcursNavbar } from "@/components/concurs/concurs-navbar"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"

export const metadata: Metadata = {
    title: "Concursul Național de Fizică PLANCK | Ediția 2026",
    description: "Participă la Concursul Național de Fizică PLANCK, ediția 2026. Înscrie-te acum și demonstrează-ți cunoștințele de fizică!",
}

export default function ConcursPage() {
    return (
        <>
            {/* Navbar outside ScrollAnimationProvider to stay fixed on screen */}
            <ConcursNavbar />
            <ScrollAnimationProvider>
                <ConcursContent />
            </ScrollAnimationProvider>
        </>
    )
}
