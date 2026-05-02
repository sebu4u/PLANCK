"use client"

import { FakeSolveSocialContent } from "@/components/dashboard/fake-solve-social-content"
import { cn } from "@/lib/utils"
import type { FakeSolveNotification } from "@/lib/dashboard/fake-solve-social-proof"

interface DashboardFakeSolveSocialOverlayProps {
  notification: FakeSolveNotification | null
  visible: boolean
  onDismiss: () => void
}

export function DashboardFakeSolveSocialOverlay({
  notification,
  visible,
  onDismiss,
}: DashboardFakeSolveSocialOverlayProps) {
  if (!notification) return null

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-3 bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))] z-[290] flex justify-start lg:hidden",
        "transition-all duration-300 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
      role="status"
      aria-live="polite"
      onTransitionEnd={() => {
        if (!visible) onDismiss()
      }}
    >
      <FakeSolveSocialContent
        notification={notification}
        href={`/probleme/${encodeURIComponent(notification.problem.id)}`}
        variant="mobile"
      />
    </div>
  )
}
