"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { cn } from "@/lib/utils"
import { PLANCKPASS_EXPANDED_BODY_CLASS, PLANCKPASS_EXPANDED_HEIGHT } from "./planckpass-layout"
import { PlanckPassSection } from "./planckpass-section"

const STORAGE_KEY = "planckpass-collapsed"
const COLLAPSED_HEIGHT = 0
const SNAP_THRESHOLD = 56
/** Ghost-click window after handle gesture (layout shifts under the finger). */
const CLICK_SUPPRESS_MS = 500

interface PlanckPassMobileShellProps {
  children: ReactNode
  className?: string
}

export function PlanckPassMobileShell({ children, className }: PlanckPassMobileShellProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      return false
    }
  })
  const [ready, setReady] = useState(false)
  const [contentInteractive, setContentInteractive] = useState(true)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(PLANCKPASS_EXPANDED_HEIGHT)
  const dragging = useRef(false)
  const suppressClicksUntil = useRef(0)
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const passHeight = useMotionValue(
    collapsed ? COLLAPSED_HEIGHT : PLANCKPASS_EXPANDED_HEIGHT,
  )
  const passOpacity = useTransform(
    passHeight,
    [0, PLANCKPASS_EXPANDED_HEIGHT * 0.35, PLANCKPASS_EXPANDED_HEIGHT],
    [0, 0.4, 1],
  )

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    return () => {
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const sync = () => {
      if (mq.matches) {
        document.body.classList.toggle(PLANCKPASS_EXPANDED_BODY_CLASS, !collapsed)
      }
    }
    sync()
    mq.addEventListener("change", sync)
    return () => {
      mq.removeEventListener("change", sync)
      if (mq.matches) {
        document.body.classList.remove(PLANCKPASS_EXPANDED_BODY_CLASS)
      }
    }
  }, [collapsed])

  const armClickSuppress = useCallback(() => {
    suppressClicksUntil.current = Date.now() + CLICK_SUPPRESS_MS
    setContentInteractive(false)
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
    suppressTimerRef.current = setTimeout(() => {
      setContentInteractive(true)
      suppressTimerRef.current = null
    }, CLICK_SUPPRESS_MS)
  }, [])

  const persist = useCallback((nextCollapsed: boolean) => {
    setCollapsed(nextCollapsed)
    try {
      sessionStorage.setItem(STORAGE_KEY, nextCollapsed ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [])

  const snapTo = useCallback(
    (nextCollapsed: boolean) => {
      const target = nextCollapsed ? COLLAPSED_HEIGHT : PLANCKPASS_EXPANDED_HEIGHT
      animate(passHeight, target, {
        type: "spring",
        stiffness: 380,
        damping: 36,
        mass: 0.85,
      })
      persist(nextCollapsed)
    },
    [passHeight, persist],
  )

  const onHandlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      // Prevent synthetic mouse click that would hit dashboard content after layout shift
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      dragging.current = true
      dragStartY.current = e.clientY
      dragStartHeight.current = passHeight.get()
    },
    [passHeight],
  )

  const onHandlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return
      // Drag sheet down → expand pass; drag up → collapse pass
      const delta = e.clientY - dragStartY.current
      const next = Math.min(
        PLANCKPASS_EXPANDED_HEIGHT,
        Math.max(COLLAPSED_HEIGHT, dragStartHeight.current + delta),
      )
      passHeight.set(next)
    },
    [passHeight],
  )

  const onHandlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return
      dragging.current = false
      e.preventDefault()
      e.stopPropagation()
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }

      armClickSuppress()

      const current = passHeight.get()
      const delta = current - dragStartHeight.current

      if (Math.abs(delta) < 8) {
        // Tap handle toggles
        snapTo(!collapsed)
        return
      }

      if (collapsed) {
        snapTo(current > SNAP_THRESHOLD)
      } else {
        snapTo(current < PLANCKPASS_EXPANDED_HEIGHT - SNAP_THRESHOLD)
      }
    },
    [armClickSuppress, collapsed, passHeight, snapTo],
  )

  const onContentClickCapture = useCallback((e: ReactMouseEvent) => {
    if (Date.now() < suppressClicksUntil.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden",
        collapsed ? "bg-white" : "bg-[#5020F0]",
        className,
      )}
    >
      <motion.div
        className="relative shrink-0 overflow-hidden"
        style={{ height: ready ? passHeight : PLANCKPASS_EXPANDED_HEIGHT, opacity: passOpacity }}
      >
        <div
          className={cn(
            "absolute inset-0",
            (collapsed || !contentInteractive) && "pointer-events-none",
          )}
          style={{ height: PLANCKPASS_EXPANDED_HEIGHT }}
          onClickCapture={onContentClickCapture}
        >
          <PlanckPassSection expanded={!collapsed} />
        </div>
      </motion.div>

      {/* White dashboard sheet — rounded only while pass is open */}
      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-white",
          !collapsed && "rounded-t-[2.25rem] shadow-[0_-8px_24px_rgba(26,10,74,0.22)]",
        )}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={collapsed ? "Extinde PlanckPass" : "Restrânge PlanckPass"}
          aria-expanded={!collapsed}
          className="flex shrink-0 cursor-grab touch-none flex-col items-center pb-1 pt-2.5 active:cursor-grabbing"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              armClickSuppress()
              snapTo(!collapsed)
            }
          }}
        >
          <div className="h-1.5 w-12 rounded-full bg-[#d4d4d8]" />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#a1a1aa]">
            {collapsed ? "PlanckPass" : "Trage pentru a închide"}
          </span>
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            !contentInteractive && "pointer-events-none",
          )}
          onClickCapture={onContentClickCapture}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
