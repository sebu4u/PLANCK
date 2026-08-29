"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { PregatireMonthCalendar } from "@/components/pregatire/month-calendar"
import type { WorkshopPublic } from "@/lib/pregatire/types"

/** First day shown in the mobile floating week strip (10 Sept 2026). */
const FLOATING_WEEK_START = new Date(Date.UTC(2026, 8, 10, 12, 0, 0))

export function FloatingWeekCalendar({
  visible,
  workshops,
  selectedDay,
  onSelectDay,
  onMonthChange,
}: {
  visible: boolean
  workshops: WorkshopPublic[]
  selectedDay: string | null
  onSelectDay: (dayKey: string | null) => void
  onMonthChange: (year: number, month: number) => void
}) {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    if (!visible) {
      setCompact(false)
      return
    }

    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y <= 8) {
        setCompact(false)
      } else if (y > lastY + 6) {
        setCompact(true)
      } else if (y < lastY - 6) {
        setCompact(false)
      }
      lastY = y
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [visible])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="pregatire-floating-calendar"
          initial={{ y: 88, opacity: 0 }}
          animate={{ y: 0, opacity: 1, scale: compact ? 0.92 : 1 }}
          exit={{ y: 88, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className="pointer-events-auto fixed z-[250] burger:hidden"
          style={{
            originX: 0.5,
            originY: 1,
            left: 12,
            right: 12,
            bottom: "calc(4.5rem + 12px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <PregatireMonthCalendar
            workshops={workshops}
            year={2026}
            month={9}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            onMonthChange={onMonthChange}
            weekView
            weekAnchor={FLOATING_WEEK_START}
            weekAlignMonday={false}
            compact={compact}
            hideHeader
            className="bg-white shadow-[0_8px_28px_rgba(15,23,42,0.12)]"
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
