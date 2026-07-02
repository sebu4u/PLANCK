"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { PremiumComparisonContent } from "@/components/invata/premium-comparison-content"
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
    <>
      <Navigation />
      <main
        className={cn(
          "fixed inset-x-0 top-0 bottom-[4.5rem] z-[301] overflow-y-auto bg-[linear-gradient(135deg,#ffffff_0%,#fafafa_38%,#fefefe_72%,#ffffff_100%)]",
          "burger:bottom-0",
        )}
      >
        <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
          {loading || !user ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
          ) : (
            <PremiumComparisonContent />
          )}
        </div>
      </main>
    </>
  )
}
