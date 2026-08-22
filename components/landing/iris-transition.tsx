"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"

type IrisOrigin = { x: number; y: number }

type IrisContextValue = {
  navigateWithIris: (href: string, origin: IrisOrigin) => void
}

const IrisContext = createContext<IrisContextValue | null>(null)

type Phase = "idle" | "cover" | "covered" | "reveal"

const COVER_MS = 520
const REVEAL_MS = 560

function maxIrisRadius(origin: IrisOrigin) {
  if (typeof window === "undefined") return 2000
  const { innerWidth: w, innerHeight: h } = window
  const corners = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
  ] as const
  return Math.ceil(
    Math.max(...corners.map(([cx, cy]) => Math.hypot(origin.x - cx, origin.y - cy))) + 24,
  )
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function isInternalHref(anchor: HTMLAnchorElement, href: string) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false
  }
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false
  try {
    const url = new URL(href, window.location.href)
    return url.origin === window.location.origin
  } catch {
    return false
  }
}

export function IrisTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState<Phase>("idle")
  const [radius, setRadius] = useState(0)
  const originRef = useRef<IrisOrigin>({ x: 0, y: 0 })
  const targetRef = useRef<string | null>(null)
  const startPathRef = useRef<string | null>(null)
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
  }

  const beginReveal = useCallback(() => {
    clearTimers()
    setPhase("reveal")
    setRadius(0)
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase("idle")
        targetRef.current = null
        startPathRef.current = null
      }, REVEAL_MS),
    )
  }, [])

  const navigateWithIris = useCallback(
    (href: string, origin: IrisOrigin) => {
      if (prefersReducedMotion()) {
        router.push(href)
        return
      }
      clearTimers()
      originRef.current = origin
      targetRef.current = href
      startPathRef.current = `${window.location.pathname}${window.location.search}`
      setRadius(0)
      setPhase("cover")
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setRadius(maxIrisRadius(origin))
        })
      })
      timersRef.current.push(
        window.setTimeout(() => {
          router.push(href)
          setPhase("covered")
        }, COVER_MS),
      )
      timersRef.current.push(
        window.setTimeout(() => {
          beginReveal()
        }, COVER_MS + 2200),
      )
    },
    [beginReveal, router],
  )

  useEffect(() => {
    if (phase !== "covered") return
    const current = `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`
    const leftStart = startPathRef.current != null && current !== startPathRef.current
    const reachedTarget =
      targetRef.current != null && (current === targetRef.current || pathname !== "/landing")
    if (!leftStart && !reachedTarget) return
    beginReveal()
  }, [beginReveal, pathname, phase])

  useEffect(() => () => clearTimers(), [])

  const visible = phase !== "idle"
  const origin = originRef.current

  return (
    <IrisContext.Provider value={{ navigateWithIris }}>
      {children}
      <div
        aria-hidden
        className="fixed inset-0 z-[400] bg-gradient-to-br from-[#9a7bff] via-[#c77bff] to-[#ffb56b]"
        style={{
          pointerEvents: visible ? "auto" : "none",
          clipPath: `circle(${visible ? radius : 0}px at ${origin.x}px ${origin.y}px)`,
          transition:
            phase === "cover" || phase === "reveal"
              ? `clip-path ${phase === "cover" ? COVER_MS : REVEAL_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`
              : "none",
          opacity: visible ? 1 : 0,
        }}
      />
    </IrisContext.Provider>
  )
}

export function LandingCtaIrisScope({ children }: { children: ReactNode }) {
  const iris = useContext(IrisContext)

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!iris) return
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const anchor = (event.target as HTMLElement | null)?.closest("a[href]") as HTMLAnchorElement | null
    if (!anchor) return

    const hrefAttr = anchor.getAttribute("href")
    if (!hrefAttr || !isInternalHref(anchor, hrefAttr)) return

    const url = new URL(anchor.href, window.location.href)
    const next = `${url.pathname}${url.search}${url.hash}`
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (next === current) return

    event.preventDefault()
    iris.navigateWithIris(`${url.pathname}${url.search}`, {
      x: event.clientX,
      y: event.clientY,
    })
  }

  return <div onClickCapture={onClickCapture}>{children}</div>
}
