"use client"

import { useEffect } from "react"
import { PlanckPlusTrialModal } from "@/components/planck-plus-trial-modal"

export const FREE_PLAN_LEARNING_PATH_ITEMS_PAYWALL_TITLE =
  "Lecțiile gratuite din trasee s-au terminat. Vezi planurile Planck Plus+ pentru acces nelimitat."

interface FreePlanLearningPathItemsPaywallProps {
  onClose: () => void
}

export function FreePlanLearningPathItemsPaywall({ onClose }: FreePlanLearningPathItemsPaywallProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <PlanckPlusTrialModal title={FREE_PLAN_LEARNING_PATH_ITEMS_PAYWALL_TITLE} onClose={onClose} />
    </div>
  )
}
