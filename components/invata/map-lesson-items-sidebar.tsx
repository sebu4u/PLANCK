"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState, type TransitionEvent } from "react"
import { createPortal } from "react-dom"
import { Check, Loader2, X } from "lucide-react"
import {
  ITEM_TYPE_LABEL,
  getLessonItemDisplayIcon,
} from "@/components/invata/learning-path-item-body"
import type { MapLessonItemEntry, MapLessonItemsSubject } from "@/lib/map-lesson-items"
import { cn } from "@/lib/utils"

const HOVER_PREVIEW_DELAY_MS = 1000
const PREVIEW_CARD_MAX_HEIGHT_PX = 320
const PREVIEW_CLEAR_DELAY_MS = 120
const DEFAULT_PANEL_SLIDE_TRANSITION =
  "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"

interface MapLessonItemsSidebarProps {
  isOpen: boolean
  onClose: () => void
  onExitAnimationComplete?: () => void
  embedOnDesktop?: boolean
  panelSlideTransitionClass?: string
  subject: MapLessonItemsSubject
  mapLessonId: string | null
  lessonTitle: string
  routeSlug: string | null
  chapterSlug: string | null
}

function getEmbeddedSidebarWidthPx(): number {
  return window.innerWidth * 0.25
}

function ItemPreviewCard({
  item,
  className,
}: {
  item: MapLessonItemEntry
  className?: string
}) {
  const ItemIcon = getLessonItemDisplayIcon({ item_type: item.itemType, content_json: null })

  return (
    <div
      className={cn(
        "pointer-events-none overflow-hidden rounded-2xl border border-[#0b0d10]/10 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      {item.preview.imageUrl ? (
        <div className="aspect-video w-full overflow-hidden bg-[#f5f4f2]">
          <img
            src={item.preview.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#374151]">
            <ItemIcon className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
              {ITEM_TYPE_LABEL[item.itemType]}
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-[#0b0d10]">{item.title}</p>
          </div>
        </div>

        {item.preview.summary ? (
          <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-[#6b7280]">
            {item.preview.summary}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
            Apasă pentru a deschide acest pas din lecție.
          </p>
        )}
      </div>
    </div>
  )
}

export function MapLessonItemsSidebar({
  isOpen,
  onClose,
  onExitAnimationComplete,
  embedOnDesktop = false,
  panelSlideTransitionClass = DEFAULT_PANEL_SLIDE_TRANSITION,
  subject,
  mapLessonId,
  lessonTitle,
  routeSlug,
  chapterSlug,
}: MapLessonItemsSidebarProps) {
  const [items, setItems] = useState<MapLessonItemEntry[]>([])
  const [resolvedLessonTitle, setResolvedLessonTitle] = useState(lessonTitle)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<MapLessonItemEntry | null>(null)
  const [previewStyle, setPreviewStyle] = useState<{ top: number; right: number; width: number } | null>(
    null,
  )
  const hoverTimeoutRef = useRef<number | null>(null)
  const clearPreviewTimeoutRef = useRef<number | null>(null)
  const hoveredItemElementRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const requestIdRef = useRef(0)

  const updatePreviewPosition = useCallback((element: HTMLElement) => {
    const itemRect = element.getBoundingClientRect()
    const sidebarWidth =
      window.innerWidth >= 1024 && embedOnDesktop
        ? getEmbeddedSidebarWidthPx()
        : Math.min(window.innerWidth * 0.9, window.innerWidth)
    const top = Math.max(
      72,
      Math.min(itemRect.top, window.innerHeight - PREVIEW_CARD_MAX_HEIGHT_PX - 16),
    )
    const width = Math.min(288, window.innerWidth - sidebarWidth - 32)
    setPreviewStyle({
      top,
      right: sidebarWidth + 12,
      width: Math.max(200, width),
    })
  }, [embedOnDesktop])

  const hidePreview = useCallback(() => {
    if (clearPreviewTimeoutRef.current !== null) {
      window.clearTimeout(clearPreviewTimeoutRef.current)
      clearPreviewTimeoutRef.current = null
    }
    hoveredItemElementRef.current = null
    setPreviewItem(null)
    setPreviewStyle(null)
  }, [])

  const clearHoverPreview = useCallback(() => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    hidePreview()
  }, [hidePreview])

  const showPreview = useCallback(
    (item: MapLessonItemEntry, element: HTMLElement) => {
      hoveredItemElementRef.current = element
      updatePreviewPosition(element)
      setPreviewItem(item)
    },
    [updatePreviewPosition],
  )

  const scheduleHidePreview = useCallback(() => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (clearPreviewTimeoutRef.current !== null) {
      window.clearTimeout(clearPreviewTimeoutRef.current)
    }
    clearPreviewTimeoutRef.current = window.setTimeout(() => {
      hidePreview()
    }, PREVIEW_CLEAR_DELAY_MS)
  }, [hidePreview])

  const cancelScheduledHidePreview = useCallback(() => {
    if (clearPreviewTimeoutRef.current !== null) {
      window.clearTimeout(clearPreviewTimeoutRef.current)
      clearPreviewTimeoutRef.current = null
    }
  }, [])

  const handleItemMouseEnter = useCallback(
    (item: MapLessonItemEntry, element: HTMLElement) => {
      cancelScheduledHidePreview()
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
      hidePreview()
      hoverTimeoutRef.current = window.setTimeout(() => {
        showPreview(item, element)
      }, HOVER_PREVIEW_DELAY_MS)
    },
    [cancelScheduledHidePreview, hidePreview, showPreview],
  )

  const handlePanelTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) return
      if (event.propertyName !== "transform") return
      if (!isOpen && onExitAnimationComplete) {
        onExitAnimationComplete()
      }
    },
    [isOpen, onExitAnimationComplete],
  )

  useEffect(() => {
    if (!isOpen) {
      clearHoverPreview()
      return
    }

    if (!mapLessonId || !routeSlug || !chapterSlug) {
      setItems([])
      setLoadError("Lipsesc datele lecției.")
      return
    }

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setLoadError(null)
    setItems([])
    setResolvedLessonTitle(lessonTitle)

    const params = new URLSearchParams({
      subject,
      mapLessonId,
      traseu: routeSlug,
      capitol: chapterSlug,
    })

    fetch(`/api/invata/map-lesson-items?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("fetch_failed")
        }
        return response.json() as Promise<{ lessonTitle: string; items: MapLessonItemEntry[] }>
      })
      .then((data) => {
        if (requestId !== requestIdRef.current) return
        setResolvedLessonTitle(data.lessonTitle || lessonTitle)
        setItems(data.items)
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return
        setLoadError("Nu am putut încărca itemii lecției.")
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return
        setIsLoading(false)
      })
  }, [chapterSlug, clearHoverPreview, isOpen, lessonTitle, mapLessonId, routeSlug, subject])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!previewItem || !hoveredItemElementRef.current) return

    const syncPreviewPosition = () => {
      const element = hoveredItemElementRef.current
      if (element) updatePreviewPosition(element)
    }

    const listElement = listRef.current
    listElement?.addEventListener("scroll", syncPreviewPosition, { passive: true })
    window.addEventListener("resize", syncPreviewPosition)

    return () => {
      listElement?.removeEventListener("scroll", syncPreviewPosition)
      window.removeEventListener("resize", syncPreviewPosition)
    }
  }, [previewItem, updatePreviewPosition])

  const previewPortal =
    isOpen && previewItem && previewStyle && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[495] hidden animate-in fade-in duration-200 lg:block"
            style={{
              top: previewStyle.top,
              right: previewStyle.right,
              width: previewStyle.width,
            }}
          >
            <ItemPreviewCard item={previewItem} />
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[499] touch-none bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      ) : null}

      <aside
        ref={sidebarRef}
        aria-hidden={!isOpen}
        aria-label="Itemi lecție"
        onTransitionEnd={handlePanelTransitionEnd}
        className={cn(
          "fixed right-0 z-[500] flex flex-col overscroll-contain bg-white",
          embedOnDesktop
            ? cn(
                "bottom-0 top-16 h-[calc(100dvh-4rem)] w-[25vw] overflow-hidden rounded-bl-xl rounded-tl-xl",
                panelSlideTransitionClass,
                isOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
              )
            : cn(
                "top-0 h-dvh w-[90vw] max-w-[90vw] lg:h-dvh lg:w-[25vw]",
                panelSlideTransitionClass,
                isOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
              ),
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[#0b0d10]/10 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[#0b0d10]">Itemi lecție</h2>
            <p className="mt-1 line-clamp-2 text-sm text-[#6b7280]">
              {resolvedLessonTitle || lessonTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="group shrink-0 rounded p-2 transition-colors max-lg:active:bg-transparent lg:hover:bg-[#e5e7eb]"
            aria-label="Închide lista de itemi"
          >
            <X className="h-5 w-5 text-[#6b7280] transition-colors duration-150 max-lg:group-active:text-[#d1d5db]" />
          </button>
        </header>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-[#6b7280]" aria-hidden />
            </div>
          ) : loadError ? (
            <p className="px-2 py-6 text-center text-sm text-[#6b7280]">{loadError}</p>
          ) : items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-[#6b7280]">
              Această lecție nu are itemi asignați încă.
            </p>
          ) : (
            <ol className="space-y-2">
              {items.map((item) => {
                const ItemIcon = getLessonItemDisplayIcon({
                  item_type: item.itemType,
                  content_json: null,
                })

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      onMouseEnter={(event) => handleItemMouseEnter(item, event.currentTarget)}
                      onMouseLeave={scheduleHidePreview}
                      onFocus={() => hidePreview()}
                      className={cn(
                        "group flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors",
                        item.isCompleted
                          ? "border-[#bbf7d0] bg-[#f0fdf4] hover:bg-[#ecfdf5]"
                          : "border-[#0b0d10]/10 bg-white hover:bg-[#f9fafb]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
                          item.isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-[#f3f4f6] text-[#374151]",
                        )}
                      >
                        {item.isCompleted ? (
                          <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                        ) : (
                          item.index
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <ItemIcon className="h-3.5 w-3.5 shrink-0 text-[#6b7280]" aria-hidden />
                          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                            {ITEM_TYPE_LABEL[item.itemType]}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm font-semibold leading-snug text-[#0b0d10]">
                          {item.title}
                        </span>
                        {item.preview.summary ? (
                          <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-[#6b7280]">
                            {item.preview.summary}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </aside>

      {previewPortal}
    </>
  )
}
