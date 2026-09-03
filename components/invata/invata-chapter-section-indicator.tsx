"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { queryVisibleInvataChapterSection } from "@/lib/invata/chapter-section-dom"

export type InvataChapterSectionIndicatorProps = {
  chapterIds: string[]
}

const ACTIVE_LINE_VIEWPORT_RATIO = 0.42
const DARK_ENTER_LUMINANCE = 130
const DARK_EXIT_LUMINANCE = 165

function parseColor(color: string): [number, number, number] | null {
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!rgbMatch) return null
  return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])]
}

function findOpaqueBackground(
  start: Element | null,
  skipRoot: Element | null,
): [number, number, number] | null {
  let node: Element | null = start
  while (node) {
    if (skipRoot && skipRoot.contains(node)) {
      node = skipRoot.parentElement
      continue
    }
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

function computeActiveChapterIndex(chapterIds: string[]): number {
  const marker = window.innerHeight * ACTIVE_LINE_VIEWPORT_RATIO
  let activeIndex = 0

  for (let index = 0; index < chapterIds.length; index++) {
    const section = queryVisibleInvataChapterSection(chapterIds[index])
    if (!section) continue
    if (section.getBoundingClientRect().top <= marker) {
      activeIndex = index
    }
  }

  return activeIndex
}

export function InvataChapterSectionIndicator({ chapterIds }: InvataChapterSectionIndicatorProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isDarkBackground, setIsDarkBackground] = useState(false)
  const portalRef = useRef<HTMLDivElement | null>(null)
  const isDarkBackgroundRef = useRef(false)
  const chapterIdsRef = useRef(chapterIds)

  const chapterIdsKey = chapterIds.join("|")
  chapterIdsRef.current = chapterIds

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (chapterIds.length === 0) return

    const updateActiveIndex = () => {
      const nextIndex = computeActiveChapterIndex(chapterIdsRef.current)
      setActiveIndex((current) => (current === nextIndex ? current : nextIndex))
    }

    updateActiveIndex()

    let rafId = 0
    const onScrollOrResize = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateActiveIndex)
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true })
    window.addEventListener("resize", onScrollOrResize)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", onScrollOrResize)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [chapterIdsKey, chapterIds.length])

  useEffect(() => {
    const evaluateBackground = () => {
      const sampleX = Math.max(window.innerWidth - 20, 0)
      const sampleY = Math.floor(window.innerHeight / 2)
      const skipRoot = portalRef.current
      const stack = document.elementsFromPoint(sampleX, sampleY)
      const elAtPoint = stack.find((el) => !skipRoot?.contains(el)) ?? null
      const rgb = findOpaqueBackground(elAtPoint, skipRoot)
      if (!rgb) return

      const [r, g, b] = rgb
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const currentlyDark = isDarkBackgroundRef.current
      const nextDark = currentlyDark
        ? luminance < DARK_EXIT_LUMINANCE
        : luminance < DARK_ENTER_LUMINANCE

      if (nextDark === currentlyDark) return
      isDarkBackgroundRef.current = nextDark
      setIsDarkBackground(nextDark)
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
      ref={portalRef}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-[90] hidden lg:flex flex-col gap-3 py-4 items-end pointer-events-none"
      aria-label="Capitole learning path"
    >
      {chapterIds.map((id, index) => (
        <div
          key={id}
          className={`h-0.5 rounded-full transition-[width,background-color] duration-300 shadow-[0_0_8px_rgba(0,0,0,0.22)] ${
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
