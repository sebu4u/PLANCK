"use client"

import { usePathname } from "next/navigation"
import { AlertCircle, Check } from "lucide-react"
import { Toaster } from "sonner"
import { isLearningPathItemRoute } from "@/lib/engagement/routes"

export function EngagementNotificationToaster() {
  const pathname = usePathname()
  if (isLearningPathItemRoute(pathname)) return null

  return (
    <Toaster
      position="bottom-center"
      offset={24}
      visibleToasts={1}
      duration={2000}
      icons={{
        success: <Check className="h-5 w-5 text-[#111111]" strokeWidth={2.5} />,
        error: <AlertCircle className="h-5 w-5 text-[#111111]" strokeWidth={2.25} />,
        info: <Check className="h-5 w-5 text-[#111111]" strokeWidth={2.5} />,
        warning: <AlertCircle className="h-5 w-5 text-[#111111]" strokeWidth={2.25} />,
      }}
      toastOptions={{
        duration: 2000,
        classNames: {
          toast:
            "group flex w-auto max-w-[min(480px,calc(100vw-2rem))] items-center gap-3 rounded-2xl border-0 px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-[#E6F4EA] text-[#111111]",
          title: "text-base font-medium leading-snug text-[#111111]",
          description: "text-base leading-snug text-[#333333]",
          success: "!bg-[#E6F4EA] !text-[#111111]",
          error: "!bg-[#FCE8E6] !text-[#111111]",
          info: "!bg-[#E6F4EA] !text-[#111111]",
          warning: "!bg-[#FFF4E5] !text-[#111111]",
          actionButton:
            "rounded-lg bg-black/10 px-3 text-sm font-medium text-[#111111]",
          closeButton: "hidden",
        },
      }}
    />
  )
}
