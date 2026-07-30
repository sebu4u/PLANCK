"use client"

import type { ReactNode } from "react"
import "./badge-presets.css"
import { cn } from "@/lib/utils"
import type { BadgePresetId } from "@/lib/planckpass/badge-presets"

type BadgeSvgProps = { className?: string }

function NovaStar({ className }: BadgeSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g className="pp-badge-ray">
        <path
          d="M50 8 L54 42 L50 46 L46 42 Z M50 92 L54 58 L50 54 L46 58 Z M8 50 L42 54 L46 50 L42 46 Z M92 50 L58 54 L54 50 L58 46 Z"
          fill="#fde68a"
          opacity="0.85"
        />
        <path
          d="M22 22 L44 46 L48 48 L46 44 Z M78 78 L56 54 L52 52 L54 56 Z M78 22 L56 46 L52 48 L54 44 Z M22 78 L44 54 L48 52 L46 56 Z"
          fill="#fbbf24"
          opacity="0.7"
        />
      </g>
      <circle cx="50" cy="50" r="22" fill="#f59e0b" className="pp-badge-core" />
      <circle cx="50" cy="50" r="14" fill="#fef3c7" className="pp-badge-shine" />
      <path
        d="M50 34 L54 46 L66 46 L56 54 L60 66 L50 58 L40 66 L44 54 L34 46 L46 46 Z"
        fill="#fff7ed"
        className="pp-badge-core"
      />
    </svg>
  )
}

function EmberShield({ className }: BadgeSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        d="M50 10 L82 24 L82 52 C82 72 66 88 50 94 C34 88 18 72 18 52 L18 24 Z"
        fill="#7c2d12"
        stroke="#fb923c"
        strokeWidth="2.5"
      />
      <path
        d="M50 20 L74 30 L74 52 C74 66 62 78 50 84 C38 78 26 66 26 52 L26 30 Z"
        fill="#ea580c"
        opacity="0.9"
      />
      <g className="pp-badge-flame">
        <path d="M50 38 C58 48 60 56 50 72 C40 56 42 48 50 38 Z" fill="#fbbf24" />
        <path d="M50 46 C54 52 55 58 50 66 C45 58 46 52 50 46 Z" fill="#fff7ed" />
      </g>
    </svg>
  )
}

function GoldMedal({ className }: BadgeSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={cn(className, "pp-badge-bob")} aria-hidden>
      <path d="M34 8 L42 34 L50 12 L58 34 L66 8" fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
      <path d="M34 8 L42 34 L50 12 L58 34 L66 8" fill="none" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="62" r="28" fill="#b45309" />
      <circle cx="50" cy="62" r="24" fill="#f59e0b" className="pp-badge-shine" />
      <circle cx="50" cy="62" r="16" fill="#fde68a" />
      <path
        d="M50 48 L54 58 L65 58 L56 65 L59 76 L50 69 L41 76 L44 65 L35 58 L46 58 Z"
        fill="#b45309"
      />
      <circle cx="40" cy="52" r="2" fill="#fffbeb" className="pp-badge-shine" />
    </svg>
  )
}

function CrystalGem({ className }: BadgeSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="pp-badge-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="45%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <polygon
        points="50,8 78,32 68,82 32,82 22,32"
        fill="url(#pp-badge-gem)"
        stroke="#cffafe"
        strokeWidth="2"
        className="pp-badge-shine"
      />
      <path d="M50 8 L50 82 M22 32 L78 32 M32 82 L50 32 L68 82" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
      <circle cx="44" cy="28" r="2.5" fill="#fff" className="pp-badge-core" />
    </svg>
  )
}

function CometTrail({ className }: BadgeSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        d="M18 78 Q40 60 55 45"
        fill="none"
        stroke="#c4b5fd"
        strokeWidth="5"
        strokeLinecap="round"
        className="pp-badge-trail"
        opacity="0.55"
      />
      <path
        d="M22 72 Q42 56 58 42"
        fill="none"
        stroke="#a78bfa"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="pp-badge-trail"
        style={{ animationDelay: "0.2s" }}
      />
      <circle cx="70" cy="30" r="16" fill="#7c3aed" className="pp-badge-core" />
      <circle cx="70" cy="30" r="10" fill="#ddd6fe" className="pp-badge-shine" />
      <circle cx="66" cy="26" r="2.5" fill="#fff" />
    </svg>
  )
}

const BADGE_COMPONENTS: Record<BadgePresetId, (props: BadgeSvgProps) => ReactNode> = {
  "nova-star": NovaStar,
  "ember-shield": EmberShield,
  "gold-medal": GoldMedal,
  "crystal-gem": CrystalGem,
  "comet-trail": CometTrail,
}

export function BadgePresetLayer({
  presetId,
  className,
}: {
  presetId: BadgePresetId
  className?: string
}) {
  const Comp = BADGE_COMPONENTS[presetId]
  if (!Comp) return null
  return (
    <div className={cn("pp-badge", className)}>
      <Comp />
    </div>
  )
}

/** Standalone preview (inventory, admin, reward cards). */
export function BadgePresetPreview({
  presetId,
  size = 48,
  className,
}: {
  presetId: BadgePresetId
  size?: number
  className?: string
}) {
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <BadgePresetLayer presetId={presetId} />
    </div>
  )
}
