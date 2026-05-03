import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PremiumComparisonContent } from "@/components/invata/premium-comparison-content"

interface FreePlanComparisonScreenProps {
  backHref: string
}

export function FreePlanComparisonScreen({ backHref }: FreePlanComparisonScreenProps) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#fafafa_38%,#fefefe_72%,#ffffff_100%)] px-4 py-16">
      <Link
        href={backHref}
        className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-sm font-semibold text-[#3f3650] backdrop-blur transition-colors hover:bg-white/85 sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la lecție
      </Link>

      <PremiumComparisonContent />
    </div>
  )
}
