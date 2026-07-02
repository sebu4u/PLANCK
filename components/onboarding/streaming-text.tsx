"use client"

import { useEffect, useState } from "react"

export function StreamingText({
  text,
  charDelayMs = 28,
  className,
  onComplete,
}: {
  text: string
  charDelayMs?: number
  className?: string
  onComplete?: () => void
}) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setVisibleCount(0)
    setDone(false)
  }, [text])

  useEffect(() => {
    if (visibleCount >= text.length) {
      if (!done) {
        setDone(true)
        onComplete?.()
      }
      return
    }

    const timer = window.setTimeout(() => {
      setVisibleCount((prev) => prev + 1)
    }, charDelayMs)

    return () => window.clearTimeout(timer)
  }, [charDelayMs, done, onComplete, text.length, visibleCount])

  const visibleText = text.slice(0, visibleCount)
  const showCursor = !done

  return (
    <p className={className}>
      {visibleText}
      {showCursor ? <span className="invata-ask-stream-cursor">|</span> : null}
    </p>
  )
}
