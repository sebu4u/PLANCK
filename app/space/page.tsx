import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { SpacePageContent } from "@/components/space/space-page-content"

export const metadata: Metadata = {
    title: "Space - Memorator Fizică | Planck",
    description: "Explorează conceptele și formulele de fizică într-un graf interactiv. Vizualizează conexiunile dintre concepte pentru o învățare mai eficientă.",
    keywords: ["fizică", "memorator", "formule", "concepte", "graf", "învățare", "liceu", "bac"],
    openGraph: {
        title: "Space - Memorator Fizică | Planck",
        description: "Explorează conceptele și formulele de fizică într-un graf interactiv.",
        type: "website",
    },
}

export default function SpacePage() {
    return (
        <div className="h-screen bg-[#0D0D0F] text-white overflow-hidden">
            <Navigation />
            <SpacePageContent />
        </div>
    )
}
