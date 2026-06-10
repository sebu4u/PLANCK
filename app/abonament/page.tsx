"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { PremiumComparisonContent } from "@/components/invata/premium-comparison-content"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { cn } from "@/lib/utils"

export default function AbonamentPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#fafafa_38%,#fefefe_72%,#ffffff_100%)]">
      <Navigation />
      <main
        className={cn(
          "flex min-h-screen flex-col items-center justify-center px-4 py-10 pt-20",
          MOBILE_BOTTOM_NAV_PADDING_CLASS,
          "burger:pb-12",
        )}
      >
        {loading || !user ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        ) : (
          <PremiumComparisonContent />
        )}
      </main>
    </div>
  )
}
