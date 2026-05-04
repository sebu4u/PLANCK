"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { PremiumComparisonContent } from "@/components/invata/premium-comparison-content"

interface FreePlanComparisonOverlayProps {
  onClose: () => void
}

export function FreePlanComparisonOverlay({ onClose }: FreePlanComparisonOverlayProps) {
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
      className="fixed inset-0 z-[600] flex items-center justify-center overflow-y-auto bg-[linear-gradient(135deg,#ffffff_0%,#fafafa_38%,#fefefe_72%,#ffffff_100%)] px-4 py-10 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Închide"
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#6b6b6b] transition-colors hover:bg-white/40 hover:text-[#111111] sm:right-6 sm:top-6"
      >
        <X className="h-5 w-5" />
      </button>

      <PremiumComparisonContent />
    </div>
  )
}
