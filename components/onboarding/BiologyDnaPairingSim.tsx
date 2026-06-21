"use client"

import { useCallback, useEffect, useState } from "react"
import confetti from "canvas-confetti"

type Base = "A" | "T" | "G" | "C"

const LEFT_BASES: Base[] = ["A", "G", "T", "C"]
const PAIRS: Record<Base, Base> = { A: "T", T: "A", G: "C", C: "G" }

const BASE_COLORS: Record<Base, { bg: string; text: string }> = {
  A: { bg: "#d4edda", text: "#1e6b3a" },
  T: { bg: "#f8d7da", text: "#8b2635" },
  G: { bg: "#fff3cd", text: "#856404" },
  C: { bg: "#cce5ff", text: "#004085" },
}

const ALL_BASES: Base[] = ["A", "T", "G", "C"]

function fireMiniConfetti() {
  confetti({
    particleCount: 40,
    spread: 55,
    origin: { y: 0.65 },
    colors: ["#8043f0", "#292929", "#d4edda", "#cce5ff"],
    disableForReducedMotion: true,
  })
}

function BaseCapsule({
  base,
  selected,
  onClick,
  disabled,
}: {
  base: Base
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
}) {
  const colors = BASE_COLORS[base]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
        selected ? "ring-2 ring-[#8043f0] ring-offset-2" : ""
      } disabled:cursor-default disabled:opacity-60`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {base}
    </button>
  )
}

export function BiologyDnaPairingSim() {
  const [filled, setFilled] = useState<(Base | null)[]>([null, null, null, null])
  const [selectedBase, setSelectedBase] = useState<Base | null>(null)
  const [shakeSlot, setShakeSlot] = useState<number | null>(null)
  const [completed, setCompleted] = useState(false)

  const allFilled = filled.every((slot) => slot !== null)

  useEffect(() => {
    if (allFilled && !completed) {
      setCompleted(true)
      fireMiniConfetti()
    }
  }, [allFilled, completed])

  const handleSlotClick = useCallback(
    (slotIndex: number) => {
      if (filled[slotIndex] || !selectedBase) return

      const expected = PAIRS[LEFT_BASES[slotIndex]]
      if (selectedBase !== expected) {
        setShakeSlot(slotIndex)
        window.setTimeout(() => setShakeSlot(null), 400)
        return
      }

      setFilled((prev) => {
        const next = [...prev]
        next[slotIndex] = selectedBase
        return next
      })
      setSelectedBase(null)
    },
    [filled, selectedBase],
  )

  const handleReset = useCallback(() => {
    setFilled([null, null, null, null])
    setSelectedBase(null)
    setShakeSlot(null)
    setCompleted(false)
  }, [])

  return (
    <div>
      <div
        className={`relative rounded-lg border border-[#ebeaf3] bg-[#fafafa] px-4 py-5 ${
          completed ? "animate-pulse" : ""
        }`}
      >
        <div className="absolute left-[calc(50%-1px)] top-6 bottom-16 w-0.5 bg-[#d8d8de]" />

        <div className="space-y-4">
          {LEFT_BASES.map((leftBase, index) => {
            const rightBase = filled[index]
            const isShaking = shakeSlot === index
            const isPaired = rightBase !== null

            return (
              <div key={index} className="relative flex items-center justify-between">
                <BaseCapsule base={leftBase} disabled />

                <div
                  className={`absolute left-1/2 top-1/2 h-0.5 w-[calc(100%-5.5rem)] -translate-x-1/2 -translate-y-1/2 transition-colors ${
                    isPaired ? "bg-[#8043f0]" : "bg-[#e0dce8]"
                  }`}
                />

                <div className={isShaking ? "animate-[registerShake_0.4s_ease-in-out]" : ""}>
                  {rightBase ? (
                    <BaseCapsule base={rightBase} disabled />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSlotClick(index)}
                      disabled={!selectedBase}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-[#c8c8d0] bg-white text-sm font-bold text-[#bbb] transition-colors hover:border-[#8043f0] hover:text-[#8043f0] disabled:cursor-default disabled:opacity-60"
                    >
                      ?
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-[#999]">
        {completed
          ? "Bravo! Toate perechile sunt corecte."
          : selectedBase
            ? "Apasă pe un slot liber pentru a completa perechea."
            : "Selectează o nucleotidă, apoi completează perechea (A↔T, G↔C)."}
      </p>

      <div className="mt-3 flex items-center justify-center gap-3">
        {ALL_BASES.map((base) => (
          <BaseCapsule
            key={base}
            base={base}
            selected={selectedBase === base}
            onClick={() => setSelectedBase((prev) => (prev === base ? null : base))}
            disabled={completed}
          />
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-[#e0dce8] px-4 py-1.5 text-[11px] font-semibold text-[#292929] transition-colors hover:bg-[#f5f3fa]"
        >
          Resetează
        </button>
      </div>

      <style jsx global>{`
        @keyframes registerShake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  )
}
