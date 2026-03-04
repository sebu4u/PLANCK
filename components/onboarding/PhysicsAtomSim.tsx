"use client"

import { useEffect, useRef, useState } from "react"

const ACCENT = "#292929"
const CX = 200
const CY = 140
const BASE_RADII = [55, 90, 125]
const ORBIT_TILTS = [0, 60, 125]
const ORBIT_SPEEDS = [1.8, 1.2, 0.8]
const ENERGY_MULT = [0.75, 1.0, 1.3]

function distributeElectrons(n: number): number[] {
  const shells: number[] = []
  let remaining = n
  const maxPerShell = [2, 4, 2]
  for (const max of maxPerShell) {
    if (remaining <= 0) break
    shells.push(Math.min(remaining, max))
    remaining -= Math.min(remaining, max)
  }
  return shells
}

export function PhysicsAtomSim() {
  const [electronCount, setElectronCount] = useState(6)
  const [energyLevel, setEnergyLevel] = useState(2)
  const [time, setTime] = useState(0)
  const raf = useRef(0)
  const t0 = useRef(performance.now())

  useEffect(() => {
    const tick = (now: number) => {
      setTime((now - t0.current) / 1000)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const shells = distributeElectrons(electronCount)
  const eMult = ENERGY_MULT[energyLevel - 1]

  return (
    <div>
      <svg viewBox="0 0 400 280" className="w-full">
        {/* Orbits */}
        {shells.map((_, i) => {
          const r = BASE_RADII[i] * eMult
          const tilt = ORBIT_TILTS[i]
          return (
            <ellipse
              key={`orbit-${i}`}
              cx={CX}
              cy={CY}
              rx={r}
              ry={r * 0.38}
              fill="none"
              stroke={ACCENT}
              strokeWidth={1}
              opacity={0.2}
              transform={`rotate(${tilt}, ${CX}, ${CY})`}
            />
          )
        })}

        {/* Electrons */}
        {shells.flatMap((count, si) => {
          const r = BASE_RADII[si] * eMult
          const tiltRad = (ORBIT_TILTS[si] * Math.PI) / 180
          const spd = ORBIT_SPEEDS[si]

          return Array.from({ length: count }, (_, ei) => {
            const baseAngle = (2 * Math.PI * ei) / count
            const angle = baseAngle + time * spd
            const ex = r * Math.cos(angle)
            const ey = r * 0.38 * Math.sin(angle)
            const rx = ex * Math.cos(tiltRad) - ey * Math.sin(tiltRad) + CX
            const ry = ex * Math.sin(tiltRad) + ey * Math.cos(tiltRad) + CY

            return (
              <circle
                key={`e-${si}-${ei}`}
                cx={rx}
                cy={ry}
                r={4.5}
                fill={ACCENT}
              />
            )
          })
        })}

        {/* Nucleus layers */}
        <circle cx={CX} cy={CY} r={20} fill={ACCENT} opacity={0.1} />
        <circle cx={CX} cy={CY} r={14} fill={ACCENT} opacity={0.3} />
        <circle cx={CX} cy={CY} r={9} fill={ACCENT} />
        <text
          x={CX}
          y={CY + 3.5}
          textAnchor="middle"
          fill="white"
          fontSize={8}
          fontWeight={700}
        >
          {electronCount}+
        </text>
      </svg>

      <div className="mt-3 space-y-2.5">
        <div className="flex items-center gap-3">
          <span className="w-20 text-[11px] font-semibold text-[#292929]">
            Electroni
          </span>
          <input
            type="range"
            min={1}
            max={8}
            value={electronCount}
            onChange={(e) => setElectronCount(+e.target.value)}
            className="h-1.5 flex-1 cursor-pointer accent-[#292929]"
          />
          <span className="w-8 text-right text-[11px] font-bold text-[#292929]">
            {electronCount}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20 text-[11px] font-semibold text-[#292929]">
            Energie
          </span>
          <input
            type="range"
            min={1}
            max={3}
            value={energyLevel}
            onChange={(e) => setEnergyLevel(+e.target.value)}
            className="h-1.5 flex-1 cursor-pointer accent-[#292929]"
          />
          <span className="w-8 text-right text-[11px] font-bold text-[#292929]">
            {energyLevel}
          </span>
        </div>
      </div>
    </div>
  )
}
