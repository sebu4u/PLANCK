"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Lilita_One } from "next/font/google"
import { motion, useReducedMotion } from "framer-motion"
import { Coins, Lock, Snowflake, Sparkles, Zap, X } from "lucide-react"
import { borderPresetIdFromCosmetic } from "@/lib/planckpass/border-presets"
import { badgePresetIdFromCosmetic } from "@/lib/planckpass/badge-presets"
import type { PlanckPassTier } from "@/lib/planckpass/types"
import { BadgePresetPreview } from "@/components/planckpass/badges/badge-preset-layer"
import { BorderPresetPreview } from "@/components/planckpass/borders/border-preset-layer"

const lilita = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
})

interface PlanckPassLockedPreviewProps {
  tier: PlanckPassTier
  onClose: () => void
}

function RewardVisual({ tier }: { tier: PlanckPassTier }) {
  const borderPreset = borderPresetIdFromCosmetic(tier.cosmetic)
  if (borderPreset) {
    return <BorderPresetPreview presetId={borderPreset} size={120} />
  }
  const badgePreset = badgePresetIdFromCosmetic(tier.cosmetic)
  if (badgePreset) {
    return <BadgePresetPreview presetId={badgePreset} size={110} />
  }
  if (tier.cosmetic?.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={tier.cosmetic.imageUrl}
        alt=""
        className="h-[70%] w-[70%] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
      />
    )
  }
  if (tier.kind === "coins") {
    return <Coins className="h-[55%] w-[55%] text-amber-300" strokeWidth={2.5} />
  }
  if (tier.kind === "elo" || tier.kind === "elo_2x") {
    return <Zap className="h-[55%] w-[55%] text-yellow-300" strokeWidth={2.5} />
  }
  if (tier.kind === "streak_freeze") {
    return <Snowflake className="h-[55%] w-[55%] text-sky-300" strokeWidth={2.5} />
  }
  return <Sparkles className="h-[55%] w-[55%] text-fuchsia-200" strokeWidth={2.5} />
}

function rewardTitle(tier: PlanckPassTier) {
  if (tier.cosmetic?.name) return tier.cosmetic.name
  if (tier.label) return tier.label
  if (tier.kind === "elo") return `+${tier.eloAmount ?? 0} ELO`
  if (tier.kind === "coins") return `${tier.coinsAmount ?? 0} coins`
  if (tier.kind === "elo_2x") return `2x ELO · ${tier.eloMultiplierMinutes ?? 15}m`
  if (tier.kind === "streak_freeze") return `Streak freeze · ${tier.streakFreezeHours ?? 24}h`
  return "Reward"
}

export function PlanckPassLockedPreview({ tier, onClose }: PlanckPassLockedPreviewProps) {
  const reduceMotion = useReducedMotion()
  const needsPremium = tier.premiumLocked
  const title = rewardTitle(tier)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[550] flex flex-col items-center justify-between overflow-hidden px-6 pb-14 pt-[max(3.5rem,env(safe-area-inset-top))] select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Tier ${tier.tier} blocat`}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 48%, #d4d4d8 0%, #a1a1aa 32%, #71717a 62%, #52525b 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Cpath fill='%23000000' d='M36 6l6.5 18.5H62l-15 11 5.8 18.5L36 43.5 19.2 54l5.8-18.5-15-11h19.5z'/%3E%3C/svg%3E")`,
          backgroundSize: "72px 72px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[46%] h-[70vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.22) 28%, transparent 68%)",
        }}
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Închide preview"
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1a0a4a]/50 bg-white/80 text-[#1a0a4a] shadow-md backdrop-blur-sm active:scale-95"
      >
        <X className="h-5 w-5" strokeWidth={2.75} />
      </button>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-2 pt-2"
        initial={reduceMotion ? false : { opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#1a0a4a] bg-[#3f3f46] shadow-[0_3px_0_#1a0a4a]">
          <Lock className="h-5 w-5 text-yellow-300" strokeWidth={3} />
        </span>
        <p
          className={`${lilita.className} planckpass-claim-outline text-center text-[clamp(1.75rem,7vw,2.75rem)] leading-none tracking-wide`}
        >
          REWARD BLOCAT
        </p>
      </motion.div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <motion.div
          className="relative flex h-[min(42vw,11.5rem)] w-[min(42vw,11.5rem)] items-center justify-center sm:h-52 sm:w-52"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
        >
          <div className="planckpass-locked-reward-card absolute inset-0 flex items-center justify-center grayscale-[0.35]">
            <RewardVisual tier={tier} />
          </div>
          <span
            aria-hidden
            className="absolute -right-1 -top-1 z-10 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-[#1a0a4a] bg-[#3f3f46] shadow-[0_3px_0_#1a0a4a]"
          >
            <Lock className="h-4 w-4 text-yellow-300" strokeWidth={3} />
          </span>
        </motion.div>

        <motion.p
          className="title-font planckpass-claim-outline relative z-10 mt-6 max-w-[90%] text-center text-[clamp(1.15rem,4.5vw,1.65rem)] font-black italic leading-tight"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.3 }}
        >
          {title}
        </motion.p>

        <motion.p
          className="relative z-10 mt-3 max-w-[20rem] text-center text-sm font-bold leading-snug text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.18, duration: 0.3 }}
        >
          {needsPremium
            ? "Reward-ul este blocat. Ai nevoie de PREMIUM pentru a-l debloca."
            : "Reward-ul este blocat. Nu ai ajuns încă la acest tier."}
        </motion.p>
      </div>

      <motion.div
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-3"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.22, duration: 0.3 }}
      >
        <Link
          href="/pricing"
          className={`${lilita.className} flex w-full items-center justify-center rounded-xl border-[3px] border-[#1a0a4a] bg-[#ffd000] px-5 py-3.5 text-center text-[clamp(1.15rem,4.5vw,1.45rem)] leading-none tracking-wide text-[#1a0a4a] shadow-[0_4px_0_#1a0a4a] active:translate-y-[2px] active:shadow-[0_2px_0_#1a0a4a]`}
        >
          {needsPremium ? "DEBLOCHEAZĂ CU PREMIUM" : "VEZI PREMIUM"}
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-bold uppercase tracking-wider text-white/85 underline-offset-2 hover:underline"
        >
          Închide
        </button>
      </motion.div>
    </motion.div>
  )
}
