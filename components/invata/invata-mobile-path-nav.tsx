"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BookOpen } from "lucide-react"
import {
  getLearningPathChapterNavTitle,
  type LearningPathChapter,
} from "@/lib/supabase-learning-paths"
import { invataChapterSectionDomId } from "@/components/invata/invata-chapter-section-indicator"
import {
  InvataDeferredImage,
  useInvataChapterImagesEnabled,
} from "@/components/invata/invata-chapter-image-load-context"
import { cn } from "@/lib/utils"

interface InvataMobilePathNavChapterButtonProps {
  chapter: LearningPathChapter
  index: number
  isActive: boolean
  onSelect: (chapterId: string, index: number) => void
  buttonRef: (element: HTMLButtonElement | null) => void
}

function InvataMobilePathNavChapterButton({
  chapter,
  index,
  isActive,
  onSelect,
  buttonRef,
}: InvataMobilePathNavChapterButtonProps) {
  const imagesEnabled = useInvataChapterImagesEnabled(index)

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => onSelect(chapter.id, index)}
      className="relative flex w-[104px] shrink-0 flex-col items-center gap-1.5"
      aria-current={isActive ? "true" : undefined}
    >
      <div
        className={cn(
          "relative h-[52px] w-full overflow-hidden rounded-xl border-2 border-[#e6e6e6] bg-white transition-colors",
          isActive && "shadow-sm"
        )}
      >
        {chapter.icon_url ? (
          <InvataDeferredImage
            src={chapter.icon_url}
            enabled={imagesEnabled}
            alt=""
            className="absolute inset-0 h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white">
            <BookOpen className="h-7 w-7 text-[#5f5f5f]" aria-hidden="true" />
          </div>
        )}
      </div>
      <span
        className={cn(
          "line-clamp-2 w-full text-center text-[11px] font-medium leading-tight",
          isActive ? "text-violet-700" : "text-[#4f4f4f]"
        )}
      >
        {getLearningPathChapterNavTitle(chapter)}
      </span>
    </button>
  )
}

interface InvataMobilePathNavProps {
  chapters: LearningPathChapter[]
  /** When true, renders inside the fixed site navbar (always visible). */
  embeddedInNavbar?: boolean
}

type ActiveIndicator = {
  left: number
  width: number
}

export function InvataMobilePathNav({
  chapters,
  embeddedInNavbar = false,
}: InvataMobilePathNavProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeIndicator, setActiveIndicator] = useState<ActiveIndicator>({ left: 0, width: 0 })
  const navRef = useRef<HTMLElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])

  const chapterIdsKey = chapters.map((c) => c.id).join("|")

  const updateActiveIndicator = useCallback(() => {
    const activeButton = cardRefs.current[activeIndex]
    const nav = navRef.current
    if (!activeButton || !nav) return

    const navRect = nav.getBoundingClientRect()
    const buttonRect = activeButton.getBoundingClientRect()

    setActiveIndicator({
      left: buttonRect.left - navRect.left,
      width: buttonRect.width,
    })
  }, [activeIndex])

  useEffect(() => {
    if (chapters.length === 0) return

    const sectionIds = chapters.map((c) => invataChapterSectionDomId(c.id))
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const sectionIndex = sectionIds.indexOf(entry.target.id)
          if (sectionIndex !== -1) setActiveIndex(sectionIndex)
        }
      },
      { rootMargin: "-24% 0px -52% 0px", threshold: 0 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [chapterIdsKey, chapters.length])

  useEffect(() => {
    const activeCard = cardRefs.current[activeIndex]
    const container = scrollContainerRef.current
    if (!activeCard || !container) return

    const cardLeft = activeCard.offsetLeft
    const cardWidth = activeCard.offsetWidth
    const containerWidth = container.clientWidth
    const targetScroll = cardLeft - containerWidth / 2 + cardWidth / 2
    container.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" })
  }, [activeIndex])

  useEffect(() => {
    updateActiveIndicator()
  }, [updateActiveIndicator, chapterIdsKey])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const onScroll = () => updateActiveIndicator()
    scrollContainer.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    const rafId = requestAnimationFrame(onScroll)
    return () => {
      cancelAnimationFrame(rafId)
      scrollContainer.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [updateActiveIndicator])

  const scrollToChapter = useCallback((chapterId: string, index: number) => {
    setActiveIndex(index)
    const el = document.getElementById(invataChapterSectionDomId(chapterId))
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  if (chapters.length === 0) return null

  return (
    <nav
      ref={navRef}
      aria-label="Learning paths"
      className={cn(
        embeddedInNavbar
          ? "relative flex h-full min-h-0 w-full flex-col"
          : "sticky top-16 z-40 -mx-5 mb-6 border-b border-[#ececec] bg-white/95 px-5 py-3 backdrop-blur-sm burger:top-28"
      )}
    >
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex min-h-0 flex-1 gap-3 overflow-x-auto scrollbar-hide",
          embeddedInNavbar ? "items-start pt-1.5" : "relative pb-1"
        )}
      >
        {chapters.map((chapter, index) => (
          <InvataMobilePathNavChapterButton
            key={chapter.id}
            chapter={chapter}
            index={index}
            isActive={index === activeIndex}
            onSelect={scrollToChapter}
            buttonRef={(el) => {
              cardRefs.current[index] = el
            }}
          />
        ))}
      </div>

      {activeIndicator.width > 0 ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 z-10 h-[3px] bg-violet-500 transition-[transform,width] duration-200 ease-out"
          style={{
            width: activeIndicator.width,
            transform: `translateX(${activeIndicator.left}px)`,
          }}
        />
      ) : null}
    </nav>
  )
}
