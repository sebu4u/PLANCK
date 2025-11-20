"use client"

import { useEffect, useState } from "react"
import { ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const heroSection = document.getElementById("hero-section")

    const handleVisibility = () => {
      if (heroSection) {
        const { bottom } = heroSection.getBoundingClientRect()
        const heroIsPastViewport = bottom <= 0
        setIsVisible(heroIsPastViewport)
        return
      }

      setIsVisible(window.scrollY > window.innerHeight * 0.7)
    }

    handleVisibility()
    window.addEventListener("scroll", handleVisibility, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <button
      type="button"
      aria-label="Înapoi sus"
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl shadow-[0_16px_35px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/20 hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
        isVisible ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0",
      )}
    >
      <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  )
}