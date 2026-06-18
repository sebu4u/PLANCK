"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { TestBatteryIcon } from "@/components/invata/test-battery-icon"
import { playButtonClickSound } from "@/lib/platform-sounds"
import { cn } from "@/lib/utils"

type BatteryPhase = "icon-pop" | "icon-slide" | "text-visible" | "ready"

interface FizicaLessonBatteryPhaseProps {
  onClose: () => void | Promise<void>
}

const DESKTOP_TEXT_WIDTH = 280
const DESKTOP_ICON_X_OFFSET = DESKTOP_TEXT_WIDTH / 2 + 12
const MOBILE_TEXT_MIN_HEIGHT = 132
const MOBILE_ICON_Y_OFFSET = MOBILE_TEXT_MIN_HEIGHT / 2 + 20

const motionEase = [0.22, 1, 0.36, 1] as const

function useBatteryPhaseTimers() {
  const [phase, setPhase] = useState<BatteryPhase>("icon-pop")

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase("icon-slide"), 750),
      window.setTimeout(() => setPhase("text-visible"), 1350),
      window.setTimeout(() => setPhase("ready"), 1750),
    ]

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const showText = phase === "text-visible" || phase === "ready"
  const iconPop = phase === "icon-pop"

  return { phase, showText, iconPop }
}

function BatteryCopy({
  phase,
  showText,
  centered = false,
}: {
  phase: BatteryPhase
  showText: boolean
  centered?: boolean
}) {
  return (
    <motion.div
      className={cn("shrink-0 pt-1", centered && "text-center")}
      style={centered ? undefined : { width: DESKTOP_TEXT_WIDTH }}
      initial={false}
      animate={{
        opacity: showText ? 1 : 0,
        y: showText ? 0 : centered ? 12 : 16,
        x: centered ? 0 : showText ? 0 : 16,
      }}
      transition={{ duration: 0.5, ease: motionEase }}
      aria-hidden={!showText}
    >
      <h2 className="text-4xl font-black tracking-tight text-[#111111] sm:text-5xl">
        +1 baterie
      </h2>
      <motion.p
        initial={false}
        animate={{ opacity: phase === "ready" ? 1 : showText ? 0.72 : 0 }}
        transition={{ duration: 0.45, ease: motionEase }}
        className="mt-3 text-sm leading-relaxed text-[#5f657b] sm:text-base"
      >
        Folosește bateriile ca să exersezi mai mult ce ai învățat în această lecție.
      </motion.p>
    </motion.div>
  )
}

function MobileBatteryAnimation({ phase, showText, iconPop }: {
  phase: BatteryPhase
  showText: boolean
  iconPop: boolean
}) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center sm:hidden">
      <motion.div
        className="shrink-0"
        initial={{ scale: 0.55, opacity: 0, y: MOBILE_ICON_Y_OFFSET }}
        animate={{
          scale: 1,
          opacity: 1,
          y: iconPop ? MOBILE_ICON_Y_OFFSET : 0,
        }}
        transition={{
          scale: { type: "spring", stiffness: 420, damping: 20, delay: 0.05 },
          opacity: { duration: 0.35 },
          y: { duration: 0.55, ease: motionEase },
        }}
      >
        <TestBatteryIcon filled className="h-28 w-28 text-emerald-600" />
      </motion.div>

      <div
        className="mt-5 flex w-full flex-col items-center"
        style={{ minHeight: MOBILE_TEXT_MIN_HEIGHT }}
      >
        <BatteryCopy phase={phase} showText={showText} centered />
      </div>
    </div>
  )
}

function DesktopBatteryAnimation({ phase, showText, iconPop }: {
  phase: BatteryPhase
  showText: boolean
  iconPop: boolean
}) {
  return (
    <div className="hidden w-full max-w-lg items-start justify-center sm:flex">
      <div className="flex items-start gap-5">
        <motion.div
          className="shrink-0"
          initial={{ scale: 0.55, opacity: 0, x: DESKTOP_ICON_X_OFFSET }}
          animate={{
            scale: 1,
            opacity: 1,
            x: iconPop ? DESKTOP_ICON_X_OFFSET : 0,
          }}
          transition={{
            scale: { type: "spring", stiffness: 420, damping: 20, delay: 0.05 },
            opacity: { duration: 0.35 },
            x: { duration: 0.55, ease: motionEase },
          }}
        >
          <TestBatteryIcon filled className="h-32 w-32 text-emerald-600" />
        </motion.div>

        <BatteryCopy phase={phase} showText={showText} />
      </div>
    </div>
  )
}

export function FizicaLessonBatteryPhase({ onClose }: FizicaLessonBatteryPhaseProps) {
  const { phase, showText, iconPop } = useBatteryPhaseTimers()
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = useCallback(async () => {
    if (isClosing) return

    playButtonClickSound()
    setIsClosing(true)

    await new Promise((resolve) => window.setTimeout(resolve, 650))
    await onClose()
  }, [isClosing, onClose])

  return (
    <div className="fixed inset-0 z-[502] flex flex-col bg-[linear-gradient(180deg,#fff9e8_0%,#ffffff_28%,#ffffff_100%)]">
      <div className="flex flex-1 items-center justify-center px-6">
        <MobileBatteryAnimation phase={phase} showText={showText} iconPop={iconPop} />
        <DesktopBatteryAnimation phase={phase} showText={showText} iconPop={iconPop} />
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[503] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={() => void handleClose()}
          disabled={isClosing}
          className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-[0_4px_0_#047857] transition-[transform,box-shadow,opacity] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_2px_0_#047857] disabled:cursor-not-allowed disabled:opacity-80"
        >
          {isClosing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Se închide...
            </>
          ) : (
            "Închide lecția"
          )}
        </button>
      </div>
    </div>
  )
}
