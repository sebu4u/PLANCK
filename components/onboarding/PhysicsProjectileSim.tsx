"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const ACCENT = "#292929"
const DARK = "#292929"
const W = 520
const H = 260
const GND = H - 24
const OX = 48
const OY = GND
const G = 9.81
const SCALE = 8

type Point = { x: number; y: number }

function computePoints(angle: number, speed: number): { pts: Point[]; dur: number } {
  const rad = (angle * Math.PI) / 180
  const vx = speed * Math.cos(rad)
  const vy = speed * Math.sin(rad)
  const tTotal = (2 * vy) / G

  const pts: Point[] = []
  const steps = 200
  const dt = tTotal / steps
  for (let i = 0; i <= steps; i++) {
    const t = i * dt
    const px = vx * t
    const py = vy * t - 0.5 * G * t * t
    if (py < 0) break
    pts.push({ x: OX + px * SCALE, y: OY - py * SCALE })
  }
  return { pts, dur: Math.max(tTotal * 400, 900) }
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    setIsMobile(mq.matches)
    const on = () => setIsMobile(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return isMobile
}

export function PhysicsProjectileSim() {
  const isMobile = useIsMobile()
  const [angle, setAngle] = useState(45)
  const [speed, setSpeed] = useState(18)
  const [trail, setTrail] = useState<Point[]>([])
  const [pos, setPos] = useState<Point | null>(null)
  const [running, setRunning] = useState(false)
  const raf = useRef(0)

  const pointR = isMobile ? 5.5 : 3.5
  const ballR = isMobile ? 8 : 5.5
  const trailStroke = isMobile ? 4 : 2.5

  const launch = useCallback(() => {
    cancelAnimationFrame(raf.current)
    const { pts, dur } = computePoints(angle, speed)
    setTrail([])
    setPos(pts[0])
    setRunning(true)
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      const i = Math.floor(p * (pts.length - 1))
      setTrail(pts.slice(0, i + 1))
      setPos(pts[i])
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setRunning(false)
    }
    raf.current = requestAnimationFrame(tick)
  }, [angle, speed])

  const reset = useCallback(() => {
    cancelAnimationFrame(raf.current)
    setRunning(false)
    setTrail([])
    setPos(null)
  }, [])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  useEffect(() => {
    if (!running) {
      setTrail([])
      setPos(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle, speed])

  const path =
    trail.length > 1 ? `M${trail.map((p) => `${p.x},${p.y}`).join("L")}` : ""

  const angleRad = (angle * Math.PI) / 180

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={i}
            x1={OX}
            y1={GND - i * 35}
            x2={W}
            y2={GND - i * 35}
            stroke="#e8e8ec"
            strokeWidth={0.8}
          />
        ))}
        <line x1={0} y1={GND} x2={W} y2={GND} stroke={DARK} strokeWidth={1.5} />

        <line
          x1={OX}
          y1={OY}
          x2={OX + 44}
          y2={OY}
          stroke="#ddd"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
        <line
          x1={OX}
          y1={OY}
          x2={OX + 44 * Math.cos(angleRad)}
          y2={OY - 44 * Math.sin(angleRad)}
          stroke={DARK}
          strokeWidth={isMobile ? 2.5 : 1.5}
        />

        {path && (
          <path
            d={path}
            fill="none"
            stroke="#8043f0"
            strokeWidth={trailStroke}
            strokeLinecap="round"
            opacity={0.65}
          />
        )}

        {pos && <circle cx={pos.x} cy={pos.y} r={ballR} fill="#8043f0" />}

        <circle cx={OX} cy={OY} r={pointR} fill={DARK} />
      </svg>

      <div className="mt-3 space-y-2.5">
        <div className="flex items-center gap-3">
          <span className="w-16 text-[11px] font-semibold text-[#292929]">Unghi</span>
          <input
            type="range"
            min={15}
            max={75}
            value={angle}
            onChange={(e) => setAngle(+e.target.value)}
            disabled={running}
            className="h-1.5 flex-1 cursor-pointer accent-[#292929]"
          />
          <span className="w-11 text-right text-[11px] font-bold text-[#292929]">
            {angle}°
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-16 text-[11px] font-semibold text-[#292929]">Viteză</span>
          <input
            type="range"
            min={5}
            max={30}
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            disabled={running}
            className="h-1.5 flex-1 cursor-pointer accent-[#292929]"
          />
          <span className="w-11 text-right text-[11px] font-bold text-[#292929]">
            {speed} m/s
          </span>
        </div>
        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={launch}
            disabled={running}
            className="rounded-full bg-[#292929] px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#111111] disabled:opacity-40"
          >
            {trail.length ? "Relansează" : "Lansează"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-[#e0dce8] px-4 py-1.5 text-[11px] font-semibold text-[#292929] transition-colors hover:bg-[#f5f3fa]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
