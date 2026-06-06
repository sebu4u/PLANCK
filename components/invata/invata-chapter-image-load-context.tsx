"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

export const INVATA_EAGER_CHAPTER_IMAGE_COUNT = 2

const CHAPTER_IMAGE_PREFETCH_ROOT_MARGIN = "300px 0px"

type InvataChapterImageLoadContextValue = {
  registerSection: (index: number, element: HTMLElement | null) => () => void
  isChapterImagesEnabled: (index: number) => boolean
}

const InvataChapterImageLoadContext =
  createContext<InvataChapterImageLoadContextValue | null>(null)

function buildInitialEnabledChapterIndices(chapterCount: number): Set<number> {
  const enabled = new Set<number>()
  for (let index = 0; index < Math.min(INVATA_EAGER_CHAPTER_IMAGE_COUNT, chapterCount); index++) {
    enabled.add(index)
  }
  return enabled
}

export function InvataChapterImageLoadProvider({
  chapterCount,
  children,
}: {
  chapterCount: number
  children: ReactNode
}) {
  const [enabledIndices, setEnabledIndices] = useState(() =>
    buildInitialEnabledChapterIndices(chapterCount)
  )

  useEffect(() => {
    setEnabledIndices(buildInitialEnabledChapterIndices(chapterCount))
  }, [chapterCount])

  const enableChapter = useCallback((index: number) => {
    setEnabledIndices((current) => {
      if (current.has(index)) return current
      const next = new Set(current)
      next.add(index)
      return next
    })
  }, [])

  const registerSection = useCallback(
    (index: number, element: HTMLElement | null) => {
      if (!element || index < INVATA_EAGER_CHAPTER_IMAGE_COUNT) {
        return () => {}
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            enableChapter(index)
            observer.disconnect()
          }
        },
        { rootMargin: CHAPTER_IMAGE_PREFETCH_ROOT_MARGIN, threshold: 0 }
      )

      observer.observe(element)
      return () => observer.disconnect()
    },
    [enableChapter]
  )

  const isChapterImagesEnabled = useCallback(
    (index: number) => enabledIndices.has(index),
    [enabledIndices]
  )

  const value = useMemo(
    () => ({
      registerSection,
      isChapterImagesEnabled,
    }),
    [registerSection, isChapterImagesEnabled]
  )

  return (
    <InvataChapterImageLoadContext.Provider value={value}>
      {children}
    </InvataChapterImageLoadContext.Provider>
  )
}

function useInvataChapterImageLoadContext() {
  const context = useContext(InvataChapterImageLoadContext)
  if (!context) {
    throw new Error(
      "useInvataChapterImageLoad must be used within InvataChapterImageLoadProvider"
    )
  }
  return context
}

export function useInvataChapterImagesEnabled(index: number): boolean {
  const { isChapterImagesEnabled } = useInvataChapterImageLoadContext()
  return isChapterImagesEnabled(index)
}

export function useRegisterInvataChapterSection(index: number) {
  const { registerSection } = useInvataChapterImageLoadContext()
  const cleanupRef = useRef<(() => void) | null>(null)

  const sectionRef = useCallback(
    (element: HTMLElement | null) => {
      cleanupRef.current?.()
      cleanupRef.current = registerSection(index, element)
    },
    [index, registerSection]
  )

  useEffect(() => {
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [])

  return sectionRef
}

type InvataDeferredImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined
  enabled: boolean
  placeholderClassName?: string
}

export function InvataDeferredImage({
  src,
  enabled,
  alt = "",
  className,
  placeholderClassName,
  draggable,
  onDragStart,
  ...imgProps
}: InvataDeferredImageProps) {
  if (!enabled || !src) {
    return (
      <div
        aria-hidden={alt ? undefined : true}
        className={cn("bg-[#f3f3f3]", placeholderClassName ?? className)}
      />
    )
  }

  return (
    <img
      {...imgProps}
      src={src}
      alt={alt}
      className={className}
      draggable={draggable}
      onDragStart={onDragStart}
    />
  )
}
