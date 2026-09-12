"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { PlanckWeekCtaButton } from "@/components/planck-week/cta-button"
import { useCookieManager } from "@/lib/cookie-management"

export function PlanckWeekStickyMobileCta({
  onReserve,
  hidden = false,
  label,
}: {
  onReserve: () => void
  hidden?: boolean
  label?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const { hasConsent } = useCookieManager()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.85)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {visible && hasConsent && !hidden && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[#EBE8FF] bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          <PlanckWeekCtaButton onClick={onReserve} size="full" label={label} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
