"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const SCROLL_DELTA = 8

/**
 * Card fix + glow; ascuns la scroll în jos, reapare la scroll în sus (translate spre jos).
 */
export function LockedLessonBottomCta() {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  const onScroll = useCallback(() => {
    const y = window.scrollY
    const prev = lastY.current
    const delta = y - prev
    lastY.current = y

    if (y < 72) {
      setVisible(true)
      return
    }

    if (delta > SCROLL_DELTA) {
      setVisible(false)
    } else if (delta < -SCROLL_DELTA) {
      setVisible(true)
    }
  }, [])

  useEffect(() => {
    lastY.current = window.scrollY
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [onScroll])

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center px-2 pb-6 pt-2 sm:px-4 lg:left-[calc(360px+2rem)] lg:right-8 lg:justify-center xl:left-[calc(400px+2rem)]",
        "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform",
        /* translate-y-full pe intregul bloc (glow + card in flux) ca sa iasa complet in jos */
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none flex w-full shrink-0 justify-center overflow-x-visible overflow-y-visible"
      >
        <div
          className="h-[min(340px,56vh)] w-[min(94vw,44rem)] shrink-0 translate-y-[10%] bg-[radial-gradient(ellipse_85%_75%_at_50%_100%,rgba(124,58,237,0.72)_0%,rgba(139,92,246,0.42)_34%,rgba(167,139,250,0.22)_52%,rgba(196,181,253,0.1)_68%,transparent_88%)] blur-[28px] sm:w-[min(88vw,52rem)]"
        />
      </div>

      <div className="relative z-10 -mt-[min(200px,35vh)] w-full max-w-[min(100%,22rem)] px-2 sm:max-w-[min(100%,28rem)] sm:px-0">
        <div className="rounded-[20px] border border-[#e9e0f0] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(82,44,111,0.08)]">
          <p className="text-center text-xl font-bold text-[#111111]">In curand disponibil</p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-3 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6]"
          >
            <span className="relative z-[1] inline-flex items-center gap-2">
              Vezi abonamente
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
