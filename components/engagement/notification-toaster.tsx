"use client"

import { usePathname } from "next/navigation"
import { Toaster } from "sonner"
import { isLearningPathItemRoute } from "@/lib/engagement/routes"

export function EngagementNotificationToaster() {
  const pathname = usePathname()
  if (isLearningPathItemRoute(pathname)) return null

  return (
    <Toaster
      richColors
      position="bottom-right"
      toastOptions={{
        duration: 5000,
        classNames: {
          toast: "border border-violet-100 bg-white text-[#111111] shadow-xl",
          title: "font-bold",
          description: "text-[#4d4d4d]",
          actionButton: "bg-violet-600 text-white",
        },
      }}
    />
  )
}

