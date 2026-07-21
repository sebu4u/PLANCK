"use client"

import { Atom } from "lucide-react"

/** Deterministic 0–1 from seed (stable SSR + seamless tile duplicate). */
function hash01(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

type AtomSpot = {
  id: number
  left: number
  top: number
  size: number
  rotate: number
}

/** Scattered spots — not on a grid; same set for both loop tiles. */
const ATOM_SPOTS: AtomSpot[] = Array.from({ length: 22 }, (_, i) => {
  const a = hash01(i + 1)
  const b = hash01(i + 41)
  const c = hash01(i + 97)
  const d = hash01(i + 163)
  return {
    id: i,
    // Keep a soft margin so icons aren't clipped at tile edges
    left: 4 + a * 88,
    top: 3 + b * 90,
    size: 22 + c * 14,
    rotate: -28 + d * 56,
  }
})

/** One tile of the drifting pattern (duplicated vertically for a seamless loop). */
function PatternTile({ className }: { className?: string }) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {ATOM_SPOTS.map((spot) => (
        <Atom
          key={spot.id}
          className="absolute text-[#b89cff]"
          strokeWidth={1.75}
          aria-hidden
          style={{
            left: `${spot.left}%`,
            top: `${spot.top}%`,
            width: spot.size,
            height: spot.size,
            transform: `translate(-50%, -50%) rotate(${spot.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

/** Subtle infinite bottom→top atom drift behind PLANCKPASS rewards. */
export function PlanckPassBgPattern() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.18]"
    >
      <div className="planckpass-bg-drift absolute inset-x-0 top-0 h-[200%] will-change-transform">
        <PatternTile className="h-1/2 w-full" />
        <PatternTile className="h-1/2 w-full" />
      </div>
    </div>
  )
}
