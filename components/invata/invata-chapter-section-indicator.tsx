"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export function invataChapterSectionDomId(chapterId: string) {
  return `invata-chapter-${chapterId}`
}

type InvataChapterSectionIndicatorProps = {
  chapterIds: string[]
}

export function InvataChapterSectionIndicator({ chapterIds }: InvataChapterSectionIndicatorProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isDarkBackground, setIsDarkBackground] = useState(false)

  const chapterIdsKey = chapterIds.join("|")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (chapterIds.length === 0) return

    const sectionIds = chapterIds.map(invataChapterSectionDomId)
    const elements = sectionIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const sectionIndex = sectionIds.indexOf(entry.target.id)
          if (sectionIndex !== -1) setActiveIndex(sectionIndex)
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [chapterIdsKey])

  useEffect(() => {
    const parseColor = (color: string): [number, number, number] | null => {
      const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
      if (!rgbMatch) return null
      return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])]
    }

    const findOpaqueBackground = (start: Element | null): [number, number, number] | null => {
      let node: Element | null = start
      while (node) {
        const style = window.getComputedStyle(node)
        const alpha = Number.parseFloat(style.backgroundColor.split(",")[3] ?? "1")
        if (style.backgroundColor !== "transparent" && !Number.isNaN(alpha) && alpha > 0) {
          const parsed = parseColor(style.backgroundColor)
          if (parsed) return parsed
        }
        node = node.parentElement
      }
      const bodyColor = parseColor(window.getComputedStyle(document.body).backgroundColor)
      return bodyColor ?? [255, 255, 255]
    }

    const evaluateBackground = () => {
      const sampleX = Math.max(window.innerWidth - 20, 0)
      const sampleY = Math.floor(window.innerHeight / 2)
      const elAtPoint = document.elementFromPoint(sampleX, sampleY)
      const rgb = findOpaqueBackground(elAtPoint)
      if (!rgb) return

      const [r, g, b] = rgb
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
      setIsDarkBackground(luminance < 145)
    }

    evaluateBackground()

    let rafId = 0
    const onScrollOrResize = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(evaluateBackground)
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true })
    window.addEventListener("resize", onScrollOrResize)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", onScrollOrResize)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [])

  if (!mounted || chapterIds.length === 0) return null

  return createPortal(
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-[90] hidden lg:flex flex-col gap-3 py-4 items-end pointer-events-none"
      aria-label="Capitole learning path"
    >
      {chapterIds.map((id, index) => (
        <div
          key={id}
          className={`h-0.5 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(0,0,0,0.22)] ${
            index === activeIndex
              ? isDarkBackground
                ? "w-8 bg-white"
                : "w-8 bg-zinc-900"
              : isDarkBackground
                ? "w-2 bg-zinc-600"
                : "w-2 bg-zinc-300"
          }`}
        />
      ))}
    </div>,
    document.body
  )
}
