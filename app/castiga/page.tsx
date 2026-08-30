import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"
import { Navigation } from "@/components/navigation"
import { CastigaPageContent } from "@/components/prize-wheel/castiga-page-content"

export const metadata: Metadata = generateMetadata("castiga")

export default function CastigaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <CastigaPageContent />
    </div>
  )
}
