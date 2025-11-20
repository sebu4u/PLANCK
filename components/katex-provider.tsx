"use client"

import { useEffect } from "react"

/**
 * Provider that loads KaTeX CSS only when needed
 * This reduces initial bundle size by lazy loading the CSS
 */
export function KatexProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Dynamically import katex CSS only when component mounts
    import("katex/dist/katex.min.css").catch((err) => {
      console.warn("Failed to load KaTeX CSS:", err)
    })
  }, [])

  return <>{children}</>
}

