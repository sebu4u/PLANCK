"use client"

import type { ReactNode } from "react"
import "./border-presets.css"
import { cn } from "@/lib/utils"
import type { BorderPresetId } from "@/lib/planckpass/border-presets"

type BorderSvgProps = { className?: string }

function OrbitRings({ className }: BorderSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(120,160,255,0.25)" strokeWidth="1" />
      <g className="pp-orbit-a">
        <ellipse
          cx="50"
          cy="50"
          rx="44"
          ry="28"
          fill="none"
          stroke="#7eb6ff"
          strokeWidth="1.6"
          opacity="0.9"
        />
        <circle cx="94" cy="50" r="2.4" fill="#cfe3ff" />
      </g>
      <g className="pp-orbit-b">
        <ellipse
          cx="50"
          cy="50"
          rx="30"
          ry="44"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="1.4"
          opacity="0.85"
        />
        <circle cx="50" cy="6" r="2.1" fill="#ddd6fe" />
      </g>
      <g className="pp-orbit-c">
        <ellipse
          cx="50"
          cy="50"
          rx="40"
          ry="40"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1"
          strokeDasharray="3 7"
          opacity="0.7"
        />
        <circle cx="18" cy="72" r="1.8" fill="#7dd3fc" />
      </g>
    </svg>
  )
}

function NeonCircuit({ className }: BorderSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <filter id="pp-neon-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="2"
        className="pp-neon-path"
        filter="url(#pp-neon-glow)"
      />
      <path
        d="M50 5 L58 14 L42 14 Z M95 50 L86 58 L86 42 Z M50 95 L42 86 L58 86 Z M5 50 L14 42 L14 58 Z"
        fill="#22d3ee"
        opacity="0.95"
        filter="url(#pp-neon-glow)"
      />
      <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="1" />
    </svg>
  )
}

function Constellation({ className }: BorderSvgProps) {
  const stars = [
    [50, 6],
    [78, 18],
    [92, 48],
    [80, 80],
    [50, 94],
    [20, 80],
    [8, 48],
    [22, 18],
  ] as const
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1" />
      <path
        d="M50 6 L78 18 L92 48 L80 80 L50 94 L20 80 L8 48 L22 18 Z"
        fill="none"
        stroke="#c4b5fd"
        strokeWidth="1.1"
        className="pp-const-line"
      />
      {stars.map(([x, y], i) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={i % 2 === 0 ? 2.2 : 1.6}
          fill="#f5f3ff"
          className="pp-star"
          style={{ animationDelay: `${i * 0.22}s` }}
        />
      ))}
    </svg>
  )
}

function EmberFlame({ className }: BorderSvgProps) {
  const embers = [
    [50, 5, 0],
    [68, 10, 0.15],
    [84, 24, 0.3],
    [92, 45, 0.1],
    [88, 68, 0.4],
    [72, 86, 0.2],
    [50, 94, 0.35],
    [28, 86, 0.05],
    [12, 68, 0.25],
    [8, 45, 0.45],
    [16, 24, 0.18],
    [32, 10, 0.32],
  ] as const
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(251,146,60,0.35)" strokeWidth="2" />
      {embers.map(([x, y, delay], i) => (
        <g key={i} className="pp-ember" style={{ animationDelay: `${delay}s` }}>
          <ellipse cx={x} cy={y} rx="2.2" ry="3.4" fill={i % 3 === 0 ? "#fbbf24" : "#f97316"} opacity="0.95" />
        </g>
      ))}
      <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="1" />
    </svg>
  )
}

function CrystalPrism({ className }: BorderSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="pp-crystal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#a5b4fc" />
        </linearGradient>
      </defs>
      <polygon
        points="50,4 72,18 88,40 84,68 62,90 38,90 16,68 12,40 28,18"
        fill="none"
        stroke="url(#pp-crystal)"
        strokeWidth="2"
        className="pp-crystal-facet"
      />
      <path
        d="M50 4 L50 50 L72 18 M50 50 L88 40 M50 50 L84 68 M50 50 L62 90"
        fill="none"
        stroke="rgba(224,242,254,0.55)"
        strokeWidth="1"
        className="pp-crystal-facet"
        style={{ animationDelay: "0.4s" }}
      />
      <circle cx="50" cy="18" r="1.5" fill="#fff" className="pp-crystal-facet" />
      <circle cx="78" cy="52" r="1.3" fill="#fff" className="pp-crystal-facet" style={{ animationDelay: "0.7s" }} />
    </svg>
  )
}

function AuroraFlow({ className }: BorderSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="pp-aurora" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="40%" stopColor="#22d3ee" />
          <stop offset="70%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="url(#pp-aurora)"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="pp-aurora-band"
        opacity="0.95"
      />
      <circle
        cx="50"
        cy="50"
        r="41"
        fill="none"
        stroke="url(#pp-aurora)"
        strokeWidth="1.5"
        className="pp-aurora-band"
        style={{ animationDuration: "5.5s", animationDirection: "reverse" }}
        opacity="0.55"
      />
    </svg>
  )
}

function GoldenLaurel({ className }: BorderSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="pp-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <path
        d="M28 78 C18 62 18 38 32 22 C38 34 40 50 36 66 Z"
        fill="url(#pp-gold)"
        opacity="0.95"
      />
      <path
        d="M72 78 C82 62 82 38 68 22 C62 34 60 50 64 66 Z"
        fill="url(#pp-gold)"
        opacity="0.95"
      />
      {[
        [24, 34],
        [22, 48],
        [26, 62],
        [76, 34],
        [78, 48],
        [74, 62],
        [50, 12],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="1.8"
          fill="#fef3c7"
          className="pp-laurel-spark"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
      <path
        d="M40 82 Q50 90 60 82"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PixelGlitch({ className }: BorderSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={cn(className, "pp-glitch-layer")} aria-hidden>
      <rect x="8" y="8" width="84" height="84" rx="6" fill="none" stroke="#22c55e" strokeWidth="2" />
      <rect x="8" y="8" width="12" height="4" fill="#4ade80" />
      <rect x="80" y="8" width="12" height="4" fill="#a3e635" />
      <rect x="8" y="88" width="16" height="4" fill="#22d3ee" />
      <rect x="76" y="88" width="16" height="4" fill="#f472b6" />
      <rect x="8" y="20" width="4" height="10" fill="#22c55e" />
      <rect x="88" y="40" width="4" height="14" fill="#eab308" />
      <rect x="18" y="8" width="8" height="4" fill="#f43f5e" opacity="0.85" />
      <rect x="60" y="88" width="10" height="4" fill="#818cf8" opacity="0.9" />
      <path d="M14 50 H22 M78 50 H86 M50 14 V22 M50 78 V86" stroke="#86efac" strokeWidth="2" />
    </svg>
  )
}

function VoidPortal({ className }: BorderSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <radialGradient id="pp-void" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(76,29,149,0.55)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#pp-void)" />
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="#c084fc"
        className="pp-void-rim"
      />
      <g className="pp-void-swirl">
        <path
          d="M50 8 C70 18 82 35 82 50 C82 70 65 88 50 92"
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M50 92 C30 82 18 65 18 50 C18 30 35 12 50 8"
          fill="none"
          stroke="#e879f9"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </svg>
  )
}

function ConfettiCrown({ className }: BorderSvgProps) {
  const bits = [
    [22, 18, "#f472b6", 0],
    [35, 10, "#fbbf24", 0.3],
    [50, 6, "#34d399", 0.15],
    [65, 10, "#60a5fa", 0.45],
    [78, 18, "#c084fc", 0.2],
    [14, 32, "#fb7185", 0.55],
    [86, 32, "#2dd4bf", 0.4],
  ] as const
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        d="M20 34 L32 22 L42 32 L50 16 L58 32 L68 22 L80 34 L76 48 L24 48 Z"
        fill="#f59e0b"
        stroke="#fde68a"
        strokeWidth="1.2"
      />
      <circle cx="32" cy="28" r="2" fill="#fef3c7" />
      <circle cx="50" cy="22" r="2.4" fill="#fff7ed" />
      <circle cx="68" cy="28" r="2" fill="#fef3c7" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(251,191,36,0.35)" strokeWidth="2" />
      {bits.map(([x, y, color, delay], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width="3"
          height="4"
          rx="0.5"
          fill={color}
          className="pp-confetti"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </svg>
  )
}

const BORDER_COMPONENTS: Record<BorderPresetId, (props: BorderSvgProps) => ReactNode> = {
  "orbit-rings": OrbitRings,
  "neon-circuit": NeonCircuit,
  constellation: Constellation,
  "ember-flame": EmberFlame,
  "crystal-prism": CrystalPrism,
  "aurora-flow": AuroraFlow,
  "golden-laurel": GoldenLaurel,
  "pixel-glitch": PixelGlitch,
  "void-portal": VoidPortal,
  "confetti-crown": ConfettiCrown,
}

export function BorderPresetLayer({
  presetId,
  className,
}: {
  presetId: BorderPresetId
  className?: string
}) {
  const Comp = BORDER_COMPONENTS[presetId]
  if (!Comp) return null
  return (
    <div className={cn("pp-border", className)}>
      <Comp />
    </div>
  )
}

/** Standalone circular preview (inventory, admin, reward cards). */
export function BorderPresetPreview({
  presetId,
  size = 64,
  className,
}: {
  presetId: BorderPresetId
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn("relative overflow-visible rounded-full bg-[#111827]/10", className)}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-[18%] rounded-full bg-gradient-to-br from-[#e5e7eb] to-[#9ca3af]" />
      <BorderPresetLayer presetId={presetId} />
    </div>
  )
}
