"use client"

import { cn } from "@/lib/utils"

interface CosmeticsAvatarFrameProps {
  children: React.ReactNode
  borderImageUrl?: string | null
  badgeImageUrl?: string | null
  className?: string
  size?: number
}

/** Wraps an avatar with optional PLANCKPASS border ring + corner badge. */
export function CosmeticsAvatarFrame({
  children,
  borderImageUrl,
  badgeImageUrl,
  className,
  size = 128,
}: CosmeticsAvatarFrameProps) {
  return (
    <div className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      {borderImageUrl ? (
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
          borderImageUrl ? "inset-[8%]" : "inset-0",
        )}
      >
        {children}
      </div>
      {badgeImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={badgeImageUrl}
          alt=""
          className="pointer-events-none absolute -bottom-1 -right-1 z-30 h-9 w-9 object-contain drop-shadow"
        />
      ) : null}
    </div>
  )
}
