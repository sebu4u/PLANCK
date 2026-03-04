"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const ACCENT = "#292929"
const DARK = "#292929"
const PURPLE = "#8043f0"
const W = 400
const H = 280
const PIVOT_X = 200
const PIVOT_Y = 20

type Point = { x: number; y: number }

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

function svgCoord(
  svgRef: React.RefObject<SVGSVGElement | null>,
  clientX: number,
  clientY: number,
): Point | null {
  const svg = svgRef.current
  if (!svg) return null
  const rect = svg.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * W
  const y = ((clientY - rect.top) / rect.height) * H
  return { x, y }
}

export function PhysicsPendulumSim() {
  const isMobile = useIsMobile()
  const svgRef = useRef<SVGSVGElement>(null)
  const [length, setLength] = useState(1.2)
  const [gravity, setGravity] = useState(9.81)
  const [theta0Deg, setTheta0Deg] = useState(20)
  const [running, setRunning] = useState(false)
  const [showTrail, setShowTrail] = useState(true)
  const [bobPos, setBobPos] = useState<Point>({ x: PIVOT_X, y: PIVOT_Y + 120 })
  const [trail, setTrail] = useState<Point[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const raf = useRef(0)
  const startTimeRef = useRef(0)

  const visLen = length * (isMobile ? 115 : 100)
  const theta0 = (theta0Deg * Math.PI) / 180

  const computePos = useCallback(
    (t: number): Point => {
      const T = 2 * Math.PI * Math.sqrt(length / gravity)
      const theta = theta0 * Math.cos((2 * Math.PI * t) / T)
      return {
        x: PIVOT_X + visLen * Math.sin(theta),
        y: PIVOT_Y + visLen * Math.cos(theta),
      }
    },
    [length, gravity, visLen, theta0],
  )

  const angleFromPos = useCallback((p: Point): number => {
    const dx = p.x - PIVOT_X
    const dy = p.y - PIVOT_Y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 10) return theta0
    const theta = Math.atan2(dx, dy)
    return Math.max(-1.2, Math.min(1.2, theta))
  }, [theta0])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (running) return
      e.preventDefault()
      setIsDragging(true)
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    },
    [running],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || running) return
      const p = svgCoord(svgRef, e.clientX, e.clientY)
      if (!p) return
      const theta = angleFromPos(p)
      const deg = Math.round((theta * 180) / Math.PI)
      setTheta0Deg(Math.max(-70, Math.min(70, deg)))
      setBobPos({
        x: PIVOT_X + visLen * Math.sin(theta),
        y: PIVOT_Y + visLen * Math.cos(theta),
      })
    },
    [isDragging, running, angleFromPos, visLen],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
      setIsDragging(false)
    },
    [],
  )

  const start = useCallback(() => {
    setRunning(true)
    setTrail([])
    setElapsed(0)
    startTimeRef.current = performance.now()

    const tick = (now: number) => {
      const dt = (now - startTimeRef.current) / 1000
      const p = computePos(dt)
      setBobPos(p)
      setElapsed(dt)
      setTrail((prev) => {
        const next = [...prev, p]
        return next.length > 250 ? next.slice(-250) : next
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }, [computePos])

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current)
    setRunning(false)
  }, [])

  const resetSim = useCallback(() => {
    cancelAnimationFrame(raf.current)
    setRunning(false)
    setElapsed(0)
    setTrail([])
    setBobPos(computePos(0))
  }, [computePos])

  useEffect(() => {
    if (!running && !isDragging) setBobPos(computePos(0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, gravity, theta0Deg, isMobile])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const trailPath =
    trail.length > 1
      ? `M${trail.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")}`
      : ""

  const arcR = isMobile ? 36 : 28
  const bobR = isMobile ? 20 : 14
  const stringStroke = isMobile ? 2.5 : 1.5
  const trailStroke = isMobile ? 2.5 : 1.5
  const arcEndX = PIVOT_X + arcR * Math.sin(theta0)
  const arcEndY = PIVOT_Y + arcR * Math.cos(theta0)
  const arcSweep = theta0 >= 0 ? 0 : 1

  return (
    <div>
      <div className="relative">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none">
          <line
            x1={PIVOT_X - 40}
            y1={PIVOT_Y}
            x2={PIVOT_X + 40}
            y2={PIVOT_Y}
            stroke={DARK}
            strokeWidth={isMobile ? 2.5 : 2}
          />
          <rect
            x={PIVOT_X - (isMobile ? 5 : 4)}
            y={PIVOT_Y - (isMobile ? 5 : 4)}
            width={isMobile ? 10 : 8}
            height={isMobile ? 10 : 8}
            rx={2}
            fill={DARK}
          />

          {!running && (
            <>
              <line
                x1={PIVOT_X}
                y1={PIVOT_Y}
                x2={PIVOT_X}
                y2={PIVOT_Y + arcR}
                stroke="#ddd"
                strokeWidth={isMobile ? 1.5 : 1}
                strokeDasharray="3,2"
              />
              <path
                d={`M ${PIVOT_X} ${PIVOT_Y + arcR} A ${arcR} ${arcR} 0 0 ${arcSweep} ${arcEndX} ${arcEndY}`}
                fill="none"
                stroke={DARK}
                strokeWidth={isMobile ? 2 : 1.5}
              />
              <text
                x={PIVOT_X + arcR * 0.65 * Math.sin(theta0 / 2)}
                y={PIVOT_Y + arcR * 0.65 * Math.cos(theta0 / 2)}
                fill={DARK}
                fontSize={isMobile ? 14 : 12}
                fontWeight={600}
              >
                θ
              </text>
            </>
          )}

          {showTrail && trailPath && (
            <path
              d={trailPath}
              fill="none"
              stroke={PURPLE}
              strokeWidth={trailStroke}
              opacity={0.5}
            />
          )}

          <line
            x1={PIVOT_X}
            y1={PIVOT_Y}
            x2={bobPos.x}
            y2={bobPos.y}
            stroke={DARK}
            strokeWidth={stringStroke}
          />

          <circle
            cx={bobPos.x}
            cy={bobPos.y}
            r={bobR}
            fill={ACCENT}
            className={!running ? "cursor-grab active:cursor-grabbing" : ""}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          <circle
            cx={bobPos.x}
            cy={bobPos.y}
            r={bobR}
            fill="none"
            stroke={ACCENT}
            strokeWidth={1}
            opacity={0.2}
            pointerEvents="none"
          />
        </svg>

        <div className="absolute right-2 top-2 rounded-lg border border-[#eee] bg-white/80 px-2.5 py-1 font-mono text-xs font-bold text-[#292929]">
          {elapsed.toFixed(1)}s
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        <div className="flex items-center gap-3">
          <span className="w-20 text-[11px] font-semibold text-[#292929]">
            Unghi θ
          </span>
          <input
            type="range"
            min={-70}
            max={70}
            value={theta0Deg}
            onChange={(e) => setTheta0Deg(+e.target.value)}
            disabled={running}
            className="h-1.5 flex-1 cursor-pointer accent-[#292929]"
          />
          <span className="w-12 text-right text-[11px] font-bold text-[#292929]">
            {theta0Deg}°
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20 text-[11px] font-semibold text-[#292929]">
            Lungime
          </span>
          <input
            type="range"
            min={50}
            max={200}
            value={length * 100}
            onChange={(e) => setLength(+e.target.value / 100)}
            disabled={running}
            className="h-1.5 flex-1 cursor-pointer accent-[#292929]"
          />
          <span className="w-12 text-right text-[11px] font-bold text-[#292929]">
            {length.toFixed(1)}m
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20 text-[11px] font-semibold text-[#292929]">
            Gravitație
          </span>
          <input
            type="range"
            min={300}
            max={1800}
            value={gravity * 100}
            onChange={(e) => setGravity(+e.target.value / 100)}
            disabled={running}
            className="h-1.5 flex-1 cursor-pointer accent-[#292929]"
          />
          <span className="w-12 text-right text-[11px] font-bold text-[#292929]">
            {gravity.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={running ? stop : start}
              className="rounded-full bg-[#292929] px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#111111]"
            >
              {running ? "Oprește" : "Pornește"}
            </button>
            <button
              type="button"
              onClick={resetSim}
              className="rounded-full border border-[#e0dce8] px-4 py-1.5 text-[11px] font-semibold text-[#292929] transition-colors hover:bg-[#f5f3fa]"
            >
              Reset
            </button>
          </div>
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-[10px] font-medium text-[#666]">
            <input
              type="checkbox"
              checked={showTrail}
              onChange={(e) => setShowTrail(e.target.checked)}
              className="accent-[#292929]"
            />
            Urmă
          </label>
        </div>
      </div>
    </div>
  )
}
