"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

/** Mobile sticky CTA after scrolling past the hero. Hidden on desktop. */
export function LandingStickyMobileCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.85)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[#EBE8FF] bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          <Link
            href="/register"
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] text-sm font-bold text-white shadow-[0_4px_0_#5B47D6]"
          >
            Începe gratuit!
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
