"use client"

import { Check, Coins, Lock, Snowflake, Sparkles, Zap } from "lucide-react"
import { BadgePresetPreview } from "@/components/planckpass/badges/badge-preset-layer"
import { BorderPresetPreview } from "@/components/planckpass/borders/border-preset-layer"
import { badgePresetIdFromCosmetic } from "@/lib/planckpass/badge-presets"
import { borderPresetIdFromCosmetic } from "@/lib/planckpass/border-presets"
import { cn } from "@/lib/utils"
import type { PlanckPassCosmetic, PlanckPassRewardKind, PlanckPassTier } from "@/lib/planckpass/types"
import { PLANCKPASS_CARD_HEIGHT, PLANCKPASS_CARD_WIDTH, PLANCKPASS_DESKTOP_CARD_HEIGHT, PLANCKPASS_DESKTOP_CARD_WIDTH } from "./planckpass-layout"

interface PlanckPassRewardCardProps {
  tier: PlanckPassTier
  currentTier: number
  claiming?: boolean
  onClaim?: (tier: PlanckPassTier) => void
  /** Preview locked / future / premium-gated rewards */
  onPreview?: (tier: PlanckPassTier) => void
  className?: string
  /** Desktop pass uses larger cards */
  size?: "default" | "desktop"
}

function RewardIcon({
  kind,
  cosmetic,
  claimable,
  large,
}: {
  kind: PlanckPassRewardKind
  cosmetic?: PlanckPassCosmetic | null
  claimable?: boolean
  large?: boolean
}) {
  const borderPreset = borderPresetIdFromCosmetic(cosmetic)
  if (borderPreset) {
    return <BorderPresetPreview presetId={borderPreset} size={large ? 36 : 28} />
  }
  const badgePreset = badgePresetIdFromCosmetic(cosmetic)
  if (badgePreset) {
    return <BadgePresetPreview presetId={badgePreset} size={large ? 36 : 28} />
  }
  if (cosmetic?.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cosmetic.imageUrl}
        alt=""
        className={cn("object-contain drop-shadow-sm", large ? "h-9 w-9" : "h-7 w-7")}
      />
    )
  }
  const cls = cn("drop-shadow-sm", large ? "h-9 w-9" : "h-7 w-7")
  const claimTone = claimable ? "text-[#1a0a4a]" : null
  switch (kind) {
    case "coins":
      return <Coins className={cn(cls, claimTone ?? "text-amber-300")} strokeWidth={2.5} />
    case "elo":
    case "elo_2x":
      return <Zap className={cn(cls, claimTone ?? "text-yellow-300")} strokeWidth={2.5} />
    case "streak_freeze":
      return <Snowflake className={cn(cls, claimTone ?? "text-sky-300")} strokeWidth={2.5} />
    case "icon":
    case "badge":
    case "border":
    case "skin":
      return <Sparkles className={cn(cls, claimTone ?? "text-fuchsia-300")} strokeWidth={2.5} />
  }
}

export function PlanckPassRewardCard({
  tier,
  currentTier,
  claiming,
  onClaim,
  onPreview,
  className,
  size = "default",
}: PlanckPassRewardCardProps) {
  const isFuture = tier.tier > currentTier && !tier.unlocked
  const dimmed = isFuture || (tier.premiumLocked && !tier.claimed)
  const claimable = tier.claimable
  const previewable = !claimable && !tier.claimed
  const interactive = (claimable && !!onClaim) || (previewable && !!onPreview)
  const desktop = size === "desktop"
  const width = desktop ? PLANCKPASS_DESKTOP_CARD_WIDTH : PLANCKPASS_CARD_WIDTH
  const height = desktop ? PLANCKPASS_DESKTOP_CARD_HEIGHT : PLANCKPASS_CARD_HEIGHT

  return (
    <button
      type="button"
      disabled={claiming || !interactive}
      onClick={() => {
        if (claimable && onClaim) {
          onClaim(tier)
          return
        }
        if (previewable && onPreview) onPreview(tier)
      }}
      aria-label={`Tier ${tier.tier}: ${tier.label}${tier.isFree ? " (free)" : " (premium)"}${previewable ? " — blocat" : ""}`}
      className={cn(
        "relative shrink-0 touch-manipulation outline-none transition-transform active:scale-[0.96]",
        !interactive && "cursor-default",
        className,
      )}
      style={{ width, height }}
    >
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-[10px]",
          claimable ? "bg-[#8a5a00]" : "bg-[#1a0a4a]",
        )}
        style={{ transform: "skewX(-12deg) translate(3px, 4px)" }}
      />

      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[10px] border-2",
          claimable
            ? "planckpass-claimable-card border-[#ffd000]"
            : tier.isFree
              ? "border-[#2a1570] bg-gradient-to-b from-[#7c4dff] to-[#4a1fd6]"
              : "border-[#2a1570] bg-gradient-to-b from-[#6b3aff] to-[#3b1499]",
          dimmed && "opacity-55",
        )}
        style={{ transform: "skewX(-12deg)" }}
      >
        {claimable ? <span aria-hidden className="planckpass-claimable-shine" /> : null}

        <div
          className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-0.5 px-1.5"
          style={{ transform: "skewX(12deg)" }}
        >
          <RewardIcon
            kind={tier.kind}
            cosmetic={tier.cosmetic}
            claimable={claimable}
            large={desktop}
          />
          <span
            className={cn(
              "max-w-full truncate text-center font-extrabold uppercase leading-tight tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.55)]",
              desktop ? "text-[11px]" : "text-[10px]",
              claimable ? "text-[#1a0a4a]" : "text-white",
            )}
          >
            {tier.label}
          </span>
        </div>
      </div>

      {claimable ? (
        <>
          <span
            aria-hidden
            className="planckpass-claimable-spark -left-0.5 -top-1"
            style={{ animationDelay: "0s" }}
          />
          <span
            aria-hidden
            className="planckpass-claimable-spark -right-1 top-2"
            style={{ animationDelay: "0.35s" }}
          />
          <span
            aria-hidden
            className="planckpass-claimable-spark bottom-3 -left-1"
            style={{ animationDelay: "0.7s" }}
          />
          <span
            aria-hidden
            className="planckpass-claimable-spark -bottom-0.5 right-1"
            style={{ animationDelay: "1.05s" }}
          />
        </>
      ) : null}

      {tier.claimed ? (
        <span
          className="absolute -left-0.5 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-md"
          aria-hidden
        >
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
      ) : null}

      {tier.premiumLocked ? (
        <span
          className="absolute -right-0.5 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#1a0a4a] bg-[#2a1570] shadow-md"
          aria-hidden
        >
          <Lock className="h-2.5 w-2.5 text-yellow-300" strokeWidth={3} />
        </span>
      ) : null}

      {tier.isFree && !tier.claimed ? (
        <span className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-sm bg-emerald-400 px-1 py-px text-[8px] font-black uppercase tracking-wider text-[#0a3d1f] shadow">
          Free
        </span>
      ) : null}
    </button>
  )
}

const SKELETON_COUNT_DEFAULT = 6

export function PlanckPassRewardCardSkeleton({
  className,
  size = "default",
}: {
  className?: string
  size?: "default" | "desktop"
}) {
  const desktop = size === "desktop"
  const width = desktop ? PLANCKPASS_DESKTOP_CARD_WIDTH : PLANCKPASS_CARD_WIDTH
  const height = desktop ? PLANCKPASS_DESKTOP_CARD_HEIGHT : PLANCKPASS_CARD_HEIGHT

  return (
    <div
      aria-hidden
      className={cn("relative shrink-0", className)}
      style={{ width, height }}
    >
      <div
        className="absolute inset-0 rounded-[10px] bg-[#1a0a4a]/55"
        style={{ transform: "skewX(-12deg) translate(3px, 4px)" }}
      />
      <div
        className="absolute inset-0 animate-pulse overflow-hidden rounded-[10px] border-2 border-[#2a1570]/80 bg-gradient-to-b from-[#7c4dff]/45 to-[#4a1fd6]/35"
        style={{ transform: "skewX(-12deg)" }}
      >
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-1.5"
          style={{ transform: "skewX(12deg)" }}
        >
          <div
            className={cn(
              "rounded-md bg-white/20",
              desktop ? "h-9 w-9" : "h-7 w-7",
            )}
          />
          <div className="h-2 w-10 rounded bg-white/15" />
        </div>
      </div>
    </div>
  )
}

export function PlanckPassRewardCardsSkeletonRow({
  count = SKELETON_COUNT_DEFAULT,
}: {
  count?: number
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <PlanckPassRewardCardSkeleton key={index} />
      ))}
    </>
  )
}
