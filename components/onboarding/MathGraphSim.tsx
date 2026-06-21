"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const MAX_X = 8
const MAX_Y = 6
const MAX_POINTS = 6
const DARK = "#292929"
const ACCENT = "#8043f0"

type GraphPoint = { id: number; x: number; y: number }
type GraphCoord = { x: number; y: number }
type CurveControls = Record<string, GraphCoord>

type GraphLayout = {
  w: number
  h: number
  scale: number
  maxX: number
  maxY: number
  ox: number
  oy: number
}

type DragState =
  | { kind: "point"; id: number; pointerId: number }
  | { kind: "curve"; key: string; pointerId: number }

function createGraphLayout(isMobile: boolean): GraphLayout {
  const scale = isMobile ? 38 : 28
  const w = isMobile ? 400 : 520
  const h = isMobile ? 400 : 260
  const padLeft = isMobile ? 26 : 22
  const padRight = isMobile ? 22 : 18
  const padTop = isMobile ? 22 : 14
  const padBottom = isMobile ? 30 : 24
  const plotW = MAX_X * scale
  const plotH = MAX_Y * scale
  const contentW = padLeft + plotW + padRight
  const contentH = padTop + plotH + padBottom

  return {
    w,
    h,
    scale,
    maxX: MAX_X,
    maxY: MAX_Y,
    ox: (w - contentW) / 2 + padLeft,
    oy: (h - contentH) / 2 + padTop + plotH,
  }
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

function toSvg(p: GraphCoord, layout: GraphLayout) {
  return { sx: layout.ox + p.x * layout.scale, sy: layout.oy - p.y * layout.scale }
}

function roundCoord(value: number) {
  return Math.round(value * 10) / 10
}

function clampCoord(value: number, max: number) {
  return roundCoord(Math.min(max, Math.max(0, value)))
}

function segmentKey(fromId: number, toId: number) {
  return `${fromId}-${toId}`
}

function midpoint(a: GraphCoord, b: GraphCoord): GraphCoord {
  return {
    x: roundCoord((a.x + b.x) / 2),
    y: roundCoord((a.y + b.y) / 2),
  }
}

function clientToGraph(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
  layout: GraphLayout,
): GraphCoord | null {
  const rect = svg.getBoundingClientRect()
  const scaleX = layout.w / rect.width
  const scaleY = layout.h / rect.height
  const svgX = (clientX - rect.left) * scaleX
  const svgY = (clientY - rect.top) * scaleY

  const rawX = (svgX - layout.ox) / layout.scale
  const rawY = (layout.oy - svgY) / layout.scale
  if (rawX < 0 || rawY < 0 || rawX > layout.maxX || rawY > layout.maxY) return null

  return { x: clampCoord(rawX, layout.maxX), y: clampCoord(rawY, layout.maxY) }
}

function buildSegmentPath(
  from: GraphPoint,
  to: GraphPoint,
  control: GraphCoord,
  layout: GraphLayout,
) {
  const start = toSvg(from, layout)
  const end = toSvg(to, layout)
  const ctrl = toSvg(control, layout)
  return `M${start.sx},${start.sy} Q${ctrl.sx},${ctrl.sy} ${end.sx},${end.sy}`
}

export function MathGraphSim() {
  const isMobile = useIsMobile()
  const layout = useMemo(() => createGraphLayout(isMobile), [isMobile])
  const svgRef = useRef<SVGSVGElement>(null)
  const nextId = useRef(0)
  const dragRef = useRef<DragState | null>(null)
  const [points, setPoints] = useState<GraphPoint[]>([])
  const [curves, setCurves] = useState<CurveControls>({})
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)

  const pointR = isMobile ? 7 : 5
  const handleR = isMobile ? 6 : 4.5

  const sortedPoints = useMemo(
    () => [...points].sort((a, b) => a.x - b.x || a.y - b.y),
    [points],
  )

  const segments = useMemo(() => {
    const result: {
      key: string
      from: GraphPoint
      to: GraphPoint
      control: GraphCoord
      path: string
    }[] = []

    for (let i = 1; i < sortedPoints.length; i++) {
      const from = sortedPoints[i - 1]
      const to = sortedPoints[i]
      const key = segmentKey(from.id, to.id)
      const control = curves[key] ?? midpoint(from, to)
      result.push({
        key,
        from,
        to,
        control,
        path: buildSegmentPath(from, to, control, layout),
      })
    }

    return result
  }, [curves, layout, sortedPoints])

  const addPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (points.length >= MAX_POINTS || dragRef.current) return
      const svg = svgRef.current
      if (!svg) return

      const coord = clientToGraph(svg, clientX, clientY, layout)
      if (!coord) return

      setPoints((prev) => {
        const duplicate = prev.some((p) => p.x === coord.x && p.y === coord.y)
        if (duplicate) return prev
        return [...prev, { id: nextId.current++, ...coord }]
      })
    },
    [layout, points.length],
  )

  const updatePointPosition = useCallback(
    (id: number, clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return

      const coord = clientToGraph(svg, clientX, clientY, layout)
      if (!coord) return

      setPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, x: coord.x, y: coord.y } : p)),
      )
    },
    [layout],
  )

  const updateCurveControl = useCallback(
    (key: string, clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return

      const coord = clientToGraph(svg, clientX, clientY, layout)
      if (!coord) return

      setCurves((prev) => ({ ...prev, [key]: coord }))
    },
    [layout],
  )

  const handleSvgPointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (dragRef.current) return
      if ((event.target as Element).closest("[data-graph-point], [data-curve-handle], [data-curve-segment]")) {
        return
      }
      addPoint(event.clientX, event.clientY)
    },
    [addPoint],
  )

  const handleSvgPointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return

      if (drag.kind === "point") {
        updatePointPosition(drag.id, event.clientX, event.clientY)
      } else {
        updateCurveControl(drag.key, event.clientX, event.clientY)
      }
    },
    [updateCurveControl, updatePointPosition],
  )

  const endDrag = useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    dragRef.current = null
    setDraggingId(null)
    svgRef.current?.releasePointerCapture(event.pointerId)
  }, [])

  const startPointDrag = useCallback((event: React.PointerEvent, id: number) => {
    event.stopPropagation()
    svgRef.current?.setPointerCapture(event.pointerId)
    dragRef.current = { kind: "point", id, pointerId: event.pointerId }
    setDraggingId(id)
  }, [])

  const startCurveDrag = useCallback(
    (event: React.PointerEvent, key: string) => {
      event.stopPropagation()
      svgRef.current?.setPointerCapture(event.pointerId)
      dragRef.current = { kind: "curve", key, pointerId: event.pointerId }
      updateCurveControl(key, event.clientX, event.clientY)
    },
    [updateCurveControl],
  )

  const handleUndo = useCallback(() => {
    setPoints((prev) => {
      if (prev.length === 0) return prev
      const removed = prev[prev.length - 1]
      setCurves((curvePrev) => {
        const next = { ...curvePrev }
        for (const key of Object.keys(next)) {
          if (key.includes(String(removed.id))) delete next[key]
        }
        return next
      })
      return prev.slice(0, -1)
    })
  }, [])

  const handleReset = useCallback(() => {
    setPoints([])
    setCurves({})
    setHoveredId(null)
    setHoveredSegment(null)
    setDraggingId(null)
    dragRef.current = null
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.w} ${layout.h}`}
        className="h-full min-h-0 w-full flex-1 touch-none select-none rounded-lg border border-[#ebeaf3] bg-[#fafafa] sm:h-auto sm:flex-none"
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {Array.from({ length: layout.maxY + 1 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1={layout.ox}
            y1={layout.oy - i * layout.scale}
            x2={layout.ox + layout.maxX * layout.scale}
            y2={layout.oy - i * layout.scale}
            stroke="#e8e8ec"
            strokeWidth={0.8}
          />
        ))}
        {Array.from({ length: layout.maxX + 1 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={layout.ox + i * layout.scale}
            y1={layout.oy}
            x2={layout.ox + i * layout.scale}
            y2={layout.oy - layout.maxY * layout.scale}
            stroke="#e8e8ec"
            strokeWidth={0.8}
          />
        ))}

        <line
          x1={layout.ox}
          y1={layout.oy}
          x2={layout.ox + layout.maxX * layout.scale}
          y2={layout.oy}
          stroke={DARK}
          strokeWidth={1.5}
        />
        <line
          x1={layout.ox}
          y1={layout.oy}
          x2={layout.ox}
          y2={layout.oy - layout.maxY * layout.scale}
          stroke={DARK}
          strokeWidth={1.5}
        />

        {Array.from({ length: layout.maxX + 1 }, (_, i) => (
          <text
            key={`xl-${i}`}
            x={layout.ox + i * layout.scale}
            y={layout.oy + 16}
            textAnchor="middle"
            className="fill-[#999] text-[9px] font-medium sm:text-[9px]"
            style={{ fontSize: isMobile ? 11 : 9 }}
          >
            {i}
          </text>
        ))}
        {Array.from({ length: layout.maxY + 1 }, (_, i) => (
          <text
            key={`yl-${i}`}
            x={layout.ox - 10}
            y={layout.oy - i * layout.scale + 3}
            textAnchor="end"
            className="fill-[#999] font-medium"
            style={{ fontSize: isMobile ? 11 : 9 }}
          >
            {i}
          </text>
        ))}

        <text
          x={layout.ox + layout.maxX * layout.scale + 8}
          y={layout.oy + 4}
          className="fill-[#666] font-semibold"
          style={{ fontSize: isMobile ? 12 : 10 }}
        >
          x
        </text>
        <text
          x={layout.ox - 6}
          y={layout.oy - layout.maxY * layout.scale - 6}
          className="fill-[#666] font-semibold"
          style={{ fontSize: isMobile ? 12 : 10 }}
        >
          y
        </text>

        {segments.map(({ key, path, control }) => {
          const isHovered = hoveredSegment === key
          const ctrlSvg = toSvg(control, layout)

          return (
            <g key={key}>
              <path
                data-curve-segment
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={isMobile ? 22 : 16}
                className="cursor-grab active:cursor-grabbing"
                onPointerEnter={() => setHoveredSegment(key)}
                onPointerLeave={() => setHoveredSegment((prev) => (prev === key ? null : prev))}
                onPointerDown={(event) => startCurveDrag(event, key)}
              />
              <path
                d={path}
                fill="none"
                stroke={ACCENT}
                strokeWidth={isMobile ? 3 : 2.5}
                strokeLinecap="round"
                opacity={isHovered ? 0.95 : 0.75}
                pointerEvents="none"
              />
              <g data-curve-handle>
                <circle
                  cx={ctrlSvg.sx}
                  cy={ctrlSvg.sy}
                  r={handleR + 5}
                  fill="transparent"
                  className="cursor-grab active:cursor-grabbing"
                  onPointerEnter={() => setHoveredSegment(key)}
                  onPointerLeave={() => setHoveredSegment((prev) => (prev === key ? null : prev))}
                  onPointerDown={(event) => startCurveDrag(event, key)}
                />
                <circle
                  cx={ctrlSvg.sx}
                  cy={ctrlSvg.sy}
                  r={handleR}
                  fill={isHovered ? ACCENT : "#ffffff"}
                  stroke={ACCENT}
                  strokeWidth={1.5}
                  pointerEvents="none"
                />
              </g>
            </g>
          )
        })}

        {sortedPoints.map((p) => {
          const { sx, sy } = toSvg(p, layout)
          const isHovered = hoveredId === p.id
          const isDragging = draggingId === p.id

          return (
            <g
              key={p.id}
              data-graph-point
              onPointerEnter={() => setHoveredId(p.id)}
              onPointerLeave={() => setHoveredId(null)}
            >
              <circle
                cx={sx}
                cy={sy}
                r={pointR + 6}
                fill="transparent"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(event) => startPointDrag(event, p.id)}
              />
              <circle
                cx={sx}
                cy={sy}
                r={pointR}
                fill={isDragging || isHovered ? ACCENT : DARK}
                stroke={isDragging ? "#ffffff" : "none"}
                strokeWidth={2}
                pointerEvents="none"
              />
              {!isMobile ? (
                <text
                  x={sx + 10}
                  y={sy - 8}
                  className="fill-[#666] text-[9px] font-semibold"
                  pointerEvents="none"
                >
                  ({p.x}, {p.y})
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>

      <p className="mt-2 hidden text-[10px] text-[#999] sm:block">
        Apasă pentru puncte · Trage punctele · Trage liniile sau handle-urile pentru curbe (
        {points.length}/{MAX_POINTS})
      </p>

      <div className="mt-2 hidden flex-wrap gap-2 sm:flex">
        <button
          type="button"
          onClick={handleUndo}
          disabled={points.length === 0}
          className="rounded-full border border-[#e0dce8] px-4 py-1.5 text-[11px] font-semibold text-[#292929] transition-colors hover:bg-[#f5f3fa] disabled:opacity-40"
        >
          Anulează ultimul
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={points.length === 0}
          className="rounded-full border border-[#e0dce8] px-4 py-1.5 text-[11px] font-semibold text-[#292929] transition-colors hover:bg-[#f5f3fa] disabled:opacity-40"
        >
          Resetează
        </button>
      </div>
    </div>
  )
}
