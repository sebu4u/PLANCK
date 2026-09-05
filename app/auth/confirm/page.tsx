import { Suspense } from "react"
import { PlanckWeekAuthConfirmClient } from "@/components/auth/auth-confirm-client"

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        </div>
      }
    >
      <PlanckWeekAuthConfirmClient />
    </Suspense>
  )
}
