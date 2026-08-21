"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PLANCKPASS_DESKTOP_STORAGE_KEY,
  PLANCKPASS_DESKTOP_WIDTH_PCT,
  PLANCKPASS_EXPANDED_BODY_CLASS,
} from "./planckpass-layout"
import { PlanckPassDesktopSection } from "./planckpass-desktop-section"
import { usePlanckPass } from "@/hooks/use-planckpass"

interface PlanckPassDesktopShellProps {
  children: ReactNode
  className?: string
}

export function PlanckPassDesktopShell({ children, className }: PlanckPassDesktopShellProps) {
  const { state } = usePlanckPass()
  const hasClaimableReward = state.tiers.some((tier) => tier.claimable)
  const shellRef = useRef<HTMLDivElement>(null)
  const [panelPx, setPanelPx] = useState(320)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return true
    try {
      const stored = sessionStorage.getItem(PLANCKPASS_DESKTOP_STORAGE_KEY)
      if (stored === null) return true
      return stored === "1"
    } catch {
      return true
    }
  })
  const [ready, setReady] = useState(false)

  const passPct = useMotionValue(collapsed ? 0 : PLANCKPASS_DESKTOP_WIDTH_PCT)
  const cardPct = useTransform(passPct, (v) => 100 - v)
  const passOpacity = useTransform(
    passPct,
    [0, PLANCKPASS_DESKTOP_WIDTH_PCT * 0.35, PLANCKPASS_DESKTOP_WIDTH_PCT],
    [0, 0.4, 1],
  )
  const passWidth = useTransform(passPct, (v) => `${v}%`)
  const cardWidth = useTransform(cardPct, (v) => `${v}%`)

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    const el = shellRef.current
    if (!el) return
    const update = () => {
      setPanelPx(Math.max(220, el.clientWidth * (PLANCKPASS_DESKTOP_WIDTH_PCT / 100)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
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

  const persist = useCallback((nextCollapsed: boolean) => {
    setCollapsed(nextCollapsed)
    try {
      sessionStorage.setItem(PLANCKPASS_DESKTOP_STORAGE_KEY, nextCollapsed ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [])

  const snapTo = useCallback(
    (nextCollapsed: boolean) => {
      const target = nextCollapsed ? 0 : PLANCKPASS_DESKTOP_WIDTH_PCT
      animate(passPct, target, {
        type: "spring",
        stiffness: 380,
        damping: 36,
        mass: 0.85,
      })
      persist(nextCollapsed)
    },
    [passPct, persist],
  )

  const toggle = useCallback(() => {
    snapTo(!collapsed)
  }, [collapsed, snapTo])

  const onHandleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        toggle()
      }
    },
    [toggle],
  )

  return (
    <div
      ref={shellRef}
      className={cn(
        "flex h-full min-h-0 flex-row overflow-hidden",
        collapsed ? "bg-white" : "bg-[#5020F0]",
        className,
      )}
    >
      {/* Dashboard card */}
      <motion.div
        className={cn(
          "relative z-10 flex min-h-0 min-w-0 flex-col",
          collapsed
            ? "m-[3px] mt-0 lg:rounded-xl"
            : "m-0 rounded-r-[2.25rem] shadow-[8px_0_24px_rgba(26,10,74,0.22)]",
        )}
        style={{ width: ready ? cardWidth : "100%" }}
      >
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white",
            collapsed ? "lg:rounded-xl" : "rounded-r-[2.25rem]",
          )}
        >
          {children}
        </div>

        <button
          type="button"
          aria-label={collapsed ? "Extinde PlanckPass" : "Restrânge PlanckPass"}
          aria-expanded={!collapsed}
          onClick={toggle}
          onKeyDown={onHandleKeyDown}
          className={cn(
            "absolute top-1/2 z-20 flex h-28 w-7 -translate-y-1/2 flex-col items-center justify-center gap-1 border-y-2 border-l-2 border-[#1a0a4a] shadow-md transition-colors",
            // Collapsed: sit on top of the 3px white right outline (m-[3px] on the card)
            collapsed
              ? "-right-[3px] rounded-l-lg border-r-0"
              : "right-0 rounded-l-lg border-r-0",
            collapsed && hasClaimableReward
              ? "planckpass-desktop-handle-claimable hover:bg-[#ffe566]"
              : "bg-[#5020F0] text-white hover:bg-[#5c2ef5]",
          )}
        >
          {collapsed ? (
            <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          )}
          <span
            className="text-[9px] font-black uppercase tracking-wider"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            PlanckPass
          </span>
        </button>
      </motion.div>

      {/* Pass panel */}
      <motion.div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: ready ? passWidth : "0%",
          opacity: ready ? passOpacity : 0,
        }}
        aria-hidden={collapsed}
      >
        <div className="absolute inset-y-0 right-0 h-full" style={{ width: panelPx }}>
          <PlanckPassDesktopSection />
        </div>
      </motion.div>
    </div>
  )
}
