"use client"

import { useState } from "react"

const ACCENT = "#292929"
const DARK = "#292929"

type SlotValue = 0 | 1 | 2
const VOLTAGE = 12
const R_BULB = 10
const R_VALS = [0, 10, 20]
const LABELS = ["Fir", "R", "2R"]

export function PhysicsCircuitSim() {
  const [slots, setSlots] = useState<SlotValue[]>([0, 0, 0])

  const cycle = (i: number) => {
    setSlots((prev) => {
      const n = [...prev] as SlotValue[]
      n[i] = ((prev[i] + 1) % 3) as SlotValue
      return n
    })
  }

  const rTotal = R_BULB + slots.reduce<number>((s, v) => s + R_VALS[v], 0)
  const current = VOLTAGE / rTotal
  const maxI = VOLTAGE / R_BULB
  const brightness = current / maxI
  const brightLabel =
    brightness > 0.7 ? "Mare" : brightness > 0.35 ? "Medie" : "Mică"

  return (
    <div>
      <svg viewBox="0 0 480 130" className="w-full">
        {/* Return wire (behind everything) */}
        <path
          d="M40,50 L40,105 L440,105 L440,50"
          fill="none"
          stroke={DARK}
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.2}
        />

        {/* Main top wire */}
        <line x1={40} y1={50} x2={440} y2={50} stroke={DARK} strokeWidth={1.5} />

        {/* Battery icon */}
        <rect
          x={26}
          y={36}
          width={28}
          height={28}
          rx={5}
          fill="white"
          stroke={DARK}
          strokeWidth={1.2}
        />
        <line x1={34} y1={47} x2={38} y2={47} stroke={DARK} strokeWidth={2.5} />
        <line x1={36} y1={45} x2={36} y2={49} stroke={DARK} strokeWidth={1.5} />
        <line x1={42} y1={47} x2={46} y2={47} stroke={DARK} strokeWidth={2.5} />
        <text
          x={40}
          y={75}
          textAnchor="middle"
          fill={DARK}
          fontSize={9}
          fontWeight={600}
        >
          {VOLTAGE}V
        </text>

        {/* Slots */}
        {slots.map((val, i) => {
          const cx = 155 + i * 95
          return (
            <g key={i} onClick={() => cycle(i)} className="cursor-pointer">
              <rect
                x={cx - 28}
                y={32}
                width={56}
                height={36}
                rx={8}
                fill={val === 0 ? "white" : "#f5f5f5"}
                stroke={val === 0 ? "#d8d5e0" : "#292929"}
                strokeWidth={1.3}
              />
              {val > 0 && (
                <path
                  d={
                    val === 1
                      ? `M${cx - 14},50 l5,-8 5,16 5,-16 5,16 3,-8`
                      : `M${cx - 18},50 l4,-9 4,18 4,-18 4,18 4,-18 4,18 4,-18 3,9`
                  }
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
              )}
              <text
                x={cx}
                y={28}
                textAnchor="middle"
                fill={val === 0 ? "#bbb" : ACCENT}
                fontSize={10}
                fontWeight={600}
              >
                {LABELS[val]}
              </text>
            </g>
          )
        })}

        {/* Bulb */}
        <circle
            cx={420}
            cy={50}
            r={18}
            fill={`rgba(41,41,41,${(0.04 + brightness * 0.5).toFixed(2)})`}
            stroke={ACCENT}
          strokeWidth={1.5}
        />
        <line
          x1={413}
          y1={43}
          x2={427}
          y2={57}
          stroke={ACCENT}
          strokeWidth={1}
          opacity={0.6}
        />
        <line
          x1={427}
          y1={43}
          x2={413}
          y2={57}
          stroke={ACCENT}
          strokeWidth={1}
          opacity={0.6}
        />
        {brightness > 0.3 && (
          <circle
            cx={420}
            cy={50}
            r={24}
            fill="none"
            stroke={ACCENT}
            strokeWidth={0.8}
            opacity={brightness * 0.25}
          />
        )}
        {brightness > 0.5 && (
          <circle
            cx={420}
            cy={50}
            r={30}
            fill="none"
            stroke={ACCENT}
            strokeWidth={0.5}
            opacity={brightness * 0.15}
          />
        )}

        {/* Current direction arrow */}
        <polygon
          points="238,101 246,105 238,109"
          fill={ACCENT}
          opacity={0.35}
        />
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-y-1.5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-[#292929]">
            R<sub>total</sub> = {rTotal}Ω
          </span>
          <span className="text-[11px] font-bold text-[#292929]">
            I = {current.toFixed(2)}A
          </span>
          <span
            className={`text-[10px] font-semibold ${
              brightness > 0.7
                ? "text-[#292929]"
                : brightness > 0.35
                  ? "text-[#555555]"
                  : "text-[#ccc]"
            }`}
          >
            Strălucire: {brightLabel}
          </span>
        </div>
        <p className="text-[10px] text-[#999]">Click pe slot-uri</p>
      </div>
    </div>
  )
}
