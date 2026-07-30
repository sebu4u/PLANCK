"use client"

import { BadgePresetLayer } from "@/components/planckpass/badges/badge-preset-layer"
import { BorderPresetLayer } from "@/components/planckpass/borders/border-preset-layer"
import { cn } from "@/lib/utils"
import type { BadgePresetId } from "@/lib/planckpass/badge-presets"
import type { BorderPresetId } from "@/lib/planckpass/border-presets"

interface CosmeticsAvatarFrameProps {
  children: React.ReactNode
  borderPresetId?: BorderPresetId | null
  /** Legacy image-based borders (pre-preset). */
  borderImageUrl?: string | null
  badgePresetId?: BadgePresetId | null
  /** Legacy image-based badges (pre-preset). */
  badgeImageUrl?: string | null
  className?: string
  size?: number
}

/** Wraps an avatar with optional PLANCKPASS border ring + corner badge. */
export function CosmeticsAvatarFrame({
  children,
  borderPresetId,
  borderImageUrl,
  badgePresetId,
  badgeImageUrl,
  className,
  size = 128,
}: CosmeticsAvatarFrameProps) {
  const hasBorder = Boolean(borderPresetId || borderImageUrl)
  const badgePx = size < 64 ? Math.max(14, size * 0.32) : Math.min(40, size * 0.3)

  return (
    <div className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      {borderPresetId ? <BorderPresetLayer presetId={borderPresetId} /> : null}
      {!borderPresetId && borderImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={borderImageUrl}
          alt=""
          className="pointer-events-none absolute inset-0 z-20 h-full w-full object-contain"
        />
      ) : null}
      <div
        className={cn(
          "absolute z-10 flex items-center justify-center overflow-hidden rounded-full",
          hasBorder ? "inset-[10%]" : "inset-0",
        )}
      >
        {children}
      </div>
      {badgePresetId ? (
        <div
          className="pointer-events-none absolute -bottom-1 -right-1 z-30"
          style={{ width: badgePx, height: badgePx }}
        >
          <BadgePresetLayer presetId={badgePresetId} />
        </div>
      ) : null}
      {!badgePresetId && badgeImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={badgeImageUrl}
          alt=""
          className="pointer-events-none absolute -bottom-1 -right-1 z-30 object-contain drop-shadow"
          style={{ height: badgePx, width: badgePx }}
        />
      ) : null}
    </div>
  )
}
