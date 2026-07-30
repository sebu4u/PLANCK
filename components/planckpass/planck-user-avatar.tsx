"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CosmeticsAvatarFrame } from "@/components/planckpass/cosmetics-avatar-frame"
import { cn } from "@/lib/utils"
import type { BadgePresetId } from "@/lib/planckpass/badge-presets"
import type { BorderPresetId } from "@/lib/planckpass/border-presets"

interface PlanckUserAvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  borderPresetId?: BorderPresetId | null
  borderImageUrl?: string | null
  badgePresetId?: BadgePresetId | null
  badgeImageUrl?: string | null
  className?: string
  avatarClassName?: string
  fallbackClassName?: string
}

/** Unified avatar with optional PLANCKPASS cosmetics frame. */
export function PlanckUserAvatar({
  src,
  name,
  size = 40,
  borderPresetId,
  borderImageUrl,
  badgePresetId,
  badgeImageUrl,
  className,
  avatarClassName,
  fallbackClassName,
}: PlanckUserAvatarProps) {
  const initial = (name || "U").trim().charAt(0).toUpperCase() || "U"
  const hasFrame = Boolean(borderPresetId || borderImageUrl || badgePresetId || badgeImageUrl)

  const avatar = (
    <Avatar
      className={cn(
        "h-full w-full",
        !hasFrame && "border border-[#e5e7eb]",
        avatarClassName,
      )}
      style={!hasFrame ? { width: size, height: size } : undefined}
    >
      {src ? <AvatarImage src={src} alt={name || "Avatar"} referrerPolicy="no-referrer" /> : null}
      <AvatarFallback className={cn("bg-[#f3f4f6] text-[#4b5563]", fallbackClassName)}>
        {initial}
      </AvatarFallback>
    </Avatar>
  )

  if (!hasFrame) {
    return <div className={cn("inline-flex shrink-0", className)}>{avatar}</div>
  }

  return (
    <CosmeticsAvatarFrame
      size={size}
      borderPresetId={borderPresetId}
      borderImageUrl={borderImageUrl}
      badgePresetId={badgePresetId}
      badgeImageUrl={badgeImageUrl}
      className={cn("shrink-0", className)}
    >
      {avatar}
    </CosmeticsAvatarFrame>
  )
}
