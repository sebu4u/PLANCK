"use client"

import { useCallback, useEffect, useState } from "react"
import { Lilita_One } from "next/font/google"
import { motion, useReducedMotion } from "framer-motion"
import { Coins, Snowflake, Sparkles, Zap } from "lucide-react"
import {
  playPlanckPassClaimCollectSound,
  playPlanckPassClaimOpenSound,
} from "@/lib/planckpass/claim-sounds"
import { borderPresetIdFromCosmetic } from "@/lib/planckpass/border-presets"
import { badgePresetIdFromCosmetic } from "@/lib/planckpass/badge-presets"
import type { PlanckPassClaimResult } from "@/lib/planckpass/types"
import { BadgePresetPreview } from "@/components/planckpass/badges/badge-preset-layer"
import { BorderPresetPreview } from "@/components/planckpass/borders/border-preset-layer"
import { cn } from "@/lib/utils"

const lilita = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
})

interface PlanckPassClaimRevealProps {
  reward: PlanckPassClaimResult
  onClose: () => void
  /** Override shell classes (e.g. higher z-index above Trophy Road). */
  className?: string
}

const SPARKLES = [
  { top: "28%", left: "18%", size: 14, delay: 0 },
  { top: "22%", left: "72%", size: 18, delay: 0.35 },
  { top: "48%", left: "12%", size: 12, delay: 0.7 },
  { top: "52%", left: "82%", size: 16, delay: 0.15 },
  { top: "68%", left: "24%", size: 11, delay: 0.55 },
  { top: "64%", left: "76%", size: 13, delay: 0.9 },
]

function RewardVisual({ reward }: { reward: PlanckPassClaimResult }) {
  const borderPreset = borderPresetIdFromCosmetic(reward.cosmetic)
  if (borderPreset) {
    return <BorderPresetPreview presetId={borderPreset} size={120} />
  }
  const badgePreset = badgePresetIdFromCosmetic(reward.cosmetic)
  if (badgePreset) {
    return <BadgePresetPreview presetId={badgePreset} size={110} />
  }
  if (reward.cosmetic?.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={reward.cosmetic.imageUrl}
        alt=""
        className="h-[70%] w-[70%] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
      />
    )
  }
  if (reward.rewardKind === "coins") {
    return <Coins className="h-[55%] w-[55%] text-amber-300" strokeWidth={2.5} />
  }
  if (reward.rewardKind === "elo" || reward.rewardKind === "elo_2x") {
    return <Zap className="h-[55%] w-[55%] text-yellow-300" strokeWidth={2.5} />
  }
  if (reward.rewardKind === "streak_freeze") {
    return <Snowflake className="h-[55%] w-[55%] text-sky-300" strokeWidth={2.5} />
  }
  return <Sparkles className="h-[55%] w-[55%] text-fuchsia-200" strokeWidth={2.5} />
}

export function PlanckPassClaimReveal({ reward, onClose, className }: PlanckPassClaimRevealProps) {
  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState<"idle" | "collecting">("idle")

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    playPlanckPassClaimOpenSound()
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const title =
    reward.cosmetic?.name ||
    reward.label ||
    (reward.rewardKind === "elo"
      ? `+${reward.eloAmount ?? 0} ELO`
      : reward.rewardKind === "coins"
        ? `${reward.coinsAmount ?? 0} coins`
        : reward.rewardKind === "elo_2x"
          ? `2x ELO · ${reward.eloMultiplierMinutes ?? 15}m`
          : reward.rewardKind === "streak_freeze"
            ? `Streak freeze · ${reward.streakFreezeHours ?? 24}h`
            : "Reward")

  const handleCollect = useCallback(() => {
    if (phase !== "idle") return
    playPlanckPassClaimCollectSound()
    if (reduceMotion) {
      onClose()
      return
    }
    setPhase("collecting")
  }, [phase, reduceMotion, onClose])

  useEffect(() => {
    if (phase !== "collecting") return
    const t = window.setTimeout(() => onClose(), 620)
    return () => window.clearTimeout(t)
  }, [phase, onClose])

  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-[550] flex cursor-pointer flex-col items-center justify-between overflow-hidden px-6 pb-14 pt-[max(3.5rem,env(safe-area-inset-top))] select-none",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`Tier ${reward.tierNumber} revendicat`}
      onClick={handleCollect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleCollect()
        }
      }}
      tabIndex={0}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={
        phase === "collecting"
          ? { opacity: 0, transition: { duration: 0.35, delay: 0.28 } }
          : { opacity: 1 }
      }
    >
      {/* Yellow legendary backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 48%, #fff8c8 0%, #ffe566 28%, #ffc400 58%, #ff9a1a 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Cpath fill='%23ffffff' d='M36 6l6.5 18.5H62l-15 11 5.8 18.5L36 43.5 19.2 54l5.8-18.5-15-11h19.5z'/%3E%3C/svg%3E")`,
          backgroundSize: "72px 72px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[46%] h-[70vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 28%, transparent 68%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[46%] h-[18vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.85) 42%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.85) 58%, transparent 100%)",
          filter: "blur(6px)",
          opacity: 0.7,
        }}
      />

      {SPARKLES.map((s, i) => (
        <span
          key={i}
          aria-hidden
          className="planckpass-claim-sparkle pointer-events-none absolute z-[2]"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      <motion.p
        className={`${lilita.className} planckpass-claim-outline relative z-10 text-center text-[clamp(2rem,8vw,3.25rem)] leading-none tracking-wide`}
        initial={reduceMotion ? false : { opacity: 0, y: -24, scale: 0.85 }}
        animate={
          phase === "collecting"
            ? { opacity: 0, y: -40, scale: 0.9 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
      >
        TIER {reward.tierNumber} CLAIMED!
      </motion.p>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <motion.div
          className="relative flex h-[min(42vw,11.5rem)] w-[min(42vw,11.5rem)] items-center justify-center sm:h-52 sm:w-52"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.35, rotate: -8 }}
          animate={
            phase === "collecting"
              ? {
                  opacity: 0,
                  scale: 0.2,
                  y: -140,
                  rotate: 12,
                  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
                }
              : {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  rotate: 0,
                  transition: { type: "spring", stiffness: 260, damping: 16, delay: 0.05 },
                }
          }
        >
          {phase === "idle" && !reduceMotion ? (
            <motion.div
              className="absolute inset-0"
              animate={{ scale: [1, 1.04, 1], y: [0, -6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="planckpass-claim-reward-card absolute inset-0 flex items-center justify-center">
                <RewardVisual reward={reward} />
              </div>
            </motion.div>
          ) : (
            <div className="planckpass-claim-reward-card absolute inset-0 flex items-center justify-center">
              <RewardVisual reward={reward} />
            </div>
          )}
        </motion.div>

        <motion.p
          className="title-font planckpass-claim-outline relative z-10 mt-6 max-w-[90%] text-center text-[clamp(1.15rem,4.5vw,1.65rem)] font-black italic leading-tight"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={
            phase === "collecting"
              ? { opacity: 0, y: 10 }
              : { opacity: 1, y: 0 }
          }
          transition={{ delay: reduceMotion ? 0 : 0.18, duration: 0.35 }}
        >
          {title}
        </motion.p>
      </div>

      <motion.p
        className={`${lilita.className} planckpass-claim-outline relative z-10 text-center text-[clamp(1.35rem,5.5vw,1.85rem)] leading-none tracking-wide`}
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={
          phase === "collecting"
            ? { opacity: 0 }
            : {
                opacity: 1,
                y: 0,
                scale: reduceMotion ? 1 : [1, 1.06, 1],
              }
        }
        transition={
          phase === "collecting"
            ? { duration: 0.2 }
            : {
                opacity: { delay: 0.25, duration: 0.3 },
                y: { delay: 0.25, duration: 0.3 },
                scale: { delay: 0.5, duration: 1.4, repeat: Infinity, ease: "easeInOut" },
              }
        }
      >
        Tap to open!
      </motion.p>
    </motion.div>
  )
}
